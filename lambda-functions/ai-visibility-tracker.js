/**
 * AI Visibility Tracker Lambda — Körs varje måndag kl 07:30 CET
 * Vår egen Otterly.ai — spårar varumärkesnämnanden i AI-sökmotorer
 *
 * Metod: Skickar branschspecifika frågor till Claude (simulerar
 * vad en användare frågar ChatGPT/Perplexity/Google AI) och
 * räknar om kundens varumärke/domän nämns i svaret.
 *
 * Output:
 *   - BigQuery: ai_visibility_metrics (per kund per vecka)
 *   - Dashboard: visas i kundvy + kundportal
 *   - Kostnad: ~$0.02/kund/vecka (Haiku)
 *
 * Metrics:
 *   - share_of_model (SoM): % av 5 frågor där varumärket nämns
 *   - mention_count: antal gånger nämnt totalt
 *   - sentiment: positive/neutral/negative baserat på kontext
 *   - vs_competitors: om konkurrenter nämns istället
 */
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const Anthropic = require('@anthropic-ai/sdk');
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
  fs.writeFileSync('/tmp/bq-ai-creds.json', creds);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/bq-ai-creds.json';
  return { bq: new BigQuery({ projectId }), dataset };
}

async function initTable(bq, dataset) {
  await bq.query({
    query: `
      CREATE TABLE IF NOT EXISTS \`${dataset}.ai_visibility_metrics\` (
        metric_id STRING,
        customer_id STRING,
        company_name STRING,
        domain STRING,
        week_start DATE,
        prompts_tested INT64,
        mention_count INT64,
        share_of_model FLOAT64,
        sentiment STRING,
        competitor_mentions JSON,
        prompt_results JSON,
        created_at TIMESTAMP
      )
    `
  });
}

async function getCustomerInfo(customerId) {
  const keys = ['company-name', 'contact-email'];
  const info = { id: customerId };
  for (const key of keys) {
    try {
      const res = await ssm.send(new GetParameterCommand({
        Name: `/seo-mcp/integrations/${customerId}/${key}`
      }));
      info[key.replace('-', '_')] = res.Parameter.Value;
    } catch (e) { /* saknas */ }
  }
  try {
    const res = await ssm.send(new GetParameterCommand({
      Name: `/seo-mcp/wordpress/${customerId}/url`
    }));
    info.domain = res.Parameter.Value.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  } catch (e) { /* saknas */ }
  return info;
}

// Branschspecifika promptbibliotek — AI-sökmotorer svarar på dessa
function generatePrompts(companyName, domain, keywords) {
  const brand = companyName || domain?.split('.')[0] || 'varumärket';
  const domain_ = domain || '';

  // Prompter som simulerar vad en potentiell kund frågar ChatGPT
  const basePrompts = [
    // Direkt varumärkessökning
    `Vad är ${brand} och vad erbjuder de?`,
    // Branschsökning (anonymiserad — hittar de oss bland konkurrenter?)
    `Vilka är de bästa leverantörerna av ${keywords?.[0] || 'tjänsten'} i Sverige?`,
    // Problem-sökning (hittar de oss som lösning?)
    `Hur väljer man en bra leverantör av ${keywords?.[1] || keywords?.[0] || 'produkten'} i Sverige?`,
    // Jämförelsesökning
    `Rekommendera svenska företag som erbjuder ${keywords?.[0] || 'denna tjänst'}`,
    // Lokal/specifik sökning
    `Var kan jag köpa ${keywords?.[0] || 'produkten'} online i Sverige?`
  ];

  return basePrompts;
}

