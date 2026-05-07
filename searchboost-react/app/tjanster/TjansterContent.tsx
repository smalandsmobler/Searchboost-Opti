"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  TrendingUp, Code2, MapPin, CheckCircle2, ArrowRight,
  Zap, BarChart2, Shield, Search, Brain, Clock,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

// ─── Service cards ──────────────────────────────────────────────────────────

const services = [
  {
    id: "autopilot",
    icon: TrendingUp,
    tag: "Mest populärt",
    title: "SEO på autopilot",
    price: "Från 5 990 kr/mån",
    priceNote: "Ingen bindningstid",
    desc: "Vår AI crawlar, analyserar och optimerar din sajt varje vecka — automatiskt. Du ser resultat i din rapport, utan att röra ett finger.",
    bullets: [
      "52 automatiska optimeringar per år",
      "On-page: title, description, rubriker, schema",
      "Transparent veckorapport varje måndag",
      "AI genererar innehåll baserat på Googles riktlinjer",
      "Prioritering efter trafikpotential",
      "Google E-E-A-T och Core Web Vitals",
    ],
    color: "#e91e8c",
    featured: true,
    includes: ["Veckorapporter", "AI-optimering", "Rank Math Pro", "Schema markup"],
  },
  {
    id: "teknisk",
    icon: Code2,
    tag: "Teknisk grund",
    title: "Teknisk SEO",
    price: "Engångsprojekt",
    priceNote: "Offert baserat på sajtstorlek",
    desc: "Schema markup, Core Web Vitals, crawlbarhet och teknisk arkitektur. Rätt från start — grunden allt SEO-arbete vilar på.",
    bullets: [
      "Schema.org strukturerad data",
      "Core Web Vitals (LCP, CLS, FID)",
      "Crawl-audit och sitemap",
      "Intern länkstruktur och silostruktur",
      "Laddningstider och bildoptimering",
      "Rapport med konkreta prioriteringar",
    ],
    color: "#f5f0ff",
    featured: false,
    includes: ["Audit-rapport", "Schema-implementation", "Teknisk åtgärdsplan"],
  },
  {
    id: "lokal",
    icon: MapPin,
    tag: "Lokal synlighet",
    title: "Lokal SEO",
    price: "Från 2 995 kr/mån",
    priceNote: "Kombineras gärna med autopilot",
    desc: "Syns för kunder i din stad och region, inte bara nationellt. Google Business Profile, lokal NAP-konsekvens och kartresultat.",
    bullets: [
      "Google Business Profile-optimering",
      "Lokal NAP-konsekvens (namn, adress, telefon)",
      "Lokala citations och kataloger",
      "Lokala nyckelord och landings-sidor",
      "Hantering av kundrecensioner",
      "Kartresultat och lokal Pack",
    ],
    color: "#e91e8c",
    featured: false,
    includes: ["GBP-hantering", "Lokala citations", "Recensionshantering"],
  },
];

// ─── Why choose us ───────────────────────────────────────────────────────────

const reasons = [
  { icon: Zap, title: "52 optimeringar/år", desc: "Automatisk optimering varje vecka utan att du lyfter ett finger." },
  { icon: BarChart2, title: "100% transparent", desc: "Se exakt vad som gjorts och vilka resultat det gett — varje vecka." },
  { icon: Shield, title: "Utan säljpitch", desc: "Gratis analys ger en ärlig bild, inte ett säljsnack." },
  { icon: Search, title: "Google-beprövat", desc: "Metoderna bygger på Googles riktlinjer och Core Web Vitals." },
  { icon: Brain, title: "AI + människa", desc: "AI för volym och hastighet. Människa för strategi och nyans." },
  { icon: Clock, title: "Snabba resultat", desc: "Många kunder ser förbättringar redan inom 30-60 dagar." },
];

// ─── FAQ ────────────────────────────────────────────────────────────────────

