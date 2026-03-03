# Kompetensutveckla.se — Fullständig ny URL-struktur
> Designad: 2026-02-20 | Steg 2 av Kompetensutveckla-blocket
> Baserad på: live-kartläggning (steg 1) + strukturförslag (kompetensutveckla-strukturforslag.md)

---

## Principer

1. **Ämne först, format som filter** — besökaren söker på "BAM utbildning", inte "webbutbildning BAM"
2. **Flat hierarki** — max 3 nivåer djup (domän / kategori / kurs)
3. **Städer som query-parametrar eller canonical** — `/kurser/arbetsmiljo/bam/?stad=stockholm` istället för 25 separata sidor
4. **Kunskapsbank som topnivå** — eget SEO-värde, lead-generator
5. **Interna sidor bakom lösenord** — /personal/, /fortum/, /statkraft/ etc. måste skyddas
6. **Redirects täcker allt** — ingen besökare hamnar på 404

---

## Fullständig URL-karta (ny struktur)

### Startsida
```
/                              → Startsida (ny, konverteringsoptimerad)
```

### Om oss + Kontakt
```
/om-oss/                       → Om oss (nuvarande /om-oss/ — behåll slug)
/kontakt/                      → Kontakta oss (nuvarande /kontakta-oss/ → redirect)
/anlita-oss/                   → Företagsanpassade utbildningar (ny sida)
```

### Kurskatalog — Toppnivå
```
/kurser/                       → Kurskatalog (ny WooCommerce-arkiv)
```

### Kategori: Arbetsmiljö
```
/kurser/arbetsmiljo/                          → Kategorisida Arbetsmiljö
/kurser/arbetsmiljo/bam/                      → BAM Utbildning (produktsida)
/kurser/arbetsmiljo/sam/                      → SAM Utbildning (produktsida)
/kurser/arbetsmiljo/skyddsombud/              → Skyddsombudsutbildning (produktsida)
/kurser/arbetsmiljo/grundlaggande/            → Grundläggande Arbetsmiljö (produktsida)
/kurser/arbetsmiljo/psykisk-halsa/            → Psykisk hälsa i arbetslivet (produktsida)
/kurser/arbetsmiljo/skiftarbete/              → Skiftarbete & Arbetsmiljö (produktsida)
/kurser/arbetsmiljo/rutin-for-arbetsmiljo/    → Rutin för Arbetsmiljö (produktsida)
```

### Kategori: Bygg & Anläggning
```
/kurser/bygg-anlaggning/                      → Kategorisida Bygg & Anläggning
/kurser/bygg-anlaggning/bas-p/                → BAS P Utbildning (produktsida)
/kurser/bygg-anlaggning/bas-u/                → BAS U Utbildning (produktsida)
/kurser/bygg-anlaggning/bas-p-bas-u/          → BAS P och BAS U Utbildning (produktsida)
/kurser/bygg-anlaggning/stallningsbyggare/    → Ställningsbyggare (produktsida)
/kurser/bygg-anlaggning/kontrollansvarig/     → Kontrollansvarig (produktsida)
/kurser/bygg-anlaggning/besiktningsman/       → Besiktningsman (produktsida)
```

### Kategori: Elsäkerhet
```
/kurser/elsakerhet/                           → Kategorisida Elsäkerhet
/kurser/elsakerhet/bam-el/                    → BAM EL / ElBAM (produktsida)
/kurser/elsakerhet/elbam/                     → ElBAM (produktsida, alias)
/kurser/elsakerhet/ecy/                       → ECY (produktsida)
/kurser/elsakerhet/eva/                       → EVA (produktsida)
/kurser/elsakerhet/elektriker/                → Elektriker Utbildning (produktsida)
/kurser/elsakerhet/v3-principen/              → V3-Principen (produktsida)
```

### Kategori: Transport & Logistik
```
/kurser/transport-logistik/                   → Kategorisida Transport & Logistik
/kurser/transport-logistik/bakgavellyft/      → Bakgavellyft Utbildning (produktsida)
/kurser/transport-logistik/adr/               → ADR Utbildning (produktsida)
/kurser/transport-logistik/arbete-pa-vag/     → Arbete på Väg (produktsida)
/kurser/transport-logistik/msb/               → MSB Utbildning (produktsida)
```

