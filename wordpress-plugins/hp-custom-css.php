<?php
/**
 * Plugin Name: Human Power Custom CSS
 * Description: Laddar Humanpower-designens CSS och Google Fonts.
 * Version: 1.0
 * Author: Searchboost
 */
if (!defined('ABSPATH')) exit;

add_action('wp_enqueue_scripts', 'hp_enqueue_custom_assets', 99);

function hp_enqueue_custom_assets() {
    wp_enqueue_style('hp-google-fonts', 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap', array(), null);
    wp_enqueue_style('hp-custom', content_url('/uploads/2026/04/humanpower-style.txt'), array('hp-google-fonts'), '1.0');
}

add_action('wp_head', 'hp_allow_unfiltered_content', 1);

function hp_allow_unfiltered_content() {
    // Tillat link och script i page content
    add_filter('wp_kses_allowed_html', 'hp_allow_tags', 10, 2);
}

function hp_allow_tags($allowed, $context) {
    if ($context === 'post') {
        $allowed['link'] = array('rel' => true, 'href' => true, 'type' => true, 'media' => true);
        $allowed['script'] = array('src' => true, 'type' => true);
        $allowed['style'] = array('type' => true);
        $allowed['video'] = array('autoplay' => true, 'muted' => true, 'loop' => true, 'playsinline' => true, 'class' => true, 'poster' => true);
        $allowed['source'] = array('src' => true, 'type' => true);
    }
    return $allowed;
}
