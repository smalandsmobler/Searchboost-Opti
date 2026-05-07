"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { ScanSearch, ListOrdered, Sparkles, BarChart3 } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: ScanSearch,
    title: "Analys",
    desc: "Vi crawlar din sajt och identifierar alla tekniska och content-mässiga SEO-problem med sub-millisekundskapacitet.",
    color: "#e91e8c",
  },
  {
    num: "02",
    icon: ListOrdered,
    title: "Prioritering",
    desc: "AI rangordnar varje åtgärd efter förväntad trafikpotential. Högst ROI alltid först — aldrig slumpmässigt.",
    color: "#f5f0ff",
  },
  {
    num: "03",
    icon: Sparkles,
    title: "Optimering",
    desc: "Automatisk implementation varje vecka direkt i din WordPress. Inga manuella steg, inga missade uppgifter.",
    color: "#e91e8c",
  },
  {
    num: "04",
    icon: BarChart3,
    title: "Rapportering",
    desc: "Veckovis rapport — transparent och tydlig. Vad som gjorts, hur positionerna rörde sig, vad som är näst.",
    color: "#f5f0ff",
  },
];

export default function Process() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="process" className="py-12 sm:py-16 relative overflow-hidden" ref={sectionRef}>
      {/* BG grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(233,30,140,1) 1px, transparent 1px), linear-gradient(90deg, rgba(233,30,140,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="max-w-7xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span
            className="inline-block text-xs font-bold tracking-[0.25em] uppercase mb-4 px-4 py-1.5 rounded-full"
            style={{
              color: "#f5f0ff",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
            }}
          >
            Hur det fungerar
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: "#f0eafa" }}
          >
            Processen i{" "}
            <span style={{ color: "#f5f0ff" }}>4 steg</span>
          </h2>
        </motion.div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {/* Desktop connector line */}
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-px overflow-hidden">
            <motion.div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, #e91e8c, #c026d3, #e91e8c)",
                opacity: 0.35,
              }}
              initial={{ scaleX: 0, transformOrigin: "left" }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
            />
          </div>

          {steps.map((s, i) => (
            <StepCard key={i} {...s} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({
  num,
  icon: Icon,
  title,
  desc,
  color,
  index,
  inView,
}: {
  num: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
  index: number;
  inView: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col items-center lg:items-start text-center lg:text-left p-6 rounded-2xl"
      style={{
        background: "rgba(8,8,24,0.5)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
      whileHover={{
        borderColor: `${color}30`,
        boxShadow: `0 0 30px ${color}15, 0 16px 40px rgba(0,0,0,0.5)`,
        y: -4,
      }}
    >
      {/* Number + icon row */}
      <div className="flex items-center gap-3 mb-5 relative">
        {/* Numbered circle */}
        <div className="relative flex-shrink-0">
          <motion.div
            className="w-14 h-14 rounded-full flex items-center justify-center relative"
            style={{
              background: `linear-gradient(135deg, ${color}25, ${color}08)`,
              border: `1px solid ${color}40`,
            }}
            whileHover={{ scale: 1.08 }}
          >
            <span
              className="text-sm font-black"
              style={{
                background: `linear-gradient(135deg, ${color} 0%, #fff 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {num}
            </span>
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `1px solid ${color}` }}
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.4,
              }}
            />
          </motion.div>
        </div>

        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: `${color}12`,
            border: `1px solid ${color}25`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>

      <h3 className="text-xl font-black mb-3" style={{ color: "#f0eafa" }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "#a096b8" }}>
        {desc}
      </p>

      {/* Bottom accent line */}
      <motion.div
        className="absolute bottom-0 left-6 right-6 h-px rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}50, transparent)` }}
        initial={{ scaleX: 0, transformOrigin: "left" }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.6, delay: index * 0.15 + 0.4 }}
      />
    </motion.div>
  );
}
