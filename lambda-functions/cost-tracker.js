/**
 * Cost Tracker Lambda — Veckovis kostnadsspårning
 *
 * Kör varje söndag kl 21:00 CET via EventBridge.
 * Samlar alla kostnader, skriver till BigQuery och Google Sheets.
 *
 * Kostnadskällor:
 * 1. AWS Cost Explorer — EC2, Lambda, SES, CloudWatch m.m.
 * 2. Anthropic API — usage-logg från BigQuery (seo_optimization_log)
 * 3. Fasta verktyg — från SSM/BigQuery cost_fixed_tools
 * 4. Tidskostnader — från BigQuery cost_time_log (manuell inmatning)
 *
 * Output:
 * - BigQuery: seo_data.cost_weekly_metrics
 * - Google Sheets: kostnadskalkylbladet (via Sheets API)
 * - E-post: sammanfattning till mikael@searchboost.se
 */

const { SSMClient, GetParametersCommand, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { CostExplorerClient, GetCostAndUsageCommand } = require('@aws-sdk/client-cost-explorer');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { BigQuery } = require('@google-cloud/bigquery');
const https = require('https');

const REGION = 'eu-north-1';
const PROJECT_ID = 'searchboost-485810';
const DATASET = 'seo_data';
const USD_TO_SEK = 10.5; // Uppdatera med live-kurs vid behov

// Fasta verktygs­kostnader (SEK/mån) — uppdatera vid prisändringar
const FIXED_TOOL_COSTS = [
  { name: 'SE Ranking', amount_sek: 599, category: 'tools' },
  { name: 'Loopia domäner (est)', amount_sek: 150, category: 'tools' },
  // Lägg till fler vid behov
];

// Internt timpris
const HOURLY_RATE_SEK = 500;

// Active customer count (fallback om BQ ej nås)
const ACTIVE_CUSTOMERS = 8;

// ── SSM helpers ─────────────────────────────────────────────────────────────

const ssm = new SSMClient({ region: REGION });

async function getParam(name) {
  try {
    const res = await ssm.send(new GetParameterCommand({
      Name: name,
      WithDecryption: true,
    }));
    return res.Parameter.Value;
  } catch (e) {
    console.warn(`SSM miss: ${name}`, e.message);
    return null;
  }
}

// ── BigQuery ─────────────────────────────────────────────────────────────────

let bq;
async function getBQ() {
  if (bq) return bq;
  const creds = await getParam('/seo-mcp/bigquery/credentials');
  bq = new BigQuery({
    projectId: PROJECT_ID,
    credentials: JSON.parse(creds),
  });
  return bq;
}

async function bqQuery(sql) {
  const client = await getBQ();
  const [rows] = await client.query({ query: sql, location: 'EU' });
  return rows;
}

async function bqInsert(table, rows) {
  const client = await getBQ();
  await client.dataset(DATASET).table(table).insert(rows);
}

// ── AWS Cost Explorer ────────────────────────────────────────────────────────

async function getAWSCosts(startDate, endDate) {
  const ce = new CostExplorerClient({ region: 'us-east-1' }); // CE är alltid us-east-1
  try {
    const res = await ce.send(new GetCostAndUsageCommand({
      TimePeriod: { Start: startDate, End: endDate },
      Granularity: 'MONTHLY',
      Metrics: ['BlendedCost'],
      GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
    }));

    const results = [];
    for (const group of (res.ResultsByTime?.[0]?.Groups || [])) {
      const service = group.Keys?.[0] || 'Unknown';
      const amountUSD = parseFloat(group.Metrics?.BlendedCost?.Amount || 0);
      if (amountUSD > 0.001) {
        results.push({
          service,
          amount_usd: amountUSD,
          amount_sek: amountUSD * USD_TO_SEK,
        });
      }
    }

    const totalUSD = results.reduce((s, r) => s + r.amount_usd, 0);
    console.log(`AWS kostnader: $${totalUSD.toFixed(2)} USD (${(totalUSD * USD_TO_SEK).toFixed(0)} kr)`);
    return results;
  } catch (e) {
    console.error('Cost Explorer fel:', e.message);
    return [];
  }
}

// ── Anthropic-kostnader via optimization_log ─────────────────────────────────

async function getAnthropicCosts(weekStart, weekEnd) {
  try {
    const rows = await bqQuery(`
      SELECT
        COUNT(*) as optimizations,
        SUM(COALESCE(tokens_used, 0)) as total_tokens
      FROM \`${PROJECT_ID}.${DATASET}.seo_optimization_log\`
      WHERE DATE(created_at) BETWEEN '${weekStart}' AND '${weekEnd}'
        AND status = 'completed'
    `);
    const row = rows[0] || {};
    const tokens = parseInt(row.total_tokens || 0);
    // Claude Sonnet 3.5: ~$3/M input + $15/M output, konservativt ~$6/M snitt
    const estimatedUSD = (tokens / 1_000_000) * 6;
    console.log(`Anthropic (estimated): ${tokens} tokens → $${estimatedUSD.toFixed(3)}`);
    return { tokens, amount_usd: estimatedUSD, amount_sek: estimatedUSD * USD_TO_SEK };
  } catch (e) {
    console.warn('Kunde ej hämta Anthropic-data:', e.message);
    return { tokens: 0, amount_usd: 0, amount_sek: 0 };
  }
}

// ── Tidskostnader ────────────────────────────────────────────────────────────

async function getTimeCosts(weekStart) {
  try {
    const rows = await bqQuery(`
      SELECT category, hours, notes
      FROM \`${PROJECT_ID}.${DATASET}.cost_time_log\`
      WHERE week_start = '${weekStart}'
    `);
    const total = rows.reduce((s, r) => s + (r.hours || 0), 0);
    return {
      rows,
      total_hours: total,
      amount_sek: total * HOURLY_RATE_SEK,
    };
  } catch (e) {
    console.warn('Tidskostnader ej tillgängliga (cost_time_log saknas?):', e.message);
    return { rows: [], total_hours: 0, amount_sek: 0 };
  }
}

// ── Hämta antal aktiva kunder från BQ ────────────────────────────────────────

async function getActiveCustomerCount() {
  try {
    const rows = await bqQuery(`
      SELECT COUNT(*) as cnt
      FROM \`${PROJECT_ID}.${DATASET}.customer_pipeline\`
      WHERE stage = 'active'
    `);
    return parseInt(rows[0]?.cnt || ACTIVE_CUSTOMERS);
  } catch (e) {
    return ACTIVE_CUSTOMERS;
  }
}

// ── Skriv till BigQuery ───────────────────────────────────────────────────────

async function writeToBQ(weekStart, data) {
  const rows = [];

  const push = (category, subcategory, amount_sek, amount_usd, notes = '') => {
    rows.push({
      week_start: weekStart,
      category,
      subcategory,
      amount_sek: Math.round(amount_sek * 100) / 100,
      amount_usd: Math.round(amount_usd * 1000) / 1000,
      notes,
      inserted_at: new Date().toISOString(),
    });
  };

  // AWS per service
  for (const s of data.aws) {
    push('aws', s.service, s.amount_sek / 4.33, s.amount_usd / 4.33, 'Veckodel av månadskostnad');
  }

  // Anthropic
  push('anthropic', 'claude_api', data.anthropic.amount_sek, data.anthropic.amount_usd,
    `${data.anthropic.tokens} tokens (uppskattat)`);

  // Fasta verktyg (veckodel)
  for (const t of FIXED_TOOL_COSTS) {
    push('tools', t.name, t.amount_sek / 4.33, (t.amount_sek / 4.33) / USD_TO_SEK, 'Veckodel');
  }

  // Tid
  if (data.time.total_hours > 0) {
    push('time', 'admin_och_dev', data.time.amount_sek, data.time.amount_sek / USD_TO_SEK,
      `${data.time.total_hours} timmar à ${HOURLY_RATE_SEK} kr`);
  }

  // Totalt
  push('total', 'total', data.total_sek, data.total_sek / USD_TO_SEK, '');

  try {
    await bqInsert('cost_weekly_metrics', rows);
    console.log(`BigQuery: ${rows.length} rader insatta`);
  } catch (e) {
    console.error('BigQuery insert fel:', e.message);
  }
}

// ── Google Sheets-export ─────────────────────────────────────────────────────

async function getSheetId() {
  try {
    const id = await getParam('/seo-mcp/cost/sheets-id');
    return id;
  } catch {
    return null;
  }
}

async function writeToSheets(weekStart, data, activeCustomers) {
  // Google Sheets Append via REST API (Service Account auth)
  const sheetsId = await getSheetId();
  if (!sheetsId) {
    console.warn('Sheets-ID saknas i SSM (/seo-mcp/cost/sheets-id) — hoppar över Sheets-export');
    return;
  }

  const credsStr = await getParam('/seo-mcp/bigquery/credentials');
  if (!credsStr) return;
  const creds = JSON.parse(credsStr);

  // JWT för Google Sheets API
  const { GoogleAuth } = require('google-auth-library');
  const auth = new GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const client = await auth.getClient();
  const token = (await client.getAccessToken()).token;

  const weekLabel = weekStart;
  const perKund = data.total_sek / activeCustomers;

  // Rad: Vecka | AWS | Anthropic | xAI | Verktyg | Tid | Totalt | Per kund
  const awsTotal = data.aws.reduce((s, r) => s + r.amount_sek / 4.33, 0);
  const toolsTotal = FIXED_TOOL_COSTS.reduce((s, t) => s + t.amount_sek / 4.33, 0);

  const row = [
    weekLabel,
    Math.round(awsTotal),
    Math.round(data.anthropic.amount_sek),
    0, // xAI — implementera separat vid behov
    Math.round(toolsTotal),
    Math.round(data.time.amount_sek),
    Math.round(data.total_sek),
    Math.round(perKund),
    activeCustomers,
    new Date().toISOString(),
  ];

  // Append till Veckoöversikt-fliken
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}/values/Vec%koo%versikt!A:J:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetsId}/values/Veckoo%CC%88versikt!A:J:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [row] }),
  });

  console.log(`Sheets uppdaterad: vecka ${weekLabel}`);
}

