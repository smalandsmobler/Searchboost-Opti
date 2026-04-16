#!/usr/bin/env python3
"""
Publicerar 3 SEO-artiklar vecka 23 på ilmonte.se via WP REST API.
Kör: python3 publish-vecka23-artiklar.py
"""
import requests
import base64
import json

# --- Auth ---
USERNAME = "Mikael Larsson"
APP_PASSWORD = "ywpo KEIq BAlR ZtEt 6OA6 Tdh1"
BASE_URL = "https://ilmonte.se/wp-json/wp/v2"
RANKMATH_URL = "https://ilmonte.se/wp-json/rankmath/v1/updateMeta"
CATEGORY_ID = 1068

credentials = base64.b64encode(f"{USERNAME}:{APP_PASSWORD}".encode()).decode()
HEADERS = {
    "Authorization": f"Basic {credentials}",
    "Content-Type": "application/json"
}


# ============================================================
# ARTIKEL 1: Läktare och gradänger för event
# ============================================================

ARTICLE1_CONTENT = """<p>Behöver ditt event eller din arena ett professionellt läktarsystem? Oavsett om det gäller en tillfällig utomhusarena för ett musikfestival, en fast installation i en idrottshall eller gradänger för en teaterföreställning — valet av rätt läktarlösning är avgörande för publiktrygghet, logistik och helhetsupplevelse. I den här guiden går vi igenom allt du behöver veta om läktare och gradänger för event i Sverige: typer, mått, bärighet, säkerhetskrav och skillnaden mellan hyra och köp.</p>

<h2>Vad är skillnaden mellan läktare, gradänger och tribune?</h2>

<p>Begreppen används ofta omväxlande, men det finns nyanser värda att känna till:</p>

<ul>
<li><strong>Läktare</strong> — ett samlingsbegrepp för alla former av upphöjda sittplatskonstruktioner, ofta med lutande sektioner så att alla rader har fri sikt.</li>
<li><strong>Gradänger</strong> — fasta eller mobila trappstegskonstruktioner, vanliga i teater, biograf och arenor. Kan vara raka eller böjda i plan.</li>
<li><strong>Tribune</strong> — ett bredare begrepp som inkluderar både sittplats- och staplingsläktare i sportsammanhang.</li>
</ul>

<p>I praktiken avser "läktare för event" nästan alltid mobila eller halvpermanenta system som kan monteras och demonteras snabbt — i motsats till de gjutna betongkonstruktioner man finner i permanenta arenor.</p>

<h2>Typer av läktarsystem för event</h2>

<h3>Teleskopläktare</h3>

<p>Teleskopläktaren är det mest mångsidiga systemet för inomhusbruk. Konstruktionen rullar ut ur ett kompakt förvaringsutrymme och kan rymma allt från 50 till flera tusen åskådare beroende på hallens storlek. Teleskopläktare är vanliga i idrottshallar, multiarenor, mässhallar och kongressanläggningar.</p>

<p>Typiska specifikationer för teleskopläktare:</p>

<ul>
<li>Sittsektionsbredd: 450–500 mm per sittplats</li>
<li>Raddjup: 800–900 mm</li>
<li>Bärighet per löpmeter: 4–7 kN/m² (beroende på fabrikat och certifiering)</li>
<li>Installationstid: 30–90 minuter för ett system med 200–500 platser</li>
<li>Manövrering: manuell (handvev) eller elektrisk (motor)</li>
</ul>

<h3>Modulära mobila läktare</h3>

<p>Dessa system byggs upp av standardiserade aluminium- eller stålramar som kan konfigureras fritt. De passar utomhusevent, tillfälliga arenor och lokaler utan inbyggd läktarlösning. Varje sektion monteras separat och kan kombineras till raka, vinkel- eller hästskoformade arrangemang.</p>

<p>Fördelar med modulär uppbyggnad:</p>
<ul>
<li>Fri konfiguration av kapacitet och form</li>
<li>Transport i standardtrailers</li>
<li>Enkel anpassning till ojämnt underlag</li>
<li>Kan kombineras med scenpodier och barriärsystem</li>
</ul>

<h3>Utomhusläktare</h3>

<p>Utomhusläktare dimensioneras för väderexponering och tillåts normalt bära mer dynamisk belastning än inomhussystem. De utförs ofta i varmförzinkad eller pulverlackad stål med perforerade aluminiumpaneler som klarar regn och vind utan att skapa vattenansamlingar.</p>

<p>Viktiga faktorer vid utomhusinstallationer:</p>
<ul>
<li>Vindlast enligt Eurokod 1 (EN 1991-1-4) — konstruktionen ska klara den lokala vindhastighetszonen</li>
<li>Markbärighet — läktarfötterna ger punktlaster; undvik instabil mark utan grundplattor</li>
<li>Lutning på underlag — kompenseras med justerbara fötter, max ±5 % rekommenderas</li>
<li>Halkskydd på sittdäck och gångvägar</li>
</ul>

<h2>Säkerhetskrav och standarder — EN 13200</h2>

<p>I Sverige och övriga EU regleras åskådarplatser framför allt av <strong>EN 13200-serien</strong> (Tillskådaranläggningar). Denna standard ersätter äldre nationella regler och specificerar allt från geometri till lastkapacitet och nödutrymning.</p>

<h3>De viktigaste parametrarna i EN 13200</h3>

<ul>
<li><strong>Nyttolast (EN 13200-1)</strong>: minst 4,0 kN/m² för vanliga sittläktare; stående publik kan kräva 5,0 kN/m² eller mer</li>
<li><strong>Räckeshöjd</strong>: minimum 900 mm för sittande publik (mätt från sittplanet), 1 100 mm om höjden till mark överstiger 1,0 m</li>
<li><strong>Horisontell kraft mot räcket</strong>: 3 kN/m (EN 1991-1-1)</li>
<li><strong>Gångbredd</strong>: minst 1 200 mm för gångvägar som betjänar fler än 50 personer</li>
<li><strong>Nödutrymning</strong>: maxavstånd till närmaste utgång ska inte överstiga 30 m i normal konfiguration</li>
</ul>

<p>Vid tillfälliga konstruktioner (hyrd utrustning) krävs ofta en konstruktionsberäkning undertecknad av ansvarig konstruktör, samt ibland bygglov eller anmälan till kommunen. Kontakta alltid lokal räddningstjänst och teknisk förvaltning i god tid.</p>

<h3>Besiktning och certifiering</h3>

<p>Mobila läktarsystem ska kunna uppvisa:</p>
<ul>
<li>CE-märkning med hänvisning till tillämplig standard</li>
<li>Belastningsintyg (load certificate) från oberoende provningsinstitut</li>
<li>Montagemanual med maximalt tillåten konfiguration</li>
<li>Loggbok med besiktningshistorik (viktigt vid hyra — begär alltid)</li>
</ul>

<h2>Mått och kapacitetsplanering</h2>

<p>En tumregel vid läktarplanering är att räkna med 0,45–0,50 m bredd per sittplats och 0,85–0,90 m raddjup (front till front). Det innebär att en sektion med 10 platser i bredd och 5 rader djup tar ungefär 5,0 × 4,5 m i grundyta och rymmer 50 åskådare.</p>

<p>Tänk på att:</p>
<ul>
<li><strong>Siktlinje</strong> avgör raduppstegning — i en lokal med tak 6 m och 8 rader behöver du minst 20–25 cm uppstigning per rad</li>
<li><strong>Tillgänglighet (BBR)</strong> — minst 1 % av platserna ska vara handikappanpassade med bredare yta och plats för rullstol</li>
<li><strong>Servicegångar</strong> — planera breda nog för brandbärare och medicinsk personal</li>
<li><strong>Lastkapacitet i golvet</strong> — vid hallinstallationer, kontrollera alltid golvets tillåtna punktlast</li>
</ul>

<h2>Hyra eller köpa läktare?</h2>

<p>Beslutet beror på hur ofta du behöver läktarsystemet och vilken budget du har.</p>

<h3>Fördelar med att hyra</h3>
<ul>
<li>Noll kapital bundet i utrustning</li>
<li>Flexibel kapacitet — hyr precis det antal platser du behöver per event</li>
<li>Leverantören ansvarar för underhåll, besiktning och certifiering</li>
<li>Inkluderar normalt montering och demontering</li>
<li>Passar enstaka event eller säsongsbundna behov</li>
</ul>

<h3>Fördelar med att köpa</h3>
<ul>
<li>Lägre kostnad per event vid regelbunden användning (break-even brukar nås vid 4–6 hyrtillfällen/år)</li>
<li>Full kontroll över schema och tillgänglighet</li>
<li>Kan anpassas med eget tryck/varumärke på sätena</li>
<li>Aktiveringsbar som anläggningstillgång</li>
</ul>

<p>För de flesta enstaka eller oregelbundna event är hyra klart fördelaktigast. Arenor, kommuner och eventbolag med ett flertal evenemang per år brukar däremot finna köp mer ekonomiskt på sikt.</p>

<h2>Vad Ilmonte erbjuder</h2>

<p>Ilmonte levererar och hyr ut teleskopläktare, modulära läktarsystem och gradänger för event, teater, konferens och sport i hela Sverige. Vi hjälper dig från kapacitetsplanering och siktlinjeberäkning till montering, besiktning och demontering.</p>

<p>Våra system uppfyller EN 13200 och levereras med fullständig dokumentation. Vi erbjuder även anpassade konfigurationer för specifika lokaler och eventformat — hör av dig för en kostnadsfri konsultation.</p>

<div class="las-aven">
<h3>Läs även</h3>
<ul>
<li><a href="https://ilmonte.se/scenpodier-guide-event-konferens/">Scenpodier för event och konferens — komplett guide</a></li>
<li><a href="https://ilmonte.se/scentextil-bakgrundsdukar-guide/">Scentextil och bakgrundsdukar — guide</a></li>
<li><a href="https://ilmonte.se/eventinredning-2026-minnesvard-upplevelse/">Eventinredning 2026 — skapa en minnesvärd upplevelse</a></li>
</ul>
</div>

<h2>Vanliga frågor om läktare för event</h2>

<h3>Hur lång tid tar det att montera ett läktarsystem?</h3>
<p>Ett teleskopsystem med 200–400 platser tar normalt 30–90 minuter att rulla ut och låsa. Modulära utomhusläktare med 500 platser tar vanligen 4–8 timmar beroende på markförhållanden och tillgång till maskiner. Ilmonte inkluderar alltid montering och demontering i hyresavtalet.</p>

<h3>Vilken bärighet har ett typiskt mobilt läktarsystem?</h3>
<p>Moderna certifierade system klarar minst 4,0 kN/m² (ca 400 kg/m²). Utomhussystem för stående publik dimensioneras ofta för 5,0 kN/m². Alltid det uppgivna värdet i besiktningsintyget som gäller — det är aldrig okej att överlasta.</p>

<h3>Behövs bygglov för tillfälliga läktare utomhus?</h3>
<p>I Sverige räknas tillfälliga konstruktioner (upp till 4 veckor) normalt inte som bygglovspliktiga, men kommunen kan kräva anmälan. Vid konstruktioner som överstiger 4,0 m i höjd eller 250 platser bör du alltid samråda med byggnadsnämnden och räddningstjänsten. Ilmonte kan hjälpa till med relevant dokumentation.</p>

<h3>Kan läktarsystem anpassas för lutande mark utomhus?</h3>
<p>Ja. Modulära läktarsystem har justerbara stödfötter som kompenserar för lutning upp till ca 5–8 %. Vid kraftigare lutning eller ojämnt underlag används grundsulor och stålbalkskonstruktioner som fördelar lasten. En konstruktörsgranskning rekommenderas alltid vid osäkert underlag.</p>"""


