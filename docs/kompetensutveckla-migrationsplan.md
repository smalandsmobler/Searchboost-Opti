# Migrationsplan: kompetensutveckla.se
## Kategoristruktur, Kunskapshubbar & Intern Länkning

**Kund:** Kompetensutveckla i Sundsvall AB
**Sajt:** kompetensutveckla.se
**System:** WordPress + EduAdmin
**Utfört av:** Searchboost OPTI
**Datum:** 2026-02-06

---

## 1. Sammanfattning

Kompetensutveckla.se har stark trafik och ett brett utbildningsutbud, men tre strukturella problem bromsar tillväxten:

1. **Kategoristrukturen är platt** — alla kurser ligger på toppnivå eller under inkonsistenta föräldrar (`/kurser-2/`, `/vara-tjanster/`, `/bam-utbildning/`). Google kan inte förstå hur sajten hänger ihop.
2. **PDFer och nedladdningsbart material indexeras inte** — checklistor, mallar och AFS-dokument som genererar trafik saknar landningssidor och är osynliga för Google.
3. **Intern länkning är manuell och ofullständig** — nuvarande plugin hanterar bara A/B-nyckelord för kurssidor. Kunskapsbanken länkas aldrig.

**Förväntat resultat efter migrering:**
- +1 800–3 000 organiska besökare/månad
- +20–40 extra kursbokningar/månad
- Lead-generering via PDF-nedladdning (e-postfångst)
- Eliminerad kannibalisering mellan kurs-URLs

---

## 2. Nuvarande URL-struktur (problem)

### 2.1 Kurssidor — inkonsekvent hierarki

| Nuvarande URL | Problem |
|---|---|
| `/bam-utbildning/` | Toppnivå — ingen förälderkategori |
| `/bam-utbildning/bam-webbutbildning/` | Underchild till BAM |
| `/bam-utbildning/bam-battre-arbetsmiljo-3-dagar/` | Underchild till BAM |
| `/bam-utbildning-online/` | Separat sida — kannibaliserar med ovan |
| `/kurser-2/bam-battre-arbetsmiljo-2-dagar/` | SAMMA kurs, ANNAN parent (`/kurser-2/`) |
| `/sam-systematiskt-arbetsmiljoarbete/` | Toppnivå, lång slug |
| `/sam-utbildning/` | ANNAN sida för samma ämne |
| `/skyddsombudsutbildning/` | Toppnivå |
| `/bas-p-och-bas-u/` | Toppnivå |
| `/bas-u-bas-p-utbildning-online/` | Separat online-sida — kannibaliserar |
| `/vara-arbetsmiljoutbildningar/` | Under `/vara-` |
| `/kurser-2/` | Slug med siffra — tyder på misslyckad migrering |

### 2.2 Kunskapsmaterial — djupt nästlat och duplicerat

| Nuvarande URL | Problem |
|---|---|
| `/vara-tjanster/arbetsmiljoarbete/rutiner/` | 3 nivåer ner, svårhittad |
| `/rutiner-checklistor-och-mallar/` | Duplicat på toppnivå |
| `/vara-tjanster/arbetsmiljoarbete/afs/` | 3 nivåer ner |
| `/vara-tjanster/arbetsmiljoarbete/kunskapsbanken/` | 4 nivåer ner |
| `/kursmaterial/` | Lösenordsskyddat, ej indexerat |

### 2.3 Kannibalisering (identifierade fall)

| Sökterm | Sida 1 | Sida 2 | Problem |
|---|---|---|---|
| "BAM utbildning" | `/bam-utbildning/` | `/kurser-2/bam-battre-arbetsmiljo-2-dagar/` | Två sidor konkurrerar |
| "BAM online" | `/bam-utbildning-online/` | `/bam-utbildning/bam-webbutbildning/` | Två sidor för samma sak |
| "BAS P utbildning" | `/bas-p-och-bas-u/` | `/bas-u-bas-p-utbildning-online/` | Online vs fysisk splittrade |
| "SAM utbildning" | `/sam-utbildning/` | `/sam-systematiskt-arbetsmiljoarbete/` | Två sidor, samma ämne |
| "checklistor arbetsmiljö" | `/rutiner-checklistor-och-mallar/` | `/vara-tjanster/arbetsmiljoarbete/rutiner/` | Duplicerat innehåll |

---

## 3. Ny kategoristruktur

### 3.1 Utbildningar (kurshub)

