/**
 * Sales Meet Processor Lambda
 *
 * Körs var 30:e minut. Bevakar Mikaels Google Drive efter nya
 * Google Meet-transkript → Claude sammanfattar → genererar:
 *   - Uppföljningsmail redo att skicka
 *   - Pipeline-notering i BigQuery
 *   - Trello-uppgifter för nästa steg
 *
 * Google Meet sparar transkript automatiskt i Drive under
 * "Meet Recordings" om transkription är aktiverad i Meet-inställningar.
 *
 * Kräver SSM-parametrar:
 *   /seo-mcp/google/calendar-credentials  — OAuth2 med Drive + Calendar scope
 */

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { BigQuery } = require('@google-cloud/bigquery');
const { google } = require('googleapis');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const fs = require('fs');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });
const ses = new SESClient({ region: REGION });

// ── Helpers ──

async function getParam(name) {
  const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return res.Parameter.Value;
}

async function getBigQuery() {
  const creds = await getParam('/seo-mcp/bigquery/credentials');
  const projectId = await getParam('/seo-mcp/bigquery/project-id');
  const dataset = await getParam('/seo-mcp/bigquery/dataset');
  fs.writeFileSync('/tmp/bq-creds.json', creds);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/bq-creds.json';
  return { bq: new BigQuery({ projectId }), dataset };
}

async function getDriveAuth() {
  const raw = await getParam('/seo-mcp/google/calendar-credentials');
  const creds = JSON.parse(raw);
  const oauth2 = new google.auth.OAuth2(
    creds.client_id,
    creds.client_secret,
    'urn:ietf:wg:oauth:2.0:oob'
  );
  oauth2.setCredentials({ refresh_token: creds.refresh_token });
  return oauth2;
}

// ── BigQuery: processed-tabell ──

async function ensureProcessedTable(bq, dataset) {
  try {
    await bq.dataset(dataset).table('meet_transcripts_processed').get();
  } catch (e) {
    if (e.code === 404) {
      await bq.query({
        query: `CREATE TABLE \`${dataset}.meet_transcripts_processed\` (
          file_id STRING,
          file_name STRING,
          meeting_title STRING,
          customer_id STRING,
          processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
          followup_email_sent BOOL,
          trello_card_id STRING,
          summary STRING
        )`
      });
    }
  }
}

async function isAlreadyProcessed(bq, dataset, fileId) {
  const [rows] = await bq.query({
    query: `SELECT file_id FROM \`${dataset}.meet_transcripts_processed\` WHERE file_id = @id LIMIT 1`,
    params: { id: fileId }
  });
  return rows.length > 0;
}

async function markProcessed(bq, dataset, fileId, fileName, meetingTitle, customerId, summary, trelloCardId) {
  await bq.query({
    query: `INSERT INTO \`${dataset}.meet_transcripts_processed\`
            (file_id, file_name, meeting_title, customer_id, followup_email_sent, trello_card_id, summary)
            VALUES (@fid, @fname, @mtitle, @cid, true, @tcard, @summary)`,
    params: {
      fid: fileId,
      fname: fileName,
      mtitle: meetingTitle || '',
      cid: customerId || '',
      tcard: trelloCardId || '',
      summary: summary || ''
    }
  });
}

// ── Hämta nya transkript från Drive ──

async function getNewTranscripts(auth) {
  const drive = google.drive({ version: 'v3', auth });

  // Sök efter .vtt eller .txt-filer i "Meet Recordings"-mappen skapade senaste timmen
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const res = await drive.files.list({
    q: `(mimeType='text/plain' or mimeType='application/vnd.google-apps.document' or name contains 'transcript' or name contains 'Transcript') and createdTime > '${oneHourAgo}'`,
    fields: 'files(id, name, createdTime, parents, mimeType)',
    orderBy: 'createdTime desc',
    pageSize: 10
  });

  return res.data.files || [];
}

// ── Läs innehåll från Drive-fil ──

async function readDriveFile(auth, file) {
  const drive = google.drive({ version: 'v3', auth });

  try {
    if (file.mimeType === 'application/vnd.google-apps.document') {
      // Google Doc — exportera som plain text
      const res = await drive.files.export({
        fileId: file.id,
        mimeType: 'text/plain'
      }, { responseType: 'text' });
      return res.data;
    } else {
      // Vanlig textfil
      const res = await drive.files.get({
        fileId: file.id,
        alt: 'media'
      }, { responseType: 'text' });
      return res.data;
    }
  } catch (e) {
    console.log(`  Kunde inte läsa ${file.name}: ${e.message}`);
    return null;
  }
}

// ── Matcha transkript mot kund ──

async function matchTranscriptToCustomer(bq, dataset, fileName, content) {
  try {
    const [customers] = await bq.query({
      query: `SELECT customer_id, company_name, stage, monthly_budget
              FROM \`${dataset}.customer_pipeline\`
              WHERE stage NOT IN ('churned','lost') LIMIT 100`
    });

    const searchText = (fileName + ' ' + content.substring(0, 2000)).toLowerCase();

    for (const c of customers) {
      const name = (c.company_name || '').toLowerCase();
      if (name.length > 3 && searchText.includes(name)) return c;
    }
  } catch (e) {}
  return null;
}

