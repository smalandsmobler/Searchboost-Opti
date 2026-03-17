<?php
/**
 * Plugin Name: SB Kompetensutveckla Design Fixes
 * Description: Fixar design, bilder, centrerade rubriker, enhetliga knappar och brutna lankar
 * Version: 1.3
 * Author: Searchboost
 */

defined('ABSPATH') || exit;

// ============================================================
// BILD-URL:er - Anvander externa URL:er fran kompetensutveckla.se
// OBS: Filnamn med svenska tecken anvander NFD-kodning (dekomponerad Unicode)
// ============================================================
function sb_ku_get_image_url($filename) {
    $upload_dir = wp_upload_dir();
    $local = $upload_dir['basedir'] . '/ku-images/' . $filename;
    if (file_exists($local)) {
        return $upload_dir['baseurl'] . '/ku-images/' . $filename;
    }
    $map = array(
        'bam-2-dagar.webp' => 'https://kompetensutveckla.se/wp-content/uploads/2025/02/BAM-2-dagar.webp',
        'ebam.jpg' => 'https://kompetensutveckla.se/wp-content/uploads/2021/08/ebam-Max-Quality-1-.jpg',
        'bas-p-webb.jpg' => 'https://kompetensutveckla.se/wp-content/uploads/2023/08/Bas-p-webb.jpg',
        'arbete-pa-vag.jpg' => 'https://kompetensutveckla.se/wp-content/uploads/2024/11/Arbete-pa-vag-kurs.jpg',
        'asbest.jpg' => 'https://kompetensutveckla.se/wp-content/uploads/2025/12/Asbest-utbildning-High-Quality-1.jpg',
        'sam-webbutbildning.webp' => 'https://kompetensutveckla.se/wp-content/uploads/2025/02/SAM-webbutbildning.webp',
        'ledningssystem.jpg' => 'https://kompetensutveckla.se/wp-content/uploads/2019/12/ledningssytem-2-300x158.jpg',
        'arbetsmiljoarbete.webp' => 'https://kompetensutveckla.se/wp-content/uploads/2025/10/Arbetsmiljoarbete-300x158.webp',
        'esa-instruerad.jpg' => 'https://kompetensutveckla.se/wp-content/uploads/2021/08/eESA-Instruerad-person-1200x630.jpg',
        'stallning.jpg' => 'https://kompetensutveckla.se/wp-content/uploads/2021/02/Sta%CC%88llning-upp-till-9-meter-webbutbildning.jpg',
        'fallskydd.jpg' => 'https://kompetensutveckla.se/wp-content/uploads/2021/02/Fallskydd-webbutbildning.jpg',
        'slutna-utrymmen.jpg' => 'https://kompetensutveckla.se/wp-content/uploads/2021/08/eSlutna-rum-1200x630-1.jpg',
        'vald-hot.jpg' => 'https://kompetensutveckla.se/wp-content/uploads/2021/08/eVa%CC%8Ald-och-hot-1200x628px.jpg',
        'sakra-lyft.webp' => 'https://kompetensutveckla.se/wp-content/uploads/2025/11/Sakra-Lyft-webbutbildning.webp',
        'kundloggor.jpg' => 'https://kompetensutveckla.se/wp-content/uploads/2020/09/KundLoggor.jpg',
        'afa-logo.png' => 'https://kompetensutveckla.se/wp-content/uploads/2021/03/AFA-259x300.png',
        'om-kompetensutveckla.webp' => 'https://kompetensutveckla.se/wp-content/uploads/2025/02/Om-Kompetensutveckla-300x158.webp',
        'hallbart-foretagande.jpg' => 'https://kompetensutveckla.se/wp-content/uploads/2021/01/Ha%CC%8Allbart-fo%CC%88retagande01.jpg',
        'elektriska-anlaggningar.jpg' => 'https://kompetensutveckla.se/wp-content/uploads/2021/08/eElektriska-anla%CC%88ggningar-1200x630-1.jpg',
    );
    if (isset($map[$filename])) {
        return $map[$filename];
    }
    return '';
}

