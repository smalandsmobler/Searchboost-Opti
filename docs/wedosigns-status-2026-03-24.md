# Wedosigns — Status 2026-03-24

## Kundmeddelande (Danni Andersen)

Danni är missnöjd och överväger att lämna. Huvudpunkter:

1. **Hemsidan inte klar** — lovad inom 2 dagar, fortfarande inte klar
2. **Fel färger** — SVART + GULT är kundens färger, inte rött
3. **Bilden på startsidan** — skylten syns inte
4. **Loggan är fel**
5. **Texter som inte syns**
6. **Faktura skickad** — men överenskommelsen var 3 månaders gratis
7. **Danni har en kompis** som kan fixa klart allt
8. **Frågar om det är WordPress** — vill kunna redigera själv

### Dannis citat (sammanfattning):
> "Jag behöver inte något rött på hemsidan, jag vill köra med mina färger."
> "SVART OCH GULT HAR JAG ALLTID SAGT!"
> "Jag tycker att jag har gett er en chans för att göra sidan bra."
> "Det är inte fel att ge upp på detta."
> "Har en kompis som kan fixa klart allt."

---

## Blockerare

| Problem | Status |
|---------|--------|
| WP-admin access | SAKNAS — kan inte göra något utan login |
| WP Application Password | SAKNAS |
| Facebook-URL | SAKNAS |
| Instagram-URL | SAKNAS |
| Hosting-panel (PHP) | SAKNAS |

---

## Förberett material (redo att deploya)

| Fil | Beskrivning | Status |
|-----|-------------|--------|
| `config/wedosigns-divi-fix.css` | Svart + gult tema, 423 rader CSS | KLAR (2026-03-23) |
| `docs/wedosigns-fixplan-2026.md` | Komplett fixplan, 13 steg, ~7 tim | KLAR |
| `docs/wedosigns-atgardsplan-danni-2026.md` | Kundåtgärdsplan + svarsmejl | KLAR |
| `content-pages/wedosigns-schema-muplugin.php` | Schema mu-plugin v1.1 | KLAR |
| `content-pages/wedosigns-faq-content.md` | FAQ-innehåll 5 sidor | KLAR |
| `content-pages/wedosigns-dekaler-goteborg.md` | Ny sida /dekaler-goteborg/ | KLAR |

---

## Beslut att ta

1. **Be om login en sista gång** — och fixa allt inom 24h
2. **Släppa kunden** — skicka över allt förberett material till Danni/kompisen
3. **Fakturafrågan** — kreditera fakturan (överenskommelse 3 mån gratis)

---

## Om kunden lämnar — leverera dessa filer

Danni/kompisen behöver:
1. `config/wedosigns-divi-fix.css` — klistra in i WP → Utseende → Anpassa → Ytterligare CSS
2. `docs/wedosigns-fixplan-2026.md` — steg-för-steg vad som behöver göras
3. `content-pages/wedosigns-schema-muplugin.php` — ladda upp till /wp-content/mu-plugins/
4. `content-pages/wedosigns-faq-content.md` — FAQ-texter att lägga in
5. `content-pages/wedosigns-dekaler-goteborg.md` — innehåll för ny dekaler-sida

Sajten är byggd i **WordPress + Divi** (bekräftat). Danni kan redigera allt via WP-admin.
