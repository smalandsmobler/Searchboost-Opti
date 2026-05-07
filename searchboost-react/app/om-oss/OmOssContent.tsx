"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Target, Lightbulb, Users, TrendingUp, Award, Clock,
  CheckCircle2, ArrowRight,
} from "lucide-react";

// ─── Stats ───────────────────────────────────────────────────────────────────

const stats = [
  { value: "50+", label: "nöjda kunder", color: "#e91e8c" },
  { value: "4.9", label: "snittbetyg (av 5)", color: "#f5f0ff" },
  { value: "52×", label: "optimeringar per kund/år", color: "#e91e8c" },
  { value: "+180%", label: "organisk trafik i snitt", color: "#f5f0ff" },
];

// ─── Values ──────────────────────────────────────────────────────────────────

const values = [
  {
    icon: Target,
    title: "Resultat, inte rapporter",
    desc: "Vi mäter framgång i trafik och leads — inte i antalet PowerPoint-presentationer. Varje åtgärd vi tar ska kunna kopplas till ett mätbart resultat.",
  },
  {
    icon: Lightbulb,
    title: "Ärlighet framför allt",
    desc: "Vi lovar inte etta på Google om vi inte tror att det är realistiskt. Vår gratis-analys ger en ärlig bild av situationen — bra och dålig.",
  },
  {
    icon: Users,
    title: "Partner, inte leverantör",
    desc: "Vi tar ansvar för ditt synlighetsresultat som om det vore vårt eget. Går det bra för dig, går det bra för oss.",
  },
  {
    icon: Award,
    title: "Google-standard alltid",
    desc: "Vi följer Googles egna riktlinjer till punkt och pricka. Inga genvägar, inga black-hat-tricks som kan straffa dig på sikt.",
  },
];

// ─── Process ─────────────────────────────────────────────────────────────────

const processSteps = [
  {
    num: "01",
    title: "Gratis SEO-analys",
    desc: "Du fyller i din e-post och sajt-URL. Vi gör en komplett teknisk genomgång och skickar en konkret rapport — utan förpliktelser.",
    link: { label: "Börja här", href: "/kontakt" },
  },
  {
    num: "02",
    title: "Strategisamtal",
    desc: "Vi går igenom analysen tillsammans, presenterar de viktigaste möjligheterna och sätter upp ett realistiskt mål för de kommande 6 månaderna.",
    link: null,
  },
  {
    num: "03",
    title: "Onboarding på 10 min",
    desc: "Du ger oss tillgång till WordPress och Google Search Console. Det tar 10 minuter och sedan sköter vi allt.",
    link: null,
  },
  {
    num: "04",
    title: "Automatisk optimering varje vecka",
    desc: "Vår AI kör 52 optimeringar per år — varje måndag. Du får en rapport och kan följa alla förbättringar i realtid.",
    link: { label: "Se hur det fungerar", href: "/tjanster" },
  },
];

// ─── Testimonials ────────────────────────────────────────────────────────────

