<?php
/**
 * Plugin Name: SB Wedo Signs — Offertknapp
 * Description: Flytande "Begär offert"-knapp på alla sidor (utom offertsidan och tack-sidan)
 * Version: 1.2
 * Author: Searchboost
 */

add_action('wp_footer', 'sb_wedo_quote_button');
function sb_wedo_quote_button() {
    // Göm i Divi Visual Builder
    if (isset($_GET['et_fb']) || isset($_GET['PageSpeed'])) return;

    // Sidor där knappen inte ska visas
    $hidden_slugs = array('offerter-wedosigns', 'tack-for-din-forfragan');

    if (is_singular('page')) {
        $slug = get_post_field('post_name', get_the_ID());
        if (in_array($slug, $hidden_slugs, true)) return;
    }

    // Fallback: kolla URL-path direkt (hanterar trailing slash)
    $path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
    if (in_array($path, $hidden_slugs, true)) return;
    ?>
    <a href="<?php echo esc_url(home_url('/offerter-wedosigns/')); ?>" id="sb-quote-btn" aria-label="Begär offert">
        <svg class="sb-quote-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        <span class="sb-quote-text">Begär offert</span>
    </a>
    <style>
        #sb-quote-btn {
            position: fixed !important;
            bottom: 24px;
            right: 24px;
            z-index: 999999;
            display: flex !important;
            align-items: center;
            gap: 8px;
            background: #e91e8c !important;
            color: #fff !important;
            padding: 14px 24px;
            border-radius: 50px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 15px;
            font-weight: 600;
            text-decoration: none !important;
            box-shadow: 0 4px 16px rgba(233, 30, 140, 0.4);
            transition: all 0.3s ease;
            cursor: pointer;
            line-height: 1;
            border: none !important;
            letter-spacing: 0;
        }
        #sb-quote-btn:hover,
        #sb-quote-btn:focus {
            background: #d1177d !important;
            transform: translateY(-2px);
            box-shadow: 0 6px 24px rgba(233, 30, 140, 0.5);
            color: #fff !important;
            text-decoration: none !important;
        }
        #sb-quote-btn:visited {
            color: #fff !important;
        }
        #sb-quote-btn .sb-quote-icon {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
        }
        /* Mobil: kompaktare knapp, högre upp för att undvika cookie-banner */
        @media (max-width: 768px) {
            #sb-quote-btn {
                bottom: 80px;
                right: 16px;
                padding: 12px 18px;
                font-size: 14px;
            }
        }
        /* Liten mobil: bara ikon */
        @media (max-width: 480px) {
            #sb-quote-btn .sb-quote-text {
                display: none;
            }
            #sb-quote-btn {
                padding: 14px;
                border-radius: 50%;
                width: 52px;
                height: 52px;
                justify-content: center;
            }
            #sb-quote-btn .sb-quote-icon {
                width: 22px;
                height: 22px;
            }
        }
    </style>
    <?php
}