// ============================================================
// 1. LADDA NER BILDER (behalls for framtida bruk via WP admin)
// ============================================================
add_action('admin_init', 'sb_ku_download_images');
function sb_ku_download_images() {
    if (get_option('sb_ku_images_downloaded')) return;

    $upload_dir = wp_upload_dir();
    $target_dir = $upload_dir['basedir'] . '/ku-images/';

    if (!file_exists($target_dir)) {
        wp_mkdir_p($target_dir);
    }

    $images = array(
        'bam-2-dagar.webp' => 'https://kompetensutveckla.se/wp-content/uploads/2025/02/BAM-2-dagar.webp',
        'ebam.jpg' => 'https://kompetensutveckla.se/wp-content/uploads/2021/08/ebam-Max-Quality-1-.jpg',
        'bas-p-webb.jpg' => 'https://kompetensutveckla.se/wp-content/uploads/2023/08/Bas-p-webb.jpg',
        'arbete-pa-vag.jpg' => 'https://kompetensutveckla.se/wp-content/uploads/2024/11/Arbete-pa-vag-kurs.jpg',
        'esa-instruerad.jpg' => 'https://kompetensutveckla.se/wp-content/uploads/2021/08/eESA-Instruerad-person-1200x630.jpg',
        'ledningssystem.jpg' => 'https://kompetensutveckla.se/wp-content/uploads/2019/12/ledningssytem-2-300x158.jpg',
        'fallskydd.jpg' => 'https://kompetensutveckla.se/wp-content/uploads/2021/02/Fallskydd-webbutbildning.jpg',
        'vald-hot.jpg' => 'https://kompetensutveckla.se/wp-content/uploads/2021/08/eVa%CC%8Ald-och-hot-1200x628px.jpg',
        'hallbart-foretagande.jpg' => 'https://kompetensutveckla.se/wp-content/uploads/2021/01/Ha%CC%8Allbart-fo%CC%88retagande01.jpg',
        'sakra-lyft.webp' => 'https://kompetensutveckla.se/wp-content/uploads/2025/11/Sakra-Lyft-webbutbildning.webp',
    );

    $downloaded = 0;
    foreach ($images as $filename => $url) {
        $target = $target_dir . $filename;
        if (!file_exists($target)) {
            $response = wp_remote_get($url, array('timeout' => 30, 'sslverify' => false));
            if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200) {
                file_put_contents($target, wp_remote_retrieve_body($response));
                $downloaded++;
            }
        }
    }

    if ($downloaded > 0 || count(glob($target_dir . '*')) >= 5) {
        update_option('sb_ku_images_downloaded', true);
    }
}

