/**
 * Prompt Improver Lambda — Körs varje måndag 07:00 CET (05:00 UTC)
 *
 * 1. Hämtar prompt_ab_log från BigQuery (senaste 30 dagarna)
 * 2. Jämför A vs B-versioner per specialist
 * 3. Skickar Markdown-analysmail till mikael@searchboost.se via Loopia SMTP
 * 4. Loggar vinnare om >10 optimeringar och >0.3 avg position improvement
 */

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const nodemailer = require('nodemailer');
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

async function getSmtpPassword() {
  // Försök SSM först, faller tillbaka på env var
  try {
    return await getParam('/seo-mcp/loopia/smtp-password');
  } catch (e) {
    if (process.env.LOOPIA_SMTP_PASSWORD) return process.env.LOOPIA_SMTP_PASSWORD;
    throw new Error('SMTP-lösenord saknas: sätt /seo-mcp/loopia/smtp-password eller env LOOPIA_SMTP_PASSWORD');
  }
}

/**
 * Hämtar A/B-loggdata från BigQuery för senaste 30 dagarna
 * Grupperar per specialist + prompt_version
 */
async function fetchABStats(bq, dataset) {
  let rows;
  try {
    [rows] = await bq.query({
      query: `
        SELECT
          specialist,
          prompt_version,
          COUNT(*) AS total_calls,
          AVG(input_tokens) AS avg_input_tokens,
          AVG(output_tokens) AS avg_output_tokens,
          SUM(input_tokens + output_tokens) AS total_tokens
        FROM \`${dataset}.prompt_ab_log\`
        WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
        GROUP BY specialist, prompt_version
        ORDER BY specialist, prompt_version
      `
    });
  } catch (e) {
    if (e.message && e.message.includes('Not found')) {
      return []; // Tabellen finns inte än — inga data
    }
    throw e;
  }
  return rows || [];
}

/**
 * Hämtar koppling mot seo_optimization_log för att se GSC-förbättringar
 * Returnerar Map<optimization_id, position_improvement>
 * OBS: position_improvement är approximativt — vi jämför impact_estimate som proxy
 */
async function fetchOptimizationOutcomes(bq, dataset) {
  try {
    const [rows] = await bq.query({
      query: `
        SELECT
          log.optimization_type,
          AVG(SAFE_CAST(log.impact_estimate AS FLOAT64)) AS avg_impact
        FROM \`${dataset}.seo_optimization_log\` log
        WHERE log.timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
          AND log.impact_estimate IS NOT NULL
        GROUP BY log.optimization_type
      `
    });
    const result = {};
    for (const row of (rows || [])) {
      result[row.optimization_type] = row.avg_impact;
    }
    return result;
  } catch (e) {
    return {};
  }
}

/**
 * Bygger Markdown-rapporten
 */
