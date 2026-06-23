import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import InteractiveBackground from "@/components/InteractiveBackground";
import Link from "next/link";
import {
  CheckCircle2,
  MousePointerClick,
  Target,
  TrendingUp,
  BarChart3,
  RefreshCcw,
  ArrowRight,
  ChevronRight,
  DollarSign,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Google Ads-byrå — Kampanjer som konverterar | Searchboost",
  description:
    "Vi hanterar era Google Ads-kampanjer med fokus på ROAS. Sökannonser, Display och Shopping — löpande optimering varje vecka. Inga långa avtal.",
  alternates: { canonical: "https://searchboost.se/tjanster/google-ads/" },
  openGraph: {
    title: "Google Ads | Searchboost",
    description: "Google Ads-kampanjer med fokus på ROAS, inte klick.",
    url: "https://searchboost.se/tjanster/google-ads/",
  },
};

const included = [
  "Kampanjstrategi & kontostruktur",
  "Sökordsanalys & negativa nyckelord",
  "Annonstext & tillgångsskapande",
  "Budgetstrategi & budgivning",
  "Konverteringsspårning (GA4 + GTM)",
  "Remarketing-kampanjer",
  "Löpande A/B-testning av annonser",
  "Månadsrapport med ROAS och CPA",
];

const steps = [
  {
    num: "01",
    title: "Kontoanalys",
    desc: "Vi granskar befintligt konto (eller skapar nytt). Identifierar slöseri, luckor och möjligheter.",
  },
  {
    num: "02",
    title: "Strategi & setup",
    desc: "Kampanjstruktur, sökordslistor och annonsgrupper byggs korrekt. Konverteringsspårning verifieras.",
  },
  {
    num: "03",
    title: "Lansering",
    desc: "Annonserna är live. Vi bevakar kvalitetspoäng, CPC och konverteringar tätt de första veckorna.",
  },
  {
    num: "04",
    title: "Löpande optimering",
    desc: "Varje vecka: negativa nyckelord, budgivningsjusteringar, A/B-test. Inga annonser lämnas oövervakade.",
  },
];

const faqs = [
  {
    q: "Vad kostar Google Ads-hantering?",
    a: "Vår hanteringsavgift börjar på 3 500 kr/mån exkl. annonsbudget. Annonsbudgeten bestämmer ni själva — vi rekommenderar minst 5 000–10 000 kr/mån för att få mätbara resultat.",
  },
  {
    q: "Hur snabbt ser vi resultat?",
    a: "Sökannonser kan ge trafik från dag ett. Optimering och ROAS-förbättring sker löpande under de första 4–8 veckorna när algoritmen lär sig er målgrupp.",
  },
  {
    q: "Vem äger annonskontot?",
    a: "Ni. Vi arbetar i ert Google Ads-konto, inte ett eget. Ni behåller full kontroll och all data om ni väljer att avsluta.",
  },
  {
    q: "Hanterar ni också Meta Ads (Facebook/Instagram)?",
    a: "Ja, vi kan hantera Meta Ads parallellt. Kontakta oss för ett kombinerat upplägg.",
  },
  {
    q: "Kombinerar ni Google Ads med SEO?",
    a: "Absolut — och det rekommenderar vi. Ads ger omedelbar synlighet medan SEO bygger långsiktig organisk trafik. Kombinationen ger lägst totalkostnad per lead över tid.",
  },
];

const results = [
  { label: "Genomsnittlig ROAS", value: "4,2×" },
  { label: "Sänkning av CPC", value: "−28%" },
  { label: "Konverteringsökning", value: "+41%" },
];

