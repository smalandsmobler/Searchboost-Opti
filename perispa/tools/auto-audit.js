/**
 * perispa — Auto Audit tools
 * audit_site, audit_all_sites
 */

const { z } = require('zod');
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

function analyzePage(p, siteUrl) {
  const content = p.content?.raw || p.content?.rendered || '';
  const meta = p.meta || {};

  const seoTitle = meta.rank_math_title || p.title?.raw || p.title?.rendered || '';
  const seoDesc = meta.rank_math_description || '';
  const focusKw = meta.rank_math_focus_keyword || '';

  // H1-antal
  const h1Count = (content.match(/<h1/gi) || []).length;

  // Bilder utan alt
  const imgTags = content.match(/<img[^>]*>/gi) || [];
  const imgsNoAlt = imgTags.filter(tag => !tag.match(/alt="[^"]+"/i)).length;

  // Interna lankar
  const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>/gi;
  let linkMatch;
  let internalLinks = 0;
  while ((linkMatch = linkRegex.exec(content)) !== null) {
    const href = linkMatch[1];
    if (href.startsWith(siteUrl) || href.startsWith('/') || href.startsWith('#')) {
      internalLinks++;
    }
  }

  // Ordantal
  const textContent = stripTags(content);
  const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;

  const issues = [];

  if (!seoTitle || seoTitle.trim() === '') {
    issues.push({ severity: 'high', issue: 'Saknar SEO-titel', page_id: p.id, slug: p.slug });
  }
  if (!seoDesc || seoDesc.trim() === '') {
    issues.push({ severity: 'high', issue: 'Saknar meta description', page_id: p.id, slug: p.slug });
  }
  if (!focusKw || focusKw.trim() === '') {
    issues.push({ severity: 'medium', issue: 'Saknar fokus-sokord', page_id: p.id, slug: p.slug });
  }
  if (h1Count === 0) {
    issues.push({ severity: 'high', issue: 'Saknar H1-rubrik', page_id: p.id, slug: p.slug });
  }
  if (h1Count > 1) {
    issues.push({ severity: 'medium', issue: `Flera H1-rubriker (${h1Count} st)`, page_id: p.id, slug: p.slug });
  }
  if (imgsNoAlt > 0) {
    issues.push({ severity: 'medium', issue: `${imgsNoAlt} bilder saknar alt-text`, page_id: p.id, slug: p.slug });
  }
  if (wordCount < 300) {
    issues.push({ severity: 'low', issue: `Tunt innehall (${wordCount} ord)`, page_id: p.id, slug: p.slug });
  }
  if (internalLinks === 0) {
    issues.push({ severity: 'low', issue: 'Inga interna lankar', page_id: p.id, slug: p.slug });
  }

  return {
    id: p.id,
    title: p.title?.raw || p.title?.rendered || '',
    slug: p.slug,
    url: p.link || '',
    seo_title: seoTitle,
    seo_description: seoDesc,
    focus_keyword: focusKw,
    h1_count: h1Count,
    imgs_no_alt: imgsNoAlt,
    internal_links: internalLinks,
    word_count: wordCount,
    issues,
  };
}

async function fetchAllItems(wpFetch, site, endpoint) {
  const items = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const res = await wpFetch(site, endpoint, {
      params: { per_page: 100, page, context: 'edit', status: 'publish' },
    });
    if (res.data && Array.isArray(res.data)) {
      items.push(...res.data);
    }
    if (page === 1 && res.totalPages) {
      totalPages = res.totalPages;
    } else if (page === 1 && res.headers && res.headers['x-wp-totalpages']) {
      totalPages = parseInt(res.headers['x-wp-totalpages'], 10);
    }
    // Om vi fick farre an 100 ar vi klara
    if (!res.data || res.data.length < 100) break;
    page++;
  }

  return items;
}

