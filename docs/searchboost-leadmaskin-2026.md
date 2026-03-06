# Searchboost Leadmaskin 2026

**Mål:** Massproducera kvalificerade SEO-leads till Searchboost
**Princip:** Varje kanal jobbar 24/7, automatiserat, med minimal manuell insats
**Budget:** Nära noll — vi bygger med det vi redan har

---

## Arkitektur — 6 motorer som kör parallellt

```
                    ┌──────────────────────────┐
                    │   SEARCHBOOST.NU          │
                    │   (Lead-hubb)             │
                    └──────────┬───────────────┘
                               │
        ┌──────────┬───────────┼───────────┬──────────┬──────────┐
        ▼          ▼           ▼           ▼          ▼          ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ ┌────────┐ ┌────────┐
   │ MOTOR 1 │ │ MOTOR 2 │ │ MOTOR 3 │ │MOTOR 4 │ │MOTOR 5 │ │MOTOR 6 │
   │ Gratis  │ │ pSEO    │ │ Cold    │ │Freelance│ │Forum   │ │Referral│
   │ Audit   │ │ 290+    │ │ Outreach│ │Robotar │ │Agenter │ │Maskin  │
   │ Widget  │ │ sidor   │ │ E-post  │ │Fiverr/ │ │Reddit/ │ │Kund→   │
   │         │ │         │ │ +LinkedIn│ │Upwork  │ │Forum   │ │Kund    │
   └────┬────┘ └────┬────┘ └────┬────┘ └───┬────┘ └───┬────┘ └───┬────┘
        │          │           │           │          │          │
        └──────────┴───────────┴───────────┴──────────┴──────────┘
                               │
                    ┌──────────▼───────────┐
                    │   PIPELINE           │
                    │   Dashboard → Trello │
                    │   → Offert → Kund    │
                    └──────────────────────┘
```

---

## MOTOR 1: Gratis SEO-audit Widget (24/7 leadgen)

### Vad
En widget inbäddad på searchboost.se som låter besökare köra en gratis SEO-analys av sin sajt. De anger URL + e-post → får rapport → vi får en kvalificerad lead.

### Hur
1. **Bygga själva** med vår befintliga audit-kod (`/api/audit` endpoint + Claude AI)
2. Formulär: URL + e-post + företagsnamn + telefon (valfritt)
3. Claude analyserar sajten → genererar PDF-rapport med:
   - SEO-poäng (0-100)
   - 5 viktigaste problemen
   - Jämförelse med branschsnitt
   - "Vill du att vi fixar det? Boka gratis konsultation"
4. Rapport mejlas automatiskt via SES
5. Lead sparas i BigQuery + Trello (Analys-listan)

### Kostnad: 0 kr
Vi har redan all infrastruktur. Audit-endpointen finns. Claude API kostar ~$0.01 per audit.

### Förväntad volym: 5-20 leads/vecka
(Baserat på trafik till searchboost.se + social media-promotering)

### Filer att skapa/ändra
- `searchboost.se`: Ny landningssida "Gratis SEO-analys"
- `mcp-server-code/index.js`: Ny endpoint `POST /api/public-audit` (utan API-nyckel, rate-limited)
- `mcp-server-code/audit-report-generator.js`: PDF-rapport med Searchboost-branding

---

## MOTOR 2: Programmatisk SEO — 290+ landningssidor

### Vad
Automatiskt genererade SEO-optimerade sidor på searchboost.se som rankar på lokala + branschspecifika söktermer.

### Sidmönster

**Lokala sidor (290 st):**
```
/seo-byra-stockholm
/seo-byra-goteborg
/seo-byra-malmo
/seo-byra-linkoping
/seo-byra-vaxjo
... (alla 290 tätorter med 10 000+ invånare)
```

**Branschsidor (50+ st):**
```
/seo-for-restauranger
/seo-for-ehandel
/seo-for-tandlakare
/seo-for-advokatbyraer
/seo-for-byggforetag
/seo-for-utbildningsforetag
/seo-for-redovisningsbyraer
...
```

