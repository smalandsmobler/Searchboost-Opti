#!/bin/bash
# =====================================================
# KOMPETENSUTVECKLA.SE — STAGING SETUP SCRIPT
# Genererat 2026-02-15 av Searchboost
# =====================================================
#
# SYFTE: Skapa ny ämnesbaserad kategoristruktur på staging
# KRAV: WP-CLI installerat, SSH-access till staging
#
# KÖRNING:
#   ssh staging.kompetensutveckla.se
#   cd /path/to/wordpress
#   bash staging-setup.sh
# =====================================================

WP="wp --allow-root"
SITE="staging.kompetensutveckla.se"

echo "=== STEG 1: Skapa ny taxonomi 'leveransformat' ==="
# Registrera custom taxonomy via functions.php eller mu-plugin
cat > wp-content/mu-plugins/searchboost-format-taxonomy.php << 'PHPEOF'
<?php
/*
Plugin Name: Searchboost — Leveransformat Taxonomy
Description: Lägger till leveransformat (fysisk/lärarledd/e-learning) som taxonomy
*/
add_action('init', function() {
    register_taxonomy('leveransformat', 'page', [
        'labels' => [
            'name' => 'Leveransformat',
            'singular_name' => 'Format',
            'menu_name' => 'Leveransformat',
        ],
        'hierarchical' => true,
        'public' => true,
        'show_ui' => true,
        'show_in_rest' => true,
        'rewrite' => ['slug' => 'format'],
    ]);
});
PHPEOF

echo "  Skapade mu-plugin: searchboost-format-taxonomy.php"

echo ""
echo "=== STEG 2: Skapa format-termer ==="
$WP term create leveransformat "Fysisk utbildning" --slug=fysisk --description="Lärarledd utbildning på plats i din stad"
$WP term create leveransformat "Lärarledd webb" --slug=lararledd --description="Live via Zoom eller Teams med lärare"
$WP term create leveransformat "Webbutbildning" --slug=elearning --description="Studera i egen takt online"
$WP term create leveransformat "Blended Learning" --slug=blended --description="Kombination av webb och fysisk"

echo ""
echo "=== STEG 3: Skapa nya huvudsidor ==="

# /utbildningar/
UTBILDNINGAR_ID=$($WP post create --post_type=page --post_title="Alla utbildningar" --post_name=utbildningar --post_status=publish --porcelain)
echo "  Skapade /utbildningar/ (ID: $UTBILDNINGAR_ID)"

# /kunskapsbank/
KUNSKAPSBANK_ID=$($WP post create --post_type=page --post_title="Kunskapsbank" --post_name=kunskapsbank --post_status=publish --porcelain)
echo "  Skapade /kunskapsbank/ (ID: $KUNSKAPSBANK_ID)"

echo ""
echo "=== STEG 4: Skapa utbildningskategorier som undersidor ==="

# Arbetsmiljö
AM_ID=$($WP post create --post_type=page --post_title="Arbetsmiljöutbildningar" --post_name=arbetsmiljo --post_parent=$UTBILDNINGAR_ID --post_status=publish --porcelain)
echo "  /utbildningar/arbetsmiljo/ (ID: $AM_ID)"

# Bygg
BYGG_ID=$($WP post create --post_type=page --post_title="Utbildningar för bygg & anläggning" --post_name=bygg-och-anlaggning --post_parent=$UTBILDNINGAR_ID --post_status=publish --porcelain)
echo "  /utbildningar/bygg-och-anlaggning/ (ID: $BYGG_ID)"

# Väg & Transport
VAG_ID=$($WP post create --post_type=page --post_title="Utbildningar för väg & transport" --post_name=vag-och-transport --post_parent=$UTBILDNINGAR_ID --post_status=publish --porcelain)
echo "  /utbildningar/vag-och-transport/ (ID: $VAG_ID)"

# Elsäkerhet
EL_ID=$($WP post create --post_type=page --post_title="Elsäkerhetsutbildningar" --post_name=elsakerhet --post_parent=$UTBILDNINGAR_ID --post_status=publish --porcelain)
echo "  /utbildningar/elsakerhet/ (ID: $EL_ID)"

# Ledarskap
LED_ID=$($WP post create --post_type=page --post_title="Ledarskapsutbildningar" --post_name=ledarskap --post_parent=$UTBILDNINGAR_ID --post_status=publish --porcelain)
echo "  /utbildningar/ledarskap/ (ID: $LED_ID)"

