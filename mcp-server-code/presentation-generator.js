/**
 * Presentation Generator — Searchboost Opti
 *
 * Genererar reveal.js-presentationer från kunddata + Claude AI.
 * Output: Komplett HTML-fil som kan visas i browser eller exporteras till PDF.
 *
 * Inspirerad av Kimi K2.5 Slides — men byggd för Searchboost.
 */

const fs = require('fs');
const path = require('path');

// Template directory
const TEMPLATES_DIR = path.join(__dirname, '..', 'presentations', 'templates');

/**
 * Simple mustache-like template engine
 * Supports: {{var}}, {{#array}}...{{/array}}, {{.}} for array items
 */
function renderTemplate(template, data) {
  let result = template;

  // Handle array sections: {{#key}}...{{/key}}
  const sectionRegex = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
  result = result.replace(sectionRegex, (match, key, content) => {
    const arr = data[key];
    if (!arr || !Array.isArray(arr)) return '';
    return arr.map(item => {
      if (typeof item === 'string') {
        return content.replace(/\{\{\.\}\}/g, item);
      }
      // Object — replace {{key}} within section
      let rendered = content;
      for (const [k, v] of Object.entries(item)) {
        rendered = rendered.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v || '');
      }
      return rendered;
    }).join('');
  });

  // Handle simple variables: {{key}}
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' || typeof value === 'number') {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
    }
  }

  // Clean up any remaining unreplaced variables
  result = result.replace(/\{\{[^}]+\}\}/g, '');

  return result;
}

/**
 * Generate SEO Audit presentation
 * @param {Object} customerData - Data from BigQuery/API
 * @param {Object} auditData - SEO audit results
 * @param {Object} aiContent - AI-generated content from Claude
 * @returns {string} Complete HTML presentation
 */
