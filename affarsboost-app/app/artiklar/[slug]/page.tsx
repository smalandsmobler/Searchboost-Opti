import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "@/lib/session";
import {
  getArticleBySlug,
  getPublishedArticles,
  AUTHOR_COLORS,
  CATEGORY_COLORS,
} from "@/lib/articles";
import Logo from "@/components/Logo";

function extractFaqs(body: string): Array<{ q: string; a: string }> {
  const blocks = body.split("\n\n");
  const faqs: Array<{ q: string; a: string }> = [];
  for (let i = 0; i < blocks.length - 1; i++) {
    if (blocks[i].startsWith("## ")) {
      const heading = blocks[i].slice(3).trim();
      const answer = blocks[i + 1]
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .trim()
        .slice(0, 400);
      if (answer.length > 60) {
        faqs.push({ q: heading.endsWith("?") ? heading : `${heading}?`, a: answer });
      }
    }
  }
  return faqs.slice(0, 6);
}

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  const firstParagraph = article.excerpt.split("\n\n")[0];

  return {
    title: `${article.title} — Affärsboost`,
    description: firstParagraph.slice(0, 160),
    alternates: { canonical: `https://affarsboost.se/artiklar/${slug}` },
    openGraph: {
      title: article.title,
      description: article.subtitle,
      url: `https://affarsboost.se/artiklar/${slug}`,
      siteName: "Affärsboost",
      locale: "sv_SE",
      type: "article",
      publishedTime: article.publishedAt,
      authors: [article.authorName],
    },
  };
}

