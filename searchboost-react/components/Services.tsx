"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import {
  TrendingUp,
  Code2,
  ArrowUpRight,
  CheckCircle2,
  MousePointerClick,
  Globe,
  Share2,
} from "lucide-react";

const secondRow = [
  {
    badge: "Betald annonsering",
    badgeColor: "#60a5fa",
    icon: MousePointerClick,
    title: "Google Ads",
    href: "/tjanster/google-ads",
    desc: "Kampanjer som konverterar. Vi skapar, optimerar och sköter dina annonser — med fokus på ROAS, inte klick.",
    bullets: ["Sök & Display-kampanjer", "Löpande budgetoptimering", "Konverteringsspårning"],
  },
  {
    badge: "Webb & Design",
    badgeColor: "#818cf8",
    icon: Globe,
    title: "Webutveckling",
    href: "/tjanster/webutveckling",
    desc: "Snabba, SEO-vänliga webbplatser som konverterar. WordPress, WooCommerce eller custom — rätt från start.",
    bullets: ["WordPress & WooCommerce", "Core Web Vitals-optimerat", "Mobilanpassat"],
  },
  {
    badge: "Sociala medier",
    badgeColor: "#a78bfa",
    icon: Share2,
    title: "Social Media",
    href: "/tjanster/social-medier",
    desc: "AI-genererat innehåll för LinkedIn, Instagram och Facebook. Stärk varumärket och driv organisk trafik.",
    bullets: ["LinkedIn & Instagram", "AI-genererade inlägg", "Ingår i Premium-planen"],
  },
];

export default function Services() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="tjanster" className="py-12 sm:py-16 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Heading */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <span
            className="inline-block text-xs font-semibold tracking-[0.2em] uppercase mb-3 px-3 py-1 rounded-full"
            style={{
              color: "#e91e8c",
              background: "rgba(233,30,140,0.08)",
              border: "1px solid rgba(233,30,140,0.2)",
            }}
          >
            Vad vi erbjuder
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: "#f0eafa" }}
          >
            Tjänster
          </h2>
        </motion.div>

        {/* Row 1: Featured SEO + Teknisk SEO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">

          {/* Featured: SEO på autopilot — spans 2 cols */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="lg:col-span-2 relative flex flex-col p-8 rounded-2xl overflow-hidden"
            style={{
              background: "rgba(8,8,24,0.95)",
              border: "1px solid rgba(233,30,140,0.22)",
            }}
            whileHover={{
              borderColor: "rgba(233,30,140,0.4)",
              transition: { duration: 0.2 },
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse 60% 70% at 10% 50%, rgba(233,30,140,0.07) 0%, transparent 65%)",
              }}
            />
            <span
              className="inline-flex self-start text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-6"
              style={{ color: "#e91e8c", background: "rgba(233,30,140,0.1)", border: "1px solid rgba(233,30,140,0.22)" }}
            >
              Mest populärt
            </span>
            <div className="flex items-start gap-4 mb-5">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(233,30,140,0.1)", border: "1px solid rgba(233,30,140,0.22)" }}
              >
                <TrendingUp className="w-5 h-5" style={{ color: "#e91e8c" }} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-0.5" style={{ color: "#f0eafa" }}>
                  SEO på autopilot
                </h3>
                <p className="text-sm font-semibold" style={{ color: "#e91e8c" }}>
                  Från 5 990 kr/mån
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-6 max-w-md" style={{ color: "#b0a4c8" }}>
              Vår AI crawlar, analyserar och optimerar din sajt varje vecka — automatiskt. Du
              ser resultat i din rapport, utan att röra ett finger.
            </p>
            <ul className="flex flex-col sm:flex-row gap-3 sm:gap-6 mb-8">
              {["Automatisk on-page optimering", "Veckovis transparentrapport", "Prioritering efter trafikpotential"].map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#e91e8c" }} />
                  <span className="text-xs" style={{ color: "#a89ac0" }}>{b}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/kontakt"
              className="group/btn inline-flex items-center gap-2 self-start py-2.5 px-5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.03]"
              style={{ background: "linear-gradient(135deg, #e91e8c, #9333ea)", boxShadow: "0 0 24px rgba(233,30,140,0.3)" }}
            >
              Kom igång
              <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </Link>
          </motion.div>

          {/* Teknisk SEO */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="relative flex flex-col p-6 rounded-2xl"
            style={{ background: "rgba(8,8,24,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}
            whileHover={{ borderColor: "rgba(255,255,255,0.2)", transition: { duration: 0.2 } }}
          >
            <span
              className="inline-flex self-start text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full mb-4"
              style={{ color: "#c8b8e0", background: "rgba(200,184,224,0.06)", border: "1px solid rgba(200,184,224,0.14)" }}
            >
              Teknisk grund
            </span>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: "rgba(200,184,224,0.07)", border: "1px solid rgba(200,184,224,0.14)" }}
            >
              <Code2 className="w-5 h-5" style={{ color: "#c8b8e0" }} />
            </div>
            <h3 className="text-base font-bold mb-2" style={{ color: "#f0eafa" }}>Teknisk SEO</h3>
            <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: "#7a6e90" }}>
              Schema markup, Core Web Vitals, crawlbarhet och teknisk arkitektur. Rätt från start — ingår i alla planer.
            </p>
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors duration-200 hover:text-[#c8b8e0]"
              style={{ color: "#5a5070" }}
            >
              Läs mer <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        </div>

        {/* Row 2: Google Ads, Webutveckling, Social Media */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {secondRow.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 28 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.28 + i * 0.09 }}
                className="relative flex flex-col p-6 rounded-2xl overflow-hidden"
                style={{ background: "rgba(8,8,24,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}
                whileHover={{
                  borderColor: `${s.badgeColor}30`,
                  boxShadow: `0 0 28px ${s.badgeColor}12`,
                  transition: { duration: 0.2 },
                }}
              >
                {/* Subtle top glow */}
                <div
                  className="absolute top-0 left-0 right-0 h-px pointer-events-none"
                  style={{ background: `linear-gradient(90deg, transparent, ${s.badgeColor}40, transparent)` }}
                />

                <span
                  className="inline-flex self-start text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full mb-4"
                  style={{
                    color: s.badgeColor,
                    background: `${s.badgeColor}12`,
                    border: `1px solid ${s.badgeColor}28`,
                  }}
                >
                  {s.badge}
                </span>

                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${s.badgeColor}10`, border: `1px solid ${s.badgeColor}25` }}
                >
                  <Icon className="w-5 h-5" style={{ color: s.badgeColor }} />
                </div>

                <h3 className="text-base font-bold mb-2" style={{ color: "#f0eafa" }}>{s.title}</h3>
                <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: "#7a6e90" }}>{s.desc}</p>

                <ul className="flex flex-col gap-1.5 mb-4">
                  {s.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: s.badgeColor }} />
                      <span className="text-[11px]" style={{ color: "#b0a4c8" }}>{b}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={s.href}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors duration-200"
                  style={{ color: "#5a5070" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = s.badgeColor; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#5a5070"; }}
                >
                  Läs mer <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
