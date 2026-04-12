/**
 * Google Ads Optimizer Lambda
 *
 * Körs varje måndag kl 09:00 CET (EventBridge: cron(0 8 ? * MON *))
 *
 * Analyserar Google Ads-prestanda från BigQuery (ads_daily_metrics)
 * och genererar AI-drivna optimeringsrekommendationer per kund.
 *
 * Flöde:
 * 1. Hämtar alla aktiva kunder med google-ads-customer-id i SSM
 * 2. Per kund: analyserar senaste 14 dagars kampanjdata från BQ
 * 3. Claude genererar konkreta optimeringsåtgärder
 * 4. Bygger HTML-rapport och skickar till Mikael via SES
 * 5. Sparar rekommendationer i BQ: ads_optimization_suggestions
 */

const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { BigQuery } = require('@google-cloud/bigquery');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });
const ses = new SESClient({ region: REGION });

// ── SSM Helpers ──

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

async function getAllCustomerIds() {
  const res = await ssm.send(new GetParametersByPathCommand({
    Path: '/seo-mcp/integrations/',
    Recursive: true,
    WithDecryption: false,
  }));
  const customerIds = new Set();
  for (const p of (res.Parameters || [])) {
    const parts = p.Name.split('/');
    if (parts.length >= 4) customerIds.add(parts[3]);
  }
  return [...customerIds];
}

// ── BigQuery Setup ──

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

// ── Säkerställ BQ-tabell ──

async function ensureSuggestionsTable(bq, datasetId) {
  const schema = [
    { name: 'suggestion_id',  type: 'STRING',    mode: 'REQUIRED' },
    { name: 'customer_id',    type: 'STRING',    mode: 'REQUIRED' },
    { name: 'platform',       type: 'STRING' },
    { name: 'campaign_name',  type: 'STRING' },
    { name: 'suggestion',     type: 'STRING' },
    { name: 'priority',       type: 'STRING' }, // high | medium | low
    { name: 'expected_impact', type: 'STRING' },
    { name: 'status',         type: 'STRING' }, // pending | applied | dismissed
    { name: 'created_at',     type: 'TIMESTAMP' },
  ];
  try {
    await bq.dataset(datasetId).createTable('ads_optimization_suggestions', {
      schema: { fields: schema },
    });
    console.log('ads_optimization_suggestions tabell skapad');
  } catch (e) {
    if (!e.message.includes('Already Exists')) throw e;
  }
}

// ── Hämta annonsdata från BigQuery ──

async function getAdsData(bq, datasetId, customerId, days = 14) {
  const query = `
    SELECT
      platform,
      campaign_name,
      SUM(spend)          AS total_spend,
      SUM(clicks)         AS total_clicks,
      SUM(impressions)    AS total_impressions,
      SUM(conversions)    AS total_conversions,
      SAFE_DIVIDE(SUM(conversions), SUM(clicks)) * 100 AS conv_rate,
      SAFE_DIVIDE(SUM(spend), NULLIF(SUM(conversions), 0)) AS cost_per_conversion,
      SAFE_DIVIDE(SUM(revenue), NULLIF(SUM(spend), 0)) AS roas,
      AVG(quality_score)  AS avg_quality_score,
      COUNT(DISTINCT date) AS days_with_data
    FROM \`${datasetId}.ads_daily_metrics\`
    WHERE customer_id = @customerId
      AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY)
    GROUP BY platform, campaign_name
    ORDER BY total_spend DESC
    LIMIT 20
  `;

  try {
    const [rows] = await bq.query({
      query,
      params: { customerId, days },
    });
    return rows || [];
  } catch (e) {
    console.warn(`Ads-data för ${customerId} saknas: ${e.message}`);
    return [];
  }
}

async function getAdsKeywordData(bq, datasetId, customerId, days = 14) {
  const query = `
    SELECT
      keyword,
      SUM(spend)       AS spend,
      SUM(clicks)      AS clicks,
      SUM(impressions) AS impressions,
      SUM(conversions) AS conversions,
      SAFE_DIVIDE(SUM(spend), NULLIF(SUM(conversions), 0)) AS cpa,
      AVG(quality_score) AS quality_score
    FROM \`${datasetId}.ads_daily_metrics\`
    WHERE customer_id = @customerId
      AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY)
      AND keyword IS NOT NULL AND keyword != ''
    GROUP BY keyword
    ORDER BY spend DESC
    LIMIT 30
  `;
  try {
    const [rows] = await bq.query({ query, params: { customerId, days } });
    return rows || [];
  } catch { return []; }
}

// ── AI-analys med Claude ──

