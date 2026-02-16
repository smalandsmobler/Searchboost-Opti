<?php
/**
 * Plugin Name: SMK Product Schema
 * Description: Lägger till Product + BreadcrumbList + FAQ schema markup på WooCommerce-sidor
 * Version: 1.0
 * Author: Searchboost
 */

if (!defined('ABSPATH')) exit;

/**
 * Product schema på produktsidor
 */
add_action('wp_head', function() {
    if (!is_product()) return;

    global $product;
    if (!$product || !is_a($product, 'WC_Product')) {
        $product = wc_get_product(get_the_ID());
    }
    if (!$product) return;

    $image = wp_get_attachment_url($product->get_image_id());
    $price = $product->get_price();
    $regular_price = $product->get_regular_price();
    $sale_price = $product->get_sale_price();
    $sku = $product->get_sku();
    $stock = $product->is_in_stock() ? 'InStock' : 'OutOfStock';
    $desc = wp_strip_all_tags($product->get_short_description() ?: $product->get_description());
    $desc = mb_substr($desc, 0, 300);

    $categories = [];
    $terms = get_the_terms($product->get_id(), 'product_cat');
    if ($terms && !is_wp_error($terms)) {
        foreach ($terms as $term) {
            $categories[] = $term->name;
        }
    }

    $schema = [
        '@context' => 'https://schema.org',
        '@type' => 'Product',
        'name' => $product->get_name(),
        'url' => get_permalink($product->get_id()),
        'description' => $desc,
        'brand' => [
            '@type' => 'Brand',
            'name' => 'Smålands Kontorsmöbler'
        ],
        'offers' => [
            '@type' => 'Offer',
            'url' => get_permalink($product->get_id()),
            'priceCurrency' => 'SEK',
            'price' => $price ?: '0',
            'availability' => 'https://schema.org/' . $stock,
            'seller' => [
                '@type' => 'Organization',
                'name' => 'Smålands Kontorsmöbler'
            ]
        ]
    ];

    if ($image) {
        $schema['image'] = $image;
    }
    if ($sku) {
        $schema['sku'] = $sku;
    }
    if (!empty($categories)) {
        $schema['category'] = implode(' > ', $categories);
    }

    echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . '</script>' . "\n";
}, 5);

/**
 * BreadcrumbList schema på alla sidor
 */
add_action('wp_head', function() {
    $items = [];
    $position = 1;

    $items[] = [
        '@type' => 'ListItem',
        'position' => $position++,
        'name' => 'Hem',
        'item' => home_url('/')
    ];

    if (is_product_category()) {
        $term = get_queried_object();
        if ($term) {
            // Föräldrakategori
            if ($term->parent) {
                $parent = get_term($term->parent, 'product_cat');
                if ($parent && !is_wp_error($parent)) {
                    $items[] = [
                        '@type' => 'ListItem',
                        'position' => $position++,
                        'name' => $parent->name,
                        'item' => get_term_link($parent)
                    ];
                }
            }
            $items[] = [
                '@type' => 'ListItem',
                'position' => $position++,
                'name' => $term->name
            ];
        }
    } elseif (is_product()) {
        global $product;
        if (!$product) $product = wc_get_product(get_the_ID());

        $terms = get_the_terms(get_the_ID(), 'product_cat');
        if ($terms && !is_wp_error($terms)) {
            $term = $terms[0];
            if ($term->parent) {
                $parent = get_term($term->parent, 'product_cat');
                if ($parent && !is_wp_error($parent)) {
                    $items[] = [
                        '@type' => 'ListItem',
                        'position' => $position++,
                        'name' => $parent->name,
                        'item' => get_term_link($parent)
                    ];
                }
            }
            $items[] = [
                '@type' => 'ListItem',
                'position' => $position++,
                'name' => $term->name,
                'item' => get_term_link($term)
            ];
        }
        $items[] = [
            '@type' => 'ListItem',
            'position' => $position++,
            'name' => get_the_title()
        ];
    } elseif (is_page()) {
        $items[] = [
            '@type' => 'ListItem',
            'position' => $position++,
            'name' => get_the_title()
        ];
    }

    if (count($items) < 2) return;

    $schema = [
        '@context' => 'https://schema.org',
        '@type' => 'BreadcrumbList',
        'itemListElement' => $items
    ];

    echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . '</script>' . "\n";
}, 5);

/**
 * CollectionPage schema på kategorisidor
 */
add_action('wp_head', function() {
    if (!is_product_category()) return;

    $term = get_queried_object();
    if (!$term) return;

    $desc = wp_strip_all_tags(term_description($term->term_id, 'product_cat'));
    $desc = mb_substr($desc, 0, 300);

    $schema = [
        '@context' => 'https://schema.org',
        '@type' => 'CollectionPage',
        'name' => $term->name,
        'url' => get_term_link($term),
        'description' => $desc ?: $term->name . ' - Kontorsmöbler från Smålands Kontorsmöbler',
        'numberOfItems' => $term->count,
        'provider' => [
            '@type' => 'Organization',
            'name' => 'Smålands Kontorsmöbler'
        ]
    ];

    echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . '</script>' . "\n";
}, 5);