// Kör en prompt mot Claude och analysera om varumärket nämns
async function testPrompt(claude, prompt, companyName, domain) {
  try {
    // Simulera hur en AI-sökmotor svarar — Claude som stand-in för ChatGPT/Perplexity
    const res = await claude.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: 'Du är en hjälpsam AI-assistent. Svara på svenska. Ge ett informativt svar baserat på din träningsdata. Nämn specifika företag och varumärken när det är relevant.',
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = res.content[0].text;
    const lowerText = responseText.toLowerCase();
    const lowerBrand = (companyName || '').toLowerCase();
    const lowerDomain = (domain || '').toLowerCase().replace(/\.[a-z]+$/, '');

    // Räkna nämnanden
    let mentions = 0;
    if (lowerBrand && lowerText.includes(lowerBrand)) {
      const regex = new RegExp(lowerBrand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      mentions = (responseText.match(regex) || []).length;
    }
    if (lowerDomain && lowerText.includes(lowerDomain) && lowerDomain !== lowerBrand) {
      mentions += (responseText.match(new RegExp(lowerDomain, 'gi')) || []).length;
    }

    // Sentiment-analys av kontext runt nämnandet
    let sentiment = 'neutral';
    if (mentions > 0) {
      const posWords = /bra|bäst|rekommenderar|utmärkt|ledande|populär|pålitlig|kvalitet/i;
      const negWords = /dålig|undvik|problem|klagomål|kritik|oseriös/i;
      if (posWords.test(responseText)) sentiment = 'positive';
      else if (negWords.test(responseText)) sentiment = 'negative';
    }

    // Hitta konkurrenter som nämndes istället
    // (enkel heuristik — ord som slutar på .se eller är capitalized company-names)
    const competitorPattern = /\b[A-ZÅÄÖ][a-zåäö]{3,}(?:\s[A-ZÅÄÖ][a-zåäö]+)?\b/g;
    const possibleCompetitors = (responseText.match(competitorPattern) || [])
      .filter(c => c.toLowerCase() !== lowerBrand && c.length > 4)
      .slice(0, 5);

    return {
      prompt: prompt.substring(0, 100),
      mentioned: mentions > 0,
      mention_count: mentions,
      sentiment,
      competitors: possibleCompetitors,
      response_snippet: responseText.substring(0, 200)
    };
  } catch (e) {
    return { prompt: prompt.substring(0, 100), mentioned: false, mention_count: 0, sentiment: 'neutral', competitors: [], error: e.message };
  }
}

async function getCustomerKeywords(bq, dataset, customerId) {
  try {
    const [rows] = await bq.query({
      query: `SELECT keyword FROM \`${dataset}.customer_keywords\`
              WHERE customer_id = @cid AND classification = 'A' LIMIT 3`,
      params: { cid: customerId }
    });
    return rows.map(r => r.keyword);
  } catch (e) {
    return [];
  }
}

async function saveMetrics(bq, dataset, customerId, companyName, domain, results) {
  const mentionCount = results.filter(r => r.mentioned).length;
  const shareOfModel = results.length > 0 ? mentionCount / results.length : 0;
  const totalMentions = results.reduce((s, r) => s + (r.mention_count || 0), 0);

  // Aggregera sentiment
  const sentiments = results.filter(r => r.mentioned).map(r => r.sentiment);
  const sentiment = sentiments.length > 0
    ? (sentiments.filter(s => s === 'positive').length > sentiments.length / 2 ? 'positive' : 'neutral')
    : 'neutral';

  // Aggregera konkurrentnämnanden
  const competitorMap = {};
  results.forEach(r => {
    (r.competitors || []).forEach(c => {
      competitorMap[c] = (competitorMap[c] || 0) + 1;
    });
  });
  const topCompetitors = Object.entries(competitorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Måndag
  const weekStartStr = weekStart.toISOString().split('T')[0];

  await bq.query({
    query: `
      INSERT INTO \`${dataset}.ai_visibility_metrics\`
      (metric_id, customer_id, company_name, domain, week_start, prompts_tested, mention_count, share_of_model, sentiment, competitor_mentions, prompt_results, created_at)
      VALUES (@mid, @cid, @company, @domain, @week, @tested, @mentions, @som, @sentiment, @competitors, @results, CURRENT_TIMESTAMP())
    `,
    params: {
      mid: `${customerId}-${weekStartStr}`,
      cid: customerId,
      company: companyName || customerId,
      domain: domain || '',
      week: weekStartStr,
      tested: results.length,
      mentions: mentionCount,
      som: shareOfModel,
      sentiment,
      competitors: JSON.stringify(topCompetitors),
      results: JSON.stringify(results.map(r => ({
        prompt: r.prompt,
        mentioned: r.mentioned,
        sentiment: r.sentiment
      })))
    }
  });

  return { mentionCount, shareOfModel, totalMentions, sentiment, topCompetitors };
}

exports.handler = async (event) => {
  console.log('=== AI Visibility Tracker Started ===');

  try {
    const { bq, dataset } = await getBigQuery();
    await initTable(bq, dataset);

    const apiKey = await getParam('/seo-mcp/anthropic/api-key');
    const claude = new Anthropic({ apiKey });

    // Hämta alla aktiva kunder
    const [customerRows] = await bq.query({
      query: `SELECT DISTINCT customer_id FROM \`${dataset}.customer_keywords\` WHERE keyword IS NOT NULL`
    });
    const customerIds = customerRows.map(r => r.customer_id);

    console.log(`Kunder att spåra: ${customerIds.join(', ')}`);
    const results = [];

    for (const customerId of customerIds) {
      console.log(`\nSpårar AI-synlighet för: ${customerId}`);
      try {
        const [info, keywords] = await Promise.all([
          getCustomerInfo(customerId),
          getCustomerKeywords(bq, dataset, customerId)
        ]);

        const companyName = info.company_name;
        const domain = info.domain;

        if (!companyName && !domain) {
          console.log(`  Skippar ${customerId} — ingen företagsinformation`);
          continue;
        }

        const prompts = generatePrompts(companyName, domain, keywords);
        console.log(`  Testar ${prompts.length} AI-prompts...`);

        // Kör prompts sekventiellt för att undvika rate limiting
        const promptResults = [];
        for (const prompt of prompts) {
          const result = await testPrompt(claude, prompt, companyName, domain);
          promptResults.push(result);
          // Liten paus för att undvika rate limits
          await new Promise(r => setTimeout(r, 500));
        }

        const metrics = await saveMetrics(bq, dataset, customerId, companyName, domain, promptResults);

        const somPercent = Math.round(metrics.shareOfModel * 100);
        console.log(`  SoM: ${somPercent}% (${metrics.mentionCount}/${prompts.length} prompts nämner varumärket)`);

        results.push({
          customerId,
          companyName,
          shareOfModel: metrics.shareOfModel,
          mentionCount: metrics.mentionCount,
          totalPrompts: prompts.length,
          sentiment: metrics.sentiment,
          topCompetitors: metrics.topCompetitors
        });

      } catch (e) {
        console.error(`  Fel för ${customerId}: ${e.message}`);
        results.push({ customerId, status: 'error', error: e.message });
      }
    }

    console.log(`\n=== AI Visibility Tracker klar: ${results.filter(r => r.shareOfModel !== undefined).length} kunder spårade ===`);
    return { statusCode: 200, body: JSON.stringify({ results }) };

  } catch (err) {
    console.error('AI Visibility Tracker kraschade:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
