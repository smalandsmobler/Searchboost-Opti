<?php
/**
 * Plugin Name: SB Wedo Signs — Offertknapp
 * Description: Flytande "Begär offert"-knapp på alla sidor (utom offertsidan och tack-sidan)
 * Version: 1.3
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
        @keyframes sb-pulse {
            0% { box-shadow: 0 4px 16px rgba(26, 115, 232, 0.4); }
            50% { box-shadow: 0 4px 24px rgba(26, 115, 232, 0.6); }
            100% { box-shadow: 0 4px 16px rgba(26, 115, 232, 0.4); }
        }
        #sb-quote-btn {
            position: fixed !important;
            bottom: 24px;
            right: 24px;
            z-index: 999999;
            display: flex !important;
            align-items: center;
            gap: 10px;
            background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%) !important;
            color: #fff !important;
            padding: 16px 28px;
            border-radius: 50px;
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 16px;
            font-weight: 600;
            text-decoration: none !important;
            box-shadow: 0 4px 16px rgba(26, 115, 232, 0.4);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            line-height: 1;
            border: none !important;
            letter-spacing: 0.3px;
            animation: sb-pulse 3s ease-in-out infinite;
        }
        #sb-quote-btn:hover,
        #sb-quote-btn:focus {
            background: linear-gradient(135deg, #1565c0 0%, #0a3d91 100%) !important;
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 8px 28px rgba(26, 115, 232, 0.5);
            color: #fff !important;
            text-decoration: none !important;
            animation: none;
        }
        #sb-quote-btn:active {
            transform: translateY(-1px) scale(0.98);
        }
        #sb-quote-btn:visited {
            color: #fff !important;
        }
        #sb-quote-btn .sb-quote-icon {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
        }
        /* Mobil: kompaktare knapp, hogre upp for att undvika cookie-banner */
        @media (max-width: 768px) {
            #sb-quote-btn {
                bottom: 80px;
                right: 16px;
                padding: 14px 22px;
                font-size: 15px;
            }
        }
        /* Liten mobil: bara ikon */
        @media (max-width: 480px) {
            #sb-quote-btn .sb-quote-text {
                display: none;
            }
            #sb-quote-btn {
                padding: 16px;
                border-radius: 50%;
                width: 56px;
                height: 56px;
                justify-content: center;
            }
            #sb-quote-btn .sb-quote-icon {
                width: 24px;
                height: 24px;
            }
        }
    </style>
    <?php
}
