<?php
/**
 * Searchboost Chat Widget — lägg in i functions.php eller som snippet
 * Laddas på alla sidor UTOM wp-admin
 * För att begränsa till enbart startsida + gratis-seo-analys, se versionen under
 */

// ── Alternativ 1: Alla sidor (rekommenderas) ──
add_action('wp_footer', function() {
    echo '<script src="https://opti.searchboost.se/searchboost-chat.js" defer></script>';
});


// ── Alternativ 2: Bara startsida + gratis-seo-analys ──
// add_action('wp_footer', function() {
//     if (is_front_page() || is_page('gratis-seo-analys')) {
//         echo '<script src="https://opti.searchboost.se/searchboost-chat.js" defer></script>';
//     }
// });