### Kategori: Kris & HLR
```
/kurser/kris-hlr/                             → Kategorisida Kris & HLR
/kurser/kris-hlr/hlr/                         → HLR Utbildning (produktsida)
/kurser/kris-hlr/hjart-lungraddning/          → Hjärt- & Lungräddning (produktsida)
/kurser/kris-hlr/hlr-insatspersonal/          → HLR för Insatspersonal (produktsida)
/kurser/kris-hlr/krisutbildning/              → Krisutbildning (produktsida)
/kurser/kris-hlr/psykisk-halsa-bemotande/     → Psykisk Hälsa & Bemötande (produktsida)
```

### Kategori: Ledarskap
```
/kurser/ledarskap/                            → Kategorisida Ledarskap
/kurser/ledarskap/ny-som-chef/                → Ny som Chef (produktsida)
/kurser/ledarskap/leda-utan-att-vara-chef/    → Leda utan att vara Chef (produktsida)
/kurser/ledarskap/ekonomiutbildning/          → Ekonomiutbildning (produktsida)
/kurser/ledarskap/ledarskapsutbildning/       → Ledarskapsutbildning (produktsida)
```

### Kategori: Engelska utbildningar
```
/kurser/english/                              → Kategorisida English Courses
/kurser/english/bam/                          → BAM English (produktsida)
/kurser/english/health-safety/                → Health & Safety (produktsida)
/kurser/english/electrical-safety/            → Electrical Safety (produktsida)
/kurser/english/confined-spaces/              → Confined Spaces (produktsida)
```

### Kategori: Golvläggning & Specialkurser
```
/kurser/specialkurser/                        → Kategorisida Specialkurser
/kurser/specialkurser/golvlaggare/            → Golvläggare Utbildning (produktsida)
```

---

### Kunskapsbank — Topnivå (ny sektion)
```
/kunskapsbank/                                → Hub: Alla gratisresurser
/kunskapsbank/checklistor/                    → Checklistor (PDF:er)
/kunskapsbank/mallar/                         → Mallar (Word/PDF)
/kunskapsbank/rutiner/                        → Rutiner
/kunskapsbank/policyer/                       → Policyer
/kunskapsbank/afs-foreskrifter/               → AFS-föreskrifter
/kunskapsbank/arbetsmiljolagen/               → Arbetsmiljölagen (guide)
/kunskapsbank/artiklar/                       → Alla kunskapsbanksartiklar (blogg-format)
/kunskapsbank/artiklar/[slug]/                → Enskild artikel
```

---

### Nyheter & Blogg
```
/nyheter/                                     → Nyhetssida (befintlig, behåll)
/nyheter/[slug]/                              → Enskild nyhet
```

---

### Interna sidor (bakom lösenord / noindex)
```
/personal/                                    → Personalportal (lösenordsskydd + noindex)
/kursmaterial/                                → Kursmaterial (lösenordsskydd + noindex)
/basett/                                      → BAS 1-material (lösenordsskydd + noindex)
/bastva/                                      → BAS 2-material (lösenordsskydd + noindex)
/kursmaterial3/                               → BAM 3-material (lösenordsskydd + noindex)
/fortum/                                      → Fortum-sida (lösenordsskydd + noindex)
/statkraft/                                   → Statkraft-sida (lösenordsskydd + noindex)
/varbergskommun/                              → Varbergs Kommun (lösenordsskydd + noindex)
```

---

## Redirect-karta (gamla → nya URL:er)

### Kategorisidor
| Gammal URL | Ny URL | Typ |
|------------|--------|-----|
| /fysiska-utbildningar/ | /kurser/ | 301 |
| /lararledda-webbutbildningar/ | /kurser/ | 301 |
| /webbutbildningar/ | /kurser/ | 301 |
| /engelska-utbildningar/ | /kurser/english/ | 301 |
| /ledarskapsutbildningar/ | /kurser/ledarskap/ | 301 |
| /krisutbildningar/ | /kurser/kris-hlr/ | 301 |
| /vara-tjanster/ | /kurser/ | 301 |
| /vara-tjanster/arbetsmiljoarbete/ | /kurser/arbetsmiljo/ | 301 |
| /kontakta-oss/ | /kontakt/ | 301 |

