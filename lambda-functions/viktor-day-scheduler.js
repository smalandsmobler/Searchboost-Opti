/**
 * Viktor-dag Scheduler — Kör varje torsdag kl 17:00 CET
 * Skapar ett Trello-kort i "TO DO"-listan med veckans checklista
 * för Viktor att gå igenom med Mikael.
 *
 * EventBridge cron: cron(0 16 ? * THU *)  (16 UTC = 17 CET / 18 CEST)
 */
const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const axios = require('axios');
const fs = require('fs');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });

async function getParam(name) {
  const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return res.Parameter.Value;
}

async function getParamSafe(name) {
  try { return await getParam(name); } catch (e) { return null; }
}

// ── Slack-notis ──
async function sendSlackNotification(webhookUrl, weekLabel, checklistItems, cardUrl) {
  if (!webhookUrl) return;
  const payload = {
    attachments: [{
      color: '#00d4ff',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Viktor-dag ${weekLabel}*\nTrello-kort skapat med ${checklistItems} punkter att gå igenom.`
          }
        },
        {
          type: 'actions',
          elements: [{
            type: 'button',
            text: { type: 'plain_text', text: 'Öppna Trello-kort' },
            url: cardUrl,
            style: 'primary'
          }]
        },
        {
          type: 'context',
          elements: [{ type: 'mrkdwn', text: `Kör igenom listan med Mikael innan du börjar arbeta | ${new Date().toISOString().slice(0,10)}` }]
        }
      ]
    }]
  };
  try {
    await axios.post(webhookUrl, payload, { headers: { 'Content-Type': 'application/json' } });
    console.log('Slack-notis skickad');
  } catch (e) {
    console.error(`Slack-fel: ${e.message}`);
  }
}

async function getBigQuery() {
  const creds = await getParam('/seo-mcp/bigquery/credentials');
  const projectId = await getParam('/seo-mcp/bigquery/project-id');
  const dataset = await getParam('/seo-mcp/bigquery/dataset');
  fs.writeFileSync('/tmp/bq-creds.json', creds);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/bq-creds.json';
  return { bq: new BigQuery({ projectId }), dataset };
}

// ── Hämta veckans optimeringar per kund ──
async function getWeekStats(bq, dataset) {
  const [rows] = await bq.query({
    query: `
      SELECT
        customer_id,
        COUNT(*) as opt_count,
        ARRAY_AGG(DISTINCT optimization_type) as types
      FROM \`${dataset}.seo_optimization_log\`
      WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
      GROUP BY customer_id
      ORDER BY opt_count DESC
    `
  });
  return rows;
}

// ── Hämta kunder med fel i work_queue ──
async function getErrorTasks(bq, dataset) {
  const [rows] = await bq.query({
    query: `
      SELECT customer_id, task_type, page_url, COUNT(*) as count
      FROM \`${dataset}.seo_work_queue\`
      WHERE status = 'error'
      GROUP BY customer_id, task_type, page_url
      LIMIT 20
    `
  });
  return rows;
}

// ── Hämta kunder som saknar nyckelord ──
async function getCustomersWithoutKeywords(bq, dataset) {
  const [rows] = await bq.query({
    query: `
      SELECT cp.customer_id, cp.company_name
      FROM \`${dataset}.customer_pipeline\` cp
      LEFT JOIN (
        SELECT customer_id, COUNT(*) as kw_count
        FROM \`${dataset}.customer_keywords\`
        GROUP BY customer_id
      ) kw ON cp.customer_id = kw.customer_id
      WHERE cp.stage IN ('active', 'contract')
        AND (kw.kw_count IS NULL OR kw.kw_count = 0)
    `
  });
  return rows;
}

// ── Hämta kunder utan åtgärdsplan ──
async function getCustomersWithoutActionPlan(bq, dataset) {
  const [rows] = await bq.query({
    query: `
      SELECT cp.customer_id, cp.company_name
      FROM \`${dataset}.customer_pipeline\` cp
      LEFT JOIN (
        SELECT customer_id
        FROM \`${dataset}.action_plans\`
        WHERE status = 'active'
        GROUP BY customer_id
      ) ap ON cp.customer_id = ap.customer_id
      WHERE cp.stage IN ('active', 'contract')
        AND ap.customer_id IS NULL
    `
  });
  return rows;
}

// ── Skapa Trello-kort med checklista ──
async function createViktorDayCard(checklistItems, weekLabel) {
  const apiKey = await getParam('/seo-mcp/trello/api-key');
  const token = await getParam('/seo-mcp/trello/token');
  const boardId = await getParam('/seo-mcp/trello/board-id');

  // Hämta listor
  const listsRes = await axios.get(`https://api.trello.com/1/boards/${boardId}/lists`, {
    params: { key: apiKey, token }
  });
  const lists = listsRes.data;

  // Hitta "TO DO"-listan
  const todoList = lists.find(l => /to\s*do/i.test(l.name));
  if (!todoList) {
    console.error('Hittade ingen "TO DO"-lista på Trello-brädet');
    return null;
  }

  // Skapa kortet
  const cardRes = await axios.post('https://api.trello.com/1/cards', null, {
    params: {
      key: apiKey,
      token,
      idList: todoList.id,
      name: `Viktor-dag ${weekLabel}`,
      desc: `Veckogenomgång — ${weekLabel}\n\nGå igenom varje punkt med Mikael innan du börjar arbeta.\nMarkera som klart när åtgärden är utförd.\n\n📋 Skapad automatiskt av Searchboost Optimizer`,
      due: null
    }
  });
  const cardId = cardRes.data.id;

  // Skapa checklista
  const checklistRes = await axios.post(`https://api.trello.com/1/cards/${cardId}/checklists`, null, {
    params: { key: apiKey, token, name: 'Veckochecklista' }
  });
  const checklistId = checklistRes.data.id;

  // Lägg till checklistepunkter
  for (const item of checklistItems) {
    await axios.post(`https://api.trello.com/1/checklists/${checklistId}/checkItems`, null, {
      params: { key: apiKey, token, name: item }
    });
  }

  return cardRes.data;
}

// ── Bygg checklista ──
function buildChecklist(weekStats, errorTasks, noKeywords, noActionPlan, allCustomerIds) {
  const items = [];

  // ── Standardpunkter (alltid med) ──
  items.push('Gå igenom veckans GSC-data — finns det nya möjligheter i sökord?');
  items.push('Kontrollera att senaste optimeringarna ser rätt ut på kundsajterna');
  items.push('Uppdatera Trello-pipeline — flytta kunder till rätt stadium');

  // ── Kunder med fel ──
  if (errorTasks.length > 0) {
    const errorCustomers = [...new Set(errorTasks.map(t => t.customer_id))];
    items.push(`ÅTGÄRDA FEL: ${errorCustomers.join(', ')} har ${errorTasks.length} uppgifter med fel i kön (behöver manuell fix)`);
    for (const t of errorTasks.slice(0, 5)) {
      items.push(`  → ${t.customer_id}: ${t.task_type} på ${(t.page_url || '').substring(0, 60)}`);
    }
  }

  // ── Kunder utan nyckelord ──
  if (noKeywords.length > 0) {
    for (const c of noKeywords) {
      items.push(`SAKNAR NYCKELORD: ${c.company_name || c.customer_id} — mata in ABC-nyckelord i Dashboard`);
    }
  }

  // ── Kunder utan åtgärdsplan ──
  if (noActionPlan.length > 0) {
    for (const c of noActionPlan.slice(0, 5)) {
      items.push(`SAKNAR ÅTGÄRDSPLAN: ${c.company_name || c.customer_id} — generera AI-plan i Dashboard`);
    }
  }

  // ── Kunder med låg aktivitet (0 opt senaste veckan) ──
  const activeCustomers = new Set(weekStats.map(w => w.customer_id));
  const inactiveCustomers = allCustomerIds.filter(id => !activeCustomers.has(id));
  if (inactiveCustomers.length > 0) {
    items.push(`INAKTIVA KUNDER (0 opt denna vecka): ${inactiveCustomers.join(', ')} — kontrollera att kön inte är tom`);
  }

  // ── Veckostatistik ──
  if (weekStats.length > 0) {
    const totalOpt = weekStats.reduce((s, w) => s + (w.opt_count || 0), 0);
    items.push(`STATISTIK: ${totalOpt} optimeringar utförda denna vecka på ${weekStats.length} kunder`);
    for (const w of weekStats.slice(0, 5)) {
      items.push(`  → ${w.customer_id}: ${w.opt_count} opt (${(w.types || []).slice(0, 3).join(', ')})`);
    }
  }

  return items;
}

// ── Main handler ──
exports.handler = async (event) => {
  console.log('=== Viktor-dag Scheduler Started ===');

  try {
    const { bq, dataset } = await getBigQuery();

    // Hämta alla aktiva kunder
    const [allCustomers] = await bq.query({
      query: `SELECT customer_id FROM \`${dataset}.customer_pipeline\` WHERE stage IN ('active', 'contract')`
    });
    const allCustomerIds = allCustomers.map(c => c.customer_id);

    // Hämta all data parallellt
    const [weekStats, errorTasks, noKeywords, noActionPlan] = await Promise.all([
      getWeekStats(bq, dataset),
      getErrorTasks(bq, dataset),
      getCustomersWithoutKeywords(bq, dataset),
      getCustomersWithoutActionPlan(bq, dataset)
    ]);

    console.log(`Veckostatistik: ${weekStats.length} kunder med aktivitet`);
    console.log(`Feluppgifter: ${errorTasks.length} st`);
    console.log(`Utan nyckelord: ${noKeywords.length} kunder`);
    console.log(`Utan åtgärdsplan: ${noActionPlan.length} kunder`);

    // Datumstämpel
    const now = new Date();
    const weekLabel = now.toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const checklistItems = buildChecklist(weekStats, errorTasks, noKeywords, noActionPlan, allCustomerIds);

    const card = await createViktorDayCard(checklistItems, weekLabel);
    if (card) {
      console.log(`Trello-kort skapat: ${card.shortUrl}`);
    }

    // Slack-påminnelse till Viktor
    const slackWebhook = await getParamSafe('/seo-mcp/slack/webhook-url');
    if (slackWebhook && card) {
      await sendSlackNotification(slackWebhook, weekLabel, checklistItems.length, card.shortUrl);
    } else if (!slackWebhook) {
      console.log('Slack webhook saknas i SSM — hoppar över notis');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Viktor-dag-kort skapat för ${weekLabel}`,
        checklistItems: checklistItems.length,
        cardUrl: card?.shortUrl
      })
    };

  } catch (err) {
    console.error('Viktor-dag scheduler failed:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