// ── Claude: analysera transkript ──

async function analyzeTranscript(claude, content, fileName, customer) {
  const customerCtx = customer
    ? `Kund i systemet: ${customer.company_name} (${customer.stage}, ${customer.monthly_budget || '?'} kr/mån)`
    : '(ingen kund matchad — okänt möte)';

  // Trimma för att hålla tokens rimliga
  const trimmed = content.length > 8000 ? content.substring(0, 8000) + '\n...[trunkerat]' : content;

  const prompt = `Du är säljassistent åt Mikael Larsson på Searchboost (SEO-byrå i Jönköping).
Analysera detta mötestransskript och generera tre saker på svenska.

MÖTE: ${fileName}
${customerCtx}

TRANSKRIPT:
${trimmed}

Generera exakt detta JSON-format:
{
  "meeting_summary": "3-5 meningar som sammanfattar vad som diskuterades",
  "decisions": ["beslut 1", "beslut 2"],
  "action_items": [
    {"owner": "Mikael/Kund", "task": "uppgift", "deadline": "nästa vecka/ASAP/etc"}
  ],
  "followup_email": {
    "subject": "Ämnesrad",
    "body": "Komplett mailtext på svenska, professionell men personlig ton. Inkludera: tack för mötet, sammanfattning av vad vi kom överens om, nästa steg med deadlines. Signatur: Mikael Larsson, Searchboost"
  },
  "trello_checklist": ["uppgift 1", "uppgift 2", "uppgift 3"],
  "pipeline_note": "En mening om mötets utfall för CRM-anteckning"
}`;

  const res = await claude.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = res.content[0].text;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Claude returnerade inte giltig JSON');
  return JSON.parse(match[0]);
}

// ── Skapa Trello-kort ──

async function createTrelloCard(analysis, customer, meetingName) {
  try {
    const trelloKey = await getParam('/seo-mcp/trello/api-key');
    const trelloToken = await getParam('/seo-mcp/trello/token');
    const boardId = await getParam('/seo-mcp/trello/board-id');

    // Hämta "IN PROGRESS"-listan
    const listsRes = await axios.get(`https://api.trello.com/1/boards/${boardId}/lists`, {
      params: { key: trelloKey, token: trelloToken }
    });
    const lists = listsRes.data;
    const targetList = lists.find(l => l.name === 'IN PROGRESS') || lists.find(l => l.name === 'TO DO') || lists[0];

    const cardName = `Uppföljning: ${customer?.company_name || meetingName}`;
    const desc = [
      `**Möte:** ${meetingName}`,
      `**Sammanfattning:** ${analysis.meeting_summary}`,
      '',
      '**Beslut:**',
      ...(analysis.decisions || []).map(d => `- ${d}`),
      '',
      '**Nästa steg:**',
      ...(analysis.action_items || []).map(a => `- [${a.owner}] ${a.task} (${a.deadline})`)
    ].join('\n');

    const cardRes = await axios.post('https://api.trello.com/1/cards', null, {
      params: {
        key: trelloKey,
        token: trelloToken,
        idList: targetList.id,
        name: cardName,
        desc,
        due: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // 2 dagar
      }
    });

    const cardId = cardRes.data.id;

    // Lägg till checklista
    if (analysis.trello_checklist?.length > 0) {
      const checklistRes = await axios.post('https://api.trello.com/1/checklists', null, {
        params: { key: trelloKey, token: trelloToken, idCard: cardId, name: 'Att göra' }
      });
      const checklistId = checklistRes.data.id;
      for (const item of analysis.trello_checklist) {
        await axios.post(`https://api.trello.com/1/checklists/${checklistId}/checkItems`, null, {
          params: { key: trelloKey, token: trelloToken, name: item }
        });
      }
    }

    console.log(`  Trello-kort skapat: ${cardName} (${cardId})`);
    return cardId;
  } catch (e) {
    console.log(`  Trello-fel: ${e.message}`);
    return null;
  }
}

// ── Skicka uppföljningsmail ──

