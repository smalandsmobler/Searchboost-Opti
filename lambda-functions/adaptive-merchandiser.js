/**
 * Adaptive Content Engine (ACE) — Dynamisk merchandising baserat på momentumscore
 *
 * Kör varje dag kl 06:00 CET (efter data-collector + ga4-collector).
 *
 * Logik:
 *   1. Hämtar GSC-klick + GA4-sessions + WooCommerce-orders senaste 7d vs föregående 7d
 *   2. Räknar ut "momentumscore" per kund (-100 till +100)
 *   3. Väljer strategi: SLUMP / NEUTRAL / BOOM
 *   4. Uppdaterar WordPress:
 *      - SLUMP:   Lyft lockvaror + prisbudskap i hero-text + billigaste produkter featured
 *      - NEUTRAL: Bästsäljare + senaste produkter
 *      - BOOM:    Premiumvaror + marginalfavoriter + upsell-banner
 *   5. Loggar beslut i BigQuery: ace_decisions
 *   6. Skickar daglig sammanfattning via SES
 *
 * Krav: Kund måste ha WP-credentials + GA4 property-id i SSM
 */

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const axios = require('axios');
const fs = require('fs');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });
const ses = new SESClient({ region: 'eu-north-1' });
const ssmCache = new Map();

// Kunder som är e-handel och har ACE aktiverat
const ACE_CUSTOMERS = [
  { id: 'smalandskontorsmobler', name: 'Smålands Kontorsmöbler', hasWooCommerce: true },
  { id: 'mobelrondellen',        name: 'Möbelrondellen',         hasWooCommerce: true },
  { id: 'ilmonte',               name: 'Ilmonte',                hasWooCommerce: true },
];

// Trösklar för strategi-val
const THRESHOLDS = { BOOM: 15, SLUMP: -15 };

// ── Helpers ──

async function getParam(name) {
  if (ssmCache.has(name)) return ssmCache.get(name);
  try {
    const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
    ssmCache.set(name, res.Parameter.Value);
    return res.Parameter.Value;
  } catch (e) {
    ssmCache.set(name, null);
    return null;
  }
}

async function initBQ() {
  const creds = await getParam('/seo-mcp/bigquery/credentials');
  const projectId = await getParam('/seo-mcp/bigquery/project-id');
  const dataset = await getParam('/seo-mcp/bigquery/dataset');
  fs.writeFileSync('/tmp/bq-creds.json', creds);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/bq-creds.json';
  return { bq: new BigQuery({ projectId }), dataset };
}

async function ensureAceTable(bq, dataset) {
  const schema = [
    { name: 'customer_id',        type: 'STRING' },
    { name: 'decision_date',      type: 'DATE' },
    { name: 'strategy',           type: 'STRING' },   // SLUMP / NEUTRAL / BOOM
    { name: 'momentum_score',     type: 'FLOAT' },
    { name: 'gsc_clicks_7d',      type: 'INTEGER' },
    { name: 'gsc_clicks_prev7d',  type: 'INTEGER' },
    { name: 'gsc_delta_pct',      type: 'FLOAT' },
    { name: 'ga4_sessions_7d',    type: 'INTEGER' },
    { name: 'ga4_sessions_prev7d',type: 'INTEGER' },
    { name: 'ga4_delta_pct',      type: 'FLOAT' },
    { name: 'wc_revenue_7d',      type: 'FLOAT' },
    { name: 'wc_revenue_prev7d',  type: 'FLOAT' },
    { name: 'wc_delta_pct',       type: 'FLOAT' },
    { name: 'actions_taken',      type: 'STRING' },   // JSON-array med utförda åtgärder
    { name: 'decided_at',         type: 'TIMESTAMP' },
  ];
  const tableRef = bq.dataset(dataset).table('ace_decisions');
  const [exists] = await tableRef.exists();
  if (!exists) {
    await tableRef.create({ schema,
      timePartitioning: { type: 'DAY', field: 'decision_date' },
    });
    console.log('Skapade tabell ace_decisions');
  }
  return tableRef;
}

// ── Datainhämtning ──

async function getGSCClicks(bq, dataset, customerId) {
  try {
    const [rows] = await bq.query({
      query: `
        SELECT
          SUM(IF(date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY), clicks, 0)) as clicks_7d,
          SUM(IF(date < DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
               AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY), clicks, 0)) as clicks_prev7d
        FROM \`${dataset}.gsc_daily_metrics\`
        WHERE customer_id = @cid
          AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
      `,
      params: { cid: customerId },
    });
    return {
      current: parseInt(rows[0]?.clicks_7d || 0),
      previous: parseInt(rows[0]?.clicks_prev7d || 0),
    };
  } catch (e) {
    console.error(`  GSC-fel ${customerId}: ${e.message}`);
    return { current: 0, previous: 0 };
  }
}

