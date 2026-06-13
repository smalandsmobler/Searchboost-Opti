import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import TjansterContent from "./TjansterContent";

export const metadata: Metadata = {
  title: "Tjänster — SEO på autopilot, Teknisk SEO & Lokal SEO | Searchboost",
  description:
    "Searchboost erbjuder AI-driven SEO-optimering varje vecka, teknisk SEO-revision och lokal SEO för svenska företag. Se priser och vad som ingår.",
  alternates: { canonical: "https://searchboost.se/tjanster" },
  openGraph: {
    title: "Tjänster | Searchboost",
    description: "AI-driven SEO-optimering varje vecka. Se priser och vad som ingår.",
    url: "https://searchboost.se/tjanster",
  },
};

export default function TjansterPage() {
  return (
    <>
      <Nav />
      <main>
        <PageHero
          badge="Vad vi erbjuder"
          title="Tjänster som"
          titleAccent="levererar resultat"
          subtitle="Tre sätt att öka din synlighet på Google. Välj det upplägg som passar — eller börja med en gratis analys och få vår rekommendation."
          breadcrumb={[{ label: "Tjänster", href: "#" }]}
        />
        <TjansterContent />
      </main>
      <Footer />
    </>
  );
}