async function sendFollowupMail(recipientEmail, analysis, customer) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="background:#0d0d1a;color:#e0e0e0;font-family:Arial,sans-serif;padding:24px;max-width:640px;margin:0 auto">
      <div style="color:#e91e8c;font-size:13px;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px">Searchboost Opti — Mötesbrevlåda</div>
      <h2 style="color:#fff;margin:0 0 16px 0">Uppföljningsmail redo att skicka</h2>
      ${customer ? `<div style="background:#1a1a2e;padding:12px;border-radius:6px;margin-bottom:16px;color:#aaa;font-size:14px">Kund: <strong style="color:#fff">${customer.company_name}</strong> · ${customer.stage}</div>` : ''}

      <div style="background:#1a1a2e;padding:20px;border-radius:8px;margin-bottom:24px">
        <div style="color:#888;font-size:12px;margin-bottom:8px">SAMMANFATTNING</div>
        <div style="color:#e0e0e0">${analysis.meeting_summary}</div>
      </div>

      <div style="background:#1a1a2e;padding:20px;border-radius:8px;margin-bottom:24px">
        <div style="color:#888;font-size:12px;margin-bottom:12px">FÖRBERETT UPPFÖLJNINGSMAIL</div>
        <div style="color:#aaa;font-size:13px;margin-bottom:8px">Ämne: <strong style="color:#fff">${analysis.followup_email?.subject}</strong></div>
        <div style="background:#0d0d1a;padding:16px;border-radius:6px;white-space:pre-wrap;font-size:14px;color:#e0e0e0;line-height:1.6">${analysis.followup_email?.body}</div>
      </div>

      <div style="background:#1a1a2e;padding:20px;border-radius:8px">
        <div style="color:#888;font-size:12px;margin-bottom:12px">NÄSTA STEG</div>
        ${(analysis.action_items || []).map(a =>
          `<div style="padding:8px 0;border-bottom:1px solid #333;color:#e0e0e0">
            <span style="color:#e91e8c;font-size:12px">${a.owner}</span> · ${a.task} <span style="color:#888">(${a.deadline})</span>
          </div>`
        ).join('')}
      </div>

      <div style="margin-top:16px;color:#666;font-size:12px">Trello-kort + pipeline-notering har skapats automatiskt.</div>
    </body>
    </html>
  `;

  await ses.send(new SendEmailCommand({
    Source: 'noreply@searchboost.se',
    Destination: { ToAddresses: [recipientEmail] },
    Message: {
      Subject: { Data: `Mötesbrev: ${analysis.followup_email?.subject || 'Uppföljning'}`, Charset: 'UTF-8' },
      Body: { Html: { Data: html, Charset: 'UTF-8' } }
    }
  }));
}

// ── Main Handler ──

exports.handler = async (event) => {
  console.log('=== Sales Meet Processor Started ===');

  try {
    const { bq, dataset } = await getBigQuery();
    await ensureProcessedTable(bq, dataset);

    const apiKey = await getParam('/seo-mcp/anthropic/api-key');
    const claude = new Anthropic({ apiKey });
    const recipientEmail = await getParam('/seo-mcp/email/recipients');

    // Hämta auth
    let auth;
    try {
      auth = await getDriveAuth();
    } catch (e) {
      console.log(`Drive-auth saknas: ${e.message}`);
      console.log('Kör setup-google-oauth.sh för att konfigurera OAuth2-credentials.');
      return { statusCode: 200, body: JSON.stringify({ skipped: 'no_auth', message: 'Kör setup-google-oauth.sh' }) };
    }

    // Hämta nya transkript
    const files = await getNewTranscripts(auth);
    console.log(`Hittade ${files.length} nya filer att kontrollera`);

    let processed = 0;

    for (const file of files) {
      if (await isAlreadyProcessed(bq, dataset, file.id)) {
        console.log(`  Redan behandlad: ${file.name}`);
        continue;
      }

      console.log(`  Behandlar: ${file.name}`);

      const content = await readDriveFile(auth, file);
      if (!content || content.length < 100) {
        console.log(`  För kort innehåll — hoppar över`);
        continue;
      }

      const customer = await matchTranscriptToCustomer(bq, dataset, file.name, content);
      console.log(`  Kund: ${customer?.company_name || '(okänd)'}`);

      const analysis = await analyzeTranscript(claude, content, file.name, customer);

      // Trello-kort
      const trelloCardId = await createTrelloCard(analysis, customer, file.name);

      // Pipeline-notering i BigQuery
      if (customer) {
        try {
          await bq.query({
            query: `INSERT INTO \`${dataset}.seo_optimization_log\`
                    (id, customer_id, task_type, optimization_result, created_at)
                    VALUES (@id, @cid, 'meeting_note', @note, CURRENT_TIMESTAMP())`,
            params: {
              id: `meet_${Date.now()}_${customer.customer_id}`,
              cid: customer.customer_id,
              note: analysis.pipeline_note || analysis.meeting_summary
            }
          });
        } catch (e) { /* tabellstruktur kan skilja */ }
      }

      // Skicka uppföljningsmail
      await sendFollowupMail(recipientEmail, analysis, customer);

      // Markera som behandlad
      await markProcessed(bq, dataset, file.id, file.name, file.name, customer?.customer_id, analysis.meeting_summary, trelloCardId);

      processed++;
      console.log(`  Klar: ${file.name}`);
    }

    console.log(`=== Meet Processor klar: ${processed} transkript behandlade ===`);
    return { statusCode: 200, body: JSON.stringify({ processed, total: files.length }) };

  } catch (err) {
    console.error('Sales Meet Processor failed:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
