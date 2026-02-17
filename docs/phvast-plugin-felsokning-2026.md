# Phvast.se — Plugin-felsokning (meny syns inte helt)

> Datum: 2026-02-17
> Problem: WordPress-menyn visas inte i sin helhet
> Sajt: phvast.se (Psykologhalsan Vast AB)

---

## Kanda installerade plugins/verktyg

| Plugin | Version/info | Risk for menukonflikt |
|--------|-------------|----------------------|
| Elementor | Sidbyggare | MEDEL — kan ladda tung admin-JS |
| Hello Elementor Child | 3.0.1 | LAG |
| Rank Math PRO | SEO-plugin | MEDEL — laggar till manga menypunkter |
| Rank Math Local SEO | Tillagg till Rank Math | LAG |
| WP Rocket | Cache (v2.0.4 LazyLoad) | HOG — kan cacha admin-CSS/JS felaktigt |
| WP Booking Calendar | Bokningssystem | HOG — kanda kompatibilitetsproblem |
| cookiemanager.dk | GDPR/cookies | LAG |

---

## Troliga orsaker (prioritetsordning)

### 1. PHP 7.4 (MEST TROLIGT)

phvast.se kor **PHP 7.4.33** som ar End of Life sedan november 2022. Nyare versioner av WordPress-plugins kraver PHP 8.0+. Nar en plugin forsoker anvanda PHP 8-syntax (named arguments, match expressions, union types etc.) kan det krascha tyst och dolja menypunkter.

**Atgard:**
- Kontakta hosting och be dem uppgradera till **PHP 8.1** (eller helst 8.2+)
- Testa i staging-miljo forst om mojligt
- Kontrollera att alla plugins ar kompatibla med PHP 8.1 fore uppgradering

### 2. WP Rocket cachar admin-filer

WP Rocket kan ibland cacha admin-CSS eller JavaScript, vilket gor att menyn inte renderar korrekt.

**Atgard:**
1. Logga in pa wp-admin
2. Ga till **Installningar > WP Rocket > Cache**
3. Klicka **Rensa cache** (Clear Cache)
4. Kontrollera att "Cacha inloggade anvandare" INTE ar aktiverat
5. Ga till **Filoptimering** och avaktivera "Delay JavaScript execution" tillfalligt
6. Kontrollera om menyn aterkommer

### 3. JavaScript-fel fran en plugin

En plugin kan kasta ett JS-fel som blockerar resten av admin-skripten fran att ladda (inklusive menyn).

**Atgard:**
1. Oppna wp-admin i Chrome
2. Tryck **F12** (Utvecklarverktyg)
3. Ga till fliken **Console**
4. Leta efter roda felmeddelanden — notera vilken plugin-fil felet pekar pa
5. Avaktivera den pluginen och se om menyn aterstar

### 4. WP Booking Calendar konflikt

WP Booking Calendar ar kant for att lagga till mycket CSS/JS i admin och kan skapa konflikter, sarskilt med aldre PHP-versioner.

**Atgard:**
1. Avaktivera WP Booking Calendar tillfalligt
2. Kontrollera om hela menyn syns
3. Om ja — overvig att uppdatera pluginen eller byta till ett alternativ (t.ex. Amelia, SimplyBook.me)

### 5. Rank Math PRO menu-overload

Rank Math PRO laggar till manga undermenyobjekt. I kombination med Elementor och WP Booking Calendar kan det bli sa manga menypunkter att nagon faller utanfor skarmhojden, sarskilt pa laptopskarm.

**Atgard:**
1. Prova att kollapsa wp-admin-menyn (klicka pa pilen langst ner i sidomenyn)
2. Installera pluginen "Admin Menu Editor" for att omorganisera menyn
3. Kontrollera skarmen i fullskarmslagt

---

## Steg-for-steg felsokning

### Fas 1: Snabbfix (5 min)
- [ ] Rensa WP Rockets cache
- [ ] Har du knappt "Kollapsa meny" langst ner i sidomenyn?
- [ ] Testa i ett annat webblasar/incognito-fonster

### Fas 2: Identifiera problemet (15 min)
- [ ] Oppna Utvecklarverktyg (F12) > Console — notera JS-fel
- [ ] Oppna Utvecklarverktyg (F12) > Network — filtrera pa "admin-menu" eller "menu"
- [ ] Kontrollera om menypunkter finns i HTML men doljs med CSS (Inspektera element pa menyn)

### Fas 3: Plugin-isolering (30 min)
- [ ] Avaktivera ALLA plugins utom Rank Math
- [ ] Kontrollera om menyn fungerar
- [ ] Aktivera plugins en i taget i denna ordning:
  1. Elementor
  2. WP Rocket
  3. WP Booking Calendar
  4. cookiemanager.dk
  5. Ovriga plugins
- [ ] Notera vid vilken plugin menyn slutar fungera

### Fas 4: Permanent fix
- [ ] Uppgradera PHP till 8.1+ (KRITISKT oavsett menyproblem)
- [ ] Uppdatera alla plugins till senaste version
- [ ] Om specifik plugin hittas som bov — kontakta deras support eller byt plugin

---

## Plugins att overaga ta bort/byta

| Plugin | Anledning | Alternativ |
|--------|-----------|-----------|
| WP Booking Calendar | Potentiell konflikt, engelska bokningssidor | Amelia, SimplyBook.me, eller extern losning |
| cookiemanager.dk | Extern tjanst | Complianz, CookieYes (inhemska WP-plugins) |

---

## Sidor som borde noindex-as (fran audit)

Dessa sidor ar troligen relaterade till plugins som laggar till onodiga sidor:

- `/dold-test/` — testsida, ska inte vara publik
- `/wp-booking-calendar/` — WP Booking Calendar, title pa engelska
- `/wpbc-booking-received/` — Bekraftelsesida pa engelska

**Atgard i Rank Math:**
1. Ga till varje sida > Rank Math-rutan > Advanced
2. Satt "Robots Meta" till **noindex**
3. Alternativt: ta bort fran sitemap under Rank Math > Sitemap

---

## Kontaktinfo hosting

For PHP-uppgradering behover vi kontakta deras hosting. Enligt auditen anvands **LiteSpeed** som server, vilket tyder pa en delad hosting (t.ex. LiteCloud, Loopia, one.com, eller liknande).

---

*Skapat av Searchboost.se — 2026-02-17*