const faqs = [
  {
    q: "Hur lång tid tar det innan jag ser resultat?",
    a: "SEO är en långsiktig investering, men många av våra kunder ser mätbara förbättringar inom 30–60 dagar. Tekniska förbättringar kan ge resultat snabbare, medan innehållsoptimering ofta tar 2–4 månader att slå igenom fullt ut.",
  },
  {
    q: "Vad händer varje vecka?",
    a: "Varje måndag kör vår AI en fullständig genomgång av din sajt. Den identifierar sidor som kan förbättras, genererar optimerade meta-titles, descriptions och schema-markup, och skriver tillbaka det direkt till din WordPress-installation via Rank Math SEO. Du får en rapport samma dag.",
  },
  {
    q: "Behöver jag installera något?",
    a: "Vi behöver tillgång till din WordPress-sajt (ett Application Password) och gärna tillgång till Google Search Console. Det tar 10 minuter att sätta upp. Utöver det behöver du inte göra något — vi sköter resten.",
  },
  {
    q: "Fungerar det med alla typer av sajter?",
    a: "Vi arbetar primärt med WordPress-sajter. WooCommerce, Flatsome, Divi, Elementor — alla varianter fungerar. Har du en annan plattform, hör av dig så diskuterar vi möjligheterna.",
  },
  {
    q: "Kan jag avsluta när som helst?",
    a: "Ja. Ingen bindningstid, inga avslutningsavgifter. Vi vill att du stannar för att du ser värdet, inte för att du är låst.",
  },
  {
    q: "Vad kostar gratis SEO-analysen?",
    a: "Ingenting. Analysen är helt gratis och utan förpliktelser. Vi gör en genomgång av din sajt och skickar en konkret rapport. Om du vill gå vidare — bra. Om inte — inga problem.",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function TjansterContent() {
  const servicesRef = useRef<HTMLDivElement>(null);
  const reasonsRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const servicesInView = useInView(servicesRef, { once: true, margin: "-60px" });
  const reasonsInView = useInView(reasonsRef, { once: true, margin: "-60px" });
  const faqInView = useInView(faqRef, { once: true, margin: "-60px" });

  return (
    <>
      {/* ── Services ── */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6" ref={servicesRef}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((s, i) => (
              <motion.div
                key={s.id}
                id={s.id}
                initial={{ opacity: 0, y: 60 }}
                animate={servicesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.65, delay: i * 0.13, ease: [0.22, 1, 0.36, 1] }}
                className="group relative flex flex-col p-8 rounded-2xl overflow-hidden scroll-mt-24"
                style={{
                  background: s.featured
                    ? "linear-gradient(145deg, rgba(233,30,140,0.12) 0%, rgba(8,8,24,0.95) 50%)"
                    : "rgba(8,8,24,0.7)",
                  border: s.featured
                    ? "1px solid rgba(233,30,140,0.4)"
                    : "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(16px)",
                }}
                whileHover={{
                  y: -8,
                  boxShadow: `0 0 50px ${s.color}25, 0 24px 60px rgba(0,0,0,0.6)`,
                  borderColor: `${s.color}50`,
                  transition: { duration: 0.25 },
                }}
              >
                {s.featured && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(233,30,140,0.12) 0%, transparent 70%)",
                    }}
                  />
                )}

                {/* Tag */}
                <span
                  className="inline-flex items-center self-start text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-6 relative"
                  style={{ color: s.color, background: `${s.color}15`, border: `1px solid ${s.color}30` }}
                >
                  {s.featured && (
                    <motion.span
                      className="absolute inset-0 rounded-full"
                      style={{ background: `${s.color}15` }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  {s.tag}
                </span>

                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                  style={{
                    background: `linear-gradient(135deg, ${s.color}20, ${s.color}08)`,
                    border: `1px solid ${s.color}30`,
                  }}
                >
                  <s.icon className="w-7 h-7" style={{ color: s.color }} />
                </div>

                <h2 className="text-2xl font-black mb-1" style={{ color: "#f0eafa" }}>
                  {s.title}
                </h2>
                <p className="text-sm font-bold mb-1" style={{ color: s.color }}>
                  {s.price}
                </p>
                <p className="text-xs mb-4" style={{ color: "#7a6e90" }}>
                  {s.priceNote}
                </p>
                <p className="text-sm leading-relaxed mb-6 flex-1" style={{ color: "#7a6e90" }}>
                  {s.desc}
                </p>

                {/* Bullets */}
                <ul className="flex flex-col gap-2.5 mb-8">
                  {s.bullets.map((b, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: s.color }} />
                      <span className="text-sm" style={{ color: "#a89ac0" }}>{b}</span>
                    </li>
                  ))}
                </ul>

                {/* Includes */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {s.includes.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
                      style={{
                        color: s.color,
                        background: `${s.color}12`,
                        border: `1px solid ${s.color}20`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  href="/kontakt"
                  className="group/btn relative inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold transition-all duration-200 overflow-hidden"
                  style={{
                    background: s.featured
                      ? `linear-gradient(135deg, ${s.color}, #9333ea)`
                      : `${s.color}15`,
                    border: s.featured ? "none" : `1px solid ${s.color}30`,
                    color: s.featured ? "#fff" : s.color,
                    boxShadow: s.featured
                      ? `0 0 30px ${s.color}40, 0 8px 20px rgba(0,0,0,0.4)`
                      : "none",
                  }}
                >
                  <span className="relative z-10">Kom igång gratis</span>
                  <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-200 group-hover/btn:translate-x-1" />
                  {s.featured && (
                    <motion.span
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.3) 50%, transparent 75%)",
                      }}
                      animate={{ x: ["-150%", "250%"] }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Searchboost ── */}
      <section className="py-20 sm:py-28 relative overflow-hidden" ref={reasonsRef}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0,212,255,0.04) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={reasonsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span
              className="inline-block text-xs font-bold tracking-[0.25em] uppercase mb-4 px-4 py-1.5 rounded-full"
              style={{
                color: "#f5f0ff",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
              }}
            >
              Varför välja oss?
            </span>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
              style={{ color: "#f0eafa" }}
            >
              Inte bara SEO — ett{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #e91e8c 0%, #c026d3 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                system
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reasons.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 30 }}
                animate={reasonsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="p-6 rounded-2xl"
                style={{
                  background: "rgba(8,8,24,0.6)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                whileHover={{
                  borderColor: "rgba(233,30,140,0.25)",
                  y: -3,
                  transition: { duration: 0.2 },
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(233,30,140,0.1)", border: "1px solid rgba(233,30,140,0.2)" }}
                >
                  <r.icon className="w-5 h-5" style={{ color: "#e91e8c" }} />
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: "#f0eafa" }}>
                  {r.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#7a6e90" }}>
                  {r.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 sm:py-28" ref={faqRef}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={faqInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <span
              className="inline-block text-xs font-bold tracking-[0.25em] uppercase mb-4 px-4 py-1.5 rounded-full"
              style={{
                color: "#e91e8c",
                background: "rgba(233,30,140,0.08)",
                border: "1px solid rgba(233,30,140,0.2)",
              }}
            >
              Vanliga frågor
            </span>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
              style={{ color: "#f0eafa" }}
            >
              Du undrar säkert
            </h2>
          </motion.div>

          <div className="flex flex-col gap-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={faqInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, delay: i * 0.06 }}
              >
                <FaqItem q={faq.q} a={faq.a} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative p-10 sm:p-14 rounded-3xl text-center overflow-hidden"
            style={{
              background:
                "linear-gradient(145deg, rgba(233,30,140,0.12) 0%, rgba(8,8,24,0.95) 60%)",
              border: "1px solid rgba(233,30,140,0.3)",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(233,30,140,0.15) 0%, transparent 70%)",
              }}
            />
            <h2
              className="relative text-3xl sm:text-4xl font-black tracking-tight mb-4"
              style={{ color: "#f0eafa" }}
            >
              Redo att börja?
            </h2>
            <p className="relative text-base mb-8" style={{ color: "#c8b8e0" }}>
              Börja med en gratis SEO-analys — ingen säljpitch, bara sanning.
            </p>
            <Link
              href="/kontakt"
              className="relative inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-black text-white transition-all duration-200 hover:scale-[1.04]"
              style={{
                background: "linear-gradient(135deg, #e91e8c 0%, #c026d3 50%, #9333ea 100%)",
                boxShadow: "0 0 40px rgba(233,30,140,0.5), 0 8px 24px rgba(233,30,140,0.3)",
              }}
            >
              Gratis SEO-analys →
            </Link>
            <p className="relative mt-4 text-xs" style={{ color: "#7a6e90" }}>
              Ingen bindningstid &middot; Inget kreditkort &middot; Svar inom 24h
            </p>
          </motion.div>
        </div>
      </section>
    </>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: "rgba(8,8,24,0.7)",
        border: open ? "1px solid rgba(233,30,140,0.3)" : "1px solid rgba(255,255,255,0.06)",
        transition: "border-color 0.2s",
      }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between gap-4 p-5 sm:p-6">
        <h3 className="text-sm sm:text-base font-semibold" style={{ color: "#f0eafa" }}>
          {q}
        </h3>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-4 h-4" style={{ color: "#e91e8c" }} />
        </motion.div>
      </div>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <p className="px-5 sm:px-6 pb-5 text-sm leading-relaxed" style={{ color: "#7a6e90" }}>
          {a}
        </p>
      </motion.div>
    </div>
  );
}