function generateSeoAudit(customerData, auditData, aiContent) {
  const templatePath = path.join(TEMPLATES_DIR, 'seo-audit.html');
  const template = fs.readFileSync(templatePath, 'utf-8');

  const today = new Date().toISOString().split('T')[0];

  // Merge all data into template variables
  const data = {
    // Framsida
    company_name: customerData.company_name || customerData.customer_id,
    date: today,
    subtitle: aiContent.subtitle || `En komplett SEO-analys för att maximera er digitala närvaro och konvertering`,

    // Agenda
    agenda_1_desc: aiContent.agenda_1_desc || 'Er nuvarande webbplats och dess SEO-status',
    agenda_1_meta: auditData.total_pages ? `${auditData.total_pages} sidor analyserade` : 'Fullständig genomgång',
    agenda_2_desc: aiContent.agenda_2_desc || 'Kritiska områden som begränsar er synlighet',
    agenda_2_meta: auditData.total_issues ? `${auditData.total_issues} problem identifierade` : 'Teknisk + innehållsanalys',
    agenda_3_desc: aiContent.agenda_3_desc || 'Konkret åtgärdsplan för maximal SEO-impact',
    agenda_3_meta: aiContent.agenda_3_meta || 'Beprövad metodik',
    agenda_4_desc: aiContent.agenda_4_desc || 'Stegvis process med noll risk — allt i testmiljö först',
    agenda_4_meta: aiContent.agenda_4_meta || '3 månader • Tydlig ROI',

    // Chapter subtitles
    chapter_1_subtitle: aiContent.chapter_1_subtitle || 'En genomgång av er nuvarande digitala närvaro och potential',
    chapter_2_subtitle: aiContent.chapter_2_subtitle || 'Tekniska och innehållsmässiga hinder som påverkar er ranking',
    chapter_3_subtitle: aiContent.chapter_3_subtitle || 'En beprövad metodik anpassad för er bransch och era mål',
    chapter_4_subtitle: aiContent.chapter_4_subtitle || 'Konkreta siffror på vad optimering ger er verksamhet',

    // Stats
    stat_pages: auditData.total_pages || '—',
    stat_articles: auditData.stat_articles || '—',
    stat_articles_label: auditData.stat_articles_label || 'Sidor',
    stat_articles_detail: auditData.stat_articles_detail || 'Analyserade URL:er',
    stat_extra1: auditData.stat_extra1 || '—',
    stat_extra1_label: auditData.stat_extra1_label || 'Problem',
    stat_extra1_detail: auditData.stat_extra1_detail || 'Identifierade',
    stat_extra2: auditData.stat_extra2 || '—',
    stat_extra2_label: auditData.stat_extra2_label || 'Möjligheter',
    stat_extra2_detail: auditData.stat_extra2_detail || 'Förbättringar',

    // Core problem
    core_problem: aiContent.core_problem || 'Sajten har potential men tekniska brister hindrar er från att nå full synlighet i Google.',
    comparison_current: aiContent.comparison_current || 'Nuvarande SEO-struktur med brister',
    comparison_optimal: aiContent.comparison_optimal || 'Optimerad struktur med maximal synlighet',

    // Problems
    critical_problems: aiContent.critical_problems || [],
    warning_problems: aiContent.warning_problems || [],

    // Action plan
    month1_title: aiContent.month1_title || 'Teknisk grund',
    month1_tasks: aiContent.month1_tasks || ['Teknisk SEO-audit', 'Åtgärda kritiska fel', 'Metadata-optimering'],
    month2_title: aiContent.month2_title || 'Innehållsoptimering',
    month2_tasks: aiContent.month2_tasks || ['On-page SEO', 'Innehållsförbättringar', 'Schema markup'],
    month3_title: aiContent.month3_title || 'Tillväxt',
    month3_tasks: aiContent.month3_tasks || ['Länkstrategi', 'Konverteringsoptimering', 'Uppföljning & rapport'],

    // ROI
    roi_items: aiContent.roi_items || [],
    roi_benefits: aiContent.roi_benefits || [
      'Förbättrad teknisk SEO-grund',
      'Toppositioner i Google',
      'Skalbar struktur för framtiden',
      'Ökad konverteringsgrad'
    ],
    roi_yearly: aiContent.roi_yearly || '—',
    roi_monthly: aiContent.roi_monthly || '—',
    roi_multiplier: aiContent.roi_multiplier || '—',
    roi_calc: aiContent.roi_calc || '',

    // Pricing
    pricing_package_name: aiContent.pricing_package_name || 'SEO-paket',
    pricing_items: aiContent.pricing_items || [],
    pricing_includes: aiContent.pricing_includes || [],
    total_price: aiContent.total_price || '—',
    timeline: aiContent.timeline || '3 veckor',

    // Contact
    contact_phone: customerData.contact_phone || ''
  };

  return renderTemplate(template, data);
}

/**
 * Generate presentation using Claude AI for content
 * @param {Object} anthropic - Anthropic client
 * @param {Object} customerData - Customer info
 * @param {Object} auditData - Audit results
 * @returns {string} Complete HTML
 */