### BAM Utbildning
| Gammal URL | Ny URL | Typ |
|------------|--------|-----|
| /bam-utbildning/ | /kurser/arbetsmiljo/bam/ | 301 |
| /bam-kurs/ | /kurser/arbetsmiljo/bam/ | 301 |
| /bam-utbildning-krav/ | /kurser/arbetsmiljo/bam/ | 301 |
| /bam-utbildning-gratis/ | /kurser/arbetsmiljo/bam/ | 301 |
| /bam-utbildning-if-metall/ | /kurser/arbetsmiljo/bam/ | 301 |
| /bam-arbetsmiljoverket/ | /kurser/arbetsmiljo/bam/ | 301 |
| /grundlaggande-arbetsmiljoutbildning/ | /kurser/arbetsmiljo/bam/ | 301 |
| /bam-utbildning-stockholm/ | /kurser/arbetsmiljo/bam/?stad=stockholm | 301 |
| /bam-utbildning-goteborg/ | /kurser/arbetsmiljo/bam/?stad=goteborg | 301 |
| /bam-utbildning-malmo/ | /kurser/arbetsmiljo/bam/?stad=malmo | 301 |
| /bam-utbildning-uppsala/ | /kurser/arbetsmiljo/bam/?stad=uppsala | 301 |
| /bam-utbildning-orebro/ | /kurser/arbetsmiljo/bam/?stad=orebro | 301 |
| /bam-utbildning-[stad]/ | /kurser/arbetsmiljo/bam/ | 301 (wildcard) |
| /bam-livsmedel-distans/ | /kurser/arbetsmiljo/bam/ | 301 |
| /bam-livs/ | /kurser/arbetsmiljo/bam/ | 301 |

### BAS P och BAS U
| Gammal URL | Ny URL | Typ |
|------------|--------|-----|
| /utbildning-bas-p-och-bas-u/ | /kurser/bygg-anlaggning/bas-p-bas-u/ | 301 |
| /bas-p-utbildning-online/ | /kurser/bygg-anlaggning/bas-p/ | 301 |
| /bas-u-utbildning-online/ | /kurser/bygg-anlaggning/bas-u/ | 301 |
| /bas-p-bas-u-utbildning-online/ | /kurser/bygg-anlaggning/bas-p-bas-u/ | 301 |
| /bas-p-och-bas-u-utbildning-stockholm/ | /kurser/bygg-anlaggning/bas-p-bas-u/?stad=stockholm | 301 |
| /bas-p-och-bas-u-utbildning-[stad]/ | /kurser/bygg-anlaggning/bas-p-bas-u/ | 301 (wildcard) |
| /bas-p-utbildning-[stad]/ | /kurser/bygg-anlaggning/bas-p/ | 301 (wildcard) |
| /bas-u-utbildning-[stad]/ | /kurser/bygg-anlaggning/bas-u/ | 301 (wildcard) |

### SAM Utbildning
| Gammal URL | Ny URL | Typ |
|------------|--------|-----|
| /sam-utbildning/ | /kurser/arbetsmiljo/sam/ | 301 |
| /sam/ | /kurser/arbetsmiljo/sam/ | 301 |

### Elsäkerhet
| Gammal URL | Ny URL | Typ |
|------------|--------|-----|
| /elbam/ | /kurser/elsakerhet/bam-el/ | 301 |
| /el-bam/ | /kurser/elsakerhet/bam-el/ | 301 |
| /ecy/ | /kurser/elsakerhet/ecy/ | 301 |
| /eva/ | /kurser/elsakerhet/eva/ | 301 |
| /elektriker/ | /kurser/elsakerhet/elektriker/ | 301 |
| /v3-principen/ | /kurser/elsakerhet/v3-principen/ | 301 |

