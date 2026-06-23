/**
 * perispa — Schema Generator tools
 * generate_schema, apply_schema, schema_audit
 */

const { z } = require('zod');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function detectSchemaType(p, content) {
  const meta = p.meta || {};
  const plainContent = stripTags(content).toLowerCase();
  const title = (p.title?.raw || p.title?.rendered || '').toLowerCase();

  // WooCommerce-produkt
  if (p.type === 'product' || meta._price !== undefined || meta._regular_price !== undefined) {
    return 'Product';
  }

  // FAQ — h2/h3 med fragetecken
  const faqHeadings = content.match(/<h[23][^>]*>[^<]*\?[^<]*<\/h[23]>/gi) || [];
  if (faqHeadings.length >= 2) {
    return 'FAQPage';
  }

  // HowTo — steg/instruktioner
  const stepIndicators = ['steg 1', 'step 1', 'steg:', 'forst,', 'sedan,', 'till sist', 'instruktioner', 'sa har gor du', 'guide'];
  if (stepIndicators.some(s => plainContent.includes(s))) {
    const olCount = (content.match(/<ol/gi) || []).length;
    if (olCount > 0 || plainContent.includes('steg 1') || plainContent.includes('step 1')) {
      return 'HowTo';
    }
  }

  // LocalBusiness — adress/telefon/stad
  const localIndicators = ['adress', 'telefon', 'tel:', 'oppettider', 'besoksadress', 'kontakta oss'];
  const hasPhone = /(\+?\d{2,4}[\s-]?\d{3,4}[\s-]?\d{2,4}[\s-]?\d{2,4})/.test(plainContent);
  if (localIndicators.some(s => plainContent.includes(s)) && hasPhone) {
    return 'LocalBusiness';
  }

  // Service — priser/paket
  const serviceIndicators = ['pris', 'paket', 'kr/man', 'kr/manad', 'offert', 'tjanster', 'vara tjanster'];
  const hasPrices = /\d+\s*(kr|sek|:-)/i.test(plainContent);
  if (serviceIndicators.some(s => plainContent.includes(s)) && hasPrices) {
    return 'Service';
  }

  // Article — bloggpost
  if (p.type === 'post') {
    return 'Article';
  }

  return 'WebPage';
}

function buildSchema(schemaType, p, content, siteUrl) {
  const title = p.title?.raw || p.title?.rendered || '';
  const plainTitle = stripTags(title);
  const plainContent = stripTags(content);
  const description = (p.meta?.rank_math_description || plainContent.slice(0, 155)).trim();
  const url = p.link || '';
  const datePublished = p.date || '';
  const dateModified = p.modified || '';

  const base = {
    '@context': 'https://schema.org',
  };

  switch (schemaType) {
    case 'Product': {
      const price = p.meta?._price || p.meta?._regular_price || '';
      return {
        ...base,
        '@type': 'Product',
        name: plainTitle,
        description,
        url,
        ...(price ? {
          offers: {
            '@type': 'Offer',
            price: String(price),
            priceCurrency: 'SEK',
            availability: 'https://schema.org/InStock',
            url,
          },
        } : {}),
      };
    }

    case 'FAQPage': {
      const faqRegex = /<h[23][^>]*>([^<]*\?[^<]*)<\/h[23]>([\s\S]*?)(?=<h[23]|$)/gi;
      const faqs = [];
      let faqMatch;
      while ((faqMatch = faqRegex.exec(content)) !== null) {
        const question = stripTags(faqMatch[1]).trim();
        const answer = stripTags(faqMatch[2]).trim();
        if (question && answer) {
          faqs.push({
            '@type': 'Question',
            name: question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: answer.slice(0, 500),
            },
          });
        }
      }
      return {
        ...base,
        '@type': 'FAQPage',
        mainEntity: faqs,
      };
    }

    case 'HowTo': {
      // Forsok extrahera steg fran ol/li eller h2/h3
      const steps = [];
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch;
      let stepNum = 1;
      while ((liMatch = liRegex.exec(content)) !== null) {
        const stepText = stripTags(liMatch[1]).trim();
        if (stepText && stepText.length > 5) {
          steps.push({
            '@type': 'HowToStep',
            position: stepNum,
            text: stepText.slice(0, 300),
          });
          stepNum++;
        }
        if (stepNum > 20) break;
      }
      return {
        ...base,
        '@type': 'HowTo',
        name: plainTitle,
        description,
        step: steps.length > 0 ? steps : [{ '@type': 'HowToStep', position: 1, text: description }],
      };
    }

    case 'Article': {
      return {
        ...base,
        '@type': 'Article',
        headline: plainTitle.slice(0, 110),
        description,
        url,
        datePublished,
        dateModified,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': url,
        },
        author: {
          '@type': 'Organization',
          name: siteUrl.replace(/https?:\/\//, '').replace(/\/$/, ''),
        },
      };
    }

    case 'LocalBusiness': {
      // Extrahera telefonnummer
      const phoneMatch = plainContent.match(/(\+?\d{2,4}[\s-]?\d{3,4}[\s-]?\d{2,4}[\s-]?\d{2,4})/);
      return {
        ...base,
        '@type': 'LocalBusiness',
        name: plainTitle,
        description,
        url: siteUrl,
        ...(phoneMatch ? { telephone: phoneMatch[1].trim() } : {}),
      };
    }

    case 'Service': {
      return {
        ...base,
        '@type': 'Service',
        name: plainTitle,
        description,
        url,
        provider: {
          '@type': 'Organization',
          name: siteUrl.replace(/https?:\/\//, '').replace(/\/$/, ''),
          url: siteUrl,
        },
      };
    }

    default: {
      return {
        ...base,
        '@type': 'WebPage',
        name: plainTitle,
        description,
        url,
        datePublished,
        dateModified,
      };
    }
  }
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
    if (!res.data || res.data.length < 100) break;
    page++;
  }

  return items;
}

