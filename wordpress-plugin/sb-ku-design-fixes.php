<?php
/**
 * Plugin Name: Searchboost KU Design Fixes
 * Description: Design, UX och konverteringsfixar för Kompetensutveckla.se staging
 * Version: 2.0.0
 * Author: Searchboost.se
 *
 * MU-Plugin: Placeras i wp-content/mu-plugins/sb-ku-design-fixes.php
 * Alla fixar samlade i en fil för enkel deploy.
 *
 * Fixar:
 * 1. Kontaktformulär (auto-injicerat på kontakta-oss)
 * 2. Utbildningstyp-badges (Webb/Lärarledd/Fysisk)
 * 3. Nyhetsbrev-prompt i kunskapshubbarna (med skip)
 * 4. Kursrekommendationer i kunskapshubbarna
 * 5. Standardiserade knappar
 * 6. Förbättrad kundresa med CTAs
 * 7. Footer med navigation och kontaktinfo
 */

if (!defined('ABSPATH')) exit;

// ============================================================
// 1. KONTAKTFORMULÄR
// ============================================================

/**
 * Hantera formulärinlämning
 */
add_action('init', function() {
    if (!isset($_POST['sb_contact_nonce'])) return;
    if (!wp_verify_nonce($_POST['sb_contact_nonce'], 'sb_contact_form')) return;

    $name    = sanitize_text_field($_POST['sb_name'] ?? '');
    $email   = sanitize_email($_POST['sb_email'] ?? '');
    $phone   = sanitize_text_field($_POST['sb_phone'] ?? '');
    $company = sanitize_text_field($_POST['sb_company'] ?? '');
    $subject = sanitize_text_field($_POST['sb_subject'] ?? 'Förfrågan');
    $message = sanitize_textarea_field($_POST['sb_message'] ?? '');

    if (empty($name) || empty($email) || empty($message)) {
        set_transient('sb_contact_error', 'Fyll i alla obligatoriska fält.', 30);
        return;
    }

    $to = 'info@kompetensutveckla.se';
    $email_subject = "Kontaktförfrågan: $subject";
    $body  = "Namn: $name\n";
    $body .= "E-post: $email\n";
    $body .= "Telefon: $phone\n";
    $body .= "Företag: $company\n";
    $body .= "Ämne: $subject\n\n";
    $body .= "Meddelande:\n$message\n";

    $headers = ["From: $name <$email>", "Reply-To: $email"];

    if (wp_mail($to, $email_subject, $body, $headers)) {
        set_transient('sb_contact_success', true, 30);
    } else {
        set_transient('sb_contact_error', 'Något gick fel. Försök igen eller ring oss.', 30);
    }
});

/**
 * Auto-injicera kontaktformulär på kontakta-oss-sidan
 */