```
/utbildningar/                                    ← HUB-sida (alla kurser)
│
├── /utbildningar/arbetsmiljo/                    ← Kategori: Arbetsmiljö
│   ├── /utbildningar/arbetsmiljo/bam/            ← BAM (alla format: IRL/Online/Hybrid)
│   ├── /utbildningar/arbetsmiljo/sam/            ← SAM
│   └── /utbildningar/arbetsmiljo/skyddsombud/    ← Skyddsombudsutbildning
│
├── /utbildningar/sakerhet/                       ← Kategori: Säkerhet
│   ├── /utbildningar/sakerhet/bas-p-bas-u/       ← BAS P & BAS U (en sida)
│   ├── /utbildningar/sakerhet/sakra-lyft/        ← Säkra Lyft
│   └── /utbildningar/sakerhet/slutna-utrymmen/   ← Slutna Utrymmen
│
├── /utbildningar/elsakerhet/                     ← Kategori: Elsäkerhet
│   └── /utbildningar/elsakerhet/esa-instruerad/  ← ESA Instruerad Person
│
├── /utbildningar/vag-transport/                  ← Kategori: Väg & Transport
│   ├── /utbildningar/vag-transport/arbete-pa-vag-1/ ← APV 1.1–1.3
│   └── /utbildningar/vag-transport/arbete-pa-vag-2/ ← APV 2.2
│
└── /utbildningar/asbest/                         ← Kategori: Asbest
    └── /utbildningar/asbest/asbestutbildning/
```

**Format (IRL / Online / Hybrid) hanteras som:**
- Flikar/filter på varje kurssida (ej separata URLs)
- Metadata: `<meta name="format" content="online,irl">`
- Schema.org: `CourseInstance` med `courseMode: "Online"` / `"Blended"` / `"Onsite"`

### 3.2 Kunskapsbank (lead-hub)

```
/kunskapsbank/                                     ← HUB-sida
│
├── /kunskapsbank/checklistor/                     ← Alla checklistor
│   ├── /kunskapsbank/checklistor/riskbedomning/
│   ├── /kunskapsbank/checklistor/skyddsrond/
│   ├── /kunskapsbank/checklistor/brandskydd/
│   └── /kunskapsbank/checklistor/kemikaliehantering/
│
├── /kunskapsbank/mallar/                          ← Alla mallar
│   ├── /kunskapsbank/mallar/arbetsmiljoplan/
│   ├── /kunskapsbank/mallar/riskbedomning/
│   ├── /kunskapsbank/mallar/handlingsplan-sam/
│   └── /kunskapsbank/mallar/delegering-arbetsmiljo/
│
├── /kunskapsbank/foreskrifter/                    ← AFS-samling
│   ├── /kunskapsbank/foreskrifter/afs-2023-2/
│   ├── /kunskapsbank/foreskrifter/afs-2001-1/
│   └── /kunskapsbank/foreskrifter/nya-regler-2025/
│
└── /kunskapsbank/guider/                          ← Fördjupningsartiklar
    ├── /kunskapsbank/guider/bam-sa-lyckas-du/
    ├── /kunskapsbank/guider/systematiskt-arbetsmiljoarbete/
    └── /kunskapsbank/guider/afa-stod-utbildning/
```

**Varje kunskapssida följer mallen:**

```
[H1: Checklista för riskbedömning – Gratis PDF]
[Kort intro: 150 ord, sökordoptimerat]
[CTA: "Ladda ner gratis" → formulär: namn + e-post + företag]
[PDF-förhandsvisning (bild/iframe)]
[Relaterat innehåll: Länk till relevant kurs]
[FAQ-sektion med schema markup]
```

### 3.3 EduAdmin-konfiguration

Ändringarna i EduAdmin innan WordPress-migrering:

| EduAdmin-fält | Nuvarande | Nytt |
|---|---|---|
| Huvudkategori 1 | Webbutbildningar | Arbetsmiljö |
| Huvudkategori 2 | Fysiska utbildningar | Säkerhet |
| Huvudkategori 3 | (saknas) | Elsäkerhet |
| Huvudkategori 4 | (saknas) | Väg & Transport |
| Huvudkategori 5 | (saknas) | Asbest |
| Underkategorier | Per format | Per kurs |
| Attribut/Tagg | (saknas) | Format: IRL / Online / Hybrid |

**WordPress-pluginet** (EduAdmin Booking) konfigureras sedan med `[eduadmin-listview category="arbetsmiljo"]` etc.

---

## 4. 301 Redirect-lista

