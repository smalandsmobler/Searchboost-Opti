# Kompetensutveckla.se — Redirect-lista (301)

> Genererad: 2026-02-25
> Status: Redo att implementera via Redirection-plugin eller .htaccess
> Källa: GSC crawl-errors + SEO-rapport + manuell analys

---

## Sammanfattning

- **Totalt**: ~100 redirects (exakta) + 6 wildcard-regler
- **Prioritet 1**: Kunskapsbank-sidor (121 st med gammalt URL-mönster)
- **Prioritet 2**: Stadssidor utan matchande sida
- **Prioritet 3**: Gamla kategori-URL:er

---

## Wildcard-regler (.htaccess / Redirection regex)

Dessa 6 regler täcker majoriteten av 404-felen:

```apache
# 1. Gamla kunskapsbank-URL:er (121+ sidor)
# /arbetsmiljoarbete/kunskapsbanken/X → /X
RewriteRule ^arbetsmiljoarbete/kunskapsbanken/(.+)$ /$1 [R=301,L]

# 2. BAM stadssidor → BAM huvudsida
RewriteRule ^bam-utbildning-(.+)/?$ /bam-battre-arbetsmiljo-3-dagar/ [R=301,L]

# 3. BAS P stadssidor → BAS P+U huvudsida
RewriteRule ^bas-p-utbildning-(.+)/?$ /utbildning-for-byggarbetsmiljosamordnare/ [R=301,L]

# 4. BAS U stadssidor → BAS P+U huvudsida
RewriteRule ^bas-u-utbildning-(.+)/?$ /utbildning-for-byggarbetsmiljosamordnare/ [R=301,L]

# 5. BAS P+U kombinerade stadssidor
RewriteRule ^bas-p-och-bas-u-utbildning-(.+)/?$ /utbildning-for-byggarbetsmiljosamordnare/ [R=301,L]

# 6. Gamla webbutbildning-kategorier
RewriteRule ^webbutbildningar-(.+)/?$ /webbutbildningar/ [R=301,L]
```

---

## Exakta redirects — Prioritet 1 (Kurser)

| Gammal URL | Ny URL (301) | Kommentar |
|-----------|-------------|-----------|
| /bam-kurs/ | /bam-battre-arbetsmiljo-3-dagar/ | Alternativt sökord |
| /bam-utbildning-krav/ | /bam-battre-arbetsmiljo-3-dagar/ | Informationssökning |
| /bam-utbildning-gratis/ | /bam-battre-arbetsmiljo-3-dagar/ | Informationssökning |
| /bam-utbildning-if-metall/ | /bam-battre-arbetsmiljo-3-dagar/ | Fackförbund-specifik |
| /bam-arbetsmiljoverket/ | /bam-battre-arbetsmiljo-3-dagar/ | Myndighetsrelaterad |
| /grundlaggande-arbetsmiljoutbildning/ | /bam-battre-arbetsmiljo-3-dagar/ | Synonym |
| /bam-livsmedel-distans/ | /bam-battre-arbetsmiljo-3-dagar/ | Bransch-specifik |
| /bam-livs/ | /bam-battre-arbetsmiljo-3-dagar/ | Förkortning |
| /sam-utbildning/ | /sam-systematiskt-arbetsmiljoarbete/ | Om sidan inte redan finns |
| /sam/ | /sam-systematiskt-arbetsmiljoarbete/ | Kort URL |
| /skyddsombudsutbildning/ | /grundutbildning-abc-skyddsombud/ | Om ej redan aktiv |
| /skyddsombud-utbildning/ | /grundutbildning-abc-skyddsombud/ | Alternativ stavning |
| /elbam/ | /elbam/ | Kontrollera om redan aktiv |
| /el-bam/ | /elbam/ | Alternativ stavning |
| /bas-p-utbildning-online/ | /utbildning-for-byggarbetsmiljosamordnare/ | Online-variant |
| /bas-u-utbildning-online/ | /utbildning-for-byggarbetsmiljosamordnare/ | Online-variant |
| /bas-p-bas-u-utbildning-online/ | /utbildning-for-byggarbetsmiljosamordnare/ | Kombinerad |
| /hlr-utbildning/ | /hjart-lungraddning/ | Om sida finns, annars /vara-tjanster/ |
| /ledarskapsutbildning-distans/ | /att-leda-andra/ | Ledarskapsutbildning |

---

## Exakta redirects — Prioritet 2 (Kategorier)