async function getGA4Sessions(bq, dataset, customerId) {
  try {
    const [rows] = await bq.query({
      query: `
        SELECT
          SUM(IF(date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY), sessions, 0)) as s_7d,
          SUM(IF(date < DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
               AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY), sessions, 0)) as s_prev7d
        FROM \`${dataset}.ga4_daily_metrics\`
        WHERE customer_id = @cid
          AND page_path != '__source_summary__'
          AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
      `,
      params: { cid: customerId },
    });
    return {
      current: parseInt(rows[0]?.s_7d || 0),
      previous: parseInt(rows[0]?.s_prev7d || 0),
    };
  } catch (e) {
    console.error(`  GA4-fel ${customerId}: ${e.message}`);
    return { current: 0, previous: 0 };
  }
}

async function getWooCommerceRevenue(wpUrl, wpUser, wpPass) {
  try {
    const today = new Date();
    const d7 = new Date(today - 7 * 86400000).toISOString().slice(0, 10);
    const d14 = new Date(today - 14 * 86400000).toISOString().slice(0, 10);

    const [r1, r2] = await Promise.all([
      axios.get(`${wpUrl}/wp-json/wc/v3/reports/revenue?period=custom&date_min=${d7}&date_max=${today.toISOString().slice(0,10)}`,
        { auth: { username: wpUser, password: wpPass }, timeout: 15000 }),
      axios.get(`${wpUrl}/wp-json/wc/v3/reports/revenue?period=custom&date_min=${d14}&date_max=${d7}`,
        { auth: { username: wpUser, password: wpPass }, timeout: 15000 }),
    ]);

    const rev7d   = parseFloat(r1.data?.totals?.gross_sales || 0);
    const revPrev = parseFloat(r2.data?.totals?.gross_sales || 0);
    return { current: rev7d, previous: revPrev };
  } catch (e) {
    return { current: 0, previous: 0 };
  }
}

// ── Momentumscore-beräkning ──

function calcDeltaPct(current, previous) {
  if (previous === 0) return current > 0 ? 50 : 0;
  return ((current - previous) / previous) * 100;
}

function calcMomentumScore(gscDelta, ga4Delta, wcDelta) {
  // Viktning: GSC 40%, GA4 35%, WC 25% (WC saknar data för många kunder)
  const weighted = (gscDelta * 0.40) + (ga4Delta * 0.35) + (wcDelta * 0.25);
  // Klipp till -100 / +100
  return Math.max(-100, Math.min(100, weighted));
}

function getStrategy(score) {
  if (score >= THRESHOLDS.BOOM)  return 'BOOM';
  if (score <= THRESHOLDS.SLUMP) return 'SLUMP';
  return 'NEUTRAL';
}

// ── WordPress-åtgärder ──

async function getWPProducts(wpUrl, wpUser, wpPass, orderby = 'popularity', limit = 8) {
  try {
    const res = await axios.get(`${wpUrl}/wp-json/wc/v3/products`, {
      params: { orderby, per_page: limit, status: 'publish', stock_status: 'instock' },
      auth: { username: wpUser, password: wpPass },
      timeout: 15000,
    });
    return res.data || [];
  } catch (e) {
    return [];
  }
}

async function getCheapestProducts(wpUrl, wpUser, wpPass, limit = 8) {
  try {
    const res = await axios.get(`${wpUrl}/wp-json/wc/v3/products`, {
      params: { orderby: 'price', order: 'asc', per_page: limit, status: 'publish', stock_status: 'instock' },
      auth: { username: wpUser, password: wpPass },
      timeout: 15000,
    });
    return res.data || [];
  } catch (e) {
    return [];
  }
}

