import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import TrackingScripts from "@/components/TrackingScripts";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Affärsboost — Affärscoaching för svenska soloföretagare",
    template: "%s | Affärsboost",
  },
  description:
    "Affärscoaching för svenska soloföretagare och småbolagsägare. Prissättning, strategi, ledarskap och AI — med Linnéa, Maja och Mikael Larsson. Från 297 kr/mån, säg upp när du vill.",
  keywords: [
    "affärscoaching",
    "soloföretagare",
    "egenföretagare",
    "prissättning konsult",
    "affärsstrategi",
    "coaching småföretagare",
    "F-skatt guide",
    "timpris frilansare",
    "affärsutveckling Sverige",
    "starta företag råd",
  ],
  authors: [
    { name: "Mikael Larsson", url: "https://affarsboost.se/om-oss" },
    { name: "Searchboost AB", url: "https://searchboost.se" },
  ],
  creator: "Searchboost AB",
  publisher: "Affärsboost / Searchboost AB",
  metadataBase: new URL("https://affarsboost.se"),
  alternates: {
    canonical: "https://affarsboost.se",
    languages: { "sv-SE": "https://affarsboost.se" },
  },
  openGraph: {
    title: "Affärsboost — Affärscoaching för svenska soloföretagare",
    description:
      "Personlig coaching med Linnéa, Maja och Mikael Larsson. Prissättning, strategi, ledarskap, AI — från 297 kr/mån.",
    url: "https://affarsboost.se",
    siteName: "Affärsboost",
    locale: "sv_SE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Affärsboost — Coaching för svenska företagare",
    description: "Linnéa, Maja och Mikael Larsson hjälper dig fatta bättre affärsbeslut. Från 297 kr/mån.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION ?? undefined,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://affarsboost.se/#organization",
      name: "Affärsboost",
      alternateName: "Affärsboost — en del av Searchboost AB",
      url: "https://affarsboost.se",
      logo: "https://affarsboost.se/logo.png",
      foundingDate: "2026",
      description:
        "Affärsboost är en coaching-plattform för svenska soloföretagare och småbolagsägare med AI-rådgivare Linnéa, tillväxtcoachen Maja och grundaren Mikael Larsson. Prenumeration från 297 kr/mån.",
      contactPoint: {
        "@type": "ContactPoint",
        email: "hej@affarsboost.se",
        contactType: "customer support",
        availableLanguage: "Swedish",
        areaServed: "SE",
      },
      parentOrganization: {
        "@type": "Organization",
        "@id": "https://searchboost.se/#organization",
        name: "Searchboost AB",
        url: "https://searchboost.se",
      },
      areaServed: { "@type": "Country", name: "Sweden" },
      sameAs: [
        "https://searchboost.se",
        "https://linkedin.com/company/searchboost",
        "https://www.facebook.com/affarsboost.se",
        "https://www.instagram.com/affarsboost.se",
      ],
      member: [
        {
          "@type": "Person",
          name: "Mikael Larsson",
          jobTitle: "Grundare",
          worksFor: { "@id": "https://affarsboost.se/#organization" },
          description: "20 år av B2B-affärsutveckling i Sverige. Grundare av Affärsboost och Searchboost AB.",
        },
      ],
    },
    {
      "@type": "Service",
      "@id": "https://affarsboost.se/#service",
      name: "Affärsboost-coaching",
      serviceType: "Affärscoaching",
      description:
        "Personlig affärscoaching för svenska soloföretagare via AI-rådgivaren Linnéa och tillväxtcoachen Maja. Hjälp med prissättning, strategi, ledarskap och AI-implementering.",
      provider: { "@id": "https://affarsboost.se/#organization" },
      areaServed: { "@type": "Country", name: "Sweden" },
      inLanguage: "sv-SE",
      offers: [
        {
          "@type": "Offer",
          name: "Solo",
          price: "297",
          priceCurrency: "SEK",
          description: "Community-chat med Linnéa, 3 dagars gratis trial.",
          priceSpecification: { "@type": "UnitPriceSpecification", price: "297", priceCurrency: "SEK", unitText: "MONTH" },
        },
        {
          "@type": "Offer",
          name: "Tillväxt",
          price: "1000",
          priceCurrency: "SEK",
          description: "Allt i Solo plus obegränsad coaching och privat 1-1 med Maja.",
          priceSpecification: { "@type": "UnitPriceSpecification", price: "1000", priceCurrency: "SEK", unitText: "MONTH" },
        },
        {
          "@type": "Offer",
          name: "Business",
          price: "3000",
          priceCurrency: "SEK",
          description: "Allt i Tillväxt plus 5 platser, ads-analys och 1 AI-automation per kvartal.",
          priceSpecification: { "@type": "UnitPriceSpecification", price: "3000", priceCurrency: "SEK", unitText: "MONTH" },
        },
        {
          "@type": "Offer",
          name: "Partner",
          price: "10000",
          priceCurrency: "SEK",
          description: "Allt plus dedikerad tillgång till Mikael Larsson och AI-implementering.",
          priceSpecification: { "@type": "UnitPriceSpecification", price: "10000", priceCurrency: "SEK", unitText: "MONTH" },
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://affarsboost.se/#website",
      url: "https://affarsboost.se",
      name: "Affärsboost",
      publisher: { "@id": "https://affarsboost.se/#organization" },
      inLanguage: "sv-SE",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: "https://affarsboost.se/guider?q={search_term_string}" },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://affarsboost.se/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "Vad är Affärsboost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Affärsboost är en coaching-plattform för svenska soloföretagare och småbolagsägare. Medlemmar får tillgång till AI-rådgivaren Linnéa, tillväxtcoachen Maja och grundaren Mikael Larsson för personlig vägledning om prissättning, strategi, ledarskap och affärsutveckling. Prenumeration från 297 kr/mån.",
          },
        },
        {
          "@type": "Question",
          name: "Vad kostar Affärsboost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Affärsboost erbjuder fyra planer: Solo 297 kr/mån (community-chat med Linnéa, 3 dagars gratis trial), Tillväxt 1 000 kr/mån (obegränsad coaching + privat 1-1 med Maja), Business 3 000 kr/mån (5 platser + ads-analys + AI-automation), Partner 10 000 kr/mån (dedikerad tillgång till Mikael Larsson + AI-implementering).",
          },
        },
        {
          "@type": "Question",
          name: "Kan jag prova Affärsboost gratis?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Ja — Solo-planen har 3 dagars gratis trial. Kreditkort krävs men inget dras förrän dag 3. Du kan säga upp när som helst utan frågor.",
          },
        },
        {
          "@type": "Question",
          name: "Vem är Linnéa på Affärsboost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Linnéa är Affärsboosts AI-rådgivare. Hon specialiserar sig på skatt, F-skatt, avtal, offerter och prissättning för soloföretagare. Linnéa är tillgänglig i community-chatten vardagar 08–17 och svarar utifrån din specifika situation.",
          },
        },
        {
          "@type": "Question",
          name: "Vem är Maja på Affärsboost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Maja är Affärsboosts tillväxtcoach. Hon arbetar med strategiska frågor som skalning, rekrytering, ledarskap och hur du tar ditt bolag från 2 till 5 Mkr i omsättning. Maja är tillgänglig som privat 1-1 från Tillväxt-planen.",
          },
        },
        {
          "@type": "Question",
          name: "Vem grundade Affärsboost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Affärsboost grundades av Mikael Larsson, som har 20 års erfarenhet av B2B-affärsutveckling och har arbetat med hundratals svenska företagare. Affärsboost är en del av Searchboost AB.",
          },
        },
        {
          "@type": "Question",
          name: "Vad skiljer Affärsboost från vanliga kurser?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Affärsboost är inte en kurs — det är ett löpande coachingstöd. Istället för förinspelat innehåll får du tillgång till rådgivare som svarar på din specifika situation i realtid. Cohort-programmen har 80% genomförandegrad jämfört med 5% för traditionella onlinekurser.",
          },
        },
      ],
    },
  ],
};

const GTM_ID_NOSCRIPT = process.env.NEXT_PUBLIC_GTM_ID
  ? `<iframe src="https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`
  : "";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={`${inter.variable} ${jakarta.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <TrackingScripts />
        {GTM_ID_NOSCRIPT && (
          <noscript dangerouslySetInnerHTML={{ __html: GTM_ID_NOSCRIPT }} />
        )}
        {children}
      </body>
    </html>
  );
}
