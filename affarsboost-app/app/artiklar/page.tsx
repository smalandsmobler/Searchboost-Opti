import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import {
  getPublishedArticles,
  AUTHOR_COLORS,
  CATEGORY_COLORS,
  type ArticleCategory,
} from "@/lib/articles";

export const metadata: Metadata = {
  title: "Artiklar — Strategi och insikter för företagare | Affärsboost",
  description:
    "Ledartexter och djupanalyser om prissättning, tillväxt, AI i företaget och livet som egenföretagare. Skrivet av Linnéa och Maja.",
  alternates: { canonical: "https://affarsboost.se/artiklar" },
  openGraph: {
    title: "Artiklar — Insikter för företagare | Affärsboost",
    description:
      "Ledartexter om prissättning, tillväxt, AI och vardagen som företagare.",
    url: "https://affarsboost.se/artiklar",
    siteName: "Affärsboost",
    locale: "sv_SE",
    type: "website",
  },
};

const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  ledartext: "Ledartext",
  strategi: "Strategi",
  mindset: "Mindset",
  ai: "AI",
  community: "Community",
  management: "Management",
};

export default function ArtiklarPage() {
  const articles = getPublishedArticles();
  const categories = Array.from(new Set(articles.map((a) => a.category)));

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Artiklar — Affärsboost",
    description: "Ledartexter och insikter för svenska företagare om prissättning, tillväxt, AI och ledarskap.",
    url: "https://affarsboost.se/artiklar",
    numberOfItems: articles.length,
    itemListElement: articles.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://affarsboost.se/artiklar/${a.slug}`,
      name: a.title,
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Affärsboost", item: "https://affarsboost.se" },
      { "@type": "ListItem", position: 2, name: "Artiklar", item: "https://affarsboost.se/artiklar" },
    ],
  };

  return (
    <div className="min-h-screen bg-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-cream-sand bg-cream/90 backdrop-blur-sm">
        <div className="max-w-content mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-5 text-sm font-medium text-navy-700">
            <Link href="/#priser" className="hover:text-navy-500 transition-colors hidden sm:block">
              Priser
            </Link>
            <Link href="/login" className="btn-secondary py-2 px-4 text-sm">
              Logga in
            </Link>
            <Link href="/registrera" className="btn-primary py-2 px-4 text-sm">
              <span className="hidden sm:inline">Prova 3 dagar gratis</span>
              <span className="sm:hidden">Kom igång</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-[820px] mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <nav aria-label="Brödsmula" className="flex items-center gap-1.5 text-xs text-ink-400 mb-8">
          <Link href="/" className="hover:text-navy-700 transition-colors">Affärsboost</Link>
          <span>/</span>
          <span className="text-ink-600">Artiklar</span>
        </nav>

        {/* Rubrik */}
        <div className="mb-12">
          <p className="text-sm font-semibold text-emerald-600 mb-3 tracking-wide uppercase">
            Ledartexter & Insikter
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy-700 mb-4">
            Ledare
          </h1>
          <p className="text-ink-600 text-lg leading-relaxed max-w-prose">
            Tankar och insikter för dig som driver eget och vill tänka tydligare om ditt företag.
          </p>
        </div>

        {/* Kategorifilter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {categories.map((cat) => (
              <span
                key={cat}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full ${CATEGORY_COLORS[cat]}`}
              >
                {CATEGORY_LABELS[cat]}
              </span>
            ))}
          </div>
        )}

        {/* Artikellista */}
        {articles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-cream-sand p-10 text-center">
            <p className="text-ink-500">Första artiklarna publiceras inom kort.</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-cream-sand">
            {articles.map((article) => {
              const dateStr = new Date(article.publishedAt).toLocaleDateString("sv-SE", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });

              return (
                <article key={article.id} className="py-10 group">
                  <Link href={`/artiklar/${article.slug}`} className="block">
                    {/* Meta-rad */}
                    <div className="flex flex-wrap items-center gap-2.5 mb-3">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[article.category]}`}
                      >
                        {article.categoryLabel}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${AUTHOR_COLORS[article.author]}`}
                      >
                        {article.authorName}
                      </span>
                      <span className="text-xs text-ink-400">{dateStr}</span>
                      <span className="text-xs text-ink-400">
                        {article.readingTimeMinutes} min
                      </span>
                    </div>

                    {/* Titel + subtitle */}
                    <h2 className="font-display text-2xl font-bold text-navy-700 mb-1.5 group-hover:text-emerald-700 transition-colors">
                      {article.title}
                    </h2>
                    <p className="text-sm text-ink-500 mb-4 italic">{article.subtitle}</p>

                    {/* Excerpt — de första ~2 meningarna */}
                    <p className="text-ink-700 leading-relaxed line-clamp-3 mb-4">
                      {article.excerpt.split("\n\n")[0]}
                    </p>

                    <span className="text-sm font-semibold text-emerald-600 group-hover:underline">
                      Läs artikeln →
                    </span>
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        {/* CTA nedtill */}
        <div className="mt-16 bg-gradient-to-br from-navy-700 to-navy-900 rounded-2xl p-8 text-white text-center">
          <h2 className="font-display text-2xl font-bold mb-2">
            Vill du föra de här samtalen direkt?
          </h2>
          <p className="text-navy-100 text-sm mb-6 max-w-md mx-auto">
            I Affärsboost finns erfarna affärscoacher tillgängliga för frågor om just ditt bolag —
            inte generella råd.
          </p>
          <Link
            href="/registrera"
            className="inline-block bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            Prova 3 dagar gratis →
          </Link>
        </div>
      </div>
    </div>
  );
}
