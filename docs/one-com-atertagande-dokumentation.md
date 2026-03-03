# Dokumentation — Återtagande av phvast.se
**Upprättad:** 2026-02-20
**Upprättad av:** Mikael Larsson, Searchboost (mikael@searchboost.se)
**Domän:** phvast.se
**Domänregistrar:** One.com
**Domänägare:** Arman Farzini / Psykologhälsan Väst AB (arman@farzini.se)

---

## Sammanfattning

Domänen phvast.se ägs av Arman Farzini och är registrerad på One.com sedan tidigare.
I mars 2024 kapade företaget Intendit AB domänens DNS-pekare utan domänägarens informerade samtycke och dirigerade trafiken till sin egen server i Danmark. Searchboost AB anlitades av domänägaren för att återta kontrollen över domänen och webbplatsen.

---

## Tidslinje

| Datum | Händelse |
|-------|----------|
| 2024-03-13 | Intendit AB skickade ett avtal via Oneflow till arman@phvast.se. Avtalet signerades inom 7 sekunder — sannolikt utan att Arman läst det. Signerings-IP: 31.15.32.14 (Göteborg, Tele2). Intendit-säljare Alexandra Malmros, IP: 158.174.152.174 (Sollentuna, Bahnhof). Oneflow-kontrakt ID: 6925067. |
| 2024-03-13 (efter) | Intendit ändrar DNS A-records för phvast.se på One.com från One.coms egna hosting till deras egen server: 152.115.36.106 (Danmark, LiteSpeed, PHP 7.4.33). One.coms "Standardinställningar"-toggle inaktiveras. |
| 2024 (okänt datum) | Intendit kopplar loss formulär–kalender-integrationen på webbplatsen och skyller på Searchboost. Skapar en WordPress-adminanvändare med adressen info@searchboost.se för att framstå som att Searchboost saboterat webbplatsen. |
| 2026-02-19 | Searchboost säkrar en komplett databasbackup av phvast.se (phvast_sewordpress.sql). |
| 2026-02-20 | Searchboost loggar in på One.com (med Armans godkännande och inloggningsuppgifter) och bekräftar att A-records pekar till 152.115.36.106 (Intendits server). |
| 2026-02-20 | Searchboost påbörjar uppsättning av ny hostingmiljö på Loopia för phvast.se. |

---

## Teknisk bevisning

### DNS-kapning — bekräftad
- **phvast.se A-record:** 152.115.36.106
- **www.phvast.se A-record:** 152.115.36.106
- **Ägare av 152.115.36.106:** Intendit AB / One.com Denmark (ej Arman Farzini)
- **One.com standardhosting:** Inaktiverad (toggle avstängd av Intendit)
- **Kontrollerad:** 2026-02-20 via One.com DNS-panel (https://www.one.com/admin/dns.do)

### Förfalskad WordPress-användare
- En WordPress-adminanvändare skapades med e-postadressen info@searchboost.se
- Searchboost har aldrig haft tillgång till phvast.se:s WordPress
- Syftet var uppenbart att misskreditera Searchboost

### Bakdörrar på servern (nu borttagna)
- `cf7db.php` — dold i Elementor Pro-mappen
- `sb-fix-phvast.php` — dold i WordPress-roten
- Båda bekräftade borttagna enligt forensisk rapport 2026-02-19

### Avtalet (Oneflow kontrakt ID: 6925067)
- Signerat 2024-03-13
- Signerades via enkel e-signatur (ej BankID)
- 60 månaders bindningstid — sannolikt oskäligt enligt 36 § Avtalslagen
- Skickades till arman@phvast.se — en adress Intendit hade kontroll över
- Signeringstid: 7 sekunder (orealistisk lästid för ett 60-månaders avtal)

### E-postkontroll
- arman@phvast.se kontrolleras av Intendit (ligger på deras server 152.115.36.106)
- Intendit kan använda denna adress för lösenordsåterställningar
- Domänägarens säkra privata mail: arman@farzini.se

---

## Åtgärder vidtagna av Searchboost

1. Komplett databasbackup säkrad (2026-02-19)
2. DNS-situation kartlagd och dokumenterad (2026-02-20)
3. Domänägaren informerad och instruerad att byta kontaktmail på One.com
4. Ny hostingmiljö förbereds på Loopia (searchboost22-kontot)
5. Forensisk rapport upprättad: `docs/forensisk-rapport-phvast-2026-02-19.md`
6. Hävningsbrev upprättat: `docs/havningsbrev-intendit-arman-2026.md`

---

## Vid kontakt med One.com

Om One.com kontaktas angående denna domän, hänvisa till:

- **Domänägare:** Arman Farzini, Psykologhälsan Väst AB
- **Registrerat konto:** arman@farzini.se
- **Situation:** DNS-records ändrades av tredje part (Intendit AB) utan domänägarens informerade samtycke. Domänägaren begär återställning av kontroll.
- **Bevis:** Denna dokumentation + forensisk rapport + Oneflow-avtalets signeringsdetaljer
- **Kontakt Searchboost:** mikael@searchboost.se / mikael@searchboost.se

---

## Kontaktinfo relevanta parter

| Part | Kontakt |
|------|---------|
| Domänägare | Arman Farzini, arman@farzini.se |
| Searchboost | Mikael Larsson, mikael@searchboost.se |
| Intendit AB | Alexandra Malmros (säljare), intendit.se |
| One.com support | https://www.one.com/sv/support |
| Oneflow (avtalstjänst) | Kontrakt ID: 6925067 |