# ============================================================
# ARTIKEL 2: Hörsalsstolar och teaterinredning
# ============================================================

ARTICLE2_CONTENT = """<p>Valet av hörsalsstolar är ett av de mest genomgripande besluten när en teater, biograf, hörsalar eller ett kulturhus utrustas eller renoveras. Stolarna sitter i 30–40 år, ska klara daglig intensiv användning, tillgodose tillgänglighetskrav och bidra till rumsakustiken — samtidigt som de ska se representativa ut under hela sin livscykel. Den här guiden ger dig det tekniska och estetiska underlag du behöver för att göra rätt val 2026.</p>

<h2>Typer av hörsalsstolar — AUDYT, biograf, teater och orkester</h2>

<p>Marknaden erbjuder ett brett spektrum av system anpassade för olika verksamheter och akustiska miljöer.</p>

<h3>AUDYT-stolar (hörsalar och universitetsaulan)</h3>

<p>AUDYT är branschens vedertagna beteckning för stolar avsedda för föreläsningssalar och universitetsaulan. Utmärkande drag:</p>
<ul>
<li>Klaffas upp automatiskt (självstängande mekanism) för att underlätta passage i trång radsituation</li>
<li>Ofta utrustad med hopfällbar skrivplatta eller tablett i armstödet</li>
<li>Smalare profil — 480–520 mm bredd — för att maximera kapaciteten</li>
<li>Hög hållbarhet: uppfyller vanligen 200 000 klafftestcykler utan funktionsfel</li>
<li>Utförs ofta i formsprutad polypropen med textil eller konstläderklädsel på sits och rygg</li>
</ul>

<h3>Biografstolar</h3>

<p>Biografmöbler prioriterar komfort vid längre exponering (90–180 minuter) och rummets mörker:</p>
<ul>
<li>Bredare sits: 520–560 mm, ofta med armlöd som kan fällas upp för att skapa dubbelsäten</li>
<li>Ergonomisk lumbalstöd och djupare sits (460–480 mm djup)</li>
<li>Täckt eller dold metallram — inga reflekterande ytor i mörker</li>
<li>Cupholders och förvaringsnät under framstolens rygg vanligt förekommande</li>
<li>LED-nödutgångsbelysning integrerad i golvlisten</li>
</ul>

<h3>Teaterstolar</h3>

<p>Teaterstolen balanserar formspråk med funktion. Många teatrar väljer ett klassiskt formspråk (lackade träsiluetter, klädselstopp i sammet) som harmonierar med scenografin:</p>
<ul>
<li>Sits ofta 500–540 mm bred med generöst sittdjup</li>
<li>Armstöd i lackerat trä eller polyuretan — dekorativa men tåliga</li>
<li>Klädselmaterial: sammet, ull, möbeltyg — alla möjliga beroende på brand och budget</li>
<li>Klaffmekanism dämpad (tyst) för att inte störa föreställningar</li>
<li>Möjlighet att integrera numreringsplåtar i armstödet</li>
</ul>

<h3>Orkesterstolar</h3>

<p>Orkesterplatser och körfåtöljer har unika krav:</p>
<ul>
<li>Notstativ-utskjut eller noter-hylla under sittplanet</li>
<li>Justerbara sitshöjder (många musiker föredrar att spela stående eller halvstående)</li>
<li>Extra bred sits för celloister och kontrabasister (560–600 mm)</li>
<li>Akustiskt neutrala material — foamens densitet och klädseltygens absorption ska inte obalansera rummets akustik</li>
</ul>

<h2>Val av material och klädsel</h2>

<p>Materialet påverkar tre dimensioner: estetik, hållbarhet och akustik.</p>

<h3>Klädselval</h3>

<ul>
<li><strong>Sammet (cut pile)</strong> — klassisk teaterkänsla, god akustisk absorption, men kräver regelbunden underhållsrengöring och är känslig för repor. Livslängd: 15–20 år vid normal förslitning.</li>
<li><strong>Kontraktstyg (woven fabric)</strong> — hög nötningsmotstånd (Martindale &gt;100 000 cykler), lätt att underhålla, finns i brett färgspektrum. Populäraste alternativet för hörsalar.</li>
<li><strong>Konstläder / ekologiskt läder</strong> — extremt slitstarkt, rengörs med fuktad trasa, passar biografer och arenor. Svettigt vid lång sittning om inte perforerat.</li>
<li><strong>Trä (rygg och sits)</strong> — formsprutat plywood eller massivt bok/ek, slitstarkt, akustiskt reflekterande — påverkar sältan (RT60) i rummet positivt vid tomma salonger.</li>
</ul>

<h3>Akustisk påverkan — en underskattad faktor</h3>

<p>En helt klädd sittsal med 500 platser absorberar dramatiskt mer ljud när den är tom jämfört med full. Stolens akustiska absorptionskoefficient (α) vid 500 Hz bör ligga nära 0,75–0,85 för att minimera skillnaden — det kallas "populated-equivalent design" och är standard i moderna konserthusar. Fråga leverantören om α-värden för det specifika stolsalternativet.</p>

<h2>Standard SIS-EN 13200-1 och tillgänglighet</h2>

<p>SIS-EN 13200-1 (Åskådarplatser — del 1: Utformningskriterier) fastställer minimikraven för hörsalsmöbler i Sverige och Europa:</p>

<ul>
<li><strong>Sitshöjd</strong>: 420–450 mm över golv</li>
<li><strong>Sitsbredd</strong>: minimum 450 mm (mätt armstöd till armstöd)</li>
<li><strong>Knäutrymme</strong>: minimum 300 mm (bakpart av framstol till framsits)</li>
<li><strong>Nyttolast</strong>: 1,5 kN per stol plus 2,0 kN/m² på gångdäcken</li>
<li><strong>Radsavstånd (rygg till rygg)</strong>: minimum 850 mm, rekommenderat 900–950 mm vid lutande gradäng</li>
</ul>

<h3>Tillgänglighet — BBR och Plan- och bygglagen</h3>

<p>Enligt Boverkets Byggregler (BBR 29, avsnitt 3:4) ska allmänna samlingslokaler ha:</p>
<ul>
<li>Minst 1 % av platsantalet (dock minst 2 platser) som rullstolsplatser</li>
<li>Rullstolsplatser jämt fördelade i salongen, inte enbart längst bak eller längst fram</li>
<li>Sällskapsplats bredvid varje rullstolsplats (600 mm bred klaffbar stol eller tom yta)</li>
<li>Tillgängliga nödutgångar och utrymningsvägar för rörelsehindrade (evakueringsstol eller hiss)</li>
</ul>

<h2>Installation och monteringsteknik</h2>

<p>Installation av hörsalsstolar är ett hantverk som kräver precision. Felaktig montering leder till golvskador, ojämna rader och i värsta fall att stolar lossnar.</p>

<h3>Golvförankring</h3>

<p>De flesta hörsalsstolsystem förankras i betong- eller träunderlag via:</p>
<ul>
<li><strong>Infällda ankarbultar</strong> — betongankar (M8–M12) gjuts in eller slås in i förborrade hål. Passar betongdäck och kräver minimalt 80 mm djup.</li>
<li><strong>Kemisk förankring</strong> — epoxyankar för hålrum i lättklinkerblock eller spräckt betong</li>
<li><strong>Skruvankar i träunderlag</strong> — 120–150 mm konstruktionsskruvar; kräver att träunderlagets tjocklek och konstruktion specificeras</li>
</ul>

<p>Varje stolsrad monteras vanligen på en gemensam balkbas (sockelprofil av aluminium eller stål) som förankras med 600–900 mm mellanrum. Balkbasen möjliggör rak linjedragning och kompenserar för små golvvariationer.</p>

<h3>Radnumrering och stolsnumrering</h3>

<p>Branschstandard är att numreringsplåtar monteras i armstödet (höger sida, sett framifrån). Plåtarna levereras i oxideringsbeständigt aluminium med graverade eller screenprinted siffror/bokstäver. LED-integrerade nummer för mörka salonger är ett allt vanligare alternativ.</p>

<h2>Vad Ilmonte erbjuder</h2>

<p>Ilmonte levererar hörsalsstolar och teaterinredning för projekt i hela Sverige — från mindre föreläsningssalar med 50 platser till stora konsertsalar med 1 000+ platser. Vi samarbetar med ledande europeiska tillverkare och erbjuder kompletta lösningar: projektering, leverans, installation och garantiservice.</p>

<p>Vi hjälper dig att välja rätt klädselmaterial, akustisk profil och teknisk standard för just din verksamhet. Kontakta oss för en projektgenomgång.</p>

<div class="las-aven">
<h3>Läs även</h3>
<ul>
<li><a href="https://ilmonte.se/konferensstolar-vad-skiljer-en-bra-fran-en-dalig-och-hur-du-valjer-ratt/">Konferensstolar — vad skiljer en bra från en dålig?</a></li>
<li><a href="https://ilmonte.se/scenpodier-guide-event-konferens/">Scenpodier för event och konferens — komplett guide</a></li>
<li><a href="https://ilmonte.se/eventinredning-2026-minnesvard-upplevelse/">Eventinredning 2026 — skapa en minnesvärd upplevelse</a></li>
</ul>
</div>

<h2>Vanliga frågor om hörsalsstolar</h2>

<h3>Hur lång livslängd kan man förvänta sig av hörsalsstolar?</h3>
<p>Välkvalitativa hörsalsstolar har en teknisk livslängd på 25–35 år om de underhålls korrekt. Klädseln byts vanligen efter 15–20 år (sammet) eller 20–25 år (kontraktstyg). Klaffmekaniken på AUDYT-stolar certifieras normalt för 200 000 cykler, vilket vid 5 föreläsningar/dag och 250 dagar/år ger 160 år — mekaniken är alltså inte en källa till tidigt slitage.</p>

<h3>Kan befintliga stolar kläs om i stället för bytas ut?</h3>
<p>Ja, om stolsramen är intakt och inte rostad är omklädnad ofta ett kostnadseffektivt alternativ — typiskt 30–50 % av nyinköpspriset. Ilmonte erbjuder provtagning och upholsteringstjänst för de flesta stolsfabrikat på den svenska marknaden.</p>

<h3>Hur påverkar stolen akustiken i salen?</h3>
<p>En klädd stol absorberar ljud i liknande grad oavsett om den är belagd av en person eller inte. Trästolar och hårdare ytor reflekterar mer — vid tomma salonger ger det ett "hårdare" akustiskt klimat. En akustiker bör konsulteras i projekteringsfasen för att välja rätt absorptionskoefficient för stolsklädsel.</p>

<h3>Vilka certifieringar ska jag kräva av leverantören?</h3>
<p>Begär alltid: EN 13200-1 testprotokoll, brandklassintyg (klädsel minst Cfl-s1 eller Bfl-s1 för offentlig miljö), och CE-märkning med konstruktionsdeklaration (DoP). För svenska offentliga upphandlingar gäller även krav per LOU om miljöcertifiering (t.ex. ISO 14001 hos tillverkaren).</p>"""


