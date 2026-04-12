/**
 * Content Gap Analyzer Lambda
 *
 * Körs varje måndag kl 07:30 CET (EventBridge: cron(30 6 ? * MON *))
 *
 * Analyserar GSC-data för att hitta:
 * 1. "Nästan-sida-1"-sökord (pos 11-20) med hög impressions → prioriterade optimeringar
 * 2. Sökord med hög CTR men låg position → dålig meta-text
 * 3. Sökord med hög impressions men 0 klick → borde hamna högre
 * 4. Sidor som rankar för fel sökord (keyword cannibalization)
 * 5. Saknade content-typer (har konkurrenter men kunden har inte)
 *
 * Output:
 * - Sparar content_opportunities i BigQuery
 * - Genererar prioriterad lista och mejlar Mikael
 * - Lägger till top-10 möjligheter i seo_work_queue (status='pending')
 */

const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { BigQuery } = require('@google-cloud/bigquery');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });
const ses = new SESClient({ region: REGION });

const ssmCache = new Map();
async function getParam(name) {
  if (ssmCache.has(name)) return ssmCache.get(name);
  const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  ssmCache.set(name, res.Parameter.Value);
  return res.Parameter.Value;
}
async function getParamSafe(name) {
  try { return await getParam(name); } catch { return null; }
}

let _bq, _projectId, _datasetId;
async function getBQ() {
  if (_bq) return { bq: _bq, projectId: _projectId, datasetId: _datasetId };
  const creds = await getParam('/seo-mcp/bigquery/credentials');
  _projectId = await getParam('/seo-mcp/bigquery/project-id');
  _datasetId = await getParam('/seo-mcp/bigquery/dataset');
  const credsPath = '/tmp/bq-creds.json';
  fs.writeFileSync(credsPath, creds);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
  _bq = new BigQuery({ projectId: _projectId, keyFilename: credsPath });
  return { bq: _bq, projectId: _projectId, datasetId: _datasetId };
}

async function ensureOpportunitiesTable(bq, datasetId) {
  const schema = [
    { name: 'opp_id',           type: 'STRING', mode: 'REQUIRED' },
    { name: 'customer_id',      type: 'STRING', mode: 'REQUIRED' },
    { name: 'opportunity_type', type: 'STRING' }, // near_page1 | low_ctr | zero_click | cannibalization
    { name: 'query',            type: 'STRING' },
    { name: 'page',             type: 'STRING' },
    { name: 'current_position', type: 'FLOAT' },
    { name: 'impressions_7d',   type: 'INTEGER' },
    { name: 'clicks_7d',        type: 'INTEGER' },
    { name: 'ctr',              type: 'FLOAT' },
    { name: 'potential_score',  type: 'FLOAT' }, // 0-100, högre = mer värde
    { name: 'recommendation',   type: 'STRING' },
    { name: 'status',           type: 'STRING' }, // pending | in_queue | done
    { name: 'created_at',       type: 'TIMESTAMP' },
  ];
  try {
    await bq.dataset(datasetId).createTable('content_opportunities', {
      schema: { fields: schema },
      timePartitioning: { type: 'DAY', field: 'created_at' },
      clustering: { fields: ['customer_id', 'opportunity_type'] },
    });
  } catch (e) {
    if (!e.message.includes('Already Exists')) throw e;
  }
}

// ── Analysera GSC-data ──

async function findNearPage1Keywords(bq, datasetId, customerId) {
  // Sökord på pos 11-20 med signifikant volym = lågt hängande frukt
  const [rows] = await bq.query({
    query: `
      SELECT
        query,
        ANY_VALUE(page) as page,
        AVG(position) as avg_position,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        SAFE_DIVIDE(SUM(clicks), SUM(impressions)) as ctr
      FROM \`${datasetId}.gsc_daily_metrics\`
      WHERE customer_id = @cid
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        AND position BETWEEN 11 AND 20
      GROUP BY query
      HAVING SUM(impressions) >= 50
      ORDER BY SUM(impressions) DESC
      LIMIT 20
    `,
    params: { cid: customerId },
  }).catch(() => [[]]);
  return rows || [];
}