Alla gamla URLs redirectas permanent (301) till nya. **Implementeras via `.htaccess` eller Redirection-plugin.**

```apache
# ============================================
# KURSSIDOR
# ============================================

# BAM
Redirect 301 /bam-utbildning/ /utbildningar/arbetsmiljo/bam/
Redirect 301 /bam-utbildning-online/ /utbildningar/arbetsmiljo/bam/?format=online
Redirect 301 /bam-utbildning/bam-webbutbildning/ /utbildningar/arbetsmiljo/bam/?format=online
Redirect 301 /bam-utbildning/bam-battre-arbetsmiljo-3-dagar/ /utbildningar/arbetsmiljo/bam/
Redirect 301 /kurser-2/bam-battre-arbetsmiljo-2-dagar/ /utbildningar/arbetsmiljo/bam/
Redirect 301 /steg-for-steg-bam-utbildning-sa-lyckas-du/ /kunskapsbank/guider/bam-sa-lyckas-du/

# SAM
Redirect 301 /sam-utbildning/ /utbildningar/arbetsmiljo/sam/
Redirect 301 /sam-systematiskt-arbetsmiljoarbete/ /utbildningar/arbetsmiljo/sam/

# Skyddsombud
Redirect 301 /skyddsombudsutbildning/ /utbildningar/arbetsmiljo/skyddsombud/

# BAS P / BAS U
Redirect 301 /bas-p-och-bas-u/ /utbildningar/sakerhet/bas-p-bas-u/
Redirect 301 /bas-u-bas-p-utbildning-online/ /utbildningar/sakerhet/bas-p-bas-u/?format=online

# Säkerhet
Redirect 301 /webbutbildningar/webbutbildningar-sakerhet/sakra-lyft/ /utbildningar/sakerhet/sakra-lyft/
Redirect 301 /webbutbildningar/webbutbildningar-sakerhet/slutna-utrymmen/ /utbildningar/sakerhet/slutna-utrymmen/
Redirect 301 /webbutbildningar/slutna-utrymmen/ /utbildningar/sakerhet/slutna-utrymmen/

# Elsäkerhet
Redirect 301 /webbutbildningar/webbutbildningar-elsakerhet/esa-instruerad-person/ /utbildningar/elsakerhet/esa-instruerad/
Redirect 301 /webbutbildningar/esa-instruerad-person/ /utbildningar/elsakerhet/esa-instruerad/

# Väg & Transport
Redirect 301 /fysiska-utbildningar/earbete-pa-vag-webbutbildning/ /utbildningar/vag-transport/arbete-pa-vag-1/
Redirect 301 /webbutbildningar/webbutbildningar-vag-och-transport/arbete-pa-vag-2-2/ /utbildningar/vag-transport/arbete-pa-vag-2/

# Kategorisamlingar
Redirect 301 /kurser-2/ /utbildningar/
Redirect 301 /webbutbildningar/ /utbildningar/
Redirect 301 /webbutbildningar/webbutbildningar-sakerhet/ /utbildningar/sakerhet/
Redirect 301 /fysiska-utbildningar/ /utbildningar/
Redirect 301 /vara-arbetsmiljoutbildningar/ /utbildningar/arbetsmiljo/

# ============================================
# KUNSKAPSMATERIAL
# ============================================
Redirect 301 /rutiner-checklistor-och-mallar/ /kunskapsbank/
Redirect 301 /vara-tjanster/arbetsmiljoarbete/rutiner/ /kunskapsbank/checklistor/
Redirect 301 /vara-tjanster/arbetsmiljoarbete/afs/ /kunskapsbank/foreskrifter/
Redirect 301 /vara-tjanster/arbetsmiljoarbete/kunskapsbanken/ /kunskapsbank/guider/
Redirect 301 /vara-tjanster/arbetsmiljoarbete/kunskapsbanken/kompetensutveckling/ /kunskapsbank/guider/
```

---

## 5. Uppdaterat Internal Linker Plugin

Det befintliga pluginet har följande brister:
- Bara A/B-nyckelord, inga C-nyckelord (long tail)
- Kunskapsbanken länkas aldrig
- Regex-buggar i `create_safe_pattern()`
- Kannibalisering: BAS P och BAS U pekar till olika sidor

### 5.1 Ny nyckelordskarta (A/B/C)

**A-Nyckelord (topprioriteter):**

