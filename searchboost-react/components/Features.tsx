"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Zap, BarChart2, Shield, Search, MapPin, Brain } from "lucide-react";
import type { Variants } from "framer-motion";

const features = [
  {
    icon: Zap,
    title: "Automatisk varje vecka",
    desc: "Vår AI analyserar och optimerar utan att du behöver lyfta ett finger. 52 optimeringar per år, utan paus.",
    stat: "52× / år",
    color: "#e91e8c",
  },
  {
    icon: BarChart2,
    title: "Transparent rapportering",
    desc: "Se exakt vad som gjorts och vilka resultat det gett — varje vecka. Inga dolda trick.",
    stat: "100% öppen",
    color: "#c8b8e0",
  },
  {
    icon: Shield,
    title: "Utan säljpitch",
    desc: "Gratis analys ger en ärlig bild, inte ett säljsnack om vad vi kan tjäna på det.",
    stat: "Noll förpliktelse",
    color: "#e91e8c",
  },
  {
    icon: Search,
    title: "Google-beprövat",
    desc: "Metoderna bygger på Googles egna riktlinjer, Core Web Vitals och Search Essentials.",
    stat: "Google E-E-A-T",
    color: "#c8b8e0",
  },
  {
    icon: MapPin,
    title: "Lokal SEO",
    desc: "Syns för kunder i din stad och region, inte bara nationellt. Google Business + lokal relevans.",
    stat: "Kartresultat",
    color: "#e91e8c",
  },
  {
    icon: Brain,
    title: "AI + människa",
    desc: "AI för volym och hastighet. Människa för strategi och nyans. Det bästa av båda världar.",
    stat: "Hybrid",
    color: "#c8b8e0",
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Features() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="features" className="relative py-12 sm:py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
          ref={ref}
        >
          <span
            className="inline-block text-xs font-bold tracking-[0.25em] uppercase mb-4 px-4 py-1.5 rounded-full"
            style={{
              color: "#e91e8c",
              background: "rgba(233,30,140,0.08)",
              border: "1px solid rgba(233,30,140,0.2)",
            }}
          >
            Varför Searchboost?
          </span>
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color: "#f0eafa" }}
          >
            Byggd för{" "}
            <span style={{ color: "#e91e8c" }}>resultat</span>
          </h2>
        </motion.div>

        {/* Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={itemVariants}
              className="group relative p-5 sm:p-6 rounded-2xl overflow-hidden cursor-default"
              style={{
                background: "rgba(8,8,24,0.72)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(16px)",
              }}
              whileHover={{
                boxShadow: `0 0 36px ${f.color}1a, 0 16px 40px rgba(0,0,0,0.5)`,
                borderColor: `${f.color}30`,
                y: -3,
                transition: { duration: 0.2 },
              }}
            >
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{
                  background: `${f.color}15`,
                  border: `1px solid ${f.color}28`,
                }}
              >
                <f.icon className="w-5 h-5" style={{ color: f.color }} />
              </div>

              <h3
                className="text-base sm:text-lg font-bold mb-2"
                style={{ color: "#f0eafa" }}
              >
                {f.title}
              </h3>
              <p
                className="text-sm leading-relaxed mb-4"
                style={{ color: "#a096b8" }}
              >
                {f.desc}
              </p>

              {/* Stat badge */}
              <span
                className="inline-block text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-lg"
                style={{
                  color: f.color,
                  background: `${f.color}12`,
                  border: `1px solid ${f.color}22`,
                }}
              >
                {f.stat}
              </span>

              {/* Bottom accent */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
                style={{
                  background: `linear-gradient(90deg, ${f.color}, transparent)`,
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