async function generateOptimizationSuggestions(customerId, companyName, campaignData, keywordData, anthropicKey) {
  const client = new Anthropic({ apiKey: anthropicKey });

  const campaignSummary = campaignData.map(c =>
    `Kampanj: ${c.campaign_name} (${c.platform})
     Spend: ${c.total_spend?.toFixed(0)} kr | Klick: ${c.total_clicks} | Konv: ${c.total_conversions?.toFixed(0)}
     ROAS: ${c.roas?.toFixed(2) || 'N/A'} | CPA: ${c.cost_per_conversion?.toFixed(0) || 'N/A'} kr | Conv-rate: ${c.conv_rate?.toFixed(1) || 0}%`
  ).join('\n\n');

  const keywordSummary = keywordData.slice(0, 15).map(k =>
    `"${k.keyword}": ${k.spend?.toFixed(0)} kr | ${k.clicks} klick | ${k.conversions?.toFixed(0)} konv | QS: ${k.quality_score?.toFixed(0) || '?'}`
  ).join('\n');

  const prompt = `Du är en senior Google Ads-specialist. Analysera följande annonsdata för ${companyName} och ge 4-6 konkreta, prioriterade optimeringsrekommendationer.

KAMPANJDATA (senaste 14 dagarna):
${campaignSummary || 'Ingen kampanjdata tillgänglig'}

NYCKELORD (topp spend):
${keywordSummary || 'Ingen nyckelorddata tillgänglig'}

Returnera EXAKT detta JSON-format:
{
  "overall_assessment": "1-2 meningar om kontots hälsa",
  "suggestions": [
    {
      "priority": "high|medium|low",
      "campaign": "kampanjnamn eller 'Alla kampanjer'",
      "action": "Konkret åtgärd att ta",
      "reason": "Varför (baserat på data)",
      "expected_impact": "Förväntat resultat"
    }
  ]
}`;

  const response = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].text;
  const match = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : raw);
}

// ── Bygg HTML-rapport ──

