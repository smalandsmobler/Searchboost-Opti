# Ferox Shopify — manuella setup-steg

**Skapat**: 2026-04-09
**Varför manuellt**: Vi har endast Catalog API-access, inte Admin API-token. Allt nedan görs via Shopify Admin UI.

**Admin-URL**: https://feroxkonsult-se.myshopify.com/admin/

---

## 1. Fraktpriser (Settings → Shipping and delivery)

Klicka **Manage** på General profile, sen **Add zone** för varje land.

### Sverige
Zone: **Sverige**
Rates:

| Rate-namn | Typ | Vikt från-till | Pris (ex moms) |
|---|---|---|---|
| Schenker Direkt 0–1,5 kg | Price-based rate… nej, **Weight-based rate** | 0,001–1,500 kg | 115 SEK |
| Schenker Direkt 1,5–4 kg | Weight-based | 1,500–4,000 kg | 150 SEK |
| Schenker Direkt 4–7 kg | Weight-based | 4,000–7,000 kg | 205 SEK |
| Schenker Direkt 7+ kg | Weight-based | 7,000–999 kg | 240 SEK |
| Schenker Ombud 0–1,5 kg | Weight-based | 0,001–1,500 kg | 85 SEK |
| Schenker Ombud 1,5–4 kg | Weight-based | 1,500–4,000 kg | 115 SEK |
| Schenker Ombud 4–7 kg | Weight-based | 4,000–7,000 kg | 140 SEK |
| Schenker Ombud 7+ kg | Weight-based | 7,000–999 kg | 170 SEK |
| Posten Varubrev 0–1 kg | Weight-based | 0,001–1,000 kg | 65 SEK |
| Posten Varubrev 1–2 kg | Weight-based | 1,001–2,000 kg | 85 SEK |
| Posten Varubrev 2–3 kg | Weight-based | 2,001–3,000 kg | 135 SEK |
| Hämtas hos Ferox | Local pickup | — | 0 SEK |
| Ingen frakt (digital) | Weight-based | 0,000–0,001 kg | 0 SEK |

### Danmark (Zone: Danmark, Schenker)
| Vikt | Pris |
|---|---|
| 0,000–1,000 kg | 150 SEK |
| 1,001–3,000 kg | 220 SEK |
| 3,001–7,000 kg | 275 SEK |
| 7,001+ kg | 320 SEK |
| 0,000–0,001 kg (digital) | 0 SEK |

### Finland (Zone: Finland, Schenker)
| Vikt | Pris |
|---|---|
| 0,001–3,000 kg | 220 SEK |
| 3,001–7,000 kg | 275 SEK |
| 7,001+ kg | 395 SEK |
| 0,000–0,001 kg (digital) | 0 SEK |

### Norge (Zone: Norge, Schenker) + tullavgift
| Vikt | Pris |
|---|---|
| 0,002–3,000 kg | 295 SEK |
| 3,000–7,000 kg | 355 SEK |
| 7,000+ kg | 500 SEK |
| 0,000–0,001 kg (digital) | 0 SEK |

**OBS**: Andreas nämnde att tullhandläggningsavgift läggs på — exakt belopp saknas, skicka fråga i samlat mail när allt annat är klart.

### Åland (Zone: **egen zon "Åland"** — lägg Åland som specifik region inom Finland-zonen eller som eget land om Shopify tillåter)
| Vikt | Pris |
|---|---|
| 0,001–1,500 kg | 295 SEK |
| 1,500–3,000 kg | 295 SEK |
| 3,000–7,000 kg | 355 SEK |
| 7,000+ kg | 500 SEK |

---

## 2. Åland tax override (Settings → Taxes and duties)

Shopify klassar Åland som del av Finland (EU) med 25% moms. Andreas vill ha Åland **utan moms** (som Norge).

1. Settings → Taxes and duties → **Finland**
2. Klicka **Add tax override**
3. Region: **Åland** (eller skapa Åland som collection om region-override inte finns för sub-regioner)
4. Location: specifik collection eller all products
5. Sätt tax rate till **0%**
6. Save

Alternativ om det inte går via override: skapa ett custom Market för "Åland" med egen tax-setting.

---

## 3. VAT-fält i checkout för DK/FI (Settings → Checkout)

1. Settings → Checkout → **Customer contact**
2. Under **Tax registration numbers** (eller motsvarande) → välj **Enabled** för EU-länder
3. Spara

Alternativt (säkrare väg): lägg in en custom checkout field via Shopify Functions eller en app som "Customer Fields" för att samla VAT-nummer. Aktivera för Danmark + Finland.

Om VAT-nummer angivs → Shopify Tax hanterar automatiskt reverse charge (0% moms).

---

## 4. Ladda upp logga (Theme Customizer)

1. Sales channels → Online Store → Themes → **Customize** (på aktivt theme)
2. Header-sektion → **Logo**
3. Ladda upp `~/Downloads/ferox-logo.png` (360×131, transparent)
4. Retina: ladda upp `ferox-logo-3x.png`
5. Save

---

## 5. Theme-fixar (samma Customizer)

- **Grid 4 → 3 kolumner**: Collection template → Products per row = **3**
- **Bottom alignment**: Product card → Vertical alignment = **Bottom** (om tillgängligt, annars via custom CSS)
- **Email bort från footer**: Footer section → ta bort `info@feroxkonsult.se`-raden
- **"Tax included"-label**: Content → Translations → sök "Tax included" → sätt till tomt

---

## 6. Support-sidan mall

1. Online Store → Pages → Support (id 706173174108)
2. Online store → Theme template → **contact** (just nu: Standardsida)
3. Save

---

## 7. TP-6 relaterade produkter

1. Products → artnr-1020-tp-6
2. Scrolla ner till **Recommendations** → ta bort auto-rekommendation av stämpelkort
3. Alternativt: sätt manuell relaterad produkt till annat än stämpelkort

---

## Efter allt ovan — testorder + samlat mail

1. Gör en testorder på en fysisk produkt med svensk adress
2. Gör en testorder på en digital produkt (art 2402, 2700, 4100)
3. Gör en testorder på norsk adress (verifiera 0% moms + frakt)
4. När alla 3 testordrar är OK → skriv samlat "allt klart"-mail till Andreas (se memory-regel, inte småplottra med delsvar)

---

## Status per 2026-04-09

✓ 17 produkter importerade
✓ Markets (SE + EU + Norge)
✓ Betalning (Shopify Payments + PayPal + Manuell faktura)
✓ Kontakt-sidan rensad
✓ Support-texter
✓ TeamViewer på S3

✗ Frakter (väntar på manuell setup enligt denna fil)
✗ Åland tax override
✗ VAT-fält
✗ Logga
✗ Theme-fixar
✗ Support-mall
✗ TP-6 recommendations
✗ Testordrar
✗ Domänkoppling (Andreas Office 365 DNS)
✗ FeroxTid dolda sidor (väntar Hemsida24-login)
