import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import LogoCloud from "@/components/LogoCloud";
import Stats from "@/components/Stats";
import Features from "@/components/Features";
import Services from "@/components/Services";
import Pricing from "@/components/Pricing";
import Process from "@/components/Process";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import InteractiveBackground from "@/components/InteractiveBackground";

export const metadata: Metadata = {
  title: "AI-driven SEO som optimerar sig själv — Searchboost",
  description:
    "Sveriges första SEO-byrå med autonom optimering. Vi mäter, fixar och rapporterar — du ser resultat på Google varje vecka. Gratis SEO-analys utan säljpitch.",
  alternates: { canonical: "https://searchboost.se" },
};

export default function Home() {
  return (
    <>
      {/* Fixed canvas aurora — behind everything */}
      <InteractiveBackground />
      <Nav />
      <main style={{ position: "relative", zIndex: 1 }}>
        <Hero />
        <LogoCloud />
        <Stats />
        <Features />
        <Services />
        <Pricing />
        <Process />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