# ============================================================
# ARTIKEL 3: Ridaskenor och scenridåer
# ============================================================

ARTICLE3_CONTENT = """<p>Ridaskenor och scenridåer är scenteknikens tysta ryggrad. Utan ett välvalt och korrekt installerat skenesystem fungerar varken ridåer, masker, ljusbarriärer eller gångkulisser som de ska — oavsett hur sofistikerad övrig scenutrustning är. I den här guiden gör vi upp med vanliga missuppfattningar och ger dig det tekniska underlag du behöver för att välja rätt ridaskenesystem för din scen, studio, utställning eller eventlokal.</p>

<h2>Vad är en ridaskenа?</h2>

<p>En ridasken är en profil eller ett spår monterat i taket eller i en rigg från vilket ridåer, draperier, ljusbommar och andra scentextilier hängs. Skenan möjliggör att textilierna kan glidas horisontellt längs skensystemet — antingen manuellt via rep och löpare eller automatiserat via motor och styrenhet.</p>

<p>Begreppet "ridasken" används brett och innefattar allt från enkla enfacetterade aluminiumskenor för hemmabruk till industriella stålspårsystem i professionella teatrar.</p>

<h2>Typer av ridaskenor</h2>

<h3>Rak ridasken</h3>

<p>Den vanligaste typen — en rät profil monterad i taket eller på fästen. Finns i längder från 1,5 m upp till 12 m i ett stycke; längre installationer monteras med skarvar.</p>

<p>Tekniska specifikationer för standard aluminiumskenesystem:</p>
<ul>
<li>Profildimension: typiskt 35 × 15 mm (enkelt) till 60 × 30 mm (tungt bruk)</li>
<li>Materialvikt: 0,8–2,5 kg/lm beroende på profil</li>
<li>Lastkapacitet: 15–80 kg/lm beroende på systemtyp och upphängningsavstånd</li>
<li>Ytbehandling: eloxerad aluminium (silver, svart, vit), pulverlack eller varmförzinkat stål</li>
<li>Löpare (rullor): nylonhjul på stålaxel, lastkapacitet 5–30 kg per löpare</li>
</ul>

<h3>Kurvsken och böjbara skenor</h3>

<p>Böjbara ridaskenor tillverkas vanligen av aluminiumlegeringen 6063-T5 som är mjuk nog att böjas kall utan att spricka. De kan levereras förbockade efter ritning eller i rakskenemeter som böjs på plats.</p>

<p>Kurvskensystem är vanliga i:</p>
<ul>
<li>Halvrunda eller hästskoformade scener (theater-in-the-round)</li>
<li>Biosalonger med böjd skärm</li>
<li>Utställningar och mässor med organiska rumsbildningar</li>
<li>Sjukhus och institutioner där ridåer delar upp rum i böjda partitioner</li>
</ul>

<h3>Spårskensystem för hängande ridåer</h3>

<p>Spårskensystem (också kallade T-spår eller H-spår) har en djupare profil som bildar ett inneslutande spår. Ridåns övre kant fästs direkt i spåret via krokar eller clips som glider inuti profilen. Systemet ger ett renare estetiskt utseende eftersom löparna inte syns utifrån.</p>

<p>Spårskensystem lämpar sig för:</p>
<ul>
<li>Tung mässutrustning och utskärmdrapering (upp till 50 kg/lm)</li>
<li>Installationer där löpare inte ska synas från publikens håll</li>
<li>Motoriserade system med kedjedrift</li>
</ul>

<h2>Material — aluminium vs stål</h2>

<h3>Aluminium</h3>

<p>Aluminium är standardmaterialet i de flesta ridaskenesystem för inomhusbruk:</p>
<ul>
<li><strong>Fördelar</strong>: lätt (1/3 av stålvikten), korrosionsbeständigt, enkelt att kapa och borra på plats, lång livslängd utan underhåll, estetiskt neutralt</li>
<li><strong>Nackdelar</strong>: lägre styvhet per tvärsnittsarea jämfört med stål — vid långa spann (&gt;4 m) utan mellanupphängning kan skenan böja sig under tung last</li>
<li><strong>Typisk användning</strong>: teater, studio, utställning, konferens, scen</li>
</ul>

<h3>Stål</h3>

<p>Varmförzinkad eller galvaniserad stålsken används i krävande utomhusmiljöer eller vid mycket höga laster:</p>
<ul>
<li><strong>Fördelar</strong>: extremt hög bärighet, styvt vid långa spann, tål grovt bruk</li>
<li><strong>Nackdelar</strong>: tyngre, kräver skydd mot korrosion (zink eller pulverlack), dyrare vid komplexa profiler</li>
<li><strong>Typisk användning</strong>: utomhusscener, industriella ateljer, tunga lastbiograf-installationer</li>
</ul>

<h2>Monteringsalternativ</h2>

<h3>Takmontering</h3>

<p>Det vanligaste alternativet för permanenta installationer. Skenan fästs direkt i bärande takbjälke, betongdäck eller riggstål via:</p>
<ul>
<li><strong>Konsolfästen</strong> (L-bracket) — enkelt och billigt, monteras med betong- eller träankar var 600–900 mm</li>
<li><strong>Dragankar med gängstång</strong> — skenan hängs i justerbar gängstång (M8–M12); möjliggör höjdjustering efter installation</li>
<li><strong>Klammerfästen på rörrigg</strong> — skenan klamps på befintlig rörrigg (50 mm Ø vanligast) utan borrning i tak</li>
</ul>

<p>Viktigt: räkna alltid ut den faktiska lasten på upphängningspunkterna. En tung sammetsridå kan väga 2–4 kg/lm; vid en 8 m lång rigg med 500 g/m² sammet och 3 ggr drapering (gathering ratio 3:1) ger det 24 m tyg × 1,5 kg/lm = ca 36 kg total last. Fördela upphängningen med max 900 mm mellanrum.</p>

<h3>Väggmontering</h3>

<p>Väggmontering används när tak inte är tillgängligt eller när ridån ska täcka ett fönster eller en vägg:</p>
<ul>
<li>Väggskenor monteras horisontellt på konsolar 150–300 mm ut från väggen</li>
<li>Kräver bärande vägg eller genomgående förankring om lasten överstiger 20 kg totalt</li>
<li>Lämplig för tunga draperier i utställningar och mässor</li>
</ul>

<h3>Fristående skenesystem</h3>

<p>Fristående system på stativ används vid tillfälliga event eller i lokaler utan möjlighet till takmontering. Professionella stativsystem klarar normalt 30–50 kg total last och kan konfigureras i L-, T- och U-form.</p>

<h2>Kompatibla tyger — sammet, molton och blackout</h2>

<p>Valet av tygtyp avgör rigens funktion och estetik. De fyra vanligaste tygerna i scen- och eventsammanhang:</p>

<h3>Sammet (velour/velvet)</h3>

<p>Scensammet är det klassiska alternativet för teater och ceremoniella rum. Typiska egenskaper:</p>
<ul>
<li>Vikt: 400–700 g/m²</li>
<li>Materialkombination: polyester eller bomull/polyesterblandning, cut pile</li>
<li>Ljusdämpning: hög (85–92 % beroende på densitet)</li>
<li>Brandklass: typiskt EN 13773 klasser B1 (svårbrinnbar) — begär alltid brandprovningsintyg</li>
<li>Gathering ratio: 2,5:1 till 3:1 för full optisk effekt</li>
<li>Drapering: mjukt fall, passar tunga blyband i underkanten</li>
</ul>

<h3>Molton (mörkläggningsduk)</h3>

<p>Molton (även kallat "duvetyne" på engelska) är ett tjockt, luddat bomulls- eller polyestertyg med dubbelsidig yta. Det absorberar ljud och stänger ute stötljus effektivt:</p>
<ul>
<li>Vikt: 300–500 g/m²</li>
<li>Ljusabsorption: 95–99 % (svart molton)</li>
<li>Akustisk dämpning: αw = 0,35–0,55 beroende på tjocklek och montering</li>
<li>Typisk användning: bakdrapering, kulisser, mörkläggningsmask i produktioner och studios</li>
</ul>

<h3>Blackout</h3>

<p>Blackout-tyger är specialvävda eller belagda dukar med total ljusblockering. De finns i vävt utförande (för ridåbruk) och laminerat (för permanenta installationer):</p>
<ul>
<li>Ljusblockering: 100 % (om tyget sitter tätt utan sömglapp)</li>
<li>Vikt: 250–400 g/m²</li>
<li>Ytbehandling: svart mot publiksida, vit eller silvergrå mot ljussida för att reflektera bort värme</li>
<li>Typisk användning: bioridåer, fotografistudios, kontrollrum, dark rooms vid eventproduktion</li>
</ul>

<h3>Sharkstooth och gaze</h3>

<p>Halvtransparenta tyger (sharkstooth scrim, gaze) används för speciella scenografiska effekter: belyst framifrån verkar det ogenomskinligt; belyst bakifrån avslöjar vad som finns bakom ridån. Kräver ridasken med hög precision i horisontellt löpare-system för att minimera vågbildning.</p>

<h2>Motorisering och styrning</h2>

<p>Elektriska ridaskenesystem används i professionella teatrar och mässhallar för att möjliggöra snabba ridåbyten och exakt repeatability:</p>
<ul>
<li><strong>Kedjedrivna system</strong>: robust, hög lastkapacitet (upp till 150 kg), kräver låg underhållsintervall</li>
<li><strong>Lina- och trumkörda system</strong>: tystare, lämpar sig för teatrar med känsliga akustikkrav</li>
<li><strong>DMX-styrning</strong>: möjliggör integration med ljusbord och scenteknisk automation (STA-standard)</li>
<li><strong>Gränslägesbrytare</strong>: krav på mekanisk eller optisk ändlägesbrytare i båda riktningar för säker drift</li>
</ul>

<h2>Vad Ilmonte erbjuder</h2>

<p>Ilmonte levererar kompletta ridaskenesystem — från enkla aluminiumskenor till motoriserade spårskensystem för krävande produktionsmiljöer. Vi är specialister på sceninstallationer för teater, biograf, konferens och event i Sverige och Norden.</p>

<p>Vårt sortiment inkluderar:</p>
<ul>
<li>Raka och böjbara aluminiumskenor i eloxerat och pulverlackat utförande</li>
<li>Spårskensystem för tung last och motorisering</li>
<li>Sammet, molton och blackout i standard och brandsäkra kvaliteter</li>
<li>Monteringstillbehör: fästen, löpare, blyband, öljetter och repsystem</li>
<li>Projektgenomgång, måttsättning och installationsservice</li>
</ul>

<p>Läs även vår guide om <a href="https://ilmonte.se/scentextil-bakgrundsdukar-guide/">scentextil och bakgrundsdukar</a> för djupare information om tyger, och <a href="https://ilmonte.se/scenpodier-guide-event-konferens/">scenpodier för event och konferens</a> för helhetsgrepp om sceninstallationen.</p>

<div class="las-aven">
<h3>Läs även</h3>
<ul>
<li><a href="https://ilmonte.se/scentextil-bakgrundsdukar-guide/">Scentextil och bakgrundsdukar — guide</a></li>
<li><a href="https://ilmonte.se/scenpodier-guide-event-konferens/">Scenpodier för event och konferens — komplett guide</a></li>
<li><a href="https://ilmonte.se/eventinredning-2026-minnesvard-upplevelse/">Eventinredning 2026 — skapa en minnesvärd upplevelse</a></li>
</ul>
</div>

<h2>Vanliga frågor om ridaskenor och scenridåer</h2>

<h3>Vilken skeneprofil passar bäst för tunga sammetsridåer?</h3>
<p>För sammetsridåer som väger mer än 2 kg/lm rekommenderas en profil på minst 40 × 20 mm med förstärkt löparsystem (stålaxelrullar, lastkapacitet 15–25 kg per löpare). Upphängningspunkterna bör sitta max 600 mm från varandra och varje punkt ska klara minst dubbla beräknad last (2× säkerhetsfaktor). Ilmonte rekommenderar alltid lastberäkning i projekteringsfasen.</p>

<h3>Kan man montera ridaskenesystemet utan att borra i taket?</h3>
<p>Ja, via klammerfästen på befintlig rörrigg eller med fristående stativsystem. Klammerfästen (Ø50 mm rörklammare) kräver en befintlig riggpipe — vanligt i teatrar och studior. Stativsystem passar tillfälliga event. Tänk på att stativsystem har lägre lastkapacitet och kräver stabilisering vid sidokrafter (ridåer som dras i).</p>

<h3>Vad är skillnaden mellan "gathering ratio" 2:1 och 3:1?</h3>
<p>Gathering ratio (drapering) anger hur mycket tyg som används i förhållande till skenans längd. 2:1 ger en lätt, relativt slät ridå; 3:1 ger fylliga veck med tydlig lodrätt veckfallning. För scenavslutsridåer i svart molton används ofta 1,5:1 (sparad tygvolym); för representativa sammetsridåer i foajéer är 2,5:1 till 3:1 standard. Mer tygmängd ger bättre ljusblockering men ökar vikten och kostnaden avsevärt.</p>

<h3>Hur ofta behöver ridaskenesystem underhållas?</h3>
<p>Aluminiumprofiler och stålaxelrullar i inomhusmiljö kräver minimalt underhåll — en enkel inspektion en gång per år (löpares löpyta, fästen, skarvar) räcker för de flesta installationer. Motoriserade system med kedjedrift bör smörjas var 6:e månad med kedjefett. Blyband och spänntrådar i ridåns nederkant kontrolleras och justeras vid behov, normalt en gång per säsong i aktiva teatrar.</p>"""


