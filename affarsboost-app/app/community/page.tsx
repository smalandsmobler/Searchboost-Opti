import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CommunityChat from "@/components/CommunityChat";
import { verifySession, SESSION_COOKIE } from "@/lib/session";

export const metadata: Metadata = {
  title: "1-1 Chat med Linnéa — Affärsboost",
  description: "Chatta direkt med Linnéa. Öppen måndag–fredag 8–17 (lunch 12–13). Ställ frågor om skatt, startbidrag, avtal och tillväxt.",
  robots: { index: false, follow: false },
};

export default async function CommunityPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = token ? verifySession(token) : null;
  if (!session) redirect("/login");
  return (
    <main className="min-h-screen bg-navy-50">
      {/* Header-bar */}
      <div className="bg-navy-900 text-white text-xs py-2">
        <div className="max-w-content mx-auto px-6 flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          <a href="/" className="hover:text-emerald-200 transition-colors">
            ← Tillbaka till Affärsboost
          </a>
        </div>
      </div>

      <div className="max-w-content mx-auto px-6 py-10">
        {/* Sidhuvud */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            1-1 Chat · Öppen 8–17
          </div>
          <h1 className="font-display text-4xl font-bold text-navy-900 mb-2">
            Chatta med Linnéa
          </h1>
          <p className="text-ink-600 text-lg max-w-2xl">
            Linnéa svarar på frågor om skatt, avdrag, startbidrag, avtal och tillväxt.
            Öppen måndag–fredag 8–17, lunch 12–13.
          </p>
        </div>

        {/* Info-banner */}
        <div className="bg-navy-800 text-white rounded-2xl px-6 py-4 mb-8 flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5 text-emerald-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-white text-sm mb-0.5">Öppettider: måndag–fredag 8–17 (lunch 12–13)</p>
            <p className="text-navy-200 text-sm">
              Meddelanden utanför öppettider sparas och besvaras nästa vardag. Råd om skatt och juridik ersätter inte en revisor eller advokat — men det är ett bra ställe att börja.
            </p>
          </div>
        </div>

        {/* Chatten */}
        <CommunityChat prefillName={session.nickname ?? session.email.split("@")[0]} prefillTier={session.tier} />

        {/* Under chatten */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-white border border-ink-100 rounded-xl p-5">
            <p className="font-display font-bold text-navy-900 mb-1 text-sm">Exempel på frågor</p>
            <ul className="text-ink-600 text-sm space-y-1.5 mt-2">
              <li className="flex gap-2">
                <span className="text-emerald-500 flex-shrink-0">→</span>
                Vad kan jag dra av som enskild firma?
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 flex-shrink-0">→</span>
                Vilka startbidrag finns i Stockholm just nu?
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 flex-shrink-0">→</span>
                Hur sätter jag rätt pris på mina tjänster?
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500 flex-shrink-0">→</span>
                Behöver jag ett uppdragsavtal?
              </li>
            </ul>
          </div>
          <div className="bg-white border border-ink-100 rounded-xl p-5">
            <p className="font-display font-bold text-navy-900 mb-1 text-sm">Öppettider</p>
            <ul className="text-ink-600 text-sm space-y-1.5 mt-2">
              <li>Mån–fre <strong className="text-navy-900">08:00–12:00</strong></li>
              <li>Mån–fre <strong className="text-navy-900">13:00–17:00</strong></li>
              <li className="text-ink-400">Lör–sön: stängd</li>
              <li className="text-ink-400">Lunch 12–13: stängd</li>
            </ul>
            <p className="text-ink-400 text-xs mt-3">
              Meddelanden utanför öppettider sparas och besvaras nästa gång Linnéa är online.
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
            <p className="font-display font-bold text-navy-900 mb-1 text-sm">Bli medlem</p>
            <p className="text-ink-600 text-sm mt-2 mb-4">
              Som Affärsboost-medlem får du obegränsad 1-1 Chat, mallbibliotek och veckonyhetsbrev. 299 kr/mån.
            </p>
            <a href="/#pris" className="btn-primary text-sm justify-center w-full">
              Läs mer →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
