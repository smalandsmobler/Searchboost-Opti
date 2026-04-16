# Mail till Peter Vikström — audit-uppföljning 2026-04-16

**Till:** sales@ilmonte.se
**Från:** mikael@searchboost.se
**Ämne:** Ilmonte — full SEO-genomgång gjord (+ en grej vi måste prata om)

---

Hej Peter,

Jag satte mig ikväll/natt och gjorde en komplett teknisk genomgång av ilmonte.se — titlar, meta, rubriker, länkar, schema, redirects, sitemap, allt. Två delar i detta mail: **det vi redan fixat** och **en större sak vi måste ta beslut om**.

## 1. Vad jag redan gjort (inga risker för butik/kassa)

Allt nedan är rena SEO-förbättringar i metadata — ingenting som påverkar hur kunder handlar, lägger i varukorgen eller checkar ut.

- **Fyra sidor fick nya, starkare titlar och beskrivningar** — tidigare var de döpta "ilmofurniture - ilmonte.se", "Pdf information - ilmonte.se" osv. Nu beskriver de tydligt vad sidan handlar om och innehåller sökord ni borde synas på.
- **Varukorg, kassa och "mitt konto" är nu satta till "noindex"** — de ska aldrig synas i Google och låg tidigare öppna. Nu hindrar vi Google från att lägga krut på dem, så att hela SEO-juicen går till produkter och guider istället.
- **Startsidans delningsförhandsvisning** (det som dyker upp när någon klistrar in er URL i Facebook/LinkedIn) visade tidigare gammal text om "teaterutrustning, filmdukar, podier". Nu matchar den er nuvarande positionering: eventinredning, eventmöbler, scenpodier, scentextil.

Allt går att verifiera live — t.ex. öppna `ilmonte.se/tillbehorsshop/` och titta på fliktexten, eller klistra in `ilmonte.se` i LinkedIn och se förhandsvisningen.

## 2. Det vi måste prata om

När jag gick igenom er sitemap (listan över sidor Google får från er) upptäckte jag att **ilmonte.se rapporterar 4 150 blogginlägg till Google**. Men i er WordPress finns bara 25 riktiga inlägg.

Skillnaden — **drygt 4 100 sidor** — är casino- och spelbonusspam. Rubriker som *"Casino med omedelbar bonus"*, *"Bästa free spins 2026"*, *"Ruby Fortune no deposit"* osv. Alla har full text, er logga, er meny i toppen och ser ut som era sidor, men har inget med ilmonte att göra.

De finns inte som riktiga WordPress-inlägg. Det är **kod som någon injicerat** — antingen i en plugin, ert tema, eller .htaccess — som genererar sidor on-the-fly när Google frågar efter dem.

**Vad det betyder i praktiken:**
- Google ser ilmonte som en delvis casino-sajt. Det drar ned hur man rankar på *allt* annat (eventmöbler, scenpodier, konferens).
- Det är troligen därför SEO-arbetet vi lägger in inte ger full effekt — systemet jobbar uppförsbacke mot 4 100 spam-sidor.
- Det är också en säkerhetsrisk: någon har skrivåtkomst till er sajt.

**Detta är inte ovanligt.** Det händer ofta med äldre WordPress-installationer där ett plugin eller tema har en känd sårbarhet. Lösningen är entydig, men kräver någon som kan gå in i era filer på webhotellet (FTP eller SSH) och fil för fil hitta den injekterade koden, plus byta alla lösenord efteråt.

## 3. Vad du har för alternativ

**A. Jag gör cleanup-uppdraget** som ett separat engångs-uppdrag. Jag behöver FTP/SSH-uppgifter till webhotellet. Tidsåtgång ca 5-10 h beroende på hur djupt infektionen sitter. Fast pris: 7 500 kr exkl moms.

**B. Extern specialist.** Sucuri eller Wordfence gör detta som tjänst, 2 500-5 000 kr beroende på infektionens storlek. Jag kan rekommendera och koordinera.

**C. Er egen utvecklare/webbyrå** som redan har access till sajten och kan gå in direkt.

**Oavsett vem som gör det** måste det göras nu. Utan cleanup kommer SEO-siffrorna inte röra sig, hur mycket content jag än skriver. Hela mitt retention-arbete (gratismånaden, artiklarna, tekniska fixar) riskerar att vara meningslöst tills detta är löst.

## 4. Nästa steg

Om du ringer mig imorgon kan vi gå igenom det på 10 minuter — jag har en full rapport med tekniska detaljer, skärmdumpar på spam-URL:erna och exakt åtgärdsplan. Säg bara när det passar.

Finns också möjlighet att du tittar på en av spam-URL:erna själv just nu, så ser du vad jag menar:
`https://ilmonte.se/casino-med-omedelbar-ingen-insättnings-bonus/`

Den är live. Fullständig casino-sida på er domän.

Hör av dig så pratar vi.

Med vänlig hälsning,
Mikael Larsson
Searchboost
mikael@searchboost.se
