<?php
/**
 * Searchboost Plausible-tracker.
 * Auto-injecteras i <head> pa alla publika sidor pa kundsajter dar denna plugin ar aktiv.
 *
 * Datakalla: var self-hosted Plausible pa https://analytics.searchboost.se
 * Tracker-script: @plausible-analytics/tracker, men vi anvander den hostade /js/script.<features>.js
 * direkt fran var instans (samma JS som npm-paketet bundlar).
 *
 * Features inkluderade i denna build:
 *   - outbound-links (sparar klick pa externa lankar)
 *   - tagged-events (sparar custom events via window.plausible(...))
 *   - file-downloads (sparar nedladdningar av pdf, mp3, etc.)
 *
 * Settings (registreras i huvudfilen):
 *   sb_plausible_enabled (default "1") — toggle for hela injectionen
 *   sb_plausible_domain  (default parse_url(home_url())) — site_id som syns i Plausible UI
 *
 * For att stanga av pa en specifik sajt: Settings > SB Onboarding > avbocka Plausible.
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('admin_init', function () {
    register_setting('sb_onboarding', 'sb_plausible_domain');
    register_setting('sb_onboarding', 'sb_plausible_enabled', ['default' => '1']);
});

add_action('wp_head', function () {
    if (is_admin()) {
        return;
    }
    if (get_option('sb_plausible_enabled', '1') !== '1') {
        return;
    }
    $domain = (string) get_option('sb_plausible_domain', '');
    if ($domain === '') {
        $parsed = parse_url(home_url(), PHP_URL_HOST);
        $domain = is_string($parsed) ? $parsed : '';
    }
    if ($domain === '') {
        return;
    }
    $esc_domain = esc_attr($domain);
    echo "\n<!-- Searchboost Plausible tracker -->\n";
    echo '<script defer data-domain="' . $esc_domain . '" src="https://analytics.searchboost.se/js/script.outbound-links.tagged-events.file-downloads.js"></script>' . "\n";
    echo '<script>window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}</script>' . "\n";
}, 1);
