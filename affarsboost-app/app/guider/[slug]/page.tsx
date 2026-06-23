import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { GUIDES, CATEGORY_COLORS } from "@/lib/guider";
import { getGuideBySlug } from "@/lib/guider";
import Logo from "@/components/Logo";

export const dynamic = "force-static";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};

  return {
    title: `${guide.title} | Affärsboost`,
    description: guide.intro.slice(0, 160),
    alternates: { canonical: `https://affarsboost.se/guider/${slug}` },
    openGraph: {
      title: guide.title,
      description: guide.intro.slice(0, 160),
      url: `https://affarsboost.se/guider/${slug}`,
      siteName: "Affärsboost",
      locale: "sv_SE",
      type: "article",
      modifiedTime: guide.updatedAt,
    },
  };
}

function renderBody(text: string): React.ReactNode[] {
  return text.split("\n\n").map((block, i) => {
    if (block.startsWith("## ")) {
      return (
        <h2 key={i} className="font-display text-xl font-bold text-navy-700 mt-10 mb-4">
          {block.slice(3)}
        </h2>
      );
    }
    if (block.startsWith("### ")) {
      return (
        <h3 key={i} className="font-display text-lg font-bold text-navy-700 mt-6 mb-3">
          {block.slice(4)}
        </h3>
      );
    }
    const parts = block.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="text-ink-700 leading-relaxed mb-5">
        {parts.map((p, j) =>
          p.startsWith("**") && p.endsWith("**") ? (
            <strong key={j} className="font-semibold text-navy-700">
              {p.slice(2, -2)}
            </strong>
          ) : (
            p
          )
        )}
      </p>
    );
  });
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const pageUrl = `https://affarsboost.se/guider/${slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.intro,
    publisher: {
      "@type": "Organization",
      name: "Affärsboost",
      url: "https://affarsboost.se",
    },
    dateModified: guide.updatedAt,
    url: pageUrl,
    isAccessibleForFree: "True",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Affärsboost", item: "https://affarsboost.se" },
      { "@type": "ListItem", position: 2, name: "Guider", item: "https://affarsboost.se/guider" },
      { "@type": "ListItem", position: 3, name: guide.title, item: pageUrl },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const updatedStr = new Date(guide.updatedAt).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const otherGuides = GUIDES.filter((g) => g.slug !== slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-cream-sand bg-cream/90 backdrop-blur-sm">
        <div className="max-w-content mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/guider" className="text-ink-600 hover:text-navy-700 transition-colors font-medium hidden sm:block">
              ← Alla guider
            </Link>
            <Link href="/registrera" className="btn-primary py-2 px-4 text-sm">
              <span className="hidden sm:inline">Prova 3 dagar gratis</span>
              <span className="sm:hidden">Kom igång</span>
            </Link>
          </div>
        </div>
      </nav>

      <article className="max-w-[720px] mx-auto px-6 py-14">
        {/* Breadcrumb */}
        <nav aria-label="Brödsmula" className="flex items-center gap-1.5 text-xs text-ink-400 mb-8">
          <Link href="/" className="hover:text-navy-700 transition-colors">Affärsboost</Link>
          <span>/</span>
          <Link href="/guider" className="hover:text-navy-700 transition-colors">Guider</Link>
          <span>/</span>
          <span className="text-ink-600 truncate max-w-[200px]">{guide.title}</span>
        </nav>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2.5 mb-6">
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[guide.category]}`}>
            {guide.categoryLabel}
          </span>
          <span className="text-xs text-ink-400">Uppdaterad {updatedStr}</span>
          <span className="text-xs text-ink-400">{guide.readingTimeMinutes} min läsning</span>
        </div>

        {/* Titel */}
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy-700 leading-[1.1] mb-6">
          {guide.title}
        </h1>

        {/* Ingress */}
        <p className="text-ink-600 text-lg leading-relaxed mb-10 pb-8 border-b border-cream-sand">
          {guide.intro}
        </p>

        {/* Body */}
        <div className="prose-section">
          {renderBody(guide.body)}
        </div>

        {/* FAQ */}
        {guide.faqs.length > 0 && (
          <section className="mt-14 pt-10 border-t border-cream-sand">
            <h2 className="font-display text-2xl font-bold text-navy-700 mb-8">Vanliga frågor</h2>
            <div className="space-y-4">
              {guide.faqs.map((f, i) => (
                <details key={i} className="group bg-white border border-cream-sand rounded-xl p-5 open:shadow-sm">
                  <summary className="font-semibold text-navy-700 cursor-pointer list-none flex justify-between items-center gap-4">
                    {f.q}
                    <span className="shrink-0 text-ink-400 group-open:rotate-180 transition-transform text-lg">↓</span>
                  </summary>
                  <p className="mt-3 text-ink-600 text-sm leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-14 bg-navy-50 rounded-2xl p-6">
          <p className="font-semibold text-navy-700 mb-1">Frågor om din specifika situation?</p>
          <p className="text-sm text-ink-500 mb-4">
            Linnéa på Affärsboost svarar på frågor om skatt, avtal och prissättning — utifrån
            just ditt bolag, inte generella råd.
          </p>
          <Link href="/registrera" className="btn-primary py-2.5 px-6 text-sm font-semibold inline-block">
            Prova 3 dagar gratis
          </Link>
        </div>
      </article>

      {/* Fler guider */}
      {otherGuides.length > 0 && (
        <section className="border-t border-cream-sand bg-white py-14">
          <div className="max-w-[720px] mx-auto px-6">
            <h2 className="font-display text-xl font-bold text-navy-700 mb-8">Fler guider</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {otherGuides.map((g) => (
                <Link key={g.id} href={`/guider/${g.slug}`} className="group">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[g.category]}`}>
                    {g.categoryLabel}
                  </span>
                  <p className="mt-2 font-semibold text-sm text-navy-700 group-hover:text-emerald-700 transition-colors leading-snug">
                    {g.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
