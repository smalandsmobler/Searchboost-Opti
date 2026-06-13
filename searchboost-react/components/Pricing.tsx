"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import {
  CheckCircle2,
  Zap,
  Crown,
  Star,
  ArrowRight,
  ScanSearch,
  KeyRound,
  BarChart3,
  ClipboardList,
  RefreshCcw,
  FileText,
  TrendingUp,
  LayoutDashboard,
} from "lucide-react";

/* ─── Shared features (all plans) ─── */
const sharedFeatures = [
  { icon: ScanSearch,      label: "SEO-revision",        sub: "Kritiska fel dag 1" },
  { icon: KeyRound,        label: "Sökordsanalys A/B/C", sub: "Prioriterade nyckelord" },
  { icon: BarChart3,       label: "GAP-analys",          sub: "Top 3 konkurrenter" },
  { icon: ClipboardList,   label: "Åtgärdsplan 3 mån",   sub: "AI-genererad, klar dag 1" },
  { icon: TrendingUp,      label: "GA4 & GTM",           sub: "Analytics + Tag Manager" },
  { icon: LayoutDashboard, label: "Dashboard",           sub: "Live-statistik & rapporter" },
  { icon: RefreshCcw,      label: "Omindexiering",       sub: "Search Console direkt" },
  { icon: FileText,        label: "Veckorapport",        sub: "Transparent redovisning" },
];

/* ─── Plans ─── */
const plans = [
  {
    name: "Basic",
    price: "5 990",
    scope: "Upp till 50 sidor",
    scopeSub: "under aktiv förvaltning",
    desc: "Allt du behöver för att komma igång med automatisk SEO — till ett pris som ger mer än det kostar.",
    banner: {
      text: "Mycket värde för pengarna",
      Icon: Star,
      bg: "rgba(200,184,224,0.10)",
      borderBottom: "1px solid rgba(200,184,224,0.14)",
      color: "#c8b8e0",
      glow: undefined as string | undefined,
    },
    extras: [
      "AI-optimering varje vecka",
      "Meta title & description",
      "Schema markup (Organization, FAQ)",
      "Search Console-koppling",
      "1 SEO-artikel per månad",
    ],
    cta: "Kom igång",
    color: "#c8b8e0",
    cardBg: "rgba(8,8,24,0.72)",
    cardBorder: "rgba(255,255,255,0.08)",
    ctaGradient: undefined as string | undefined,
    ctaColor: "#c8b8e0",
  },
  {
    name: "Standard",
    price: "7 990",
    scope: "Upp till 150 sidor",
    scopeSub: "under aktiv förvaltning",
    desc: "Det populära valet — lokalt synlig, konkurrentbevakning, och fler artiklar som driver trafik.",
    banner: {
      text: "Mest populärt",
      Icon: Zap,
      bg: "linear-gradient(135deg, #e91e8c 0%, #c026d3 100%)",
      borderBottom: undefined as string | undefined,
      color: "#fff",
      glow: "0 0 60px rgba(233,30,140,0.15), 0 24px 64px rgba(0,0,0,0.55)",
    },
    extras: [
      "Allt i Basic",
      "Lokal SEO & Google Maps",
      "Intern länkstruktur",
      "Core Web Vitals-åtgärder",
      "Löpande konkurrentbevakning",
      "2 SEO-artiklar per månad",
      "Månadsgenomgång (video/telefon)",
    ],
    cta: "Välj Standard",
    color: "#e91e8c",
    cardBg: "rgba(10,8,26,0.98)",
    cardBorder: "rgba(233,30,140,0.38)",
    ctaGradient: "linear-gradient(135deg, #e91e8c, #c026d3)",
    ctaColor: "#fff",
  },
  {
    name: "Premium",
    price: "9 990",
    scope: "Hela sajten",
    scopeSub: "obegränsat antal sidor",
    desc: "Full kraft — AI, dedikerad strateg och LinkedIn-närvaro. Maximal synlighet på alla fronter.",
    banner: {
      text: "Maximal synlighet",
      Icon: Crown,
      bg: "linear-gradient(135deg, #7c3aed 0%, #c026d3 100%)",
      borderBottom: undefined as string | undefined,
      color: "#fff",
      glow: "0 0 50px rgba(192,38,211,0.12), 0 20px 56px rgba(0,0,0,0.5)",
    },
    extras: [
      "Allt i Standard",
      "3 SEO-artiklar per månad",
      "LinkedIn-postning (AI-genererad)",
      "Teknisk SEO-revision (löpande)",
      "Dedikerad SEO-strateg",
      "Kvartalsvisa strategimöten",
    ],
    cta: "Välj Premium",
    color: "#c026d3",
    cardBg: "rgba(8,8,24,0.88)",
    cardBorder: "rgba(192,38,211,0.28)",
    ctaGradient: "linear-gradient(135deg, #7c3aed, #c026d3)",
    ctaColor: "#fff",
  },
];