| Gammal URL | Ny URL (301) | Kommentar |
|-----------|-------------|-----------|
| /fysiska-utbildningar/ | /fysiska-utbildningar/ | Kontrollera om redan aktiv |
| /fysiska-arbetsmiljoutbildningar/ | /fysiska-utbildningar/ | Kategori |
| /fysiska-ledarskapsutbildningar/ | /fysiska-utbildningar/ | Kategori |
| /fysiska-krisutbildningar/ | /fysiska-utbildningar/ | Kategori |
| /webbutbildningar-arbetsmiljo/ | /webbutbildningar/ | Subkategori |
| /webbutbildningar-sakerhet/ | /webbutbildningar/ | Subkategori |
| /webbutbildningar-elsakerhet/ | /webbutbildningar/ | Subkategori |
| /webbutbildningar-vag-och-transport/ | /webbutbildningar/ | Subkategori |
| /webbutbildningar-ledarskap/ | /webbutbildningar/ | Subkategori |
| /engelska-utbildningar/ | /webbutbildningar/ | Eller specifik engelska-sida |
| /engelska-webbutbildningar/ | /webbutbildningar/ | Kategori |
| /engelska-webbutbildningar-arbetsmiljo/ | /webbutbildningar/ | Subkategori |
| /engelska-webbutbildningar-elsakerhet/ | /webbutbildningar/ | Subkategori |
| /ledarskapsutbildningar/ | /att-leda-andra/ | Eller /ny-som-chef/ |
| /krisutbildningar/ | /vara-tjanster/ | Kategori |
| /utbildningar-for-tekniska-anordningar/ | /vara-tjanster/ | Kategori |

---

## Exakta redirects — Prioritet 3 (Specialkurser)

| Gammal URL | Ny URL (301) | Kommentar |
|-----------|-------------|-----------|
| /stallningsbyggare/ | /stallningsutbildning-2-9-meter/ | Ställning |
| /golvlaggare/ | /vara-tjanster/ | Om ej aktiv kurs |
| /bakgavellyft-kurs/ | /vara-tjanster/ | Om ej aktiv kurs |
| /besiktningsman/ | /vara-tjanster/ | Om ej aktiv kurs |
| /kontrollansvarig/ | /kontroll-fore-idrifttagning/ | Liknande |
| /skiftarbete-arbetsmiljo/ | /nattarbete/ | Relaterat ämne |
| /rutin-for-arbetsmiljo/ | /rutiner/ | Förkortad URL |
| /rutiner-checklistor-och-mallar/ | /rutiner/ | Relaterat |

---

## Implementering

### Alt 1: Redirection-plugin (enklast)
1. Installera plugin "Redirection" (gratis)
2. Importera CSV med gammal → ny URL
3. Aktivera regex-stöd för wildcard-regler

### Alt 2: .htaccess (snabbast prestanda)
1. Lägg till wildcard-reglerna i `.htaccess` FÖRE WordPress rewrite-reglerna
2. Lägg till exakta redirects som `Redirect 301 /gammal-url /ny-url`

### Alt 3: WPCode snippet (redan installerat)
Skapa PHP-snippet med `template_redirect` hook:
```php
add_action('template_redirect', function() {
    $redirects = [
        '/bam-kurs/' => '/bam-battre-arbetsmiljo-3-dagar/',
        '/bam-utbildning-krav/' => '/bam-battre-arbetsmiljo-3-dagar/',
        // ... etc
    ];
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (isset($redirects[$path])) {
        wp_redirect(home_url($redirects[$path]), 301);
        exit;
    }
    // Wildcard: kunskapsbank
    if (preg_match('#^/arbetsmiljoarbete/kunskapsbanken/(.+)$#', $path, $m)) {
        wp_redirect(home_url('/' . $m[1]), 301);
        exit;
    }
    // Wildcard: BAM stadssidor
    if (preg_match('#^/bam-utbildning-[a-z]+/?$#', $path)) {
        wp_redirect(home_url('/bam-battre-arbetsmiljo-3-dagar/'), 301);
        exit;
    }
});
```

---

## Verifiering efter implementering

1. Testa alla wildcard-regler med curl: `curl -sI https://kompetensutveckla.se/bam-utbildning-stockholm/`
2. Kolla GSC Coverage-rapport efter 1 vecka
3. Verifiera att 404-felen minskar i GSC
4. Kontrollera att inga redirect-loopar uppstår
