"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import Logo from "./Logo";

const tjansterDropdown = [
  { label: "SEO på autopilot", href: "/tjanster#autopilot", desc: "AI-optimering varje vecka" },
  { label: "Teknisk SEO", href: "/tjanster#teknisk", desc: "Core Web Vitals & schema" },
  { label: "Lokal SEO", href: "/tjanster#lokal", desc: "Syns i din stad" },
  { label: "Gratis SEO-analys", href: "/kontakt", desc: "Kostnadsfri genomgång" },
];

const navLinks = [
  { label: "Tjänster", href: "/tjanster", dropdown: true },
  { label: "SEO-skola", href: "/seo-skola", dropdown: false },
  { label: "Om oss", href: "/om-oss", dropdown: false },
  { label: "Kontakt", href: "/kontakt", dropdown: false },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 300, damping: 40 });
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Scroll progress bar */}
      <motion.div
        style={{
          scaleX,
          transformOrigin: "0%",
          background: "linear-gradient(90deg, #e91e8c 0%, #c026d3 50%, #c026d3 100%)",
          boxShadow: "0 0 12px rgba(233,30,140,0.6)",
        }}
        className="fixed top-0 left-0 right-0 h-[2px] z-[60] origin-left"
      />

      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          paddingTop: "2px",
          background: scrolled ? "rgba(5,5,15,0.97)" : "transparent",
          backdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
          borderBottom: scrolled ? "1px solid rgba(233,30,140,0.18)" : "none",
          boxShadow: scrolled ? "0 4px 40px rgba(233,30,140,0.06)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between">
          {/* Logo */}
          <Logo size="sm" />

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((l) =>
              l.dropdown ? (
                <div key={l.href} className="relative" ref={dropdownRef}>
                  <button
                    className={`relative group px-3 py-2 text-sm font-medium flex items-center gap-1 transition-colors duration-200 ${
                      isActive(l.href) ? "text-[#e91e8c]" : "text-[#c8b8e0] hover:text-[#e91e8c]"
                    }`}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    onMouseEnter={() => setDropdownOpen(true)}
                  >
                    {l.label}
                    <motion.div
                      animate={{ rotate: dropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.18 }}
                        className="absolute top-full left-0 mt-2 w-64 rounded-2xl p-2 shadow-2xl"
                        style={{
                          background: "rgba(8,8,24,0.98)",
                          border: "1px solid rgba(233,30,140,0.2)",
                          backdropFilter: "blur(20px)",
                        }}
                        onMouseLeave={() => setDropdownOpen(false)}
                      >
                        {tjansterDropdown.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="group flex flex-col gap-0.5 px-4 py-3 rounded-xl transition-all duration-150 hover:bg-[rgba(233,30,140,0.08)]"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <span className="text-sm font-semibold text-[#f0eafa] group-hover:text-[#e91e8c] transition-colors">
                              {item.label}
                            </span>
                            <span className="text-xs" style={{ color: "#7a6e90" }}>
                              {item.desc}
                            </span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive(l.href) ? "text-[#e91e8c]" : "text-[#c8b8e0] hover:text-[#e91e8c]"
                  }`}
                >
                  {l.label}
                </Link>
              )
            )}
          </div>

          {/* CTA */}
          <div className="hidden md:block">
            <ShimmerButton href="/kontakt" label="Gratis analys →" />
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-11 h-11 flex items-center justify-center rounded-lg text-[#c8b8e0] hover:text-[#e91e8c] transition-colors"
            style={{ background: "rgba(233,30,140,0.08)", border: "1px solid rgba(233,30,140,0.2)" }}
            onClick={() => setOpen(!open)}
            aria-label="Öppna meny"
          >
            <AnimatePresence mode="wait">
              {open ? (
                <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Menu className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden overflow-hidden"
              style={{ background: "rgba(5,5,15,0.99)", borderTop: "1px solid rgba(233,30,140,0.15)" }}
            >
              <div className="px-6 py-6 flex flex-col gap-1">
                {/* Tjänster with sub-links */}
                <div>
                  <span className="text-[11px] font-bold tracking-[0.2em] uppercase px-3 mb-2 block" style={{ color: "#e91e8c" }}>
                    Tjänster
                  </span>
                  {tjansterDropdown.map((item, i) => (
                    <motion.div
                      key={item.href}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.05, duration: 0.25 }}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center justify-between text-sm font-medium text-[#c8b8e0] hover:text-[#e91e8c] transition-colors py-2.5 pl-3 border-b border-[rgba(233,30,140,0.05)]"
                        onClick={() => setOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-3 flex flex-col gap-1">
                  {[
                    { label: "SEO-skola", href: "/seo-skola" },
                    { label: "Om oss", href: "/om-oss" },
                    { label: "Kontakt", href: "/kontakt" },
                  ].map((l, i) => (
                    <motion.div
                      key={l.href}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: (tjansterDropdown.length + i) * 0.05, duration: 0.25 }}
                    >
                      <Link
                        href={l.href}
                        className="block text-[15px] font-medium text-[#c8b8e0] hover:text-[#e91e8c] transition-colors py-3 border-b border-[rgba(233,30,140,0.08)]"
                        onClick={() => setOpen(false)}
                      >
                        {l.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.3 }}
                  className="mt-4"
                >
                  <ShimmerButton href="/kontakt" label="Gratis analys →" full onClick={() => setOpen(false)} />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}

function ShimmerButton({
  href,
  label,
  full,
  onClick,
}: {
  href: string;
  label: string;
  full?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-bold text-white overflow-hidden transition-transform duration-200 hover:scale-[1.04] active:scale-[0.97] ${full ? "w-full" : ""}`}
      style={{
        background: "linear-gradient(135deg, #e91e8c 0%, #c026d3 50%, #9333ea 100%)",
        boxShadow: "0 0 24px rgba(233,30,140,0.45), 0 0 48px rgba(233,30,140,0.15), inset 0 1px 0 rgba(255,255,255,0.15)",
      }}
    >
      <motion.span
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.45) 50%, transparent 75%)",
          skewX: -10,
        }}
        animate={{ x: ["-150%", "250%"] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
      />
      <span className="relative z-10">{label}</span>
    </Link>
  );
}
