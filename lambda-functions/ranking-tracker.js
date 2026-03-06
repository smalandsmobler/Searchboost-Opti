/**
 * Ranking Tracker Lambda — Körs dagligen kl 07:00 CET
 * EventBridge: cron(0 6 * * ? *)   (06:00 UTC = 07:00 CET / 08:00 CEST)
 *
 * Syfte:
 *   - Spårar dagliga positionsförändringar per nyckelord från gsc_daily_metrics
 *   - Identifierar sökord som klättrat/sjunkit signifikant (>2 platser)
 *   - Lagrar sammanfattning i BigQuery: ranking_changes
 *   - Flaggar sökord som nått sida 1 (pos ≤10) eller lämnat sida 1
 *   - Skapar Trello-kommentar om signifikanta förändringar
 *
 * Kräver att data-collector kört för dagens datum (kör efter data-collector).
 * Använder rullande 7-dagars snitt för att minska brus från dagliga variationer.
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

async function getBigQuery() {
  const wifConfig = await getParam('/seo-mcp/bigquery/credentials');
  const projectId = await getParam('/seo-mcp/bigquery/project-id');
  const dataset = await getParam('/seo-mcp/bigquery/dataset');
  fs.writeFileSync('/tmp/wif-config.json', wifConfig);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/wif-config.json';
  return { bq: new BigQuery({ projectId }), dataset };
}

async function getCustomerIds(bq, dataset) {
  const [rows] = await bq.query({
    query: `
      SELECT DISTINCT customer_id
      FROM \`${dataset}.gsc_daily_metrics\`
      WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
      ORDER BY customer_id
    `
  });
  return (rows || []).map(r => r.customer_id).filter(Boolean);
}

// ── Skapa ranking_changes-tabellen om den saknas ──
async function ensureRankingChangesTable(bq, dataset) {
  const tableId = 'ranking_changes';
  try {
    await bq.dataset(dataset).table(tableId).get();
  } catch (e) {
    if (e.code === 404) {
      console.log('Creating ranking_changes table...');
      await bq.query({
        query: `
          CREATE TABLE \`${dataset}.${tableId}\` (
            id STRING,
            customer_id STRING,
            query STRING,
            date DATE,
            avg_position_current FLOAT64,
            avg_position_prev FLOAT64,
            position_change FLOAT64,
            clicks_current INT64,
            clicks_prev INT64,
            impressions_current INT64,
            change_type STRING,
            milestone STRING,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
          )
        `
      });
      console.log('ranking_changes table created.');
    } else {
      throw e;
    }
  }
}

/**
 * Beräknar 7-dagars rullande snitt för position och klick
 * Jämför de senaste 7 dagarna med de 7 dagarna dessförinnan
 *
 * change_type:
 *   'significant_gain'  — klättrat >3 platser
 *   'gain'              — klättrat 1-3 platser
 *   'significant_loss'  — sjunkit >3 platser
 *   'loss'              — sjunkit 1-3 platser
 *   'stable'            — ±1 plats
 *
 * milestone:
 *   'entered_top3'      — klättrat in i topp 3
 *   'entered_page1'     — klättrat in på sida 1 (≤10)
 *   'left_page1'        — lämnat sida 1 (>10)
 *   'entered_page2'     — nu position 11-20
 */
async function trackCustomerRankings(bq, dataset, customerId) {
  const changes = [];

  const [rows] = await bq.query({
    query: `
      WITH current_week AS (
        SELECT
          query,
          AVG(position) AS avg_pos,
          SUM(clicks) AS total_clicks,
          SUM(impressions) AS total_impressions
        FROM \`${dataset}.gsc_daily_metrics\`
        WHERE customer_id = @cid
          AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
          AND query IS NOT NULL AND query != ''
        GROUP BY query
        HAVING total_impressions >= 10
      ),
      prev_week AS (
        SELECT
          query,
          AVG(position) AS avg_pos,
          SUM(clicks) AS total_clicks,
          SUM(impressions) AS total_impressions
        FROM \`${dataset}.gsc_daily_metrics\`
        WHERE customer_id = @cid
          AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
          AND date < DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
          AND query IS NOT NULL AND query != ''
        GROUP BY query
        HAVING total_impressions >= 10
      )
      SELECT
        c.query,
        ROUND(c.avg_pos, 2) AS current_position,
        ROUND(p.avg_pos, 2) AS prev_position,
        ROUND(p.avg_pos - c.avg_pos, 2) AS position_change,
        CAST(c.total_clicks AS INT64) AS clicks_current,
        CAST(p.total_clicks AS INT64) AS clicks_prev,
        CAST(c.total_impressions AS INT64) AS impressions_current
      FROM current_week c
      INNER JOIN prev_week p ON c.query = p.query
      WHERE ABS(p.avg_pos - c.avg_pos) >= 0.5
      ORDER BY ABS(p.avg_pos - c.avg_pos) DESC
      LIMIT 100
    `,
    params: { cid: customerId }
  }).catch(() => [[]]);

  for (const row of (rows || [])) {
    const change = Number(row.position_change) || 0;
    const curr = Number(row.current_position);
    const prev = Number(row.prev_position);

    // Klassificera förändringen
    let changeType;
    if (change >= 5) changeType = 'significant_gain';
    else if (change >= 1) changeType = 'gain';
    else if (change <= -5) changeType = 'significant_loss';
    else if (change <= -1) changeType = 'loss';
    else changeType = 'stable';

    // Milstolpe
    let milestone = null;
    if (curr <= 3 && prev > 3) milestone = 'entered_top3';
    else if (curr <= 10 && prev > 10) milestone = 'entered_page1';
    else if (curr > 10 && prev <= 10) milestone = 'left_page1';
    else if (curr > 10 && curr <= 20 && prev > 20) milestone = 'entered_page2';

    changes.push({
      id: `rc_${Date.now()}_${customerId}_${Math.random().toString(36).substr(2, 6)}`,
      customer_id: customerId,
      query: row.query,
      date: new Date().toISOString().split('T')[0],
      avg_position_current: curr,
      avg_position_prev: prev,
      position_change: change,
      clicks_current: Number(row.clicks_current) || 0,
      clicks_prev: Number(row.clicks_prev) || 0,
      impressions_current: Number(row.impressions_current) || 0,
      change_type: changeType,
      milestone
    });
  }

  return changes;
}