**Kombosidor (hög-intent, 200+ st):**
```
/seo-byra-stockholm-ehandel
/seo-byra-goteborg-restaurang
/hemsida-foretag-vaxjo
/google-ads-malmo
/wordpress-utvecklare-linkoping
...
```

### Mall per sida
Varje sida följer samma konverteringsoptimerade mall:

```
H1: SEO-byrå i [Stad] — Fler kunder via Google
H2: Så hjälper vi företag i [Stad]
   → 3 bullet points med lokal vinkel
H2: Vanliga SEO-problem för företag i [Stad]
   → 4-5 problem med lösningar
H2: Våra resultat
   → Case study-siffror (anonymiserade kunddata)
H2: Priser
   → 3 paket (Basic 5000, Standard 8000, Premium 12000)
CTA: Gratis SEO-analys [audit-widget inbäddad]
H2: Vanliga frågor om SEO i [Stad]
   → 5-6 FAQ med schema markup
```

### Unik data per sida
- Stad: befolkning, antal företag, lokal konkurrens
- Bransch: specifika sökord, säsongsmönster, typiska problem
- Case studies: rotera bland anonymiserade kundresultat

### Teknisk implementation
1. CSV med alla städer + branschdata
2. Claude genererar unika texter per sida (inte copy-paste)
3. WordPress custom post type "Landningssida" med ACF-fält
4. Schema markup: LocalBusiness + FAQPage per sida
5. Intern länkning: stad → bransch → kombosida

### Kostnad: ~500 kr (Claude API för textgenerering)

### Förväntad volym: 50-200 organiska besök/dag inom 3-6 månader
Söktermerna har låg konkurrens ("seo byrå vaxjo" = enkel att ranka på)

---

## MOTOR 3: Automatiserad Cold Outreach

### Vad
AI-driven prospektering + personaliserad cold e-post till företag som BEHÖVER SEO.

### Steg 1: Hitta prospects automatiskt
```
Daglig scan:
1. Crawla allabolag.se / proff.se — nyregistrerade företag i Sverige
2. Kolla om de har hemsida
3. Om ja → kör snabb SEO-scan (laddtid, meta, mobil, https)
4. Om dålig SEO → lägg i outreach-kö
```

### Steg 2: Personaliserad e-post via Claude
```
Ämne: {Företagsnamn} — 3 saker som kostar er kunder på Google

Hej {Förnamn},

Jag kollade {företag}.se och hittade tre saker som gör att
ni tappar synlighet på Google:

1. {Specifikt problem 1 — t.ex. "Saknar meta-beskrivningar på 12 sidor"}
2. {Specifikt problem 2 — t.ex. "Laddtid 4.2 sekunder (Google vill under 2.5)"}
3. {Specifikt problem 3 — t.ex. "Inte mobiloptimerad — 60% av sök sker på mobil"}

Jag har gjort en kort analys — vill ni att jag skickar den?

/Mikael, Searchboost
```

### Steg 3: Follow-up-sekvens (3 mejl)
- Dag 0: Initialt mejl (ovan)
- Dag 3: "Såg att ni inte öppnade — kort sammanfattning av analysen"
- Dag 7: "Sista påminnelse — erbjuder gratis 15min genomgång"

### Infrastruktur
- Sekundär domän för utskick (t.ex. searchboost-seo.se) — skyddar huvuddomänen
- AWS SES för sändning (redan konfigurerat)
- Uppvärmning: 10 mejl/dag → 50/dag → 100/dag över 3 veckor
- Opt-out-länk i varje mejl (GDPR)

### Kostnad: ~200 kr/mån (SES + domän)

### Förväntad volym: 5-15 svar/vecka vid 100 utskick/dag, 2-3% svarsfrekvens

---

## MOTOR 4: Freelancer-plattformsrobotar

### Vad
AI-agenter som automatiskt hittar och svarar på SEO/webb-uppdrag på Fiverr, Upwork och svenska plattformar.

