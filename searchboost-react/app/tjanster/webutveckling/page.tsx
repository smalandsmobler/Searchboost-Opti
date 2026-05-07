import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import InteractiveBackground from "@/components/InteractiveBackground";
import Link from "next/link";
import {
  CheckCircle2,
  Globe,
  Zap,
  ShieldCheck,
  Smartphone,
  BarChart3,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Webutveckling — Snabba, SEO-vänliga webbplatser | Searchboost",
  description:
    "Vi bygger snabba, SEO-optimerade webbplatser i WordPress och WooCommerce. Mobilanpassat, Core Web Vitals-godkänt och redo att ranka på Google från dag ett.",
  alternates: { canonical: "https://searchboost.se/tjanster/webutveckling/" },
  openGraph: {
    title: "Webutveckling | Searchboost",
    description: "Snabba, SEO-vänliga webbplatser i WordPress och WooCommerce.",
    url: "https://searchboost.se/tjanster/webutveckling/",
  },
};

const included = [
  "WordPress eller WooCommerce-sajt",
  "Mobilanpassad design (responsiv)",
  "Core Web Vitals-optimerad",
  "On-page SEO från start (title, meta, schema)",
  "GA4 & GTM-installation",
  "SSL-certifikat & säkerhetskonfiguration",
  "Snabb hosting-rekommendation",
  "30 dagars support efter lansering",
];

const steps = [
  {
    num: "01",
    title: "Behovsanalys",
    desc: "Vi går igenom era mål, målgrupp och konkurrenter. Vad ska sajten åstadkomma — och hur mäter vi det?",
  },
  {
    num: "02",
    title: "Design & struktur",
    desc: "Wireframes och design som matchar ert varumärke. SEO-vänlig URL-struktur och informationsarkitektur sätts från start.",
  },
  {
    num: "03",
    title: "Bygge & optimering",
    desc: "Vi bygger i WordPress med rätt tema och plugins. Schema markup, laddningstider och mobilanpassning är standard — inte tillval.",
  },
  {
    num: "04",
    title: "Lansering & uppföljning",
    desc: "GA4, Search Console och GTM installeras. Vi skickar in sajten för indexering och säkerställer att allt spåras korrekt.",
  },
];

const faqs = [
  {
    q: "Hur lång tid tar det att bygga en webbplats?",
    a: "En enklare presentationssajt tar 2–3 veckor. En e-handel eller mer komplex sajt tar typiskt 4–6 veckor. Vi ger alltid en tydlig tidsplan i offerten.",
  },
  {
    q: "Bygger ni i WordPress?",
    a: "Ja, WordPress är vår primära plattform — det ger er full kontroll, ett stort ekosystem och är SEO-vänligt. För e-handel bygger vi i WooCommerce.",
  },
  {
    q: "Kan ni ta över en befintlig webbplats?",
    a: "Absolut. Vi gör en teknisk genomgång, åtgärdar problem och vidareutvecklar — utan att ni behöver starta om från noll.",
  },
  {
    q: "Ingår SEO i webutvecklingen?",
    a: "Ja. Vi bygger alltid med SEO-tekniken korrekt inställd från start: rätt titel-taggar, meta-beskrivningar, schema markup och intern länkstruktur. Vill ni ha löpande SEO-arbete kombinerar vi med ett av våra SEO-paket.",
  },
  {
    q: "Vad kostar en ny webbplats?",
    a: "Det beror på omfång. En presentationssajt med 5–10 sidor börjar runt 15 000 kr. En e-handel med produktkatalog från 35 000 kr. Vi skickar alltid en fast offert.",
  },
];

