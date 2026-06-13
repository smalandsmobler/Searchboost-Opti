<?php
/**
 * Plugin Name: Human Power Custom CSS
 * Description: Laddar Humanpower CSS + stylar Kadence header transparent.
 * Version: 2.3
 * Author: Searchboost
 */
if (!defined('ABSPATH')) exit;

add_action('wp_enqueue_scripts', 'hp_enqueue_fonts', 5);
add_action('wp_head', 'hp_inject_css', 99);
add_action('wp_head', 'hp_kadence_overrides', 100);
add_action('wp_footer', 'hp_scroll_js', 99);

function hp_enqueue_fonts() {
    wp_enqueue_style('hp-fonts', 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap', array(), null);
}

function hp_inject_css() {
    $files = array(
        WP_CONTENT_DIR . '/uploads/2026/04/humanpower-style-1-1.txt',
        WP_CONTENT_DIR . '/uploads/2026/04/humanpower-style-1.txt',
        WP_CONTENT_DIR . '/uploads/2026/04/humanpower-style.txt',
    );
    foreach ($files as $f) {
        if (file_exists($f)) {
            echo '<style id="hp-custom-css">' . "\n";
            readfile($f);
            echo "\n</style>\n";
            return;
        }
    }
}

function hp_kadence_overrides() {
    echo '<style id="hp-kadence">
/* === KADENCE HEADER — transparent, kompakt, snygg === */
.site-header-wrap,
#masthead,
.site-header{
  background:transparent!important;
  position:fixed!important;
  top:0;left:0;right:0;
  z-index:999!important;
  border:none!important;
  box-shadow:none!important;
  transition:background 0.3s,padding 0.3s;
}
.site-header.scrolled,
.site-header-wrap.scrolled{
  background:rgba(31,26,23,0.93)!important;
  backdrop-filter:blur(12px)!important;
  box-shadow:0 2px 24px rgba(0,0,0,0.3)!important;
}
/* Header inner — tight */
.site-header-inner-wrap,
.site-header .site-header-row,
.site-header-row-container-inner{
  padding-top:8px!important;
  padding-bottom:8px!important;
}
/* Logga — full färg, vit skugga */
.site-header .custom-logo,
.site-header .site-branding img{
  max-height:44px!important;
  width:auto!important;
  filter:drop-shadow(0 2px 10px rgba(255,255,255,0.35))!important;
}
/* Dölj site title text */
.site-header .site-title,
.site-header .site-description{display:none!important}
/* Menylänkar — vita, Inter, skugga */
.site-header .header-menu-container a,
.site-header .menu-item>a,
.site-header nav a{
  color:rgba(255,255,255,0.95)!important;
  text-shadow:0 1px 8px rgba(0,0,0,0.5)!important;
  font-family:Inter,sans-serif!important;
  font-size:0.9rem!important;
  font-weight:500!important;
  letter-spacing:0.03em!important;
}
.site-header nav a:hover,
.site-header .menu-item>a:hover{
  color:#D4B48C!important;
}
/* Dropdown — DOLD tills hover */
.site-header .sub-menu{
  display:none!important;
  position:absolute!important;
  background:rgba(31,26,23,0.95)!important;
  border:1px solid rgba(255,255,255,0.08)!important;
  border-radius:8px!important;
  box-shadow:0 12px 40px rgba(0,0,0,0.35)!important;
  min-width:220px!important;
  padding:8px 0!important;
  z-index:1000!important;
}
.site-header .menu-item:hover>.sub-menu,
.site-header .menu-item.toggled-on>.sub-menu{
  display:block!important;
}
.site-header .sub-menu a{
  color:rgba(255,255,255,0.8)!important;
  text-shadow:none!important;
  padding:10px 20px!important;
  display:block!important;
  font-size:0.85rem!important;
}
.site-header .sub-menu a:hover{
  color:#D4B48C!important;
  background:rgba(255,255,255,0.06)!important;
}
/* Boka tid-knapp */
.site-header .button,
.site-header .menu-item.highlight-menu-item>a,
.site-header .wp-block-button a{
  background:#D4B48C!important;
  color:#1F1A17!important;
  border-radius:50px!important;
  padding:10px 24px!important;
  text-shadow:none!important;
  font-weight:600!important;
  border:none!important;
}
/* Hamburger */
.site-header .menu-toggle-icon,
.site-header .menu-toggle-icon span{
  background:white!important;
}
/* Body padding — kompensera fixed header */
body{padding-top:70px!important}
/* Sidtitel dölj */
.entry-hero-container-inner,
.page-header,
.entry-header{display:none!important}
/* Content — ren */
.site-main{padding:0!important;margin:0!important}
.site-content{padding:0!important}
.entry-content{margin:0!important;padding:0!important}
/* Footer (vår i content) */
.site-footer{background:#1b4332!important;color:rgba(255,255,255,0.7);padding:32px 0 0}
.site-footer .footer-inner{display:flex;gap:48px;padding:0 24px 20px;max-width:1160px;margin:0 auto}
.site-footer .footer-brand{font-family:Playfair Display,serif;font-size:1.1rem;color:white;margin-bottom:8px}
.site-footer .footer-desc{font-size:0.82rem;line-height:1.6}
.site-footer .footer-heading{font-weight:600;font-size:0.85rem;color:white;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.08em}
.site-footer .footer-bottom{border-top:1px solid rgba(255,255,255,0.1);padding:12px 24px;font-size:0.78rem;max-width:1160px;margin:0 auto}
/* Kadences footer — dölj om den finns */
.site-footer-wrap:not(.entry-content .site-footer){display:none!important}
footer.colophon,#colophon,.site-below-footer-wrap{display:none!important}
</style>';
}

function hp_scroll_js() {
    echo '<script>document.addEventListener("DOMContentLoaded",function(){var h=document.querySelector(".site-header-wrap")||document.querySelector(".site-header")||document.getElementById("masthead");if(h){window.addEventListener("scroll",function(){if(window.scrollY>50){h.classList.add("scrolled")}else{h.classList.remove("scrolled")}})}});</script>';
}

add_filter('wp_kses_allowed_html', function($allowed, $context) {
    if ($context === 'post') {
        $allowed['video'] = array('autoplay'=>true,'muted'=>true,'loop'=>true,'playsinline'=>true,'class'=>true,'poster'=>true);
        $allowed['source'] = array('src'=>true,'type'=>true);
        $allowed['svg'] = array('width'=>true,'height'=>true,'viewBox'=>true,'fill'=>true,'class'=>true);
        $allowed['circle'] = array('cx'=>true,'cy'=>true,'r'=>true,'stroke'=>true,'stroke-width'=>true);
        $allowed['path'] = array('d'=>true,'stroke'=>true,'stroke-width'=>true,'stroke-linecap'=>true,'fill'=>true);
        $allowed['rect'] = array('x'=>true,'y'=>true,'width'=>true,'height'=>true,'rx'=>true,'stroke'=>true,'stroke-width'=>true);
        $allowed['section'] = array('class'=>true,'id'=>true,'style'=>true);
        $allowed['blockquote'] = array('class'=>true);
    }
    return $allowed;
}, 10, 2);
