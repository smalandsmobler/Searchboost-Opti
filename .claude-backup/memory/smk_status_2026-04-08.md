---
name: SMK status 2026-04-08
description: Smålands Kontorsmöbler — genomgång 8 april, fix av optimizer-URL, kvarvarande frågor
type: project
---

## SMK genomgång 2026-04-08 kväll

### ✅ Fungerar
- Alla huvudsidor 200 OK (huvuddomän `smalandskontorsmobler.se`)
- 898 produkter i WC, alla med bilder/pris/beskrivning/lager
- SPF + DMARC på plats i Loopia DNS (fixat 7 april)
- 10 aktiva plugins, inga kritiska issues
- Rank Math Pro aktivt
- LiteSpeed Cache aktivt
- WooCommerce kassan fungerar (på `/checkout/`)

### 🔴 KRITISK BUGG FIXAD denna kväll
**Optimizern hade gjort 0 optimeringar på SMK** sen start.

**Rotorsak**: SSM-parameter `/seo-mcp/wordpress/smalandskontorsmobler/url` pekade på `https://ny.smalandskontorsmobler.se` som nu 301:ar till huvuddomänen. Optimizer-Lambda följer inte redirects → failade tyst på alla WP REST-anrop.

**Fix**: Uppdaterad till `https://smalandskontorsmobler.se` (SSM version 6, 2026-04-08 21:30).

**Väntat resultat**: Nästa hourly-körning (inom 1h) börjar processa SMK. 20 queue items från tidigare audit plus nya från weekly-audit.

### 🟡 Öppna frågor inför morgondag

1. **Micke's Loopia SMTP-lösenord** — inget mail än. wp-mail-smtp är aktiv igen men okänt om SMTP-auth funkar efter Loopia-reset. Bör verifieras.

2. **Ordrar senaste 10 dagarna**: bara testorder 17818 (min från 7 april, on-hold) + 17802 completed 28 mars. Efter 28 mars inga riktiga ordrar — är kassan 100% bra efter gårdagens fix? Fråga Micke.

3. **Produkt-URL:er** använder `/product/` (engelska) istället för `/produkt/` (svenska). SEO-småproblem. WC settings → Products → Permalinks → Custom base "produkt".

4. **Öppettider** finns inte som egen sida — bara inbakat i `/kontakt/`-sidan (id 9278). Om Mattias (Mobelrondellen) eller Micke vill ha egen sida får vi skapa.

5. **Sitestruktur — engelska slugs**:
   - `/sortiment/` = shop-sida (inte `/butik/`)
   - `/checkout/` = kassa (inte `/kassa/`)
   - `/cart/` = varukorg
   - `/my-account/` = mitt konto

6. **Sidor i DB**: 14 st — alla publiserade. Inga broken pages hittade.

7. **Sajten**: 22 unika interna länkar från hemsidan, alla svarar 200/301/302. Inga broken links.

8. **wp-mail-smtp är aktivt** — jag avaktiverade det igår 7/4, men det är aktivt igen. Någon (SMK-admin?) aktiverade tillbaka det. Kolla via wp-admin → WP Mail SMTP → Tools → Test Email att det faktiskt fungerar.

### Senaste bloggartiklar (publicerat)
- 2026-03-20: Fördelar med hållbara kontorsmöbler för småföretag
- 2026-03-19: Ställ in ergonomisk arbetsplats steg för steg 2026
- 2026-03-18: Varför använda höj- och sänkbart skrivbord
- 2026-03-17: Optimera arbetsplatsen med fällbord
- 2026-03-16: Top 4 kontorsstolar för småföretag 2026

Bra takt! Kontrast till Ilmonte (6 inlägg totalt).

## Inloggning
- WP URL: https://smalandskontorsmobler.se
- REST user: searchboost / ySlF8pM4AAS3i8aBdK9gg51C (API app password)
- GSC property: https://www.smalandskontorsmobler.se/
- GA4: 395555935
- Swedbank Pay: peyee-id + token i SSM
- Kontakt: Mikael Nilsson (mikael@smalandskontorsmobler.se)