// ============================================================
// 2. CSS-FIXAR: Centrerade rubriker, enhetliga knappar, hero-bild
// ============================================================
add_action('wp_head', 'sb_ku_design_css', 99);
function sb_ku_design_css() {
    $hero_url = sb_ku_get_image_url('bam-2-dagar.webp');
    ?>
    <style>
    /* ==============================
       HERO-SEKTION MED RIKTIG BILD
       ============================== */
    .ku-hero {
        background: url('<?php echo esc_url($hero_url); ?>') center center / cover no-repeat !important;
        min-height: 420px !important;
        position: relative;
    }
    .ku-hero .ku-hero-overlay {
        background: linear-gradient(135deg, rgba(26,26,46,0.82) 0%, rgba(22,33,62,0.75) 50%, rgba(15,52,96,0.7) 100%) !important;
    }

    /* ==============================
       CENTRERADE RUBRIKER
       ============================== */
    .entry-content h1,
    .entry-content h2,
    .entry-content h3,
    .entry-content h4,
    .ku-hero-title,
    .ku-section-title,
    .ku-usp-card h3,
    .ku-cat-card h3,
    h1.entry-title,
    h2.wp-block-heading,
    .wp-block-heading {
        text-align: center !important;
    }

    .entry-content > p.has-text-align-center,
    .ku-hero-subtitle {
        text-align: center !important;
    }

    /* ==============================
       ENHETLIGA KNAPPAR
       ============================== */
    .ku-cat-card .ku-cat-btn,
    .ku-cat-card .wp-block-button__link,
    .entry-content .wp-block-button__link,
    a.ku-hero-cta,
    .ku-read-more-btn {
        display: inline-block !important;
        min-width: 160px !important;
        max-width: 220px !important;
        width: auto !important;
        padding: 12px 28px !important;
        font-size: 0.95em !important;
        font-weight: 600 !important;
        text-align: center !important;
        border-radius: 8px !important;
        text-decoration: none !important;
        transition: transform 0.2s, box-shadow 0.2s !important;
        box-sizing: border-box !important;
    }
    .ku-cat-card .ku-cat-btn:hover,
    .ku-cat-card .wp-block-button__link:hover,
    .entry-content .wp-block-button__link:hover,
    a.ku-hero-cta:hover,
    .ku-read-more-btn:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
    }

    /* ==============================
       KATEGORI-KORT MED BILDER
       ============================== */
    .ku-category-grid {
        display: grid !important;
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 24px !important;
        max-width: 1200px !important;
        margin: 0 auto 40px !important;
        padding: 0 20px !important;
    }

    .ku-cat-card {
        display: flex !important;
        flex-direction: column !important;
        background: #fff !important;
        border-radius: 12px !important;
        overflow: hidden !important;
        box-shadow: 0 2px 12px rgba(0,0,0,0.08) !important;
        text-decoration: none !important;
        color: #333 !important;
        transition: transform 0.3s, box-shadow 0.3s !important;
    }
    .ku-cat-card:hover {
        transform: translateY(-4px) !important;
        box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
    }

    .ku-cat-card .ku-cat-img {
        width: 100% !important;
        height: 180px !important;
        object-fit: cover !important;
        display: block !important;
    }

    .ku-cat-card .ku-cat-content {
        padding: 20px !important;
        text-align: center !important;
        flex: 1 !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
    }

    .ku-cat-card h3 {
        margin: 0 0 8px 0 !important;
        font-size: 1.15em !important;
        color: #1a1a2e !important;
    }
    .ku-cat-card p {
        margin: 0 0 16px 0 !important;
        font-size: 0.9em !important;
        color: #666 !important;
        line-height: 1.4 !important;
    }

    /* Dolj gamla emoji-ikoner */
    .ku-cat-card .ku-cat-icon {
        display: none !important;
    }

    .ku-cat-card .ku-cat-btn {
        background: #a7ce31 !important;
        color: #1a1a2e !important;
        padding: 10px 24px !important;
        border-radius: 6px !important;
        font-weight: 600 !important;
        font-size: 0.9em !important;
        text-decoration: none !important;
        display: inline-block !important;
        min-width: 140px !important;
        transition: background 0.2s, transform 0.2s !important;
        margin-top: auto !important;
    }
    .ku-cat-card .ku-cat-btn:hover {
        background: #96ba28 !important;
        transform: translateY(-2px) !important;
    }

    /* ==============================
       RESPONSIV DESIGN
       ============================== */
    @media (max-width: 900px) {
        .ku-category-grid {
            grid-template-columns: repeat(2, 1fr) !important;
        }
    }
    @media (max-width: 600px) {
        .ku-category-grid {
            grid-template-columns: 1fr !important;
        }
        .ku-hero {
            min-height: 300px !important;
        }
    }

    /* ==============================
       USP-SEKTIONEN
       ============================== */
    .ku-usp-grid {
        text-align: center !important;
    }
    .ku-usp-card {
        text-align: center !important;
    }
    .ku-usp-number {
        text-align: center !important;
    }
    </style>
    <?php
}

