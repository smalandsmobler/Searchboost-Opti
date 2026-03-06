# Viktor — Kom igång med Claude Code + webbläsarstyrning

> Skriven 2026-02-19. Följ stegen i ordning.

---

## Vad du får när detta är klart

Claude kan styra din webbläsare åt dig — precis som Mikael kör det.
Du skriver vad du vill göra, Claude gör det i Chrome.

---

## Steg 1 — Installera Node.js

1. Gå till **https://nodejs.org**
2. Klicka på den stora gröna knappen (LTS-versionen)
3. Ladda ner och installera — klicka Next hela vägen

Verifiera: öppna Terminal (Mac: Cmd+Space → skriv "Terminal") och kör:
```
node --version
```
Ska visa något som `v20.x.x`

---

## Steg 2 — Installera Claude Code

I Terminal, kör:
```
sudo npm install -g @anthropic-ai/claude-code
```
Det frågar efter ditt Mac-lösenord — skriv in det (syns inte när du skriver, det är normalt).

---

## Steg 3 — Installera Claude in Chrome-extensionen

1. Öppna Chrome
2. Gå till: **https://chromewebstore.google.com/detail/claude-in-chrome/xxxxxx**
   — eller sök "Claude in Chrome" i Chrome Web Store
3. Klicka "Lägg till i Chrome"

---

## Steg 4 — Logga in på Claude Code

I Terminal:
```
claude
```
Första gången ber den dig logga in — följ länken som visas, logga in med ditt Anthropic-konto.

**Viktigt:** Logga in med **searchboost.web@gmail.com** — ditt befintliga Anthropic-konto.

---

## Steg 5 — Klona projektet (en gång)

```
git clone https://github.com/smalandsmobler/Searchboost-Opti.git
cd Searchboost-Opti
```

---

## Steg 6 — Starta varje arbetsdag

1. Öppna Terminal
2. Kör:
```
cd ~/Searchboost-Opti
git pull
claude
```
3. Öppna Chrome — extensionen ska vara aktiv (litet Claude-ikon i verktygsfältet)

---

## Hur du använder det

Skriv till Claude vad du ska göra, t.ex:
- "Gå till ilmonte.se wp-admin och lägg till en ny meny-post under Tjänster"
- "Publicera det här inlägget på kompetensutveckla.se"
- "Kolla att kontaktsidan på mobelrondellen.se ser rätt ut"

Claude gör det i din Chrome-webbläsare medan du ser på.

---

## Regler att komma ihåg

- Kör ALLT genom Claude — klicka ingenting själv utan att Claude guidar dig
- Aldrig deploy, servrar, AWS eller kod
- Aldrig publicera utan att Claude godkänt mot checklistan
- Om Claude säger nej till något — fråga Mikael

---

## Problem?

Kontakta Mikael. Rör inte servrar eller kod på egen hand.
