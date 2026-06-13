"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Phone, Mail } from "lucide-react";
import Logo from "./Logo";

const tjansterLinks = [
  { label: "SEO på autopilot", href: "/tjanster#autopilot" },
  { label: "Teknisk SEO", href: "/tjanster#teknisk" },
  { label: "Lokal SEO", href: "/tjanster#lokal" },
  { label: "Gratis SEO-analys", href: "/kontakt" },
];

const omOssLinks = [
  { label: "Varför Searchboost?", href: "/om-oss#varfor" },
  { label: "Hur det fungerar", href: "/om-oss#process" },
  { label: "Omdömen", href: "/om-oss#omdomen" },
  { label: "Om oss", href: "/om-oss" },
  { label: "SEO-skola", href: "/seo-skola" },
];

const socials = [
  {
    href: "https://instagram.com/searchboost",
    label: "Instagram",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: "https://linkedin.com/company/searchboost",
    label: "LinkedIn",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    href: "https://twitter.com/searchboost",
    label: "X",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer
      id="footer"
      className="relative overflow-hidden"
      style={{ background: "#04040e" }}
    >
      {/* Top border gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(233,30,140,0.6) 30%, rgba(255,255,255,0.14) 70%, transparent 100%)",
        }}
      />

      {/* Background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(233,30,140,0.07) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 pt-14 pb-8 relative">
        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand col */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <Logo size="md" />
            </div>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#a096b8" }}>
              SEO-byrå som levererar mätbara resultat. Automatisk optimering varje vecka — utan att du lyfter ett finger.
            </p>
            {/* Contact */}
            <div className="flex flex-col gap-2 mb-6">
              <a href="tel:0728634279" className="flex items-center gap-2 text-sm hover:text-[#e91e8c] transition-colors" style={{ color: "#a096b8" }}>
                <Phone className="w-3.5 h-3.5" style={{ color: "#e91e8c" }} />
                0728-634 279
              </a>
              <a href="mailto:info@searchboost.se" className="flex items-center gap-2 text-sm hover:text-[#c026d3] transition-colors" style={{ color: "#a096b8" }}>
                <Mail className="w-3.5 h-3.5" style={{ color: "#f5f0ff" }} />
                info@searchboost.se
              </a>
            </div>
            {/* Socials */}
            <div className="flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    color: "#7a6e90",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = "#e91e8c";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(233,30,140,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.color = "#a096b8";
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.14)";
                  }}
                >
                  {s.svg}
                </a>
              ))}
            </div>
          </div>

          {/* Tjänster */}
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-6" style={{ color: "#e91e8c" }}>
              Tjänster
            </h4>
            <ul className="flex flex-col gap-3">
              {tjansterLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="group inline-flex items-center gap-1.5 text-sm transition-colors duration-200 hover:text-[#e91e8c]"
                    style={{ color: "#a096b8" }}
                  >
                    {l.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-y-0.5 translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Om oss */}
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-6" style={{ color: "#f5f0ff" }}>
              Om oss
            </h4>
            <ul className="flex flex-col gap-3">
              {omOssLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="group inline-flex items-center gap-1.5 text-sm transition-colors duration-200 hover:text-[#c026d3]"
                    style={{ color: "#a096b8" }}
                  >
                    {l.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-y-0.5 translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontakt / CTA */}
          <div>
            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-6" style={{ color: "#e91e8c" }}>
              Kom igång
            </h4>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "#a096b8" }}>
              Gratis SEO-analys av din sajt. Inga förpliktelser, inget kreditkort.
            </p>
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #e91e8c, #9333ea)",
                boxShadow: "0 0 20px rgba(233,30,140,0.35)",
              }}
            >
              Starta idag
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <div className="mt-5 flex flex-col gap-1.5">
              <span className="text-xs flex items-center gap-1.5" style={{ color: "#a096b8" }}>
                <span className="w-1 h-1 rounded-full inline-block" style={{ background: "#f5f0ff" }} />
                Ingen bindningstid
              </span>
              <span className="text-xs flex items-center gap-1.5" style={{ color: "#a096b8" }}>
                <span className="w-1 h-1 rounded-full inline-block" style={{ background: "#f5f0ff" }} />
                Svar inom 24 timmar
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}
        >
          <p className="text-xs text-center" style={{ color: "#a096b8" }}>
            &copy; 2026 Searchboost. Alla rättigheter förbehållna.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/integritetspolicy" className="text-xs hover:text-[#e91e8c] transition-colors duration-200" style={{ color: "#a096b8" }}>
              Integritetspolicy
            </Link>
            <div className="w-px h-3" style={{ background: "rgba(255,255,255,0.1)" }} />
            <Link href="/cookiepolicy" className="text-xs hover:text-[#c026d3] transition-colors duration-200" style={{ color: "#a096b8" }}>
              Cookiepolicy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
