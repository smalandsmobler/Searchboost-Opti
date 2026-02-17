# Viktor — Kom igang med Searchboost

> Uppdaterad: 2026-02-17

---

## Steg 1: Installera grejer

Oppna Terminal (sok "Terminal" i Spotlight). Kor ett kommando i taget:

```bash
# Homebrew (installerar andra program)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js (kravs for Claude Code)
brew install node

# Git (kravs for att hamta koden)
brew install git

# Claude Code (din AI-assistent)
npm install -g @anthropic-ai/claude-code
```

Klart? Bra. Ga vidare.

---

## Steg 2: API-nyckel

Mikael ger dig en nyckel. Lagg in den sa har:

```bash
echo 'export ANTHROPIC_API_KEY=din-nyckel-har' >> ~/.zshrc
source ~/.zshrc
```

Byt ut `din-nyckel-har` mot den riktiga nyckeln.

---

## Steg 3: Hamta projektet

```bash
git clone https://github.com/smalandsmobler/Searchboost-Opti.git
cd Searchboost-Opti
cd mcp-server-code && npm install && cd ..
```

Starta Claude:

```bash
claude
```

---

## Steg 4: Dashboard-login

Oppna i webblasaren:

- **URL:** http://51.21.116.7/
- **Mail:** searchboost.web@gmail.com
- **Losenord:** Opti0195

---

## Varje dag nar du borjar

```bash
cd Searchboost-Opti
git pull
claude
```

Claude fragar "Verifieringskod?" — skriv **0195**.

---

## Dina uppgifter

Du gor kundarbete. Allt annat skoter Mikael.

**Du GOR:**
- Dashboarden — kolla kunder, logga arbete, pipeline
- Trello — flytta kort, uppdatera status
- Fraga Claude — SEO-hjalp, SOPs, steg-for-steg
- Bygga kundsajter — WordPress + WooCommerce
- Lagga in credentials — WP, GSC, GA4, GTM, Ads, Meta
- Jobba i kunders system — WP-admin, GSC, GA4, GTM

**Du GOR INTE:**
- Kod, deploy, servrar, AWS, Lambda, SSH, FTP, GitHub
- Andra pa searchboost.se
- Publicera utan att Claude kollat mot SOP-checklistan

---

## Bygga en kundsajt

### Kortversionen

1. Installera WordPress pa kundens hosting
2. Tema: **GeneratePress**
3. Plugins: **WooCommerce**, **Rank Math SEO**, **WP Fastest Cache**, **Smush**
4. Importera produkter fran CSV
5. Designa i Utseende -> Anpassa
6. Testa pa mobil, surfplatta, desktop
7. Kolla: bilder, priser, varukorg, kontaktformular, sitemap

### Checklista innan kunden ser sajten

- [ ] Alla sidor laddar utan fel
- [ ] Produkter har bild + pris + beskrivning
- [ ] Varukorg och checkout funkar
- [ ] Bra pa mobil (375px)
- [ ] Kontaktformular skickar mail
- [ ] robots.txt och sitemap.xml finns

---

## Onboarda en kund

Sa har gar det till:

```
1. Dashboard -> Pipeline -> "+ Manuell prospect"
2. Fyll i foretagsnamn + webbplats -> Spara
3. Klicka pa kunden
4. Fyll i nyckelord (A = viktigast, B = bra att ha, C = langsvans)
5. Credentials-fliken -> WP-login + GSC-property
6. Testa WP-anslutning (grona bocken = OK)
7. Aktivera
```

### Lagga till kund i Google Search Console

1. Ga till kundens GSC
2. Installningar -> Anvandare -> Lagg till
3. E-post: `seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com`
4. Behorighet: **Fullstandig**

---

## Logga ditt arbete

I dashboarden -> kunddetalj -> "Logga arbete":

- Vad du gjorde
- Vilken sida
- Hur lang tid
- Ditt namn (Viktor)

Det hamnar automatiskt i kundens veckorapport.

---

## Nar nagt gar fel

| Problem | Losning |
|---------|---------|
| Sajten visar "Kritiskt fel" | En plugin har gatt sonder. Ta bort den via FTP |
| Bilder syns inte | Kolla att filen finns i wp-content/uploads/ |
| Git push avvisas | Kor `git pull --rebase` forst |
| Claude startar inte | Kolla nyckeln: `echo $ANTHROPIC_API_KEY` |
| Timeout vid nyckelord | Spara max 10 st per gang |

---

## Kontakt

- **Mikael:** mikael@searchboost.se
- **Dashboard:** http://51.21.116.7/
- **Trello:** searchboost.web@gmail.com