// ── E-post ───────────────────────────────────────────────────────────────────

async function sendEmail(weekStart, data, activeCustomers) {
  const ses = new SESClient({ region: REGION });
  const perKund = Math.round(data.total_sek / activeCustomers);

  const awsRows = data.aws.map(s =>
    `  ${s.service.padEnd(35)} ${Math.round(s.amount_sek / 4.33).toString().padStart(6)} kr/v`
  ).join('\n');

  const toolsRows = FIXED_TOOL_COSTS.map(t =>
    `  ${t.name.padEnd(35)} ${Math.round(t.amount_sek / 4.33).toString().padStart(6)} kr/v`
  ).join('\n');

  const body = `
SEARCHBOOST KOSTNADSRAPPORT — ${weekStart}
${'='.repeat(50)}

TOTALT: ${Math.round(data.total_sek)} kr/vecka

AWS:
${awsRows || '  (inga AWS-kostnader registrerade)'}

Anthropic API:     ${Math.round(data.anthropic.amount_sek).toString().padStart(6)} kr/v (uppskattning)
Fasta verktyg:
${toolsRows}
Tidskostnad:       ${Math.round(data.time.amount_sek).toString().padStart(6)} kr/v (${data.time.total_hours} tim)

${'─'.repeat(40)}
TOTALT:            ${Math.round(data.total_sek).toString().padStart(6)} kr/v
Per kund (${activeCustomers} st):  ${perKund.toString().padStart(6)} kr/v

Rapporten finns komplett i Google Sheets.

—
Searchboost Kostnadsagent
  `;

  try {
    await ses.send(new SendEmailCommand({
      Source: 'noreply@searchboost.se',
      Destination: { ToAddresses: ['mikael@searchboost.se'] },
      Message: {
        Subject: { Data: `Searchboost kostnadsrapport — ${weekStart}` },
        Body: { Text: { Data: body } },
      },
    }));
    console.log('E-post skickad');
  } catch (e) {
    console.error('E-post fel:', e.message);
  }
}

