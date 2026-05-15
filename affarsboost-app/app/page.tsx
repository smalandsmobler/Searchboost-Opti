import WaitlistForm from "@/components/WaitlistForm";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Trust bar */}
      <div className="bg-navy-900 text-white text-xs sm:text-sm py-2">
        <div className="max-w-content mx-auto px-6 flex items-center justify-center gap-2 text-center">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          En tjänst från <a href="https://searchboost.se" className="underline hover:text-emerald-100">Searchboost AB</a>
          <span className="text-ink-300">·</span>
          <span>Sveriges första AI-driven SEO-byrå</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="border-b border-ink-100 bg-white">
        <div className="max-w-content mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-navy-700 flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">A</span>
            </div>
            <span className="font-display font-bold text-xl text-navy-900">Affärsboost</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-700">
            <a href="#vad-du-far" className="hover:text-navy-700">Vad du får</a>
            <a href="#for-vem" className="hover:text-navy-700">För vem</a>
            <a href="#pris" className="hover:text-navy-700">Pris</a>
            <a href="#vanliga-fragor" className="hover:text-navy-700">FAQ</a>
          </div>
          <a href="#pris" className="btn-primary text-sm">Bli medlem</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-navy-50">
        <div className="max-w-content mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Lanseras snart · Bli först att veta
            </div>
            <h1 className="font-display text-5xl lg:text-7xl font-bold text-navy-900 leading-[1.05] mb-6">
              Bygg ditt företag.
              <br />
              <span className="text-emerald-600">Eller ta nästa steg.</span>
            </h1>
            <p className="text-xl text-ink-700 mb-10 leading-relaxed max-w-2xl">
              Affärsboost är en månadsprenumeration som ger dig allt från startbidrag och avtalsmallar till AI-driven marknadsföring — oavsett om du precis startat eller leder ett etablerat bolag.
            </p>
            <div className="bg-white border border-ink-100 rounded-2xl p-6 lg:p-8 shadow-sm max-w-xl">
              <h3 className="font-display font-bold text-lg text-navy-900 mb-2">Få besked vid lansering</h3>
              <p className="text-ink-700 text-sm mb-4">Lämna din mail så hör vi av oss när det är dags — och du får vår gratisguide <strong>"Momsavdrag 2026 — vad du faktiskt får göra"</strong> direkt.</p>
              <WaitlistForm />
            </div>
          </div>
        </div>
      </section>

      {/* För vem */}
      <section id="for-vem" className="py-20 bg-white">
        <div className="max-w-content mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-navy-900 mb-3">För vem?</h2>
            <p className="text-ink-700 text-lg">Samma plattform — två vägar. Innehållet anpassas efter var du befinner dig.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Nystartad */}
            <div className="bg-navy-50 border border-navy-100 rounded-2xl p-8">
              <div className="inline-block px-3 py-1 rounded-full bg-white text-navy-700 text-xs font-semibold mb-4 uppercase tracking-wide">Nystartad företagare</div>
              <h3 className="font-display text-2xl font-bold text-navy-900 mb-4">Du som startar — eller precis startat</h3>
              <ul className="space-y-3 text-ink-700">
                <li className="flex gap-3"><Check /> Startbidrags-bevakning (ALMI, Tillväxtverket, EU)</li>
                <li className="flex gap-3"><Check /> Avtalsmallar — kundavtal, NDA, anställning</li>
                <li className="flex gap-3"><Check /> Bokföringstips för enskild firma och AB</li>
                <li className="flex gap-3"><Check /> AI-säljpitchgenerator</li>
                <li className="flex gap-3"><Check /> Mall för första kundofferten</li>
              </ul>
            </div>

            {/* Etablerad */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8">
              <div className="inline-block px-3 py-1 rounded-full bg-white text-emerald-700 text-xs font-semibold mb-4 uppercase tracking-wide">Etablerat bolag</div>
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
              desc="Varannan vecka guide för nystartad, varannan för etablerade — alltid med konkreta actions."
            />
            <Feature
              title="Mall-bibliotek"
              desc="Avtal, säljpitcher, anställningsbrev, NDA. Klart att fylla i och skicka."
            />
            <Feature
              title="AI-coach"
              desc="Chatta med Claude-baserad AI som vet allt om svenska företagsregler, skatt och tillväxt."
            />
            <Feature
              title="Startbidrag-bevakning"
              desc="Automatisk push när ALMI, Tillväxtverket eller EU öppnar nya stödmöjligheter."
            />
            <Feature
              title="Community"
              desc="Slack med andra företagare. Frågor besvaras av medlemmar och Affärsboost-teamet."
            />
            <Feature
              title="Webbinarie-arkiv"
              desc="Konkreta livesändningar om skatt, AI-stack och tillväxt. Allt sparas så du kan kolla när du vill."
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
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold mb-4 uppercase tracking-wide">Medlemskap</div>
            <div className="mb-6">
              <span className="font-display text-5xl font-bold text-navy-900">299 kr</span>
              <span className="text-ink-500 text-lg">/månad</span>
            </div>
            <p className="text-ink-700 mb-6">Allt innehåll, alla mallar, AI-coachen och community-tillgång. Inga bindningstider.</p>
            <ul className="space-y-3 text-ink-700 mb-8">
              <li className="flex gap-3"><Check /> Veckonyhetsbrev (båda spår)</li>
              <li className="flex gap-3"><Check /> Hela mallbiblioteket</li>
              <li className="flex gap-3"><Check /> AI-coach (50 frågor/mån)</li>
              <li className="flex gap-3"><Check /> Startbidrags-bevakning</li>
              <li className="flex gap-3"><Check /> Community-tillgång</li>
              <li className="flex gap-3"><Check /> Säg upp när du vill</li>
            </ul>
            <a href="#" className="btn-primary w-full justify-center">Bli medlem — 299 kr/mån</a>
            <p className="text-ink-500 text-xs text-center mt-4">Faktureras månadsvis. Stripe + Swish + Klarna stöds.</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="vanliga-fragor" className="py-20 bg-navy-50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-display text-4xl font-bold text-navy-900 mb-10 text-center">Vanliga frågor</h2>
          <div className="space-y-4">
            <Faq q="Kan jag säga upp när jag vill?" a="Ja. Du betalar månadsvis och kan säga upp direkt — du har tillgång till nästa fakturadatum." />
            <Faq q="Vad händer med min AI-chat-historik om jag säger upp?" a="Du kan ladda ner all din konversationshistorik och dina sparade mallar i 30 dagar efter att du sagt upp." />
            <Faq q="Är det moms på 299 kr?" a="Priset är inklusive moms 25%. Företagsmedlemmar får en faktura i kvitto-format för avdrag." />
            <Faq q="Vem står bakom Affärsboost?" a="Searchboost AB — Sveriges första AI-driven SEO-byrå. Vi har över 50 företagskunder i Sverige." />
            <Faq q="Skiljer sig innehållet om jag är solo eller har 20 anställda?" a="Ja. Veckonyhetsbrevet växlar mellan 'nystartad'-spår och 'etablerad'-spår. Du väljer själv vilket spår som intresserar dig — eller kollar bägge." />
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
                En tjänst från Searchboost AB. AI-driven affärsutveckling för svenska företagare.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3 text-sm uppercase tracking-wide">Plattform</h4>
              <ul className="space-y-2 text-navy-100 text-sm">
                <li><a href="#vad-du-far" className="hover:text-white">Vad du får</a></li>
                <li><a href="#pris" className="hover:text-white">Pris</a></li>
                <li><a href="#vanliga-fragor" className="hover:text-white">FAQ</a></li>
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
          <div className="border-t border-navy-700 pt-6 text-navy-100 text-xs">
            © {new Date().getFullYear()} Searchboost AB · Affärsboost är ett varumärke som ägs och drivs av Searchboost AB.
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

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-white border border-ink-100 rounded-xl p-6 hover:border-emerald-300 transition-colors">
      <h3 className="font-display font-bold text-lg text-navy-900 mb-2">{title}</h3>
      <p className="text-ink-700 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group bg-white border border-ink-100 rounded-xl p-5">
      <summary className="cursor-pointer flex items-center justify-between font-display font-semibold text-navy-900">
        {q}
        <svg className="w-5 h-5 text-ink-500 group-open:rotate-180 transition-transform" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.3 7.3a1 1 0 011.4 0L10 10.6l3.3-3.3a1 1 0 011.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4z" clipRule="evenodd" />
        </svg>
      </summary>
      <p className="mt-3 text-ink-700 text-sm leading-relaxed">{a}</p>
    </details>
  );
}
