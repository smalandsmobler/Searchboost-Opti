/**
 * Content Blueprint Generator Lambda — Körs 1:a varje månad (kl 07:00 CET)
 * Genererar en månatlig innehållsplan per kund baserad på:
 *   - GSC-data (sökord med potential)
 *   - ABC-nyckelord
 *   - Konkurrentgap (via Claude-analys)
 * Output: Trello-kort + BigQuery-rad + mail till kund/team
 *
 * Prissättning: Basic = ingår, Standard = +500kr, Premium = +1500kr, Employee Content = +2000kr
 */
const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const fs = require('fs');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });

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

async function getCustomers(bq, dataset) {
  const [rows] = await bq.query({
    query: `SELECT DISTINCT customer_id FROM \`${dataset}.customer_keywords\` WHERE keyword IS NOT NULL`
  });
  return rows.map(r => r.customer_id);
}

async function getCustomerKeywords(bq, dataset, customerId) {
  const [rows] = await bq.query({
    query: `SELECT keyword, tier FROM \`${dataset}.customer_keywords\`
            WHERE customer_id = @cid ORDER BY tier`,
    params: { cid: customerId }
  });
  const a = rows.filter(r => r.tier === 'A').map(r => r.keyword);
  const b = rows.filter(r => r.tier === 'B').map(r => r.keyword);
  const c = rows.filter(r => r.tier === 'C').map(r => r.keyword);
  return { a, b, c, all: [...a, ...b, ...c] };
}

// Hämta GSC-sökord med hög potential (position 4-20, ej maximalt klickad)
async function getGSCOpportunities(bq, dataset, customerId) {
  try {
    const [rows] = await bq.query({
      query: `
        SELECT query, AVG(position) as avg_pos,
               SUM(impressions) as total_imp, SUM(clicks) as total_clicks,
               SAFE_DIVIDE(SUM(clicks), SUM(impressions)) as ctr
        FROM \`${dataset}.gsc_daily_metrics\`
        WHERE customer_id = @cid
          AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY)
          AND query IS NOT NULL AND query != ''
        GROUP BY query
        HAVING total_imp > 20
           AND avg_pos BETWEEN 4 AND 25
        ORDER BY total_imp DESC
        LIMIT 30
      `,
      params: { cid: customerId }
    });
    return rows || [];
  } catch (e) {
    console.log(`  GSC data saknas för ${customerId}: ${e.message}`);
    return [];
  }
}

// Hämta befintliga sidor (senaste optimeringar = redan behandlade)
async function getExistingContent(bq, dataset, customerId) {
  try {
    const [rows] = await bq.query({
      query: `
        SELECT DISTINCT page_url FROM \`${dataset}.seo_optimization_log\`
        WHERE customer_id = @cid
          AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY)
        LIMIT 50
      `,
      params: { cid: customerId }
    });
    return rows.map(r => r.page_url).filter(Boolean);
  } catch (e) {
    return [];
  }
}

