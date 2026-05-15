import WaitlistForm from "@/components/WaitlistForm";
import LinnéaStatusBadge from "@/components/LinnéaStatusBadge";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Trust bar */}
      <div className="bg-navy-900 text-white text-xs sm:text-sm py-2">
        <div className="max-w-content mx-auto px-6 flex items-center justify-center gap-2 text-center">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
          En tjänst från{" "}
          <a href="https://searchboost.se" className="underline hover:text-emerald-100">
            Searchboost AB
          </a>
          <span className="text-ink-300">·</span>
          <span>AI-driven affärsutveckling för svenska företagare</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="border-b border-ink-100 bg-white sticky top-0 z-30">
        <div className="max-w-content mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-navy-700 flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">A</span>
            </div>
            <span className="font-display font-bold text-xl text-navy-900">Affärsboost</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-700">
            <a href="#linnea" className="hover:text-navy-700">Träffa Linnéa</a>
            <a href="#vad-du-far" className="hover:text-navy-700">Vad du får</a>
            <a href="#for-vem" className="hover:text-navy-700">För vem</a>
            <a href="#pris" className="hover:text-navy-700">Pris</a>
          </div>
          <a href="#pris" className="btn-primary text-sm">Bli medlem</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-navy-50">
        <div className="max-w-content mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 text-emerald-400 text-sm font-semibold mb-6">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M10 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1zM5.05 3.05a.75.75 0 011.06 0l1.062 1.06A.75.75 0 116.11 5.173L5.05 4.11a.75.75 0 010-1.06zM14.95 3.05a.75.75 0 010 1.06l-1.06 1.062a.75.75 0 01-1.062-1.062l1.06-1.06a.75.75 0 011.062 0zM3 9.25a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5H3zm12.5 0a.75.75 0 000 1.5H17a.75.75 0 000-1.5h-1.5zM5.05 16.95a.75.75 0 001.06 0l1.062-1.06a.75.75 0 10-1.062-1.062L5.05 15.89a.75.75 0 000 1.06zm9.9 0a.75.75 0 000-1.06l-1.06-1.062a.75.75 0 10-1.062 1.062l1.06 1.06a.75.75 0 001.062 0zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zm0-11a5 5 0 100 10A5 5 0 0010 4z" />
              </svg>
              Driven av AI — 100 % transparent om det
            </div>
            <h1 className="font-display text-5xl lg:text-7xl font-bold text-navy-900 leading-[1.05] mb-6">
              Bygg ditt företag.
              <br />
              <span className="text-emerald-600">Med AI som backar upp.</span>
            </h1>
            <p className="text-xl text-ink-700 mb-10 leading-relaxed max-w-2xl">
              Affärsboost är en månadsprenumeration med AI-rådgivaren Linnéa, startbidragsbevakning, avtalsmallar och AI-driven marknadsföring — oavsett om du precis startat eller leder ett etablerat bolag.
            </p>
            <div className="bg-white border border-ink-100 rounded-2xl p-6 lg:p-8 shadow-sm max-w-xl">
              <h3 className="font-display font-bold text-lg text-navy-900 mb-2">Få besked vid lansering</h3>
              <p className="text-ink-700 text-sm mb-4">
                Lämna din mail — du får vår gratisguide{" "}
                <strong>"Momsavdrag 2026 — vad du faktiskt får göra"</strong> direkt.
              </p>
              <WaitlistForm />
            </div>
          </div>
        </div>
      </section>

      {/* Linnéa-sektion */}
      <section id="linnea" className="py-20 bg-navy-900">
        <div className="max-w-content mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/50 text-emerald-400 text-xs font-semibold mb-6">
                AI-rådgivare · Alltid ärlig om att hon är AI
              </div>
              <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                Träffa Linnéa.
                <br />
                <span className="text-emerald-400">Din AI-rådgivare.</span>
              </h2>
              <p className="text-navy-200 text-lg leading-relaxed mb-6">
                Linnéa är en AI-assistent tränad på svenska affärsregler, skatteregler och bidrag. Hon svarar på dina frågor direkt — om startbidrag, momsfrågor, avtalsmallar eller prissättning.
              </p>
              <ul className="space-y-3 text-navy-200 mb-8">
                <li className="flex gap-3 items-start">
                  <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>
                  Vet du att det finns startbidrag du inte sökt? Linnéa bevakar åt dig.
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>
                  Fråga om moms, avdrag och skattefrågor — och få svar på svenska.
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>
                  Hon är alltid öppen med att hon är en AI. Inga dolda agendor.
                </li>
              </ul>
              <div className="flex items-center gap-4 flex-wrap">
                <a
                  href="/community"
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  Starta ett samtal →
                </a>
                <LinnéaStatusBadge className="text-white" />
              </div>
              <div className="mt-6 flex gap-6 text-sm text-navy-300">
                <span>Mån–fre <strong className="text-white">08–12</strong></span>
                <span>Mån–fre <strong className="text-white">13–17</strong></span>
                <span className="text-navy-500">Lör–sön stängd</span>
              </div>
            </div>

            {/* Linnéa + chat-preview */}
            <div className="relative">
              <div className="bg-navy-800 rounded-2xl p-6">
                {/* Avatar */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-4 ring-emerald-500/30">
                    <img
                      src="/avatars/linnea-r1-auburn-waves.jpg"
                      alt="Linnéa AI-rådgivare"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-display font-bold text-white">Linnéa</p>
                    <LinnéaStatusBadge />
                  </div>
                </div>

                {/* Exempelkonversation */}
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <div className="bg-emerald-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[75%]">
                      Kan jag dra av hemmakontoret på min enskilda firma?
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                      <img src="/avatars/linnea-r1-auburn-waves.jpg" alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-navy-700 text-navy-100 text-sm px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-[80%]">
                      Ja — om du har ett rum du använder uteslutande för jobbet. Du drar av en skälig andel av hyra, el och internet. Schablon är 2 000 kr/år, men verklig kostnad ger ofta mer.
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-emerald-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[75%]">
                      Är du en riktig person?
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-0.5">
                      <img src="/avatars/linnea-r1-auburn-waves.jpg" alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-navy-700 text-navy-100 text-sm px-4 py-2.5 rounded-2xl rounded-tl-sm max-w-[80%]">
                      Nej — jag är en AI-assistent. Jag är alltid transparent med det. Men svaren om skatt och bidrag är faktabaserade!
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-navy-700 pt-4">
                  <p className="text-navy-400 text-xs text-center">
                    AI-driven · Öppet dygnet runt · Svarar direkt under öppettider
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* För vem */}
      <section id="for-vem" className="py-20 bg-white">
        <div className="max-w-content mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-navy-900 mb-3">För vem?</h2>
            <p className="text-ink-700 text-lg">Samma plattform — innehållet anpassas efter var du befinner dig.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-navy-50 border border-navy-100 rounded-2xl p-8">
              <div className="inline-block px-3 py-1 rounded-full bg-white text-navy-700 text-xs font-semibold mb-4 uppercase tracking-wide">
                Nystartad företagare
              </div>
              <h3 className="font-display text-2xl font-bold text-navy-900 mb-4">Du som startar — eller precis startat</h3>
              <ul className="space-y-3 text-ink-700">
                <li className="flex gap-3"><Check /> Startbidrags-bevakning (ALMI, Tillväxtverket, EU)</li>
                <li className="flex gap-3"><Check /> Avtalsmallar — kundavtal, NDA, anställning</li>
                <li className="flex gap-3"><Check /> Bokföringstips för enskild firma och AB</li>
                <li className="flex gap-3"><Check /> AI-säljpitchgenerator</li>
                <li className="flex gap-3"><Check /> Mall för första kundofferten</li>
              </ul>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8">
              <div className="inline-block px-3 py-1 rounded-full bg-white text-emerald-700 text-xs font-semibold mb-4 uppercase tracking-wide">
                Etablerat bolag
              </div>
              <h3 className="font-display text-2xl font-bold text-navy-900 mb-4">Du som vill modernisera</h3>
              <ul className="space-y-3 text-ink-700">
                <li className="flex gap-3"><Check /> AI-strategi för marknadsföring 2026</li>
                <li className="flex gap-3"><Check /> Automatisera kundkommunikation</li>
                <li className="flex gap-3"><Check /> SEO-revision och annonsanalys</li>
                <li className="flex gap-3"><Check /> Konkurrentbevakning på autopilot</li>
                <li className="flex gap-3"><Check /> Effektivare email-marketing</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Vad du får */}
      <section id="vad-du-far" className="py-20 bg-navy-50">
        <div className="max-w-content mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-navy-900 mb-3">Vad du får varje månad</h2>
            <p className="text-ink-700 text-lg">Konkret nytta — inte fluffigt content.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Feature
              title="Veckonyhetsbrev"
              desc="Varannan vecka för nystartad, varannan för etablerade — alltid med konkreta actions."
            />
            <Feature
              title="Mall-bibliotek"
              desc="Avtal, säljpitcher, anställningsbrev, NDA. Klart att fylla i och skicka."
            />
            <Feature
              title="Linnéa — AI-coach"
              desc="Chatta med Linnéa: AI-driven rådgivare som vet allt om svenska skattefrågor, bidrag och tillväxt. Hon är alltid öppen med att hon är AI."
              highlight
            />
            <Feature
              title="Startbidrag-bevakning"
              desc="Automatisk notis när ALMI, Tillväxtverket eller EU öppnar nya stödmöjligheter."
            />
            <Feature
              title="Community"
              desc="Chatt med Linnéa och andra företagare, öppen 24/7. Linnéa är aktiv mån–fre 08–12 och 13–17."
            />
            <Feature
              title="Webbinarie-arkiv"
              desc="Livesändningar om skatt, AI-stack och tillväxt. Allt sparas så du kollar när du vill."
            />
          </div>
        </div>
      </section>

      {/* Pris */}
      <section id="pris" className="py-20 bg-white">
        <div className="max-w-content mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-navy-900 mb-3">En prislapp. Inget krångel.</h2>
            <p className="text-ink-700 text-lg">Direktbetalning. Säg upp när du vill.</p>
          </div>
          <div className="max-w-md mx-auto bg-white border-2 border-emerald-500 rounded-2xl p-8 shadow-lg">
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold mb-4 uppercase tracking-wide">
              Medlemskap
            </div>
            <div className="mb-6">
              <span className="font-display text-5xl font-bold text-navy-900">299 kr</span>
              <span className="text-ink-500 text-lg">/månad</span>
            </div>
            <p className="text-ink-700 mb-6">
              Allt innehåll, alla mallar, Linnéa AI-coachen och community-tillgång. Inga bindningstider.
            </p>
            <ul className="space-y-3 text-ink-700 mb-8">
              <li className="flex gap-3"><Check /> Veckonyhetsbrev (båda spår)</li>
              <li className="flex gap-3"><Check /> Hela mallbiblioteket</li>
              <li className="flex gap-3"><Check /> Linnéa AI-coach (obegränsat)</li>
              <li className="flex gap-3"><Check /> Startbidrags-bevakning</li>
              <li className="flex gap-3"><Check /> Community-tillgång</li>
              <li className="flex gap-3"><Check /> Säg upp när du vill</li>
            </ul>
            <a href="#" className="btn-primary w-full justify-center">
              Bli medlem — 299 kr/mån
            </a>
            <p className="text-ink-500 text-xs text-center mt-4">
              Faktureras månadsvis. Stripe + Swish + Klarna stöds.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="vanliga-fragor" className="py-20 bg-navy-50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-display text-4xl font-bold text-navy-900 mb-10 text-center">Vanliga frågor</h2>
          <div className="space-y-4">
            <Faq
              q="Är Linnéa en riktig person?"
              a="Nej — Linnéa är en AI-assistent. Vi är alltid transparenta med det. Hon är tränad på svenska affärsregler, skattefrågor och bidragsinformation och svarar direkt. Råd om komplexa juridiska tvister eller medicinsk rådgivning ger hon inte — men affärsfrågor hanterar hon bra."
            />
            <Faq
              q="Kan jag säga upp när jag vill?"
              a="Ja. Du betalar månadsvis och kan säga upp direkt — du har tillgång till nästa fakturadatum."
            />
            <Faq
              q="När svarar Linnéa?"
              a="Linnéa är aktiv mån–fre 08:00–12:00 och 13:00–17:00 (svensk tid). Utanför dessa tider sparas ditt meddelande och besvaras när hon är online igen. Communityt är öppet 24/7 — du kan alltid skriva."
            />
            <Faq
              q="Vad händer med min historik om jag säger upp?"
              a="Du kan ladda ner all din konversationshistorik och sparade mallar i 30 dagar efter att du sagt upp."
            />
            <Faq
              q="Är det moms på 299 kr?"
              a="Priset är inklusive moms 25 %. Företagsmedlemmar får en faktura i kvitto-format för avdrag."
            />
            <Faq
              q="Vem står bakom Affärsboost?"
              a="Searchboost AB — Sveriges AI-drivna SEO-byrå. Vi har arbetat med AI och digital marknadsföring sedan 2020."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-900 text-white py-12">
        <div className="max-w-content mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <span className="text-white font-display font-bold text-sm">A</span>
                </div>
                <span className="font-display font-bold text-xl">Affärsboost</span>
              </div>
              <p className="text-navy-100 text-sm leading-relaxed">
                AI-driven affärsutveckling för svenska företagare. En tjänst från Searchboost AB.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3 text-sm uppercase tracking-wide">Plattform</h4>
              <ul className="space-y-2 text-navy-100 text-sm">
                <li><a href="#linnea" className="hover:text-white">Träffa Linnéa</a></li>
                <li><a href="/community" className="hover:text-white">Community & AI-chat</a></li>
                <li><a href="#vad-du-far" className="hover:text-white">Vad du får</a></li>
                <li><a href="#pris" className="hover:text-white">Pris</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3 text-sm uppercase tracking-wide">Företag</h4>
              <ul className="space-y-2 text-navy-100 text-sm">
                <li><a href="https://searchboost.se" className="hover:text-white">Searchboost AB</a></li>
                <li><a href="mailto:hej@affarsboost.se" className="hover:text-white">hej@affarsboost.se</a></li>
                <li><a href="/integritet" className="hover:text-white">Integritetspolicy</a></li>
                <li><a href="/villkor" className="hover:text-white">Användarvillkor</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-navy-700 pt-6 text-navy-100 text-xs flex flex-wrap gap-4 justify-between">
            <span>© {new Date().getFullYear()} Searchboost AB · Affärsboost är ett varumärke som ägs och drivs av Searchboost AB.</span>
            <span className="text-navy-400">Linnéa är en AI-assistent — alltid transparent om det.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Check() {
  return (
    <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4L8.5 12l6.8-6.7a1 1 0 011.4 0z" clipRule="evenodd" />
    </svg>
  );
}

function Feature({ title, desc, highlight }: { title: string; desc: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-6 hover:border-emerald-300 transition-colors ${
      highlight
        ? "bg-navy-900 border-2 border-emerald-500 text-white"
        : "bg-white border border-ink-100"
    }`}>
      {highlight && (
        <span className="inline-block text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2">AI-driven</span>
      )}
      <h3 className={`font-display font-bold text-lg mb-2 ${highlight ? "text-white" : "text-navy-900"}`}>{title}</h3>
      <p className={`text-sm leading-relaxed ${highlight ? "text-navy-200" : "text-ink-700"}`}>{desc}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group bg-white border border-ink-100 rounded-xl p-5">
      <summary className="cursor-pointer flex items-center justify-between font-display font-semibold text-navy-900">
        {q}
        <svg className="w-5 h-5 text-ink-500 group-open:rotate-180 transition-transform flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.3 7.3a1 1 0 011.4 0L10 10.6l3.3-3.3a1 1 0 011.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4z" clipRule="evenodd" />
        </svg>
      </summary>
      <p className="mt-3 text-ink-700 text-sm leading-relaxed">{a}</p>
    </details>
  );
}
