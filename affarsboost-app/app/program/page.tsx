import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Program — Gruppcoaching för svenska företagare | Affärsboost",
  description:
    "Cohort-baserade program i prissättning, försäljning och digital synlighet. 8–10 veckor, max 12 deltagare, ett konkret leverabel. Från 4 900 kr.",
  alternates: { canonical: "https://affarsboost.se/program" },
  openGraph: {
    title: "Program — Gruppcoaching | Affärsboost",
    description: "Prissättning, försäljning och digital synlighet — 8–10 veckor med max 12 deltagare.",
    url: "https://affarsboost.se/program",
    siteName: "Affärsboost",
    locale: "sv_SE",
    type: "website",
  },
};

const PROGRAMS = [
  {
    id: "prissattning",
    title: "Prissättning",
    startDate: "9 juni 2026",
    weeks: 8,
    seats: 12,
    price: "4 900 kr",
    deliverable: "En höjd offert som du skickat och fått ja på",
    description:
      "Du lär dig räkna ut vad ditt arbete faktiskt är värt, kommunicera det utan att ursäkta sig och hantera prisdiskussioner med kunder — utan att gå ner i pris automatiskt.",
    topics: [
      "Värdebaserad prissättning vs timtaxa",
      "Hur du räknar ut ditt rätta timpris",
      "Offertstruktur som vinner utan priskonkurrens",
      "Hur du höjer priset med befintliga kunder",
      "Förhandlingsteknik som inte känns säljig",
    ],
    spotsLeft: null,
  },
  {
    id: "forsaljning",
    title: "Försäljning",
    startDate: "23 juni 2026",
    weeks: 8,
    seats: 12,
    price: "4 900 kr",
    deliverable: "Bokade kundmöten och en mötesmall du kan använda direkt",
    description:
      "En säljprocess som inte känns som försäljning. Du bygger en metod för att hitta rätt kunder, få möten och stänga affärer — utan att behöva vara en utåtriktad person.",
    topics: [
      "Hur du identifierar dina bästa potentiella kunder",
      "Kall kontakt som faktiskt ger svar",
      "Kundmötet som bygger förtroende snabbt",
      "Uppföljning utan att kännas desperat",
      "Hur du hanterar invändningar utan att ge rabatt",
    ],
    spotsLeft: null,
  },
  {
    id: "digital-synlighet",
    title: "Digital synlighet",
    startDate: "7 juli 2026",
    weeks: 10,
    seats: 10,
    price: "5 900 kr",
    deliverable: "En live kampanj och rankade söktermer för ditt bolag",
    description:
      "SEO och Google Ads på riktigt — inte en kurs om teorin, utan ett program där du faktiskt bygger och lanserar din digitala närvaro under de tio veckorna.",
    topics: [
      "Sökordsanalys och innehållsstrategi",
      "On-page SEO och teknisk grund",
      "Google Search Console och Analytics",
      "Google Ads från noll — kampanjstruktur och budgetering",
      "Mätning och optimering av resultat",
    ],
    spotsLeft: 3,
  },
];

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Program — Affärsboost",
  numberOfItems: PROGRAMS.length,
  itemListElement: PROGRAMS.map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: p.title,
    item: {
      "@type": "Course",
      name: p.title,
      description: p.description,
      provider: { "@type": "Organization", name: "Affärsboost", url: "https://affarsboost.se" },
      offers: {
        "@type": "Offer",
        price: p.price.replace(" kr", ""),
        priceCurrency: "SEK",
        availability: "https://schema.org/InStock",
      },
    },
  })),
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Affärsboost", item: "https://affarsboost.se" },
    { "@type": "ListItem", position: 2, name: "Program", item: "https://affarsboost.se/program" },
  ],
};

export default function ProgramPage() {
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

      <nav className="sticky top-0 z-50 border-b border-cream-sand bg-cream/90 backdrop-blur-sm">
        <div className="max-w-content mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-5 text-sm font-medium text-navy-700">
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
          <span className="text-ink-600">Program</span>
        </nav>

        <div className="mb-14">
          <p className="text-sm font-semibold text-emerald-600 mb-3 tracking-wide uppercase">
            Cohort-baserade program
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy-700 mb-5">
            Lär dig med en grupp — inte ensam
          </h1>
          <p className="text-ink-600 text-lg leading-relaxed max-w-prose">
            Traditionella onlinekurser har 5% genomförandegrad. Våra program har 80%. Skillnaden
            är att du gör det med en liten grupp, med deadlines och med ett konkret leverabel
            när programmet är klart.
          </p>
        </div>

        <div className="space-y-8">
          {PROGRAMS.map((program) => (
            <div key={program.id} className="bg-white rounded-2xl border border-cream-sand p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="font-display text-2xl font-bold text-navy-700 mb-1">
                    {program.title}
                  </h2>
                  <div className="flex flex-wrap gap-3 text-sm text-ink-500">
                    <span>Start: {program.startDate}</span>
                    <span>{program.weeks} veckor</span>
                    <span>Max {program.seats} deltagare</span>
                    {program.spotsLeft && (
                      <span className="text-rose-600 font-semibold">
                        Endast {program.spotsLeft} platser kvar
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-bold text-navy-700">{program.price}</p>
                  <p className="text-xs text-ink-400">exkl. moms</p>
                </div>
              </div>

              <p className="text-ink-600 leading-relaxed mb-5">{program.description}</p>

              <div className="mb-5">
                <p className="text-sm font-semibold text-navy-700 mb-2">Vad du lär dig:</p>
                <ul className="space-y-1">
                  {program.topics.map((topic, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-600">
                      <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-5 border-t border-cream-sand flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-ink-400 uppercase font-semibold tracking-wide mb-0.5">
                    Konkret leverabel
                  </p>
                  <p className="text-sm font-semibold text-navy-700">{program.deliverable}</p>
                </div>
                <Link
                  href="/registrera"
                  className="btn-primary py-2.5 px-5 text-sm font-semibold shrink-0"
                >
                  Anmäl mig
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-navy-50 rounded-2xl p-6">
          <p className="font-semibold text-navy-700 mb-1">Varje program innehåller:</p>
          <ul className="mt-3 space-y-2">
            {[
              "Veckovisa videolektioner",
              "45–60 min gruppmöte online varje vecka",
              "Privat chattgrupp med deltagarna",
              "Direktaccess till programledaren",
              "Ett konkret leverabel vid avslut",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-ink-600">
                <span className="text-emerald-500">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
