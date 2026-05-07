import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import InteractiveBackground from "@/components/InteractiveBackground";
import Link from "next/link";
import { getAllArticles, getArticleBySlug, getRelatedArticles } from "@/lib/articles";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";

export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = getArticleBySlug(params.slug);
  if (!article) return {};
  return {
    title: `${article.title} | Searchboost SEO-skola`,
    description: article.description,
    alternates: { canonical: `https://searchboost.se/seo-skola/${article.slug}/` },
  };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  const related = getRelatedArticles(article.slug, article.category, 3);

  return (
    <>
      <InteractiveBackground />
      <Nav />
      <main style={{ position: "relative", zIndex: 1 }}>
        {/* Article hero */}
        <section className="pt-36 pb-10 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(233,30,140,0.05) 0%, transparent 70%)",
            }}
          />
          <div className="max-w-3xl mx-auto px-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs mb-8" style={{ color: "#5a5070" }}>
              <Link href="/" className="hover:text-[#e91e8c] transition-colors">Hem</Link>
              <span>/</span>
              <Link href="/seo-skola" className="hover:text-[#e91e8c] transition-colors">SEO-skola</Link>
              <span>/</span>
              <span style={{ color: "#9080a8" }}>{article.category}</span>
            </div>

            {/* Back link */}
            <Link
              href="/seo-skola"
              className="inline-flex items-center gap-1.5 text-xs font-medium mb-6 hover:text-[#e91e8c] transition-colors"
              style={{ color: "#7a6e90" }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Alla guider
            </Link>

            {/* Category badge */}
            <div className="mb-4">
              <span
                className="inline-block text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full"
                style={{
                  color: "#e91e8c",
                  background: "rgba(233,30,140,0.08)",
                  border: "1px solid rgba(233,30,140,0.2)",
                }}
              >
                {article.category}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 leading-tight" style={{ color: "#f0eafa" }}>
              {article.title}
            </h1>
            <p className="text-base mb-6" style={{ color: "#8a7ea8" }}>
              {article.description}
            </p>
            <div className="flex items-center gap-4 text-xs" style={{ color: "#5a5070" }}>
              <span>Searchboost</span>
              <span>·</span>
              <span>{article.readTime} min läsning</span>
              <span>·</span>
              <span>Uppdaterad 2026</span>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-3xl mx-auto px-6">
          <div className="h-px" style={{ background: "linear-gradient(90deg, rgba(233,30,140,0.4), rgba(255,255,255,0.06), transparent)" }} />
        </div>

        {/* Article content */}
        <article className="max-w-3xl mx-auto px-6 py-12">
          <div
            className="seo-article-content"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>

        {/* CTA at bottom */}
        <section
          className="max-w-3xl mx-auto px-6 mb-16 py-10 rounded-2xl text-center"
          style={{
            background: "rgba(8,8,24,0.8)",
            border: "1px solid rgba(233,30,140,0.2)",
          }}
        >
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#e91e8c" }}>
            Vill du ha hjälp med just detta?
          </p>
          <h2 className="text-xl font-bold mb-3" style={{ color: "#f0eafa" }}>
            Vi gör det åt dig — automatiskt
          </h2>
          <p className="text-sm mb-6" style={{ color: "#7a6e90" }}>
            Gratis SEO-analys av din sajt. Inga förbindelser, inga säljpitchar.
          </p>
          <Link
            href="/kontakt"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03]"
            style={{
              background: "linear-gradient(135deg, #e91e8c, #9333ea)",
              boxShadow: "0 0 24px rgba(233,30,140,0.35)",
            }}
          >
            Boka gratis analys →
          </Link>
        </section>

        {/* Related articles */}
        {related.length > 0 && (
          <section className="max-w-3xl mx-auto px-6 pb-16">
            <div className="h-px mb-10" style={{ background: "rgba(255,255,255,0.06)" }} />
            <p className="text-xs font-bold tracking-[0.2em] uppercase mb-6" style={{ color: "#e91e8c" }}>
              Fortsätt läsa
            </p>
            <div className="flex flex-col gap-3">
              {related.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/seo-skola/${rel.slug}`}
                  className="group flex items-center justify-between gap-4 px-5 py-4 rounded-xl transition-all duration-200"
                  style={{
                    background: "rgba(8,8,24,0.6)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(233,30,140,0.25)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(8,8,24,0.9)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(8,8,24,0.6)";
                  }}
                >
                  <div className="min-w-0">
                    <span
                      className="text-[10px] font-bold tracking-widest uppercase block mb-1"
                      style={{ color: "#5a5070" }}
                    >
                      {rel.category}
                    </span>
                    <span className="text-sm font-semibold leading-snug" style={{ color: "#c8b8e0" }}>
                      {rel.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="hidden sm:flex items-center gap-1 text-xs" style={{ color: "#5a5070" }}>
                      <Clock className="w-3 h-3" />
                      {rel.readTime} min
                    </span>
                    <ArrowRight
                      className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
                      style={{ color: "#e91e8c" }}
                    />
                  </div>
                </Link>
              ))}
            </div>

            {/* Back to listing */}
            <div className="mt-8 text-center">
              <Link
                href="/seo-skola"
                className="inline-flex items-center gap-2 text-sm font-medium hover:text-[#e91e8c] transition-colors"
                style={{ color: "#7a6e90" }}
              >
                <ArrowLeft className="w-4 h-4" />
                Alla guider i SEO-skolan
              </Link>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
