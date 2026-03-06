/**
 * Sales Morning Briefing Lambda
 *
 * Körs varje vardag kl 07:00 CET.
 * Läser Mikaels Google Kalender → matchar möten mot kunder i BigQuery
 * → Claude genererar briefing per möte → skickar mail via SES.
 *
 * Kräver SSM-parametrar:
 *   /seo-mcp/google/calendar-credentials   — OAuth2 refresh_token + client_id + client_secret
 *   /seo-mcp/google/calendar-id            — t.ex. mikael.searchboost@gmail.com
 */

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { BigQuery } = require('@google-cloud/bigquery');
const { google } = require('googleapis');
const Anthropic = require('@anthropic-ai/sdk');
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

async function getCalendarAuth() {
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

// ── Hämta dagens möten från Google Kalender ──

async function getTodaysMeetings(auth, calendarId) {
  const calendar = google.calendar({ version: 'v3', auth });

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const res = await calendar.events.list({
    calendarId,
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 20
  });

  const events = res.data.items || [];

  return events
    .filter(e => e.status !== 'cancelled')
    .filter(e => {
      // Filtrera bort heldag-events utan tid
      return e.start?.dateTime != null;
    })
    .map(e => ({
      id: e.id,
      title: e.summary || '(inget namn)',
      start: e.start.dateTime,
      end: e.end?.dateTime,
      attendees: (e.attendees || []).map(a => a.email).filter(a => a !== calendarId),
      description: e.description || '',
      meetLink: e.hangoutLink || (e.conferenceData?.entryPoints?.[0]?.uri) || null,
      location: e.location || ''
    }));
}

// ── Matcha möte mot kund i BigQuery ──

async function matchMeetingToCustomer(bq, dataset, meeting) {
  const title = meeting.title.toLowerCase();
  const attendeeEmails = meeting.attendees.join(' ').toLowerCase();

  try {
    // Hämta alla kunder med företagsnamn + kontaktemail
    const [rows] = await bq.query({
      query: `
        SELECT
          p.customer_id,
          p.company_name,
          p.stage,
          p.monthly_budget,
          i.contact_email,
          i.contact_person
        FROM \`${dataset}.customer_pipeline\` p
        LEFT JOIN (
          SELECT customer_id,
            MAX(IF(param_key='contact-email', param_value, NULL)) as contact_email,
            MAX(IF(param_key='contact-person', param_value, NULL)) as contact_person
          FROM \`${dataset}.ssm_params_cache\`
          GROUP BY customer_id
        ) i ON p.customer_id = i.customer_id
        WHERE p.stage NOT IN ('churned', 'lost')
        LIMIT 100
      `
    }).catch(() => [[]]);

    // Enkel matchning: företagsnamn i mötestitel eller kontaktemail bland deltagare
    for (const row of rows) {
      const name = (row.company_name || '').toLowerCase();
      const email = (row.contact_email || '').toLowerCase();
      const domain = email.split('@')[1] || '';

      if (name && title.includes(name)) return row;
      if (domain && attendeeEmails.includes(domain)) return row;
    }
  } catch (e) {
    // ssm_params_cache kanske inte finns — försök enklare query
    try {
      const [rows] = await bq.query({
        query: `SELECT customer_id, company_name, stage, monthly_budget FROM \`${dataset}.customer_pipeline\` WHERE stage NOT IN ('churned','lost') LIMIT 100`
      });
      for (const row of rows) {
        const name = (row.company_name || '').toLowerCase();
        if (name && title.includes(name)) return row;
      }
    } catch (e2) {}
  }

  return null;
}

// ── Hämta kunddata för briefing ──

async function getCustomerData(bq, dataset, customerId) {
  const data = {};

  try {
    // Senaste optimeringar
    const [opts] = await bq.query({
      query: `
        SELECT task_type, target_url, optimization_result, created_at
        FROM \`${dataset}.seo_optimization_log\`
        WHERE customer_id = @cid
        ORDER BY created_at DESC
        LIMIT 5
      `,
      params: { cid: customerId }
    });
    data.recentOptimizations = opts;
  } catch (e) { data.recentOptimizations = []; }

  try {
    // GSC-positioner (topp 5 sökord)
    const [rankings] = await bq.query({
      query: `
        SELECT query, clicks, impressions, position
        FROM \`${dataset}.gsc_daily_metrics\`
        WHERE customer_id = @cid
          AND date = (SELECT MAX(date) FROM \`${dataset}.gsc_daily_metrics\` WHERE customer_id = @cid)
        ORDER BY clicks DESC
        LIMIT 5
      `,
      params: { cid: customerId }
    });
    data.rankings = rankings;
  } catch (e) { data.rankings = []; }

  try {
    // Väntande arbetsuppgifter
    const [queue] = await bq.query({
      query: `
        SELECT task_type, target_url, priority
        FROM \`${dataset}.seo_work_queue\`
        WHERE customer_id = @cid AND status = 'pending'
        ORDER BY priority DESC
        LIMIT 5
      `,
      params: { cid: customerId }
    });
    data.pendingTasks = queue;
  } catch (e) { data.pendingTasks = []; }

  try {
    // Pipeline-info
    const [pipe] = await bq.query({
      query: `
        SELECT stage, monthly_budget, contract_start, contract_end
        FROM \`${dataset}.customer_pipeline\`
        WHERE customer_id = @cid
        LIMIT 1
      `,
      params: { cid: customerId }
    });
    data.pipeline = pipe[0] || null;
  } catch (e) { data.pipeline = null; }

  return data;
}

// ── Claude: generera briefing per möte ──

async function generateBriefing(claude, meeting, customer, customerData) {
  const hasCustomer = !!customer;

  const customerContext = hasCustomer ? `
KUND I SYSTEMET: ${customer.company_name}
Pipeline-stadie: ${customer.stage}
Budget: ${customer.monthly_budget ? customer.monthly_budget + ' kr/mån' : 'okänd'}

Senaste optimeringar (${customerData.recentOptimizations.length} st):
${customerData.recentOptimizations.map(o => `- ${o.task_type} på ${o.target_url}`).join('\n') || '(inga)'}

Topp GSC-sökord:
${customerData.rankings.map(r => `- "${r.query}": pos ${r.position?.toFixed(1)}, ${r.clicks} klick`).join('\n') || '(ingen data)'}

Väntande uppgifter i kön: ${customerData.pendingTasks.length} st
` : '(mötet matchar ingen kund i systemet — okänt möte/prospektmöte)';

  const prompt = `Du är säljassistent åt Mikael Larsson på Searchboost (SEO-byrå). 
Generera en kort mötesförberedelse på svenska. Var konkret och direkt — inga floskler.

MÖTE: ${meeting.title}
TID: ${new Date(meeting.start).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
DELTAGARE: ${meeting.attendees.join(', ') || 'inga externa'}
BESKRIVNING: ${meeting.description || '(ingen)'}

${customerContext}

Generera:
1. SYFTE (1 mening — vad är målet med mötet?)
2. NÄMN DETTA (3 konkreta punkter Mikael kan ta upp — baserat på kunddata om det finns)
3. FRÅGOR ATT STÄLLA (2-3 frågor)
4. NÄSTA STEG EFTER MÖTET (1-2 förslag)

Max 200 ord totalt. Inga rubriker med #, använd fetstil med **.`;

  const res = await claude.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }]
  });

  return res.content[0].text;
}