# Säkerhet & Lyft
SAK_ID=$($WP post create --post_type=page --post_title="Säkerhets- och lyftutbildningar" --post_name=sakerhet --post_parent=$UTBILDNINGAR_ID --post_status=publish --porcelain)
echo "  /utbildningar/sakerhet/ (ID: $SAK_ID)"

# Kris & Beredskap
KRIS_ID=$($WP post create --post_type=page --post_title="Kris- och beredskapsutbildningar" --post_name=kris-och-beredskap --post_parent=$UTBILDNINGAR_ID --post_status=publish --porcelain)
echo "  /utbildningar/kris-och-beredskap/ (ID: $KRIS_ID)"

# Ekonomi & Upphandling
EKO_ID=$($WP post create --post_type=page --post_title="Ekonomi- och upphandlingsutbildningar" --post_name=ekonomi-och-upphandling --post_parent=$UTBILDNINGAR_ID --post_status=publish --porcelain)
echo "  /utbildningar/ekonomi-och-upphandling/ (ID: $EKO_ID)"

# Fordon & Friluft
FORD_ID=$($WP post create --post_type=page --post_title="Fordon & friluft" --post_name=fordon-och-friluft --post_parent=$UTBILDNINGAR_ID --post_status=publish --porcelain)
echo "  /utbildningar/fordon-och-friluft/ (ID: $FORD_ID)"

# Engelska
ENG_ID=$($WP post create --post_type=page --post_title="English Training Courses" --post_name=engelska --post_parent=$UTBILDNINGAR_ID --post_status=publish --porcelain)
echo "  /utbildningar/engelska/ (ID: $ENG_ID)"

echo ""
echo "=== STEG 5: Skapa undersidor under arbetsmiljö ==="
$WP post create --post_type=page --post_title="BAM-utbildning" --post_name=bam-utbildning --post_parent=$AM_ID --post_status=publish
$WP post create --post_type=page --post_title="SAM-utbildning" --post_name=sam-utbildning --post_parent=$AM_ID --post_status=publish
$WP post create --post_type=page --post_title="OSA-utbildning" --post_name=osa-utbildning --post_parent=$AM_ID --post_status=publish
$WP post create --post_type=page --post_title="Skyddsombudsutbildning" --post_name=skyddsombudsutbildning --post_parent=$AM_ID --post_status=publish

echo ""
echo "=== STEG 6: Skapa undersida under bygg ==="
$WP post create --post_type=page --post_title="BAS P/U-utbildning" --post_name=bas-p-och-bas-u --post_parent=$BYGG_ID --post_status=publish

echo ""
echo "=== STEG 7: Skapa kunskapsbankens undersidor ==="
KB_CHECK=$($WP post create --post_type=page --post_title="Checklistor" --post_name=checklistor --post_parent=$KUNSKAPSBANK_ID --post_status=publish --porcelain)
KB_MALL=$($WP post create --post_type=page --post_title="Mallar" --post_name=mallar --post_parent=$KUNSKAPSBANK_ID --post_status=publish --porcelain)
KB_RUT=$($WP post create --post_type=page --post_title="Rutiner" --post_name=rutiner --post_parent=$KUNSKAPSBANK_ID --post_status=publish --porcelain)
KB_ART=$($WP post create --post_type=page --post_title="Artiklar" --post_name=artiklar --post_parent=$KUNSKAPSBANK_ID --post_status=publish --porcelain)
KB_LAG=$($WP post create --post_type=page --post_title="Lagar & regler" --post_name=lagar-och-regler --post_parent=$KUNSKAPSBANK_ID --post_status=publish --porcelain)
$WP post create --post_type=page --post_title="AFS — Arbetsmiljöverkets föreskrifter" --post_name=afs --post_parent=$KB_LAG --post_status=publish

echo ""
echo "=== STEG 8: Sätt Rank Math SEO-metadata ==="
# Kräver Rank Math installerat

# Utbildningar huvudsida
$WP post meta update $UTBILDNINGAR_ID rank_math_title "Utbildningar inom arbetsmiljö, säkerhet & ledarskap | Kompetensutveckla"
$WP post meta update $UTBILDNINGAR_ID rank_math_description "110+ utbildningar inom arbetsmiljö, bygg, elsäkerhet, ledarskap och mer. Webb, lärarledd och fysisk utbildning i 47 städer. Boka direkt."