module.exports = function registerAutoAuditTools(server, getSite, wpFetch) {

  // --- Full SEO-audit av en site ---
  server.tool('perispa_audit_site', 'Kor full SEO-audit pa en site — analyserar alla sidor/inlagg for SEO-problem', {
    site: z.string().optional(),
    type: z.string().optional().default('all').describe('all, page, eller post'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      let allItems = [];

      if (args.type === 'all' || args.type === 'page') {
        const pages = await fetchAllItems(wpFetch, s, 'wp/v2/pages');
        allItems.push(...pages);
      }
      if (args.type === 'all' || args.type === 'post') {
        const posts = await fetchAllItems(wpFetch, s, 'wp/v2/posts');
        allItems.push(...posts);
      }

      const results = allItems.map(p => analyzePage(p, s.url));

      // Samla alla issues
      const allIssues = results.flatMap(r => r.issues);
      const highIssues = allIssues.filter(i => i.severity === 'high');
      const mediumIssues = allIssues.filter(i => i.severity === 'medium');
      const lowIssues = allIssues.filter(i => i.severity === 'low');

      // Rakna specifika problem
      const noTitle = results.filter(r => !r.seo_title || r.seo_title.trim() === '').length;
      const noDesc = results.filter(r => !r.seo_description || r.seo_description.trim() === '').length;
      const noKw = results.filter(r => !r.focus_keyword || r.focus_keyword.trim() === '').length;
      const thinContent = results.filter(r => r.word_count < 300).length;
      const noH1 = results.filter(r => r.h1_count === 0).length;

      // SEO-score
      const totalChecks = results.length * 5; // 5 viktiga checkar per sida
      const failedChecks = highIssues.length * 3 + mediumIssues.length * 2 + lowIssues.length;
      const seoScore = totalChecks > 0 ? Math.max(0, Math.round(100 - (failedChecks / totalChecks) * 100)) : 0;

      // Gruppera issues per severity
      const issuesByType = {};
      for (const issue of allIssues) {
        const key = issue.issue.replace(/\d+/g, 'N');
        if (!issuesByType[key]) {
          issuesByType[key] = { issue: issue.issue, severity: issue.severity, count: 0, pages: [] };
        }
        issuesByType[key].count++;
        issuesByType[key].pages.push({ id: issue.page_id, slug: issue.slug });
      }

      return text({
        site: s.slug,
        url: s.url,
        total_pages: results.length,
        without_seo_title: noTitle,
        without_meta_description: noDesc,
        without_focus_keyword: noKw,
        thin_content_under_300: thinContent,
        without_h1: noH1,
        seo_score: seoScore,
        issue_counts: { high: highIssues.length, medium: mediumIssues.length, low: lowIssues.length },
        issues_grouped: Object.values(issuesByType).sort((a, b) => {
          const sev = { high: 0, medium: 1, low: 2 };
          return (sev[a.severity] || 3) - (sev[b.severity] || 3);
        }),
        pages: results.map(r => ({
          id: r.id,
          title: r.title,
          slug: r.slug,
          word_count: r.word_count,
          has_seo_title: !!(r.seo_title && r.seo_title.trim()),
          has_description: !!(r.seo_description && r.seo_description.trim()),
          has_focus_kw: !!(r.focus_keyword && r.focus_keyword.trim()),
          h1_count: r.h1_count,
          imgs_no_alt: r.imgs_no_alt,
          issue_count: r.issues.length,
        })),
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Audit alla konfigurerade siter ---
  server.tool('perispa_audit_all_sites', 'Kor SEO-audit pa ALLA konfigurerade siter — sammanfattning per site', {}, async () => {
    try {
      const config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf-8'));
      const slugs = Object.keys(config.sites || {});

      if (slugs.length === 0) {
        return err('Inga siter konfigurerade i config.json');
      }

      const results = [];

      for (const slug of slugs) {
        try {
          const s = getSite(slug);
          let allItems = [];

          try {
            const pages = await fetchAllItems(wpFetch, s, 'wp/v2/pages');
            allItems.push(...pages);
          } catch { /* skip pages if error */ }

          try {
            const posts = await fetchAllItems(wpFetch, s, 'wp/v2/posts');
            allItems.push(...posts);
          } catch { /* skip posts if error */ }

          const analyzed = allItems.map(p => analyzePage(p, s.url));
          const allIssues = analyzed.flatMap(r => r.issues);
          const highIssues = allIssues.filter(i => i.severity === 'high');
          const mediumIssues = allIssues.filter(i => i.severity === 'medium');
          const lowIssues = allIssues.filter(i => i.severity === 'low');

          const totalChecks = analyzed.length * 5;
          const failedChecks = highIssues.length * 3 + mediumIssues.length * 2 + lowIssues.length;
          const seoScore = totalChecks > 0 ? Math.max(0, Math.round(100 - (failedChecks / totalChecks) * 100)) : 0;

          // Top issues — unika per typ
          const issueMap = {};
          for (const issue of allIssues) {
            const key = issue.issue.replace(/\d+/g, 'N');
            if (!issueMap[key]) issueMap[key] = { issue: issue.issue, severity: issue.severity, count: 0 };
            issueMap[key].count++;
          }
          const topIssues = Object.values(issueMap)
            .sort((a, b) => {
              const sev = { high: 0, medium: 1, low: 2 };
              return (sev[a.severity] || 3) - (sev[b.severity] || 3) || b.count - a.count;
            })
            .slice(0, 5);

          results.push({
            slug,
            url: s.url,
            total_pages: analyzed.length,
            seo_score: seoScore,
            issues: { high: highIssues.length, medium: mediumIssues.length, low: lowIssues.length },
            top_issues: topIssues,
          });
        } catch (e) {
          results.push({
            slug,
            url: config.sites[slug]?.url || 'okand',
            total_pages: 0,
            seo_score: 0,
            error: e.message,
            top_issues: [],
          });
        }
      }

      // Sortera: lagst score forst
      results.sort((a, b) => a.seo_score - b.seo_score);

      return text({
        total_sites: results.length,
        average_seo_score: results.length > 0
          ? Math.round(results.reduce((sum, r) => sum + r.seo_score, 0) / results.length)
          : 0,
        sites: results,
      });
    } catch (e) {
      return err(e.message);
    }
  });
};