function buildEmailHtml(customerReports, month) {
  const reportRows = customerReports.map(r => {
    if (!r.hasData) {
      return `<tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>${r.companyName}</strong></td>
              <td style="padding:8px;border-bottom:1px solid #eee;color:#999" colspan="3">Inga annonser konfigurerade</td></tr>`;
    }

    const suggestions = r.analysis?.suggestions || [];
    const highPrio = suggestions.filter(s => s.priority === 'high');
    const totalSpend = r.campaignData.reduce((sum, c) => sum + (Number(c.total_spend) || 0), 0);
    const totalConv = r.campaignData.reduce((sum, c) => sum + (Number(c.total_conversions) || 0), 0);
    const avgRoas = r.campaignData.filter(c => c.roas).reduce((sum, c, _, arr) => sum + c.roas / arr.length, 0);

    return `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;vertical-align:top">
        <strong>${r.companyName}</strong><br>
        <small style="color:#888">${r.campaignData.length} kampanjer</small>
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:center">
        ${totalSpend.toFixed(0)} kr<br><small style="color:#888">spend</small>
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:center">
        ${totalConv.toFixed(0)}<br><small style="color:#888">konv</small>
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #eee">
        ${r.analysis?.overall_assessment || ''}
        ${highPrio.length > 0 ? `<ul style="margin:8px 0;padding-left:16px">${highPrio.map(s => `<li style="color:#c00"><strong>${s.action}</strong> — ${s.reason}</li>`).join('')}</ul>` : '<p style="color:#090">Inga kritiska åtgärder</p>'}
      </td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Google Ads Optimeringsrapport — ${month}</title></head>
<body style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;background:#f9f9f9">
  <div style="background:#0e0c19;padding:24px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:22px">Google Ads — Optimeringsrapport</h1>
    <p style="color:#888;margin:8px 0 0">${month} · Searchboost Opti</p>
  </div>
  <div style="padding:24px">
    <p style="color:#444">Automatisk analys av ${customerReports.filter(r => r.hasData).length} kund(er) med aktiva annonskonton.</p>

    <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.05)">
      <thead>
        <tr style="background:#f0f0f0">
          <th style="padding:10px 8px;text-align:left">Kund</th>
          <th style="padding:10px 8px;text-align:center">Spend</th>
          <th style="padding:10px 8px;text-align:center">Konv.</th>
          <th style="padding:10px 8px;text-align:left">Rekommendationer</th>
        </tr>
      </thead>
      <tbody>${reportRows}</tbody>
    </table>

    ${customerReports.filter(r => r.hasData && r.analysis?.suggestions?.length).map(r => `
    <div style="margin-top:24px;background:#fff;border-radius:8px;padding:20px;box-shadow:0 2px 4px rgba(0,0,0,0.05)">
      <h3 style="margin:0 0 12px;color:#0e0c19">${r.companyName} — Detaljerade åtgärder</h3>
      ${(r.analysis.suggestions || []).map(s => `
      <div style="padding:10px;margin-bottom:8px;border-left:4px solid ${s.priority === 'high' ? '#e53935' : s.priority === 'medium' ? '#fb8c00' : '#43a047'};background:#f9f9f9">
        <strong>${s.action}</strong>
        <br><small style="color:#666">Kampanj: ${s.campaign} · ${s.reason}</small>
        <br><small style="color:#090">Förväntat: ${s.expected_impact}</small>
      </div>`).join('')}
    </div>`).join('')}
  </div>
  <div style="padding:16px;text-align:center;font-size:12px;color:#999">
    Genererat av Searchboost Opti · ${new Date().toLocaleDateString('sv-SE')}
  </div>
</body>
</html>`;
}

// ── Main Handler ──

exports.handler = async (event) => {
  console.log('=== GOOGLE ADS OPTIMIZER START ===');

  const { bq, projectId, datasetId } = await getBQ();
  const anthropicKey = await getParamSafe('/seo-mcp/anthropic/api-key');
  const emailFrom    = await getParamSafe('/seo-mcp/email/from') || 'noreply@searchboost.se';
  const emailTo      = await getParamSafe('/seo-mcp/email/recipients') || 'mikael@searchboost.se';

  await ensureSuggestionsTable(bq, datasetId);

  const customerIds = await getAllCustomerIds();
  console.log(`Analyserar ${customerIds.length} kunder`);

  const customerReports = [];
  const suggestionsToInsert = [];

  for (const customerId of customerIds) {
    const adsCustomerId = await getParamSafe(`/seo-mcp/integrations/${customerId}/google-ads-customer-id`);
    const companyName   = await getParamSafe(`/seo-mcp/integrations/${customerId}/company-name`) || customerId;

    const campaignData = await getAdsData(bq, datasetId, customerId);
    const keywordData  = await getAdsKeywordData(bq, datasetId, customerId);

    const hasData = campaignData.length > 0;
    let analysis = null;

    if (hasData && anthropicKey) {
      try {
        analysis = await generateOptimizationSuggestions(customerId, companyName, campaignData, keywordData, anthropicKey);

        // Spara rekommendationer i BQ
        for (const s of (analysis.suggestions || [])) {
          suggestionsToInsert.push({
            suggestion_id: `${customerId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            customer_id:   customerId,
            platform:      'google_ads',
            campaign_name: s.campaign || '',
            suggestion:    `${s.action} — ${s.reason}`,
            priority:      s.priority || 'medium',
            expected_impact: s.expected_impact || '',
            status:        'pending',
            created_at:    new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error(`AI-analys misslyckades för ${customerId}: ${e.message}`);
      }
    }

    customerReports.push({ customerId, companyName, campaignData, keywordData, hasData, analysis });
    console.log(`  ${companyName}: ${campaignData.length} kampanjer, ${hasData ? 'analyserad' : 'ingen data'}`);
  }

  // Spara i BQ
  if (suggestionsToInsert.length > 0) {
    try {
      const table = bq.dataset(datasetId).table('ads_optimization_suggestions');
      await table.insert(suggestionsToInsert);
      console.log(`${suggestionsToInsert.length} rekommendationer sparade i BQ`);
    } catch (e) {
      console.error(`BQ insert fel: ${e.message}`);
    }
  }

  // Skicka e-post till Mikael
  const month = new Date().toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' });
  const htmlBody = buildEmailHtml(customerReports, month);

  const customersWithData = customerReports.filter(r => r.hasData).length;
  const totalHighPrio = customerReports.reduce((sum, r) =>
    sum + (r.analysis?.suggestions?.filter(s => s.priority === 'high').length || 0), 0);

  try {
    await ses.send(new SendEmailCommand({
      Source: emailFrom,
      Destination: { ToAddresses: [emailTo] },
      Message: {
        Subject: { Data: `Google Ads Optimering — ${customersWithData} kunder · ${totalHighPrio} åtgärder · ${month}` },
        Body: { Html: { Data: htmlBody } },
      },
    }));
    console.log(`E-post skickad till ${emailTo}`);
  } catch (e) {
    console.error(`SES-fel: ${e.message}`);
  }

  console.log(`=== GOOGLE ADS OPTIMIZER KLAR ===`);
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      customersAnalyzed: customerReports.length,
      customersWithData,
      suggestionsGenerated: suggestionsToInsert.length,
      highPrioritySuggestions: totalHighPrio,
    }),
  };
};