async function updateHomepageACE(wpUrl, wpUser, wpPass, pageId, strategy, products) {
  // Bygger en ACE-sektion som injiceras/ersätter ett specifikt block på startsidan
  // Vi lägger en HTML-kommentar som markör: <!-- ACE-BLOCK-START --> ... <!-- ACE-BLOCK-END -->

  const productHTML = products.slice(0, 4).map(p => {
    const price = p.sale_price || p.regular_price || p.price || '';
    const img = p.images?.[0]?.src || '';
    return `<div class="ace-product">
      ${img ? `<img src="${img}" alt="${p.name}" loading="lazy">` : ''}
      <h3>${p.name}</h3>
      ${price ? `<p class="ace-price">${price} kr</p>` : ''}
      <a href="${p.permalink}" class="button ace-btn">Visa produkt</a>
    </div>`;
  }).join('');

  const heroTexts = {
    SLUMP:   { h2: 'Bästa priset just nu', sub: 'Handplockat för dig som vill ha valuta för pengarna. Fri frakt på order över 2 000 kr.' },
    NEUTRAL: { h2: 'Populärt just nu',     sub: 'Våra mest efterfrågade produkter — alltid redo för snabb leverans.' },
    BOOM:    { h2: 'Premium för kontoret', sub: 'Investera i kvalitet som varar. Dessa produkter är våra kunders favoriter på lång sikt.' },
  };

  const t = heroTexts[strategy];
  const aceBlock = `<!-- ACE-BLOCK-START -->
<section class="ace-section ace-${strategy.toLowerCase()}">
  <div class="ace-hero">
    <h2>${t.h2}</h2>
    <p>${t.sub}</p>
  </div>
  <div class="ace-products-grid">${productHTML}</div>
</section>
<!-- ACE-BLOCK-END -->`;

  try {
    // Hämta befintlig startsida
    const pageRes = await axios.get(`${wpUrl}/wp-json/wp/v2/pages/${pageId}`,
      { auth: { username: wpUser, password: wpPass }, timeout: 10000 });

    let content = pageRes.data.content?.raw || '';

    // Ersätt ACE-block om det finns, annars append
    if (content.includes('<!-- ACE-BLOCK-START -->')) {
      content = content.replace(
        /<!-- ACE-BLOCK-START -->[\s\S]*?<!-- ACE-BLOCK-END -->/,
        aceBlock
      );
    } else {
      content = content + '\n\n' + aceBlock;
    }

    await axios.put(`${wpUrl}/wp-json/wp/v2/pages/${pageId}`,
      { content },
      { auth: { username: wpUser, password: wpPass }, timeout: 15000 }
    );
    return { action: 'homepage_ace_updated', strategy };
  } catch (e) {
    console.error(`  Homepage-uppdatering fel: ${e.message}`);
    return { action: 'homepage_ace_failed', error: e.message };
  }
}

// ── Kundprocess ──

async function processCustomer(customer, bq, dataset) {
  const wpUrl  = await getParam(`/seo-mcp/wordpress/${customer.id}/url`);
  const wpUser = await getParam(`/seo-mcp/wordpress/${customer.id}/username`);
  const wpPass = await getParam(`/seo-mcp/wordpress/${customer.id}/app-password`);

  if (!wpUrl || !wpUser || !wpPass) {
    return { customer_id: customer.id, skipped: true, reason: 'no_wp_credentials' };
  }

  console.log(`  Hämtar data för ${customer.id}...`);

  // Hämta alla datasignaler parallellt
  const [gsc, ga4, wc] = await Promise.all([
    getGSCClicks(bq, dataset, customer.id),
    getGA4Sessions(bq, dataset, customer.id),
    customer.hasWooCommerce
      ? getWooCommerceRevenue(wpUrl, wpUser, wpPass)
      : Promise.resolve({ current: 0, previous: 0 }),
  ]);

  const gscDelta = calcDeltaPct(gsc.current, gsc.previous);
  const ga4Delta = calcDeltaPct(ga4.current, ga4.previous);
  const wcDelta  = calcDeltaPct(wc.current, wc.previous);
  const score    = calcMomentumScore(gscDelta, ga4Delta, wcDelta);
  const strategy = getStrategy(score);

  console.log(`  ${customer.id}: score=${score.toFixed(1)} → ${strategy}`);
  console.log(`    GSC: ${gsc.previous}→${gsc.current} (${gscDelta.toFixed(1)}%)`);
  console.log(`    GA4: ${ga4.previous}→${ga4.current} (${ga4Delta.toFixed(1)}%)`);
  console.log(`    WC:  ${wc.previous.toFixed(0)}→${wc.current.toFixed(0)} kr (${wcDelta.toFixed(1)}%)`);

  // Välj produkter baserat på strategi
  const actions = [];
  let products = [];

  if (strategy === 'SLUMP') {
    products = await getCheapestProducts(wpUrl, wpUser, wpPass);
  } else if (strategy === 'BOOM') {
    products = await getWPProducts(wpUrl, wpUser, wpPass, 'price', 8);
    // Sortera dyrast först
    products.sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
  } else {
    products = await getWPProducts(wpUrl, wpUser, wpPass, 'popularity', 8);
  }

  // Hitta startsidans ID
  try {
    const settingsRes = await axios.get(`${wpUrl}/wp-json/wp/v2/settings`,
      { auth: { username: wpUser, password: wpPass }, timeout: 10000 });
    const homepageId = settingsRes.data?.page_on_front;

    if (homepageId) {
      const result = await updateHomepageACE(wpUrl, wpUser, wpPass, homepageId, strategy, products);
      actions.push(result);
    }
  } catch (e) {
    console.error(`  Kunde inte hämta startsida-ID: ${e.message}`);
  }

  return {
    customer_id:       customer.id,
    strategy,
    momentum_score:    score,
    gsc_clicks_7d:     gsc.current,
    gsc_clicks_prev7d: gsc.previous,
    gsc_delta_pct:     gscDelta,
    ga4_sessions_7d:    ga4.current,
    ga4_sessions_prev7d: ga4.previous,
    ga4_delta_pct:     ga4Delta,
    wc_revenue_7d:     wc.current,
    wc_revenue_prev7d: wc.previous,
    wc_delta_pct:      wcDelta,
    actions,
  };
}