export default function Pricing() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="priser" className="py-16 sm:py-20 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6" ref={ref}>

        {/* ── Heading ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span
            className="inline-block text-xs font-bold tracking-[0.25em] uppercase mb-4 px-4 py-1.5 rounded-full"
            style={{
              color: "#e91e8c",
              background: "rgba(233,30,140,0.08)",
              border: "1px solid rgba(233,30,140,0.2)",
            }}
          >
            Priser
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-4"
            style={{ color: "#f0eafa" }}
          >
            Enkel, transparent{" "}
            <span style={{ color: "#e91e8c" }}>prissättning</span>
          </h2>
          <p className="text-base max-w-lg mx-auto" style={{ color: "#a096b8" }}>
            Ingen bindningstid. Inga dolda avgifter. Avsluta med 1 månads varsel.
          </p>
        </motion.div>

        {/* ── Shared features strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-2xl p-6 mb-8"
          style={{
            background: "rgba(8,8,24,0.8)",
            border: "1px solid rgba(233,30,140,0.18)",
            backdropFilter: "blur(16px)",
          }}
        >
          <p
            className="text-xs font-bold tracking-[0.2em] uppercase mb-5 text-center"
            style={{ color: "#e91e8c" }}
          >
            Ingår i alla planer — från dag&nbsp;1
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {sharedFeatures.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
                className="flex items-center gap-3"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(233,30,140,0.1)",
                    border: "1px solid rgba(233,30,140,0.2)",
                  }}
                >
                  <f.icon className="w-3.5 h-3.5" style={{ color: "#e91e8c" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-tight" style={{ color: "#c8b8e0" }}>
                    {f.label}
                  </p>
                  <p className="text-[10px] leading-tight mt-0.5" style={{ color: "#8a7ea8" }}>
                    {f.sub}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Plan cards — equal height ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {plans.map((plan, i) => {
            const BannerIcon = plan.banner.Icon;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 36 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.25 + i * 0.1 }}
                className="relative flex flex-col rounded-2xl overflow-hidden"
                style={{
                  background: plan.cardBg,
                  border: `1px solid ${plan.cardBorder}`,
                  boxShadow: plan.banner.glow,
                }}
              >
                {/* Inner radial glow for Standard */}
                {plan.name === "Standard" && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(ellipse 80% 45% at 50% -5%, rgba(233,30,140,0.12) 0%, transparent 70%)",
                    }}
                  />
                )}

                {/* ── Banner ── */}
                <div
                  className="relative z-10 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold"
                  style={{
                    background: plan.banner.bg,
                    borderBottom: plan.banner.borderBottom,
                    color: plan.banner.color,
                  }}
                >
                  <BannerIcon className="w-3 h-3" />
                  {plan.banner.text}
                </div>

                {/* ── Card body ── */}
                <div className="relative z-10 p-6 flex flex-col flex-1">
                  {/* Plan name */}
                  <span
                    className="text-xs font-bold tracking-[0.22em] uppercase mb-4"
                    style={{ color: plan.color }}
                  >
                    {plan.name}
                  </span>

                  {/* Price */}
                  <div className="flex items-end gap-1.5 mb-2">
                    <span
                      className="text-4xl font-black tracking-tight"
                      style={{ color: "#f0eafa" }}
                    >
                      {plan.price}
                    </span>
                    <span className="text-sm font-medium mb-1.5" style={{ color: "#a096b8" }}>
                      kr/mån
                    </span>
                  </div>

                  {/* Scope badge */}
                  <div
                    className="inline-flex flex-col self-start px-3 py-1.5 rounded-lg mb-4"
                    style={{
                      background: `${plan.color}12`,
                      border: `1px solid ${plan.color}26`,
                    }}
                  >
                    <span
                      className="text-xs font-bold leading-tight"
                      style={{ color: plan.color }}
                    >
                      {plan.scope}
                    </span>
                    <span className="text-[10px] leading-tight mt-0.5" style={{ color: "#8a7ea8" }}>
                      {plan.scopeSub}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed mb-5" style={{ color: "#a096b8" }}>
                    {plan.desc}
                  </p>

                  {/* Plan extras — flex-1 pushes CTA to bottom */}
                  <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                    {plan.extras.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <CheckCircle2
                          className="w-4 h-4 flex-shrink-0 mt-0.5"
                          style={{ color: plan.color }}
                        />
                        <span className="text-sm" style={{ color: "#a89ac0" }}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href="/kontakt"
                    className="group flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
                    style={
                      plan.ctaGradient
                        ? {
                            background: plan.ctaGradient,
                            color: plan.ctaColor,
                            boxShadow:
                              plan.name === "Standard"
                                ? "0 0 24px rgba(233,30,140,0.35)"
                                : plan.name === "Premium"
                                ? "0 0 20px rgba(192,38,211,0.3)"
                                : undefined,
                          }
                        : {
                            background: "rgba(200,184,224,0.07)",
                            border: "1px solid rgba(200,184,224,0.18)",
                            color: plan.ctaColor,
                          }
                    }
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center text-xs mt-7"
          style={{ color: "#8a7ea8" }}
        >
          Alla priser exkl. moms &middot; Ingen startavgift &middot; Avsluta med 1 månads varsel
        </motion.p>
      </div>
    </section>
  );
}
