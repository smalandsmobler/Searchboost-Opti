import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Affärsboost — Allt för ditt företag, en månadsavgift",
  description:
    "Från startbidrag till AI-driven marknadsföring. Veckonyhetsbrev, mallar och AI-coach för soloföretagare och etablerade bolag. Från 299 kr/mån, säg upp när du vill.",
  keywords: [
    "starta företag",
    "soloföretagare",
    "AI-marknadsföring",
    "momsavdrag",
    "startbidrag",
    "egenföretagare",
    "småföretag",
    "affärsutveckling",
  ],
  authors: [{ name: "Searchboost AB", url: "https://searchboost.se" }],
  creator: "Searchboost AB",
  publisher: "Searchboost AB",
  metadataBase: new URL("https://affarsboost.se"),
  alternates: {
    canonical: "https://affarsboost.se",
    languages: { "sv-SE": "https://affarsboost.se" },
  },
  openGraph: {
    title: "Affärsboost — Allt för ditt företag, en månadsavgift",
    description:
      "Bygg ditt företag eller ta nästa steg. AI-driven affärsutveckling för soloföretagare och etablerade bolag. Från 299 kr/mån.",
    url: "https://affarsboost.se",
    siteName: "Affärsboost",
    locale: "sv_SE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Affärsboost — Allt för ditt företag",
    description: "Från startbidrag till AI-marknadsföring. Från 299 kr/mån.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
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
      parentOrganization: {
        "@type": "Organization",
        "@id": "https://searchboost.se/#organization",
        name: "Searchboost AB",
        url: "https://searchboost.se",
      },
      areaServed: { "@type": "Country", name: "Sweden" },
      sameAs: [
        "https://linkedin.com/company/searchboost",
        "https://searchboost.se",
      ],
    },
    {
      "@type": "Service",
      "@id": "https://affarsboost.se/#service",
      name: "Affärsboost-medlemskap",
      description:
        "AI-driven affärsutveckling med veckonyhetsbrev, mallbibliotek, AI-coach och community för svenska företagare.",
      provider: { "@id": "https://affarsboost.se/#organization" },
      areaServed: "SE",
      offers: {
        "@type": "Offer",
        price: "299",
        priceCurrency: "SEK",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "299",
          priceCurrency: "SEK",
          unitText: "MONTH",
        },
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://affarsboost.se/#website",
      url: "https://affarsboost.se",
      name: "Affärsboost",
      publisher: { "@id": "https://affarsboost.se/#organization" },
      inLanguage: "sv-SE",
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={`${inter.variable} ${jakarta.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
