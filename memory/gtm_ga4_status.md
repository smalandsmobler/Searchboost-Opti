# GTM & GA4 Status — alla kunder
**Uppdaterad**: 2026-04-21 (nattjobb)

## Nuläge per kund

| Kund | GTM på sajt | GA4 på sajt | SSM registrerat | Nästa åtgärd |
|------|-------------|-------------|-----------------|--------------|
| SMK | GTM-KRMVQ6FQ ✅ | G-BLF7NP6KBR ✅ | ✅ property-id + measurement-id | Klar |
| Ilmonte | GTM-5R3XFSN ✅ | G-CM832CYYRS ✅ | ✅ property-id + measurement-id | Klar |
| Traficator | GTM-KRTLTBXM ✅ (+ GTM-TT4X9H5M) | Inuti GTM (ej direkt) | ✅ container-id | Verifiera GA4 i GTM-admin |
| Tobler | GTM-TVQD7F4K ✅ | GT-5TN9K3QH ✅ | ✅ container-id + gt-tag-id + property-id | Klar |
| Nordic Snus | SAKNAS | G-Z9R3KK4V5Y ✅ | ✅ measurement-id | Installera GTM |
| Möbelrondellen | SAKNAS | SAKNAS | ✅ property-id (518925363) | Behöver G-XXXXXXXX measurement-id + GTM |
| Jelmtech | SAKNAS | SAKNAS | Inget | Kräver kund-access till Google |
| Humanpower | SAKNAS | SAKNAS | Inget | Kräver kund-access till Google |

## Imorgon morgon — att göra

### 1. Verifiera GA4 i Traficators GTM (5 min)
- Logga in på tagmanager.google.com
- Öppna container GTM-KRTLTBXM
- Kolla om det finns en GA4 Configuration-tag
- Om ja: notera measurement ID (G-XXXXXXXX) → spara i SSM
- Om nej: skapa GA4-tag med Traficators GA4 property

### 2. Nordic Snus — installera GTM (10 min)
GA4-spårning (G-Z9R3KK4V5Y) funkar redan direkt via gtag.js.
Skapa ett GTM-container för nordicsnusonline.com:
- Gå till tagmanager.google.com → Skapa container "nordicsnusonline.com"
- Lägg till GA4 Configuration-tag med G-Z9R3KK4V5Y
- Installera GTM-snippet via Code Snippets plugin (WP-access: mikael, nordicsnusonline)
- Spara GTM-ID i SSM: /seo-mcp/integrations/nordicsnusonline/gtm-container-id

### 3. Möbelrondellen — hitta measurement-ID (5 min)
- analytics.google.com → välj property 518925363
- Admin → Data Streams → Webb → kopiera Measurement ID (G-XXXXXXXX)
- Spara: /seo-mcp/integrations/mobelrondellen/ga4-measurement-id
- Installera GTM-snippet om det saknas

### 4. Jelmtech & Humanpower (kräver kund-info)
Dessa saknar helt Google Analytics-konton, troligen.
- Fråga respektive kund om de har GA4 eller ska vi sätta upp nytt
- Tar 30 min per kund att sätta upp: GA4 property + GTM container + WordPress-installation

## SSM-parametrar registrerade (natt 2026-04-21)
- /seo-mcp/integrations/ilmonte/gtm-container-id = GTM-5R3XFSN
- /seo-mcp/integrations/ilmonte/ga4-measurement-id = G-CM832CYYRS
- /seo-mcp/integrations/smalandskontorsmobler/gtm-container-id = GTM-KRMVQ6FQ
- /seo-mcp/integrations/smalandskontorsmobler/ga4-measurement-id = G-BLF7NP6KBR
- /seo-mcp/integrations/traficator/gtm-container-id = GTM-KRTLTBXM
- /seo-mcp/integrations/nordicsnusonline/ga4-measurement-id = G-Z9R3KK4V5Y
- /seo-mcp/integrations/tobler/gtm-container-id = GTM-TVQD7F4K
- /seo-mcp/integrations/tobler/gt-tag-id = GT-5TN9K3QH