// Generera innehållsplan med Claude
async function generateBlueprint(claude, customerId, keywords, gscData, existingUrls, companyName) {
  const topGSC = gscData.slice(0, 15).map(r =>
    `"${r.query}" — pos ${Math.round(r.avg_pos)}, ${r.total_imp} visningar, CTR ${Math.round((r.ctr || 0) * 100)}%`
  ).join('\n');

  const prompt = `Du är en expert på svensk SEO-innehållsstrategi.

Kund: ${companyName || customerId}
Primära nyckelord (A): ${keywords.a.slice(0, 8).join(', ') || 'ej konfigurerade'}
Sekundära nyckelord (B): ${keywords.b.slice(0, 10).join(', ') || '—'}
Brednyckelord (C): ${keywords.c.slice(0, 8).join(', ') || '—'}

GSC-sökord med potential (sidor som nästan rankar):
${topGSC || 'Ingen GSC-data tillgänglig'}

Befintligt innehåll (URL:er nyligen optimerade — undvik dessa):
${existingUrls.slice(0, 10).join('\n') || 'Inget känt'}

Generera en innehållsplan för nästa månad med 4 innehållsidéer.
Fokusera på:
1. Sökord med position 5-15 (kan klättra med bra innehåll)
2. Semantiska gap — ämnen med hög volym som saknas på sajten
3. Evergreen-innehåll som stärker hela sajten
4. Minst en artikel som kan bli en pillar page

Svara i JSON:
{
  "month": "2026-03",
  "customer_id": "${customerId}",
  "company_name": "${companyName || customerId}",
  "theme": "Övergripande tema för månaden",
  "articles": [
    {
      "title": "Exakt H1/titel för artikeln",
      "type": "guide|blogg|produktsida|landsida|FAQ",
      "primary_keyword": "huvudsökordet",
      "secondary_keywords": ["kw1", "kw2"],
      "target_url": "/foreslaget-url-pa-svenska",
      "word_count": 800,
      "priority": 1,
      "why": "Kort motivering (1 mening) — varför just detta",
      "outline": ["H2: rubrik 1", "H2: rubrik 2", "H2: rubrik 3"],
      "gsc_opportunity": "position X → target Y" 
    }
  ],
  "quick_wins": ["1 mening action att göra redan denna vecka"],
  "monthly_goal": "Förväntat resultat om vi kör planen"
}`;

  const res = await claude.messages.create({
    model: AI_MODEL,
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }]
  });

  let clean = res.content[0].text.trim();
  // Ta bort ```json wrapper om det finns
  if (clean.includes('```')) {
    const match = clean.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (match) clean = match[1].trim();
  }
  // Om svaret fortfarande inte börjar med { — extrahera JSON-blocket
  if (!clean.startsWith('{')) {
    const jsonStart = clean.indexOf('{');
    const jsonEnd = clean.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      clean = clean.slice(jsonStart, jsonEnd + 1);
    }
  }
  return JSON.parse(clean);
}