// ── Batch-insert till BigQuery ──
async function saveChanges(bq, dataset, changes) {
  if (changes.length === 0) return;

  // Undvik dubbletter: kolla om dagens poster redan finns
  const [existing] = await bq.query({
    query: `
      SELECT DISTINCT customer_id
      FROM \`${dataset}.ranking_changes\`
      WHERE date = CURRENT_DATE()
    `
  }).catch(() => [[]]);

  const alreadySaved = new Set((existing || []).map(r => r.customer_id));
  const toInsert = changes.filter(c => !alreadySaved.has(c.customer_id));

  if (toInsert.length === 0) {
    console.log('  Ranking changes already saved for today — skipping insert');
    return;
  }

  const batchSize = 20;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    await Promise.all(batch.map(c =>
      bq.query({
        query: `
          INSERT INTO \`${dataset}.ranking_changes\`
          (id, customer_id, query, date, avg_position_current, avg_position_prev,
           position_change, clicks_current, clicks_prev, impressions_current,
           change_type, milestone)
          VALUES (@id, @customer_id, @query, @date, @avg_position_current, @avg_position_prev,
                  @position_change, @clicks_current, @clicks_prev, @impressions_current,
                  @change_type, @milestone)
        `,
        params: c
      }).catch(err => console.error(`  Insert error for ${c.customer_id}/${c.query}: ${err.message}`))
    ));
  }
  console.log(`  Inserted ${toInsert.length} ranking changes`);
}

// ── Skapa Trello-kommentar vid signifikanta förändringar ──
async function postTrelloNotification(customerId, changes) {
  try {
    const apiKey = await getParam('/seo-mcp/trello/api-key');
    const token = await getParam('/seo-mcp/trello/token');
    const boardId = await getParam('/seo-mcp/trello/board-id');

    const cardsRes = await axios.get(`https://api.trello.com/1/boards/${boardId}/cards`, {
      params: { key: apiKey, token, fields: 'name,id' }
    });
    const cards = cardsRes.data || [];
    const card = cards.find(c => c.name.toLowerCase().includes(customerId.toLowerCase()));
    if (!card) return;

    // Filtrera ut signifikanta förändringar + milstolpar
    const noteworthy = changes.filter(c =>
      c.change_type === 'significant_gain' ||
      c.change_type === 'significant_loss' ||
      c.milestone !== null
    );

    if (noteworthy.length === 0) return;

    const lines = [
      `**Ranking Tracker ${new Date().toLocaleDateString('sv-SE')}**`,
      ''
    ];

    const milestones = noteworthy.filter(c => c.milestone);
    if (milestones.length > 0) {
      lines.push('**Milstolpar:**');
      for (const c of milestones.slice(0, 5)) {
        const label = {
          'entered_top3': '🏆 IN I TOPP 3',
          'entered_page1': '✅ IN PÅ SIDA 1',
          'left_page1': '⚠️ LÄMNAT SIDA 1',
          'entered_page2': '📈 In på sida 2'
        }[c.milestone] || c.milestone;
        lines.push(`- ${label}: "${c.query}" (pos ${c.avg_position_current.toFixed(1)}, var ${c.avg_position_prev.toFixed(1)})`);
      }
      lines.push('');
    }

    const bigMovers = noteworthy
      .filter(c => c.change_type === 'significant_gain' || c.change_type === 'significant_loss')
      .sort((a, b) => Math.abs(b.position_change) - Math.abs(a.position_change));

    if (bigMovers.length > 0) {
      lines.push('**Stora positionsförändringar (>5 platser):**');
      for (const c of bigMovers.slice(0, 5)) {
        const arrow = c.position_change > 0 ? '▲' : '▼';
        lines.push(`- ${arrow} ${Math.abs(c.position_change).toFixed(0)} platser: "${c.query}" → pos ${c.avg_position_current.toFixed(1)}`);
      }
    }

    await axios.post(`https://api.trello.com/1/cards/${card.id}/actions/comments`, null, {
      params: { key: apiKey, token, text: lines.join('\n') }
    });

    console.log(`  Trello-kommentar postad för ${customerId}: ${noteworthy.length} signifikanta förändringar`);
  } catch (err) {
    console.error(`  Trello notification error for ${customerId}: ${err.message}`);
  }
}

