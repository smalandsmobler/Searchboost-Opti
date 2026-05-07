/**
 * perispa — Report generator tools
 * Multi-site SEO-rapporter, veckosammanfattningar och markdown-export
 */

const { z } = require('zod');
const https = require('https');
const fs = require('fs');
const path = require('path');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Hamta PageSpeed-score for en URL
 */
function getPageSpeed(url) {
  return new Promise((resolve) => {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance`;
    https.get(apiUrl, { rejectUnauthorized: false, timeout: 30000 }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          const lhr = data.lighthouseResult;
          if (!lhr) return resolve(null);
          resolve({
            performance_score: Math.round((lhr.categories?.performance?.score || 0) * 100),
            lcp: lhr.audits?.['largest-contentful-paint']?.displayValue || 'N/A',
            cls: lhr.audits?.['cumulative-layout-shift']?.displayValue || 'N/A',
            tbt: lhr.audits?.['total-blocking-time']?.displayValue || 'N/A',
            fcp: lhr.audits?.['first-contentful-paint']?.displayValue || 'N/A',
          });
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

/**
 * Kor en mini-audit pa alla sidor (saknad meta, tunt innehall, saknad H1)
 */
async function miniAudit(wpFetch, site, contentType = 'pages') {
  const issues = [];
  let page = 1;
  let totalPages = 1;
  let totalItems = 0;

  while (page <= totalPages && page <= 5) { // Max 5 sidor (500 items)
    try {
      const res = await wpFetch(site, `wp/v2/${contentType}`, {
        params: { per_page: 100, page, status: 'publish', context: 'edit' },
      });

      if (!Array.isArray(res.data)) break;
      totalItems += res.data.length;
      totalPages = res.totalPages || 1;

      for (const p of res.data) {
        const meta = p.meta || {};
        const content = p.content?.raw || p.content?.rendered || '';
        const title = meta.rank_math_title || meta._yoast_wpseo_title || '';
        const desc = meta.rank_math_description || meta._yoast_wpseo_metadesc || '';
        const plainText = stripTags(content);
        const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;
        const hasH1 = /<h1/i.test(content);
        const pageIssues = [];

        if (!title) pageIssues.push('saknar_seo_titel');
        if (!desc) pageIssues.push('saknar_meta_desc');
        if (wordCount < 300) pageIssues.push(`tunt_innehall_${wordCount}_ord`);
        if (!hasH1) pageIssues.push('saknar_h1');

        if (pageIssues.length > 0) {
          issues.push({
            id: p.id,
            title: p.title?.raw || p.title?.rendered || '',
            slug: p.slug,
            type: contentType === 'pages' ? 'page' : 'post',
            word_count: wordCount,
            issues: pageIssues,
          });
        }
      }

      page++;
    } catch {
      break;
    }
  }

  return { issues, totalItems };
}

module.exports = function registerReportTools(server, getSite, wpFetch) {

  // --- Site Report ---
  server.tool('perispa_site_report', 'Generera en komplett SEO-rapport for en WordPress-site', {
    site: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);

      // Hamta grunddata parallellt
      const [rootRes, pluginRes, themeRes, pageCount, postCount, pageSpeedData] = await Promise.all([
        wpFetch(s, '').catch(() => ({ data: {} })),
        wpFetch(s, 'wp/v2/plugins', { params: { per_page: 100 } }).catch(() => ({ data: [] })),
        wpFetch(s, 'wp/v2/themes', { params: { per_page: 100 } }).catch(() => ({ data: [] })),
        wpFetch(s, 'wp/v2/pages', { params: { per_page: 1, status: 'publish' } }).catch(() => ({ total: 0 })),
        wpFetch(s, 'wp/v2/posts', { params: { per_page: 1, status: 'publish' } }).catch(() => ({ total: 0 })),
        getPageSpeed(s.url),
      ]);

      const plugins = Array.isArray(pluginRes.data) ? pluginRes.data : [];
      const activePlugins = plugins.filter(p => p.status === 'active');
      const activeTheme = Array.isArray(themeRes.data)
        ? themeRes.data.find(t => t.status === 'active')
        : Object.values(themeRes.data || {}).find(t => t.status === 'active');

      // Kor mini-audit
      const [pageAudit, postAudit] = await Promise.all([
        miniAudit(wpFetch, s, 'pages'),
        miniAudit(wpFetch, s, 'posts'),
      ]);

      const allIssues = [...pageAudit.issues, ...postAudit.issues];
      const totalContent = pageAudit.totalItems + postAudit.totalItems;
      const pagesWithIssues = allIssues.length;

      // Rakna issue-typer
      const issueCounts = {};
      for (const item of allIssues) {
        for (const issue of item.issues) {
          const key = issue.replace(/_\d+_ord$/, '');
          issueCounts[key] = (issueCounts[key] || 0) + 1;
        }
      }

      // Berakna SEO-score
      let score = 100;
      score -= (issueCounts.saknar_seo_titel || 0) * 3;
      score -= (issueCounts.saknar_meta_desc || 0) * 2;
      score -= (issueCounts.saknar_h1 || 0) * 3;
      score -= (issueCounts.tunt_innehall || 0) * 1;
      if (pageSpeedData && pageSpeedData.performance_score < 50) score -= 10;
      score = Math.max(0, Math.min(100, score));

      // Styrkor
      const strengths = [];
      if (plugins.some(p => p.plugin?.includes('rank-math') || p.name?.includes('Rank Math'))) {
        strengths.push('Rank Math SEO-plugin installerat');
      }
      if (plugins.some(p => p.plugin?.includes('yoast') || p.name?.includes('Yoast'))) {
        strengths.push('Yoast SEO-plugin installerat');
      }
      if (pageSpeedData && pageSpeedData.performance_score >= 70) {
        strengths.push(`Bra PageSpeed-score: ${pageSpeedData.performance_score}/100`);
      }
      if (totalContent > 20) strengths.push(`Bra mangd innehall: ${totalContent} sidor/inlagg`);
      if (pagesWithIssues === 0) strengths.push('Inga SEO-problem hittade');

      // Svagheter
      const weaknesses = [];
      if (issueCounts.saknar_seo_titel > 0) weaknesses.push(`${issueCounts.saknar_seo_titel} sidor saknar SEO-titel`);
      if (issueCounts.saknar_meta_desc > 0) weaknesses.push(`${issueCounts.saknar_meta_desc} sidor saknar meta description`);
      if (issueCounts.saknar_h1 > 0) weaknesses.push(`${issueCounts.saknar_h1} sidor saknar H1-rubrik`);
      if (issueCounts.tunt_innehall > 0) weaknesses.push(`${issueCounts.tunt_innehall} sidor har tunt innehall (<300 ord)`);
      if (pageSpeedData && pageSpeedData.performance_score < 50) {
        weaknesses.push(`Lag PageSpeed-score: ${pageSpeedData.performance_score}/100`);
      }
      if (activePlugins.length > 20) weaknesses.push(`Manga aktiva plugins: ${activePlugins.length}`);

      // Rekommendationer
      const recommendations = [];
      if (issueCounts.saknar_seo_titel > 0) recommendations.push('Lagg till SEO-titlar pa alla sidor (max 60 tecken)');
      if (issueCounts.saknar_meta_desc > 0) recommendations.push('Skriv meta descriptions pa alla sidor (70-155 tecken)');
      if (issueCounts.saknar_h1 > 0) recommendations.push('Se till att varje sida har exakt en H1-rubrik');
      if (issueCounts.tunt_innehall > 0) recommendations.push('Utoka sidor med tunt innehall till minst 300 ord');
      if (pageSpeedData && pageSpeedData.performance_score < 50) recommendations.push('Optimera sidhastigheten — komprimera bilder, minifiera CSS/JS');
      if (activePlugins.length > 20) recommendations.push('Avaktivera och ta bort onodiga plugins');
      if (totalContent < 10) recommendations.push('Skapa mer innehall — blogginlagg, tjanstesidor, FAQ');

      return text({
        site: s.slug,
        url: s.url,
        report_date: new Date().toISOString().split('T')[0],
        seo_score: score,
        overview: {
          wp_version: rootRes.data?.wp_version || 'okand',
          theme: activeTheme ? (activeTheme.name?.rendered || activeTheme.name || 'okand') : 'okand',
          total_pages: pageCount.total || 0,
          total_posts: postCount.total || 0,
          active_plugins: activePlugins.length,
          total_plugins: plugins.length,
        },
        pagespeed: pageSpeedData || { message: 'Kunde inte hamta PageSpeed-data' },
        audit_summary: {
          total_content_checked: totalContent,
          pages_with_issues: pagesWithIssues,
          issue_counts: issueCounts,
        },
        top_issues: allIssues.slice(0, 15),
        strengths,
        weaknesses,
        recommendations,
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- All Sites Report ---
  server.tool('perispa_all_sites_report', 'Generera en sammanfattande rapport for ALLA konfigurerade siter', {}, async () => {
    try {
      const configPath = path.join(__dirname, '..', 'config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const siteKeys = Object.keys(config.sites);

      if (siteKeys.length === 0) return err('Inga siter konfigurerade');

      const reports = [];

      for (const slug of siteKeys) {
        try {
          const s = config.sites[slug];

          // Enkel check — hamta sidantal + pluginantal + pagespeed
          const [pageCount, postCount, pluginRes, pageSpeedData] = await Promise.all([
            wpFetch(s, 'wp/v2/pages', { params: { per_page: 1, status: 'publish' } }).catch(() => ({ total: 0 })),
            wpFetch(s, 'wp/v2/posts', { params: { per_page: 1, status: 'publish' } }).catch(() => ({ total: 0 })),
            wpFetch(s, 'wp/v2/plugins', { params: { per_page: 100 } }).catch(() => ({ data: [] })),
            getPageSpeed(s.url),
          ]);

          const plugins = Array.isArray(pluginRes.data) ? pluginRes.data : [];

          // Snabb mini-audit (bara forsta sidan med sidor)
          const auditRes = await miniAudit(wpFetch, s, 'pages').catch(() => ({ issues: [], totalItems: 0 }));

          let score = 100;
          score -= auditRes.issues.length * 5;
          if (pageSpeedData && pageSpeedData.performance_score < 50) score -= 15;
          score = Math.max(0, Math.min(100, score));

          reports.push({
            site: slug,
            url: s.url,
            status: 'ok',
            seo_score: score,
            pages: pageCount.total || 0,
            posts: postCount.total || 0,
            active_plugins: plugins.filter(p => p.status === 'active').length,
            pagespeed_score: pageSpeedData?.performance_score || null,
            issues_found: auditRes.issues.length,
          });
        } catch (e) {
          reports.push({
            site: slug,
            url: config.sites[slug]?.url || 'okand',
            status: 'error',
            error: e.message,
          });
        }
      }

      // Ranking
      reports.sort((a, b) => (b.seo_score || 0) - (a.seo_score || 0));

      return text({
        report_date: new Date().toISOString().split('T')[0],
        total_sites: siteKeys.length,
        sites_ok: reports.filter(r => r.status === 'ok').length,
        sites_error: reports.filter(r => r.status === 'error').length,
        average_seo_score: Math.round(
          reports.filter(r => r.status === 'ok').reduce((sum, r) => sum + (r.seo_score || 0), 0)
          / Math.max(reports.filter(r => r.status === 'ok').length, 1)
        ),
        ranking: reports,
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Weekly Summary ---
  server.tool('perispa_weekly_summary', 'Generera veckosammanfattning — nya sidor, inlagg och andringar senaste 7 dagarna', {
    site: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Hamta nytt innehall fran senaste 7 dagarna
      const [newPages, newPosts, modifiedPages, modifiedPosts, pluginRes] = await Promise.all([
        wpFetch(s, 'wp/v2/pages', {
          params: { per_page: 100, after: sevenDaysAgo, orderby: 'date', order: 'desc', status: 'publish,draft,private' },
        }).catch(() => ({ data: [], total: 0 })),
        wpFetch(s, 'wp/v2/posts', {
          params: { per_page: 100, after: sevenDaysAgo, orderby: 'date', order: 'desc', status: 'publish,draft,private' },
        }).catch(() => ({ data: [], total: 0 })),
        wpFetch(s, 'wp/v2/pages', {
          params: { per_page: 100, modified_after: sevenDaysAgo, orderby: 'modified', order: 'desc', status: 'publish' },
        }).catch(() => ({ data: [], total: 0 })),
        wpFetch(s, 'wp/v2/posts', {
          params: { per_page: 100, modified_after: sevenDaysAgo, orderby: 'modified', order: 'desc', status: 'publish' },
        }).catch(() => ({ data: [], total: 0 })),
        wpFetch(s, 'wp/v2/plugins', { params: { per_page: 100 } }).catch(() => ({ data: [] })),
      ]);

      const newPagesList = Array.isArray(newPages.data) ? newPages.data : [];
      const newPostsList = Array.isArray(newPosts.data) ? newPosts.data : [];
      const modPagesList = Array.isArray(modifiedPages.data) ? modifiedPages.data : [];
      const modPostsList = Array.isArray(modifiedPosts.data) ? modifiedPosts.data : [];

      // Filtrera bort nya sidor fran modifierade (de overlappar)
      const newPageIds = new Set(newPagesList.map(p => p.id));
      const newPostIds = new Set(newPostsList.map(p => p.id));
      const onlyModifiedPages = modPagesList.filter(p => !newPageIds.has(p.id));
      const onlyModifiedPosts = modPostsList.filter(p => !newPostIds.has(p.id));

      const plugins = Array.isArray(pluginRes.data) ? pluginRes.data : [];
      const pluginsWithUpdates = plugins.filter(p => {
        // Kollar om plugin har uppdaterats nyligen (WP ger inte alltid denna info)
        return p.update?.version && p.update.version !== p.version;
      });

      return text({
        site: s.slug,
        url: s.url,
        period: {
          from: sevenDaysAgo.split('T')[0],
          to: new Date().toISOString().split('T')[0],
        },
        summary: {
          new_pages: newPagesList.length,
          new_posts: newPostsList.length,
          modified_pages: onlyModifiedPages.length,
          modified_posts: onlyModifiedPosts.length,
          plugins_with_updates: pluginsWithUpdates.length,
        },
        new_pages: newPagesList.map(p => ({
          id: p.id,
          title: p.title?.rendered || '',
          slug: p.slug,
          status: p.status,
          date: p.date,
        })),
        new_posts: newPostsList.map(p => ({
          id: p.id,
          title: p.title?.rendered || '',
          slug: p.slug,
          status: p.status,
          date: p.date,
        })),
        modified_pages: onlyModifiedPages.map(p => ({
          id: p.id,
          title: p.title?.rendered || '',
          slug: p.slug,
          modified: p.modified,
        })),
        modified_posts: onlyModifiedPosts.map(p => ({
          id: p.id,
          title: p.title?.rendered || '',
          slug: p.slug,
          modified: p.modified,
        })),
        plugin_updates_available: pluginsWithUpdates.map(p => ({
          name: p.name,
          current_version: p.version,
          new_version: p.update?.version,
        })),
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Export Report ---
  server.tool('perispa_export_report', 'Exportera SEO-rapport som markdown-fil', {
    site: z.string().optional(),
    format: z.string().optional().default('markdown').describe('Exportformat (markdown)'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const date = new Date().toISOString().split('T')[0];

      // Generera rapporten internt (samma logik som site_report)
      const [rootRes, pluginRes, pageCount, postCount, pageSpeedData] = await Promise.all([
        wpFetch(s, '').catch(() => ({ data: {} })),
        wpFetch(s, 'wp/v2/plugins', { params: { per_page: 100 } }).catch(() => ({ data: [] })),
        wpFetch(s, 'wp/v2/pages', { params: { per_page: 1, status: 'publish' } }).catch(() => ({ total: 0 })),
        wpFetch(s, 'wp/v2/posts', { params: { per_page: 1, status: 'publish' } }).catch(() => ({ total: 0 })),
        getPageSpeed(s.url),
      ]);

      const plugins = Array.isArray(pluginRes.data) ? pluginRes.data : [];
      const activePlugins = plugins.filter(p => p.status === 'active');

      const [pageAudit, postAudit] = await Promise.all([
        miniAudit(wpFetch, s, 'pages'),
        miniAudit(wpFetch, s, 'posts'),
      ]);

      const allIssues = [...pageAudit.issues, ...postAudit.issues];

      let score = 100;
      for (const item of allIssues) {
        score -= item.issues.length * 3;
      }
      if (pageSpeedData && pageSpeedData.performance_score < 50) score -= 10;
      score = Math.max(0, Math.min(100, score));

      // Bygg markdown
      let md = `# SEO-rapport: ${s.slug}\n\n`;
      md += `**URL:** ${s.url}\n`;
      md += `**Datum:** ${date}\n`;
      md += `**SEO-score:** ${score}/100\n\n`;

      md += `## Oversikt\n\n`;
      md += `| Metric | Varde |\n`;
      md += `|--------|-------|\n`;
      md += `| WordPress-version | ${rootRes.data?.wp_version || 'okand'} |\n`;
      md += `| Antal sidor | ${pageCount.total || 0} |\n`;
      md += `| Antal inlagg | ${postCount.total || 0} |\n`;
      md += `| Aktiva plugins | ${activePlugins.length} |\n`;
      md += `| Totalt plugins | ${plugins.length} |\n\n`;

      if (pageSpeedData) {
        md += `## PageSpeed (mobil)\n\n`;
        md += `| Metric | Varde |\n`;
        md += `|--------|-------|\n`;
        md += `| Performance | ${pageSpeedData.performance_score}/100 |\n`;
        md += `| LCP | ${pageSpeedData.lcp} |\n`;
        md += `| CLS | ${pageSpeedData.cls} |\n`;
        md += `| TBT | ${pageSpeedData.tbt} |\n`;
        md += `| FCP | ${pageSpeedData.fcp} |\n\n`;
      }

      if (allIssues.length > 0) {
        md += `## SEO-problem (${allIssues.length} sidor)\n\n`;
        md += `| Sida | Typ | Problem |\n`;
        md += `|------|-----|---------|\n`;
        for (const item of allIssues.slice(0, 30)) {
          md += `| ${item.title.slice(0, 40)} | ${item.type} | ${item.issues.join(', ')} |\n`;
        }
        md += '\n';
      } else {
        md += `## SEO-problem\n\nInga problem hittade.\n\n`;
      }

      md += `## Aktiva plugins\n\n`;
      for (const p of activePlugins) {
        md += `- ${p.name} (v${p.version})\n`;
      }
      md += '\n';

      md += `---\n*Rapport genererad av perispa MCP Server*\n`;

      // Spara fil
      const reportsDir = path.join(__dirname, '..', 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const filename = `${s.slug}_${date}.md`;
      const filePath = path.join(reportsDir, filename);
      fs.writeFileSync(filePath, md, 'utf-8');

      return text({
        exported: true,
        site: s.slug,
        format: 'markdown',
        file: filePath,
        size_bytes: Buffer.byteLength(md),
        seo_score: score,
        issues_found: allIssues.length,
      });
    } catch (e) {
      return err(e.message);
    }
  });

};