export default function GoogleAdsPage() {
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
              background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(96,165,250,0.06) 0%, transparent 70%)",
            }}
          />
          <div className="max-w-4xl mx-auto px-6">
            <nav className="flex items-center gap-1.5 text-xs mb-8" style={{ color: "#5a5070" }}>
              <Link href="/" className="hover:text-[#60a5fa] transition-colors">Hem</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/tjanster" className="hover:text-[#60a5fa] transition-colors">Tjänster</Link>
              <ChevronRight className="w-3 h-3" />
              <span style={{ color: "#9080a8" }}>Google Ads</span>
            </nav>

            <span
              className="inline-block text-xs font-bold tracking-[0.25em] uppercase mb-5 px-4 py-1.5 rounded-full"
              style={{ color: "#60a5fa", background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.22)" }}
            >
              Betald annonsering
            </span>

            <h1
              className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 leading-[1.06]"
              style={{ color: "#f0eafa" }}
            >
              Google Ads som ger{" "}
              <span style={{ color: "#60a5fa" }}>resultat</span> — inte bara klick
            </h1>

            <p className="text-lg max-w-2xl mb-8 leading-relaxed" style={{ color: "#8a7ea8" }}>
              Vi hanterar era Google Ads-kampanjer med fokus på det som faktiskt spelar roll:
              konverteringar och avkastning på annonskronorna. Inga långa avtal, full transparens.
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 mb-10">
              {results.map((r) => (
                <div
                  key={r.label}
                  className="px-5 py-3 rounded-xl"
                  style={{ background: "rgba(8,8,24,0.75)", border: "1px solid rgba(96,165,250,0.15)" }}
                >
                  <p className="text-xl font-black" style={{ color: "#60a5fa" }}>{r.value}</p>
                  <p className="text-xs" style={{ color: "#5a5070" }}>{r.label}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/kontakt"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", boxShadow: "0 0 24px rgba(59,130,246,0.3)" }}
              >
                Boka kostnadsfri genomgång <ArrowRight className="w-4 h-4" />
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
          <div className="h-px" style={{ background: "linear-gradient(90deg, rgba(96,165,250,0.4), rgba(255,255,255,0.06), transparent)" }} />
        </div>

        {/* What's included */}
        <section className="py-16 max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8" style={{ color: "#f0eafa" }}>
            Vad ingår i Google Ads-hanteringen
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {included.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
                style={{ background: "rgba(8,8,24,0.65)", border: "1px solid rgba(96,165,250,0.12)" }}
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#60a5fa" }} />
                <span className="text-sm" style={{ color: "#c8b8e0" }}>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Why */}
        <section className="py-10 max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8" style={{ color: "#f0eafa" }}>
            Varför välja Searchboost för Google Ads
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Target, title: "ROAS-fokus", desc: "Vi optimerar mot avkastning, inte klick eller visningar. Varje krona ska arbeta." },
              { icon: TrendingUp, title: "Löpande optimering", desc: "Veckovisa justeringar av bud, nyckelord och annonser. Inga kampanjer lämnas att rulla på auto." },
              { icon: BarChart3, title: "Full transparens", desc: "Ni ser exakt var pengarna går. Månadsrapport med ROAS, CPA och konverteringsdata." },
              { icon: DollarSign, title: "Ni äger allt", desc: "Annonsbudgeten betalas direkt till Google. Ni äger kontot och all data." },
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
                    style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)" }}
                  >
                    <Icon className="w-4 h-4" style={{ color: "#60a5fa" }} />
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
                <span className="text-2xl font-black" style={{ color: "rgba(96,165,250,0.3)" }}>{s.num}</span>
                <h3 className="text-sm font-bold" style={{ color: "#f0eafa" }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#7a6e90" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Ads + SEO combo */}
        <section className="py-10 max-w-4xl mx-auto px-6">
          <div
            className="p-8 rounded-2xl"
            style={{ background: "rgba(8,8,24,0.85)", border: "1px solid rgba(96,165,250,0.18)" }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.22)" }}
              >
                <RefreshCcw className="w-5 h-5" style={{ color: "#60a5fa" }} />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-3" style={{ color: "#f0eafa" }}>
                  Kombinera Google Ads med SEO
                </h2>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "#8a7ea8" }}>
                  Ads ger omedelbar synlighet medan SEO bygger långsiktig organisk trafik. Kombinationen
                  är den mest kostnadseffektiva vägen till konsekvent tillväxt — ni dominerar sökresultaten
                  både med betalda och organiska resultat.
                </p>
                <Link
                  href="/#priser"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-[#60a5fa]"
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
          <h2 className="text-2xl font-bold mb-8" style={{ color: "#f0eafa" }}>Vanliga frågor om Google Ads</h2>
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
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#60a5fa" }}>Kom igång</p>
          <h2 className="text-2xl font-bold mb-4" style={{ color: "#f0eafa" }}>
            Redo att få ut mer av era annonskronor?
          </h2>
          <p className="text-sm mb-8" style={{ color: "#7a6e90" }}>
            Boka en kostnadsfri genomgång — vi tittar på ert nuvarande konto och berättar exakt vad vi ser.
          </p>
          <Link
            href="/kontakt"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.03]"
            style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)", boxShadow: "0 0 28px rgba(59,130,246,0.3)" }}
          >
            Boka kostnadsfri genomgång <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

      </main>
      <Footer />
    </>
  );
}
