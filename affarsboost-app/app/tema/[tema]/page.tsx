import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getPublishedArticles,
  AUTHOR_COLORS,
  CATEGORY_COLORS,
  type ArticleCategory,
} from "@/lib/articles";
import Logo from "@/components/Logo";

interface Props {
  params: Promise<{ tema: string }>;
}

const TEMA_META: Record<
  ArticleCategory,
  { title: string; description: string; h1: string; ingress: string }
> = {
  ledartext: {
    title: "Ledartexer om egenföretagande | Affärsboost",
    description:
      "Ärliga texter om livet som soloföretagare — ensamheten, prissättningen och besluten ingen pratar om.",
    h1: "Ledartexter",
    ingress:
      "Ärliga texter om livet som soloföretagare. Inte motivationstal — utan observationer från verkligheten om vad som faktiskt är svårt och vad som faktiskt hjälper.",
  },
  strategi: {
    title: "Affärsstrategi för småföretagare | Affärsboost",
    description:
      "Praktisk strategi för soloföretagare och småbolag — prissättning, tillväxt, fokus och beslut som driver ditt företag framåt.",
    h1: "Strategi",
    ingress:
      "Praktisk affärsstrategi för dig som driver eget. Hur du prissätter rätt, väljer fokus, fattar bättre beslut — och slutar lägga tid på det som inte driver bolaget framåt.",
  },
  mindset: {
    title: "Mindset och psykologi för egenföretagare | Affärsboost",
    description:
      "Om psykologin bakom att driva eget — impostorsyndrom, stress, balans och det mentala arbete ingen lär sig på kurs.",
    h1: "Mindset",
    ingress:
      "Det mentala arbetet som ingen lär ut. Om impostorsyndrom, stress, ensamhet och balans — skrivet för dig som driver eget och vet att det handlar om mer än affärsmodellen.",
  },
  ai: {
    title: "AI för egenföretagare och småbolag | Affärsboost",
    description:
      "Hur du faktiskt använder AI i ditt företag — vilka verktyg som sparar tid och vad som bara ser bra ut på papper.",
    h1: "AI i företaget",
    ingress:
      "Konkreta råd om AI för dig som driver eget. Vilka verktyg som faktiskt sparar tid, vad som kräver för mycket upplärningstid och hur du undviker att lägga pengar på fel saker.",
  },
  community: {
    title: "Community och nätverk för företagare | Affärsboost",
    description:
      "Om vikten av rätt umgänge när du driver eget — community, mentorer, advisory boards och varför du inte ska göra det ensam.",
    h1: "Community",
    ingress:
      "Om vikten av rätt umgänge när du driver eget. Mentorer, advisory boards, community-byggande — och varför ensamheten kostar mer än de flesta tror.",
  },
  management: {
    title: "Ledarskap och HR för växande bolag | Affärsboost",
    description:
      "Praktiskt ledarskap för småbolagsägare — rekrytering, onboarding, retention, lönesamtal och kultur.",
    h1: "Management",
    ingress:
      "Praktiskt ledarskap för dig som bygger ett team. Hur du rekryterar rätt, onboardar nya medarbetare, håller kvar de bästa och för de samtal som alla skjuter upp.",
  },
};

const SLUG_TO_CATEGORY: Record<string, ArticleCategory> = {
  ledartext: "ledartext",
  strategi: "strategi",
  mindset: "mindset",
  ai: "ai",
  community: "community",
  management: "management",
};

export async function generateStaticParams() {
  return Object.keys(SLUG_TO_CATEGORY).map((tema) => ({ tema }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tema } = await params;
  const category = SLUG_TO_CATEGORY[tema];
  if (!category) return {};
  const meta = TEMA_META[category];
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `https://affarsboost.se/tema/${tema}` },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://affarsboost.se/tema/${tema}`,
      siteName: "Affärsboost",
      locale: "sv_SE",
      type: "website",
    },
  };
}

export default async function TemaPage({ params }: Props) {
  const { tema } = await params;
  const category = SLUG_TO_CATEGORY[tema];
  if (!category) notFound();

  const meta = TEMA_META[category];
  const articles = getPublishedArticles().filter((a) => a.category === category);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Affärsboost", item: "https://affarsboost.se" },
      { "@type": "ListItem", position: 2, name: "Artiklar", item: "https://affarsboost.se/artiklar" },
      { "@type": "ListItem", position: 3, name: meta.h1, item: `https://affarsboost.se/tema/${tema}` },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: meta.h1,
    description: meta.description,
    numberOfItems: articles.length,
    itemListElement: articles.map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://affarsboost.se/artiklar/${a.slug}`,
      name: a.title,
    })),
  };

  return (
    <div className="min-h-screen bg-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <nav className="sticky top-0 z-50 border-b border-cream-sand bg-cream/90 backdrop-blur-sm">
        <div className="max-w-content mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-5 text-sm font-medium text-navy-700">
            <Link href="/artiklar" className="hover:text-navy-500 transition-colors hidden sm:block">
              ← Alla artiklar
            </Link>
            <Link href="/registrera" className="btn-primary py-2 px-4 text-sm">
              <span className="hidden sm:inline">Prova 3 dagar gratis</span>
              <span className="sm:hidden">Kom igång</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-[820px] mx-auto px-6 py-16">
        <nav aria-label="Brödsmula" className="flex items-center gap-1.5 text-xs text-ink-400 mb-8">
          <Link href="/" className="hover:text-navy-700 transition-colors">Affärsboost</Link>
          <span>/</span>
          <Link href="/artiklar" className="hover:text-navy-700 transition-colors">Artiklar</Link>
          <span>/</span>
          <span className="text-ink-600">{meta.h1}</span>
        </nav>

        <div className="mb-12">
          <span className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full mb-4 ${CATEGORY_COLORS[category]}`}>
            {meta.h1}
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy-700 mb-4">
            {meta.h1}
          </h1>
          <p className="text-ink-600 text-lg leading-relaxed max-w-prose">{meta.ingress}</p>
        </div>

        {articles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-cream-sand p-10 text-center">
            <p className="text-ink-500">Artiklar publiceras inom kort.</p>
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
                    <div className="flex flex-wrap items-center gap-2.5 mb-3">
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${AUTHOR_COLORS[article.author]}`}>
                        {article.authorName}
                      </span>
                      <span className="text-xs text-ink-400">{dateStr}</span>
                      <span className="text-xs text-ink-400">{article.readingTimeMinutes} min</span>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-navy-700 mb-1.5 group-hover:text-emerald-700 transition-colors">
                      {article.title}
                    </h2>
                    <p className="text-sm text-ink-500 mb-4 italic">{article.subtitle}</p>
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

        <div className="mt-16 bg-gradient-to-br from-navy-700 to-navy-900 rounded-2xl p-8 text-white text-center">
          <h2 className="font-display text-2xl font-bold mb-2">
            Vill du diskutera {meta.h1.toLowerCase()} för just ditt bolag?
          </h2>
          <p className="text-navy-100 text-sm mb-6 max-w-md mx-auto">
            I Affärsboost kan du ställa frågor om din specifika situation till en erfaren affärscoach.
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