async function generateWithAI(anthropic, customerData, auditData) {
  const prompt = `Du är en SEO-expert på Searchboost.se. Generera presentationsinnehåll för en SEO-audit-presentation till kunden "${customerData.company_name}" (${customerData.website}).

Baserat på audit-data:
- Antal sidor: ${auditData.total_pages || 'okänt'}
- Problem hittade: ${JSON.stringify(auditData.issues || [], null, 2)}
- Keywords: ${JSON.stringify(auditData.keywords || [], null, 2)}

Returnera JSON med exakt dessa fält:
{
  "subtitle": "Kort tagline för framsidan (max 15 ord)",
  "agenda_1_desc": "Beskrivning av nuvarande situation (max 15 ord)",
  "agenda_2_desc": "Beskrivning av problem (max 15 ord)",
  "agenda_3_desc": "Beskrivning av lösning (max 15 ord)",
  "agenda_4_desc": "Beskrivning av implementering (max 15 ord)",
  "chapter_1_subtitle": "Undertitel kapitel 1 (max 15 ord)",
  "chapter_2_subtitle": "Undertitel kapitel 2 (max 15 ord)",
  "chapter_3_subtitle": "Undertitel kapitel 3 (max 15 ord)",
  "chapter_4_subtitle": "Undertitel kapitel 4 (max 15 ord)",
  "core_problem": "Huvudproblemet i en mening",
  "comparison_current": "Kort beskrivning av nuvarande situation",
  "comparison_optimal": "Kort beskrivning av optimal situation",
  "critical_problems": [
    {"title": "Problem 1", "description": "Kort beskrivning"},
    {"title": "Problem 2", "description": "Kort beskrivning"},
    {"title": "Problem 3", "description": "Kort beskrivning"}
  ],
  "warning_problems": [
    {"title": "Problem 1", "description": "Kort beskrivning"},
    {"title": "Problem 2", "description": "Kort beskrivning"},
    {"title": "Problem 3", "description": "Kort beskrivning"}
  ],
  "month1_title": "Titel för månad 1",
  "month1_tasks": ["Uppgift 1", "Uppgift 2", "Uppgift 3", "Uppgift 4"],
  "month2_title": "Titel för månad 2",
  "month2_tasks": ["Uppgift 1", "Uppgift 2", "Uppgift 3", "Uppgift 4"],
  "month3_title": "Titel för månad 3",
  "month3_tasks": ["Uppgift 1", "Uppgift 2", "Uppgift 3", "Uppgift 4"],
  "roi_items": [
    {"label": "Extra organisk trafik/mån", "detail": "Via SEO-optimering", "value": "+X 000", "unit": "besökare", "color": "var(--sb-pink)"},
    {"label": "Konverteringsgrad", "detail": "Till förfrågan/köp", "value": "X%", "unit": "konservativt", "color": "var(--sb-cyan)"},
    {"label": "Extra leads/mån", "detail": "Beräkning", "value": "XX", "unit": "leads", "color": "var(--sb-green)"},
    {"label": "Snittordervärde", "detail": "Per lead/kund", "value": "~X 000", "unit": "kr", "color": "var(--sb-purple)"}
  ],
  "roi_benefits": ["Fördel 1", "Fördel 2", "Fördel 3", "Fördel 4", "Fördel 5"],
  "roi_yearly": "XXX 000",
  "roi_monthly": "XX 000",
  "roi_multiplier": "Xx",
  "roi_calc": "XXX 000 kr / investering",
  "pricing_package_name": "Paketnamn",
  "pricing_items": [
    {"icon": "🔧", "icon_color": "233,30,140", "name": "Tjänst 1", "description": "Kort beskrivning", "price": "X XXX kr", "price_class": "pink"},
    {"icon": "📝", "icon_color": "0,212,255", "name": "Tjänst 2", "description": "Kort beskrivning", "price": "X XXX kr", "price_class": "cyan"},
    {"icon": "📊", "icon_color": "0,230,118", "name": "Tjänst 3", "description": "Kort beskrivning", "price": "X XXX kr", "price_class": "green"}
  ],
  "pricing_includes": ["Inkluderat 1", "Inkluderat 2", "Inkluderat 3", "Inkluderat 4", "Inkluderat 5"],
  "total_price": "XX XXX",
  "timeline": "X veckor"
}

Var realistisk med siffror baserat på bransch. Svara ENBART med JSON, ingen annan text.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.content[0].text;
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in AI response');

    const aiContent = JSON.parse(jsonMatch[0]);
    return generateSeoAudit(customerData, auditData, aiContent);
  } catch (err) {
    console.error('AI generation failed, using defaults:', err.message);
    return generateSeoAudit(customerData, auditData, {});
  }
}

/**
 * List available templates
 */
function listTemplates() {
  const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.html'));
  return files.map(f => ({
    id: f.replace('.html', ''),
    name: f.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    path: path.join(TEMPLATES_DIR, f)
  }));
}

module.exports = {
  generateSeoAudit,
  generateWithAI,
  listTemplates,
  renderTemplate
};