| Nyckelord | Ny mål-URL | Sökvolym/mån |
|---|---|---|
| bam utbildning | /utbildningar/arbetsmiljo/bam/ | ~2 400 |
| arbetsmiljöutbildning | /utbildningar/arbetsmiljo/ | ~1 800 |
| skyddsombud utbildning | /utbildningar/arbetsmiljo/skyddsombud/ | ~1 200 |
| bas p utbildning | /utbildningar/sakerhet/bas-p-bas-u/ | ~800 |
| bas u utbildning | /utbildningar/sakerhet/bas-p-bas-u/ | ~600 |
| sam utbildning | /utbildningar/arbetsmiljo/sam/ | ~600 |

**B-Nyckelord (mellanklass):**

| Nyckelord | Ny mål-URL | Sökvolym/mån |
|---|---|---|
| bam utbildning online | /utbildningar/arbetsmiljo/bam/?format=online | ~500 |
| säkra lyft utbildning | /utbildningar/sakerhet/sakra-lyft/ | ~400 |
| arbete på väg utbildning | /utbildningar/vag-transport/arbete-pa-vag-1/ | ~350 |
| slutna utrymmen utbildning | /utbildningar/sakerhet/slutna-utrymmen/ | ~200 |
| esa utbildning | /utbildningar/elsakerhet/esa-instruerad/ | ~150 |

**C-Nyckelord (long tail → Kunskapsbank):**

| Nyckelord | Ny mål-URL | Sökvolym/mån |
|---|---|---|
| riskbedömning mall | /kunskapsbank/mallar/riskbedomning/ | ~1 500 |
| skyddsrond checklista | /kunskapsbank/checklistor/skyddsrond/ | ~900 |
| arbetsmiljö checklista | /kunskapsbank/checklistor/ | ~1 200 |
| afs föreskrifter | /kunskapsbank/foreskrifter/ | ~800 |
| arbetsmiljöplan mall | /kunskapsbank/mallar/arbetsmiljoplan/ | ~600 |
| afa stöd utbildning | /kunskapsbank/guider/afa-stod-utbildning/ | ~400 |
| systematiskt arbetsmiljöarbete | /kunskapsbank/guider/systematiskt-arbetsmiljoarbete/ | ~350 |

### 5.2 Cross-hub-länkning

Pluginet ska även länka **mellan hubbar**:

```
Kurssida: /utbildningar/arbetsmiljo/bam/
  → "Ladda ner vår checklista för riskbedömning"
  → /kunskapsbank/checklistor/riskbedomning/

Kunskapssida: /kunskapsbank/checklistor/riskbedomning/
  → "Vill du fördjupa dig? Se vår BAM-utbildning"
  → /utbildningar/arbetsmiljo/bam/
```

Detta skapar ett **kluster** där Google ser att sajten är auktoritativ inom arbetsmiljö.

---

## 6. Schema Markup

### 6.1 Kurssidor (Course + CourseInstance)

```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "BAM – Bättre Arbetsmiljö",
  "description": "Grundläggande arbetsmiljöutbildning för chefer, arbetsledare och skyddsombud.",
  "provider": {
    "@type": "Organization",
    "name": "Kompetensutveckla",
    "url": "https://kompetensutveckla.se"
  },
  "hasCourseInstance": [
    {
      "@type": "CourseInstance",
      "courseMode": "Onsite",
      "courseWorkload": "P2D",
      "offers": {
        "@type": "Offer",
        "price": "9500",
        "priceCurrency": "SEK"
      }
    },
    {
      "@type": "CourseInstance",
      "courseMode": "Online",
      "courseWorkload": "P3D",
      "offers": {
        "@type": "Offer",
        "price": "7900",
        "priceCurrency": "SEK"
      }
    }
  ]
}
```

### 6.2 Kunskapssidor (FAQPage + DownloadAction)

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Checklista för riskbedömning – Gratis PDF",
  "description": "Ladda ner vår kostnadsfria checklista för riskbedömning...",
  "potentialAction": {
    "@type": "DownloadAction",
    "object": {
      "@type": "DigitalDocument",
      "name": "Riskbedömning checklista.pdf",
      "encodingFormat": "application/pdf"
    }
  }
}
```

### 6.3 Breadcrumbs (BreadcrumbList)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://kompetensutveckla.se/" },
    { "@type": "ListItem", "position": 2, "name": "Utbildningar", "item": "https://kompetensutveckla.se/utbildningar/" },
    { "@type": "ListItem", "position": 3, "name": "Arbetsmiljö", "item": "https://kompetensutveckla.se/utbildningar/arbetsmiljo/" },
    { "@type": "ListItem", "position": 4, "name": "BAM-utbildning" }
  ]
}
```

