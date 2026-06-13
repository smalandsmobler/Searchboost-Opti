import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Om oss — Tre personer. En plan för ditt bolag. | Affärsboost",
  description:
    "Lär känna teamet bakom Affärsboost — Mikael Larsson, Linnéa och Maja. Vi hjälper svenska soloföretagare fatta bättre beslut, sätta rätt pris och växa utan att bränna ut sig.",
  alternates: { canonical: "https://affarsboost.se/om-oss" },
  openGraph: {
    title: "Om oss | Affärsboost",
    description: "Lär känna Mikael, Linnéa och Maja — teamet bakom Affärsboost.",
    url: "https://affarsboost.se/om-oss",
    siteName: "Affärsboost",
    locale: "sv_SE",
    type: "website",
  },
};

const teamSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Affärsboost",
  url: "https://affarsboost.se",
  description:
    "Affärsboost hjälper svenska soloföretagare och småbolagsägare fatta bättre affärsbeslut via personlig coaching och ett aktivt community.",
  foundingDate: "2026",
  founder: {
    "@type": "Person",
    name: "Mikael Larsson",
    jobTitle: "Grundare",
    description:
      "20 års erfarenhet av B2B-försäljning och affärsutveckling i Sverige.",
  },
  member: [
    {
      "@type": "Person",
      name: "Linnéa",
      jobTitle: "Affärsrådgivare",
      description: "Specialiserad på skatt, avtal och praktisk strategi för soloföretagare.",
    },
    {
      "@type": "Person",
      name: "Maja",
      jobTitle: "Tillväxtcoach",
      description: "Fokuserar på försäljning och operativ utveckling för växande bolag.",
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Affärsboost", item: "https://affarsboost.se" },
    { "@type": "ListItem", position: 2, name: "Om oss", item: "https://affarsboost.se/om-oss" },
  ],
};

const TEAM = [
  {
    name: "Mikael Larsson",
    role: "Grundare",
    bio: "Mikael har arbetat med affärsutveckling och B2B-försäljning i Sverige i 20 år. Under den tiden har han haft samtal med hundratals svenska företagare — konsulter, hantverkare, bolagsägare — och sett samma problem om och om igen: inte brist på kunskap, utan brist på omdöme. Någon att testa sin idé på. Någon som ger ett ärligt svar.\n\nHan grundade Affärsboost för att lösa det specifika problemet — inte med ett innehållsbibliotek, utan med en plats för riktiga samtal.",
    availability: "Tillgänglig personligen i Partner-planen — 90 minuter per månad.",
  },
  {
    name: "Linnéa",
    role: "Affärsrådgivare",
    bio: "Linnéa specialiserar sig på de praktiska frågorna som soloföretagare stöter på varje vecka: skatt, F-skatt, avtal, offerter, momsredovisning och hur man sätter ett pris som faktiskt håller.\n\nHon är tillgänglig i community-chatten vardagar 8–17 och svarar utifrån din specifika situation — inte med generella råd, utan med konkret vägledning.",
    availability: "Tillgänglig i community-chatten för alla Solo-, Tillväxt-, Business- och Partner-kunder.",
  },
  {
    name: "Maja",
    role: "Tillväxtcoach",
    bio: "Maja arbetar med de strategiska frågorna: hur du går från 2 Mkr till 5 Mkr, hur du bygger ett bolag som inte är helt beroende av dig, hur du rekryterar rätt och håller kvar de bästa medarbetarna.\n\nHon är direkt, analytisk och ställer de frågor du inte ställt dig själv.",
    availability: "Tillgänglig som privat 1-1 strateg från Tillväxt-planen och uppåt.",
  },
];

export default function OmOssPage() {
  return (
    <div className="min-h-screen bg-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(teamSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <nav className="sticky top-0 z-50 border-b border-cream-sand bg-cream/90 backdrop-blur-sm">
        <div className="max-w-content mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-5 text-sm font-medium text-navy-700">
            <Link href="/artiklar" className="hover:text-navy-500 transition-colors hidden sm:block">Artiklar</Link>
            <Link href="/guider" className="hover:text-navy-500 transition-colors hidden sm:block">Guider</Link>
            <Link href="/login" className="btn-secondary py-2 px-4 text-sm">Logga in</Link>
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
          <span className="text-ink-600">Om oss</span>
        </nav>

        <div className="mb-16">
          <p className="text-sm font-semibold text-emerald-600 mb-3 tracking-wide uppercase">Teamet</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy-700 mb-5">
            Tre personer. En plan för ditt bolag.
          </h1>
          <p className="text-ink-600 text-lg leading-relaxed max-w-prose">
            Affärsboost är inte ett verktyg. Det är en plats för riktiga samtal — med erfarna
            rådgivare som har tid för din specifika situation och inte bara generella råd.
          </p>
        </div>

        <div className="space-y-12">
          {TEAM.map((member) => (
            <div key={member.name} className="bg-white rounded-2xl border border-cream-sand p-8">
              <div className="flex items-start gap-5 mb-5">
                <div className="w-14 h-14 rounded-full bg-navy-100 flex items-center justify-center font-display font-bold text-xl text-navy-700 shrink-0">
                  {member.name[0]}
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-navy-700">{member.name}</h2>
                  <p className="text-sm text-emerald-600 font-semibold">{member.role}</p>
                </div>
              </div>
              {member.bio.split("\n\n").map((para, i) => (
                <p key={i} className="text-ink-600 leading-relaxed mb-3">{para}</p>
              ))}
              <div className="mt-4 pt-4 border-t border-cream-sand">
                <p className="text-xs text-ink-400 font-medium">{member.availability}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-br from-navy-700 to-navy-900 rounded-2xl p-8 text-white text-center">
          <h2 className="font-display text-2xl font-bold mb-2">Testa om Affärsboost passar dig</h2>
          <p className="text-navy-100 text-sm mb-6 max-w-md mx-auto">
            Tre dagar gratis. Chatta med Linnéa, ladda ner mallar, se om det ger dig värde.
            Kreditkort krävs — inget dras förrän dag 3.
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