### Plattformar
- **Fiverr** — Gigs med automatiserade leveranser (audit-rapporter)
- **Upwork** — Proposals genererade av Claude baserat på jobbets krav
- **Kundo.se** — Svensk freelanceplattform
- **Gigger.se** — Svensk gig-ekonomi
- **FreelanceGruppen.se** — Svenskt nätverk

### Fiverr-strategi
5 gigs som levererar automatiskt:

| Gig | Pris | Leverans |
|-----|------|----------|
| "I will do a complete SEO audit of your website" | $50 | Automatisk rapport via Claude |
| "I will fix your WordPress SEO issues" | $100 | Viktor utför, Claude QA:ar |
| "I will write SEO-optimized content for your site" | $75 | Claude genererar, Viktor publicerar |
| "I will set up Google Analytics + Search Console" | $50 | Viktor utför med SOP-checklista |
| "I will create a 3-month SEO action plan" | $150 | Claude genererar, Mikael granskar |

### Upwork-strategi
Claude-agent som:
1. Scannar nya jobb varje timme (RSS/API)
2. Filtrerar: SEO, WordPress, Google Ads, svenska kunder
3. Genererar personaliserat proposal med:
   - Referens till kundens specifika behov
   - 1-2 relevanta case studies
   - Konkret prisförslag
4. Mikael godkänner med ett klick → skickas

### Kostnad: 0 kr (plattformsavgifter dras på intäkt)

### Förväntad volym: 3-8 uppdrag/vecka

---

## MOTOR 5: Forumagenter (Brand Awareness + Backlinks)

### Vad
AI-agenter som postar hjälpsamt SEO-innehåll i relevanta forum och communities, med naturlig hänvisning till Searchboost.

### Kanaler
- **Reddit** — r/SEO, r/smallbusiness, r/webdev, r/sweden, r/foretag
- **Flashback** — Företagande, Teknik, Webbdesign
- **Facebook-grupper** — "Företagare i Sverige", "WordPress Sverige", "Småföretagare"
- **LinkedIn** — Mikaels profil, artiklar + kommentarer
- **Quora** — SEO-relaterade frågor med svensk vinkel

### Strategi
Inte spam. Genuint hjälpsamt innehåll:

```
Fråga: "Hur förbättrar jag min hemsida för Google?"

Svar: [400 ord med konkreta tips]
- Kolla laddtid med PageSpeed Insights
- Se till att ha unika title-taggar
- Skapa Google Business Profile
- ...
"Vi på Searchboost hjälper svenska småföretag med just det
här — kolla gärna vår gratisanalys på searchboost.se"
```

### Volym: 5-10 inlägg/dag (Claude genererar, Mikael/Viktor postar)

### Kostnad: 0 kr

### Förväntad volym: 2-5 leads/vecka (långsam start, bygger över tid)

---

## MOTOR 6: Referral-maskin (Kund → Kund)

### Vad
Befintliga kunder rekommenderar Searchboost till andra företag.

### Struktur

| Trigger | Belöning |
|---------|----------|
| Kund rekommenderar → lead bokar möte | 500 kr rabatt på nästa faktura |
| Kund rekommenderar → lead blir kund | 1 000 kr rabatt + 1 månads gratis optimering |
| "Berätta för 3 företagarvänner" | Gratis extra rapport (konkurensanalys) |

### Implementation
1. Automatiskt mejl efter 30 dagar som kund:
   "Hej {Namn}, hur går det? Känner du någon annan som skulle ha nytta av bättre synlighet på Google? Vi ger er 1000 kr rabatt om de blir kund."
2. Referral-länk: `searchboost.se/r/{kundid}` → spårar vem som rekommenderade
3. Automatisk uppföljning var 90:e dag

### Kostnad: 0 kr (rabatten finansierar sig själv via ny kund-MRR)

### Förväntad volym: 1-3 leads/mån per aktiv kund

---

## Sammanfattning — Alla motorer

