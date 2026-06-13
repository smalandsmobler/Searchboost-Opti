import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import InteractiveBackground from "@/components/InteractiveBackground";
import Link from "next/link";
import {
  CheckCircle2,
  Share2,
  Users,
  MessageCircle,
  TrendingUp,
  Zap,
  ArrowRight,
  ChevronRight,
  BarChart3,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Social Media-marknadsföring — LinkedIn, Instagram & Facebook | Searchboost",
  description:
    "AI-genererat innehåll för LinkedIn, Instagram och Facebook. Vi bygger er närvaro på sociala medier med konsekvent publicering som stärker varumärket och driver trafik.",
  alternates: { canonical: "https://searchboost.se/tjanster/social-medier/" },
  openGraph: {
    title: "Social Media | Searchboost",
    description: "LinkedIn, Instagram och Facebook — AI-genererat innehåll varje vecka.",
    url: "https://searchboost.se/tjanster/social-medier/",
  },
};

const included = [
  "Innehållsstrategi anpassad för er bransch",
  "AI-genererade inlägg varje vecka",
  "LinkedIn — company page-hantering",
  "Instagram — feed & stories",
  "Facebook — sida och inlägg",
  "Hashtagg-strategi & optimering",
  "Månadsvis analys av räckvidd och engagemang",
  "Ingår i Premiums SEO-paket",
];

const platforms = [
  {
    name: "LinkedIn",
    color: "#60a5fa",
    desc: "Perfekt för B2B. Vi skapar thought leadership-innehåll, delar insikter och håller er company page aktiv med relevanta inlägg som når beslutsfattare.",
    metrics: ["Räckvidd bland yrkesverksamma", "Thought leadership", "B2B lead generation"],
  },
  {
    name: "Instagram",
    color: "#e91e8c",
    desc: "Visuellt varumärkesbyggande. Stories, reels och feedposter som kommunicerar er identitet och skapar engagemang hos rätt målgrupp.",
    metrics: ["Visuellt varumärke", "Engagemang & följare", "Produktvisning"],
  },
  {
    name: "Facebook",
    color: "#a78bfa",
    desc: "Bred räckvidd och remarketing. Vi håller er sida aktiv med inlägg som stödjer era övriga marknadsföringsinsatser.",
    metrics: ["Bred demografisk räckvidd", "Remarketing-grund", "Lokal synlighet"],
  },
];

const steps = [
  {
    num: "01",
    title: "Varumärkesanalys",
    desc: "Vi kartlägger er ton, målgrupp och konkurrenter. Vad ska sociala medier uppnå för er?",
  },
  {
    num: "02",
    title: "Innehållsstrategi",
    desc: "Innehållstyper, publiceringsfrekvens och teman sätts per plattform. Allt godkänns av er.",
  },
  {
    num: "03",
    title: "AI-produktion",
    desc: "Vår AI producerar inlägg med rätt ton och budskap. Ni granskar och godkänner — eller låter oss publicera direkt.",
  },
  {
    num: "04",
    title: "Analys & förbättring",
    desc: "Månadsvis genomgång av räckvidd, engagemang och klick. Vi justerar strategi löpande.",
  },
];

const faqs = [
  {
    q: "Ingår social media i SEO-paketen?",
    a: "LinkedIn-postning ingår i Premium-paketet. Vill ni ha hantering av fler plattformar kan vi lägga till det som ett tillägg.",
  },
  {
    q: "Behöver vi godkänna varje inlägg?",
    a: "Ni väljer. Antingen granskar ni och godkänner varje inlägg innan publicering, eller ger ni oss mandat att publicera direkt baserat på en godkänd strategi.",
  },
  {
    q: "Skapar ni bildmaterial?",
    a: "Vi skapar textbaserade inlägg och kan producera grafik med AI. Har ni egna bilder och foton arbetar vi gärna med det materialet för bättre autenticitet.",
  },
  {
    q: "Hur mäter ni resultaten?",
    a: "Vi rapporterar räckvidd, impressioner, engagemang och klick per plattform varje månad. Kopplar vi ihop med GA4 ser ni även hur social-trafiken konverterar på sajten.",
  },
  {
    q: "Kan ni starta från noll om vi inte har några konton?",
    a: "Ja. Vi skapar och konfigurerar era konton korrekt — company page på LinkedIn, Instagram Business och Facebook-sida — och optimerar profilerna för sökning.",
  },
];

