/**
 * perispa — Performance, security & system tools
 * Core Web Vitals, server compatibility, security validation, AEO analysis, theme docs
 */

const { z } = require('zod');
const https = require('https');
const http = require('http');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

module.exports = function registerPerformanceTools(server, getSite, wpFetch) {

  server.tool('perispa_get_core_web_vitals', 'Hamta Core Web Vitals-data for en URL (via PageSpeed Insights API)', {
    url: z.string().describe('URL att testa'),
    strategy: z.string().optional().default('mobile').describe('mobile eller desktop'),
  }, async (args) => {
    try {
      const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(args.url)}&strategy=${args.strategy}&category=performance`;

      const data = await new Promise((resolve, reject) => {
        https.get(apiUrl, { rejectUnauthorized: false }, (res) => {
          let body = '';
          res.on('data', c => body += c);
          res.on('end', () => {
            try { resolve(JSON.parse(body)); } catch { reject(new Error('Invalid JSON')); }
          });
        }).on('error', reject);
      });

      const lhr = data.lighthouseResult;
      if (!lhr) return err('Kunde inte hamta Lighthouse-data');

      const audits = lhr.audits || {};
      return text({
        url: args.url,
        strategy: args.strategy,
        performance_score: Math.round((lhr.categories?.performance?.score || 0) * 100),
        core_web_vitals: {
          lcp: audits['largest-contentful-paint']?.displayValue || 'N/A',
          fid: audits['max-potential-fid']?.displayValue || 'N/A',
          cls: audits['cumulative-layout-shift']?.displayValue || 'N/A',
          fcp: audits['first-contentful-paint']?.displayValue || 'N/A',
          tbt: audits['total-blocking-time']?.displayValue || 'N/A',
          si: audits['speed-index']?.displayValue || 'N/A',
        },
        opportunities: Object.values(audits)
          .filter(a => a.details?.type === 'opportunity' && a.score !== null && a.score < 1)
          .map(a => ({ title: a.title, savings: a.displayValue, score: a.score }))
          .slice(0, 10),
        diagnostics: Object.values(audits)
          .filter(a => a.details?.type === 'table' && a.score !== null && a.score < 1)
          .map(a => ({ title: a.title, description: a.description?.slice(0, 100) }))
          .slice(0, 10),
      });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_analyze_performance', 'Analysera prestanda for en WordPress-site (server-side)', {
    site: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const start = Date.now();

      // Testa svarstid
      const [root, plugins, pages] = await Promise.all([
        wpFetch(s, '').catch(() => ({ data: {} })),
        wpFetch(s, 'wp/v2/plugins', { params: { per_page: 100 } }).catch(() => ({ data: [] })),
        wpFetch(s, 'wp/v2/pages', { params: { per_page: 5 } }).catch(() => ({ data: [] })),
      ]);

      const responseTime = Date.now() - start;
      const pluginList = Array.isArray(plugins.data) ? plugins.data : [];
      const activePlugins = pluginList.filter(p => p.status === 'active');

      // Tungvikts-plugins
      const heavyPlugins = activePlugins.filter(p => {
        const name = (p.name || '').toLowerCase();
        return ['slider revolution', 'visual composer', 'wpbakery', 'tablepress',
          'broken link checker', 'w3 total cache', 'jetpack', 'all in one seo',
          'revslider', 'layerslider'].some(h => name.includes(h));
      });

      const issues = [];
      if (responseTime > 3000) issues.push({ severity: 'high', issue: `Lang svarstid: ${responseTime}ms (bor vara <1000ms)` });
      else if (responseTime > 1500) issues.push({ severity: 'medium', issue: `Medel svarstid: ${responseTime}ms (bor vara <1000ms)` });

      if (activePlugins.length > 30) issues.push({ severity: 'high', issue: `${activePlugins.length} aktiva plugins (rekommenderat <25)` });
      else if (activePlugins.length > 20) issues.push({ severity: 'medium', issue: `${activePlugins.length} aktiva plugins` });

      if (heavyPlugins.length > 0) {
        issues.push({ severity: 'medium', issue: `Tungvikts-plugins: ${heavyPlugins.map(p => p.name).join(', ')}` });
      }

      // Kolla om caching-plugin finns
      const cachingPlugins = activePlugins.filter(p => {
        const name = (p.name || '').toLowerCase();
        return ['cache', 'litespeed', 'wp rocket', 'autoptimize', 'wp super cache', 'w3 total cache'].some(c => name.includes(c));
      });
      if (cachingPlugins.length === 0) {
        issues.push({ severity: 'medium', issue: 'Inget caching-plugin installerat' });
      }

      return text({
        site: s.slug,
        url: s.url,
        api_response_time_ms: responseTime,
        wp_version: root.data?.wp_version || 'okand',
        total_plugins: pluginList.length,
        active_plugins: activePlugins.length,
        heavy_plugins: heavyPlugins.map(p => p.name),
        caching_plugins: cachingPlugins.map(p => p.name),
        issues,
      });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_get_server_compatibility', 'Kontrollera server-kompatibilitet (PHP, MySQL, etc.)', {
    site: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);

      // WP Site Health (WP 5.2+)
      let siteHealth = null;
      try {
        const res = await wpFetch(s, 'wp-site-health/v1/tests/background-updates');
        siteHealth = res.data;
      } catch { /* Site Health API inte tillgangligt */ }

      const root = await wpFetch(s, '').catch(() => ({ data: {} }));

      return text({
        site: s.slug,
        wp_version: root.data?.wp_version || 'okand',
        site_health: siteHealth,
        rest_api: { available: true, url: `${s.url}/wp-json/` },
        authentication: { method: 'application_passwords', status: 'working' },
        note: 'PHP-version och MySQL-version kraver WP Site Health API (inte alltid tillgangligt via REST)',
      });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_validate_security', 'Sakerhetsvalidering av en WordPress-installation', {
    site: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const issues = [];

      // 1. Kolla om REST API ar exponerat
      try {
        const rootRes = await fetchUrl(`${s.url}/wp-json/`);
        if (rootRes.includes('"name"')) {
          // Kolla om anvandarlistan ar oppen
          try {
            const usersRes = await fetchUrl(`${s.url}/wp-json/wp/v2/users`);
            if (usersRes.includes('"id"')) {
              issues.push({ severity: 'medium', issue: 'Anvandarlista exponerad via REST API', fix: 'Begránsa /wp/v2/users endpointen' });
            }
          } catch { /* Bra — blockerad */ }
        }
      } catch { /* OK */ }

      // 2. Kolla wp-login
      try {
        const loginRes = await fetchUrl(`${s.url}/wp-login.php`);
        if (loginRes.includes('wp-login')) {
          issues.push({ severity: 'low', issue: 'Standard login-URL exponerad', fix: 'Anvand plugin som WPS Hide Login' });
        }
      } catch { /* OK */ }

      // 3. Kolla XML-RPC
      try {
        const xmlRpc = await fetchUrl(`${s.url}/xmlrpc.php`);
        if (xmlRpc.includes('XML-RPC server')) {
          issues.push({ severity: 'medium', issue: 'XML-RPC aktiverat (risk for brute force)', fix: 'Avaktivera via plugin eller .htaccess' });
        }
      } catch { /* OK — blockerad */ }

      // 4. Kolla readme.html (avslöjar WP-version)
      try {
        const readme = await fetchUrl(`${s.url}/readme.html`);
        if (readme.includes('WordPress')) {
          issues.push({ severity: 'low', issue: 'readme.html exponerar WordPress-version', fix: 'Ta bort /readme.html' });
        }
      } catch { /* OK */ }

      // 5. Plugin-lista
      const plugins = await wpFetch(s, 'wp/v2/plugins', { params: { per_page: 100 } }).catch(() => ({ data: [] }));
      const activePlugins = Array.isArray(plugins.data) ? plugins.data.filter(p => p.status === 'active') : [];
      const securityPlugins = activePlugins.filter(p => {
        const name = (p.name || '').toLowerCase();
        return ['wordfence', 'sucuri', 'ithemes security', 'all-in-one security', 'shield', 'wp cerber'].some(sp => name.includes(sp));
      });

      if (securityPlugins.length === 0) {
        issues.push({ severity: 'medium', issue: 'Inget sakerhetsplugin installerat', fix: 'Installera Wordfence eller Sucuri' });
      }

      const score = Math.max(0, 100 - issues.filter(i => i.severity === 'high').length * 25
        - issues.filter(i => i.severity === 'medium').length * 15
        - issues.filter(i => i.severity === 'low').length * 5);

      return text({
        site: s.slug,
        security_score: score,
        total_issues: issues.length,
        security_plugins: securityPlugins.map(p => p.name),
        issues,
      });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_get_theme_docs', 'Hamta information om det aktiva temat', {
    site: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const themes = await wpFetch(s, 'wp/v2/themes', { params: { per_page: 100 } }).catch(() => ({ data: [] }));

      const allThemes = Array.isArray(themes.data) ? themes.data : Object.values(themes.data || {});
      const activeTheme = allThemes.find(t => t.status === 'active');

      if (!activeTheme) return err('Kunde inte hitta aktivt tema');

      return text({
        name: activeTheme.name?.rendered || activeTheme.name || '',
        version: activeTheme.version || '',
        author: activeTheme.author?.rendered || activeTheme.author || '',
        description: activeTheme.description?.rendered || activeTheme.description || '',
        theme_uri: activeTheme.theme_uri || '',
        author_uri: activeTheme.author_uri || '',
        template: activeTheme.template || '',
        tags: activeTheme.tags || {},
        text_domain: activeTheme.text_domain || '',
        requires_wp: activeTheme.requires_wp || '',
        requires_php: activeTheme.requires_php || '',
      });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_analyze_aeo', 'AEO-analys (Answer Engine Optimization) — hur val sidan svarar pa fragor', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      const content = res.data.content?.raw || res.data.content?.rendered || '';
      const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      const issues = [];
      let score = 100;

      // 1. FAQ-schema
      const hasFaqSchema = content.includes('FAQPage') || content.includes('faq');
      if (!hasFaqSchema) {
        issues.push({ issue: 'Saknar FAQ-schema (viktigt for AI-svar)', fix: 'Lagg till FAQPage schema markup' });
        score -= 15;
      }

      // 2. Fragor och svar i innehall
      const questionPatterns = /(?:vad |hur |varfor |nar |vem |vilka |ar det |kan man |bor man |what |how |why |when |who )/gi;
      const questions = textContent.match(questionPatterns) || [];
      if (questions.length === 0) {
        issues.push({ issue: 'Inga fragor i innehallet', fix: 'Lagg till fragor som H2/H3 med tydliga svar' });
        score -= 15;
      }

      // 3. Definitioner / listor
      const hasList = /<[ou]l/i.test(content);
      const hasDefinition = /<dl/i.test(content) || /definition|betyder|innebar/i.test(textContent);
      if (!hasList && !hasDefinition) {
        issues.push({ issue: 'Inga listor eller definitioner', fix: 'Strukturera innehall i punktlistor for battre AI-extraktion' });
        score -= 10;
      }

      // 4. Strukturerade rubriker
      const h2Count = (content.match(/<h2/gi) || []).length;
      if (h2Count < 3 && textContent.length > 1000) {
        issues.push({ issue: 'For fa underrubriker for innehallets langd', fix: 'Lagg till H2/H3 som besvarar specifika fragor' });
        score -= 10;
      }

      // 5. Forsta stycket — sammanfattning
      const firstParagraph = textContent.slice(0, 200);
      if (firstParagraph.length < 50) {
        issues.push({ issue: 'Kort/saknas inledande sammanfattning', fix: 'Borja med en 1-2 meningars sammanfattning som besvarar huvudfragan' });
        score -= 10;
      }

      // 6. Schema markup
      const hasSchema = content.includes('application/ld+json') || content.includes('schema.org');
      if (!hasSchema) {
        issues.push({ issue: 'Ingen schema markup hittad', fix: 'Lagg till relevant schema (Article, HowTo, FAQ, etc.)' });
        score -= 10;
      }

      score = Math.max(0, Math.min(100, score));

      return text({
        page_id: args.page_id,
        aeo_score: score,
        questions_found: questions.length,
        has_faq_schema: hasFaqSchema,
        has_lists: hasList,
        has_schema: hasSchema,
        h2_count: h2Count,
        content_length: textContent.length,
        issues,
      });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_analyze_rankmath', 'Detaljerad Rank Math SEO-analys (alla meta-fallt)', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      const meta = res.data.meta || {};

      const rmMeta = {};
      for (const [key, value] of Object.entries(meta)) {
        if (key.startsWith('rank_math_')) {
          rmMeta[key.replace('rank_math_', '')] = value;
        }
      }

      // Rank Math REST API
      let rmHead = null;
      try {
        const headRes = await wpFetch(s, `rankmath/v1/getHead`, { params: { url: res.data.link } });
        rmHead = headRes.data;
      } catch { /* Rank Math REST ej tillgangligt */ }

      const issues = [];
      if (!rmMeta.title) issues.push('Ingen SEO-titel satt');
      if (!rmMeta.description) issues.push('Ingen meta description satt');
      if (!rmMeta.focus_keyword) issues.push('Inget fokus-sokord satt');
      if (rmMeta.title && rmMeta.title.length > 60) issues.push(`Titel for lang: ${rmMeta.title.length}/60`);
      if (rmMeta.description && rmMeta.description.length > 160) issues.push(`Description for lang: ${rmMeta.description.length}/160`);

      return text({
        page_id: args.page_id,
        url: res.data.link,
        rank_math_meta: rmMeta,
        rank_math_head: rmHead,
        issues,
        all_meta_keys: Object.keys(meta),
      });
    } catch (e) { return err(e.message); }
  });
};

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { rejectUnauthorized: false, timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}