export default function WebutvecklingPage() {
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
              background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(52,211,153,0.06) 0%, transparent 70%)",
            }}
          />
          <div className="max-w-4xl mx-auto px-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs mb-8" style={{ color: "#5a5070" }}>
              <Link href="/" className="hover:text-[#34d399] transition-colors">Hem</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/tjanster" className="hover:text-[#34d399] transition-colors">Tjänster</Link>
              <ChevronRight className="w-3 h-3" />
              <span style={{ color: "#9080a8" }}>Webutveckling</span>
            </nav>

            <span
              className="inline-block text-xs font-bold tracking-[0.25em] uppercase mb-5 px-4 py-1.5 rounded-full"
              style={{ color: "#34d399", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.22)" }}
            >
              Webb & Design
            </span>

            <h1
              className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-[1.06]"
              style={{ color: "#f0eafa" }}
            >
              Webutveckling som{" "}
              <span style={{ color: "#34d399" }}>rankar</span> — och konverterar
            </h1>

            <p className="text-lg max-w-2xl mb-8 leading-relaxed" style={{ color: "#8a7ea8" }}>
              Vi bygger snabba, SEO-vänliga webbplatser i WordPress och WooCommerce. Mobilanpassat,
              Core Web Vitals-godkänt och redo att synas på Google från dag ett.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/kontakt"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #34d399, #059669)", boxShadow: "0 0 24px rgba(52,211,153,0.3)" }}
              >
                Begär offert <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/tjanster"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#c8b8e0" }}
              >
                Alla tjänster
              </Link>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-4xl mx-auto px-6">
          <div className="h-px" style={{ background: "linear-gradient(90deg, rgba(52,211,153,0.4), rgba(255,255,255,0.06), transparent)" }} />
        </div>

        {/* What's included */}
        <section className="py-16 max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8" style={{ color: "#f0eafa" }}>
            Vad ingår i webutvecklingen
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {included.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                style={{ background: "rgba(8,8,24,0.65)", border: "1px solid rgba(52,211,153,0.12)" }}
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#34d399" }} />
                <span className="text-sm" style={{ color: "#c8b8e0" }}>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Key benefits */}
        <section className="py-10 max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8" style={{ color: "#f0eafa" }}>
            Varför en SEO-vänlig sajt spelar roll
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Zap, title: "Snabb laddning", desc: "Varje extra sekund ladetid kostar konverteringar. Vi optimerar bilder, kod och hosting." },
              { icon: Smartphone, title: "Mobilanpassad", desc: "Över 60% av besöken kommer från mobil. Google rankar mobilversionen — inte desktopen." },
              { icon: BarChart3, title: "Spårning från start", desc: "GA4 och GTM installeras korrekt. Ni vet varifrån trafiken kommer och vad den gör." },
              { icon: ShieldCheck, title: "Teknisk SEO inbyggd", desc: "Schema markup, canonical-taggar och robots.txt — rätt konfigurerat från dag ett." },
            ].map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="p-5 rounded-xl flex flex-col gap-3"
                  style={{ background: "rgba(8,8,24,0.65)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}
                  >
                    <Icon className="w-4 h-4" style={{ color: "#34d399" }} />
                  </div>
                  <h3 className="text-sm font-bold" style={{ color: "#f0eafa" }}>{b.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#7a6e90" }}>{b.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Process */}
        <section className="py-10 max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8" style={{ color: "#f0eafa" }}>Hur vi jobbar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s) => (
              <div
                key={s.num}
                className="p-5 rounded-xl flex flex-col gap-2"
                style={{ background: "rgba(8,8,24,0.65)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <span className="text-2xl font-black" style={{ color: "rgba(52,211,153,0.3)" }}>{s.num}</span>
                <h3 className="text-sm font-bold" style={{ color: "#f0eafa" }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#7a6e90" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SEO + Webb combo pitch */}
        <section className="py-10 max-w-4xl mx-auto px-6">
          <div
            className="p-8 rounded-2xl"
            style={{ background: "rgba(8,8,24,0.85)", border: "1px solid rgba(52,211,153,0.18)" }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.22)" }}
              >
                <Globe className="w-5 h-5" style={{ color: "#34d399" }} />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "#f0eafa" }}>
                  Kombinera med löpande SEO
                </h2>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "#8a7ea8" }}>
                  En ny sajt utan SEO-arbete tappar synlighet inom månader. Kombinera webutveckling
                  med ett av våra SEO-paket så optimeras sajten automatiskt varje vecka — utan att ni
                  behöver tänka på det.
                </p>
                <Link
                  href="/#priser"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-[#34d399]"
                  style={{ color: "#5a5070" }}
                >
                  Se SEO-paketen <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-10 max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8" style={{ color: "#f0eafa" }}>Vanliga frågor</h2>
          <div className="flex flex-col gap-3">
            {faqs.map((f) => (
              <div
                key={f.q}
                className="p-6 rounded-xl"
                style={{ background: "rgba(8,8,24,0.65)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <h3 className="text-sm font-bold mb-2" style={{ color: "#f0eafa" }}>{f.q}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#8a7ea8" }}>{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 max-w-2xl mx-auto px-6 text-center">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#34d399" }}>Kom igång</p>
          <h2 className="text-2xl font-bold mb-4" style={{ color: "#f0eafa" }}>Redo att bygga något bra?</h2>
          <p className="text-sm mb-8" style={{ color: "#7a6e90" }}>
            Berätta vad ni behöver — vi skickar en offert inom 24 timmar.
          </p>
          <Link
            href="/kontakt"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03]"
            style={{ background: "linear-gradient(135deg, #34d399, #059669)", boxShadow: "0 0 28px rgba(52,211,153,0.3)" }}
          >
            Begär offert <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

      </main>
      <Footer />
    </>
  );
}