### Webbutbildningar (gamla format-kategorier)
| Gammal URL | Ny URL | Typ |
|------------|--------|-----|
| /webbutbildningar-arbetsmiljo/ | /kurser/arbetsmiljo/ | 301 |
| /webbutbildningar-sakerhet/ | /kurser/arbetsmiljo/ | 301 |
| /webbutbildningar-elsakerhet/ | /kurser/elsakerhet/ | 301 |
| /webbutbildningar-vag-och-transport/ | /kurser/transport-logistik/ | 301 |
| /webbutbildningar-ledarskap/ | /kurser/ledarskap/ | 301 |
| /fysiska-arbetsmiljoutbildningar/ | /kurser/arbetsmiljo/ | 301 |
| /fysiska-ledarskapsutbildningar/ | /kurser/ledarskap/ | 301 |
| /utbildningar-for-tekniska-anordningar/ | /kurser/specialkurser/ | 301 |
| /lararledda-webbutbildningar/ledarskapsutbildning-distans/ | /kurser/ledarskap/ledarskapsutbildning/ | 301 |
| /lararledda-webbutbildningar/ekonomiutbildning-distans/ | /kurser/ledarskap/ekonomiutbildning/ | 301 |
| /lararledda-webbutbildningar/psykisk-halsa-webbutbildning/ | /kurser/arbetsmiljo/psykisk-halsa/ | 301 |
| /lararledda-webbutbildningar/arbetsmiljoutbildning/ | /kurser/arbetsmiljo/bam/ | 301 |

### Skyddsombud
| Gammal URL | Ny URL | Typ |
|------------|--------|-----|
| /skyddsombudsutbildning/ | /kurser/arbetsmiljo/skyddsombud/ | 301 |
| /skyddsombud-utbildning/ | /kurser/arbetsmiljo/skyddsombud/ | 301 |

### Krisutbildningar
| Gammal URL | Ny URL | Typ |
|------------|--------|-----|
| /krisutbildningar/ | /kurser/kris-hlr/ | 301 |
| /fysiska-krisutbildningar/ | /kurser/kris-hlr/ | 301 |
| /hlr-utbildning/ | /kurser/kris-hlr/hlr/ | 301 |
| /hjart-och-lungraddning/ | /kurser/kris-hlr/hjart-lungraddning/ | 301 |
| /hlr-for-insatspersonal/ | /kurser/kris-hlr/hlr-insatspersonal/ | 301 |
| /psykisk-halsa-och-bemotande/ | /kurser/kris-hlr/psykisk-halsa-bemotande/ | 301 |
| /kris/ | /kurser/kris-hlr/krisutbildning/ | 301 |

### Ledarskap
| Gammal URL | Ny URL | Typ |
|------------|--------|-----|
| /ledarskapsutbildningar/ | /kurser/ledarskap/ | 301 |
| /ledarskapsutbildning-distans/ | /kurser/ledarskap/ledarskapsutbildning/ | 301 |

### Engelska
| Gammal URL | Ny URL | Typ |
|------------|--------|-----|
| /engelska-utbildningar/ | /kurser/english/ | 301 |
| /engelska-webbutbildningar-arbetsmiljo/ | /kurser/english/health-safety/ | 301 |
| /engelska-webbutbildningar/ | /kurser/english/ | 301 |
| /engelska-webbutbildningar-elsakerhet/ | /kurser/english/electrical-safety/ | 301 |
| /confined-spaces/ | /kurser/english/confined-spaces/ | 301 |
| /engelsk-bam-webbutbildning/ | /kurser/english/bam/ | 301 |

### Specialkurser
| Gammal URL | Ny URL | Typ |
|------------|--------|-----|
| /stallningsbyggare/ | /kurser/bygg-anlaggning/stallningsbyggare/ | 301 |
| /golvlaggare/ | /kurser/specialkurser/golvlaggare/ | 301 |
| /bakgavellyft-kurs/ | /kurser/transport-logistik/bakgavellyft/ | 301 |
| /besiktningsman/ | /kurser/bygg-anlaggning/besiktningsman/ | 301 |
| /kontrollansvarig/ | /kurser/bygg-anlaggning/kontrollansvarig/ | 301 |
| /msb/ | /kurser/transport-logistik/msb/ | 301 |

### Kunskapsbank (gamla djupa URL:er)
| Gammal URL | Ny URL | Typ |
|------------|--------|-----|
| /vara-tjanster/arbetsmiljoarbete/kunskapsbanken/ | /kunskapsbank/artiklar/ | 301 |
| /vara-tjanster/arbetsmiljoarbete/kunskapsbanken/[slug]/ | /kunskapsbank/artiklar/[slug]/ | 301 |
| /vara-tjanster/arbetsmiljoarbete/afs/ | /kunskapsbank/afs-foreskrifter/ | 301 |
| /vara-tjanster/arbetsmiljoarbete/rutiner/ | /kunskapsbank/rutiner/ | 301 |
| /rutiner-checklistor-och-mallar/ | /kunskapsbank/checklistor/ | 301 |
| /arbetsmiljolagen/ | /kunskapsbank/arbetsmiljolagen/ | 301 |
| /rutin-for-arbetsmiljo/ | /kunskapsbank/rutiner/ | 301 |