module.exports = function registerSchemaGeneratorTools(server, getSite, wpFetch) {

  // --- Generate schema ---
  server.tool('perispa_generate_schema', 'Analysera en sidas innehall och generera lamplig schema markup (JSON-LD)', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page').describe('page eller post'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      const p = res.data;
      const content = p.content?.raw || p.content?.rendered || '';

      const schemaType = detectSchemaType(p, content);
      const schema = buildSchema(schemaType, p, content, s.url);

      return text({
        page_id: args.page_id,
        url: p.link,
        detected_type: schemaType,
        schema,
        json_ld: `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`,
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Apply schema ---
  server.tool('perispa_apply_schema', 'Applicera schema markup pa en sida via Rank Math API', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page').describe('page eller post'),
    schema_type: z.string().optional().describe('Override auto-detect (Product, FAQPage, HowTo, Article, LocalBusiness, Service, WebPage)'),
    custom_data: z.record(z.string(), z.any()).optional().describe('Extra falt att lagga till i schemat'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      const p = res.data;
      const content = p.content?.raw || p.content?.rendered || '';

      const schemaType = args.schema_type || detectSchemaType(p, content);
      let schema = buildSchema(schemaType, p, content, s.url);

      // Lagg till custom data
      if (args.custom_data) {
        schema = { ...schema, ...args.custom_data };
      }

      // Skicka till Rank Math
      const rmSchema = {
        'schema-auto': {
          ...schema,
          metadata: {
            title: 'Auto',
            type: 'template',
            isPrimary: true,
          },
        },
      };

      await wpFetch(s, 'rankmath/v1/updateSchemas', {
        method: 'POST',
        body: {
          objectID: args.page_id,
          objectType: 'post',
          schemas: rmSchema,
        },
      });

      return text({
        page_id: args.page_id,
        url: p.link,
        schema_type: schemaType,
        applied: true,
        schema,
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Schema audit ---
  server.tool('perispa_schema_audit', 'Kor schema-check pa alla sidor — visa vilka som har/saknar schema och foreslagna typer', {
    site: z.string().optional(),
    type: z.string().optional().default('all').describe('page, post, eller all'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      let allItems = [];

      if (args.type === 'all' || args.type === 'page') {
        try {
          const pages = await fetchAllItems(wpFetch, s, 'wp/v2/pages');
          allItems.push(...pages.map(p => ({ ...p, _postType: 'page' })));
        } catch { /* skip */ }
      }
      if (args.type === 'all' || args.type === 'post') {
        try {
          const posts = await fetchAllItems(wpFetch, s, 'wp/v2/posts');
          allItems.push(...posts.map(p => ({ ...p, _postType: 'post' })));
        } catch { /* skip */ }
      }

      const results = allItems.map(p => {
        const meta = p.meta || {};
        const content = p.content?.raw || p.content?.rendered || '';

        // Kolla befintligt schema
        let hasRankMathSchema = false;
        let existingSchemaType = null;

        if (meta.rank_math_schema) {
          hasRankMathSchema = true;
          try {
            const parsed = typeof meta.rank_math_schema === 'string'
              ? JSON.parse(meta.rank_math_schema)
              : meta.rank_math_schema;
            // Rank Math lagrar som objekt med nycklar
            const firstKey = Object.keys(parsed)[0];
            if (firstKey && parsed[firstKey]?.['@type']) {
              existingSchemaType = parsed[firstKey]['@type'];
            }
          } catch { /* ignore */ }
        }

        // Kolla inline JSON-LD
        const jsonLdCount = (content.match(/<script[^>]*type="application\/ld\+json"/gi) || []).length;

        // Detektera lamplig typ
        const suggestedType = detectSchemaType(p, content);

        return {
          id: p.id,
          title: stripTags(p.title?.raw || p.title?.rendered || ''),
          slug: p.slug,
          post_type: p._postType,
          has_schema: hasRankMathSchema || jsonLdCount > 0,
          rank_math_schema: hasRankMathSchema,
          inline_json_ld: jsonLdCount,
          existing_type: existingSchemaType,
          suggested_type: suggestedType,
          needs_schema: !hasRankMathSchema && jsonLdCount === 0,
          type_mismatch: hasRankMathSchema && existingSchemaType && existingSchemaType !== suggestedType,
        };
      });

      const withSchema = results.filter(r => r.has_schema);
      const withoutSchema = results.filter(r => r.needs_schema);
      const typeMismatch = results.filter(r => r.type_mismatch);

      // Rakna foreslagna typer
      const suggestedCounts = {};
      for (const r of results) {
        suggestedCounts[r.suggested_type] = (suggestedCounts[r.suggested_type] || 0) + 1;
      }

      return text({
        site: s.slug,
        total_pages: results.length,
        with_schema: withSchema.length,
        without_schema: withoutSchema.length,
        type_mismatches: typeMismatch.length,
        suggested_type_distribution: suggestedCounts,
        pages_without_schema: withoutSchema.map(r => ({
          id: r.id,
          title: r.title,
          slug: r.slug,
          suggested_type: r.suggested_type,
        })),
        pages_with_mismatch: typeMismatch.map(r => ({
          id: r.id,
          title: r.title,
          slug: r.slug,
          existing_type: r.existing_type,
          suggested_type: r.suggested_type,
        })),
        all_pages: results,
      });
    } catch (e) {
      return err(e.message);
    }
  });
};
