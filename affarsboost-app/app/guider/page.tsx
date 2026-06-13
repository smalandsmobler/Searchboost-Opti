import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES, CATEGORY_COLORS, type GuideCategory } from "@/lib/guider";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Guider för egenföretagare — Skatt, avtal, prissättning | Affärsboost",
  description:
    "Gratis guider för svenska soloföretagare och frilansare. F-skatt, timpris, kundavtal, moms, bokföring, GDPR och mer — praktisk information utan onödig krångel.",
  alternates: { canonical: "https://affarsboost.se/guider" },
  openGraph: {
    title: "Guider för egenföretagare | Affärsboost",
    description:
      "Gratis praktiska guider om skatt, juridik, prissättning och marknadsföring för svenska egenföretagare.",
    url: "https://affarsboost.se/guider",
    siteName: "Affärsboost",
    locale: "sv_SE",
    type: "website",
  },
};

const CATEGORY_LABELS: Record<GuideCategory, string> = {
  skatt: "Skatt",
  prissattning: "Prissättning",
  juridik: "Juridik",
  marknadsforing: "Marknadsföring",
  organisation: "Organisation",
  ekonomi: "Ekonomi",
};

export default function GuiderPage() {
  const categories = Array.from(new Set(GUIDES.map((g) => g.category)));

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Guider för egenföretagare — Affärsboost",
    description:
      "Gratis guider om skatt, juridik, prissättning och mer för svenska egenföretagare.",
    url: "https://affarsboost.se/guider",
    numberOfItems: GUIDES.length,
    itemListElement: GUIDES.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://affarsboost.se/guider/${g.slug}`,
      name: g.title,
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Affärsboost", item: "https://affarsboost.se" },
      { "@type": "ListItem", position: 2, name: "Guider", item: "https://affarsboost.se/guider" },
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
            <Link href="/artiklar" className="hover:text-navy-500 transition-colors hidden sm:block">
              Artiklar
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
          <span className="text-ink-600">Guider</span>
        </nav>

        {/* Rubrik */}
        <div className="mb-12">
          <p className="text-sm font-semibold text-emerald-600 mb-3 tracking-wide uppercase">
            Gratis guider
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy-700 mb-4">
            Guider för egenföretagare
          </h1>
          <p className="text-ink-600 text-lg leading-relaxed max-w-prose">
            Praktisk information om skatt, juridik, prissättning och mer — utan onödig krångel.
            Alla guider är gratis och uppdaterade för 2026.
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

        {/* Guiderlista */}
        {GUIDES.length === 0 ? (
          <div className="bg-white rounded-2xl border border-cream-sand p-10 text-center">
            <p className="text-ink-500">Guider publiceras inom kort.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {GUIDES.map((guide) => (
              <Link
                key={guide.id}
                href={`/guider/${guide.slug}`}
                className="group bg-white border border-cream-sand rounded-2xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[guide.category]}`}
                  >
                    {guide.categoryLabel}
                  </span>
                  <span className="text-xs text-ink-400">{guide.readingTimeMinutes} min</span>
                </div>
                <h2 className="font-display font-bold text-lg text-navy-700 mb-2 group-hover:text-emerald-700 transition-colors leading-snug">
                  {guide.title}
                </h2>
                <p className="text-sm text-ink-500 leading-relaxed line-clamp-3">{guide.intro}</p>
                <span className="inline-block mt-3 text-xs font-semibold text-emerald-600 group-hover:underline">
                  Läs guiden →
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-br from-navy-700 to-navy-900 rounded-2xl p-8 text-white text-center">
          <h2 className="font-display text-2xl font-bold mb-2">
            Vill du ha personliga svar på dina frågor?
          </h2>
          <p className="text-navy-100 text-sm mb-6 max-w-md mx-auto">
            Guiderna ger allmän information. I Affärsboost kan du ställa frågor om
            din specifika situation till en erfaren affärsrådgivare.
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