add_filter('the_content', function($content) {
    if (!is_page('kontakta-oss')) return $content;

    $success = get_transient('sb_contact_success');
    $error   = get_transient('sb_contact_error');
    delete_transient('sb_contact_success');
    delete_transient('sb_contact_error');

    $form = '<div class="sb-contact-section">';
    $form .= '<h2 class="sb-section-heading">Skicka ett meddelande</h2>';
    $form .= '<p class="sb-section-desc">Fyll i formuläret nedan så återkommer vi inom 24 timmar.</p>';

    if ($success) {
        $form .= '<div class="sb-alert sb-alert-success">Tack för ditt meddelande! Vi återkommer inom kort.</div>';
    }
    if ($error) {
        $form .= '<div class="sb-alert sb-alert-error">' . esc_html($error) . '</div>';
    }

    $form .= '<form method="post" class="sb-contact-form">';
    $form .= wp_nonce_field('sb_contact_form', 'sb_contact_nonce', true, false);

    $form .= '<div class="sb-form-grid">';
    $form .= '<div class="sb-form-group">';
    $form .= '<label for="sb_name">Namn <span class="required">*</span></label>';
    $form .= '<input type="text" id="sb_name" name="sb_name" required placeholder="Ditt namn">';
    $form .= '</div>';

    $form .= '<div class="sb-form-group">';
    $form .= '<label for="sb_email">E-post <span class="required">*</span></label>';
    $form .= '<input type="email" id="sb_email" name="sb_email" required placeholder="din@email.se">';
    $form .= '</div>';

    $form .= '<div class="sb-form-group">';
    $form .= '<label for="sb_phone">Telefon</label>';
    $form .= '<input type="tel" id="sb_phone" name="sb_phone" placeholder="070-123 45 67">';
    $form .= '</div>';

    $form .= '<div class="sb-form-group">';
    $form .= '<label for="sb_company">Företag</label>';
    $form .= '<input type="text" id="sb_company" name="sb_company" placeholder="Ditt företag">';
    $form .= '</div>';
    $form .= '</div>'; // .sb-form-grid

    $form .= '<div class="sb-form-group">';
    $form .= '<label for="sb_subject">Ämne</label>';
    $form .= '<select id="sb_subject" name="sb_subject">';
    $form .= '<option value="Förfrågan">Allmän förfrågan</option>';
    $form .= '<option value="Boka utbildning">Boka utbildning</option>';
    $form .= '<option value="Offert">Begär offert</option>';
    $form .= '<option value="Företagsanpassad">Företagsanpassad utbildning</option>';
    $form .= '<option value="Övrigt">Övrigt</option>';
    $form .= '</select>';
    $form .= '</div>';

    $form .= '<div class="sb-form-group">';
    $form .= '<label for="sb_message">Meddelande <span class="required">*</span></label>';
    $form .= '<textarea id="sb_message" name="sb_message" rows="5" required placeholder="Berätta vad vi kan hjälpa dig med..."></textarea>';
    $form .= '</div>';

    $form .= '<button type="submit" class="sb-btn sb-btn-primary sb-btn-lg">Skicka meddelande</button>';
    $form .= '</form>';
    $form .= '</div>';

    // Injicera formuläret FÖRE personalistan
    // Letar efter första <h3> som troligen är en person
    $pos = strpos($content, '<h3');
    if ($pos !== false) {
        $content = substr($content, 0, $pos) . $form . '<h2 class="sb-section-heading">Vårt team</h2>' . substr($content, $pos);
    } else {
        $content .= $form;
    }

    return $content;
}, 20);


// ============================================================
// 2. UTBILDNINGSTYP-BADGES
// ============================================================

/**
 * Injicera format-badges på utbildningskategori-sidor
 */
add_action('wp_footer', function() {
    // Bara på utbildningssidor
    if (!is_page() && !is_singular()) return;

    $url = $_SERVER['REQUEST_URI'] ?? '';
    $is_education_page = (strpos($url, '/utbildningar/') !== false);
    if (!$is_education_page) return;

    ?>
    <script>
    (function() {
        // Kursformat-data baserat på kursnamn
        var courseFormats = {
            'bam':          ['Webb', 'Lärarledd', 'Fysisk'],
            'sam':          ['Webb', 'Lärarledd'],
            'osa':          ['Webb'],
            'skyddsombud':  ['Webb', 'Lärarledd', 'Fysisk'],
            'bas-p':        ['Webb', 'Lärarledd', 'Fysisk'],
            'bas-u':        ['Webb', 'Lärarledd', 'Fysisk'],
            'arbete-pa-vag':['Webb', 'Lärarledd', 'Fysisk'],
            'arbete-på-väg':['Webb', 'Lärarledd', 'Fysisk'],
            'esa':          ['Webb'],
            'heta-arbeten': ['Fysisk'],
            'hjart-lung':   ['Fysisk'],
            'fallskydd':    ['Fysisk'],
            'truck':        ['Fysisk'],
            'lift':         ['Fysisk'],
            'kris':         ['Webb', 'Lärarledd'],
            'ledarskap':    ['Webb', 'Lärarledd'],
            'chef':         ['Webb', 'Lärarledd'],
            'brandskydd':   ['Webb', 'Fysisk'],
            'första-hjälpen':['Fysisk'],
            'hlr':          ['Fysisk'],
            'ergonomi':     ['Webb'],
            'stress':       ['Webb'],
            'hot-och-våld': ['Webb', 'Lärarledd']
        };

        function getFormats(text) {
            text = text.toLowerCase();
            for (var key in courseFormats) {
                if (text.indexOf(key) !== -1) return courseFormats[key];
            }
            // Default: om inget matchas, gissa Webb
            if (text.indexOf('webb') !== -1 || text.indexOf('online') !== -1 || text.indexOf('web') !== -1) return ['Webb'];
            if (text.indexOf('fysisk') !== -1 || text.indexOf('plats') !== -1) return ['Fysisk'];
            if (text.indexOf('lärarledd') !== -1 || text.indexOf('teacher') !== -1) return ['Lärarledd'];
            return null;
        }

        var badgeColors = {
            'Webb': '#2196F3',
            'Lärarledd': '#FF9800',
            'Fysisk': '#4CAF50'
        };

        var badgeIcons = {
            'Webb': '💻',
            'Lärarledd': '👨‍🏫',
            'Fysisk': '🏢'
        };

        // Hitta alla kurskort (h3-element i utbildningssidor)
        var headings = document.querySelectorAll('.entry-content h3');
        headings.forEach(function(h3) {
            var text = h3.textContent || '';
            var formats = getFormats(text);
            if (!formats) return;

            // Skapa badge-container
            var container = document.createElement('div');
            container.className = 'sb-format-badges';

            formats.forEach(function(fmt) {
                var badge = document.createElement('span');
                badge.className = 'sb-format-badge sb-format-' + fmt.toLowerCase().replace('ä', 'a');
                badge.style.backgroundColor = badgeColors[fmt] || '#666';
                badge.textContent = badgeIcons[fmt] + ' ' + fmt;
                container.appendChild(badge);
            });

            // Injicera efter h3
            h3.parentNode.insertBefore(container, h3.nextSibling);
        });
    })();
    </script>
    <?php
}, 99);