// ============================================================
// 3. BYTA UT KATEGORI-KORT TILL BILDKORT (JavaScript i wp_footer)
//    v1.2: Bytt fran the_content filter till JavaScript DOM-manipulation
//    v1.3: Fixat NFD-kodade bild-URL:er (svenska tecken)
// ============================================================
add_action('wp_footer', 'sb_ku_replace_grid_js', 99);
function sb_ku_replace_grid_js() {
    if (!is_page(7) || is_admin()) return;

    $categories = array(
        array(
            'slug' => 'arbetsmiljo',
            'img' => sb_ku_get_image_url('ebam.jpg'),
            'name' => 'Arbetsmilj&ouml;',
            'desc' => 'BAM, SAM, OSA, skyddsombud',
            'alt' => 'Arbetsmiljoutbildning - BAM och SAM kurser',
        ),
        array(
            'slug' => 'bygg-och-anlaggning',
            'img' => sb_ku_get_image_url('bas-p-webb.jpg'),
            'name' => 'Bygg &amp; Anl&auml;ggning',
            'desc' => 'BAS P/U, st&auml;llning, fallskydd',
            'alt' => 'Byggutbildning - BAS P och BAS U kurser',
        ),
        array(
            'slug' => 'vag-och-transport',
            'img' => sb_ku_get_image_url('arbete-pa-vag.jpg'),
            'name' => 'V&auml;g &amp; Transport',
            'desc' => 'Arbete p&aring; v&auml;g, APV steg 1 &amp; 2',
            'alt' => 'Vagutbildning - Arbete pa vag kurser',
        ),
        array(
            'slug' => 'elsakerhet',
            'img' => sb_ku_get_image_url('esa-instruerad.jpg'),
            'name' => 'Els&auml;kerhet',
            'desc' => 'ESA, instruerad person, elarbete',
            'alt' => 'Elsakerhetsutbildning - ESA kurser',
        ),
        array(
            'slug' => 'ledarskap',
            'img' => sb_ku_get_image_url('ledningssystem.jpg'),
            'name' => 'Ledarskap',
            'desc' => 'Chefsutbildning, arbetsmilj&ouml;ansvar',
            'alt' => 'Ledarskapsutbildning for chefer',
        ),
        array(
            'slug' => 'sakerhet',
            'img' => sb_ku_get_image_url('fallskydd.jpg'),
            'name' => 'S&auml;kerhet &amp; Lyft',
            'desc' => 'Fallskydd, st&auml;llning, s&auml;kra lyft',
            'alt' => 'Sakerhetsutbildning - fallskydd och lyft',
        ),
        array(
            'slug' => 'kris-och-beredskap',
            'img' => sb_ku_get_image_url('vald-hot.jpg'),
            'name' => 'Kris &amp; Beredskap',
            'desc' => 'HLR, f&ouml;rsta hj&auml;lpen, brand',
            'alt' => 'Kris och beredskapsutbildning',
        ),
        array(
            'slug' => 'ekonomi-och-upphandling',
            'img' => sb_ku_get_image_url('hallbart-foretagande.jpg'),
            'name' => 'Ekonomi &amp; Upphandling',
            'desc' => 'Offentlig upphandling, LOU',
            'alt' => 'Ekonomi och upphandlingsutbildning',
        ),
        array(
            'slug' => 'fordon-och-friluft',
            'img' => sb_ku_get_image_url('sakra-lyft.webp'),
            'name' => 'Fordon &amp; Friluft',
            'desc' => 'Truck, motors&aring;g, r&ouml;js&aring;g',
            'alt' => 'Fordon och friluftsutbildning',
        ),
    );

    $home = esc_url(home_url('/'));
    $cards_html = '';
    foreach ($categories as $cat) {
        $url = esc_url(home_url('/utbildningar/' . $cat['slug'] . '/'));
        $img = esc_url($cat['img']);
        $alt = esc_attr($cat['alt']);
        $name = $cat['name'];
        $desc = $cat['desc'];

        $cards_html .= '<a href="' . $url . '" class="ku-cat-card">';
        $cards_html .= '<img src="' . $img . '" alt="' . $alt . '" class="ku-cat-img" loading="lazy">';
        $cards_html .= '<div class="ku-cat-content">';
        $cards_html .= '<h3>' . $name . '</h3>';
        $cards_html .= '<p>' . $desc . '</p>';
        $cards_html .= '<span class="ku-cat-btn">L&auml;s mer &rarr;</span>';
        $cards_html .= '</div></a>';
    }

    $json_html = json_encode($cards_html, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP);
    ?>
    <script>
    (function(){
        var g = document.getElementById('kategorier');
        if (!g) return;
        if (g.querySelector('.ku-cat-img')) return;
        g.innerHTML = <?php echo $json_html; ?>;
        if (!g.classList.contains('ku-category-grid')) {
            g.classList.add('ku-category-grid');
        }
    })();
    </script>
    <?php
}

