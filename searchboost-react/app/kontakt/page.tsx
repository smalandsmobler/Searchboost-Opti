import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import KontaktContent from "./KontaktContent";

export const metadata: Metadata = {
  title: "Kontakt & Gratis SEO-analys | Searchboost",
  description:
    "Starta din gratis SEO-analys här. Fyll i din e-post och webbplats — vi skickar en konkret rapport inom 24 timmar. Ingen bindningstid, ingen säljpitch.",
  alternates: { canonical: "https://searchboost.se/kontakt" },
  openGraph: {
    title: "Gratis SEO-analys | Searchboost",
    description: "Fyll i din sajt — vi skickar en konkret SEO-rapport inom 24h. Gratis, ingen bindningstid.",
    url: "https://searchboost.se/kontakt",
  },
};

export default function KontaktPage() {
  return (
    <>
      <Nav />
      <main>
        <PageHero
          badge="Kom igång"
          title="Gratis SEO-analys"
          titleAccent="— på riktigt"
          subtitle="Fyll i dina uppgifter nedan. Vi gör en komplett genomgång av din sajt och skickar en konkret rapport med prioriteringar inom 24 timmar."
          breadcrumb={[{ label: "Kontakt", href: "#" }]}
        />
        <KontaktContent />
      </main>
      <Footer />
    </>
  );
}