// ── Bygg HTML-mail ──

function buildEmailHtml(meetings, briefings, dateStr) {
  const rows = meetings.map((m, i) => {
    const start = new Date(m.start).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
    const end = m.end ? new Date(m.end).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) : '';
    const briefing = briefings[i] || '(ingen briefing genererad)';
    const briefingHtml = briefing
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    const meetLink = m.meetLink
      ? `<a href="${m.meetLink}" style="color:#e91e8c">Öppna Meet</a>`
      : '';

    return `
      <div style="margin-bottom:32px;padding:20px;background:#1a1a2e;border-radius:8px;border-left:4px solid #e91e8c">
        <div style="font-size:18px;font-weight:bold;color:#fff;margin-bottom:4px">${m.title}</div>
        <div style="color:#aaa;font-size:14px;margin-bottom:12px">${start}${end ? '–' + end : ''} ${meetLink}</div>
        <div style="color:#e0e0e0;font-size:15px;line-height:1.6">${briefingHtml}</div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <body style="background:#0d0d1a;color:#e0e0e0;font-family:Arial,sans-serif;padding:24px;max-width:640px;margin:0 auto">
      <div style="margin-bottom:24px">
        <div style="color:#e91e8c;font-size:13px;text-transform:uppercase;letter-spacing:2px">Searchboost Opti</div>
        <h1 style="color:#fff;margin:4px 0 0 0;font-size:24px">Morgon-briefing ${dateStr}</h1>
        <div style="color:#888;font-size:14px">${meetings.length} möte${meetings.length !== 1 ? 'n' : ''} idag</div>
      </div>
      ${rows || '<p style="color:#888">Inga möten idag.</p>'}
      <div style="border-top:1px solid #333;margin-top:24px;padding-top:16px;color:#666;font-size:12px">
        Searchboost Opti · <a href="http://51.21.116.7" style="color:#666">Dashboard</a>
      </div>
    </body>
    </html>
  `;
}

// ── Main Handler ──

exports.handler = async (event) => {
  console.log('=== Sales Morning Briefing Started ===');

  // Kör bara på vardagar (mån–fre) om inte force=true
  const dayOfWeek = new Date().getDay(); // 0=sön, 6=lör
  if (!event?.force && (dayOfWeek === 0 || dayOfWeek === 6)) {
    console.log('Helgdag — hoppar över');
    return { statusCode: 200, body: JSON.stringify({ skipped: 'weekend' }) };
  }

  try {
    const { bq, dataset } = await getBigQuery();
    const apiKey = await getParam('/seo-mcp/anthropic/api-key');
    const claude = new Anthropic({ apiKey });
    const recipientEmail = await getParam('/seo-mcp/email/recipients');

    // Kalender
    const calendarId = 'mikael.searchboost@gmail.com';
    let meetings = [];
    try {
      const auth = await getCalendarAuth();
      meetings = await getTodaysMeetings(auth, calendarId);
      console.log(`Hittade ${meetings.length} möten idag`);
    } catch (e) {
      console.log(`Kalender-fel: ${e.message} — kör utan mötesdata`);
    }

    const dateStr = new Date().toLocaleDateString('sv-SE', {
      weekday: 'long', day: 'numeric', month: 'long'
    });

    const briefings = [];

    for (const meeting of meetings) {
      console.log(`  Förbereder: ${meeting.title}`);
      try {
        const customer = await matchMeetingToCustomer(bq, dataset, meeting);
        const customerData = customer
          ? await getCustomerData(bq, dataset, customer.customer_id)
          : {};
        const briefing = await generateBriefing(claude, meeting, customer, customerData);
        briefings.push(briefing);
      } catch (e) {
        console.log(`  Fel för ${meeting.title}: ${e.message}`);
        briefings.push('(briefing misslyckades)');
      }
    }

    // Skicka mail
    const html = buildEmailHtml(meetings, briefings, dateStr);
    const subject = meetings.length > 0
      ? `Briefing ${dateStr} — ${meetings.length} möte${meetings.length !== 1 ? 'n' : ''}`
      : `Briefing ${dateStr} — Inga möten`;

    await ses.send(new SendEmailCommand({
      Source: 'noreply@searchboost.se',
      Destination: { ToAddresses: [recipientEmail] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Html: { Data: html, Charset: 'UTF-8' } }
      }
    }));

    console.log(`Mail skickat till ${recipientEmail}`);
    console.log('=== Sales Morning Briefing klar ===');

    return {
      statusCode: 200,
      body: JSON.stringify({ meetings: meetings.length, briefings: briefings.length })
    };

  } catch (err) {
    console.error('Sales Morning Briefing failed:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
