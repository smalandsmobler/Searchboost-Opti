import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifySession, SESSION_COOKIE } from "@/lib/session";
import { listMentors } from "@/lib/profiles";
import type { MentorFocus } from "@/lib/profiles";
import Logo from "@/components/Logo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mentorer — Boka 1-1 coaching med erfarna företagare | Affärsboost",
  description: "Hitta din mentor bland erfarna svenska företagare och investerare. Boka 1-1 om prissättning, försäljning, skalning, ledarskap och mer.",
  alternates: { canonical: "https://affarsboost.se/mentorer" },
  openGraph: {
    title: "Mentorer — 1-1 coaching | Affärsboost",
    description: "Erfarna svenska företagare. Boka tid för 1-1 och accelerera din tillväxt.",
    url: "https://affarsboost.se/mentorer",
    siteName: "Affärsboost",
    locale: "sv_SE",
    type: "website",
  },
};

const FOCUS_LABELS: Record<MentorFocus, string> = {
  "prissättning": "Prissättning",
  "försäljning": "Försäljning",
  "first-hire": "First hire",
  "skalning": "Skalning",
  "exit": "Exit",
  "fundraising": "Fundraising",
  "produktutveckling": "Produkt",
  "marknadsföring": "Marknadsföring",
  "ledarskap": "Ledarskap",
  "SaaS": "SaaS",
  "e-handel": "E-handel",
  "b2b": "B2B",
  "internationalisering": "Internationellt",
};

const AVAILABILITY_CONFIG = {
  öppen: { dot: "bg-emerald-400", label: "Öppen för förfrågningar", text: "text-emerald-700", bg: "bg-emerald-50" },
  begränsad: { dot: "bg-amber-400", label: "Begränsad tillgänglighet", text: "text-amber-700", bg: "bg-amber-50" },
  stängd: { dot: "bg-red-400", label: "Inte tillgänglig", text: "text-red-700", bg: "bg-red-50" },
};

const INDUSTRY_LABELS: Record<string, string> = {
  konsult: "Konsult", ehandel: "E-handel", saas: "SaaS", hantverk: "Hantverk",
  tjanster: "Tjänster", restaurang: "Restaurang", halsa: "Hälsa",
  utbildning: "Utbildning", kreativ: "Kreativ", tillverkning: "Tillverkning", annat: "Annat",
};

// Initials avatar colors
const AVATAR_COLORS = [
  "bg-navy-700 text-white",
  "bg-emerald-600 text-white",
  "bg-amber-600 text-white",
  "bg-rose-600 text-white",
  "bg-violet-600 text-white",
  "bg-teal-600 text-white",
];

export default async function MentorerPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = token ? verifySession(token) : null;
  if (!session) redirect("/login");

  const mentors = listMentors();
  const open = mentors.filter((m) => m.mentorAvailability !== "stängd");
  const closed = mentors.filter((m) => m.mentorAvailability === "stängd");

  return (
    <div className="min-h-screen bg-cream">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-cream-sand bg-cream/90 backdrop-blur-sm">
        <div className="max-w-content mx-auto px-6 flex items-center justify-between h-16">
          <Logo size="md" />
          <div className="flex items-center gap-4 text-sm">
            <Link href="/privat" className="text-ink-500 hover:text-navy-700 hidden sm:block">Dashboard</Link>
            <Link href="/investera" className="text-ink-600 font-medium hover:text-navy-700">Investerare</Link>
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
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Nätverk</span>
            <span className="w-1 h-1 rounded-full bg-ink-300" />
            <span className="text-xs font-bold uppercase tracking-widest text-ink-400">Endast för medlemmar</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-navy-700 mb-4">
            Hitta din mentor
          </h1>
          <p className="text-ink-600 text-lg max-w-2xl leading-relaxed">
            Erfarna svenska företagare som valt att öppna sin kalender för dig. Inte LinkedIn — de svarar faktiskt.
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { n: `${mentors.length}`, label: "Aktiva mentorer" },
            { n: `${open.length}`, label: "Öppna för förfrågan" },
            { n: "1-1", label: "Direkt via community-chat" },
          ].map(({ n, label }) => (
            <div key={label} className="bg-white border border-cream-sand rounded-2xl px-5 py-4 text-center">
              <p className="font-display text-3xl font-bold text-navy-700 mb-1">{n}</p>
              <p className="text-xs text-ink-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Mentor grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {[...open, ...closed].map((mentor, idx) => {
            const avail = AVAILABILITY_CONFIG[mentor.mentorAvailability ?? "öppen"];
            const initials = mentor.companyName
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase();
            const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            const isAvailable = mentor.mentorAvailability !== "stängd";

            return (
              <div
                key={mentor.userId}
                className={`bg-white border border-cream-sand rounded-2xl p-6 flex flex-col gap-4 transition-shadow ${isAvailable ? "hover:shadow-lg" : "opacity-70"}`}
              >
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-lg shrink-0 ${avatarColor}`}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-navy-700 text-base leading-tight">
                      {mentor.companyName}
                    </p>
                    <p className="text-xs text-ink-500 mt-0.5">{mentor.city} · {mentor.mentorYearsExperience} år erfarenhet</p>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full mt-2 ${avail.bg} ${avail.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${avail.dot}`} />
                      {avail.label}
                    </span>
                  </div>
                </div>

                {/* Industry */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-navy-50 text-navy-700">
                    {INDUSTRY_LABELS[mentor.industry] ?? mentor.industry}
                  </span>
                </div>

                {/* Bio */}
                <p className="text-sm text-ink-600 leading-relaxed line-clamp-3">
                  {mentor.mentorBio}
                </p>

                {/* Focus tags */}
                {mentor.mentorFocus && mentor.mentorFocus.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {mentor.mentorFocus.map((f) => (
                      <span key={f} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {FOCUS_LABELS[f] ?? f}
                      </span>
                    ))}
                  </div>
                )}

                {/* CTA */}
                {isAvailable ? (
                  <Link
                    href="/community"
                    className="mt-auto btn-primary text-sm py-2 px-4 text-center"
                  >
                    Kontakta via community →
                  </Link>
                ) : (
                  <span className="mt-auto text-xs text-ink-400 text-center py-2">Inte tillgänglig just nu</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Bli mentor — CTA */}
        <div className="bg-navy-700 rounded-2xl p-8 sm:p-10 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl font-bold mb-2">Är du den erfarne?</h2>
            <p className="text-navy-200 text-sm max-w-lg leading-relaxed">
              Om du har byggt och drivit bolag i minst fem år och vill ge tillbaka — registrera dig som mentor. Det tar fem minuter och du sätter helt din egen tillgänglighet.
            </p>
          </div>
          <Link
            href="/onboarding"
            className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm whitespace-nowrap"
          >
            Bli mentor →
          </Link>
        </div>
      </div>
    </div>
  );
}