| Motor | Kostnad/mån | Leads/vecka | Kvalitet | Tidslinje |
|-------|-------------|-------------|----------|-----------|
| 1. Audit Widget | ~10 kr (API) | 5-20 | Hög (vet att de har problem) | 1 vecka att bygga |
| 2. pSEO 290+ sidor | ~50 kr (API) | 5-15 | Medel-Hög (sökintent) | 2-4 veckor |
| 3. Cold Outreach | ~200 kr | 5-15 | Medel (kall) | 3-4 veckor (uppvärmning) |
| 4. Freelancer-robotar | 0 kr | 3-8 | Hög (köpredo) | 1 vecka |
| 5. Forumagenter | 0 kr | 2-5 | Låg-Medel (awareness) | Löpande |
| 6. Referral | 0 kr | 1-3/kund | Mycket hög | 1 dag |
| **TOTALT** | **~260 kr/mån** | **21-66** | | |

### Vid 2% konvertering (lead → kund):
- 40 leads/vecka × 4 veckor = 160 leads/mån
- 160 × 2% = **3-4 nya kunder/mån**
- Vid snitt 7 000 kr/mån MRR = **+21 000-28 000 kr MRR/mån**
- Om 6 mån: **126 000-168 000 kr MRR** (18-24 kunder)

### Vid 5% konvertering (realistiskt med bra follow-up):
- 160 × 5% = **8 nya kunder/mån**
- Om 6 mån: **336 000 kr MRR** (48 kunder)

---

## Prioriteringsordning — Vad vi bygger först

### Vecka 1: Motor 1 (Audit Widget) + Motor 6 (Referral)
- Bygga audit-widget på searchboost.se
- Skicka referral-mejl till alla 10 befintliga kunder
- Resultat: Leads börjar komma in dag 1

### Vecka 2: Motor 4 (Freelancer-robotar)
- Skapa 5 Fiverr-gigs
- Konfigurera Upwork-proposal-agent
- Resultat: Betalda uppdrag inom veckan

### Vecka 3-4: Motor 2 (pSEO-sidor)
- Generera 50 stad-sidor + 20 branschsidor
- Publicera på searchboost.se
- Resultat: Börjar ranka inom 2-4 veckor

### Vecka 4-5: Motor 3 (Cold Outreach)
- Köp sekundär domän, värm upp
- Bygga prospektering-pipeline
- Resultat: Första svar efter 4-5 veckor

### Löpande: Motor 5 (Forumagenter)
- Starta med 3 inlägg/dag
- Öka till 10/dag efter 2 veckor

---

## Teknikstack

| Komponent | Verktyg | Status |
|-----------|---------|--------|
| Audit-motor | Befintlig `/api/audit` + Claude | Finns |
| PDF-rapporter | Marp/Puppeteer | Finns |
| E-postutskick | AWS SES | Finns |
| Lead-databas | BigQuery `customer_pipeline` | Finns |
| Pipeline-hantering | Trello + Dashboard | Finns |
| Webbsajt | searchboost.se (WordPress) | Finns |
| AI-textgenerering | Claude API | Finns |
| Forum-poster | Claude + manuell publicering | Nytt |
| Fiverr/Upwork | Manuell setup + Claude proposals | Nytt |
| Cold outreach | SES + sekundär domän + Claude | Nytt |

**90% av infrastrukturen finns redan.** Vi behöver bara koppla ihop det.

---

## GDPR & Juridiskt

- Cold outreach: Använd "berättigat intresse" (B2B, relevant erbjudande)
- Opt-out i varje mejl
- Spara samtycke vid audit-widget (kryssruta)
- Referral: Kunden delar själv, vi kontaktar inte utan samtycke
- Forum: Ingen spam, genuint värde, tydlig avsändare
- Sekundär domän skyddar searchboost.se:s reputation

---

## Vad som behövs av Mikael

1. **Godkänn planen** — vilka motorer ska vi starta med?
2. **Searchboost.nu WordPress-access** — för att bygga landningssidor + audit-widget
3. **Fiverr/Upwork-konton** — skapa om de inte finns
4. **Sekundär domän** — köp t.ex. searchboost-seo.se på Loopia (~100 kr/år)
5. **Referral-mejltext** — godkänn innan vi skickar till befintliga kunder