async function findLowCTRKeywords(bq, datasetId, customerId) {
  // Sökord på sida 1 men med onormalt låg CTR = meta-titel/beskrivning förbättras
  const [rows] = await bq.query({
    query: `
      SELECT
        query,
        ANY_VALUE(page) as page,
        AVG(position) as avg_position,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        SAFE_DIVIDE(SUM(clicks), SUM(impressions)) as ctr,
        -- Förväntat CTR baserat på position (approximation)
        CASE
          WHEN AVG(position) <= 1  THEN 0.30
          WHEN AVG(position) <= 2  THEN 0.15
          WHEN AVG(position) <= 3  THEN 0.10
          WHEN AVG(position) <= 5  THEN 0.06
          WHEN AVG(position) <= 10 THEN 0.03
          ELSE 0.01
        END AS expected_ctr
      FROM \`${datasetId}.gsc_daily_metrics\`
      WHERE customer_id = @cid
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        AND position <= 10
      GROUP BY query
      HAVING SUM(impressions) >= 30
        AND SAFE_DIVIDE(SUM(clicks), SUM(impressions)) < (
          CASE WHEN AVG(position) <= 1 THEN 0.20
               WHEN AVG(position) <= 3 THEN 0.08
               WHEN AVG(position) <= 10 THEN 0.02
               ELSE 0.01 END
        )
      ORDER BY SUM(impressions) DESC
      LIMIT 15
    `,
    params: { cid: customerId },
  }).catch(() => [[]]);
  return rows || [];
}

async function findZeroClickKeywords(bq, datasetId, customerId) {
  // Hög impressions, noll klick — kan förbättras med featured snippets, bättre titel
  const [rows] = await bq.query({
    query: `
      SELECT
        query,
        ANY_VALUE(page) as page,
        AVG(position) as avg_position,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks
      FROM \`${datasetId}.gsc_daily_metrics\`
      WHERE customer_id = @cid
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        AND position <= 15
      GROUP BY query
      HAVING SUM(impressions) >= 100 AND SUM(clicks) = 0
      ORDER BY SUM(impressions) DESC
      LIMIT 15
    `,
    params: { cid: customerId },
  }).catch(() => [[]]);
  return rows || [];
}

async function findKeywordCannibalization(bq, datasetId, customerId) {
  // Flera sidor rankar för samma sökord = kanibalisering
  const [rows] = await bq.query({
    query: `
      SELECT
        query,
        COUNT(DISTINCT page) as page_count,
        ARRAY_AGG(DISTINCT page LIMIT 3) as competing_pages,
        AVG(position) as avg_position,
        SUM(impressions) as total_impressions
      FROM \`${datasetId}.gsc_daily_metrics\`
      WHERE customer_id = @cid
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        AND position <= 20
      GROUP BY query
      HAVING COUNT(DISTINCT page) >= 2
        AND SUM(impressions) >= 20
      ORDER BY SUM(impressions) DESC
      LIMIT 10
    `,
    params: { cid: customerId },
  }).catch(() => [[]]);
  return rows || [];
}

// ── Beräkna potential score ──

