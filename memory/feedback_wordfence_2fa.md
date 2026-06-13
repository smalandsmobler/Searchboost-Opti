---
name: Wordfence 2FA blockerar app-password
description: REGEL — aktivera ALDRIG Wordfence Login Security 2FA på kunder där vi använder app-password-auth
type: feedback
---

# ⛔ REGEL: Aktivera ALDRIG Wordfence 2FA på kunder med app-password-access

## Varför

Wordfence Login Security 2FA tillämpar TOTP-verifiering på **alla** auth-flöden, inklusive WP REST API-anrop som använder Application Passwords. Resultat: våra app-passwords slutar fungera och all automation (Opti-optimizer, Perispa, Rank Math-fixar, artikelpublicering, schema-uppdateringar, allt) dör tyst med 401/403.

Det finns inget sätt att undanta REST API-rutter från 2FA-tvånget i Wordfence. Antingen är 2FA aktivt för alla auth → app-passwords trasiga. Eller så är det av → vi kan jobba.

## Konkret konsekvens (Ilmonte 2026-mars)

1. Wordfence 2FA aktiverades för admins på ilmonte.se.
2. App-password `/seo-mcp/wordpress/ilmonte/app-password` slutade fungera.
3. Ingen notis — vi upptäckte det veckor senare när Opti-rapporten visade 0 optimeringar.
4. En månad utan automation → Peter Vikström förlorade förtroendet.
5. Vi höll på att tappa kunden helt. Retention-deal (30 dagar gratis från 2026-04-08) krävdes för att rädda den.
6. Ironiskt nog blev malware-räddningen (5000 kr) det som vände relationen — men det förändrar inte att Wordfence 2FA var rotorsaken.

## Regel

**Wordfence 2FA är permanent inaktiverat på alla kunder där vi använder app-password-auth.**

Detta gäller per 2026-04-18:
- ilmonte.se
- smalandskontorsmobler.se
- mobelrondellen.se
- jelmtech.se
- searchboost.se
- traficator.se
- humanpower.se
- nordicsnusonline.com
- tobler.se

## Om någon frågar "men säkerhet då?"

App-passwords skyddas redan av:
- Långa slumpade strings (24 tecken)
- HTTPS-tvingad transport
- Snabb rotation (nya efter varje cred-incident)
- Wordfence firewall + malware-scan (utan 2FA på login)
- IP-blockering via Wordfence Rate Limiting

Säkerhet är viktigt, men 2FA som bryter automation är värre än 2FA som inte finns — för utan automation levererar vi ingenting alls, och då har kunden inget skäl att behålla oss.

## Om 2FA absolut måste finnas

Använd **WP Application Password** istället för TOTP-2FA. App-passwords är Wordpress egen mekanism för att ge automation separerade credentials från användarlösenord — det är redan 2FA i praktiken (användarlösenord + separat automation-password). Wordfence 2FA-pluginen förstår inte skillnaden och kräver TOTP även på app-password-rutten.

## Alternativ att diskutera med kund (om kunden insisterar på 2FA)

1. Wordfence 2FA av → app-passwords fungerar (VÅR REKOMMENDATION)
2. Wordfence 2FA på ENDAST wp-login.php → app-passwords fungerar (oklart om Wordfence stödjer, kolla innan)
3. Två admin-konton: ett med 2FA (för Peter/Dajana manuell användning) + ett utan 2FA (för searchboost-automation)

Alternativ 3 har flera kunder redan via searchboost-user eller sbadmin-user.
