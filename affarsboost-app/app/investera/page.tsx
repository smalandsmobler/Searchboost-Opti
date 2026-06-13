import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifySession, SESSION_COOKIE } from "@/lib/session";
import { listInvestors, listSeekingInvestment } from "@/lib/profiles";
import type { InvestorType } from "@/lib/profiles";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Investera — Möt svenska affärsänglar och VC | Affärsboost",
  description: "Hitta investerare för ditt bolag eller investera i lovande svenska startups. Affärsänglar, venture capital och family offices — matchmaking för rätt kapital.",
  alternates: { canonical: "https://affarsboost.se/investera" },
  openGraph: {
    title: "Investera — Affärsänglar och VC | Affärsboost",
    description: "Möt svenska investerare eller presentera ditt bolag för rätt kapital.",
    url: "https://affarsboost.se/investera",
    siteName: "Affärsboost",
    locale: "sv_SE",
    type: "website",
  },
};

const INVESTOR_TYPE_LABELS: Record<InvestorType, string> = {
  angel: "Affärsängel",
  vc: "Venture Capital",
  family_office: "Family Office",
  corporate: "Corporate VC",
};

const INVESTOR_TYPE_COLORS: Record<InvestorType, string> = {
  angel: "bg-amber-50 text-amber-700 border-amber-100",
  vc: "bg-violet-50 text-violet-700 border-violet-100",
  family_office: "bg-navy-50 text-navy-700 border-navy-100",
  corporate: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

const INDUSTRY_LABELS: Record<string, string> = {
  konsult: "Konsult", ehandel: "E-handel", saas: "SaaS", hantverk: "Hantverk",
  tjanster: "Tjänster", restaurang: "Restaurang", halsa: "Hälsa",
  utbildning: "Utbildning", kreativ: "Kreativ", tillverkning: "Tillverkning", annat: "Annat",
};

const STAGE_LABELS: Record<string, string> = {
  ide: "Idéstadiet", startfas: "Startfas", aktiv: "Aktiv", etablerat: "Etablerat", skalar: "Skalar",
};

const AVATAR_COLORS = [
  "bg-navy-700 text-white",
  "bg-violet-600 text-white",
  "bg-amber-600 text-white",
  "bg-emerald-600 text-white",
  "bg-rose-600 text-white",
  "bg-teal-600 text-white",
];

function formatAmount(sek: number): string {
  if (sek >= 1_000_000) return `${(sek / 1_000_000).toFixed(sek % 1_000_000 === 0 ? 0 : 1)} MSEK`;
  if (sek >= 1_000) return `${Math.round(sek / 1_000)} KSEK`;
  return `${sek} SEK`;
}

export default async function InvesteraPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = token ? verifySession(token) : null;
  if (!session) redirect("/login");

  const investors = listInvestors();
  const startups = listSeekingInvestment();

  return (
    <div className="min-h-screen bg-cream">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-cream-sand bg-cream/90 backdrop-blur-sm">
        <div className="max-w-content mx-auto px-6 flex items-center justify-between h-16">
          <Logo size="md" />
          <div className="flex items-center gap-4 text-sm">
            <Link href="/privat" className="text-ink-500 hover:text-navy-700 hidden sm:block">Dashboard</Link>
            <Link href="/mentorer" className="text-ink-600 font-medium hover:text-navy-700">Mentorer</Link>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="btn-secondary py-2 px-4 text-sm">Logga ut</button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-content mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Kapital</span>
            <span className="w-1 h-1 rounded-full bg-ink-300" />
            <span className="text-xs font-bold uppercase tracking-widest text-ink-400">Slutet nätverk</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy-700 mb-4">
            Investerare möter grundare
          </h1>
          <p className="text-ink-600 text-lg max-w-2xl leading-relaxed">
            Alla här är betalande medlemmar med skin in the game. Inga kalla LinkedIn-DMs — rätt kontext från dag ett.
          </p>
        </div>

        {/* ─── INVESTERARE ─────────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-navy-700">Investerare</h2>
              <p className="text-sm text-ink-500">{investors.length} aktiva i nätverket</p>
            </div>
            <Link href="/community" className="text-sm font-semibold text-emerald-600 hover:underline hidden sm:block">
              Diskutera i community →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {investors.map((inv, idx) => {
              const typeConfig = INVESTOR_TYPE_COLORS[inv.investorType ?? "angel"];
              const typeLabel = INVESTOR_TYPE_LABELS[inv.investorType ?? "angel"];
              const initials = inv.companyName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
              const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];

              return (
                <div key={inv.userId} className="bg-white border border-cream-sand rounded-2xl p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold shrink-0 ${avatarColor}`}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-bold text-navy-700 text-sm leading-tight">{inv.companyName}</p>
                      <p className="text-xs text-ink-500 mt-0.5">{inv.city}</p>
                    </div>
                  </div>

                  {/* Type + ticket */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${typeConfig}`}>
                      {typeLabel}
                    </span>
                    {inv.investorTicketMin && inv.investorTicketMax && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-ink-50 text-ink-600 border border-ink-100">
                        {formatAmount(inv.investorTicketMin)}–{formatAmount(inv.investorTicketMax)}
                      </span>
                    )}
                  </div>

                  {/* Thesis */}
                  <p className="text-sm text-ink-600 leading-relaxed line-clamp-4">
                    {inv.investorThesis}
                  </p>

                  {/* Focus industries */}
                  {inv.investorFocusIndustries && inv.investorFocusIndustries.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {inv.investorFocusIndustries.map((ind) => (
                        <span key={ind} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-navy-50 text-navy-700">
                          {INDUSTRY_LABELS[ind] ?? ind}
                        </span>
                      ))}
                    </div>
                  )}

                  <Link href="/community" className="mt-auto btn-primary text-sm py-2 px-4 text-center">
                    Ta kontakt →
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── SÖKER KAPITAL ─────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-navy-700">Söker kapital</h2>
              <p className="text-sm text-ink-500">{startups.length} bolag öppna för dialog</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {startups.map((s, idx) => {
              const initials = s.companyName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
              const avatarColor = AVATAR_COLORS[(idx + 2) % AVATAR_COLORS.length];

              return (
                <div key={s.userId} className="bg-white border border-cream-sand rounded-2xl p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold shrink-0 ${avatarColor}`}>
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold text-navy-700 text-sm">{s.companyName}</p>
                      <p className="text-xs text-ink-500 mt-0.5">{s.city} · {INDUSTRY_LABELS[s.industry] ?? s.industry}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-ink-400">Söker</p>
                      {s.seekingAmountMin && s.seekingAmountMax && (
                        <p className="font-semibold text-sm text-navy-700">
                          {formatAmount(s.seekingAmountMin)}–{formatAmount(s.seekingAmountMax)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-navy-50 text-navy-700">
                      {STAGE_LABELS[s.stage] ?? s.stage}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      {INDUSTRY_LABELS[s.industry] ?? s.industry}
                    </span>
                  </div>

                  <p className="text-sm text-ink-600 leading-relaxed">
                    {s.pitchSummary}
                  </p>

                  <Link href="/community" className="mt-auto text-sm font-semibold text-emerald-600 hover:underline">
                    Kontakta via community →
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTAs — registrera som investerare / startup */}
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="bg-navy-700 rounded-2xl p-7 text-white">
            <h3 className="font-display text-xl font-bold mb-2">Är du investerare?</h3>
            <p className="text-navy-200 text-sm mb-5 leading-relaxed">
              Registrera din investerarprofil och nå ett flöde av noggrant utvalda svenska grundare — utan LinkedIn-bruset.
            </p>
            <Link href="/onboarding" className="inline-block bg-white text-navy-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-cream transition-colors">
              Lägg till investerarprofil →
            </Link>
          </div>
          <div className="bg-emerald-600 rounded-2xl p-7 text-white">
            <h3 className="font-display text-xl font-bold mb-2">Söker ditt bolag kapital?</h3>
            <p className="text-emerald-100 text-sm mb-5 leading-relaxed">
              Lägg in ett kort om ditt bolag och låt relevanta investerare hitta dig — inte tvärtom.
            </p>
            <Link href="/onboarding" className="inline-block bg-white text-emerald-700 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-cream transition-colors">
              Presentera ditt bolag →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