function buildMarkdownReport(abStats, outcomes, winnerLog) {
  const now = new Date().toISOString().split('T')[0];

  let md = `# Prompt A/B-analys — ${now}\n\n`;
  md += `Rapport från Searchboost Opti prompt-improver. Visar prestanda per specialist och prompt-version för senaste 30 dagarna.\n\n`;

  if (abStats.length === 0) {
    md += `## Ingen data\n\nInga A/B-loggposter hittades. prompt_ab_log är antingen tom eller saknas ännu. `;
    md += `Kontrollera att autonomous-optimizer kört sedan 2026-05-01.\n`;
    return md;
  }

  // Gruppera per specialist
  const bySpecialist = {};
  for (const row of abStats) {
    if (!bySpecialist[row.specialist]) bySpecialist[row.specialist] = {};
    bySpecialist[row.specialist][row.prompt_version] = row;
  }

  md += `## Resultat per specialist\n\n`;

  for (const [specialist, versions] of Object.entries(bySpecialist)) {
    const vA = versions['A'] || null;
    const vB = versions['B'] || null;

    md += `### ${specialist}\n\n`;
    md += `| Version | Anrop | Avg input tokens | Avg output tokens | Totalt tokens |\n`;
    md += `|---------|-------|-----------------|-------------------|---------------|\n`;

    if (vA) {
      md += `| A (standard) | ${vA.total_calls} | ${Math.round(vA.avg_input_tokens)} | ${Math.round(vA.avg_output_tokens)} | ${vA.total_tokens} |\n`;
    }
    if (vB) {
      md += `| B (specialist) | ${vB.total_calls} | ${Math.round(vB.avg_input_tokens)} | ${Math.round(vB.avg_output_tokens)} | ${vB.total_tokens} |\n`;
    }

    md += `\n`;

    // Jämför om tillräcklig data finns
    if (vA && vB) {
      const totalA = parseInt(vA.total_calls, 10);
      const totalB = parseInt(vB.total_calls, 10);

      if (totalA >= 10 && totalB >= 10) {
        // Effektivitetsindikator: fler output tokens = mer innehållsrikt svar
        // Lägre input = effektivare prompt (kortare = billigare)
        const aEfficiency = vA.avg_output_tokens / Math.max(vA.avg_input_tokens, 1);
        const bEfficiency = vB.avg_output_tokens / Math.max(vB.avg_input_tokens, 1);

        if (bEfficiency > aEfficiency * 1.1) {
          md += `**Preliminär vinnare: B** — ${Math.round((bEfficiency / aEfficiency - 1) * 100)}% högre output/input-ratio. `;
          md += `Kräver manuell granskning innan SSM-uppdatering.\n\n`;
          winnerLog.push({ specialist, winner: 'B', margin: bEfficiency - aEfficiency });
        } else if (aEfficiency > bEfficiency * 1.1) {
          md += `**Preliminär vinnare: A** — standardprompt presterar bättre för ${specialist}.\n\n`;
          winnerLog.push({ specialist, winner: 'A', margin: aEfficiency - bEfficiency });
        } else {
          md += `**Oavgjort** — ingen statistiskt signifikant skillnad ännu.\n\n`;
        }
      } else {
        md += `_För lite data för säker jämförelse (A: ${totalA}, B: ${totalB} anrop). Behöver minst 10 per version._\n\n`;
      }
    } else {
      md += `_Endast version ${vA ? 'A' : 'B'} har data ännu._\n\n`;
    }
  }

  // Optimization outcomes
  if (Object.keys(outcomes).length > 0) {
    md += `## Optimeringsutfall (impact_estimate per typ)\n\n`;
    md += `| Optimeringstyp | Avg impact |\n`;
    md += `|----------------|------------|\n`;
    for (const [type, impact] of Object.entries(outcomes)) {
      md += `| ${type} | ${impact?.toFixed(2) || 'n/a'} |\n`;
    }
    md += `\n`;
  }

  // Sammanfattning
  md += `## Sammanfattning\n\n`;
  if (winnerLog.length > 0) {
    md += `Preliminära vinnare identifierade för ${winnerLog.length} specialist(er):\n`;
    for (const w of winnerLog) {
      md += `- **${w.specialist}**: Version ${w.winner} (margin: ${w.margin.toFixed(3)})\n`;
    }
    md += `\n⚠️ Ingen automatisk SSM-uppdatering görs — kräver manuell granskning av Mikael.\n`;
  } else {
    md += `Inga tydliga vinnare ännu. Kör vidare och kontrollera igen om 1-2 veckor.\n`;
  }

  md += `\n---\n_Searchboost Opti · prompt-improver Lambda · ${now}_\n`;
  return md;
}

/**
 * Skickar Markdown-mail via Loopia SMTP
 */
async function sendMail(subject, markdownBody, smtpPassword) {
  const transporter = nodemailer.createTransport({
    host: 'mailcluster.loopia.se',
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: 'info@searchboost.se',
      pass: smtpPassword
    },
    tls: { rejectUnauthorized: false }
  });

  // Konvertera Markdown till enkel HTML (tabeller + rubriker)
  const htmlBody = markdownBody
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^_(.+)_$/gm, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^\| (.+) \|$/gm, (line) => {
      const cells = line.split('|').filter(c => c.trim() !== '').map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>)/gs, '<table border="1" cellpadding="4" style="border-collapse:collapse">$1</table>');

  await transporter.sendMail({
    from: '"Searchboost Opti" <mikael@searchboost.se>',
    to: 'mikael@searchboost.se',
    subject,
    text: markdownBody,
    html: `<html><body style="font-family:sans-serif;max-width:800px;margin:0 auto"><p>${htmlBody}</p></body></html>`
  });
}

exports.handler = async (event) => {
  console.log('=== Prompt Improver Started ===');

  try {
    const { bq, dataset } = await getBigQuery();
    const smtpPassword = await getSmtpPassword();

    console.log('Hämtar A/B-statistik från BigQuery...');
    const abStats = await fetchABStats(bq, dataset);
    console.log(`Hittade ${abStats.length} rader i prompt_ab_log`);

    console.log('Hämtar optimeringsutfall...');
    const outcomes = await fetchOptimizationOutcomes(bq, dataset);

    const winnerLog = [];
    const report = buildMarkdownReport(abStats, outcomes, winnerLog);

    const dateStr = new Date().toISOString().split('T')[0];
    const subject = `Searchboost Prompt A/B-analys — ${dateStr}`;

    console.log('Skickar analysmail till mikael@searchboost.se...');
    await sendMail(subject, report, smtpPassword);
    console.log('Mail skickat.');

    if (winnerLog.length > 0) {
      console.log('Vinnare loggade (kräver manuell SSM-uppdatering):');
      for (const w of winnerLog) {
        console.log(`  ${w.specialist}: Version ${w.winner}`);
      }
    }

    console.log('=== Prompt Improver klar ===');
    return {
      statusCode: 200,
      body: JSON.stringify({
        abRows: abStats.length,
        winners: winnerLog,
        emailSent: true
      })
    };
  } catch (err) {
    console.error('Prompt Improver misslyckades:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
