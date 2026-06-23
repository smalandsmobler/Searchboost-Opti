import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import OmOssContent from "./OmOssContent";

export const metadata: Metadata = {
  title: "Om oss — Varför Searchboost? | SEO-byrå Sverige",
  description:
    "Lär känna Searchboost — Sveriges AI-drivna SEO-byrå. Vi kombinerar maskininlärning med mänsklig strategi för att leverera mätbara resultat varje vecka.",
  alternates: { canonical: "https://searchboost.se/om-oss" },
  openGraph: {
    title: "Om oss | Searchboost",
    description: "Lär känna Searchboost — AI-driven SEO-byrå som levererar varje vecka.",
    url: "https://searchboost.se/om-oss",
  },
};

export default function OmOssPage() {
  return (
    <>
      <Nav />
      <main>
        <PageHero
          badge="Vår historia"
          title="SEO utan"
          titleAccent="kompromisser"
          subtitle="Vi grundade Searchboost med ett enkelt mål: ge svenska företag tillgång till den SEO-kunskap och de verktyg som tidigare bara storbyrårna hade råd med."
          breadcrumb={[{ label: "Om oss", href: "#" }]}
        />
        <OmOssContent />
      </main>
      <Footer />
    </>
  );
}