# ============================================================
# Artiklar att publicera
# ============================================================

ARTICLES = [
    {
        "title": "Läktare och gradänger för event — guide till hyra och köp",
        "slug": "laktare-gradanger-event-guide",
        "content": ARTICLE1_CONTENT,
        "excerpt": "Guide till läktare och gradänger för event och arenor. Teleskopläktare, utomhusläktare, mått, bärighet och säkerhetskrav — allt från Ilmonte.",
        "meta": {
            "rank_math_title": "Läktare och gradänger för event — guide till hyra och köp | Ilmonte",
            "rank_math_description": "Guide till läktare och gradänger för event och arenor. Teleskopläktare, utomhusläktare, mått, bärighet och säkerhetskrav — allt från Ilmonte.",
            "rank_math_focus_keyword": "läktare event"
        }
    },
    {
        "title": "Hörsalsstolar och teaterinredning — guide till val 2026",
        "slug": "horsalsstolar-teaterinredning-guide",
        "content": ARTICLE2_CONTENT,
        "excerpt": "Hur väljer du rätt hörsalsstolar till teater, biograf eller hörsalar? Guide till typer, material, standarder och installation från Ilmonte.",
        "meta": {
            "rank_math_title": "Hörsalsstolar och teaterinredning — guide 2026 | Ilmonte",
            "rank_math_description": "Hur väljer du rätt hörsalsstolar till teater, biograf eller hörsalar? Guide till typer, material, standarder och installation från Ilmonte.",
            "rank_math_focus_keyword": "hörsalsstolar teater"
        }
    },
    {
        "title": "Ridaskenor och scenridåer — guide till installation och tyger",
        "slug": "ridaskenor-scenridaer-guide",
        "content": ARTICLE3_CONTENT,
        "excerpt": "Guide till ridaskenor och scenridåer: typer, material, montering och val av tyger. Ilmonte levererar kompletta system för scen och offentlig miljö.",
        "meta": {
            "rank_math_title": "Ridaskenor och scenridåer — guide till installation | Ilmonte",
            "rank_math_description": "Guide till ridaskenor och scenridåer: typer, material, montering och val av tyger. Ilmonte levererar kompletta system för scen och offentlig miljö.",
            "rank_math_focus_keyword": "ridaskenor scen"
        }
    }
]


