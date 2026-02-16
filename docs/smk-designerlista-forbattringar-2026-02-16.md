# Designerlista: ny.smalandskontorsmobler.se

**Datum:** 2026-02-16
**Utfard av:** Searchboost (teknisk + designanalys)
**Syfte:** Komplett forbattringslista for designergenomgang
**Sajt:** https://ny.smalandskontorsmobler.se/
**Tema:** GeneratePress 3.6.1 + WooCommerce 10.5.1
**CSS:** ~16 KB custom CSS i Customizer (smk-design v6)

---

## 1. VISUELL DESIGN

### Typografi

1. **Tre fontfamiljer laddar samtidigt via Google Fonts (Inter + Space Grotesk + Playfair Display)**
   Problem: Tre separata Google Fonts-anrop okar laddningstiden och skapar 600+ ms render-blockering. Dessutom laddar Inter med 6 vikter (300-800) varav bara 3-4 anvands.
   Forslag: Begrans till max 2 fontfamiljer. Anvand Inter for brodtext och Space Grotesk for rubriker. Playfair Display anvands bara pa 3-4 stallen (hero-brand, catbox-name, duo-title) och kan ersattas med Space Grotesk i italics eller en CSS font-weight-variation. Ladda fonts via `font-display: swap` och `preconnect`.

2. **Inkonsekvent rubrikhierarki pa startsidan**
   Problem: Det finns tva H1-taggar pa startsidan -- en dold ("Hem" i entry-title) och en synlig i hero-sektionen ("Arbetsro pa ditt kontor"). Dubbla H1:or ar daligt for bade SEO och tillganglighet.
   Forslag: Ta bort den dolda H1:an helt (inte bara `display:none`). Lat hero-titeln vara enda H1. Kontrollera att varje sida har exakt en H1.

3. **Produkttitlar i grid klipps med -webkit-line-clamp: 2**
   Problem: Manga produktnamn ar langa (t.ex. "SUN-FLEX Hideaway Chair hopfallbar kontorsstol for flexibla") och klipps mitt i ett ord. Det ser oprofessionellt ut och gor det svarare att identifiera produkten.
   Forslag: Visa hela produktnamnet med max 3 rader. Alternativt: korta ner produktnamnen i WooCommerce (ta bort overflodiga ord som "for flexibla arbetsplatser"). Lagg till en `title`-attribut pa produktlanken sa att fullstandigt namn visas vid hover.

4. **For liten fontstorlek pa produkttitlar pa mobil (0.72rem vid <480px)**
   Problem: Vid 480px gar produkttitlarna ner till 0.72rem (~11.5px) vilket ar under minimistandarden for lasbarhet (12px). Kunder med nedsatt syn kan inte lasa produktnamnen.
   Forslag: Satt minsta fontstorlek till 0.8rem (12.8px) for produkttitlar. Overlag bor ingen text pa sajten vara mindre an 12px.

5. **Radavstand pa rubriker ar for tatt (line-height: 1.15)**
   Problem: Rubriker med line-height 1.15 ser tranga ut, sarskilt pa flerradiga rubriker pa mobil. Texten "klistrar ihop" raderna.
   Forslag: Oka rubrikernas line-height till 1.25-1.3 for battre lasbarhet, sarskilt pa H2 och H3.

6. **Brodtextens fontstorlek varierar mellan sektioner**
   Problem: Hero-beskrivning ar 1.1rem, duo-text ar 0.95rem, CTA-text ar 1rem, SEO-text ar 0.93rem, footer ar 0.88rem. Aven USP-titlar (0.88rem) och USP-sub (0.78rem) kanner sig for sma.
   Forslag: Definiera en tydlig typografisk skala: body 1rem, small 0.875rem, caption 0.8rem. Anvand dessa konsekvent over hela sajten.

### Farger och kontrast

