# Flytt-plan — tobler.se

**Datum:** 2026-05-03
**Utförd av:** Searchboost
**Status:** FÖRBEREDD — väntar på Mikaels GO

---

## 1. Nuläge

| Parameter | Värde |
|-----------|-------|
| **Domän** | tobler.se |
| **Nuvarande hosting** | Beebyte (shwl-0136.s.beebyte.se) |
| **CMS** | WordPress |
| **Tema** | Hello Elementor Child |
| **Page builder** | Elementor + Elementor Pro 3.21 |
| **E-handel** | WooCommerce 10.4.3 |
| **Betalning** | Swedbank Pay (payee: 6bbb4542-..., token i SSM, redirect-flow, sv-SE) |
| **SEO** | Rank Math + Rank Math PRO |
| **Cache** | WP Rocket 3.20.3 |
| **Bilder** | Imagify + Converter for Media (WebP) |
| **Säkerhet** | Wordfence 8.1.4 + Login Lockdown |
| **Staging** | tobler.searchboost.se (Flatsome-baserad, separat site) |
| **Antal sidor** | 10 sidor + ~100 produkter + 18 artiklar |
| **Plugins** | 28 st (26 aktiva, 2 inaktiva) |
| **Extra** | JetEngine + JetMenu + JetTabs + JetTricks + JetProductGallery + JetSearch (Crocoblock-svit) |
| **Code Snippets** | Aktiva: ~10+ snippets (SEO, kategoribanners, produktsida-redesign, schema etc.) |
| **WP-creds** | mikael / mxln FGug xkKb eZo6 VKFy SzHm |
| **Beebyte-creds** | I SSM: /seo-mcp/integrations/tobler/beebyte-{url,username,password} |

---

## 2. Ny hosting — Rekommendation

| Alternativ | Pris/mån | Fördelar | Nackdelar |
|-----------|----------|---------|-----------|
| **Loopia VPS** | ~199-399 kr | Svensk, bra support, DNS-hantering vi redan kan | Inte WP-specialiserat |
| **Loopia WP** | ~149-249 kr | Managed WP, automatisk backup, SSL | Begränsat serveraccess |
| **Cloudways (Vultr/DO)** | ~$14-28 | Snabbast, staging inbyggt, SSH | Ej svensk support |
| **Kinsta** | ~$35 | Premium managed WP, CDN, staging | Dyrast |

**Rekommendation:** Loopia (samma som ilmonte-flytten) — vi har erfarenhet, DNS-rutiner, SMTP redan konfigurerat.

---

## 3. Pre-flytt checklista

### Inventering (KLAR)

- [x] Plugin-lista dokumenterad (28 plugins)
- [x] Sidstruktur dokumenterad (10 sidor + produkter + artiklar)
- [x] WP-credentials säkrade i SSM
- [x] Beebyte hosting-credentials säkrade i SSM
- [x] Code Snippets inventerade (~10+ aktiva)
- [x] Tema identifierat (Hello Elementor Child)
- [x] Page builder: Elementor + Elementor Pro (LICENS krävs vid flytt)
- [x] Crocoblock-svit: JetEngine, JetMenu, JetTabs, JetTricks, JetProductGallery, JetSearch (LICENS krävs)
- [x] WP Rocket (LICENS krävs)
- [x] Rank Math PRO (täcks av Searchboost-licens mikael.searchboost@gmail.com)

### Licenser att säkra FÖRE flytt

| Plugin | Licenshållare | Status |
|--------|--------------|--------|
| **Elementor Pro** | Blackbox/Tobler? | KOLLA — behöver license key för ny server |
| **Crocoblock (Jet-sviten)** | Blackbox/Tobler? | KOLLA — 6 plugins, behöver subscription |
| **WP Rocket** | Blackbox/Tobler? | KOLLA — site-specifik licens |
| **Imagify** | Okänt | KOLLA — API-key behövs |
| **Rank Math PRO** | Searchboost (mikael.searchboost@gmail.com) | OK — kan aktiveras på ny server |
| **Swedbank Pay** | Tobler | OK — merchant-konto, bara ändra webhook-URL |