// ============================================================
// 3. NYHETSBREV-PROMPT I KUNSKAPSHUBBARNA
// ============================================================

add_action('wp_footer', function() {
    $url = $_SERVER['REQUEST_URI'] ?? '';
    if (strpos($url, '/kunskapsbank/') === false) return;

    ?>
    <div id="sb-newsletter-banner" class="sb-newsletter-banner" style="display:none;">
        <div class="sb-newsletter-inner">
            <button class="sb-newsletter-close" onclick="sbDismissNewsletter()" aria-label="Stäng">&times;</button>
            <div class="sb-newsletter-content">
                <div class="sb-newsletter-icon">📬</div>
                <h3>Håll dig uppdaterad inom arbetsmiljö</h3>
                <p>Få checklistor, mallar och nyheter direkt i din inkorg. Helt gratis.</p>
                <form class="sb-newsletter-form" action="https://kompetensutveckla.hemsida.eu/" method="get" onsubmit="return sbNewsletterSubmit(this)">
                    <div class="sb-newsletter-input-group">
                        <input type="email" name="sb_nl_email" placeholder="Din e-postadress" required>
                        <button type="submit" class="sb-btn sb-btn-primary">Prenumerera</button>
                    </div>
                </form>
                <button class="sb-newsletter-skip" onclick="sbDismissNewsletter()">Nej tack, hoppa över</button>
            </div>
        </div>
    </div>

    <script>
    function sbDismissNewsletter() {
        document.getElementById('sb-newsletter-banner').style.display = 'none';
        document.cookie = 'sb_nl_dismissed=1;path=/;max-age=' + (86400 * 30);
    }

    function sbNewsletterSubmit(form) {
        var email = form.querySelector('input[type="email"]').value;
        // Spara e-post via AJAX till WP eller extern tjänst
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/wp-admin/admin-ajax.php', true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function() {
            document.getElementById('sb-newsletter-banner').innerHTML =
                '<div class="sb-newsletter-inner"><div class="sb-newsletter-content" style="text-align:center;padding:40px;">' +
                '<div class="sb-newsletter-icon">✅</div>' +
                '<h3>Tack för din prenumeration!</h3>' +
                '<p>Du kommer snart få aktuell info om arbetsmiljö direkt i din inkorg.</p>' +
                '</div></div>';
            document.cookie = 'sb_nl_dismissed=1;path=/;max-age=' + (86400 * 365);
            setTimeout(function() { document.getElementById('sb-newsletter-banner').style.display = 'none'; }, 4000);
        };
        xhr.send('action=sb_newsletter_signup&email=' + encodeURIComponent(email));
        return false;
    }

    // Visa banner efter 15 sek scrollning, om inte redan dismissad
    (function() {
        if (document.cookie.indexOf('sb_nl_dismissed=1') !== -1) return;
        var shown = false;
        window.addEventListener('scroll', function() {
            if (shown) return;
            var scrollPct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
            if (scrollPct > 40) {
                document.getElementById('sb-newsletter-banner').style.display = 'flex';
                shown = true;
            }
        });
        // Fallback: visa efter 20 sek
        setTimeout(function() {
            if (shown) return;
            document.getElementById('sb-newsletter-banner').style.display = 'flex';
            shown = true;
        }, 20000);
    })();
    </script>
    <?php
});

