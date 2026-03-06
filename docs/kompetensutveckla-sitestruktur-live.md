# Kompetensutveckla.se — Befintlig sitestruktur (live)
> Kartlagd: 2026-02-20 via WP REST API
> Totalt: ~200+ sidor (pages), inga WooCommerce-produkter

---

## Top-level sidor (26 st)

| ID | Slug | Titel | Kommentar |
|----|------|-------|-----------|
| 32 | /hem/ | KOMPETENSUTVECKLA | Startsida |
| 61 | /fysiska-utbildningar/ | LÄRARLEDDA FYSISKA UTBILDNINGAR | Kategori |
| 77 | /vara-tjanster/ | VÅRA TJÄNSTER | Info |
| 111 | /nyheter/ | NYHETER | Blogg/nyheter |
| 114 | /om-oss/ | OM OSS | Info |
| 202 | /kontakta-oss/ | KONTAKTA OSS | Kontakt |
| 311 | /lararledda-webbutbildningar/ | LÄRARLEDDA WEBBUTBILDNINGAR | Kategori |
| 5853 | /webbutbildningar/ | WEBBUTBILDNINGAR | Kategori |
| 6776 | /engelska-utbildningar/ | ENGELSKA UTBILDNINGAR | Kategori |
| 8046 | /kursmaterial/ | KURSMATERIAL | Internt |
| 8115 | /sam/ | SAM | Kurs-hub |
| 8122 | /elbam/ | ELBAM | Kurs-hub |
| 11652 | /quiz-202311/ | QUIZ 2023:11 | Internt |
| 11658 | /basett/ | BAS ETT | Kursmaterial internt |
| 11663 | /bastva/ | BAS TVÅ | Kursmaterial internt |
| 11687 | /fortum/ | FORTUM BAS P/U | Kundspecifik |
| 11808 | /personal/ | PERSONALPORTAL | Internt |
| 12047 | /statkraft/ | STATKRAFT BAS P/U | Kundspecifik |
| 12744 | /bam-utbildning/ | BAM UTBILDNING | Stor kategori (~30+ undersidor) |
| 12916 | /skyddsombudsutbildning/ | SKYDDSOMBUDSUTBILDNING | Kurs-hub |
| 13578 | /ledarskapsutbildningar/ | LEDARSKAPSUTBILDNINGAR | Kategori |
| 14240 | /utbildning-bas-p-och-bas-u/ | UTBILDNING BAS P OCH BAS U | Stor kategori (~100+ undersidor) |
| 14784 | /sam-utbildning/ | SAM UTBILDNING | Kurs-hub |
| 15145 | /varbergskommun/ | Kursmaterial VARBERG | Kundspecifik |
| 18006 | /krisutbildningar/ | KRISUTBILDNINGAR | Kategori |
| 18099 | /kursmaterial3/ | KURSMATERIAL BAM 3 | Internt |

---

## Viktiga undersidstrukturer

### BAM Utbildning (/bam-utbildning/) — ~30 undersidor
- /bam-utbildning-krav/
- /bam-utbildning-gratis/
- /bam-kurs/
- /bam-utbildning-if-metall/
- /grundlaggande-arbetsmiljoutbildning/
- /bam-arbetsmiljoverket/
- /bam-livsmedel-distans/
- /bam-livs/
- + stadssidor: Stockholm, Göteborg, Malmö, Uppsala, Örebro etc. (~25 st)

### BAS P och BAS U (/utbildning-bas-p-och-bas-u/) — ~100 undersidor
- /bas-p-utbildning-online/
- /bas-u-utbildning-online/
- /bas-p-bas-u-utbildning-online/
- + stadssidor BAS P: ~25 städer
- + stadssidor BAS U: ~25 städer
- + kombinerade BAS P+U: ~25 städer

### Lärarledda Webbutbildningar (/lararledda-webbutbildningar/)
- /psykisk-halsa-webbutbildning/
- /ekonomiutbildning-distans/
- /ledarskapsutbildning-distans/
- /arbetsmiljoutbildning/

### Engelska utbildningar (/engelska-utbildningar/)
- /engelska-webbutbildningar-arbetsmiljo/
- /engelska-webbutbildningar/
- /engelska-webbutbildningar-elsakerhet/
- /confined-spaces/
- /engelsk-bam-webbutbildning/

### Krisutbildningar (/krisutbildningar/)
- /fysiska-krisutbildningar/
  - /hlr-utbildning/
  - /hjart-och-lungraddning/
  - /hlr-for-insatspersonal/
  - /psykisk-halsa-och-bemotande/

### Elsäkerhet (parent=2408 = /vara-tjanster/ el dyl)
- /el-bam/
- /ecy/
- /eva/
- /elektriker/
- /v3-principen/
- /skiftarbete-arbetsmiljo/
- /stallningsbyggare/
- /golvlaggare/
- /bakgavellyft-kurs/
- /skyddsombud-utbildning/
- /rutin-for-arbetsmiljo/
- /arbetsmiljolagen/
- /besiktningsman/
- /kontrollansvarig/
- /msb/
- /kris/

---

## Kategorier (WordPress-kategorier, används ej aktivt)
- Nyheter (295 inlägg)
- Kurser (0 inlägg — oanvänd)
- Okategoriserade (0)

---

## Analys — Problem med nuvarande struktur

| Problem | Förklaring |
|---------|------------|
| Allt är "pages" | Inga produkter, inga custom post types — svårt att hantera 200+ kurser |
| Stadssidor = spam | ~75 sidor enbart för att täcka städer per kurstyp — thin content |
| Inga kategorier | WordPress-kategorierna används inte — ingen hierarki |
| Kundspecifika sidor publika | /fortum/, /statkraft/, /varbergskommun/ är publika |
| Interna sidor publika | /personal/, /basett/, /bastva/, /kursmaterial/, /quiz-202311/ |
| Titlar i VERSALER | Alla titlar är CAPS — dålig SEO |
| EduAdmin-integration | Kurser hanteras i EduAdmin, inte i WordPress |

---

## Ny struktur (förslag — steg 2)

```
/                          → Startsida
/om-oss/                   → Om oss
/kontakt/                  → Kontakta oss
/kurser/                   → Kurskatalog (WooCommerce)
  /kurser/arbetsmiljo/     → Kategorisida
  /kurser/ledarskap/       → Kategorisida
  /kurser/elsäkerhet/      → Kategorisida
  /kurser/kris-hlr/        → Kategorisida
  /kurser/bam/             → Produktsida BAM
  /kurser/bas-p/           → Produktsida BAS P
  /kurser/bas-u/           → Produktsida BAS U
  /kurser/sam/             → Produktsida SAM
/nyheter/                  → Blogg
/anlita-oss/               → Företagsanpassat
```

---

## Nästa steg
- **Steg 2**: Designa ny URL-struktur fullständigt
- **Steg 3**: Bygg på DEV (kompetensutveckla.hemsida.eu)
- **Redirect-lista**: Mappa 142+ gamla URL:er till nya