def publish_article(article):
    slug = article["slug"]
    post_data = {
        "title": article["title"],
        "content": article["content"],
        "slug": slug,
        "excerpt": article["excerpt"],
        "status": "publish",
        "categories": [CATEGORY_ID]
    }

    r = requests.post(f"{BASE_URL}/posts", headers=HEADERS, json=post_data, timeout=45)

    if r.status_code == 409:
        print(f"  409 conflict on slug '{slug}' — trying with '-2026' suffix")
        post_data["slug"] = slug + "-2026"
        r = requests.post(f"{BASE_URL}/posts", headers=HEADERS, json=post_data, timeout=45)

    if r.status_code not in [200, 201]:
        print(f"ERROR publishing '{article['title']}': HTTP {r.status_code}")
        print(r.text[:600])
        return None

    post = r.json()
    pid = post["id"]
    actual_slug = post["slug"]
    print(f"  Published OK: ID={pid}, slug={actual_slug}")

    # Set Rank Math meta
    rm_data = {
        "objectID": pid,
        "objectType": "post",
        "meta": article["meta"]
    }
    rm_r = requests.post(
        RANKMATH_URL,
        headers=HEADERS,
        json=rm_data,
        timeout=15
    )
    if rm_r.status_code == 200:
        print(f"  Rank Math meta: OK")
    else:
        print(f"  Rank Math meta: HTTP {rm_r.status_code} — {rm_r.text[:200]}")

    return {
        "id": pid,
        "slug": actual_slug,
        "title": article["title"],
        "url": post.get("link", f"https://ilmonte.se/{actual_slug}/")
    }


if __name__ == "__main__":
    print("=== Ilmonte vecka 23 — publicerar 3 artiklar ===\n")
    results = []

    for i, article in enumerate(ARTICLES, 1):
        print(f"[{i}/3] {article['title']}")
        result = publish_article(article)
        if result:
            results.append(result)
        print()

    print("=== SAMMANFATTNING ===")
    for r in results:
        print(f"ID {r['id']} | {r['slug']}")
        print(f"  Titel: {r['title']}")
        print(f"  URL: {r['url']}")
        print()

    if len(results) < 3:
        print(f"OBS: Bara {len(results)} av 3 artiklar publicerades utan fel.")