// AJAX-handler för nyhetsbrev
add_action('wp_ajax_sb_newsletter_signup', 'sb_handle_newsletter');
add_action('wp_ajax_nopriv_sb_newsletter_signup', 'sb_handle_newsletter');
function sb_handle_newsletter() {
    $email = sanitize_email($_POST['email'] ?? '');
    if (empty($email)) wp_die('error');

    // Spara i WP options som enkel lista (kan bytas mot Mailchimp/Brevo API)
    $subscribers = get_option('sb_newsletter_subscribers', []);
    if (!in_array($email, $subscribers)) {
        $subscribers[] = $email;
        update_option('sb_newsletter_subscribers', $subscribers);
    }

    // Skicka bekräftelsemail
    wp_mail($email, 'Välkommen till Kompetensutvecklas nyhetsbrev',
        "Hej!\n\nTack för att du prenumererar på vårt nyhetsbrev.\n" .
        "Du kommer att få tips, checklistor och nyheter om arbetsmiljö.\n\n" .
        "Med vänlig hälsning,\nKompetensutveckla"
    );

    wp_die('ok');
}


// ============================================================
// 4. KURSREKOMMENDATIONER I KUNSKAPSHUBBARNA
// ============================================================

add_filter('the_content', function($content) {
    $url = $_SERVER['REQUEST_URI'] ?? '';
    if (strpos($url, '/kunskapsbank/') === false) return $content;
    if (is_front_page()) return $content;

    // Bestäm vilka kurser som ska rekommenderas baserat på URL
    $recommendations = sb_get_course_recommendations($url);
    if (empty($recommendations)) return $content;

    $cta  = '<div class="sb-course-recommendations">';
    $cta .= '<h3>📚 Relaterade utbildningar</h3>';
    $cta .= '<p>Vill du fördjupa dina kunskaper? Boka en utbildning inom samma område.</p>';
    $cta .= '<div class="sb-course-rec-grid">';

    foreach ($recommendations as $course) {
        $cta .= '<a href="' . esc_url($course['url']) . '" class="sb-course-rec-card">';
        $cta .= '<div class="sb-course-rec-info">';
        $cta .= '<strong>' . esc_html($course['name']) . '</strong>';
        $cta .= '<span class="sb-course-rec-desc">' . esc_html($course['desc']) . '</span>';
        if (!empty($course['formats'])) {
            $cta .= '<div class="sb-format-badges sb-format-badges-sm">';
            foreach ($course['formats'] as $fmt) {
                $cta .= '<span class="sb-format-badge sb-format-' . sanitize_title($fmt) . '">' . esc_html($fmt) . '</span>';
            }
            $cta .= '</div>';
        }
        $cta .= '</div>';
        $cta .= '<span class="sb-btn sb-btn-sm sb-btn-primary">Läs mer →</span>';
        $cta .= '</a>';
    }

    $cta .= '</div>'; // grid
    $cta .= '<div class="sb-course-rec-footer">';
    $cta .= '<a href="/utbildningar/" class="sb-btn sb-btn-outline">Se alla utbildningar →</a>';
    $cta .= '</div>';
    $cta .= '</div>';

    return $content . $cta;
}, 30);

function sb_get_course_recommendations($url) {
    $courses = [
        'arbetsmiljo' => [
            ['name' => 'BAM — Bättre Arbetsmiljö', 'url' => '/utbildningar/arbetsmiljo/', 'desc' => 'Sveriges mest populära arbetsmiljöutbildning. 2–3 dagar.', 'formats' => ['Webb', 'Lärarledd', 'Fysisk']],
            ['name' => 'SAM — Systematiskt Arbetsmiljöarbete', 'url' => '/utbildningar/arbetsmiljo/', 'desc' => 'Lär dig systematiskt arbetsmiljöarbete enligt AFS 2001:1.', 'formats' => ['Webb', 'Lärarledd']],
            ['name' => 'Skyddsombudsutbildning', 'url' => '/utbildningar/arbetsmiljo/', 'desc' => 'Komplett utbildning för skyddsombud.', 'formats' => ['Webb', 'Lärarledd', 'Fysisk']],
        ],
        'sakerhet' => [
            ['name' => 'Heta Arbeten', 'url' => '/utbildningar/sakerhet/', 'desc' => 'Certifierad utbildning för arbete med brandfarliga ämnen.', 'formats' => ['Fysisk']],
            ['name' => 'Fallskyddsutbildning', 'url' => '/utbildningar/sakerhet/', 'desc' => 'Arbete på höjd – säkerhet och utrustning.', 'formats' => ['Fysisk']],
        ],
        'ledarskap' => [
            ['name' => 'Ny som chef', 'url' => '/utbildningar/ledarskap/', 'desc' => 'Praktisk ledarskapsutbildning för nya chefer.', 'formats' => ['Webb', 'Lärarledd']],
        ],
        'bygg' => [
            ['name' => 'BAS P & BAS U', 'url' => '/utbildningar/bygg-och-anlaggning/', 'desc' => 'Byggarbetsmiljösamordnare – planering och utförande.', 'formats' => ['Webb', 'Lärarledd', 'Fysisk']],
        ],
    ];

    // Matcha URL mot ämne
    if (strpos($url, 'checklistor') !== false || strpos($url, 'rutiner') !== false || strpos($url, 'mallar') !== false) {
        return $courses['arbetsmiljo'];
    }
    if (strpos($url, 'afs') !== false || strpos($url, 'lagar') !== false) {
        return $courses['arbetsmiljo'];
    }
    if (strpos($url, 'artiklar') !== false) {
        return $courses['arbetsmiljo']; // Default till arbetsmiljö
    }

    // Default: visa de mest populära
    return [
        $courses['arbetsmiljo'][0], // BAM
        $courses['arbetsmiljo'][1], // SAM
        $courses['bygg'][0],        // BAS P/U
    ];
}


