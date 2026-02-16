# Searchboost — Setup-guide för Viktor

> Senast uppdaterad: 2026-02-13

---

## Installera allt du behöver

Innan du börjar behöver du installera några verktyg på din Mac. Öppna Terminal (sök "Terminal" i Spotlight) och kör kommandona nedan.

### Homebrew

Homebrew är en pakethanterare för Mac som gör det enkelt att installera program.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Följ instruktionerna i terminalen. Det kan ta några minuter.

### Node.js

Node.js behövs för att köra scripts och Claude Code.

```bash
brew install node
```

Verifiera:

```bash
node -v
npm -v
```

Du ska se version 18 eller högre.

### Git

Git håller koll på alla ändringar i koden.

```bash
brew install git
```

Verifiera:

```bash
git --version
```

### Claude Code

Claude Code är ett AI-verktyg som hjälper dig skriva kod direkt i terminalen.

```bash
npm install -g @anthropic-ai/claude-code
```

---

## Anthropic API-nyckel

Claude Code behöver en API-nyckel för att fungera. Du skapar din egen:

1. Gå till https://console.anthropic.com
2. Klicka "Sign up" och registrera med din e-post
3. Gå till Settings → API Keys → Create Key
4. Namnge nyckeln (t.ex. "Viktor")
5. Kopiera nyckeln — den visas bara EN gång

Lägg till nyckeln permanent i terminalen:

```bash
echo 'export ANTHROPIC_API_KEY=din-nyckel-här' >> ~/.zshrc
source ~/.zshrc
```

Verifiera att det fungerar:

```bash
claude --version
```

---

## Klona repot

```bash
git clone https://github.com/smalandsmobler/Searchboost-Opti.git
cd Searchboost-Opti
cd mcp-server-code && npm install && cd ..
cd lambda-functions && npm install && cd ..
```

Nu är allt installerat. Starta Claude Code:

```bash
cd Searchboost-Opti
claude
```

Claude läser automatiskt CLAUDE.md-filen och förstår hela systemet.

---

## Bygga en kundsajt (WooCommerce)

Så här bygger du en WooCommerce-sajt åt en kund, baserat på hur vi byggde Smålands Kontorsmöbler.

### 1. Hosting och WordPress

Logga in på kundens hosting (Loopia, one.com, etc.) och installera WordPress. Om kunden redan har en sajt, skapa en subdomän först, till exempel `ny.kunddoman.se`.

Inställningar i WordPress:
- Tema: GeneratePress (gratis, snabbt)
- Permalink: Inställningar → Permalänkar → "Inläggsnamn"
- Språk: Inställningar → Allmänt → Svenska

### 2. Plugins

Installera via WP Admin → Tillägg → Lägg till nytt:

- **WooCommerce** — e-handelsfunktionalitet
- **Rank Math SEO** — sökmotoroptimering
- **WP Fastest Cache** — snabbare sidladdning
- **Smush** — bildoptimering

### 3. WooCommerce-inställningar

- Valuta: SEK (svenska kronor)
- Land: Sverige
- Fraktzoner: Sverige = fast pris, fri frakt vid ordervärde över X kr
- Betalning: Faktura som start, Swedbank Pay om kunden har avtal

### 4. Importera produkter

Om kunden har produkter i ett gammalt system (Abicart, Shopify, etc.):

1. Exportera produktlistan som CSV
2. Konvertera till WooCommerce-format (scripts finns i `scripts/`-mappen)
3. WP Admin → Produkter → Importera → ladda upp CSV
4. Kolla att kategorier, priser och variationer ser rätt ut

### 5. Design

GeneratePress styrs via Customizer (Utseende → Anpassa):

- **Färger**: Header, knappar, bakgrund
- **Typsnitt**: Rubriker och brödtext
- **Header**: Logga, meny, layout
- **CSS**: All custom CSS läggs i Anpassa → Ytterligare CSS

Logga: Ladda upp via Media-biblioteket, ange i Anpassa → Webbplatsidentitet.

### 6. mu-plugins

mu-plugins (must-use plugins) är PHP-filer som aktiveras automatiskt och inte kan stängas av i WP Admin. Perfekt för funktionalitet som kunden inte ska kunna råka ta bort.

Placera filer i `wp-content/mu-plugins/` på servern.

Ladda upp via FTP:

```bash
curl -T fil.php ftp://user:pass@ftp.host.se/public_html/wp-content/mu-plugins/
```

Exempel på mu-plugins vi byggt:

| Fil | Funktion |
|-----|----------|
| `smk-product-usps.php` | USP-fält på produkter + schema.org |
| `smk-cross-sell.php` | Automatisk korsförsäljning |
| `smk-google-ads.php` | Google Ads konverteringsspårning |
| `smk-ai-chat.php` | AI-chattbot med produktsök och offertförfrågningar |
| `smk-cart-icon.php` | Varukorg-ikon i navigeringen |
| `smk-seo-text.php` | SEO-texter under produktlistor |
| `smk-lagervara.php` | Lagervara-badge på produkter |

### 7. Startsida

Bygg startsidan med Gutenberg-block eller custom HTML i sidans editor.