// ── SES-rapport ──

async function sendDailyReport(results, dateStr) {
  const from = await getParam('/seo-mcp/email/from');
  const to   = await getParam('/seo-mcp/email/recipients');

  const strategyEmoji = { BOOM: '🚀', NEUTRAL: '➡️', SLUMP: '📉' };

  const rows = results.filter(r => !r.skipped).map(r =>
    `${strategyEmoji[r.strategy] || '?'} ${r.customer_id.padEnd(28)} | ${r.strategy.padEnd(7)} | score: ${r.momentum_score.toFixed(1).padStart(6)} | GSC: ${r.gsc_delta_pct.toFixed(1)}% | GA4: ${r.ga4_delta_pct.toFixed(1)}%`
  ).join('\n');

  const skipped = results.filter(r => r.skipped).map(r => `  - ${r.customer_id}: ${r.reason}`).join('\n');

  const body = `ACE Daglig rapport — ${dateStr}

${rows}

${skipped ? `Ej processade:\n${skipped}` : ''}

Strategi-logik:
  BOOM   (score ≥ +15): Premium-produkter, aspirationellt budskap
  NEUTRAL (−15–+15):   Bästsäljare, standardlayout
  SLUMP  (score ≤ −15): Lockvaror, prisbudskap, fri frakt-banner

Systemet uppdaterar startsidans ACE-block automatiskt per kund.
`;

  await ses.send(new SendEmailCommand({
    Source: from,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: `ACE ${dateStr} — ${results.filter(r=>r.strategy==='BOOM').length}x BOOM / ${results.filter(r=>r.strategy==='SLUMP').length}x SLUMP` },
      Body: { Text: { Data: body } },
    },
  }));
}

// ── Handler ──

exports.handler = async (event) => {
  console.log('Adaptive Content Engine startar', new Date().toISOString());

  const dateStr = event.date || new Date().toISOString().slice(0, 10);
  const { bq, dataset } = await initBQ();
  const aceTable = await ensureAceTable(bq, dataset);

  const results = [];

  for (const customer of ACE_CUSTOMERS) {
    console.log(`\nKund: ${customer.id}`);
    try {
      const res = await processCustomer(customer, bq, dataset);
      results.push(res);

      if (!res.skipped) {
        await aceTable.insert([{
          customer_id:          res.customer_id,
          decision_date:        dateStr,
          strategy:             res.strategy,
          momentum_score:       res.momentum_score,
          gsc_clicks_7d:        res.gsc_clicks_7d,
          gsc_clicks_prev7d:    res.gsc_clicks_prev7d,
          gsc_delta_pct:        res.gsc_delta_pct,
          ga4_sessions_7d:      res.ga4_sessions_7d,
          ga4_sessions_prev7d:  res.ga4_sessions_prev7d,
          ga4_delta_pct:        res.ga4_delta_pct,
          wc_revenue_7d:        res.wc_revenue_7d,
          wc_revenue_prev7d:    res.wc_revenue_prev7d,
          wc_delta_pct:         res.wc_delta_pct,
          actions_taken:        JSON.stringify(res.actions || []),
          decided_at:           { value: new Date().toISOString() },
        }]);
      }
    } catch (e) {
      console.error(`${customer.id} FEL: ${e.message}`);
      results.push({ customer_id: customer.id, skipped: true, reason: e.message });
    }
  }

  try {
    await sendDailyReport(results, dateStr);
  } catch (e) {
    console.error('SES-fel:', e.message);
  }

  return {
    date: dateStr,
    customers: results.length,
    boom:    results.filter(r => r.strategy === 'BOOM').length,
    neutral: results.filter(r => r.strategy === 'NEUTRAL').length,
    slump:   results.filter(r => r.strategy === 'SLUMP').length,
    results,
  };
};