// ============================================================
// 5. FÖRBÄTTRAD FOOTER
// ============================================================

add_action('wp_footer', function() {
    ?>
    <div class="sb-enhanced-footer">
        <div class="sb-footer-inner">
            <div class="sb-footer-grid">
                <div class="sb-footer-col">
                    <h4>Utbildningar</h4>
                    <ul>
                        <li><a href="/utbildningar/arbetsmiljo/">Arbetsmiljö</a></li>
                        <li><a href="/utbildningar/sakerhet/">Säkerhet</a></li>
                        <li><a href="/utbildningar/ledarskap/">Ledarskap</a></li>
                        <li><a href="/utbildningar/bygg-och-anlaggning/">Bygg & Anläggning</a></li>
                        <li><a href="/utbildningar/elsakerhet/">Elsäkerhet</a></li>
                        <li><a href="/utbildningar/kris-och-beredskap/">Kris & Beredskap</a></li>
                    </ul>
                </div>
                <div class="sb-footer-col">
                    <h4>Kunskapsbank</h4>
                    <ul>
                        <li><a href="/kunskapsbank/checklistor/">Checklistor</a></li>
                        <li><a href="/kunskapsbank/mallar/">Mallar</a></li>
                        <li><a href="/kunskapsbank/rutiner/">Rutiner</a></li>
                        <li><a href="/kunskapsbank/artiklar/">Artiklar</a></li>
                        <li><a href="/kunskapsbank/lagar-och-regler/">Lagar & Regler</a></li>
                    </ul>
                </div>
                <div class="sb-footer-col">
                    <h4>Kontakt</h4>
                    <ul class="sb-footer-contact">
                        <li>📞 <a href="tel:+46102067620">010-206 76 20</a></li>
                        <li>✉️ <a href="mailto:info@kompetensutveckla.se">info@kompetensutveckla.se</a></li>
                        <li>📍 Allsta 127, 853 58 Sundsvall</li>
                    </ul>
                    <div class="sb-footer-social">
                        <a href="https://facebook.com/kompetensutveckla" target="_blank" rel="noopener" aria-label="Facebook">
                            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
                        </a>
                    </div>
                </div>
                <div class="sb-footer-col">
                    <h4>Om oss</h4>
                    <ul>
                        <li><a href="/kontakta-oss/">Kontakta oss</a></li>
                        <li><a href="/om-oss/">Om Kompetensutveckla</a></li>
                        <li>Org.nr: 559070-3913</li>
                    </ul>
                </div>
            </div>
            <div class="sb-footer-bottom">
                <p>&copy; <?php echo date('Y'); ?> Kompetensutveckla. Alla rättigheter förbehållna.</p>
            </div>
        </div>
    </div>
    <?php
}, 5);


// ============================================================
// 6. KUNDRESA-CTA (sticky bottom bar på utbildningssidor)
// ============================================================

