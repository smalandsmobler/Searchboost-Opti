<?php
/**
 * Plugin Name: SB Wedo Signs — Offertknapp
 * Description: Flytande "Begär offert"-knapp på alla sidor (utom offertsidan)
 * Version: 1.0
 * Author: Searchboost
 */

// Lägg till knappen i footer
add_action('wp_footer', 'sb_wedo_quote_button');
function sb_wedo_quote_button() {
    // Visa inte på offertsidan
    if (is_singular('page')) {
        $slug = get_post_field('post_name', get_the_ID());
        if ($slug === 'offerter-wedosigns') return;
    }
    ?>
    <a href="/offerter-wedosigns/" id="sb-quote-btn" aria-label="Begär offert">
        <span class="sb-quote-icon">&#9993;</span>
        <span class="sb-quote-text">Begär offert</span>
    </a>
    <style>
        #sb-quote-btn {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 99999;
            display: flex;
            align-items: center;
            gap: 8px;
            background: #e91e8c;
            color: #fff;
            padding: 14px 24px;
            border-radius: 50px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 15px;
            font-weight: 600;
            text-decoration: none;
            box-shadow: 0 4px 16px rgba(233, 30, 140, 0.4);
            transition: all 0.3s ease;
            cursor: pointer;
        }
        #sb-quote-btn:hover {
            background: #d1177d;
            transform: translateY(-2px);
            box-shadow: 0 6px 24px rgba(233, 30, 140, 0.5);
            color: #fff;
            text-decoration: none;
        }
        #sb-quote-btn .sb-quote-icon {
            font-size: 18px;
            line-height: 1;
        }
        /* Mobil: kompaktare knapp */
        @media (max-width: 768px) {
            #sb-quote-btn {
                bottom: 16px;
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
                font-size: 22px;
            }
        }
    </style>
    <?php
}