// ============================================================
// 4. FIXA BRUTNA KURS-LANKAR (EduAdmin)
// ============================================================
add_action('template_redirect', 'sb_ku_fix_broken_course_links');
function sb_ku_fix_broken_course_links() {
    $request_uri = $_SERVER['REQUEST_URI'];

    if (strpos($request_uri, '//') !== false && !is_admin()) {
        $fixed = preg_replace('#/{2,}#', '/', $request_uri);
        if ($fixed !== $request_uri) {
            wp_redirect(home_url($fixed), 301);
            exit;
        }
    }

    if (is_404()) {
        if (preg_match('/.*__\d+\/?$/', $request_uri)) {
            $redirect_map = array(
                'bam' => '/utbildningar/arbetsmiljo/',
                'bas-p' => '/utbildningar/bygg-och-anlaggning/',
                'bas_p' => '/utbildningar/bygg-och-anlaggning/',
                'arbete-pa-vag' => '/utbildningar/vag-och-transport/',
                'esa' => '/utbildningar/elsakerhet/',
                'fallskydd' => '/utbildningar/sakerhet/',
                'stallning' => '/utbildningar/sakerhet/',
                'asbest' => '/utbildningar/bygg-och-anlaggning/',
                'hjart' => '/utbildningar/kris-och-beredskap/',
                'hlr' => '/utbildningar/kris-och-beredskap/',
                'brand' => '/utbildningar/kris-och-beredskap/',
                'truck' => '/utbildningar/fordon-och-friluft/',
                'motorsag' => '/utbildningar/fordon-och-friluft/',
            );

            $lower_uri = mb_strtolower($request_uri, 'UTF-8');
            foreach ($redirect_map as $keyword => $target) {
                if (strpos($lower_uri, $keyword) !== false) {
                    wp_redirect(home_url($target), 302);
                    exit;
                }
            }

            wp_redirect(home_url('/kontakta-oss/'), 302);
            exit;
        }
    }
}

// ============================================================
// 5. FIXA ENCODING
// ============================================================
add_action('send_headers', 'sb_ku_utf8_headers');
function sb_ku_utf8_headers() {
    header('Content-Type: text/html; charset=UTF-8');
}

// ============================================================
// 6. ADMIN-SIDA
// ============================================================
add_action('admin_menu', 'sb_ku_admin_menu');
function sb_ku_admin_menu() {
    add_management_page(
        'KU Bildhantering',
        'KU Bilder',
        'manage_options',
        'sb-ku-images',
        'sb_ku_admin_page'
    );
}

function sb_ku_admin_page() {
    if (isset($_POST['sb_ku_redownload']) && check_admin_referer('sb_ku_redownload')) {
        delete_option('sb_ku_images_downloaded');
        sb_ku_download_images();
        echo '<div class="notice notice-success"><p>Bilder nedladdade!</p></div>';
    }

    $upload_dir = wp_upload_dir();
    $img_dir = $upload_dir['basedir'] . '/ku-images/';
    $images = file_exists($img_dir) ? glob($img_dir . '*') : array();

    echo '<div class="wrap">';
    echo '<h1>Kompetensutveckla - Bildhantering</h1>';
    echo '<p>Antal bilder: <strong>' . count($images) . '</strong></p>';

    if (count($images) > 0) {
        echo '<ul>';
        foreach ($images as $img) {
            echo '<li>' . basename($img) . ' (' . round(filesize($img)/1024) . ' KB)</li>';
        }
        echo '</ul>';
    }

    echo '<form method="post">';
    wp_nonce_field('sb_ku_redownload');
    echo '<input type="hidden" name="sb_ku_redownload" value="1">';
    echo '<p><button type="submit" class="button button-primary">Ladda ner bilder igen</button></p>';
    echo '</form>';
    echo '</div>';
}