**KRITISKT:** Be Jakob/Viktor om licensnycklar för Elementor Pro + Crocoblock + WP Rocket INNAN flytt. Utan dessa funkar inte sajten efter flytt.

### Data att exportera

- [ ] **Full WP-backup** via All-in-One WP Migration (plugin redan installerat!)
- [ ] **Databas-dump** (separat, som backup) via Duplicator (redan installerat!)
- [ ] **wp-content/uploads/** — alla mediafiler (bilder, videor, PDF)
- [ ] **wp-content/themes/hello-elementor-child/** — child-temat
- [ ] **Code Snippets export** — alla aktiva snippets som JSON
- [ ] **WooCommerce-inställningar** — betalgateway-config, fraktinställningar, moms
- [ ] **Rank Math-inställningar** — exportera via Rank Math → Import/Export
- [ ] **WP Rocket-inställningar** — exportera via WP Rocket → Tools → Export
- [ ] **Wordfence-inställningar** — exportera whitelist + IP-block
- [ ] **Elementor-templates** — Custom headers/footers, globala widgets
- [ ] **JetEngine custom post types/fields** — exportera via JetEngine → Tools
- [ ] **Redirections** — plugin installerat men inaktivt, kolla om .htaccess har redirects

---

## 4. Flytt-steg (dag-för-dag)

### Dag 0 — Förberedelse (IDAG)
1. [x] Dokumentera allt (denna fil)
2. [ ] Kontakta Jakob — be om licensnycklar (Elementor, Crocoblock, WP Rocket)
3. [ ] Beställ hosting på ny server (Loopia eller annat)
4. [ ] Skapa DNS A-record för tobler.se (peka INTE om ännu)

### Dag 1 — Backup + Export
5. [ ] Full backup via All-in-One WP Migration → ladda ned .wpress-fil
6. [ ] Alternativ: Duplicator-paket (installer.php + archive.zip)
7. [ ] Exportera Code Snippets (Snippets → Import/Export → Export All)
8. [ ] Exportera Rank Math (Rank Math → Status & Tools → Import/Export)
9. [ ] Exportera WP Rocket (WP Rocket → Tools → Export Settings)
10. [ ] Exportera JetEngine custom types (JetEngine → Import/Export)
11. [ ] Notera alla WooCommerce → Inställningar-tabs (betalning, frakt, moms, e-post)
12. [ ] Screenshot av Elementor → Inställningar + Custom Fonts om finns
13. [ ] Snapshot via Perispa: `perispa_create_snapshot` (för rollback)

### Dag 2 — Installation ny server
14. [ ] Installera WordPress på ny server
15. [ ] Importera via All-in-One WP Migration (eller Duplicator)
16. [ ] Aktivera SSL-certifikat (Let's Encrypt)
17. [ ] Verifiera att sajten funkar på ny server (via hosts-fil eller temp-URL)
18. [ ] Aktivera alla plugin-licenser (Elementor Pro, Crocoblock, WP Rocket)
19. [ ] Testa: startsidan, en produktsida, checkout-flöde, kategori-sida
20. [ ] Testa: Code Snippets aktiva (kategoribanners, produktsida USP, schema)
21. [ ] Testa: WooCommerce → testorder (utan riktigt köp)
22. [ ] Testa: mobilvy (Elementor responsive)

### Dag 3 — DNS-cutover
23. [ ] Sänk TTL på DNS till 300s (minst 24h före cutover)
24. [ ] Sista backup från gammal server (fånga sista beställningar)
25. [ ] Ändra DNS A-record: tobler.se → ny server IP
26. [ ] Ändra www.tobler.se → samma IP
27. [ ] Uppdatera WordPress URL:er (Settings → General) om de ändrats
28. [ ] Verifiera SSL funkar på ny domän
29. [ ] Rensa WP Rocket cache
30. [ ] Rensa Cloudflare/CDN cache om tillämpligt
31. [ ] Testa hela sajten: startsida, produkter, checkout, kontakt, artiklar
32. [ ] Testa Swedbank Pay webhook (uppdatera callback-URL i Swedbank-portal om nödvändigt)

### Dag 4 — Post-flytt
33. [ ] Verifiera Google Search Console (ska redan ha SA-access)
34. [ ] Uppdatera SSM med nya hosting-credentials
35. [ ] Uppdatera Perispa-config om URL ändrats
36. [ ] Skicka mail till Jakob/Viktor: "Sajten är flyttad, testa checkout"
37. [ ] Övervaka 48h: uptime, checkout, formulär, rankings
38. [ ] Stäng av/säg upp Beebyte-kontot efter 14 dagar (behåll som backup)

---

## 5. Risker + mitigation

| Risk | Sannolikhet | Påverkan | Mitigation |
|------|-------------|----------|------------|
| Elementor Pro-licens saknas | Medel | Kritisk — sajten renderar inte utan Pro | Kontakta Jakob NU |
| Crocoblock-licens saknas | Medel | Hög — menyer, produktgalleri trasigt | Kontakta Jakob NU |
| Swedbank Pay webhook-URL | Låg | Hög — betalningar funkar inte | Uppdatera i Swedbank-portal dag 3 |
| DNS-propagering tar >24h | Låg | Medel — vissa besökare ser gammal sajt | Sänk TTL dag före |
| Code Snippets tappar ID | Låg | Medel — snippets kopplade till snippet-ID | Exportera + verifiera |
| WP Rocket conflict ny server | Låg | Låg — cachar fel | Avaktivera → rensa → aktivera |
| SEO-ranking tapp vid flytt | Låg | Medel — tillfällig nedgång | Behåll alla URL:er exakt, inga redirects nödvändiga |

---

## 6. Kontakter

| Person | Roll | Kontakt |
|--------|------|---------|
| Jakob Frostenäs | Ägare, Tobler | jakob@tobler.se, 0762-10 02 09 |
| Viktor Frostenäs | Ägare, Tobler | viktor@tobler.se, 0762-10 02 08 |
| Mikael Larsson | Searchboost | mikael@searchboost.se |
| Beebyte support | Nuvarande hosting | Via Beebyte-panelen |
| Blackbox (Daniel Persson) | Tidigare utvecklare | Okänd status — kolla licensfrågor |

---

## 7. Mail-utkast till Jakob

```
Ämne: Flytt av tobler.se — behöver licensnycklar

Hej Jakob,

Vi förbereder flytten av tobler.se till ny hosting. För att allt ska funka
smidigt behöver jag licensnycklar till:

1. Elementor Pro — den betalkontot som Elementor-licensen köptes på
2. Crocoblock (JetEngine, JetMenu etc.) — subscription-uppgifter
3. WP Rocket — licensnyckel

Kan du kolla med er tidigare utvecklare (Daniel/Blackbox) vilka konton
dessa köptes på? Alternativt kan vi köpa nya licenser — ungefärlig kostnad:
- Elementor Pro: $59/år
- Crocoblock All-Inclusive: $199/år
- WP Rocket: $59/år

Totalt ~$317/år (~3 400 kr/år)

Flytten tar 2-3 arbetsdagar när vi har allt. Inga URL:er ändras,
inga rankings påverkas.

Hör av dig!
/Mikael
```

---

## 8. Automatik att uppdatera efter flytt

- [ ] SSM: `/seo-mcp/integrations/tobler/beebyte-*` → nya hosting-creds
- [ ] Perispa config: uppdatera om URL ändras
- [ ] Remote triggers: Tobler social media-agenter (trig_01CZsz4ku6ETFY7Da6LA4RTV + trig_01K7eEAoUnjgQCNQMYTLuCao) — inga ändringar behövs om domänen behålls
- [ ] Autonomous optimizer: inga ändringar (kör mot tobler.se oavsett hosting)
- [ ] LinkedIn-agenten: inga ändringar
