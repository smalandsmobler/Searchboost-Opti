import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Searchboost — AI-Driven SEO som optimerar sig självt",
  description:
    "SEO-byrå i Sverige med automatisk optimering varje vecka. Gratis SEO-analys — vi visar exakt vad som håller din sajt tillbaka och ger en konkret plan utan säljpitch.",
  keywords: [
    "SEO-byrå Sverige",
    "sökmotoroptimering",
    "teknisk SEO",
    "AI SEO",
    "lokal SEO",
    "SEO-analys gratis",
    "WordPress SEO",
    "Google ranking",
    "sökoptimering",
  ],
  authors: [{ name: "Searchboost", url: "https://searchboost.se" }],
  creator: "Searchboost",
  publisher: "Searchboost",
  metadataBase: new URL("https://searchboost.se"),
  alternates: {
    canonical: "https://searchboost.se",
    languages: { "sv-SE": "https://searchboost.se" },
  },
  openGraph: {
    title: "Searchboost — AI-Driven SEO som optimerar sig självt",
    description:
      "Automatisk SEO-optimering varje vecka. Gratis analys, ingen säljpitch. +180% organisk trafik i snitt.",
    url: "https://searchboost.se",
    siteName: "Searchboost",
    locale: "sv_SE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Searchboost — AI-Driven SEO",
    description:
      "Automatisk SEO-optimering varje vecka. Gratis analys, ingen säljpitch.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://searchboost.se/#organization",
      name: "Searchboost",
      url: "https://searchboost.se",
      logo: {
        "@type": "ImageObject",
        url: "https://searchboost.se/logo.png",
        width: 300,
        height: 100,
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+46728634279",
        contactType: "customer service",
        availableLanguage: "Swedish",
      },
      sameAs: [
        "https://instagram.com/searchboost",
        "https://linkedin.com/company/searchboost",
        "https://twitter.com/searchboost",
      ],
    },
    {
      "@type": "ProfessionalService",
      "@id": "https://searchboost.se/#business",
      name: "Searchboost",
      description:
        "AI-driven SEO-byrå med automatisk optimering varje vecka. Vi hjälper svenska företag att synas på Google.",
      url: "https://searchboost.se",
      telephone: "+46728634279",
      email: "info@searchboost.se",
      priceRange: "$$",
      areaServed: { "@type": "Country", name: "Sweden" },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "50",
        bestRating: "5",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://searchboost.se/#website",
      url: "https://searchboost.se",
      name: "Searchboost",
      publisher: { "@id": "https://searchboost.se/#organization" },
      inLanguage: "sv-SE",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" className={jakarta.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased bg-[#05050f] text-[#c8b8e0] overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