// ── Vecko­datum­hjälp ────────────────────────────────────────────────────────

function getWeekDates() {
  const now = new Date();
  // Måndag denna vecka
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1);
  const lastMonday = new Date(monday);
  lastMonday.setDate(monday.getDate() - 7);

  const fmt = d => d.toISOString().split('T')[0];
  return {
    weekStart: fmt(lastMonday),
    weekEnd: fmt(monday),
    currentMonthStart: fmt(new Date(now.getFullYear(), now.getMonth(), 1)),
    currentMonthEnd: fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

// ── HANDLER ──────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  console.log('=== COST TRACKER START ===');
  const { weekStart, weekEnd, currentMonthStart, currentMonthEnd } = getWeekDates();
  console.log(`Vecka: ${weekStart} → ${weekEnd}`);

  // Hämta all data parallellt
  const [awsCosts, anthropicCosts, timeCosts, activeCustomers] = await Promise.all([
    getAWSCosts(currentMonthStart, currentMonthEnd),
    getAnthropicCosts(weekStart, weekEnd),
    getTimeCosts(weekStart),
    getActiveCustomerCount(),
  ]);

  // Beräkna totaler (AWS är månadskostnad → dela på 4.33 för veckodel)
  const awsWeekSEK = awsCosts.reduce((s, r) => s + r.amount_sek / 4.33, 0);
  const toolsWeekSEK = FIXED_TOOL_COSTS.reduce((s, t) => s + t.amount_sek / 4.33, 0);
  const totalSEK = awsWeekSEK + anthropicCosts.amount_sek + toolsWeekSEK + timeCosts.amount_sek;

  const data = {
    aws: awsCosts,
    anthropic: anthropicCosts,
    time: timeCosts,
    total_sek: totalSEK,
  };

  console.log(`Total: ${Math.round(totalSEK)} kr | Per kund: ${Math.round(totalSEK / activeCustomers)} kr`);

  // Skriv till BQ, Sheets och e-posta parallellt
  await Promise.all([
    writeToBQ(weekStart, data),
    writeToSheets(weekStart, data, activeCustomers),
    sendEmail(weekStart, data, activeCustomers),
  ]);

  console.log('=== COST TRACKER KLAR ===');
  return { status: 'ok', week: weekStart, total_sek: Math.round(totalSEK) };
};