---

## 7. Lead-fångst: PDF-nedladdning

### 7.1 Flöde

```
Besökare söker "riskbedömning mall"
  → Google visar /kunskapsbank/mallar/riskbedomning/
    → Besökaren ser förhandsvisning av PDF
    → Klickar "Ladda ner gratis"
    → Formulär: Namn, E-post, Företag, Antal anställda
    → PDF skickas till e-post
    → Automatiskt mejl dag 3: "Vill ni ha utbildning i riskbedömning?"
    → Länk till /utbildningar/arbetsmiljo/bam/
```

### 7.2 Uppskattad lead-generering

| Kunskapssida | Besökare/mån | Konvertering (formulär) | Leads/mån |
|---|---|---|---|
| Riskbedömning mall | 400–600 | 15–25% | 60–150 |
| Skyddsrond checklista | 200–400 | 15–25% | 30–100 |
| Arbetsmiljöplan mall | 150–300 | 15–25% | 22–75 |
| AFS-föreskrifter | 200–400 | 10–15% | 20–60 |
| **Totalt** | | | **130–385 leads/mån** |

Med 5% konvertering lead → kursbokning: **6–19 extra bokningar/mån** enbart från kunskapsbanken.

---

## 8. Tidsplan

| Vecka | Steg | Ansvarig |
|---|---|---|
| **V1** | SEO-audit, nyckelordsanalys, kartlägga alla kurser | Searchboost |
| **V1** | Skapa ny kategoristruktur i EduAdmin (staging) | Searchboost + kund (API-nyckel) |
| **V2** | Bygga kunskapsbank-sidor (landningssidor för PDFer) | Searchboost |
| **V2** | Konfigurera 301-redirects (staging) | Searchboost |
| **V2** | Uppdatera internal linker-plugin (ny nyckelordskarta) | Searchboost |
| **V3** | Schema markup (Course, FAQ, Breadcrumbs) | Searchboost |
| **V3** | Leadfångst-formulär + e-postautomation | Searchboost + kund (e-postverktyg) |
| **V3** | QA: testa alla redirects, kursbokningar, EduAdmin-synk | Searchboost |
| **V4** | Kund godkänner staging | Kund |
| **V4** | Push till produktion | Searchboost |
| **V5–8** | Monitorering: Search Console, rankings, leads | Searchboost |

---

## 9. Investering & ROI

### Kostnad

| Tjänst | Pris (exkl. moms) |
|---|---|
| Kategoristruktur-omläggning (EduAdmin + WP) | 3 500 kr |
| URL-struktur + 301-redirects | 2 500 kr |
| Taxonomi, taggar & breadcrumbs | 2 500 kr |
| Kunskapsbank setup (10 landningssidor) | 3 000 kr |
| Intern länkning (uppdaterat plugin) | 1 500 kr |
| Lead-fångst formulär + automation | 2 000 kr |
| **Totalt** | **15 000 kr exkl. moms** |

### Förväntat resultat (konservativt, inom 3–6 månader)

| Mätvärde | Nuvarande | Efter migrering |
|---|---|---|
| Organisk trafik | Baslinjen | +1 800–3 000 besök/mån |
| Indexerade kunskapssidor | ~0 | 10–20 sidor |
| Leads via PDF-nedladdning | 0 | 130–385/mån |
| Extra kursbokningar | 0 | +20–40/mån |
| Extra intäkt/mån | 0 | 100 000–200 000 kr |
| **ROI** | | **15 000 kr betald inom första veckan** |

---

## 10. Vad vi behöver från er

| Nr | Vad | Varför |
|---|---|---|
| 1 | **EduAdmin API-nyckel** | Strukturera om kategorier |
| 2 | **WordPress admin-access (staging)** | Göra alla ändringar säkert |
| 3 | **Lista på alla aktiva kurser** | Mappa till nya kategorier |
| 4 | **Befintliga PDFer/checklistor/mallar** | Skapa landningssidor |
| 5 | **E-postverktyg** (Mailchimp/ActiveCampaign/etc.) | Lead-automation |
| 6 | **Godkännande att skapa staging-miljö** | Noll risk för live-sajten |

---

*Har ni frågor? Kontakta oss på [info@searchboost.se](mailto:info@searchboost.se)*

*Dokument genererat av Searchboost OPTI*
