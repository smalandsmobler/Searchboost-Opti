# Mail till Mikael Nilsson (Smålands Kontorsmöbler)

**Till:** mikael@smalandskontorsmobler.se (eller den mail han skickade från)
**Från:** mikael@searchboost.nu
**Ämne:** Uppdatering — Vi har åtgärdat menyproblemet och undersöker prisvisningen

---

Hej Mikael,

Tack för att du hörde av dig. Vi förstår allvaret i situationen och har jobbat på det direkt.

**Vad vi har gjort hittills:**

- "Kunskap" och "Artiklar" som dök upp i menyn är nu borttagna — menyn ser ut som vanligt igen.
- Vi har även rensat bort ett redirect-script vi lagt in i HEAD-koden, för att utesluta att det påverkar.

**Angående priser och produktnamn som inte visas:**

Vi har undersökt problemet noggrant och kan se att Abicarts interna system inte levererar produktdata till kategori­sidorna — det är deras komponent (tws-article-list) som visar felet "Error fetching data". Bilderna visas eftersom de cachas separat, men namn och priser hämtas via Abicarts API och det svaret uteblir just nu.

Vi har skickat ett supportärende till Abicart med en teknisk beskrivning av felet. Vi bevakar ärendet och återkommer så snart vi har svar.

**Du behöver inte göra något just nu.** Vi håller i kontakten med Abicart och ser till att det löser sig.

Hör av dig om du har frågor.

Med vänlig hälsning,
Mikael Larsson
Searchboost.se