7. **Hero-beskrivning har otillracklig kontrast (ljusgron #d4ddd3 pa morkgron bakgrund)**
   Problem: Fargkombinationen `color: #d4ddd3` pa `background: linear-gradient(#566754, #3a4738)` ger ett kontrastforhallande pa cirka 2.8:1 -- langt under WCAG AA-kravet pa 4.5:1 for normal text.
   Forslag: Andra hero-desc-fargen till #e8f0e7 eller #ffffff med opacity 0.85 for att uppna minst 4.5:1 kontrast.

8. **Textfargen #888 (--smk-text-light) pa vit bakgrund klarar inte WCAG AA**
   Problem: #888 pa #ffffff ger kontrastforhallande 3.5:1 -- under WCAG AA:s krav pa 4.5:1. Denna farg anvands for USP-undertitlar, priser (del/sale), breadcrumbs och produktmeta.
   Forslag: Byt #888 mot #666 eller #6b6b6b for att na minst 4.5:1 kontrast.

9. **Brons-fargen (#B48C5A) pa vit bakgrund har lag kontrast for sma texter**
   Problem: #B48C5A pa #ffffff ger 2.9:1 kontrast -- inte tillrackligt for bruktexter. Anvands for priser, eyebrow-labels och CTA-lankar.
   Forslag: Morkna brons till #8C6D3F (#9a7549 ar nara men otillracklig) eller anvand den enbart pa storlek >=18px/bold. For sma texter, anvand en morkare variant.

10. **For manga accentfarger utan tydlig hierarki**
    Problem: Sajten anvander olive (#566754), bronze (#B48C5A), coral (#d5694e), plus gron for "lagervara"-badge. Det skapar otydlighet kring vilken farg som signalerar vad. Coral anvands i GeneratePress-temats knappar, bronze i custom-knappar -- samma typ av element har tva farger.
    Forslag: Definiera en tydlig fargroll-modell: olive = primarfarg (navigation, brand), bronze = accentfarg (knappar, CTA, priser), coral = begransad till varningsmeddelanden/sale. Ta bort coral fran knappar i GeneratePress-temat.

11. **Bakgrundsfargen #e8e5dc (GeneratePress) vs #f5f2eb (--smk-beige) skapar subtil fargkrock**
    Problem: GeneratePress-temats bakgrund ar #e8e5dc men CSS-variabeln --smk-beige ar #f5f2eb. Beroende pa var pa sidan man ar kan bakgrunden skifta en aning.
    Forslag: Synka GeneratePress body background med --smk-beige (#f5f2eb) sa att en enda bakgrundsfarg anvands konsekvent.

### Whitespace och layout

12. **Category-boxarna pa startsidan har ojamn layout (6 boxar i 2-kolumns-grid)**
    Problem: 6 kategorier i ett 2-kolumns-grid ger 3 rader -- men visuellt ser raderna likadana ut. Det finns inget visuellt avbrott eller variation. Dessutom saknas 2 kategorier (Receptionsdiskar och Utomobler) i category-boxarna.
    Forslag: Andra till 3 kolumner med de 2 viktigaste kategorierna som storsta (feature-storlek, full bredd eller 2/3). Alternativt: 3+3 med en liten vertikal variation i hojd for visuell dynamik.

13. **USP-baren saknar ikoner**
    Problem: CSS refererar till .smk-usp-svg-wrap for ikoner men HTML:en saknar SVG-ikoner i varje USP-item. Bara text visas (Fri frakt, Garanti, Snabb leverans, Personlig kontakt). Utan ikoner tappar baren visuell vikt och skannbarhet.
    Forslag: Lagg till relevanta SVG-ikoner: lastbil (frakt), skold (garanti), klocka/blixt (snabb leverans), telefon (personlig kontakt). Ikonerna bor vara 24-36px i brons-fargen.

14. **For lite andrum mellan hero och USP-bar**
    Problem: USP-baren overlappar hero-sektionen med `margin: -28px 0 40px`. Overlap-effekten ar snygg i princip men skapar problem pa mellanstora skarmar (1024px) dar baren ser ut att "flyta" pa ett konstigt satt.
    Forslag: Fixa overlap-marginalen specifikt for breakpoints 768-1200px. Testa noggrant pa iPad (1024px) och smala laptops.

15. **Inconsistent padding i footer-widgets**
    Problem: Footer har 60px padding-top pa desktop men 32px pa mobil. Springet ar for stort -- mellanskarmar (768-1024px) har ingen egen breakpoint for footer.
    Forslag: Lagg till en mellanliggande breakpoint (1024px) med 48px padding for smidigare overgang.

16. **Startsidans content slutar abrupt efter duo-grid**
    Problem: Startsidan har hero, USP-bar, category-boxar och duo-grid -- sedan... inget mer. Inget produktkarusell, ingen CTA-sektion, ingen "Varfor valja oss", ingen kundrecension. CSS definerar klasser som .smk-cta-section, .smk-why-section, .smk-about-section och .smk-product-section men de anvands inte i HTML:en.
    Forslag: Lagg till de sektioner som redan har CSS men saknar HTML: Populara produkter (smk-product-section), "Varfor Smalands Kontorsmobler" (smk-why-section), kundcitat (smk-cta-section) och kort om-oss (smk-about-section). Startsidan behover minst 3-4 sektioner till.

### Bildkvalitet

17. **Hero-logon (smk-logo-vit-2021.png) har manuell margin-right offset**
    Problem: CSS har `margin-right: 42px !important` pa hero-logon for att centrera den. Det ar en hack-fix som tyder pa att logobilden har ojamn padding eller whitespace inbakad i filen.
    Forslag: Redigera sjalva logobildfilen sa att den ar korrekt centrerad. Ta bort margin-offset-hacket.

18. **Logotypen (svart_alg.png) ar 64 KB -- for stor for en logotyp**
    Problem: Logobilden ar en PNG pa 64 KB. Den anvands pa 3 stallen (header, nav-brand, footer) och laddas varje gang.
    Forslag: Konvertera logon till SVG for perfekt skarpa pa alla storlekar och minimal filstorlek (~3-5 KB). Alternativt: optimera PNG:n till <15 KB med TinyPNG.

19. **Kategori-bilderna pa startsidan ar 1024x683px (JPG) -- for tunga for bakgrundsbilder**
    Problem: Kategori-boxarna anvander bakgrundsbilder via CSS (`background-image: url(...)`) som ar 1024px breda. Pa mobil (320-480px) laddas fortfarande 1024px-bilderna. Ingen srcset/responsive finns for bakgrundsbilder.
    Forslag: Skapa bildvarianter i 3 storlekar (480, 768, 1024px) och anvand media queries eller `image-set()` i CSS for att ladda ratt storlek. Konvertera till WebP for ytterligare 30% besparing.

20. **Manga produktbilder saknar alt-text eller har generisk alt-text**
    Problem: Produktbilder i WooCommerce har automatgenererade alt-texter som oftast bara ar produktnamnet. Kategoriernas background-images har ingen alt-text alls (det ar CSS-bakgrunder).
    Forslag: Lagg till beskrivande alt-texter pa alla produktbilder. For kategori-boxarna: anvand `<img>` istallet for `background-image` sa att alt-text kan anvandas, eller lagg till `role="img"` och `aria-label` pa div:en.

21. **Duo-grid bilderna (Mikael + Kontor) har `title="Hem - searchboost"`**
    Problem: Bildernas title-attribut ar "Hem - searchboost" vilket ar meningslost for anvandaren och visar att Searchboost byggt sajten. Det ska inte vara synligt for besokare.
    Forslag: Andra title-attributet till nagonting relevant ("Mikael Nilsson - Kontorsmobelexpert") eller ta bort det helt.

### Hover-effekter och animationer

22. **Produktkort-hover (translateY -4px) ar subtil men inkonsekvent**
    Problem: Produktkort lyfts 4px vid hover, men kategoriboxar skalas 1.015x. Duo-kort lyfts 4px. Det ar 3 olika hover-effekter pa 3 liknande element pa samma sida.
    Forslag: Standardisera till EN hover-effekt for alla kortliknande element. Forslag: `transform: translateY(-4px)` + `box-shadow: var(--smk-shadow-md)` for alla.

23. **Transitions pa `all .3s ease` overallt**
    Problem: `transition: all .3s ease` ar satt pa manga element via `--smk-transition`. Att transitionera "all" ar en prestandabov -- det transitionerar aven layout-egenskaper som inte ska animeras.
    Forslag: Andra till specifika transitions: `transition: transform .3s ease, box-shadow .3s ease, opacity .3s ease`. Undvik att transitionera `all`.

24. **Produktbilder zoomar in vid hover (scale 1.05) utan overflow-kontroll pa alla breakpoints**
    Problem: Pa smala skarmar kan den skalade produktbilden "svamma over" narbliggande element om overflow:hidden inte konsekvent ar satt pa alla foraldraelement.
    Forslag: Sakerstall att alla produktkort har `overflow: hidden` pa ratt niva, aven pa mobil.

---

## 2. UX / NAVIGATION

25. **Menyn har bara 3 objekt (Sortiment, Kontakt, Kundservice) -- for fa**
    Problem: Navigationen kanns tom och ger intrycket att sajten ar ofullstandig. Det finns ingen lank till Om oss, Blogg, eller nagon form av "Inspiration/Guider".
    Forslag: Lagg till "Om oss" och "Blogg/Guider" i huvudmenyn. Overlag en menu med 5-6 objekt plus Sortiment-dropdown. For storforetag: lagg till "Foretag" eller "Inredningsservice" som menyval.

26. **"Sortiment"-dropdownen listar kategorier utan hierarki**
    Problem: Alla 8 kategorier (Bord, Sittmobler, Forvaring, Belysning, Ljudabsorbenter, Receptionsdiskar, Utomhus mobler, Tillbehor) listas platt i dropdownen. Inga underkategorier visas, ingen gruppering.
    Forslag: Skapa en mega-meny med 2-3 kolumner: "Arbetsplats" (Bord, Stolar, Tillbehor), "Inredning" (Forvaring, Belysning, Ljudabsorbenter), "Ovrigt" (Receptionsdiskar, Utomobler). Lagg till kategoriikoner eller smabilder for visuell igenkanning.

27. **Sokfaltet i navigationen ar inte kopplat till WooCommerce-sok**
    Problem: Sokfaltet har id `smk-ai-search-input` och ar troligen kopplat till AI-chatten, inte till WordPress produktsok. Det finns inget synligt satt att soka produkter direkt.
    Forslag: Koppla sokfaltet till WooCommerce:s produktsok (`?s=&post_type=product`). Lagg till autocomplete/suggestions baserat pa produktnamn. Visa resultat i en dropdown under sokfaltet.

28. **Inget sokalternativ pa mobil**
    Problem: Sokfaltet ar dolt pa mobil (`@media max-width: 768px: .smk-nav-search { display: none }`). Mobilbesokare har inget satt att soka produkter.
    Forslag: Lagg till en sok-ikon i mobilnavet som oppnar ett fullskarms-sokfalt overst pa sidan. Sok ar kritiskt for e-handel -- det bor aldrig doljas.

29. **Breadcrumbs saknas pa startsidan och ar minimala pa ovriga sidor**
    Problem: Breadcrumbs finns pa kategorisidor (via WooCommerce) men ar stylade minimalt (0.8rem, ljusgra). De ar inte synliga pa kontakt, om oss, kundservice.
    Forslag: Lagg till breadcrumbs pa alla sidor utom startsidan. Oka fontstorleken till 0.85rem och ge dem tydligare visuell narvaro med separator-pilar istallet for /.

30. **Kontaktsidan saknar kontaktformular**
    Problem: Kontaktsidan visar bara text med adress, telefon och e-post. Det finns inget formullar for att skicka meddelanden direkt. Besokaren maste oppna sin e-postklient.
    Forslag: Lagg till ett kontaktformular med falt for namn, e-post, telefon, amne och meddelande. Anvand samma design som kategorisidornas kontaktformular (smk-catform).

31. **Kundservicesidan ar en textvagg utan struktur**
    Problem: All information om leverans, returer, garanti och reklamationer presenteras som lopande text utan visuella avbrott, ikoner eller expanderbara sektioner.
    Forslag: Dela upp i ett FAQ-accordion-format med klickbara sektioner. Lagg till ikoner for varje amnesomrade. Anvand kort-layout (cards) for de vanligaste fragorna.

32. **Ingen "Tillbaka till toppen"-knapp pa langa sidor**
    Problem: GeneratePress har en back-to-top-knapp men den ar nastan osynlig (`opacity: 0.1`). Pa langa kategorisidor med 30+ produkter behover anvandaren scrolla langt.
    Forslag: Oka opaciteten till 0.6 och anvand brons-fargen. Gor knappen storre (48x48px) med en tydlig uppil.

33. **AI-chatten star i vagen for varukorg-ikonen pa mobil**
    Problem: Chat-bubblan sitter i nedre hogra hornet (bottom:24px, right:24px) vilket kan overlappa med varukorg-CTA och andra interaktiva element pa smala skarmar.
    Forslag: Flytta chatbubblan till nedre vanstra hornet pa mobil, eller gor den dragbar. Alternativt: dolt den som standard pa mobil och lat den bara oppnas via en meny-ikon.

34. **Varukorgsikonen visar inget antal artiklar**
    Problem: HTML:en for cart-countern ar tom -- `<a href=".../cart/" class="smk-nav-cart">` utan nagon `.smk-cart-count` span med siffra. Anvandaren vet inte om det finns nagot i varukorgen.
    Forslag: Lagg till WooCommerce cart fragment for att visa antal artiklar dynamiskt. Visa en badge med siffra nar varukorgen inte ar tom.

---

## 3. E-HANDEL SPECIFIKT

### Produktkort (grid-listning)

35. **"Lagg i varukorg"-knappen ar helt dold pa produktlistningen**
    Problem: CSS doljer alla add-to-cart-knappar i produktgriden med `display: none !important`. Besokaren maste klicka sig in pa produktsidan for att kunna kopa. Det okar friktionen och minskar konverteringen.
    Forslag: Visa en diskret "Lagg i varukorg"-knapp som syns vid hover (desktop) eller alltid (mobil). Alternativt: en liten ikon-knapp (+) i nedre hogra hornet av produktkortet.

36. **Produktkorten saknar betyg/stjarnor**
    Problem: Inga produktrecensioner eller stjarnbetyg visas i griden. For en e-handel ar social proof avgorrande for konverteringen.
    Forslag: Aktivera WooCommerce-recensioner och visa genomsnittligt betyg (stjarnor) i produktkorten. Aven 0 recensioner bor visas som "Bli forst att recensera" for att uppfordra.

37. **Ingen "Snabbvy" (Quick View) pa produktkort**
    Problem: For att se nagon detalj om en produkt maste man ga in pa produktsidan. Det ar extra jobbigt pa mobil dar man forlorar sin plats i griden.
    Forslag: Lagg till Quick View-funktionalitet som oppnar en modal med produktbild, pris, kort beskrivning och "Lagg i varukorg"-knapp.

38. **Lagervara-badge ("Lagervara") saknar motsvarighet for ovriga lagerstatus**
    Problem: Produkter i lager visar en gron badge "Lagervara", men produkter som INTE ar i lager saknar nagon indikator. Kunden kan bli besviken nar de klickar in och ser "ej i lager" eller lang leveranstid.
    Forslag: Lagg till en gul/orange badge "Best.vara ~3-6 v" for produkter som inte ar lagervara. Visa tydligt pa kortet om en produkt ar slutsald.

### Kategorisidor

39. **Inga filter eller sorteringsalternativ pa kategorisidor**
    Problem: CSS doljer bade `.woocommerce-result-count` och `.woocommerce-ordering` med `display: none`. Kunden kan inte filtrera pa pris, farg, material, eller sortera efter pris/popularitet.
    Forslag: Aktivera atminstone sortering (pris hog-lag, lag-hog, popularitet, nyast). Lagg till sidofalt-filter eller filter-bar ovanfor produkter med prisintervall, material och tillganglighet (i lager/ej i lager).

40. **Kategoribeskrivningar syns bara under produkterna (SEO-text)**
    Problem: SEO-texten for kategorier visas langst ner pa sidan (smk-seo-text) men det finns ingen kort introduktionstext ovanfor produkterna som hjalper besokaren forsta vad kategorin erbjuder.
    Forslag: Visa en kort (2-3 meningar) kategoriintroduktion ovanfor produktgriden. Den langre SEO-texten kan ligga kvar langst ner.

41. **Inget "Visa antal produkter" eller "Visa fler"-kontroll**
    Problem: Alla produkter visas pa en sida utan paginering (vid fa produkter) eller med standard WooCommerce-paginering (vid manga). Kunden kan inte valja hur manga produkter per sida.
    Forslag: Lagg till "Visar 1-20 av 97 produkter" och "Visa 20 / 40 / alla" kontroller.

### Produktsidor

42. **Produktsidans layout bor ha storre bilder**
    Problem: Standard WooCommerce-layout ger produktbilden ~50% bredd. For mobler ar detaljerade produktbilder extremt viktiga for kopbeslutet.
    Forslag: Oka produktbild-kolumnen till 55-60%. Lagg till zoom-pa-hover och fullskarms-lightbox. Sakerfor att minst 3-5 bilder visas per produkt (framsida, sida, detalj, miljo, matt).

43. **Manga produkter saknar bilder eller har bara en bild**
    Problem: En stor del av de ~900 produkterna importerades fran Abicart och manga har bara leverantorens standardbild. Produkter utan bilder eller med bara en bild ser oprofessionella ut.
    Forslag: Prioritera de 20 bast saljande produkterna och lagg till minst 3 bilder per produkt. For ovriga: kontakta leverantorer for hogupplossta produktbilder. Lagg till en "bildsaknas"-placeholder som ar mer stilren an standardplaceholdern.

44. **Ingen leveransinformation pa produktsidan**
    Problem: Leveranstid (3-7 dagar for lagervara, 3-6 veckor for bestellningsvara) visas inte pa produktsidan. Kunden maste ga till Kundservice for att hitta denna info.
    Forslag: Visa leveranstid direkt under "Lagg i varukorg"-knappen. For lagervara: "Leverans inom 3-7 arbetsdagar". For bestellningsvara: "Leverans inom 3-6 veckor".

45. **Priset visar inte "inkl./exkl. moms" tydligt**
    Problem: Priser visas utan tydlig momsindikation. For B2B-kunder (smaforetag) ar det viktigt att veta om priset ar exkl. eller inkl. moms.
    Forslag: Visa "inkl. moms" efter priset i liten text. Erbjud en toggle "Visa pris exkl. moms" for foretag.

46. **Produktflikar (Tabs) har bara "Beskrivning" -- saknar tekniska specifikationer**
    Problem: WooCommerce-tabs visar ofta bara en flik. Saknar separata flikar for tekniska data (matt, vikt, material, farg), leveransinformation, och recensioner.
    Forslag: Strukturera produktinformationen i 3-4 flikar: Beskrivning, Specifikationer (tabell), Leverans och Recensioner. Anvand WooCommerce custom fields for att mata in strukturerad data.

47. **Relaterade produkter ("Du kanske ocksa gillar") visar slumpmassiga produkter**
    Problem: WooCommerce:s standardalgoritm valjer relaterade produkter baserat pa kategori, men resultatet ar ofta irrelevant (t.ex. en lampa som "relaterad" till ett skrivbord).
    Forslag: Konfigurera relaterade produkter manuellt for nyckelproduktterna, eller anvand cross-sells och upsells i WooCommerce. Alternativt: "Andra kunder tittade ocksa pa" baserat pa kategori + prisintervall.

### Varukorg och checkout

48. **Varukorgen (cart) saknar cross-sell/upsell-produkter**
    Problem: Varukorgen visar bara tillagda produkter utan forslag pa kompletterande produkter. CSS for cross-sells finns (.smk-cross-sell-section, .smk-cart-upsell) men troligen anvands de inte pa cart-sidan.
    Forslag: Lagg till 2-4 relevanta tillbehor/kompletterande produkter pa varukorgsidan. T.ex. om kunden har ett skrivbord -- foreslaj monitorarm, bordsskarm, kabelhallare.

49. **Inget mini-cart/sidopanel vid "Lagg i varukorg"**
    Problem: Nar en produkt laggs i varukorgen (via knapp pa produktsidan) visas bara ett WooCommerce-meddelande hogst upp pa sidan. Ingen sidopanel eller mini-cart oppnas.
    Forslag: Implementera en slide-in mini-cart fran hoger sida som visar tillagda produkter, totalsumma och knappar for "Fortsatt handla" och "Till kassan". Det minskar avhopp och okar AOV.

50. **Checkout-sidan har ingen fortroendesignal (trust badges)**
    Problem: Under betalning visas inga betalikoner eller sakerhetsmarkeringar. Trygg E-handel-certifikat finns i footern men inte vid sjalva betalningsmomentet.
    Forslag: Visa Visa/Mastercard/Swish-ikoner och Trygg E-handel-badge direkt bredvid betalknappen. Lagg till "Saker betalning"-text med hanglasikon.

---

## 4. BRANDING

51. **Logotypen (alg-silhuett) ar alltid inverterad vit -- saknar fargversion**
    Problem: Logon visas alltid som vit (via CSS `filter: brightness(0) invert(1)`) i navigationen. Det finns ingen fargversion av logon synlig nagonstans pa sajten (forutom favicon).
    Forslag: Skapa en fargversion av logon (svart/morkgron alg) for anvandning pa ljusa bakgrunder. Anvand den i footern, pa Om oss-sidan och i e-postmallar.

52. **Favicon returnerar 302-redirect istallet for en riktig favicon**
    Problem: `curl favicon.ico` returnerar en 302-redirect (0 bytes). Det betyder att faviconen troligen saknas eller ar felkonfigurerad. Utan favicon ser sajten oprofessionell ut i browserflikar och bokmarken.
    Forslag: Skapa en ordentlig favicon-uppsattning: favicon.ico (32x32), apple-touch-icon (180x180), og:image. Anvand alg-logon i gront/svart som favicon.

53. **Ingen site-tagline eller USP i meta/og:title**
    Problem: Sidtiteln ar bara "Hem - Smalands Kontorsmobler". Det saknar en USP eller lockande tagline som "Noggrant utvalda kontorsmobler for produktiva arbetsmiljoer".
    Forslag: Andra title-formatet till "Smalands Kontorsmobler | Kontorsmobler for produktiva arbetsmiljoer" for startsidan. Varje sida bor ha en unik och beskrivande title.

54. **Ingen OG:image (social media preview-bild) pa startsidan**
    Problem: Startsidans Open Graph-taggar saknar og:image. Nar sajten delas pa Facebook/LinkedIn visas ingen preview-bild -- bara text.
    Forslag: Skapa en OG-image (1200x630px) med logotyp, tagline och en snygg kontorsmiljo-bild. Lagg till i Rank Math for startsidan och som fallback for alla sidor.

55. **Blandad namngivning: "Smalandsmobler AB" vs "Smalands Kontorsmobler"**
    Problem: Pa kontaktsidan star "Smalandsmobler AB" som foretag men "Smalands Kontorsmobler" som varumarke. Pa Om oss star "Smalandsmobler". Inkonsekvent.
    Forslag: Anvand konsekvent: "Smalands Kontorsmobler" som kundriktat varumarke. "Smalandsmobler AB" enbart pa juridiska dokument (kopvillkor, integritetspolicy).

56. **Inga sociala medier-lankar**
    Problem: Footer och Om oss-sidan saknar lankar till Facebook, Instagram, LinkedIn. Schema.org-markup har tom `sameAs`-array.
    Forslag: Lagg till sociala medier-ikoner i footern. Om det inte finns aktiva kanaler -- skapa atminstone en Facebook-sida och ett Instagram-konto. Fyll i sameAs i schema-markup.

---

## 5. TEKNISKT

### Prestanda

57. **Ingen lazy loading pa kategori-boxarnas bakgrundsbilder**
    Problem: Kategori-boxarna pa startsidan anvander CSS `background-image` som inte stoder nativ lazy loading. Alla 6 bilder (1024px breda JPG:er) laddas direkt vid sidladdning -- aven de som ar under fold.
    Forslag: Byt fran `background-image` till `<img>` med `loading="lazy"`. Eller anvand Intersection Observer i JavaScript for att ladda bakgrundsbilderna forst nar de scrollas in i vyn.

58. **~16 KB custom CSS i Customizer (en enda enorm CSS-block)**
    Problem: All custom CSS (design v6) ar inbaddat i `<style id="wp-custom-css">` i head:en. 16 KB inline CSS okar HTML-storleken och blockerar rendering.
    Forslag: Flytta CSS till en separat fil (t.ex. `smk-design.css`) som kan cachas av browsern. Minifiera filen. Overlag: bryt ut kritisk CSS (above-the-fold) som inline och ladda resten asynkront.

59. **Render-blockerande scripts i <head>**
    Problem: Google Ads (`gtag.js`), GTM, Meta Pixel och jQuery laddas i `<head>` utan defer/async (forutom gtag som har async). jQuery-core och jQuery-migrate blockerar rendering.
    Forslag: Flytta alla icke-kritiska scripts till `defer` eller `async`. jQuery-migrate kan troligen tas bort helt om inga aldre plugins kraver det. Overlag till att ladda GTM asynkront.

60. **Ingen cache-header (saknar Cache-Control/Expires)**
    Problem: HTTP-response-headers visar inga cache-direktiv. Statiska resurser (CSS, JS, bilder) cachas inte effektivt av browsern.
    Forslag: Lagg till cache-headers via Nginx/Apache eller WP-plugin: `Cache-Control: public, max-age=31536000` for statiska filer (bilder, CSS, JS med versionsnummer).

61. **Ingen Content Security Policy (CSP)**
    Problem: Inga sakerhetshuvuden som CSP, X-Frame-Options eller Strict-Transport-Security synliga i HTTP-headers.
    Forslag: Lagg till grundlaggande sakerhetsheaders: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`. Implementera en enkel CSP.

### Tillganglighet (WCAG)

62. **Stangknappen i AI-chatten saknar tillracklig aria-label**
    Problem: `<button id="smk-chat-close" aria-label="Stang">` -- "Stang" ar bra men saknar kontext. Dessutom saknar chat-meddelanden ARIA-live-regioner for skarmlasar-anvandare.
    Forslag: Lagg till `aria-label="Stang chattfonstret"`. Lagg till `role="log"` och `aria-live="polite"` pa meddelandecontainern sa att nya meddelanden annonseras for skarmlasar-anvandare.

63. **Fokusordningen i mobilmenyn ar oklart**
    Problem: Nar hamburgermenyn oppnas pa mobil ar det oklart om fokus hamnar inuti menyn. Det finns ingen synlig fokusindikator pa menylankarna.
    Forslag: Lagg till synlig fokusindikator (outline eller underline) pa alla interaktiva element. Fanga fokus inuti oppnad mobilmeny.

64. **Kontrastproblem pa nagra knappar**
    Problem: Olive-fargade knappar (#566754 pa #fff text) har bra kontrast (6.4:1), men brons-knappar (#B48C5A pa #fff) har bara 2.9:1 -- under WCAG AA:s 4.5:1 for normal text.
    Forslag: Morkna brons-knappar till #8D6D3F eller anvand en morkare textfarg. Alternativt: gor knapptexten bold och minst 18px for att kvalificera for WCAG AA:s 3:1 krav for stor text.

65. **Skip-to-content-lanken synlig men otydlig**
    Problem: `<a class="screen-reader-text skip-link">Hoppa till innehall</a>` finns men anvander GeneratePress standard-stil som ar nastan osynlig nar den far fokus.
    Forslag: Styla skip-lanken med hog kontrast och tydlig position nar den far fokus (t.ex. vit bakgrund, svart text, centrerad overst).

### Schema / strukturerad data

66. **Schema.org listar openingHours som 7 dagar/vecka**
    Problem: Rank Math-schemat har `openingHours: Monday-Sunday 09:00-17:00` men foretaget jobbar bara vardagar ("Vardagar 08:00-17:00" enligt footern). Dessutom ar tiden 08:00 i footern men 09:00 i schema.
    Forslag: Uppdatera schema till `Monday-Friday 08:00-17:00`. Ta bort lordag/sondag.

67. **Produkter saknar individuell Product-schema**
    Problem: Sajten har Organisation/FurnitureStore-schema och BreadcrumbList-schema, men troligen saknar individuella produktsidor Product-schema med pris, lagerstatus, betyg och bilder.
    Forslag: Aktivera Rank Math WooCommerce SEO-schema for att auto-generera Product-schema pa varje produktsida. Inkludera `offers`, `sku`, `brand`, `image`, och `review`-markup.

68. **BreadcrumbList-schema pa startsidan ar meningslos**
    Problem: Startsidans breadcrumb-schema har 2 items som bada ar "Hem" -- det ger ingen vardefull navigation.
    Forslag: Ta bort BreadcrumbList-schema fran startsidan. Den bor bara finnas pa undersidor.

---

## 6. CONTENT

### Startsida

69. **Startsidan saknar socialt bevis (kundrecensioner/referenscase)**
    Problem: Det finns inga kundcitat, betyg, logotyper fran nojda kunder eller referenscase pa startsidan. For B2B-mobelkop ar fortroende en av de viktigaste faktorerna.
    Forslag: Lagg till en sektion med 2-3 korta kundcitat med foretag, namn och bild. Alternativt: "Betrodd av 500+ foretag i Sverige" med en rad logotyper.

70. **Startsidan saknar produktkarusell/bestsellers**
    Problem: Trots att sajten har ~900 produkter visas INGA produkter pa startsidan. Besokaren maste klicka sig till en kategori for att se nagonting. Det okar bounce rate avsevart.
    Forslag: Lagg till en "Populara produkter"- eller "Nyinkommet"-sektion med 4-8 produktkort. Anvand CSS som redan definierats (.smk-product-section).

71. **Hero-knapparna leder till 2 specifika kategorier (Bord + Stolar)**
    Problem: "Se alla bord" och "Se alla stolar" ar valdigt specifika CTA:er. En besokare som letar efter belysning eller forvaring kan kannas forbisedd.
    Forslag: Andra till bredare CTA:er: "Utforska sortimentet" (primar) och "Boka radgivning" (sekundar). Det breddar intressespan och ger en mjukare ingangspunkt.

72. **Hero-beskrivningen ar generisk**
    Problem: "Noggrant utvalda kontorsmobler som skapar produktiva arbetsmiljoer" ar korrekt men kanslolost. Det saknar nagonting unikt for just Smalands Kontorsmobler.
    Forslag: Framhav det unika: "Handplockade kontorsmobler fran Smaland. Over 15 ars erfarenhet -- fran enskild arbetsplats till helt kontor." Visa nyckeltal: "900+ produkter", "Fri frakt over 5000 kr".

### Om oss

73. **Om oss-sidan saknar bilder**
    Problem: Sidan ar ren text. Det finns inga bilder pa Mikael, lagret/kontoret i Virserum, produkter i anvandning, eller teamet. For en personlig foretag (B2B kontorsmobler) ar ansikten avgorrande for fortroende.
    Forslag: Lagg till: professionellt foto pa Mikael, bild pa lagret i Virserum, 2-3 bilder pa referensprojekt (inredda kontor). Anvand samma duo-grid-layout som pa startsidan.

74. **Om oss-sidan namner "designer Mikael Nilsson" men startsidan bara "Mikael Nilsson"**
    Problem: Inkonsekvent titulering skapar forvirring.
    Forslag: Bestam en titel och anvand den konsekvent: "Mikael Nilsson, grundare" eller "Mikael Nilsson, kontorsmobelradgivare".

### Blogg

75. **Bloggen returnerar 404 pa /blogg/**
    Problem: URL:en /blogg/ ger en 404-sida. Blogginlagg finns (4 st publicerade) men blogg-sidan ar inte konfigurerad i WordPress.
    Forslag: Skapa en blogg-sida via WordPress Installningar > Lasning > "Inlaggssida". Lagg till i menyn.

76. **Blogginlagg anvander bilder fran extern Supabase-hosting**
    Problem: Bloggbilder hostas pa `csuxjmfbwmkxiegfpljm.supabase.co` istallet for lokalt i WordPress. Det skapar beroende av en tredjepartstjanst och kan leda till brutna bilder om Supabase-kontot andras.
    Forslag: Ladda ner alla bloggbilder till WordPress media library och uppdatera bildlankarna.

77. **Bloggartiklar saknar intern lankning till produkter**
    Problem: Artikeln om hoj-och-sankbara skrivbord listar fordelar och jarlforelser -- men lankar inte till nagon specifik produkt pa sajten. Det ar missat konverteringstillfalle.
    Forslag: Lagg till produktrekommendationer (2-3 specifika produkter med bild och pris) integrerade i artikeltexten. T.ex. "Vi rekommenderar [produktnamn] -- se den har".

78. **Blogginlagg har oppen kommentarsfunktion**
    Problem: `"comment_status": "open"` -- WooCommerce/WordPress-kommentarer ar oppna pa bloggartiklar. Utan moderering kan detta leda till spam.
    Forslag: Stang kommentarer pa alla blogginlagg. Hanleda istallet till AI-chatten eller kontaktformuler for fragor.

### Kontakt

79. **Kontaktsidan har tva separata kontaktblock med delvis overlappande info**
    Problem: Ena blocket har "Smalandsmobler AB, Solhemsgatan 23" och mikael@smalandskontorsmobler.se. Andra blocket har "Smalands Kontorsmobler" och info@smalandskontorsmobler.se. Tva adresser, tva e-postadresser -- forvirrande.
    Forslag: Slaj ihop till ETT kontaktblock med all info. Anvand "Smalands Kontorsmobler" som varumarke, info@ som primar e-post, Mikael som kontaktperson.

80. **Ingen karta eller vagbeskrivning**
    Problem: Adressen "Solhemsgatan 23, Virserum" namns men det finns ingen inbaddad Google Maps-karta.
    Forslag: Byt till en enkel karta (Google Maps embed eller statisk bild) som visar var butiken ligger. Speciellt viktigt for lokala kunder som kanske vill besoka.

---

## 7. MOBILSPECIFIKT

81. **Navigationen pa mobil saknar logo-text**
    Problem: Pa mobil visas bara alg-ikonen utan "Smalands Kontorsmobler"-text. For nya besokare kan det vara oklart vilken sajt de ar pa.
    Forslag: Visa en fortkortad text "SMK" bredvid logon pa mobil, eller anvand en bredare logotyp-bild som inkluderar texten.

82. **Mobila produktkort har valdigt liten touchyta**
    Problem: Pa 480px ar produktkorten smala (ca 150px breda) med liten text (0.72rem). Det ar svart att trycka pa ratt produkt, sarskilt for aldre anvandare.
    Forslag: Oka minsta touchyta till 48x48px for klickbara omraden. Overlig att visa 1 produkt per rad pa extra smala skarmar (<360px) istallet for 2.

83. **Hero-knapparna ar 100% bredd pa mobil -- men maxar pa 280px**
    Problem: `width: 100%; max-width: 280px;` skapar smala knappar centrerade pa skarmen. Pa skarmar 360-768px ser de konstigt sma ut i forhallande till bredden.
    Forslag: Ta bort max-width-begransningen och lat knapparna fylla sin container (med padding). Alternativt: satt max-width: 360px for battre balans.

84. **Inget sticky add-to-cart pa produktsida (mobil)**
    Problem: Pa en lang produktsida maste mobilanvandare scrolla tillbaka upp for att trycka "Lagg i varukorg". Det finns inget sticky-kop-element i botten av skarmen.
    Forslag: Lagg till en sticky bottom-bar pa mobil med pris + "Lagg i varukorg"-knapp som foljer med nar anvandaren scrollar produktbeskrivningen.

85. **Hamburgermenyn har inget animerat oppna/stang**
    Problem: Menyn oppnas/stangs abrupt utan animation (display:none/block). Det kanns omodernt och plotsligt.
    Forslag: Lagg till slide-down-animation (max-height transition eller transform) nar menyn oppnas. 200-300ms ar lagom.

---

## 8. KONVERTERINGSOPTIMERING (CRO)

86. **Inget "Nylanserat"- eller "Basta pris"-badge pa produkter**
    Problem: Forutom "Rea"-badge finns inga markeringar som hjalper kunden att identifiera intressanta produkter. Alla produkter ser likadana ut i griden.
    Forslag: Lagg till badges som "Populart val", "Personlig favorit" (Mikaels rekommendation), "Nyhet" eller "Bast i test" for att skapa visuell hierarki och guida kunden.

87. **Inget erbjudande eller incentiv for forstagangsbesokare**
    Problem: Det finns ingen popup, banner eller topbar som erbjuder nagonting till forstagangsbesokare (t.ex. 10% pa forsta kopit, fri frakt, nyhetsbrev-rabatt).
    Forslag: Lagg till en diskret topbar (ovanfor nav) med aktuellt erbjudande: "Fri frakt pa allt over 5 000 kr" eller "10% pa forsta bestallningen -- anvand kod VALKOMMEN". Inte popup -- det irriterar.

88. **Telefonnumret ar inte tillrackligt framtradande**
    Problem: Telefonnumret (070-305 23 56) syns bara i USP-baren och footern. For en personlig kontorsmobelraadgivare borde telefonnumret vara en av de mest framtradande delarna av sajten.
    Forslag: Lagg till telefonnumret i navigationen (desktop) och som sticky CTA pa mobil. Format: "Ring oss: 070-305 23 56" med telefonikon.

89. **Ingen "Begar offert"-funktion forutom i AI-chatten**
    Problem: For B2B-kunder som vill kopa storre kvantiteter eller hela kontorsinredningar finns det ingen tydlig "Begar offert"-knapp. Offertformularet ar gomt inuti AI-chatten.
    Forslag: Lagg till en tydlig "Begar offert"-knapp i navigationen och pa produktsidor (bredvid "Lagg i varukorg"). Ledda till ett dedikerat offertformular.

90. **Exit intent eller abandoned cart-aterhamtning saknas**
    Problem: Det finns ingen mekanism for att aterhemta besokare som ar pa vag att lamna sajten eller har overgivna varukorgar.
    Forslag: Implementera abandoned cart e-post via WooCommerce (kravler konto/e-post vid checkout). Overlag en diskret "Behover du hjalp?"-meddelande om besokaren ar pa vag bort fran checkout.

---

## 9. OVRIGA FORBATTRINGAR

91. **Ingen 404-sida designad**
    Problem: 404-sidan ("Page Not Found") visar bara standard GeneratePress-layout med basic text. Nar /produktkategori/kontorsstolar/ laddades returnerades en 404 (kategori-URL-struktur ar /product-category/ inte /produktkategori/).
    Forslag: Designa en snygg 404-sida med: sok-falt, lankar till populara kategorier, kontaktinfo, och en vagledande text ("Sidan hittades inte, men vi hjalper dig hitta ratt").

92. **Kopvillkor och Integritetspolicy ar troligen standard-mallar**
    Problem: Dessa sidor ar ofta autogenererade och saknar visuell design.
    Forslag: Styla dessa sidor med samma design som ovriga sidor. Anvand accordion-sektioner for langre juridisk text. Lagg till kontaktinfo for fragor.

93. **Betalikoner i footern ar felplacerade (efter </div> for site-footer)**
    Problem: HTML:en visar att `<div class="smk-footer-trust">` med betalikoner renderas UTANFOR footer-containern. Det innebar att ikonerna kan hamna med fel bakgrundsfarg eller layout.
    Forslag: Flytta betalikoner in i footer-widgeten eller direkt ovan copyright-raden. Se till att de ar korrekt centrerade och har ratt bakgrund.

94. **Print-stylning saknas**
    Problem: Det finns inga print-specifika CSS-regler. Om en kund skriver ut en produktsida eller offert ser det troligen daligt ut.
    Forslag: Lagg till `@media print`-regler som doljer navigation, footer, chat-bubble och optimerar layout for A4.

95. **AI-chatbotens valkomstmeddelande har stavfel och saknar aao**
    Problem: Valkomstmeddelandet lyder "Hej! Jag ar din AI-assistent for kontorsmobler. Stall fragor om vara produkter..." -- alla a/a/o saknar prickar. Det bor vara "ar", "for", "Stall", "vara".
    Forslag: Fixa alla aao i chatbotens meddelanden och formularlabels. Gar igenom alla hardkodade strcangar i JavaScript.

96. **Offertformulaeret i AI-chatten saknar aao pa alla falt**
    Problem: Placeholders: "Foretagsnamn", "Kontaktperson", "Skicka offertforfragan", "Avbryt" -- alla utan aao.
    Forslag: Uppdatera alla placeholders och knapplabels med korrekt svenska: "Foretagsnamn" -> "Foretaagsnamn", "Kontaktperson" -> OK, "Skicka offertforfragan" -> "Skicka offertforfragan" (med ratt tecken).

97. **Inget nyhetsbrev-formular**
    Problem: Sajten samlar inte in e-postadresser for marknadsfo ring. Det finns ingen "Halla dig uppdaterad"-sektion eller nyhetsbrev-signup.
    Forslag: Lagg till en nyhetsbrev-signup i footern: "Fa tips om kontorsergonomi och exklusiva erbjudanden. Skriv in din e-post." Koppla till Mailchimp eller annan e-posttjanst.

98. **Ingen "Senast visade produkter"-funktionalitet**
    Problem: Det finns ingen sparning av vilka produkter besokaren tittat pa. For en katalog med 900 produkter ar det latt att tappa bort sig.
    Forslag: Lagg till en "Senast visade"-sektion (cookie-baserad) som visar de senaste 4-6 produkterna besokaren tittat pa.

99. **Kategori-URL:er saknar konsekvent struktur**
    Problem: Navigationsmenyn lankar till `/product-category/bord/` men snabblankarna i footern lankar till `/product-category/skrivbord-for-kontoret/`. Det ar tva olika URL:er for liknande innehall.
    Forslag: Synka alla lankar till samma URL-struktur. Satt up redirects fran eventuella gamla/alternativa URL:er.

100. **Sidan "Sortiment" (/sortiment/) ar troligen en tom sida**
     Problem: Menyn lankar till /sortiment/ som en foralderl ank for dropdown-kategorierna. Om nagon klickar direkt pa "Sortiment" hamnar de troligen pa en tom sida istallet for en snygg kategorioversikt.
     Forslag: Gor /sortiment/-sidan till en visuell shop-oversikt med alla kategorier presenterade med bilder, liknande startsidans kategori-boxar men mer utforligt.

---

## SAMMANFATTNING: TOP 10 PRIORITERINGAR

For designern -- detta ar de 10 viktigaste sakerna att fokusera pa forst:

| Prio | Punkt | Paverkan |
|------|-------|----------|
| 1 | Lagg till saknat startside-innehall (produkter, socialt bevis, varfor-oss) (#16, #69, #70) | Stor -- startsidan ar halvfull |
| 2 | Fixa sok pa mobil + produktsok (#28, #27) | Stor -- sok ar kritiskt for e-handel |
| 3 | Visa "Lagg i varukorg" i produktgrid (#35) | Stor -- direkt konverteringsokning |
| 4 | Lagg till filter/sortering pa kategorisidor (#39) | Stor -- grundlaggande e-handels-UX |
| 5 | Fixa kontrast/tillganglighet (#7, #8, #9, #64) | Medel -- WCAG-compliance |
| 6 | Lagg till USP-ikoner (#13) | Medel -- visuell forbattring |
| 7 | Utoka navigationen (Om oss, Blogg) + mega-meny (#25, #26) | Medel -- sajten kanns ofullstandig |
| 8 | Designa kontaktsida med formular + karta (#30, #79, #80) | Medel -- konverteringsyta |
| 9 | Fixa faviconen + OG:image (#52, #54) | Lag men grundlaggande -- brand |
| 10 | Optimera bilder och prestanda (#18, #19, #57, #58) | Lag -- teknisk skuld |

---

*Dokumentet genererat 2026-02-16 av Searchboost (teknisk analys via curl/HTML/CSS-granskning).*
*Designern rekommenderas att oppna sajten i Chrome DevTools och ga igenom varje punkt visuellt.*