export default function SocialMedierPage() {
  return (
    <>
      <InteractiveBackground />
      <Nav />
      <main style={{ position: "relative", zIndex: 1 }}>

        {/* Hero */}
        <section className="pt-40 pb-16 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(167,139,250,0.06) 0%, transparent 70%)",
            }}
          />
          <div className="max-w-4xl mx-auto px-6">
            <nav className="flex items-center gap-1.5 text-xs mb-8" style={{ color: "#5a5070" }}>
              <Link href="/" className="hover:text-[#a78bfa] transition-colors">Hem</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/tjanster" className="hover:text-[#a78bfa] transition-colors">Tjänster</Link>
              <ChevronRight className="w-3 h-3" />
              <span style={{ color: "#9080a8" }}>Social Media</span>
            </nav>

            <span
              className="inline-block text-xs font-bold tracking-[0.25em] uppercase mb-5 px-4 py-1.5 rounded-full"
              style={{ color: "#a78bfa", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.22)" }}
            >
              Sociala medier
            </span>

            <h1
              className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-[1.06]"
              style={{ color: "#f0eafa" }}
            >
              Social media som{" "}
              <span style={{ color: "#a78bfa" }}>bygger varumärke</span>{" "}
              — automatiskt
            </h1>

            <p className="text-lg max-w-2xl mb-10 leading-relaxed" style={{ color: "#8a7ea8" }}>
              AI-genererat innehåll för LinkedIn, Instagram och Facebook — publicerat konsekvent varje
              vecka. Ni syns där era kunder är, utan att det tar tid från kärnverksamheten.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/kontakt"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)", boxShadow: "0 0 24px rgba(167,139,250,0.3)" }}
              >
                Kom igång <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/tjanster"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#c8b8e0" }}
              >
                Alla tjänster
              </Link>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-4xl mx-auto px-6">
          <div className="h-px" style={{ background: "linear-gradient(90deg, rgba(167,139,250,0.4), rgba(255,255,255,0.06), transparent)" }} />
        </div>

        {/* Platforms */}
        <section className="py-16 max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8" style={{ color: "#f0eafa" }}>
            Plattformar vi hanterar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {platforms.map((p) => (
              <div
                key={p.name}
                className="p-6 rounded-xl flex flex-col gap-3"
                style={{ background: "rgba(8,8,24,0.75)", border: `1px solid ${p.color}20` }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-px rounded-t-xl"
                  style={{ background: `linear-gradient(90deg, transparent, ${p.color}50, transparent)` }}
                />
                <h3 className="text-base font-bold" style={{ color: p.color }}>{p.name}</h3>
                <p className="text-sm leading-relaxed flex-1" style={{ color: "#7a6e90" }}>{p.desc}</p>
                <ul className="flex flex-col gap-1.5">
                  {p.metrics.map((m) => (
                    <li key={m} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: p.color }} />
                      <span className="text-[11px]" style={{ color: "#8a7ea8" }}>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* What's included */}
        <section className="py-10 max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8" style={{ color: "#f0eafa" }}>
            Vad ingår
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {included.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                style={{ background: "rgba(8,8,24,0.65)", border: "1px solid rgba(167,139,250,0.12)" }}
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#a78bfa" }} />
                <span className="text-sm" style={{ color: "#c8b8e0" }}>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Why */}
        <section className="py-10 max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8" style={{ color: "#f0eafa" }}>
            Varför konsekvent närvaro på sociala medier spelar roll
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Users, title: "Varumärkeskännedom", desc: "Ni syns regelbundet i flödena hos er målgrupp. Konsekvens bygger förtroende och igenkänning." },
              { icon: TrendingUp, title: "Organisk räckvidd", desc: "Aktiva konton belönas av algoritmerna. Regelbundna inlägg ger större räckvidd utan annonskostnader." },
              { icon: MessageCircle, title: "Engagemang", desc: "Relevanta inlägg skapar kommentarer och delningar. Engagemang ökar er räckvidd organiskt." },
              { icon: BarChart3, title: "SEO-stöd", desc: "Social aktivitet stärker varumärkessignaler som indirekt påverkar er organiska sökordsrankning." },
            ].map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="p-5 rounded-xl flex flex-col gap-3"
                  style={{ background: "rgba(8,8,24,0.65)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)" }}
                  >
                    <Icon className="w-4 h-4" style={{ color: "#a78bfa" }} />
                  </div>
                  <h3 className="text-sm font-bold" style={{ color: "#f0eafa" }}>{b.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#7a6e90" }}>{b.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Process */}
        <section className="py-10 max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8" style={{ color: "#f0eafa" }}>Hur vi jobbar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s) => (
              <div
                key={s.num}
                className="p-5 rounded-xl flex flex-col gap-2"
                style={{ background: "rgba(8,8,24,0.65)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <span className="text-2xl font-black" style={{ color: "rgba(167,139,250,0.3)" }}>{s.num}</span>
                <h3 className="text-sm font-bold" style={{ color: "#f0eafa" }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#7a6e90" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Premium upsell */}
        <section className="py-10 max-w-4xl mx-auto px-6">
          <div
            className="p-8 rounded-2xl"
            style={{ background: "rgba(8,8,24,0.85)", border: "1px solid rgba(167,139,250,0.18)" }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.22)" }}
              >
                <Zap className="w-5 h-5" style={{ color: "#a78bfa" }} />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "#f0eafa" }}>
                  LinkedIn-postning ingår i Premium
                </h2>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "#8a7ea8" }}>
                  Kör ni Premium-paketet för SEO ingår automatisk LinkedIn-postning utan extra kostnad.
                  Kombinationen ger er organisk söktrafik, backlinks och social närvaro — allt hanterat
                  av samma team.
                </p>
                <Link
                  href="/#priser"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-[#a78bfa]"
                  style={{ color: "#5a5070" }}
                >
                  Se Premium-paketet <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-10 max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8" style={{ color: "#f0eafa" }}>Vanliga frågor</h2>
          <div className="flex flex-col gap-3">
            {faqs.map((f) => (
              <div
                key={f.q}
                className="p-6 rounded-xl"
                style={{ background: "rgba(8,8,24,0.65)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <h3 className="text-sm font-bold mb-2" style={{ color: "#f0eafa" }}>{f.q}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#8a7ea8" }}>{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 max-w-2xl mx-auto px-6 text-center">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#a78bfa" }}>Kom igång</p>
          <h2 className="text-2xl font-bold mb-4" style={{ color: "#f0eafa" }}>
            Bygg er närvaro på sociala medier
          </h2>
          <p className="text-sm mb-8" style={{ color: "#7a6e90" }}>
            Vi sätter upp en strategi och börjar producera innehåll — ni behöver knappt göra något.
          </p>
          <Link
            href="/kontakt"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03]"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)", boxShadow: "0 0 28px rgba(167,139,250,0.3)" }}
          >
            Kom igång <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

      </main>
      <Footer />
    </>
  );
}