// ── Bygg sammanfattning för logg ──
function buildSummary(customerId, changes) {
  const total = changes.length;
  const gains = changes.filter(c => c.position_change > 0).length;
  const losses = changes.filter(c => c.position_change < 0).length;
  const milestones = changes.filter(c => c.milestone).length;
  const bigMovers = changes.filter(c =>
    c.change_type === 'significant_gain' || c.change_type === 'significant_loss'
  ).length;

  return {
    customer_id: customerId,
    total_tracked: total,
    gains,
    losses,
    milestones,
    big_movers: bigMovers,
    top_gain: changes.find(c => c.position_change > 0)?.query || null,
    top_loss: changes.filter(c => c.position_change < 0).sort((a, b) => a.position_change - b.position_change)[0]?.query || null
  };
}

// ── Main handler ──
exports.handler = async (event) => {
  console.log('=== Ranking Tracker Started ===');
  const startTime = Date.now();

  // Stöd för manuell körning på enskild kund
  const forceCustomerId = event?.customerId || null;

  try {
    const { bq, dataset } = await getBigQuery();
    await ensureRankingChangesTable(bq, dataset);

    const allCustomerIds = await getCustomerIds(bq, dataset);
    const targetIds = forceCustomerId
      ? allCustomerIds.filter(id => id === forceCustomerId)
      : allCustomerIds;

    console.log(`Tracking rankings for ${targetIds.length} customers`);

    const results = [];

    for (const customerId of targetIds) {
      console.log(`\n--- ${customerId} ---`);
      try {
        const changes = await trackCustomerRankings(bq, dataset, customerId);
        console.log(`  Found ${changes.length} keyword changes`);

        if (changes.length > 0) {
          await saveChanges(bq, dataset, changes);

          // Trello-notis bara för signifikanta förändringar
          const hasSignificant = changes.some(c =>
            c.change_type === 'significant_gain' ||
            c.change_type === 'significant_loss' ||
            c.milestone !== null
          );
          if (hasSignificant) {
            await postTrelloNotification(customerId, changes);
          }
        }

        const summary = buildSummary(customerId, changes);
        results.push(summary);

        // Logga topp-rörelser
        const topGains = changes
          .filter(c => c.position_change > 0)
          .slice(0, 3)
          .map(c => `${c.query}: ▲${c.position_change.toFixed(1)} (→ pos ${c.avg_position_current.toFixed(1)})`);
        const topLosses = changes
          .filter(c => c.position_change < 0)
          .slice(0, 2)
          .map(c => `${c.query}: ▼${Math.abs(c.position_change).toFixed(1)} (→ pos ${c.avg_position_current.toFixed(1)})`);

        if (topGains.length > 0) console.log(`  Gains: ${topGains.join(' | ')}`);
        if (topLosses.length > 0) console.log(`  Losses: ${topLosses.join(' | ')}`);

        // Milstolpar
        const milestones = changes.filter(c => c.milestone);
        if (milestones.length > 0) {
          console.log(`  Milestones: ${milestones.map(c => `${c.milestone} for "${c.query}"`).join(', ')}`);
        }

      } catch (err) {
        console.error(`  Error for ${customerId}: ${err.message}`);
        results.push({ customer_id: customerId, error: err.message });
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const totalChanges = results.reduce((s, r) => s + (r.total_tracked || 0), 0);
    const totalMilestones = results.reduce((s, r) => s + (r.milestones || 0), 0);

    console.log(`\n=== Ranking Tracker Complete in ${duration}s ===`);
    console.log(`Total keyword changes tracked: ${totalChanges}`);
    console.log(`Total milestones: ${totalMilestones}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        duration: `${duration}s`,
        customers_tracked: targetIds.length,
        total_changes: totalChanges,
        total_milestones: totalMilestones,
        results
      })
    };

  } catch (err) {
    console.error('Ranking Tracker failed:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