function calcPotentialScore(type, position, impressions, ctr, expectedCtr) {
  let score = 0;

  if (type === 'near_page1') {
    // Närmast sida 1 + hög volym = högt värde
    const posScore = Math.max(0, (20 - position) / 9) * 50; // 11-20 → 0-50
    const volScore = Math.min(50, impressions / 20);
    score = posScore + volScore;
  } else if (type === 'low_ctr') {
    // Vinstpotential = (expected_ctr - actual_ctr) * impressions
    const ctrGap = (expectedCtr || 0.05) - (ctr || 0);
    score = Math.min(100, ctrGap * impressions * 2);
  } else if (type === 'zero_click') {
    score = Math.min(100, impressions / 10);
  } else if (type === 'cannibalization') {
    score = 60; // Alltid hög prio att fixa
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

// ── AI-rekommendation ──

async function generateRecommendation(anthropicKey, opp) {
  if (!anthropicKey) {
    const defaults = {
      near_page1:        `Optimera title-tag och meta-beskrivning för "${opp.query}". Lägg till sökordet naturligt i H1 och första stycket. Bygg 1-2 interna länkar från starka sidor.`,
      low_ctr:           `Förbättra meta-titel och -beskrivning för "${opp.query}" — lägg till siffror, frågor eller USP för att locka fler klick. A/B-testa titeln.`,
      zero_click:        `Sidan visas men ingen klickar. Optimera meta-title för "${opp.query}" med tydlig CTA. Kontrollera att sidan matchar sökintentionen.`,
      cannibalization:   `Keyword cannibalization: flera sidor tävlar om "${opp.query}". Välj en kanonisk sida, lägg till canonical-taggar och omdirigera svagare sidor.`,
    };
    return defaults[opp.type] || 'Se över sidan och optimera för sökordet.';
  }

  const client = new Anthropic({ apiKey: anthropicKey });
  const response = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Du är SEO-specialist. Skriv EN konkret åtgärd (max 2 meningar) för detta problem:
Typ: ${opp.type}
Sökord: "${opp.query}"
Position: ${opp.position?.toFixed(1)}
Impressions/månad: ${opp.impressions}
${opp.page ? `URL: ${opp.page}` : ''}
Svara direkt utan förklaring.`,
    }],
  });
  return response.content[0].text.trim();
}

// ── Bygg opportunities-lista ──

async function buildOpportunities(customerId, nearPage1, lowCTR, zeroClick, cannibalization, anthropicKey) {
  const opps = [];
  const now = new Date().toISOString();

  for (const r of nearPage1) {
    const score = calcPotentialScore('near_page1', r.avg_position, r.total_impressions, r.ctr, null);
    opps.push({
      opp_id: `${customerId}_np1_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      customer_id: customerId,
      opportunity_type: 'near_page1',
      query: r.query,
      page: r.page || '',
      current_position: Number(r.avg_position.toFixed(1)),
      impressions_7d: Math.round(Number(r.total_impressions) / 4),
      clicks_7d: Math.round(Number(r.total_clicks) / 4),
      ctr: Number((r.ctr * 100).toFixed(1)),
      potential_score: score,
      recommendation: '',
      status: 'pending',
      created_at: now,
    });
  }

  for (const r of lowCTR) {
    const score = calcPotentialScore('low_ctr', r.avg_position, r.total_impressions, r.ctr, r.expected_ctr);
    opps.push({
      opp_id: `${customerId}_lctr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      customer_id: customerId,
      opportunity_type: 'low_ctr',
      query: r.query,
      page: r.page || '',
      current_position: Number(r.avg_position.toFixed(1)),
      impressions_7d: Math.round(Number(r.total_impressions) / 4),
      clicks_7d: Math.round(Number(r.total_clicks) / 4),
      ctr: Number((r.ctr * 100).toFixed(2)),
      potential_score: score,
      recommendation: '',
      status: 'pending',
      created_at: now,
    });
  }

  for (const r of zeroClick) {
    const score = calcPotentialScore('zero_click', r.avg_position, r.total_impressions, 0, null);
    opps.push({
      opp_id: `${customerId}_zclk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      customer_id: customerId,
      opportunity_type: 'zero_click',
      query: r.query,
      page: r.page || '',
      current_position: Number(r.avg_position.toFixed(1)),
      impressions_7d: Math.round(Number(r.total_impressions) / 4),
      clicks_7d: 0,
      ctr: 0,
      potential_score: score,
      recommendation: '',
      status: 'pending',
      created_at: now,
    });
  }

  for (const r of cannibalization) {
    opps.push({
      opp_id: `${customerId}_cann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      customer_id: customerId,
      opportunity_type: 'cannibalization',
      query: r.query,
      page: (r.competing_pages || []).join(' | '),
      current_position: Number((r.avg_position || 0).toFixed(1)),
      impressions_7d: Math.round(Number(r.total_impressions) / 4),
      clicks_7d: 0,
      ctr: 0,
      potential_score: 60,
      recommendation: '',
      status: 'pending',
      created_at: now,
    });
  }

  // Sortera efter potential_score och generera AI-rekommendationer för top 10
  opps.sort((a, b) => b.potential_score - a.potential_score);
  const top10 = opps.slice(0, 10);

  for (const opp of top10) {
    try {
      opp.recommendation = await generateRecommendation(anthropicKey, {
        type: opp.opportunity_type,
        query: opp.query,
        position: opp.current_position,
        impressions: opp.impressions_7d * 4,
        page: opp.page,
      });
    } catch {
      opp.recommendation = 'Optimera sidan för sökordet.';
    }
  }

  return opps;
}

// ── Bygg e-postrapport ──

function buildEmail(customerResults, date) {
  const customerBlocks = customerResults.map(r => {
    if (r.opportunities.length === 0) {
      return `<h3 style="color:#555">${r.companyName}</h3><p style="color:#999">Inga möjligheter hittade (kräver GSC-data).</p>`;
    }

    const typeLabel = { near_page1: 'Nära sida 1', low_ctr: 'Låg CTR', zero_click: 'Noll klick', cannibalization: 'Kannibalisering' };
    const typeColor = { near_page1: '#00e676', low_ctr: '#fb8c00', zero_click: '#2196f3', cannibalization: '#e91e8c' };

    const rows = r.opportunities.slice(0, 8).map(o => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0">
          <span style="display:inline-block;padding:2px 6px;border-radius:3px;font-size:11px;background:${typeColor[o.opportunity_type]}22;color:${typeColor[o.opportunity_type]}">${typeLabel[o.opportunity_type]}</span>
          <br><strong>${o.query}</strong>
        </td>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:center">${o.current_position}</td>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;text-align:center">${o.impressions_7d * 4}</td>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#555">${o.recommendation}</td>
      </tr>`).join('');

    return `
    <h3 style="color:#0e0c19;margin:24px 0 8px">${r.companyName} — ${r.opportunities.length} möjligheter</h3>
    <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
      <thead>
        <tr style="background:#f5f5f5">
          <th style="padding:8px;text-align:left;font-size:13px">Sökord</th>
          <th style="padding:8px;text-align:center;font-size:13px">Pos</th>
          <th style="padding:8px;text-align:center;font-size:13px">Imp/mån</th>
          <th style="padding:8px;text-align:left;font-size:13px">Åtgärd</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
  }).join('');

  const totalOpps = customerResults.reduce((sum, r) => sum + r.opportunities.length, 0);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:750px;margin:0 auto;background:#f9f9f9">
  <div style="background:#0e0c19;padding:20px 24px">
    <h1 style="color:#fff;margin:0;font-size:20px">SEO Content Gap Report — ${date}</h1>
    <p style="color:#888;margin:4px 0 0">${totalOpps} möjligheter identifierade</p>
  </div>
  <div style="padding:24px">${customerBlocks}</div>
  <div style="padding:12px;text-align:center;font-size:12px;color:#999;background:#f0f0f0">
    Searchboost Opti · <a href="http://51.21.116.7/" style="color:#0066cc">Öppna dashboard</a>
  </div>
</body>
</html>`;
}

// ── Main Handler ──

exports.handler = async (event) => {
  console.log('=== CONTENT GAP ANALYZER START ===');

  const { bq, projectId, datasetId } = await getBQ();
  const anthropicKey = await getParamSafe('/seo-mcp/anthropic/api-key');
  const emailFrom    = await getParamSafe('/seo-mcp/email/from') || 'noreply@searchboost.se';
  const emailTo      = await getParamSafe('/seo-mcp/email/recipients') || 'mikael@searchboost.se';

  await ensureOpportunitiesTable(bq, datasetId);

  const [customerRows] = await bq.query({
    query: `
      SELECT DISTINCT customer_id
      FROM \`${datasetId}.gsc_daily_metrics\`
      WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
      ORDER BY customer_id
    `,
  }).catch(() => [[]]);

  const customerResults = [];
  const allOpps = [];

  for (const { customer_id } of (customerRows || [])) {
    const companyName = await getParamSafe(`/seo-mcp/integrations/${customer_id}/company-name`) || customer_id;
    console.log(`  Analyserar ${companyName}`);

    try {
      const [nearPage1, lowCTR, zeroClick, cannibalization] = await Promise.all([
        findNearPage1Keywords(bq, datasetId, customer_id),
        findLowCTRKeywords(bq, datasetId, customer_id),
        findZeroClickKeywords(bq, datasetId, customer_id),
        findKeywordCannibalization(bq, datasetId, customer_id),
      ]);

      const opportunities = await buildOpportunities(customer_id, nearPage1, lowCTR, zeroClick, cannibalization, anthropicKey);
      customerResults.push({ customerId: customer_id, companyName, opportunities });
      allOpps.push(...opportunities);
      console.log(`    ${opportunities.length} möjligheter (${nearPage1.length} nära s1, ${lowCTR.length} låg CTR)`);
    } catch (e) {
      console.error(`  Fel: ${e.message}`);
      customerResults.push({ customerId: customer_id, companyName, opportunities: [] });
    }
  }

  // Spara i BQ (ta bort gamla från idag för att undvika duplikat)
  if (allOpps.length > 0) {
    try {
      await bq.dataset(datasetId).table('content_opportunities').insert(allOpps);
      console.log(`${allOpps.length} möjligheter sparade i BQ`);
    } catch (e) {
      console.error(`BQ insert: ${e.message}`);
    }
  }

  // Lägg till top-10 per kund i seo_work_queue
  for (const r of customerResults) {
    const top5 = r.opportunities.slice(0, 5);
    for (const opp of top5) {
      const workItem = {
        task_id:     `gap_${opp.opp_id}`,
        customer_id: opp.customer_id,
        page_url:    opp.page,
        task_type:   'optimize_metadata',
        priority:    opp.potential_score >= 70 ? 'high' : 'medium',
        status:      'pending',
        task_details: JSON.stringify({
          source:     'content_gap_analyzer',
          opp_type:   opp.opportunity_type,
          query:      opp.query,
          recommendation: opp.recommendation,
        }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      try {
        await bq.dataset(datasetId).table('seo_work_queue').insert([workItem]);
      } catch { /* ignore duplicates */ }
    }
  }

  // Skicka e-post
  const date = new Date().toLocaleDateString('sv-SE');
  const totalOpps = allOpps.length;

  if (totalOpps > 0) {
    try {
      await ses.send(new SendEmailCommand({
        Source: emailFrom,
        Destination: { ToAddresses: [emailTo] },
        Message: {
          Subject: { Data: `SEO Content Gap Report — ${totalOpps} möjligheter · ${date}` },
          Body:    { Html: { Data: buildEmail(customerResults, date) } },
        },
      }));
    } catch (e) {
      console.error(`SES-fel: ${e.message}`);
    }
  }

  console.log(`=== CONTENT GAP ANALYZER KLAR: ${totalOpps} möjligheter ===`);
  return { statusCode: 200, body: JSON.stringify({ success: true, opportunitiesFound: totalOpps }) };
};