### Övrigt
| Gammal URL | Ny URL | Typ |
|------------|--------|-----|
| /skiftarbete-arbetsmiljo/ | /kurser/arbetsmiljo/skiftarbete/ | 301 |
| /sam/ | /kurser/arbetsmiljo/sam/ | 301 |
| /elbam/ | /kurser/elsakerhet/bam-el/ | 301 |
| /quiz-202311/ | → Ta bort / noindex | — |
| /basett/ | → Lösenordsskydda | — |
| /bastva/ | → Lösenordsskydda | — |
| /kursmaterial/ | → Lösenordsskydda | — |
| /kursmaterial3/ | → Lösenordsskydda | — |
| /fortum/ | → Lösenordsskydda | — |
| /statkraft/ | → Lösenordsskydda | — |
| /varbergskommun/ | → Lösenordsskydda | — |
| /personal/ | → Lösenordsskydda | — |

---

## .htaccess Wildcard-regler (för stadssidor)

```apache
# BAM stadssidor → BAM-produktsida
RewriteRule ^bam-utbildning-(.+)/?$ /kurser/arbetsmiljo/bam/ [R=301,L]

# BAS P stadssidor
RewriteRule ^bas-p-utbildning-(.+)/?$ /kurser/bygg-anlaggning/bas-p/ [R=301,L]

# BAS U stadssidor
RewriteRule ^bas-u-utbildning-(.+)/?$ /kurser/bygg-anlaggning/bas-u/ [R=301,L]

# BAS P+U kombinerade stadssidor
RewriteRule ^bas-p-och-bas-u-utbildning-(.+)/?$ /kurser/bygg-anlaggning/bas-p-bas-u/ [R=301,L]

# Gamla /webbutbildningar-X/ → kurser
RewriteRule ^webbutbildningar-(.+)/?$ /kurser/ [R=301,L]

# Gamla /fysiska-X/ → kurser
RewriteRule ^fysiska-(.+)/?$ /kurser/ [R=301,L]
```

---

## WooCommerce-kategoristruktur (ProductCat)

```
Kurser (root)
├── Arbetsmiljö (slug: arbetsmiljo)
│   ├── BAM Utbildning
│   ├── SAM Utbildning
│   ├── Skyddsombudsutbildning
│   └── Psykisk Hälsa
├── Bygg & Anläggning (slug: bygg-anlaggning)
│   ├── BAS P
│   ├── BAS U
│   ├── BAS P och BAS U
│   └── Ställningsbyggare
├── Elsäkerhet (slug: elsakerhet)
│   ├── BAM EL / ElBAM
│   ├── ECY
│   └── EVA
├── Transport & Logistik (slug: transport-logistik)
│   ├── Bakgavellyft
│   └── Arbete på Väg
├── Kris & HLR (slug: kris-hlr)
│   ├── HLR
│   └── Krisutbildning
├── Ledarskap (slug: ledarskap)
│   ├── Ny som Chef
│   └── Ledarskapsutbildning
└── English Courses (slug: english)
    ├── BAM English
    └── Confined Spaces
```

---

## Totalt antal redirects

| Typ | Antal |
|-----|-------|
| Exakta URL-redirects | ~80 st |
| Wildcard-stadssidor (BAM) | ~25 st |
| Wildcard-stadssidor (BAS P) | ~25 st |
| Wildcard-stadssidor (BAS U) | ~25 st |
| Wildcard-stadssidor (BAS P+U) | ~25 st |
| Totalt täckt | **~180 URL:er** |

---

## Nästa steg (Steg 3)

1. Skapa DEV-sajt på kompetensutveckla.hemsida.eu (verifiera att URL funkar)
2. Installera WooCommerce + kurshanteringsplugin
3. Skapa WooCommerce-kategorier enligt struktur ovan
4. Skapa sidor: /kunskapsbank/, /anlita-oss/, /kontakt/
5. Lösenordsskydda interna sidor
6. Lägg in .htaccess wildcard-regler
7. SEO-grund: Rank Math, titles, descriptions per sida