OBS: WordPress lägger automatiskt till `<p>`-taggar runt din HTML (wpautop). Om du har `<div>` inuti `<a>` så förstörs layouten. Lösning: Bygg startsidan via ett shortcode-plugin istället (se `smk-homepage.php` som referens).

### 8. Bilder

Ladda ner bilder från kundens gamla system och ladda upp via:
- WP Admin → Media → Lägg till ny
- FTP-upload i bulk
- Batch-script (se `smk-img2.php` som referens)

OBS: Loopia FTP ger ibland 451-fel vid filer över 10KB. Lösning: base64-encode filen och ladda upp via ett PHP-script på servern.

### 9. Testa innan leverans

Gå igenom detta innan kunden ser sajten:

- Alla kategorisidor laddar utan fel
- Alla produkter har bild, pris och beskrivning
- Varukorg och checkout fungerar
- Sidan ser bra ut på mobil (375px), surfplatta (768px) och desktop (1440px)
- Kontaktformulär skickar mail
- robots.txt och sitemap.xml finns (via Rank Math)

---

## FTP

Varje hosting har FTP-inlogg. Fråga kunden eller kolla i hostingens adminpanel.

Ladda upp en fil:

```bash
curl -T fil.php ftp://user:pass@ftp.host.se/public_html/wp-content/mu-plugins/
```

Ladda ner en fil:

```bash
curl -o lokal-fil.php ftp://user:pass@ftp.host.se/public_html/wp-content/mu-plugins/fil.php
```

Lista filer i en mapp:

```bash
curl --list-only ftp://user:pass@ftp.host.se/public_html/wp-content/mu-plugins/
```

---

## Onboarda kunder i Opti

### Dashboard

URL: http://51.21.116.7/

Login: searchboost.web@gmail.com / Opti0195

Så här lägger du till en ny kund:

1. Gå till Pipeline-vyn
2. Klicka "Lägg till prospect"
3. Fyll i företagsnamn, webbplats och kontaktperson
4. Kunden hamnar i "Analys"-stadiet

I kunddetalj-vyn kan du:

- **Nyckelord**: Mata in A-, B- och C-klassificerade sökord med sökvolym
- **SEO-audit**: Klistra in analysdata från SE Ranking
- **Åtgärdsplan**: Generera med AI eller skriv manuellt (3 månader)
- **Logga arbete**: Beskriv vad du gjort — det syns automatiskt i kundens veckorapport

### Trello

Board: "Searchboost"

12 listor i ordning: Analys → Offerter → Kund → Arkiv → On-boarding → SOPs → BACKLOG → TO DO → IN PROGRESS → REVIEW → DONE → REPORTS & ANALYTICS

Ny kund: Skapa ett kort i "Analys"-listan med företagsnamn och webbplats.

ABC-nyckelord skrivs i kortets beskrivning:

```
A= sökord1, sökord2, sökord3
B= sökord1, sökord2
C= sökord1
```

Flytta kortet genom listorna i takt med att arbetet fortskrider.

### Google Search Console

För att koppla en kunds sajt till systemet:

1. Gå till kundens GSC-property (https://search.google.com/search-console)
2. Klicka Inställningar → Användare och behörigheter → Lägg till användare
3. Ange: `seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com`
4. Behörighet: Fullständig
5. Klicka Lägg till

---

## Claude Code

Starta Claude Code i projektmappen:

```bash
cd Searchboost-Opti
claude
```

Claude hjälper dig med:

- Bygga mu-plugins (beskriv vad du vill ha, Claude skriver koden)
- Fixa CSS och design
- Skapa scripts för produktimport
- Felsöka PHP-fel
- Optimera sajter och SEO-struktur
- Skriva kundmail och rapporter

Tips: Beskriv vad du vill uppnå, inte hur. Claude läser hela systemdokumentationen automatiskt och vet vad som finns.

---

## Git

Kör alltid `git pull` innan du börjar jobba:

```bash
git pull
```

När du är klar:

```bash
git add de-filer-du-ändrat
git commit -m "kort beskrivning av vad du gjort"
git push
```

Använd aldrig `git add .` — var alltid specifik med vilka filer du lägger till.

---

## Felsökning

| Problem | Lösning |
|---------|---------|
| "Kritiskt fel på webbplatsen" | En mu-plugin har PHP-syntaxfel. Ta bort filen via FTP, sajten kommer tillbaka. |
| Bilder visas inte | Kolla att bildsökvägen stämmer och att filen finns i `wp-content/uploads/`. |
| Layouten är trasig | WordPress wpautop har lagt in `<p>`-taggar i din HTML. Bygg om via shortcode istället. |
| FTP ger 451-fel | Filen är för stor för Loopia FTP. Använd base64 + PHP-script för uppladdning. |
| `npm install` fungerar inte | Kolla Node-version med `node -v`. Behöver vara 18 eller högre. |
| Git push avvisas | Du har inte pullat senaste ändringarna. Kör `git pull --rebase` först. |
| Claude Code startar inte | Kontrollera att ANTHROPIC_API_KEY är satt: `echo $ANTHROPIC_API_KEY` |

---

## Kontakt

- **Mikael Larsson**: mikael@searchboost.nu
- **Trello**: Board "Searchboost"
- **GitHub**: https://github.com/smalandsmobler/Searchboost-Opti
