import type { Metadata } from "next";
import CommunityChat from "@/components/CommunityChat";

export const metadata: Metadata = {
  title: "Community & AI-rådgivare — Affärsboost",
  description: "Chatta med Linnéa — Affärsboosts AI-rådgivare — dygnet runt. Ställ frågor om skatt, startbidrag, avtal och tillväxt.",
};

export default function CommunityPage() {
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
            AI-community · Öppet 24/7
          </div>
          <h1 className="font-display text-4xl font-bold text-navy-900 mb-2">
            Chatta med Linnéa
          </h1>
          <p className="text-ink-600 text-lg max-w-2xl">
            Linnéa är en AI-affärsrådgivare som svarar på frågor om skatt, avdrag, startbidrag, avtal och tillväxt.
            Communityt är öppet 24/7 — Linnéa är aktiv och svarar direkt måndag–fredag 08–12 och 13–17.
          </p>
        </div>

        {/* Bannern: "Det här är AI" */}
        <div className="bg-navy-800 text-white rounded-2xl px-6 py-4 mb-8 flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-emerald-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.357 2.059l.15.065A3 3 0 0020.25 14.5v1.5" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-white text-sm mb-0.5">Linnéa är en AI-assistent</p>
            <p className="text-navy-200 text-sm">
              Linnéa drivs av generativ AI och är alltid öppen om det. Råd om skatt och juridik ersätter inte en revisor eller advokat — men det är ett bra ställe att börja.
            </p>
          </div>
        </div>

        {/* Chatten */}
        <CommunityChat />

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
              Som Affärsboost-medlem får du obegränsad AI-coach, mallbibliotek och veckonyhetsbrev. 299 kr/mån.
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
