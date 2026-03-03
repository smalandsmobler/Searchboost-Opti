# SMK — Todo: Migrering Abicart → WP/WC (ny.smalandskontorsmobler.se)
**Datum:** 2026-02-20
**Sajt:** https://ny.smalandskontorsmobler.se/
**Mål:** Ersätta Abicart med WooCommerce på Loopia

---

## Feedback från Mikael Nilsson (Grundare) — 2026-02-20

Resurser: https://we.tl/t-hhGwUl6jqQ (PDF + bildmapp)

| # | Uppgift | Status |
|---|---------|--------|
| 1 | **Typsnitt** — byt hela sajten till Arial Bold + svart (som i PDF) | Ej påbörjad |
| 2 | **Produktsidors rubriker** — ändra till Arial (för plottrigt nu) | Ej påbörjad |
| 3 | **Ö-prickar saknas** — kolla teckenkodning/font-fallback | Ej påbörjad |
| 4 | **Trygghet-sektion** — ersätt bred layout med PDF-version, lägg till CTA-knappar, ändra "lugn"-text, inkludera bild på Mikael | Ej påbörjad |
| 5 | **Kundservice-sida** — skriv om hela sidan (undermålig nu) | Ej påbörjad |
| 6 | **Kontaktsida** — lägg till bild på Mikael till höger om kontaktuppgifterna | Ej påbörjad |
| 7 | **PDF + bilder** — ladda ner från we.tl-länk, spara lokalt | Ej påbörjad |

### Notering
- Produktkategorier: ramarna är OK, ingen ändring
- Bild på Mikael behövs på: trygghet-sektion + kontaktsida (hämtas från bildmappen)

---

## Relaterade dokument (referens — ej aktiva)

- `docs/smk-designerlista-forbattringar-2026-02-16.md` — Fullständig teknisk designlista (100 punkter)
- `docs/smk-kundfeedback-micke-2026-02-15.md` — Tidigare feedback: moms-toggle, sökning, paginering, leveranstider, bannerlänkar
- `docs/smk-webbfeedback-2026.md` — Samma feedback som ovan, utökad format
- `presentations/smalandskontorsmobler-gameplan-2026.md` — SEO-gameplan + WooCommerce-migrering

---

## Migrering — Övriga öppna punkter

### Kvar från Abicart
- [ ] Redirect-karta: ~60 URL-mappningar sparade (borttagna från Abicart HEAD temporärt)
- [ ] Produktdata-bugg (Error fetching data) — Abicart support kontaktad 2026-02-11

### WooCommerce-setup
- [ ] Moms-toggle (exkl/inkl) — kod finns i smk-kundfeedback-micke-2026-02-15.md
- [ ] Sökning kopplas till WooCommerce produktsök — kod finns
- [ ] Produkter per kategori utan paginering — `loop_shop_per_page` filter
- [ ] Leveranstider på produktsidor — global eller per produkt
- [ ] Bannerlänkar rättas i smk-homepage.php — länktabell finns

### SEO (vid launch)
- [ ] Redirect-karta aktiveras (.htaccess)
- [ ] Rank Math konfigureras
- [ ] GSC: ny property för ny.smalandskontorsmobler.se
- [ ] Sitemap skickas in
