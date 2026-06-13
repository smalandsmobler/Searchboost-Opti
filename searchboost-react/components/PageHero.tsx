"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface PageHeroProps {
  badge?: string;
  title: string;
  titleAccent?: string;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: string;
  breadcrumb?: { label: string; href: string }[];
}

export default function PageHero({
  badge,
  title,
  titleAccent,
  subtitle,
  ctaLabel,
  ctaHref,
  breadcrumb,
}: PageHeroProps) {
  return (
    <section className="relative pt-36 pb-20 sm:pt-44 sm:pb-28 overflow-hidden">
      {/* Subtle glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(233,30,140,0.08) 0%, transparent 70%)",
        }}
      />
      {/* Top line */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(233,30,140,0.4) 30%, rgba(255,255,255,0.12) 70%, transparent 100%)",
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
        {/* Breadcrumb */}
        {breadcrumb && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center gap-2 text-xs mb-6"
            style={{ color: "#7a6e90" }}
            aria-label="Brödsmulor"
          >
            <Link href="/" className="hover:text-[#e91e8c] transition-colors">
              Hem
            </Link>
            {breadcrumb.map((crumb) => (
              <span key={crumb.href} className="flex items-center gap-2">
                <span>/</span>
                {crumb.href === "#" ? (
                  <span style={{ color: "#c8b8e0" }}>{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="hover:text-[#e91e8c] transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </motion.nav>
        )}

        {badge && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6"
            style={{
              background: "rgba(233,30,140,0.08)",
              border: "1px solid rgba(233,30,140,0.25)",
              color: "#e91e8c",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#e91e8c" }}
            />
            {badge}
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.06] mb-6"
          style={{ color: "#f0eafa" }}
        >
          {title}{" "}
          {titleAccent && (
            <span
              style={{
                background: "linear-gradient(135deg, #e91e8c 0%, #c026d3 50%, #c026d3 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {titleAccent}
            </span>
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.22 }}
          className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ color: "#c8b8e0" }}
        >
          {subtitle}
        </motion.p>

        {ctaLabel && ctaHref && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.32 }}
          >
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-black text-white transition-all duration-200 hover:scale-[1.04] active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #e91e8c 0%, #c026d3 50%, #9333ea 100%)",
                boxShadow: "0 0 30px rgba(233,30,140,0.5), 0 8px 24px rgba(233,30,140,0.3)",
              }}
            >
              {ctaLabel}
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