// Spara i BigQuery
async function saveBlueprint(bq, dataset, blueprint) {
  try {
    // Skapa tabell om den inte finns
    await bq.query({
      query: `
        CREATE TABLE IF NOT EXISTS \`${dataset}.content_blueprints\` (
          blueprint_id STRING,
          customer_id STRING,
          month STRING,
          company_name STRING,
          theme STRING,
          articles JSON,
          quick_wins JSON,
          monthly_goal STRING,
          created_at TIMESTAMP,
          status STRING
        )
      `
    });

    // BigQuery JSON-typ kräver JSON.stringify + explicit JSON-funktion, inte params
    const bid = `${blueprint.customer_id}-${blueprint.month}`;
    const articlesJson = JSON.stringify(blueprint.articles || []).replace(/'/g, "\\'");
    const winsJson = JSON.stringify(blueprint.quick_wins || []).replace(/'/g, "\\'");
    const company = (blueprint.company_name || blueprint.customer_id).replace(/'/g, "\\'");
    const theme = (blueprint.theme || '').replace(/'/g, "\\'");
    const goal = (blueprint.monthly_goal || '').replace(/'/g, "\\'");
    await bq.query({
      query: `
        INSERT INTO \`${dataset}.content_blueprints\`
        (blueprint_id, customer_id, month, company_name, theme, articles, quick_wins, monthly_goal, created_at, status)
        VALUES (
          '${bid}',
          '${blueprint.customer_id}',
          '${blueprint.month}',
          '${company}',
          '${theme}',
          JSON '${articlesJson}',
          JSON '${winsJson}',
          '${goal}',
          CURRENT_TIMESTAMP(),
          'active'
        )
      `
    });
  } catch (e) {
    console.error(`  BQ-sparning misslyckades för ${blueprint.customer_id}: ${e.message}`);
  }
}

// Skapa Trello-kort med innehållsplanen
async function createTrelloCard(blueprint) {
  try {
    const apiKey = await getParam('/seo-mcp/trello/api-key');
    const token = await getParam('/seo-mcp/trello/token');
    const boardId = await getParam('/seo-mcp/trello/board-id');

    const lists = (await axios.get(`https://api.trello.com/1/boards/${boardId}/lists`, {
      params: { key: apiKey, token }
    })).data;

    // Hitta TO DO-listan
    const todoList = lists.find(l => l.name.toLowerCase().includes('to do') || l.name.toLowerCase().includes('todo'));
    const targetList = todoList || lists[0];

    const cardName = `Content Blueprint ${blueprint.month}: ${blueprint.company_name || blueprint.customer_id}`;
    const articles = (blueprint.articles || []).map((a, i) =>
      `${i + 1}. **${a.title}** (${a.type})\n   Nyckelord: ${a.primary_keyword}\n   URL: ${a.target_url}\n   Ordmål: ~${a.word_count} ord\n   Varför: ${a.why}`
    ).join('\n\n');

    const quickWins = (blueprint.quick_wins || []).map(w => `- ${w}`).join('\n');

    const desc = `# Content Blueprint — ${blueprint.month}\n**${blueprint.company_name || blueprint.customer_id}**\n\n**Tema:** ${blueprint.theme || '—'}\n\n## Artiklar denna månad\n${articles}\n\n## Quick wins (gör denna vecka)\n${quickWins}\n\n## Mål\n${blueprint.monthly_goal || '—'}`;

    await axios.post('https://api.trello.com/1/cards', null, {
      params: { key: apiKey, token, idList: targetList.id, name: cardName, desc }
    });

    console.log(`  Trello-kort skapat: ${cardName}`);
  } catch (e) {
    console.error(`  Trello-fel: ${e.message}`);
  }
}

// Hämta företagsnamn från SSM
async function getCompanyName(customerId) {
  try {
    const res = await ssm.send(new GetParameterCommand({
      Name: `/seo-mcp/integrations/${customerId}/company-name`
    }));
    return res.Parameter.Value;
  } catch (e) {
    return null;
  }
}

exports.handler = async (event) => {
  console.log('=== Content Blueprint Generator Started ===');

  try {
    const { bq, dataset } = await getBigQuery();
    const claude = new Anthropic({ apiKey: await getParam('/seo-mcp/anthropic/api-key') });
    const AI_MODEL = 'claude-haiku-4-5-20251001';

    const customerIds = await getCustomers(bq, dataset);
    console.log(`Kunder att generera blueprint för: ${customerIds.join(', ')}`);

    const results = [];

    for (const customerId of customerIds) {
      console.log(`\nGenererar blueprint för: ${customerId}`);
      try {
        const [keywords, gscData, existingUrls, companyName] = await Promise.all([
          getCustomerKeywords(bq, dataset, customerId),
          getGSCOpportunities(bq, dataset, customerId),
          getExistingContent(bq, dataset, customerId),
          getCompanyName(customerId)
        ]);

        if (keywords.all.length === 0) {
          console.log(`  Skippar ${customerId} — inga nyckelord`);
          continue;
        }

        const blueprint = await generateBlueprint(claude, customerId, keywords, gscData, existingUrls, companyName);

        await saveBlueprint(bq, dataset, blueprint);
        await createTrelloCard(blueprint);

        results.push({ customerId, status: 'ok', articles: blueprint.articles?.length || 0 });
        console.log(`  OK — ${blueprint.articles?.length || 0} artikelförslag genererade`);

      } catch (e) {
        console.error(`  Fel för ${customerId}: ${e.message}`);
        results.push({ customerId, status: 'error', error: e.message });
      }
    }

    console.log(`=== Blueprint klar: ${results.filter(r => r.status === 'ok').length}/${results.length} kunder ===`);
    return { statusCode: 200, body: JSON.stringify({ results }) };

  } catch (err) {
    console.error('Blueprint-generator kraschade:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
