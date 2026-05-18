import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import InteractiveBackground from "@/components/InteractiveBackground";
import { getAllArticles } from "@/lib/articles";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SEO-skola — Lär dig sökmotoroptimering | Searchboost",
  description: "Gratis SEO-guider på svenska. Lär dig teknisk SEO, nyckelordsforskning, länkbygge och allt annat du behöver för att ranka högre på Google.",
  alternates: { canonical: "https://searchboost.se/seo-skola" },
  openGraph: {
    title: "SEO-skola — Gratis SEO-guider på svenska | Searchboost",
    description: "Teknisk SEO, nyckelordsforskning, länkbygge och lokal SEO. Uppdaterade guider 2026.",
    url: "https://searchboost.se/seo-skola",
    siteName: "Searchboost",
    locale: "sv_SE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SEO-skola — Gratis SEO-guider | Searchboost",
    description: "Lär dig sökmotoroptimering gratis. Teknisk SEO, nyckelord, länkbygge och mer.",
  },
};

const CATEGORY_ORDER = ["Grunderna", "Strategi", "Teknisk", "On-page", "Innehåll", "Off-page", "Lokal", "Verktyg"];

export default function SeoSkolaPage() {
  const articles = getAllArticles();
  const categories = CATEGORY_ORDER.filter((c) =>
    articles.some((a) => a.category === c)
  );

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
              background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(233,30,140,0.07) 0%, transparent 70%)",
            }}
          />
          <div className="max-w-4xl mx-auto px-6 text-center">
            <span
              className="inline-block text-xs font-bold tracking-[0.25em] uppercase mb-4 px-4 py-1.5 rounded-full"
              style={{
                color: "#e91e8c",
                background: "rgba(233,30,140,0.08)",
                border: "1px solid rgba(233,30,140,0.2)",
              }}
            >
              Gratis guider
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5" style={{ color: "#f0eafa" }}>
              SEO-skola
            </h1>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "#8a7ea8" }}>
              25 djupgående guider om sökmotoroptimering — skrivna för svenska företagare. Från nybörjare till avancerat.
            </p>
          </div>
        </section>

        {/* Categories + Articles */}
        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6">
          {categories.map((category) => {
            const cats = articles.filter((a) => a.category === category);
            return (
              <div key={category} className="mb-16">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-sm font-bold tracking-[0.2em] uppercase" style={{ color: "#e91e8c" }}>
                    {category}
                  </h2>
                  <div className="flex-1 h-px" style={{ background: "rgba(233,30,140,0.15)" }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cats.map((article) => (
                    <Link
                      key={article.slug}
                      href={`/seo-skola/${article.slug}`}
                      className="group relative flex flex-col p-5 rounded-2xl transition-all duration-200 cursor-pointer"
                      style={{
                        background: "rgba(8,8,24,0.65)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <h3
                        className="text-sm font-semibold mb-2 leading-snug transition-colors duration-200 group-hover:text-[#e91e8c]"
                        style={{ color: "#f0eafa" }}
                      >
                        {article.title}
                      </h3>
                      <p className="text-sm leading-relaxed flex-1 mb-3" style={{ color: "#7a6e90" }}>
                        {article.description.slice(0, 100)}…
                      </p>
                      <span className="text-[10px] font-semibold" style={{ color: "#5a5070" }}>
                        {article.readTime} min läsning
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* CTA */}
        <section className="py-20 max-w-2xl mx-auto px-6 text-center">
          <p className="text-sm mb-2" style={{ color: "#7a6e90" }}>Vill du ha hjälp med din SEO?</p>
          <h2 className="text-2xl font-bold mb-6" style={{ color: "#f0eafa" }}>
            Gratis analys av din sajt
          </h2>
          <Link
            href="/kontakt"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03]"
            style={{
              background: "linear-gradient(135deg, #e91e8c, #9333ea)",
              boxShadow: "0 0 24px rgba(233,30,140,0.35)",
            }}
          >
            Boka gratis analys →
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