const testimonials = [
  {
    quote:
      "Inom 6 veckor hade vi fördubblat vår organiska trafik. Searchboost levererade det de lovade — utan säljsnack.",
    name: "Anna K.",
    role: "E-handlare, Stockholm",
    rating: 5,
  },
  {
    quote:
      "Fantastiskt enkelt att komma igång. Ingen bindningstid, inga konstiga villkor. Bara resultat varje måndag i inkorgen.",
    name: "Marcus L.",
    role: "Restauratör, Göteborg",
    rating: 5,
  },
  {
    quote:
      "Äntligen en SEO-byrå som visar exakt vad de gjort och varför. Rapporterna är tydliga och resultaten är mätbara.",
    name: "Sara B.",
    role: "Redovisningsbyrå, Malmö",
    rating: 5,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function OmOssContent() {
  const statsRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const processRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);

  const statsInView = useInView(statsRef, { once: true, margin: "-60px" });
  const valuesInView = useInView(valuesRef, { once: true, margin: "-60px" });
  const processInView = useInView(processRef, { once: true, margin: "-60px" });
  const testimonialsInView = useInView(testimonialsRef, { once: true, margin: "-60px" });

  return (
    <>
      {/* ── Story ── */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 30% 50%, rgba(233,30,140,0.05) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span
                className="inline-block text-xs font-bold tracking-[0.25em] uppercase mb-6 px-4 py-1.5 rounded-full"
                style={{
                  color: "#e91e8c",
                  background: "rgba(233,30,140,0.08)",
                  border: "1px solid rgba(233,30,140,0.2)",
                }}
              >
                Vår berättelse
              </span>
              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-6 leading-tight"
                style={{ color: "#f0eafa" }}
              >
                Grundat för att{" "}
                <span
                  style={{
                    background: "linear-gradient(135deg, #e91e8c 0%, #c026d3 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  demokratisera SEO
                </span>
              </h2>
              <div className="flex flex-col gap-4 text-[15px] leading-relaxed" style={{ color: "#7a6e90" }}>
                <p>
                  Searchboost startade med en enkel observation: stora företag betalar stora byråer enorma summor för SEO, medan småföretagare och startups lämnas utanför. Resultaten är ojämlika — inte för att SEO är svårt, utan för att det är tidskrävande.
                </p>
                <p>
                  Vi byggde ett system som löser det. Vår AI gör det tunga arbetet — crawlar sajter, identifierar möjligheter, genererar optimerade texter och skriver tillbaka direkt till WordPress. Varje vecka, automatiskt.
                </p>
                <p>
                  Resultatet? Kunder som lägger 10 minuter på onboarding och sedan ser söktrafiken växa — utan att lyfta ett finger.
                </p>
              </div>
            </motion.div>

            {/* Stats panel */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              ref={statsRef}
            >
              <div className="grid grid-cols-2 gap-4">
                {stats.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={statsInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="p-6 rounded-2xl text-center"
                    style={{
                      background: "rgba(8,8,24,0.8)",
                      border: `1px solid ${s.color}20`,
                    }}
                    whileHover={{ borderColor: `${s.color}50`, transition: { duration: 0.2 } }}
                  >
                    <div
                      className="text-3xl sm:text-4xl font-black mb-2"
                      style={{ color: s.color }}
                    >
                      {s.value}
                    </div>
                    <div className="text-xs leading-tight" style={{ color: "#7a6e90" }}>
                      {s.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section
        id="varfor"
        className="py-20 sm:py-28 relative overflow-hidden scroll-mt-20"
        ref={valuesRef}
      >
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
            animate={valuesInView ? { opacity: 1, y: 0 } : {}}
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
              Vad vi tror på
            </span>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
              style={{ color: "#f0eafa" }}
            >
              Våra värderingar
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 30 }}
                animate={valuesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.09 }}
                className="flex gap-5 p-7 rounded-2xl"
                style={{
                  background: "rgba(8,8,24,0.7)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
                whileHover={{ borderColor: "rgba(233,30,140,0.2)", y: -3, transition: { duration: 0.2 } }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(233,30,140,0.1)", border: "1px solid rgba(233,30,140,0.2)" }}
                >
                  <v.icon className="w-5 h-5" style={{ color: "#e91e8c" }} />
                </div>
                <div>
                  <h3 className="text-base font-bold mb-2" style={{ color: "#f0eafa" }}>
                    {v.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#7a6e90" }}>
                    {v.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process ── */}
      <section id="process" className="py-20 sm:py-28 scroll-mt-20" ref={processRef}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={processInView ? { opacity: 1, y: 0 } : {}}
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
              Hur vi arbetar
            </span>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
              style={{ color: "#f0eafa" }}
            >
              Från dag ett till resultat
            </h2>
          </motion.div>

          <div className="relative flex flex-col gap-0">
            {/* Vertical line */}
            <div
              className="absolute left-[1.375rem] top-8 bottom-8 w-[2px] hidden sm:block"
              style={{ background: "linear-gradient(to bottom, #e91e8c, rgba(233,30,140,0.1))" }}
            />

            {processSteps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -20 }}
                animate={processInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative flex gap-6 sm:gap-8 pb-10 last:pb-0"
              >
                {/* Dot */}
                <div className="flex-shrink-0 sm:relative">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-black text-sm relative z-10"
                    style={{
                      background: i === 0
                        ? "linear-gradient(135deg, #e91e8c, #9333ea)"
                        : "rgba(8,8,24,0.9)",
                      border: "2px solid rgba(233,30,140,0.5)",
                      color: i === 0 ? "#fff" : "#e91e8c",
                      boxShadow: i === 0 ? "0 0 20px rgba(233,30,140,0.4)" : "none",
                    }}
                  >
                    {step.num}
                  </div>
                </div>
                {/* Content */}
                <div className="pt-1.5 flex-1">
                  <h3 className="text-lg font-bold mb-2" style={{ color: "#f0eafa" }}>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: "#7a6e90" }}>
                    {step.desc}
                  </p>
                  {step.link && (
                    <Link
                      href={step.link.href}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold hover:gap-2.5 transition-all duration-200"
                      style={{ color: "#e91e8c" }}
                    >
                      {step.link.label}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section
        id="omdomen"
        className="py-20 sm:py-28 relative overflow-hidden scroll-mt-20"
        ref={testimonialsRef}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 70% 50%, rgba(0,212,255,0.04) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
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
              Vad kunder säger
            </span>
            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
              style={{ color: "#f0eafa" }}
            >
              4.9 av 5 — och det syns
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="p-7 rounded-2xl flex flex-col gap-4"
                style={{
                  background: "rgba(8,8,24,0.7)",
                  border: "1px solid rgba(233,30,140,0.12)",
                }}
                whileHover={{ borderColor: "rgba(233,30,140,0.3)", y: -4, transition: { duration: 0.2 } }}
              >
                {/* Stars */}
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <svg key={j} className="w-4 h-4" viewBox="0 0 24 24" fill="#e91e8c">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm leading-relaxed flex-1" style={{ color: "#c8b8e0" }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-bold" style={{ color: "#f0eafa" }}>{t.name}</p>
                  <p className="text-xs" style={{ color: "#7a6e90" }}>{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pb-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="text-3xl sm:text-4xl font-black tracking-tight mb-4"
              style={{ color: "#f0eafa" }}
            >
              Låter det rimligt?
            </h2>
            <p className="text-base mb-8" style={{ color: "#c8b8e0" }}>
              Ta steget — vi gör en gratis analys och visar exakt var du kan vinna.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/kontakt"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-black text-white transition-all duration-200 hover:scale-[1.04]"
                style={{
                  background: "linear-gradient(135deg, #e91e8c 0%, #c026d3 50%, #9333ea 100%)",
                  boxShadow: "0 0 30px rgba(233,30,140,0.5), 0 8px 24px rgba(233,30,140,0.3)",
                }}
              >
                Gratis SEO-analys →
              </Link>
              <Link
                href="/tjanster"
                className="text-sm font-medium hover:text-[#e91e8c] transition-colors"
                style={{ color: "#7a6e90" }}
              >
                Se alla tjänster
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
