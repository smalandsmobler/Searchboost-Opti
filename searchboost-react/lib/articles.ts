import fs from "fs";
import path from "path";

export interface Article {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: number;
  category: string;
}

const CONTENT_DIR = path.join(process.cwd(), "content/blogg");

const ARTICLE_META: Record<string, Partial<Article>> = {
  "vad-ar-seo":               { title: "Vad är SEO? Komplett guide för nybörjare 2026", category: "Grunderna", date: "2026-02-10", readTime: 8 },
  "hur-fungerar-google":      { title: "Hur fungerar Google? Så rankar sökmotorn din webbplats", category: "Grunderna", date: "2026-02-10", readTime: 7 },
  "rankingfaktorer":          { title: "Googles rankingfaktorer 2026 — Komplett lista", category: "Grunderna", date: "2026-02-10", readTime: 10 },
  "nyckelordsforskning":      { title: "Nyckelordsforskning — Hitta rätt sökord för din sajt", category: "Strategi", date: "2026-02-10", readTime: 9 },
  "teknisk-seo":              { title: "Teknisk SEO — Komplett guide 2026", category: "Teknisk", date: "2026-02-10", readTime: 12 },
  "seo-texter":               { title: "SEO-texter — Så skriver du innehåll som rankar", category: "Innehåll", date: "2026-02-10", readTime: 8 },
  "lankbygge":                { title: "Länkbygge — Så får du fler backlinks 2026", category: "Off-page", date: "2026-02-10", readTime: 9 },
  "lokal-seo":                { title: "Lokal SEO — Komplett guide för lokala företag", category: "Lokal", date: "2026-02-10", readTime: 8 },
  "mobile-seo":               { title: "Mobil SEO — Optimera för mobilanvändare", category: "Teknisk", date: "2026-02-10", readTime: 7 },
  "page-speed-core-web-vitals": { title: "Page Speed & Core Web Vitals — Så snabbar du upp din sajt", category: "Teknisk", date: "2026-02-10", readTime: 10 },
  "schema-markup":            { title: "Schema Markup — Strukturerad data för SEO", category: "Teknisk", date: "2026-02-10", readTime: 8 },
  "interna-lankar":           { title: "Interna länkar — Så bygger du en stark länkstruktur", category: "On-page", date: "2026-02-10", readTime: 7 },
  "content-gaps":             { title: "Content Gap-analys — Hitta innehåll dina konkurrenter missar", category: "Strategi", date: "2026-02-10", readTime: 8 },
  "domain-authority":         { title: "Domain Authority — Vad det är och hur du ökar det", category: "Off-page", date: "2026-02-10", readTime: 7 },
  "google-business-profile":  { title: "Google Business Profile — Komplett guide 2026", category: "Lokal", date: "2026-02-10", readTime: 8 },
  "google-search-console":    { title: "Google Search Console — Komplett guide 2026", category: "Verktyg", date: "2026-02-10", readTime: 9 },
  "hur-lang-tid-tar-seo":     { title: "Hur lång tid tar SEO? Realistiska tidsramar 2026", category: "Grunderna", date: "2026-02-10", readTime: 6 },
  "lokala-citationer":        { title: "Lokala citationer — NAP-konsistens och företagskataloger", category: "Lokal", date: "2026-02-10", readTime: 7 },
  "seo-rapportering":         { title: "SEO-rapportering — Mät och visa resultat", category: "Verktyg", date: "2026-02-10", readTime: 7 },
  "seo-strategi-smaforetag":  { title: "SEO-strategi för småföretag — Steg-för-steg guide 2026", category: "Strategi", date: "2026-02-10", readTime: 10 },
  "seo-vs-sem":               { title: "SEO vs SEM — Vad är skillnaden och vad passar dig?", category: "Grunderna", date: "2026-02-10", readTime: 7 },
  "title-meta-description":   { title: "Title-taggar & Meta Descriptions — Så skriver du klickvärdiga titlar", category: "On-page", date: "2026-02-10", readTime: 7 },
  "vad-kostar-seo":           { title: "Vad kostar SEO? Priser och paket 2026", category: "Grunderna", date: "2026-02-10", readTime: 8 },
  "varfor-seo-2026":          { title: "Varför SEO är viktigare än någonsin 2026", category: "Strategi", date: "2026-02-10", readTime: 7 },
  "wordpress-seo":            { title: "WordPress SEO — 15 steg till bättre ranking", category: "Teknisk", date: "2026-02-10", readTime: 9 },
};

function extractDescription(html: string): string {
  const m = html.match(/<meta\s+name="description"\s+content="([^"]+)"/);
  return m ? m[1] : "";
}

function extractBodyContent(html: string): string {
  // Extract everything between <body> and </body>, then strip nav/header/footer wrappers
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) return html;
  const body = bodyMatch[1];
  // Remove script and style tags
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "");
}

export function getAllArticles(): Article[] {
  return Object.entries(ARTICLE_META).map(([slug, meta]) => {
    const filePath = path.join(CONTENT_DIR, `${slug}.html`);
    let description = meta.description || "";
    if (!description && fs.existsSync(filePath)) {
      const html = fs.readFileSync(filePath, "utf-8");
      description = extractDescription(html);
    }
    return {
      slug,
      title: meta.title || slug,
      description,
      date: meta.date || "2026-02-10",
      readTime: meta.readTime || 7,
      category: meta.category || "SEO",
    };
  });
}

export function getArticleBySlug(slug: string): (Article & { content: string }) | null {
  const meta = ARTICLE_META[slug];
  if (!meta) return null;
  const filePath = path.join(CONTENT_DIR, `${slug}.html`);
  if (!fs.existsSync(filePath)) return null;
  const html = fs.readFileSync(filePath, "utf-8");
  const description = meta.description || extractDescription(html);
  const content = extractBodyContent(html);
  return {
    slug,
    title: meta.title || slug,
    description,
    date: meta.date || "2026-02-10",
    readTime: meta.readTime || 7,
    category: meta.category || "SEO",
    content,
  };
}

export function getArticleCategories(): string[] {
  const cats = new Set(Object.values(ARTICLE_META).map((m) => m.category || "SEO"));
  return Array.from(cats);
}

export function getRelatedArticles(currentSlug: string, category: string, limit = 3): Article[] {
  const all = getAllArticles();
  // Same category first, shuffled, then fall back to other articles
  const sameCategory = all.filter((a) => a.slug !== currentSlug && a.category === category);
  const others = all.filter((a) => a.slug !== currentSlug && a.category !== category);
  return [...sameCategory, ...others].slice(0, limit);
}