add_action('wp_footer', function() {
    $url = $_SERVER['REQUEST_URI'] ?? '';
    if (strpos($url, '/utbildningar/') === false) return;

    ?>
    <div id="sb-sticky-cta" class="sb-sticky-cta" style="display:none;">
        <div class="sb-sticky-cta-inner">
            <span class="sb-sticky-cta-text">Intresserad av denna utbildning?</span>
            <div class="sb-sticky-cta-buttons">
                <a href="tel:+46102067620" class="sb-btn sb-btn-outline sb-btn-sm">📞 Ring oss</a>
                <a href="/kontakta-oss/" class="sb-btn sb-btn-primary sb-btn-sm">Boka utbildning →</a>
            </div>
        </div>
    </div>
    <script>
    (function() {
        var stickyShown = false;
        window.addEventListener('scroll', function() {
            if (stickyShown) return;
            if (window.scrollY > 400) {
                document.getElementById('sb-sticky-cta').style.display = 'block';
                stickyShown = true;
            }
        });
    })();
    </script>
    <?php
});


// ============================================================
// 7. CSS — ALLT SAMLAT
// ============================================================

add_action('wp_head', function() {
    ?>
    <style id="sb-ku-design-fixes">
    /* ============================
       CSS Variables
       ============================ */
    :root {
        --ku-primary: #a7ce31;
        --ku-primary-dark: #8ab522;
        --ku-primary-light: #c5e35e;
        --ku-text: #333;
        --ku-heading: #222;
        --ku-bg: #f9f9f9;
        --ku-white: #fff;
        --ku-dark: #1a1a1a;
        --ku-border: #e0e0e0;
        --ku-badge-webb: #2196F3;
        --ku-badge-lararledd: #FF9800;
        --ku-badge-fysisk: #4CAF50;
        --ku-radius: 8px;
        --ku-radius-lg: 12px;
        --ku-shadow: 0 2px 8px rgba(0,0,0,0.08);
        --ku-shadow-hover: 0 4px 16px rgba(0,0,0,0.12);
        --ku-transition: all 0.25s ease;
    }

    /* ============================
       Headings — Centrerade
       ============================ */
    .entry-content h1,
    .entry-content h2,
    .entry-content h3,
    h1.entry-title,
    h2.wp-block-heading,
    .sb-section-heading {
        text-align: center !important;
        color: var(--ku-heading);
        font-family: 'Open Sans', sans-serif;
        font-weight: 700;
        line-height: 1.3;
    }

    h1.entry-title {
        font-size: 2.4rem;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 3px solid var(--ku-primary);
        display: inline-block;
        width: auto;
    }
    /* Center the inline-block h1 */
    .entry-header {
        text-align: center;
    }

    .sb-section-heading {
        font-size: 1.6rem;
        margin: 48px 0 16px;
    }

    .sb-section-desc {
        text-align: center;
        color: #666;
        font-size: 1.05rem;
        margin-bottom: 32px;
    }

    /* ============================
       Standardiserade Knappar
       ============================ */
    .sb-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-family: 'Open Sans', sans-serif;
        font-weight: 700;
        text-decoration: none;
        border: none;
        cursor: pointer;
        transition: var(--ku-transition);
        border-radius: var(--ku-radius);
        text-align: center;
        line-height: 1.4;
    }

    /* Primary */
    .sb-btn-primary {
        background: var(--ku-primary);
        color: var(--ku-white) !important;
        padding: 12px 28px;
        font-size: 0.95rem;
        min-width: 160px;
    }
    .sb-btn-primary:hover {
        background: var(--ku-primary-dark);
        transform: translateY(-2px);
        box-shadow: var(--ku-shadow-hover);
        color: var(--ku-white) !important;
    }

    /* Outline */
    .sb-btn-outline {
        background: transparent;
        color: var(--ku-primary) !important;
        border: 2px solid var(--ku-primary);
        padding: 10px 24px;
        font-size: 0.95rem;
        min-width: 160px;
    }
    .sb-btn-outline:hover {
        background: var(--ku-primary);
        color: var(--ku-white) !important;
        transform: translateY(-2px);
    }

    /* Size variants */
    .sb-btn-lg {
        padding: 14px 36px;
        font-size: 1.05rem;
        min-width: 200px;
    }
    .sb-btn-sm {
        padding: 8px 18px;
        font-size: 0.85rem;
        min-width: 120px;
    }

    /* Make existing WP buttons consistent */
    .wp-block-button__link,
    .entry-content a.button,
    .entry-content .wp-block-button__link,
    .ku-cat-btn,
    .ku-hero-cta {
        background: var(--ku-primary) !important;
        color: var(--ku-white) !important;
        padding: 12px 28px !important;
        border-radius: var(--ku-radius) !important;
        font-weight: 700 !important;
        font-size: 0.95rem !important;
        text-decoration: none !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-width: 160px !important;
        transition: var(--ku-transition) !important;
    }
    .wp-block-button__link:hover,
    .entry-content a.button:hover,
    .ku-cat-btn:hover,
    .ku-hero-cta:hover {
        background: var(--ku-primary-dark) !important;
        transform: translateY(-2px) !important;
        box-shadow: var(--ku-shadow-hover) !important;
    }

    /* ============================
       Format Badges
       ============================ */
    .sb-format-badges {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin: 8px 0 12px;
        justify-content: center;
    }

    .sb-format-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--ku-white);
        letter-spacing: 0.02em;
    }
    .sb-format-webb     { background: var(--ku-badge-webb); }
    .sb-format-lararledd { background: var(--ku-badge-lararledd); }
    .sb-format-fysisk   { background: var(--ku-badge-fysisk); }

    .sb-format-badges-sm .sb-format-badge {
        padding: 2px 8px;
        font-size: 0.7rem;
    }

    /* ============================
       Kontaktformulär
       ============================ */
    .sb-contact-section {
        max-width: 700px;
        margin: 40px auto;
        padding: 40px;
        background: var(--ku-white);
        border-radius: var(--ku-radius-lg);
        box-shadow: var(--ku-shadow);
        border: 1px solid var(--ku-border);
    }

    .sb-form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
    }

    .sb-form-group {
        margin-bottom: 16px;
    }

    .sb-form-group label {
        display: block;
        font-weight: 600;
        margin-bottom: 6px;
        color: var(--ku-heading);
        font-size: 0.9rem;
    }

    .sb-form-group .required {
        color: #e53935;
    }

    .sb-form-group input,
    .sb-form-group select,
    .sb-form-group textarea {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid var(--ku-border);
        border-radius: var(--ku-radius);
        font-size: 0.95rem;
        font-family: 'Open Sans', sans-serif;
        transition: border-color 0.2s ease;
        background: var(--ku-bg);
        box-sizing: border-box;
    }

    .sb-form-group input:focus,
    .sb-form-group select:focus,
    .sb-form-group textarea:focus {
        outline: none;
        border-color: var(--ku-primary);
        box-shadow: 0 0 0 3px rgba(167, 206, 49, 0.15);
    }

    .sb-alert {
        padding: 16px 20px;
        border-radius: var(--ku-radius);
        margin-bottom: 24px;
        font-weight: 600;
    }
    .sb-alert-success {
        background: #e8f5e9;
        color: #2e7d32;
        border: 1px solid #a5d6a7;
    }
    .sb-alert-error {
        background: #ffebee;
        color: #c62828;
        border: 1px solid #ef9a9a;
    }

    /* ============================
       Nyhetsbrev Banner
       ============================ */
    .sb-newsletter-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        display: flex;
        justify-content: center;
        padding: 0 20px;
        animation: sbSlideUp 0.4s ease;
    }

    @keyframes sbSlideUp {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    .sb-newsletter-inner {
        max-width: 700px;
        width: 100%;
        background: var(--ku-dark);
        border-radius: var(--ku-radius-lg) var(--ku-radius-lg) 0 0;
        padding: 32px;
        position: relative;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
    }

    .sb-newsletter-close {
        position: absolute;
        top: 12px;
        right: 16px;
        background: none;
        border: none;
        color: #999;
        font-size: 1.8rem;
        cursor: pointer;
        padding: 4px 8px;
        line-height: 1;
    }
    .sb-newsletter-close:hover {
        color: var(--ku-white);
    }

    .sb-newsletter-content {
        text-align: center;
        color: var(--ku-white);
    }

    .sb-newsletter-icon {
        font-size: 2rem;
        margin-bottom: 8px;
    }

    .sb-newsletter-content h3 {
        color: var(--ku-white) !important;
        font-size: 1.3rem;
        margin: 0 0 8px;
    }

    .sb-newsletter-content p {
        color: #ccc;
        margin: 0 0 20px;
        font-size: 0.95rem;
    }

    .sb-newsletter-input-group {
        display: flex;
        gap: 12px;
        max-width: 460px;
        margin: 0 auto;
    }

    .sb-newsletter-input-group input {
        flex: 1;
        padding: 12px 16px;
        border: 2px solid #444;
        border-radius: var(--ku-radius);
        background: #2a2a2a;
        color: var(--ku-white);
        font-size: 0.95rem;
    }
    .sb-newsletter-input-group input:focus {
        border-color: var(--ku-primary);
        outline: none;
    }

    .sb-newsletter-input-group .sb-btn {
        white-space: nowrap;
        min-width: auto;
    }

    .sb-newsletter-skip {
        background: none;
        border: none;
        color: #888;
        font-size: 0.82rem;
        cursor: pointer;
        margin-top: 12px;
        text-decoration: underline;
    }
    .sb-newsletter-skip:hover {
        color: #bbb;
    }

    /* ============================
       Kursrekommendationer
       ============================ */
    .sb-course-recommendations {
        margin: 48px 0 32px;
        padding: 40px 32px;
        background: linear-gradient(135deg, #f8fdf0 0%, #f0f7e0 100%);
        border-radius: var(--ku-radius-lg);
        border: 1px solid #d4e8a0;
    }

    .sb-course-recommendations h3 {
        color: var(--ku-heading) !important;
        font-size: 1.4rem;
        margin: 0 0 8px;
    }

    .sb-course-recommendations > p {
        text-align: center;
        color: #666;
        margin-bottom: 24px;
    }

    .sb-course-rec-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
    }

    .sb-course-rec-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 16px 20px;
        background: var(--ku-white);
        border-radius: var(--ku-radius);
        border: 1px solid var(--ku-border);
        text-decoration: none;
        color: var(--ku-text);
        transition: var(--ku-transition);
    }
    .sb-course-rec-card:hover {
        border-color: var(--ku-primary);
        box-shadow: var(--ku-shadow-hover);
        transform: translateY(-2px);
    }

    .sb-course-rec-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .sb-course-rec-info strong {
        font-size: 1rem;
        color: var(--ku-heading);
    }

    .sb-course-rec-desc {
        font-size: 0.85rem;
        color: #666;
    }

    .sb-course-rec-footer {
        text-align: center;
    }

    /* ============================
       Enhanced Footer
       ============================ */
    .sb-enhanced-footer {
        background: var(--ku-dark);
        color: #ccc;
        padding: 0;
    }

    .sb-footer-inner {
        max-width: 1200px;
        margin: 0 auto;
        padding: 48px 24px 0;
    }

    .sb-footer-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 32px;
        padding-bottom: 40px;
        border-bottom: 1px solid #333;
    }

    .sb-footer-col h4 {
        color: var(--ku-white);
        font-size: 1rem;
        font-weight: 700;
        margin: 0 0 16px;
        text-align: left !important;
    }

    .sb-footer-col ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .sb-footer-col ul li {
        margin-bottom: 8px;
        font-size: 0.9rem;
    }

    .sb-footer-col ul li a {
        color: #aaa;
        text-decoration: none;
        transition: color 0.2s;
    }
    .sb-footer-col ul li a:hover {
        color: var(--ku-primary);
    }

    .sb-footer-contact li {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .sb-footer-social {
        margin-top: 16px;
        display: flex;
        gap: 12px;
    }
    .sb-footer-social a {
        color: #aaa;
        transition: color 0.2s;
    }
    .sb-footer-social a:hover {
        color: var(--ku-primary);
    }

    .sb-footer-bottom {
        padding: 20px 0;
        text-align: center;
        font-size: 0.85rem;
        color: #666;
    }

    /* Hide original footer content since we have enhanced version */
    footer.site-footer .footer-widgets-container,
    .site-info {
        display: none !important;
    }

    /* ============================
       Sticky CTA Bar
       ============================ */
    .sb-sticky-cta {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 9998;
        background: var(--ku-white);
        border-top: 2px solid var(--ku-primary);
        box-shadow: 0 -2px 12px rgba(0,0,0,0.1);
        animation: sbSlideUp 0.3s ease;
    }

    .sb-sticky-cta-inner {
        max-width: 1200px;
        margin: 0 auto;
        padding: 12px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
    }

    .sb-sticky-cta-text {
        font-weight: 600;
        color: var(--ku-heading);
        font-size: 0.95rem;
    }

    .sb-sticky-cta-buttons {
        display: flex;
        gap: 12px;
    }

    /* ============================
       Responsive
       ============================ */
    @media (max-width: 768px) {
        .sb-form-grid {
            grid-template-columns: 1fr;
        }

        .sb-footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }

        .sb-newsletter-input-group {
            flex-direction: column;
        }

        .sb-sticky-cta-inner {
            flex-direction: column;
            text-align: center;
            padding: 16px;
        }

        .sb-course-rec-card {
            flex-direction: column;
            text-align: center;
        }

        .sb-contact-section {
            padding: 24px 20px;
        }
    }

    @media (max-width: 480px) {
        .sb-footer-grid {
            grid-template-columns: 1fr;
        }

        h1.entry-title {
            font-size: 1.8rem;
        }
    }
    </style>
    <?php
}, 99);