# Kunskapsbank
$WP post meta update $KUNSKAPSBANK_ID rank_math_title "Kunskapsbank — Checklistor, mallar & artiklar om arbetsmiljö | Kompetensutveckla"
$WP post meta update $KUNSKAPSBANK_ID rank_math_description "200+ gratis resurser: riskbedömningsmallar, skyddsrondschecklistor, AFS-föreskrifter, rutiner och artiklar. Ladda ner direkt."

# Arbetsmiljö
$WP post meta update $AM_ID rank_math_title "Arbetsmiljöutbildningar — BAM, SAM, OSA & skyddsombud | Kompetensutveckla"
$WP post meta update $AM_ID rank_math_description "Certifierade arbetsmiljöutbildningar: BAM (2-5 dagar), SAM, OSA, skyddsombudsutbildning. Webb, lärarledd och fysisk. Från 2 695 kr."

# Bygg
$WP post meta update $BYGG_ID rank_math_title "Byggutbildningar — BAS P/U, ställning, fallskydd & asbest | Kompetensutveckla"
$WP post meta update $BYGG_ID rank_math_description "BAS P/U-utbildning, ställningsutbildning, fallskydd och asbest. Certifierade kurser i 38 städer. Från 1 195 kr."

# Väg
$WP post meta update $VAG_ID rank_math_title "Arbete på väg-utbildning + ADR — Nivå 1-4 | Kompetensutveckla"
$WP post meta update $VAG_ID rank_math_description "Arbete på väg-utbildning nivå 1.1-2.2 och ADR-utbildning. Webb från 295 kr, fysisk från 3 100 kr. Certifikat ingår."

# Elsäkerhet
$WP post meta update $EL_ID rank_math_title "Elsäkerhetsutbildningar — ELBAM, ESA, kontroll & fackkunnig | Kompetensutveckla"
$WP post meta update $EL_ID rank_math_description "ELBAM, instruerad person, fackkunnig repetition och kontroll före idrifttagning. Webb och lärarledd. Från 2 495 kr."

# Ledarskap
$WP post meta update $LED_ID rank_math_title "Ledarskapsutbildning — Ny som chef, leda utan att vara chef | Kompetensutveckla"
$WP post meta update $LED_ID rank_math_description "Ledarskapsutbildningar: Ny som chef, att leda utan att vara chef, arbetsledarutbildning. Webb, lärarledd och fysisk. Från 4 995 kr."

# Säkerhet
$WP post meta update $SAK_ID rank_math_title "Säkerhetsutbildningar — Lyft, lift, slutna utrymmen & motorkap | Kompetensutveckla"
$WP post meta update $SAK_ID rank_math_description "Utbildningar i säkra lyft, skylift, slutna utrymmen, motorkap och fallskydd. Certifierade kurser. Från 195 kr."

# Kris
$WP post meta update $KRIS_ID rank_math_title "Krisutbildningar — Första hjälpen, HLR & brandskydd | Kompetensutveckla"
$WP post meta update $KRIS_ID rank_math_description "Första hjälpen & HLR-utbildning med hjärtstartare. Brandskyddsutbildning. Fysiska halvdagskurser. Från 1 800 kr."

# Ekonomi
$WP post meta update $EKO_ID rank_math_title "Upphandlingsutbildningar — Avrop, avtalsuppföljning & spendanalys | Kompetensutveckla"
$WP post meta update $EKO_ID rank_math_description "Utbildningar i offentlig upphandling: avrop, direktupphandlingar, avtalsuppföljning och spendanalys. Lärarledd via Zoom."

# Fordon
$WP post meta update $FORD_ID rank_math_title "Förarbevis snöskoter & vattenskoter — Kurs + certifikat | Kompetensutveckla"
$WP post meta update $FORD_ID rank_math_description "Förarbevis för snöskoter och vattenskoter. Intensivkurs eller blended learning. Från 2 800 kr. Certifikat ingår."

# Engelska
$WP post meta update $ENG_ID rank_math_title "Work Environment Training in English — BAM, BAS P/U, OSA | Kompetensutveckla"
$WP post meta update $ENG_ID rank_math_description "Work environment training in English: BAM, BAS P/U, OSA, safe lift, scaffolding and more. Web courses and teacher-led via Zoom."

echo ""
echo "=== STEG 9: Noindex staging ==="
$WP option update blog_public 0

echo ""
echo "=== KLART ==="
echo "Nya sidor skapade. Nästa steg:"
echo "1. Flytta befintligt innehåll till nya föräldrasidor"
echo "2. Uppdatera EduAdmin-kategorimappning"
echo "3. Lägg in .htaccess-redirects"
echo "4. Konfigurera navigation/meny"
echo "5. Testa alla URLs"