/** Rendera artikeltext: ## rubrik, **bold**, \n\n = nytt stycke. */
function renderBody(text: string): React.ReactNode[] {
  return text
    .split("\n\n")
    .map((block, i) => {
      if (block.startsWith("## ")) {
        return (
          <h2
            key={i}
            className="font-display text-xl font-bold text-navy-700 mt-10 mb-4"
          >
            {block.slice(3)}
          </h2>
        );
      }

      // Bold-text: **text**
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

export default async function ArtikelPage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = token ? verifySession(token) : null;
  const isMember = !!session;

  const dateStr = new Date(article.publishedAt).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const allArticles = getPublishedArticles()
    .filter((a) => a.slug !== slug)
    .slice(0, 3);

  const faqs = extractFaqs(article.body);
  const pageUrl = `https://affarsboost.se/artiklar/${slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.subtitle,
    author: {
      "@type": "Person",
      name: article.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "Affärsboost",
      url: "https://affarsboost.se",
    },
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    url: pageUrl,
    isAccessibleForFree: "False",
    hasPart: {
      "@type": "WebPageElement",
      isAccessibleForFree: "False",
      cssSelector: ".paywall-body",
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Affärsboost", item: "https://affarsboost.se" },
      { "@type": "ListItem", position: 2, name: "Artiklar", item: "https://affarsboost.se/artiklar" },
      { "@type": "ListItem", position: 3, name: article.title, item: pageUrl },
    ],
  };

  const faqSchema = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  } : null;

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
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-cream-sand bg-cream/90 backdrop-blur-sm">
        <div className="max-w-content mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/artiklar" className="text-ink-600 hover:text-navy-700 transition-colors font-medium hidden sm:block">
              ← Alla artiklar
            </Link>
            {isMember ? (
              <Link href="/privat" className="btn-primary py-2 px-4 text-sm">
                Min sida
              </Link>
            ) : (
              <Link href="/registrera" className="btn-primary py-2 px-4 text-sm">
                <span className="hidden sm:inline">Prova 3 dagar gratis</span>
                <span className="sm:hidden">Kom igång</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <article className="max-w-[720px] mx-auto px-6 py-14">
        {/* Breadcrumb */}
        <nav aria-label="Brödsmula" className="flex items-center gap-1.5 text-xs text-ink-400 mb-8">
          <Link href="/" className="hover:text-navy-700 transition-colors">Affärsboost</Link>
          <span>/</span>
          <Link href="/artiklar" className="hover:text-navy-700 transition-colors">Artiklar</Link>
          <span>/</span>
          <span className="text-ink-600 truncate max-w-[200px]">{article.title}</span>
        </nav>

        {/* Kategori + meta */}
        <div className="flex flex-wrap items-center gap-2.5 mb-6">
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[article.category]}`}
          >
            {article.categoryLabel}
          </span>
          <span className="text-xs text-ink-400">{dateStr}</span>
          <span className="text-xs text-ink-400">{article.readingTimeMinutes} min läsning</span>
        </div>

        {/* Titel */}
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy-700 leading-[1.1] mb-3">
          {article.title}
        </h1>
        <p className="text-ink-500 text-lg italic mb-10">{article.subtitle}</p>

        {/* Författarrad */}
        <div className="flex items-center gap-3 mb-12 pb-8 border-b border-cream-sand">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm ${AUTHOR_COLORS[article.author]}`}
          >
            {article.authorName[0]}
          </div>
          <div>
            <p className="font-semibold text-sm text-navy-700">{article.authorName}</p>
            <p className="text-xs text-ink-400">{article.authorRole}</p>
          </div>
        </div>

        {/* Excerpt — alltid synligt */}
        <div className="prose-section">
          {renderBody(article.excerpt)}
        </div>

        {/* Paywall-gate eller full artikel */}
        {isMember ? (
          <>
            <div className="my-10 border-t border-cream-sand" />

            {/* Full body */}
            <div className="prose-section">
              {renderBody(article.body)}
            </div>

            {/* Avslutning — författarbox */}
            <div className="mt-14 bg-navy-50 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-display font-bold ${AUTHOR_COLORS[article.author]} shrink-0`}
                >
                  {article.authorName[0]}
                </div>
                <div>
                  <p className="font-semibold text-navy-700 mb-1">{article.authorName}</p>
                  <p className="text-sm text-ink-500 mb-3">{article.authorRole} på Affärsboost</p>
                  <Link
                    href={article.author === "mikael" ? "/community" : "#linnea"}
                    className="text-sm font-semibold text-emerald-600 hover:underline"
                  >
                    {article.author === "mikael"
                      ? "Skriv i community →"
                      : `Chatta med ${article.authorName} →`}
                  </Link>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Paywall-gate */
          <div className="paywall-body relative mt-2">
            {/* Insynsskydd — oskarp text */}
            <div className="relative overflow-hidden rounded-t-2xl" aria-hidden="true">
              <div className="blur-sm select-none pointer-events-none opacity-60 px-1">
                <p className="text-ink-700 leading-relaxed mb-5">
                  {article.body.split("\n\n")[0]}
                </p>
                <p className="text-ink-700 leading-relaxed mb-5">
                  {article.body.split("\n\n")[1] ?? ""}
                </p>
              </div>
              {/* Gradient-dimma */}
              <div className="absolute inset-0 bg-gradient-to-b from-cream/0 via-cream/70 to-cream" />
            </div>

            {/* Gate-box */}
            <div className="bg-white border border-cream-sand rounded-2xl p-8 text-center shadow-sm -mt-4 relative z-10">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-5 h-5 text-emerald-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>

              <h2 className="font-display font-bold text-xl text-navy-700 mb-2">
                Läs vidare som medlem
              </h2>
              <p className="text-ink-500 text-sm mb-6 max-w-sm mx-auto">
                Hela artikeln ingår i Affärsboost. Prova 3 dagar gratis — kreditkort krävs,
                inget dras förrän dag 3.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/registrera"
                  className="btn-primary py-2.5 px-6 text-sm font-semibold"
                >
                  Prova 3 dagar gratis
                </Link>
                <Link
                  href="/login"
                  className="btn-secondary py-2.5 px-6 text-sm font-semibold"
                >
                  Logga in
                </Link>
              </div>
            </div>
          </div>
        )}
      </article>

      {/* FAQ-sektion — synlig för alla */}
      {faqs.length > 0 && (
        <section className="border-t border-cream-sand bg-cream py-14">
          <div className="max-w-[720px] mx-auto px-6">
            <h2 className="font-display text-2xl font-bold text-navy-700 mb-8">Vanliga frågor</h2>
            <div className="space-y-6">
              {faqs.map((f, i) => (
                <details key={i} className="group bg-white border border-cream-sand rounded-xl p-5 open:shadow-sm">
                  <summary className="font-semibold text-navy-700 cursor-pointer list-none flex justify-between items-center gap-4">
                    {f.q}
                    <span className="shrink-0 text-ink-400 group-open:rotate-180 transition-transform text-lg">↓</span>
                  </summary>
                  <p className="mt-3 text-ink-600 text-sm leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Fler artiklar */}
      {allArticles.length > 0 && (
        <section className="border-t border-cream-sand bg-white py-14">
          <div className="max-w-[720px] mx-auto px-6">
            <h2 className="font-display text-xl font-bold text-navy-700 mb-8">Fler artiklar</h2>
            <div className="grid sm:grid-cols-3 gap-5">
              {allArticles.map((a) => (
                <Link
                  key={a.id}
                  href={`/artiklar/${a.slug}`}
                  className="group"
                >
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[a.category]}`}
                    >
                      {a.categoryLabel}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${AUTHOR_COLORS[a.author]}`}
                    >
                      {a.authorName}
                    </span>
                  </div>
                  <p className="font-semibold text-sm text-navy-700 group-hover:text-emerald-700 transition-colors leading-snug">
                    {a.title}
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
