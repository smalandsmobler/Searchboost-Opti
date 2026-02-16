/**
 * Weekly Report Lambda — Körs varje fredag 15:00 UTC (16:00 CET)
 * EventBridge: cron(0 15 ? * FRI *)
 *
 * Skickar:
 *   1. Per-kund veckologg till varje kund med utfört arbete (kundfacing ton)
 *   2. Intern sammanfattning till Mikael (alla kunder i ett mail)
 *
 * Datakällor:
 *   - BigQuery: seo_optimization_log (senaste 7 dagar)
 *   - BigQuery: seo_work_queue (köstatus)
 *   - BigQuery: customer_pipeline (aktiva kunder)
 *   - SSM: kontaktuppgifter per kund
 *   - Trello: DONE-kort (senaste 7 dagar)
 */
const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { BigQuery } = require('@google-cloud/bigquery');
const axios = require('axios');
const fs = require('fs');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });
const ses = new SESClient({ region: REGION });

async function getParam(name) {
  const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return res.Parameter.Value;
}

async function getParamsByPath(path) {
  const params = {};
  let nextToken;
  do {
    const res = await ssm.send(new GetParametersByPathCommand({
      Path: path,
      Recursive: true,
      WithDecryption: true,
      ...(nextToken ? { NextToken: nextToken } : {})
    }));
    for (const p of (res.Parameters || [])) {
      const key = p.Name.replace(path, '').replace(/^\//, '');
      params[key] = p.Value;
    }
    nextToken = res.NextToken;
  } while (nextToken);
  return params;
}

async function getBigQuery() {
  const wifConfig = await getParam('/seo-mcp/bigquery/credentials');
  const projectId = await getParam('/seo-mcp/bigquery/project-id');
  const dataset = await getParam('/seo-mcp/bigquery/dataset');
  fs.writeFileSync('/tmp/wif-config.json', wifConfig);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/wif-config.json';
  return { bq: new BigQuery({ projectId }), dataset };
}

/**
 * Hämta alla aktiva kunder med kontaktuppgifter från SSM
 */
async function getActiveCustomers() {
  const customers = [];

  // Hämta alla WordPress-kunder (de som har en URL i SSM)
  const wpParams = await getParamsByPath('/seo-mcp/wordpress/');

  // Gruppera per kund-ID
  const customerIds = new Set();
  for (const key of Object.keys(wpParams)) {
    const customerId = key.split('/')[0];
    if (customerId && customerId !== 'undefined') {
      customerIds.add(customerId);
    }
  }

  // Hämta kontaktuppgifter för varje kund
  for (const customerId of customerIds) {
    try {
      const integrations = await getParamsByPath(`/seo-mcp/integrations/${customerId}/`);
      const wpUrl = wpParams[`${customerId}/url`];

      customers.push({
        customer_id: customerId,
        contact_email: integrations['contact-email'] || null,
        contact_person: integrations['contact-person'] || null,
        company_name: integrations['company-name'] || customerId,
        site_url: wpUrl || null,
        gsc_property: integrations['gsc-property'] || null
      });
    } catch (e) {
      console.log(`Kunde inte hämta data för ${customerId}: ${e.message}`);
    }
  }

  return customers;
}

async function getTrelloDoneCards() {
  try {
    const apiKey = await getParam('/seo-mcp/trello/api-key');
    const token = await getParam('/seo-mcp/trello/token');
    const boardId = await getParam('/seo-mcp/trello/board-id');

    const listsRes = await axios.get(`https://api.trello.com/1/boards/${boardId}/lists`, {
      params: { key: apiKey, token }
    });
    const doneList = listsRes.data.find(l => l.name.toLowerCase().includes('done'));
    if (!doneList) {
      console.log('No DONE list found on Trello board');
      return [];
    }

    const cardsRes = await axios.get(`https://api.trello.com/1/lists/${doneList.id}/cards`, {
      params: { key: apiKey, token, fields: 'name,desc,dateLastActivity' }
    });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return cardsRes.data.filter(card => new Date(card.dateLastActivity) >= sevenDaysAgo);
  } catch (err) {
    console.error('Trello fetch error:', err.message);
    return [];
  }
}

function extractCustomerFromCard(card) {
  const nameMatch = card.name.match(/SEO:\s*(\S+)/i);
  if (nameMatch) return nameMatch[1];
  const descMatch = (card.desc || '').match(/\*\*Kund:\*\*\s*(\S+)/);
  if (descMatch) return descMatch[1];
  return 'ospecificerad';
}

/**
 * Matcha optimeringar till kunder baserat på customer_id eller site_url
 */
function groupByCustomer(optimizations, trelloCards, customers) {
  const groups = {};

  // Initiera grupper för alla kunder
  for (const customer of customers) {
    groups[customer.customer_id] = {
      customer,
      optimizations: [],
      trelloCards: []
    };
  }

  // Gruppera optimeringar — matcha på customer_id eller site_url
  for (const opt of optimizations) {
    let matched = false;

    // Först: matcha på customer_id direkt
    if (opt.customer_id && groups[opt.customer_id]) {
      groups[opt.customer_id].optimizations.push(opt);
      matched = true;
    }

    // Fallback: matcha på site_url
    if (!matched && opt.site_url) {
      for (const customer of customers) {
        if (customer.site_url && opt.site_url.includes(customer.site_url.replace(/https?:\/\//, '').replace(/\/$/, ''))) {
          groups[customer.customer_id].optimizations.push(opt);
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      // Ospecificerad kund
      if (!groups['_unmatched']) {
        groups['_unmatched'] = { customer: { customer_id: '_unmatched', company_name: 'Ospecificerad' }, optimizations: [], trelloCards: [] };
      }
      groups['_unmatched'].optimizations.push(opt);
    }
  }

  // Gruppera Trello-kort
  for (const card of trelloCards) {
    const cardCustomer = extractCustomerFromCard(card);
    let matched = false;
    for (const customer of customers) {
      if (cardCustomer.includes(customer.customer_id) || customer.customer_id.includes(cardCustomer)) {
        groups[customer.customer_id].trelloCards.push(card);
        matched = true;
        break;
      }
    }
    if (!matched) {
      if (!groups['_unmatched']) {
        groups['_unmatched'] = { customer: { customer_id: '_unmatched', company_name: 'Ospecificerad' }, optimizations: [], trelloCards: [] };
      }
      groups['_unmatched'].trelloCards.push(card);
    }
  }

  return groups;
}

// ── Kundfacing veckologg-HTML ──
function buildCustomerReportHTML(customer, optimizations, trelloCards, weekLabel) {
  const name = customer.contact_person || 'ni';
  const site = customer.site_url || customer.company_name;
  const totalWork = optimizations.length + trelloCards.length;

  const optRows = optimizations.map(o => {
    const type = formatOptType(o.optimization_type);
    const page = truncate(o.page_url || '', 60);
    const description = o.claude_reasoning ? truncate(o.claude_reasoning, 100) : '';
    return `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px">${type}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:14px">${escapeHtml(page)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#666">${escapeHtml(description)}</td>
    </tr>`;
  }).join('');

  const trelloRows = trelloCards.map(c =>
    `<li style="margin-bottom:6px;font-size:14px">${escapeHtml(c.name)}</li>`
  ).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;color:#0e0c19;background:#fff">
  <div style="background:#db007f;padding:24px;text-align:center">
    <h1 style="color:white;margin:0;font-size:22px">Veckologg SEO</h1>
    <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">${weekLabel}</p>
  </div>

  <div style="padding:24px">
    <p style="font-size:16px;line-height:1.6">Hej ${escapeHtml(name)}!</p>

    <p style="font-size:15px;line-height:1.6">Här är en sammanfattning av vad vi gjort på <strong>${escapeHtml(site)}</strong> denna vecka:</p>

    ${optimizations.length > 0 ? `
    <table style="width:100%;border-collapse:collapse;margin:20px 0">
      <tr style="background:#f8f9fa">
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#999;text-transform:uppercase;border-bottom:2px solid #db007f">Åtgärd</th>
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#999;text-transform:uppercase;border-bottom:2px solid #db007f">Sida</th>
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#999;text-transform:uppercase;border-bottom:2px solid #db007f">Beskrivning</th>
      </tr>
      ${optRows}
    </table>` : ''}

    ${trelloCards.length > 0 ? `
    <div style="margin:16px 0">
      <h3 style="font-size:15px;color:#0e0c19;margin-bottom:8px">Övriga uppgifter</h3>
      <ul style="margin:0;padding-left:20px">${trelloRows}</ul>
    </div>` : ''}

    <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:20px 0;text-align:center">
      <span style="font-size:28px;font-weight:700;color:#db007f">${totalWork}</span>
      <span style="font-size:15px;color:#666;margin-left:8px">${totalWork === 1 ? 'åtgärd' : 'åtgärder'} denna vecka</span>
    </div>

    <p style="font-size:15px;line-height:1.6;margin-top:24px">Har ni frågor eller funderingar? Svara direkt på detta mail!</p>

    <p style="font-size:15px;line-height:1.6;margin-top:24px">Med vänliga hälsningar,<br><strong>Mikael i Searchboost-teamet</strong></p>
  </div>

  <div style="background:#f8f9fa;padding:16px;text-align:center;font-size:12px;color:#999">
    <p style="margin:0">Searchboost — SEO som levererar resultat</p>
    <p style="margin:4px 0 0"><a href="https://searchboost.nu" style="color:#db007f;text-decoration:none">searchboost.nu</a></p>
  </div>
</body>
</html>`;
}

// ── Intern sammanfattning (Mikaels mail) ──
function buildInternalReportHTML(groups, optimizations, trelloCards, queueStats, weekLabel) {
  const totalOpts = optimizations.length;
  const totalCards = trelloCards.length;

  // Filtrera bort _unmatched och tomma grupper
  const activeGroups = Object.entries(groups)
    .filter(([id, g]) => g.optimizations.length > 0 || g.trelloCards.length > 0)
    .sort((a, b) => (b[1].optimizations.length + b[1].trelloCards.length) - (a[1].optimizations.length + a[1].trelloCards.length));

  const customerSections = activeGroups.map(([customerId, data]) => {
    const displayName = data.customer.company_name || customerId;
    const email = data.customer.contact_email || '—';

    const optRows = data.optimizations.map(o =>
      `<tr><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-size:13px">${formatOptType(o.optimization_type)}</td>` +
      `<td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;font-size:13px">${truncate(o.page_url || '', 50)}</td></tr>`
    ).join('');

    const trelloRows = data.trelloCards.map(c =>
      `<li style="margin-bottom:4px;font-size:13px">${escapeHtml(c.name)}</li>`
    ).join('');

    const emailStatus = data.customer.contact_email ? '✅ Mail skickat' : '⚠️ Inget kundmail';

    return `
    <div style="margin-bottom:24px;border:1px solid #e8e8e8;border-radius:8px;overflow:hidden">
      <div style="background:#f8f9fa;padding:12px 16px;border-bottom:1px solid #e8e8e8">
        <strong style="font-size:15px">${escapeHtml(displayName)}</strong>
        <span style="float:right;font-size:13px;color:#666">${data.optimizations.length} opt. | ${data.trelloCards.length} kort | ${emailStatus}</span>
      </div>
      <div style="padding:12px 16px">
        <div style="font-size:12px;color:#999;margin-bottom:8px">Kontakt: ${escapeHtml(email)}</div>
        ${data.optimizations.length > 0 ? `
        <table style="width:100%;border-collapse:collapse;margin-bottom:8px">
          <tr><th style="padding:6px 8px;text-align:left;font-size:12px;color:#999;text-transform:uppercase">Typ</th><th style="padding:6px 8px;text-align:left;font-size:12px;color:#999;text-transform:uppercase">Sida</th></tr>
          ${optRows}
        </table>` : ''}
        ${data.trelloCards.length > 0 ? `
        <div style="margin-top:8px">
          <div style="font-size:12px;color:#999;text-transform:uppercase;margin-bottom:4px">Trello (DONE)</div>
          <ul style="margin:0;padding-left:20px">${trelloRows}</ul>
        </div>` : ''}
      </div>
    </div>`;
  }).join('');

  const customersWithWork = activeGroups.filter(([id]) => id !== '_unmatched').length;
  const customersWithEmail = activeGroups.filter(([id, g]) => id !== '_unmatched' && g.customer.contact_email).length;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;color:#0e0c19;background:#fff">
  <div style="background:#db007f;padding:24px;text-align:center">
    <h1 style="color:white;margin:0;font-size:24px">Searchboost Opti</h1>
    <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">Intern veckologg — ${weekLabel}</p>
  </div>

  <div style="padding:24px">
    <table style="width:100%;margin-bottom:24px" cellspacing="0" cellpadding="0">
      <tr>
        <td style="width:25%;text-align:center;background:#f8f9fa;border-radius:8px;padding:16px">
          <div style="font-size:32px;font-weight:700;color:#db007f">${totalOpts}</div>
          <div style="font-size:13px;color:#666">Optimeringar</div>
        </td>
        <td style="width:4px"></td>
        <td style="width:25%;text-align:center;background:#f8f9fa;border-radius:8px;padding:16px">
          <div style="font-size:32px;font-weight:700;color:#db007f">${totalCards}</div>
          <div style="font-size:13px;color:#666">Trello-kort</div>
        </td>
        <td style="width:4px"></td>
        <td style="width:25%;text-align:center;background:#f8f9fa;border-radius:8px;padding:16px">
          <div style="font-size:32px;font-weight:700;color:#db007f">${customersWithWork}</div>
          <div style="font-size:13px;color:#666">Kunder</div>
        </td>
        <td style="width:4px"></td>
        <td style="width:25%;text-align:center;background:#f8f9fa;border-radius:8px;padding:16px">
          <div style="font-size:32px;font-weight:700;color:#db007f">${customersWithEmail}</div>
          <div style="font-size:13px;color:#666">Kundmail</div>
        </td>
      </tr>
    </table>

    <h2 style="color:#0e0c19;font-size:18px;border-bottom:2px solid #db007f;padding-bottom:8px">Per kund</h2>
    ${customerSections || '<p style="color:#999">Inget arbete loggat denna vecka.</p>'}

    ${queueStats.pending ? `
    <div style="margin-top:16px;padding:12px 16px;background:#fff8e1;border-left:4px solid #ffa000;border-radius:4px;font-size:13px">
      <strong>${queueStats.pending}</strong> uppgifter i kö för kommande vecka
    </div>` : ''}
  </div>

  <div style="background:#f8f9fa;padding:16px;text-align:center;font-size:12px;color:#999">
    <p style="margin:0">Searchboost Opti — Intern veckologg</p>
    <p style="margin:4px 0 0">searchboost.nu</p>
  </div>
</body>
</html>`;
}

function formatOptType(type) {
  const types = {
    'short_title': 'Förlängde titel',
    'long_title': 'Kortade ner titel',
    'thin_content': 'Utökade innehåll',
    'missing_h1': 'La till H1-rubrik',
    'no_internal_links': 'La till interna länkar',
    'missing_alt_text': 'La till alt-text på bilder',
    'no_schema': 'La till schema markup',
    'metadata': 'Optimerade metadata',
    'title': 'Optimerade sidtitel',
    'description': 'Skrev meta-beskrivning',
    'faq_schema': 'La till FAQ-schema',
    'internal_links': 'Förbättrade intern länkning',
    'content': 'Innehållsoptimering',
    'schema': 'La till schema markup',
    'technical': 'Teknisk SEO-fix',
    'manual': 'Manuell åtgärd'
  };
  return types[type] || type || 'SEO-optimering';
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function truncate(str, max) {
  return str.length > max ? str.substring(0, max) + '...' : str;
}

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}

exports.handler = async (event) => {
  console.log('=== Weekly Report (Friday) Started ===');

  try {
    const { bq, dataset } = await getBigQuery();
    const emailFrom = await getParam('/seo-mcp/email/from');
    const mikaelEmail = (await getParam('/seo-mcp/email/recipients')).split(',').map(e => e.trim());

    // Hämta data parallellt
    const [optimizationsResult, queueResult, trelloCards, customers] = await Promise.all([
      bq.query({
        query: `SELECT * FROM \`${dataset}.seo_optimization_log\` WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY) ORDER BY timestamp DESC`
      }),
      bq.query({
        query: `SELECT status, COUNT(*) as count FROM \`${dataset}.seo_work_queue\` GROUP BY status`
      }),
      getTrelloDoneCards(),
      getActiveCustomers()
    ]);

    const optimizations = optimizationsResult[0];
    const queueStats = {};
    for (const row of queueResult[0]) {
      queueStats[row.status] = row.count;
    }

    const now = new Date();
    const weekLabel = `Vecka ${getWeekNumber(now)}, ${now.getFullYear()}`;

    // Gruppera per kund
    const groups = groupByCustomer(optimizations, trelloCards, customers);

    console.log(`Hittade ${optimizations.length} optimeringar, ${trelloCards.length} Trello-kort, ${customers.length} kunder`);

    // ── 1. Per-kund veckologgar ──
    const customerResults = [];
    for (const [customerId, group] of Object.entries(groups)) {
      // Skippa unmatched och kunder utan arbete
      if (customerId === '_unmatched') continue;
      if (group.optimizations.length === 0 && group.trelloCards.length === 0) continue;
      // Skippa kunder utan e-post
      if (!group.customer.contact_email) {
        console.log(`Skipping ${customerId}: ingen contact_email`);
        customerResults.push({ customer_id: customerId, sent: false, reason: 'no_email' });
        continue;
      }
      // Skippa searchboost (intern)
      if (customerId === 'searchboost') {
        console.log(`Skipping searchboost (intern)`);
        continue;
      }

      const customerHtml = buildCustomerReportHTML(
        group.customer,
        group.optimizations,
        group.trelloCards,
        weekLabel
      );

      try {
        await ses.send(new SendEmailCommand({
          Source: emailFrom,
          Destination: {
            ToAddresses: [group.customer.contact_email],
            BccAddresses: mikaelEmail
          },
          ReplyToAddresses: mikaelEmail,
          Message: {
            Subject: { Data: `Veckologg SEO — ${group.customer.company_name} — ${weekLabel}`, Charset: 'UTF-8' },
            Body: { Html: { Data: customerHtml, Charset: 'UTF-8' } }
          }
        }));

        console.log(`✅ Kundmail skickat till ${group.customer.contact_email} (${customerId})`);
        customerResults.push({ customer_id: customerId, sent: true, email: group.customer.contact_email });

        // Spara per-kund rapport i BigQuery
        await bq.query({
          query: `INSERT INTO \`${dataset}.weekly_reports\` (email_sent_at, customer_id, report_html, metrics_json, recipient_list)
                  VALUES (CURRENT_TIMESTAMP(), @customer_id, @report_html, @metrics_json, @recipient_list)`,
          params: {
            customer_id: customerId,
            report_html: customerHtml,
            metrics_json: JSON.stringify({
              optimizations: group.optimizations.length,
              trelloCards: group.trelloCards.length,
              total: group.optimizations.length + group.trelloCards.length
            }),
            recipient_list: group.customer.contact_email
          }
        });
      } catch (emailErr) {
        console.error(`❌ Kunde inte skicka till ${group.customer.contact_email}: ${emailErr.message}`);
        customerResults.push({ customer_id: customerId, sent: false, reason: emailErr.message, email: group.customer.contact_email });
      }
    }

    // ── 2. Intern sammanfattning till Mikael ──
    const internalHtml = buildInternalReportHTML(groups, optimizations, trelloCards, queueStats, weekLabel);

    await ses.send(new SendEmailCommand({
      Source: emailFrom,
      Destination: { ToAddresses: mikaelEmail },
      Message: {
        Subject: { Data: `Intern veckologg SEO — ${weekLabel} — ${optimizations.length} optimeringar, ${trelloCards.length} kort`, Charset: 'UTF-8' },
        Body: { Html: { Data: internalHtml, Charset: 'UTF-8' } }
      }
    }));

    // Spara intern rapport
    await bq.query({
      query: `INSERT INTO \`${dataset}.weekly_reports\` (email_sent_at, customer_id, report_html, metrics_json, recipient_list)
              VALUES (CURRENT_TIMESTAMP(), @customer_id, @report_html, @metrics_json, @recipient_list)`,
      params: {
        customer_id: 'internal',
        report_html: internalHtml,
        metrics_json: JSON.stringify({
          total: optimizations.length,
          trelloCards: trelloCards.length,
          queueStats,
          customerResults
        }),
        recipient_list: mikaelEmail.join(', ')
      }
    });

    const sentCount = customerResults.filter(r => r.sent).length;
    const failedCount = customerResults.filter(r => !r.sent).length;

    console.log(`=== Klart! ${sentCount} kundmail skickade, ${failedCount} misslyckade, intern rapport skickad till ${mikaelEmail.join(', ')} ===`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        sent: true,
        internalReport: { recipients: mikaelEmail },
        customerReports: customerResults,
        summary: { optimizations: optimizations.length, trelloCards: trelloCards.length, customers: customers.length }
      })
    };
  } catch (err) {
    console.error('Report failed:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
