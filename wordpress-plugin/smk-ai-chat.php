<?php
/**
 * Plugin Name: SMK AI-chatt
 * Description: AI-driven produktradgivare med smart sok, produktjamforelse och offertforfragan.
 * Version: 2.0.0
 * Author: Searchboost
 *
 * Mu-plugin: wp-content/mu-plugins/smk-ai-chat.php
 */

if (!defined('ABSPATH')) exit;

// ---------------------------------------------------------------------------
// 1. ADMIN SETTINGS PAGE
// ---------------------------------------------------------------------------

add_action('admin_menu', function () {
    add_options_page(
        'SMK AI-chatt',
        'SMK AI-chatt',
        'manage_options',
        'smk-ai-chat',
        'smk_ai_chat_settings_page'
    );
});

add_action('admin_init', function () {
    register_setting('smk_ai_chat', 'smk_ai_chat_enabled', [
        'type' => 'boolean',
        'default' => false,
        'sanitize_callback' => function ($val) { return (bool) $val; },
    ]);
    register_setting('smk_ai_chat', 'smk_ai_chat_api_key', [
        'type' => 'string',
        'default' => '',
        'sanitize_callback' => 'sanitize_text_field',
    ]);
    register_setting('smk_ai_chat', 'smk_ai_chat_system_prompt', [
        'type' => 'string',
        'default' => '',
        'sanitize_callback' => 'wp_kses_post',
    ]);
    register_setting('smk_ai_chat', 'smk_ai_chat_welcome', [
        'type' => 'string',
        'default' => '',
        'sanitize_callback' => 'sanitize_text_field',
    ]);
    register_setting('smk_ai_chat', 'smk_ai_chat_usp_meta_key', [
        'type' => 'string',
        'default' => '_smk_product_usps',
        'sanitize_callback' => 'sanitize_text_field',
    ]);
    register_setting('smk_ai_chat', 'smk_ai_chat_quote_enabled', [
        'type' => 'boolean',
        'default' => true,
        'sanitize_callback' => function ($val) { return (bool) $val; },
    ]);
    register_setting('smk_ai_chat', 'smk_ai_chat_quote_email', [
        'type' => 'string',
        'default' => '',
        'sanitize_callback' => 'sanitize_email',
    ]);
});

function smk_ai_chat_default_system_prompt() {
    return 'Du ar en hjalpsam produktradgivare for Smalands Kontorsmobler. Vi saljer kontorsmobler som skrivbord, kontorsstolar, forvaring, soffor, belysning, konferensstolar och tillbehor.

Svara alltid pa svenska. Var kortfattad och hjalpsam. Om kunden fragar om specifika produkter, anvand produktinformationen nedan for att ge konkreta forslag med priser och lankar.

Om du inte vet svaret, saga att kunden kan ringa 070-305 23 56 eller maila info@smalandskontorsmobler.se.

Svara ALDRIG med emojis.';
}

function smk_ai_chat_default_welcome() {
    return 'Hej! Jag kan hjalpa dig hitta ratt kontorsmobler. Vad soker du?';
}

function smk_ai_chat_settings_page() {
    $enabled = get_option('smk_ai_chat_enabled', false);
    $api_key = get_option('smk_ai_chat_api_key', '');
    $system_prompt = get_option('smk_ai_chat_system_prompt', '');
    $welcome = get_option('smk_ai_chat_welcome', '');
    $usp_key = get_option('smk_ai_chat_usp_meta_key', '_smk_product_usps');
    $quote_enabled = get_option('smk_ai_chat_quote_enabled', true);
    $quote_email = get_option('smk_ai_chat_quote_email', get_option('admin_email'));

    if (empty($system_prompt)) $system_prompt = smk_ai_chat_default_system_prompt();
    if (empty($welcome)) $welcome = smk_ai_chat_default_welcome();
    ?>
    <div class="wrap">
        <h1>SMK AI-chatt</h1>
        <p>Installningar for den AI-drivna chatten. Kunden betalar sjalv for sin Anthropic-anvandning.</p>
        <form method="post" action="options.php">
            <?php settings_fields('smk_ai_chat'); ?>
            <table class="form-table">
                <tr>
                    <th scope="row">Aktiverad</th>
                    <td>
                        <label><input type="checkbox" name="smk_ai_chat_enabled" value="1" <?php checked($enabled); ?> /> Visa chatten pa sajten</label>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Anthropic API-nyckel</th>
                    <td>
                        <input type="password" name="smk_ai_chat_api_key" value="<?php echo esc_attr($api_key); ?>" class="regular-text" autocomplete="off" />
                        <p class="description">Hamtas fran <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a>. Borjar med <code>sk-ant-...</code></p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Systemprompt</th>
                    <td>
                        <textarea name="smk_ai_chat_system_prompt" rows="10" class="large-text code"><?php echo esc_textarea($system_prompt); ?></textarea>
                        <p class="description">Instruktioner till AI:n. Produktdata laggs till automatiskt.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Valkommen-meddelande</th>
                    <td>
                        <input type="text" name="smk_ai_chat_welcome" value="<?php echo esc_attr($welcome); ?>" class="large-text" />
                    </td>
                </tr>
                <tr>
                    <th scope="row">USP meta-nyckel</th>
                    <td>
                        <input type="text" name="smk_ai_chat_usp_meta_key" value="<?php echo esc_attr($usp_key); ?>" class="regular-text" />
                        <p class="description">Meta-nyckel for produkt-USP:ar. Standard: <code>_smk_product_usps</code></p>
                    </td>
                </tr>
                <tr><td colspan="2"><hr><h2>Offertforfragan</h2></td></tr>
                <tr>
                    <th scope="row">Offertfunktion</th>
                    <td>
                        <label><input type="checkbox" name="smk_ai_chat_quote_enabled" value="1" <?php checked($quote_enabled); ?> /> Aktivera offertforfragan i chatten</label>
                        <p class="description">Nar en besokare beskriver ett storre behov kan chatten bygga en produktlista och skicka en offertforfragan.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row">Offertmail till</th>
                    <td>
                        <input type="email" name="smk_ai_chat_quote_email" value="<?php echo esc_attr($quote_email); ?>" class="regular-text" />
                        <p class="description">E-postadress dit offertforfragningar skickas.</p>
                    </td>
                </tr>
            </table>
            <?php submit_button('Spara installningar'); ?>
        </form>
    </div>
    <?php
}

// ---------------------------------------------------------------------------
// 2. INTENT PARSER — Forsttar vad besokaren vill
// ---------------------------------------------------------------------------

function smk_parse_query_intent($query) {
    $q = mb_strtolower(trim($query));

    $result = [
        'keywords'       => $q,
        'category_slugs' => [],
        'min_price'      => null,
        'max_price'      => null,
        'color'          => null,
        'material'       => null,
        'intent'         => 'search',
    ];

    // Kategori-mapping: svenska ord -> WooCommerce-slugs
    $cat_map = [
        'skrivbord'       => 'skrivbord-for-kontoret',
        'bord'            => 'skrivbord-for-kontoret',
        'hoj-sankbar'     => 'skrivbord-for-kontoret',
        'hoj och sankbar' => 'skrivbord-for-kontoret',
        'stol'            => 'sittmobler',
        'kontorsstol'     => 'sittmobler',
        'sittmobel'       => 'sittmobler',
        'konferensstol'   => 'sittmobler',
        'forvaring'       => 'forvaring',
        'hurts'           => 'forvaring',
        'hylla'           => 'forvaring',
        'skap'            => 'forvaring',
        'bokhylla'        => 'forvaring',
        'belysning'       => 'belysning',
        'lampa'           => 'belysning',
        'skrivbordslampa' => 'belysning',
        'ljudabsorbent'   => 'ljudabsorbenter',
        'akustik'         => 'ljudabsorbenter',
        'reception'       => 'receptionsdiskar',
        'receptionsdisk'  => 'receptionsdiskar',
        'utomhus'         => 'utomhus-mobler',
        'utemobel'        => 'utomhus-mobler',
        'tillbehor'       => 'tillbehor',
        'monitorarm'      => 'tillbehor',
        'skarmfaste'      => 'tillbehor',
        'kabelhantering'  => 'tillbehor',
    ];

    foreach ($cat_map as $term => $slug) {
        if (mb_strpos($q, $term) !== false) {
            $result['category_slugs'][] = $slug;
        }
    }
    $result['category_slugs'] = array_unique($result['category_slugs']);

    // Prisextraktion
    if (preg_match('/under\s+(\d[\d\s]*)\s*kr/u', $q, $m)) {
        $result['max_price'] = (float) str_replace(' ', '', $m[1]);
    } elseif (preg_match('/max\s+(\d[\d\s]*)\s*kr/u', $q, $m)) {
        $result['max_price'] = (float) str_replace(' ', '', $m[1]);
    } elseif (preg_match('/mellan\s+(\d[\d\s]*)\s*(?:och|till|-)\s*(\d[\d\s]*)\s*kr/u', $q, $m)) {
        $result['min_price'] = (float) str_replace(' ', '', $m[1]);
        $result['max_price'] = (float) str_replace(' ', '', $m[2]);
    }

    // Farg
    $colors = ['svart', 'vit', 'gra', 'bla', 'rod', 'beige', 'brun', 'gron', 'valnot', 'ek', 'bjork'];
    foreach ($colors as $c) {
        if (mb_strpos($q, $c) !== false) {
            $result['color'] = $c;
            break;
        }
    }

    // Material
    $materials = ['tra', 'stal', 'mesh', 'tyg', 'lader', 'plast', 'metall', 'aluminium', 'glas'];
    foreach ($materials as $mat) {
        if (mb_strpos($q, $mat) !== false) {
            $result['material'] = $mat;
            break;
        }
    }

    // Intent: jamforelse
    $compare_triggers = ['skillnad mellan', 'jamfor', ' vs ', 'vilken ar battre', 'vilken ar bast', 'eller'];
    foreach ($compare_triggers as $t) {
        if (mb_strpos($q, $t) !== false) {
            $result['intent'] = 'compare';
            break;
        }
    }

    // Intent: offert
    if ($result['intent'] !== 'compare') {
        $quote_triggers = ['arbetsplats', 'inreda', 'projekt', 'stycken', ' st ', 'stor bestallning', 'kontor med', 'behover alla', 'behover manga'];
        foreach ($quote_triggers as $t) {
            if (mb_strpos($q, $t) !== false) {
                $result['intent'] = 'quote';
                break;
            }
        }
    }

    return $result;
}

// ---------------------------------------------------------------------------
// 3. SMART PRODUCT SEARCH
// ---------------------------------------------------------------------------

function smk_ai_chat_search_products($query) {
    if (!class_exists('WooCommerce')) return '';
    $clean = trim($query);
    if (mb_strlen($clean) < 3) return '';

    $parsed = smk_parse_query_intent($clean);

    // Comparison mode: find specific products by name
    if ($parsed['intent'] === 'compare') {
        return smk_search_comparison($clean);
    }

    $found_ids = [];

    // Strategy 1: Category + price filter
    if (!empty($parsed['category_slugs'])) {
        $args = [
            'post_type'      => 'product',
            'post_status'    => 'publish',
            'posts_per_page' => 10,
            'fields'         => 'ids',
            'tax_query'      => [[
                'taxonomy' => 'product_cat',
                'field'    => 'slug',
                'terms'    => $parsed['category_slugs'],
            ]],
            'meta_query' => [['key' => '_stock_status', 'value' => 'instock']],
        ];
        if ($parsed['max_price']) {
            $args['meta_query'][] = ['key' => '_price', 'value' => $parsed['max_price'], 'compare' => '<=', 'type' => 'NUMERIC'];
        }
        if ($parsed['min_price']) {
            $args['meta_query'][] = ['key' => '_price', 'value' => $parsed['min_price'], 'compare' => '>=', 'type' => 'NUMERIC'];
        }
        $args['meta_query']['relation'] = 'AND';

        // Sort by price if price filter active
        if ($parsed['max_price'] || $parsed['min_price']) {
            $args['orderby'] = 'meta_value_num';
            $args['meta_key'] = '_price';
            $args['order'] = 'ASC';
        }

        $q = new WP_Query($args);
        $found_ids = array_merge($found_ids, $q->posts);
    }

    // Strategy 2: Keyword search (standard WP search)
    if (count($found_ids) < 8) {
        $args2 = [
            'post_type'      => 'product',
            'post_status'    => 'publish',
            'posts_per_page' => 10,
            'fields'         => 'ids',
            's'              => $clean,
            'meta_query'     => [['key' => '_stock_status', 'value' => 'instock']],
        ];
        $q2 = new WP_Query($args2);
        $found_ids = array_merge($found_ids, $q2->posts);
    }

    // Strategy 3: Fallback with longest word
    if (count($found_ids) < 3) {
        $words = preg_split('/\s+/', $clean);
        $longest = '';
        foreach ($words as $w) {
            if (mb_strlen($w) > mb_strlen($longest)) $longest = $w;
        }
        if (mb_strlen($longest) >= 3 && $longest !== $clean) {
            $args3 = [
                'post_type'      => 'product',
                'post_status'    => 'publish',
                'posts_per_page' => 8,
                'fields'         => 'ids',
                's'              => $longest,
            ];
            $q3 = new WP_Query($args3);
            $found_ids = array_merge($found_ids, $q3->posts);
        }
    }

    // Deduplicate and limit
    $found_ids = array_unique($found_ids);
    $found_ids = array_slice($found_ids, 0, 8);

    if (empty($found_ids)) return '';

    return smk_build_product_context($found_ids, $parsed);
}

// ---------------------------------------------------------------------------
// 4. RICH PRODUCT CONTEXT BUILDER
// ---------------------------------------------------------------------------

function smk_build_product_context($product_ids, $parsed = []) {
    $usp_key = get_option('smk_ai_chat_usp_meta_key', '_smk_product_usps');
    $lines = [];

    foreach ($product_ids as $pid) {
        $product = wc_get_product($pid);
        if (!$product) continue;

        $name = $product->get_name();

        // Price
        if ($product->is_type('variable')) {
            $min_p = $product->get_variation_price('min');
            $max_p = $product->get_variation_price('max');
            $price_str = $min_p == $max_p ? $min_p . ' kr' : $min_p . ' - ' . $max_p . ' kr';
        } elseif ($product->is_on_sale()) {
            $price_str = $product->get_sale_price() . ' kr (ord. ' . $product->get_regular_price() . ' kr)';
        } else {
            $price_str = $product->get_price() ? $product->get_price() . ' kr' : 'Pris saknas';
        }

        $url = get_permalink($pid);

        // Category
        $cats = wp_get_post_terms($pid, 'product_cat', ['fields' => 'names']);
        $cat_str = !empty($cats) ? implode(', ', array_slice($cats, 0, 2)) : '';

        // Stock
        $stock = $product->is_in_stock() ? 'I lager' : 'Ej i lager';

        // Short description
        $desc = wp_strip_all_tags($product->get_short_description());
        if (mb_strlen($desc) > 200) $desc = mb_substr($desc, 0, 200) . '...';

        // USPs
        $usps = '';
        $usp_data = get_post_meta($pid, $usp_key, true);
        if (!$usp_data) $usp_data = get_post_meta($pid, 'smk_usps', true);
        if (is_array($usp_data)) {
            $usps = implode(', ', array_filter(array_slice($usp_data, 0, 4)));
        } elseif (is_string($usp_data) && !empty($usp_data)) {
            $usps = mb_substr($usp_data, 0, 200);
        }

        // Attributes
        $attrs = [];
        $product_attrs = $product->get_attributes();
        foreach ($product_attrs as $attr) {
            if (is_object($attr) && method_exists($attr, 'get_name')) {
                $attr_name = wc_attribute_label($attr->get_name());
                if ($attr->is_taxonomy()) {
                    $terms = wp_get_post_terms($pid, $attr->get_name(), ['fields' => 'names']);
                    if (!empty($terms)) $attrs[] = $attr_name . ': ' . implode(', ', $terms);
                } else {
                    $vals = $attr->get_options();
                    if (!empty($vals)) $attrs[] = $attr_name . ': ' . implode(', ', $vals);
                }
            }
        }

        // Variations summary (for variable products)
        $var_info = '';
        if ($product->is_type('variable')) {
            $var_attrs = $product->get_variation_attributes();
            $parts = [];
            foreach ($var_attrs as $attr_name => $options) {
                $label = wc_attribute_label($attr_name);
                $parts[] = $label . ': ' . implode(', ', array_slice($options, 0, 6));
            }
            if (!empty($parts)) $var_info = implode(' | ', $parts);
        }

        // Build context line
        $line = "Produkt: {$name}\n";
        $line .= "  Pris: {$price_str}\n";
        $line .= "  URL: {$url}\n";
        if ($cat_str) $line .= "  Kategori: {$cat_str}\n";
        $line .= "  Lager: {$stock}\n";
        if ($desc) $line .= "  Beskrivning: {$desc}\n";
        if ($usps) $line .= "  Fordelar: {$usps}\n";
        if (!empty($attrs)) $line .= "  Attribut: " . implode(', ', array_slice($attrs, 0, 5)) . "\n";
        if ($var_info) $line .= "  Varianter: {$var_info}\n";
        $line .= "  SKU: " . $product->get_sku();

        $lines[] = $line;
    }

    return implode("\n\n", $lines);
}

// ---------------------------------------------------------------------------
// 5. PRODUCT COMPARISON
// ---------------------------------------------------------------------------

function smk_search_comparison($query) {
    $q = mb_strtolower($query);

    // Extract product names: "skillnad mellan X och Y", "jamfor X och Y", "X vs Y"
    $names = [];
    if (preg_match('/(?:skillnad\s+mellan|jamfor)\s+(.+?)\s+och\s+(.+?)(?:\?|$)/u', $q, $m)) {
        $names = [trim($m[1]), trim($m[2])];
    } elseif (preg_match('/(.+?)\s+vs\s+(.+?)(?:\?|$)/u', $q, $m)) {
        $names = [trim($m[1]), trim($m[2])];
    } elseif (preg_match('/(.+?)\s+eller\s+(.+?)(?:\?|$)/u', $q, $m)) {
        $names = [trim($m[1]), trim($m[2])];
    }

    if (count($names) < 2) {
        // Fallback to regular search
        return '';
    }

    $product_ids = [];
    foreach ($names as $name) {
        $args = [
            'post_type'      => 'product',
            'post_status'    => 'publish',
            'posts_per_page' => 1,
            'fields'         => 'ids',
            's'              => $name,
        ];
        $result = new WP_Query($args);
        if (!empty($result->posts)) {
            $product_ids[] = $result->posts[0];
        }
    }

    if (count($product_ids) < 2) return '';

    // Build comparison context
    $context = "--- PRODUKTJAMFORELSE ---\n\n";
    $products_data = [];

    foreach ($product_ids as $i => $pid) {
        $product = wc_get_product($pid);
        if (!$product) continue;

        $label = chr(65 + $i); // A, B
        $data = [
            'label' => $label,
            'name'  => $product->get_name(),
            'price' => $product->get_price() ? $product->get_price() . ' kr' : 'Pris saknas',
            'url'   => get_permalink($pid),
        ];

        $context .= "Produkt {$label}: {$data['name']}\n";
        $context .= smk_build_product_context([$pid]);
        $context .= "\n\n";

        $products_data[] = $data;
    }

    // Price difference
    if (count($products_data) >= 2) {
        $p_a = (float) wc_get_product($product_ids[0])->get_price();
        $p_b = (float) wc_get_product($product_ids[1])->get_price();
        if ($p_a > 0 && $p_b > 0) {
            $diff = abs($p_a - $p_b);
            $cheaper = $p_a < $p_b ? $products_data[0]['name'] : $products_data[1]['name'];
            $context .= "PRISSKILLNAD: {$cheaper} ar " . number_format($diff, 0, ',', ' ') . " kr billigare.\n";
        }
    }

    return $context;
}

// ---------------------------------------------------------------------------
// 6. AJAX HANDLER — CHAT
// ---------------------------------------------------------------------------

add_action('wp_ajax_smk_ai_chat', 'smk_ai_chat_ajax_handler');
add_action('wp_ajax_nopriv_smk_ai_chat', 'smk_ai_chat_ajax_handler');

function smk_ai_chat_ajax_handler() {
    if (!check_ajax_referer('smk_ai_chat_nonce', 'nonce', false)) {
        wp_send_json_error(['message' => 'Ogiltig forfragan.'], 403);
        return;
    }

    if (!get_option('smk_ai_chat_enabled', false)) {
        wp_send_json_error(['message' => 'Chatten ar inte aktiverad.'], 403);
        return;
    }

    $api_key = get_option('smk_ai_chat_api_key', '');
    if (empty($api_key)) {
        wp_send_json_error(['message' => 'AI-chatten ar inte konfigurerad. Kontakta butiksagaren.'], 500);
        return;
    }

    // Rate limiting
    $ip_hash = md5($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $rate_key = 'smk_chat_rate_' . $ip_hash;
    $count = (int) get_transient($rate_key);
    if ($count >= 20) {
        wp_send_json_error(['message' => 'Du har natt maxgransan for meddelanden. Forsok igen senare eller ring oss pa 070-305 23 56.'], 429);
        return;
    }
    set_transient($rate_key, $count + 1, HOUR_IN_SECONDS);

    $user_message = isset($_POST['message']) ? sanitize_textarea_field(wp_unslash($_POST['message'])) : '';
    if (empty($user_message) || mb_strlen($user_message) > 1000) {
        wp_send_json_error(['message' => 'Ogiltigt meddelande.'], 400);
        return;
    }

    // Parse intent
    $parsed = smk_parse_query_intent($user_message);

    // Build system prompt
    $system_prompt = get_option('smk_ai_chat_system_prompt', smk_ai_chat_default_system_prompt());

    // Add product context
    $product_context = smk_ai_chat_search_products($user_message);
    if (!empty($product_context)) {
        $system_prompt .= "\n\n--- PRODUKTINFORMATION ---\n" . $product_context;
    }

    // Add comparison instruction
    if ($parsed['intent'] === 'compare') {
        $system_prompt .= "\n\nKunden vill jamfora produkter. Anvand produktinformationen ovan for att ge en tydlig, objektiv jamforelse. Lyft fram de viktigaste skillnaderna och ge en rekommendation baserad pa kundens behov.";
    }

    // Add quote instruction
    if ($parsed['intent'] === 'quote' && get_option('smk_ai_chat_quote_enabled', true)) {
        $system_prompt .= "\n\n--- OFFERTLAGE ---\nKunden verkar intresserad av en storre bestallning. Hjalp till att bygga en produktlista. For varje produkt, ange produktnamn (exakt som i produktlistan), antal, styckpris och URL. Nar produktlistan ar komplett, avsluta ditt svar med texten [OFFERT_KLAR] pa en egen rad sa att kunden kan skicka en offertforfragan.";
    }

    // Conversation history
    $history = [];
    if (!empty($_POST['history'])) {
        $raw_history = json_decode(wp_unslash($_POST['history']), true);
        if (is_array($raw_history)) {
            $raw_history = array_slice($raw_history, -10);
            foreach ($raw_history as $msg) {
                if (
                    isset($msg['role'], $msg['content']) &&
                    in_array($msg['role'], ['user', 'assistant'], true) &&
                    is_string($msg['content']) &&
                    mb_strlen($msg['content']) <= 2000
                ) {
                    $history[] = [
                        'role' => sanitize_text_field($msg['role']),
                        'content' => sanitize_textarea_field($msg['content']),
                    ];
                }
            }
        }
    }

    $messages = $history;
    $messages[] = ['role' => 'user', 'content' => $user_message];

    // Call Anthropic
    $response = wp_remote_post('https://api.anthropic.com/v1/messages', [
        'timeout' => 30,
        'headers' => [
            'x-api-key'         => $api_key,
            'anthropic-version'  => '2023-06-01',
            'content-type'       => 'application/json',
        ],
        'body' => wp_json_encode([
            'model'      => 'claude-3-5-haiku-20241022',
            'max_tokens' => 800,
            'system'     => $system_prompt,
            'messages'   => $messages,
        ]),
    ]);

    if (is_wp_error($response)) {
        wp_send_json_error(['message' => 'Kunde inte na AI-tjansten. Forsok igen.'], 502);
        return;
    }

    $code = wp_remote_retrieve_response_code($response);
    $body = json_decode(wp_remote_retrieve_body($response), true);

    if ($code === 401) {
        wp_send_json_error(['message' => 'AI-chatten ar felkonfigurerad. Kontakta butiksagaren.'], 500);
        return;
    }
    if ($code === 429) {
        wp_send_json_error(['message' => 'AI-tjansten ar overbelastad just nu. Forsok igen om en stund.'], 429);
        return;
    }
    if ($code < 200 || $code >= 300 || empty($body['content'][0]['text'])) {
        wp_send_json_error(['message' => 'Nagonting gick fel. Forsok igen eller ring oss pa 070-305 23 56.'], 500);
        return;
    }

    $reply = $body['content'][0]['text'];
    $has_quote = (strpos($reply, '[OFFERT_KLAR]') !== false);

    wp_send_json_success([
        'reply'     => $reply,
        'has_quote' => $has_quote,
        'intent'    => $parsed['intent'],
    ]);
}

// ---------------------------------------------------------------------------
// 7. AJAX HANDLER — QUOTE REQUEST
// ---------------------------------------------------------------------------

add_action('wp_ajax_smk_ai_quote', 'smk_ai_quote_handler');
add_action('wp_ajax_nopriv_smk_ai_quote', 'smk_ai_quote_handler');

function smk_ai_quote_handler() {
    if (!check_ajax_referer('smk_ai_chat_nonce', 'nonce', false)) {
        wp_send_json_error(['message' => 'Ogiltig forfragan.'], 403);
        return;
    }

    if (!get_option('smk_ai_chat_quote_enabled', true)) {
        wp_send_json_error(['message' => 'Offertfunktionen ar inte aktiverad.'], 403);
        return;
    }

    // Rate limit: max 3 quotes per IP per day
    $ip_hash = md5($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $quote_key = 'smk_quote_rate_' . $ip_hash;
    $qcount = (int) get_transient($quote_key);
    if ($qcount >= 3) {
        wp_send_json_error(['message' => 'Max antal offertforfragningar for idag. Ring oss pa 070-305 23 56.'], 429);
        return;
    }
    set_transient($quote_key, $qcount + 1, DAY_IN_SECONDS);

    // Collect form data
    $company = isset($_POST['company']) ? sanitize_text_field(wp_unslash($_POST['company'])) : '';
    $contact = isset($_POST['contact']) ? sanitize_text_field(wp_unslash($_POST['contact'])) : '';
    $email   = isset($_POST['email']) ? sanitize_email(wp_unslash($_POST['email'])) : '';
    $phone   = isset($_POST['phone']) ? sanitize_text_field(wp_unslash($_POST['phone'])) : '';
    $comment = isset($_POST['comment']) ? sanitize_textarea_field(wp_unslash($_POST['comment'])) : '';
    $transcript = isset($_POST['transcript']) ? sanitize_textarea_field(wp_unslash($_POST['transcript'])) : '';

    if (empty($company) || empty($contact) || empty($email)) {
        wp_send_json_error(['message' => 'Fyll i foretagsnamn, kontaktperson och e-post.'], 400);
        return;
    }

    // Build email
    $to = get_option('smk_ai_chat_quote_email', get_option('admin_email'));
    $subject = 'Offertforfragan - ' . $company . ' via AI-chatten';

    $body = "NY OFFERTFORFRAGAN\n";
    $body .= "==================\n\n";
    $body .= "Foretagsnamn: {$company}\n";
    $body .= "Kontaktperson: {$contact}\n";
    $body .= "E-post: {$email}\n";
    if ($phone) $body .= "Telefon: {$phone}\n";
    if ($comment) $body .= "Kommentar: {$comment}\n";
    $body .= "\n";

    if ($transcript) {
        $body .= "KONVERSATION FRAN CHATTEN\n";
        $body .= "==========================\n\n";
        $body .= $transcript;
        $body .= "\n\n";
    }

    $body .= "---\n";
    $body .= "Skickat fran AI-chatten pa " . home_url() . "\n";
    $body .= date('Y-m-d H:i');

    $headers = ['Reply-To: ' . $contact . ' <' . $email . '>'];

    $sent = wp_mail($to, $subject, $body, $headers);

    if ($sent) {
        wp_send_json_success(['message' => 'Din offertforfragan har skickats. Vi aterkommer inom 24 timmar.']);
    } else {
        wp_send_json_error(['message' => 'Kunde inte skicka mailet. Ring oss pa 070-305 23 56.'], 500);
    }
}

// ---------------------------------------------------------------------------
// 8. FRONTEND — CSS + JS + HTML
// ---------------------------------------------------------------------------

add_action('wp_footer', 'smk_ai_chat_render_frontend');

function smk_ai_chat_render_frontend() {
    if (is_admin()) return;
    if (!get_option('smk_ai_chat_enabled', false)) return;
    if (empty(get_option('smk_ai_chat_api_key', ''))) return;

    $welcome = get_option('smk_ai_chat_welcome', '');
    if (empty($welcome)) $welcome = smk_ai_chat_default_welcome();

    $nonce = wp_create_nonce('smk_ai_chat_nonce');
    $ajax_url = admin_url('admin-ajax.php');
    $quote_enabled = get_option('smk_ai_chat_quote_enabled', true);
    ?>

    <style id="smk-ai-chat-css">
        #smk-chat-bubble { position:fixed; bottom:24px; right:24px; width:56px; height:56px; border-radius:50%; background:#566754; border:none; cursor:pointer; box-shadow:0 4px 16px rgba(0,0,0,.2); display:flex; align-items:center; justify-content:center; z-index:999998; transition:transform .2s,box-shadow .2s; padding:0; }
        #smk-chat-bubble:hover { transform:scale(1.08); box-shadow:0 6px 24px rgba(0,0,0,.28); }
        #smk-chat-bubble svg { width:26px; height:26px; fill:#fff; }
        #smk-chat-panel { position:fixed; bottom:92px; right:24px; width:380px; height:520px; background:#fff; border-radius:16px; box-shadow:0 8px 40px rgba(0,0,0,.18); z-index:999999; display:none; flex-direction:column; overflow:hidden; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; font-size:14px; line-height:1.5; }
        #smk-chat-panel.smk-open { display:flex; }
        #smk-chat-header { background:#566754; color:#fff; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
        #smk-chat-header-title { font-weight:600; font-size:15px; }
        #smk-chat-close { background:none; border:none; color:#fff; font-size:22px; cursor:pointer; padding:0; line-height:1; opacity:.8; transition:opacity .15s; }
        #smk-chat-close:hover { opacity:1; }
        #smk-chat-messages { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:10px; }
        #smk-chat-messages::-webkit-scrollbar { width:5px; }
        #smk-chat-messages::-webkit-scrollbar-thumb { background:#ccc; border-radius:3px; }
        .smk-msg { max-width:82%; padding:10px 14px; border-radius:14px; word-wrap:break-word; white-space:pre-wrap; }
        .smk-msg-user { background:#566754; color:#fff; align-self:flex-end; border-bottom-right-radius:4px; }
        .smk-msg-ai { background:#f0f0f0; color:#1a1a1a; align-self:flex-start; border-bottom-left-radius:4px; }
        .smk-msg-ai a { color:#d5694e; text-decoration:underline; }
        .smk-typing { align-self:flex-start; padding:10px 14px; background:#f0f0f0; border-radius:14px; border-bottom-left-radius:4px; display:none; }
        .smk-typing-dots { display:flex; gap:4px; align-items:center; }
        .smk-typing-dots span { width:7px; height:7px; background:#999; border-radius:50%; animation:smk-bounce 1.2s infinite ease-in-out; }
        .smk-typing-dots span:nth-child(2) { animation-delay:.2s; }
        .smk-typing-dots span:nth-child(3) { animation-delay:.4s; }
        @keyframes smk-bounce { 0%,60%,100%{transform:translateY(0);opacity:.4} 30%{transform:translateY(-6px);opacity:1} }
        #smk-chat-input-area { display:flex; align-items:center; padding:12px 16px; border-top:1px solid #e8e8e8; gap:8px; flex-shrink:0; background:#fafafa; }
        #smk-chat-input { flex:1; border:1px solid #ddd; border-radius:20px; padding:9px 16px; font-size:14px; font-family:inherit; outline:none; resize:none; max-height:80px; line-height:1.4; transition:border-color .2s; }
        #smk-chat-input:focus { border-color:#566754; }
        #smk-chat-input::placeholder { color:#aaa; }
        #smk-chat-send { background:#566754; border:none; border-radius:50%; width:38px; height:38px; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:background .15s; }
        #smk-chat-send:hover { background:#4a5b48; }
        #smk-chat-send:disabled { opacity:.5; cursor:not-allowed; }
        #smk-chat-send svg { width:18px; height:18px; fill:#fff; }
        .smk-chat-notice { text-align:center; font-size:12px; color:#999; padding:4px 14px 0; }
        /* Quote button */
        .smk-quote-btn { display:inline-block; margin-top:8px; padding:8px 18px; background:#d5694e; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; transition:background .15s; }
        .smk-quote-btn:hover { background:#c05a42; }
        /* Quote form overlay */
        #smk-quote-form { display:none; padding:16px; background:#fafafa; border-top:1px solid #e8e8e8; flex-shrink:0; }
        #smk-quote-form.smk-show { display:block; }
        #smk-quote-form h3 { font-size:14px; font-weight:600; margin:0 0 10px; color:#333; }
        #smk-quote-form input, #smk-quote-form textarea { width:100%; padding:7px 12px; margin-bottom:6px; border:1px solid #ddd; border-radius:8px; font-size:13px; font-family:inherit; box-sizing:border-box; }
        #smk-quote-form textarea { height:50px; resize:none; }
        #smk-quote-form .smk-qf-row { display:flex; gap:6px; }
        #smk-quote-form .smk-qf-row input { flex:1; }
        .smk-qf-submit { width:100%; padding:9px; background:#566754; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; margin-top:4px; }
        .smk-qf-submit:hover { background:#4a5b48; }
        .smk-qf-cancel { width:100%; padding:6px; background:none; border:none; color:#999; cursor:pointer; font-size:12px; margin-top:2px; }
        @media (max-width:480px) {
            #smk-chat-panel { width:calc(100vw - 16px); height:calc(100vh - 120px); bottom:88px; right:8px; border-radius:12px; }
            #smk-chat-bubble { bottom:16px; right:16px; }
        }
    </style>

    <button id="smk-chat-bubble" aria-label="Chatta med oss">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/></svg>
    </button>

    <div id="smk-chat-panel">
        <div id="smk-chat-header">
            <span id="smk-chat-header-title">Chatta med oss</span>
            <button id="smk-chat-close" aria-label="Stang">&times;</button>
        </div>
        <div id="smk-chat-messages"></div>
        <div class="smk-chat-notice" id="smk-chat-notice" style="display:none;"></div>
        <div id="smk-quote-form">
            <h3>Skicka offertforfragan</h3>
            <input type="text" id="smk-qf-company" placeholder="Foretagsnamn *" required />
            <div class="smk-qf-row">
                <input type="text" id="smk-qf-contact" placeholder="Kontaktperson *" required />
                <input type="email" id="smk-qf-email" placeholder="E-post *" required />
            </div>
            <div class="smk-qf-row">
                <input type="tel" id="smk-qf-phone" placeholder="Telefon" />
            </div>
            <textarea id="smk-qf-comment" placeholder="Kommentar (valfritt)"></textarea>
            <button class="smk-qf-submit" id="smk-qf-send">Skicka offertforfragan</button>
            <button class="smk-qf-cancel" id="smk-qf-cancel">Avbryt</button>
        </div>
        <div id="smk-chat-input-area">
            <input type="text" id="smk-chat-input" placeholder="Skriv ett meddelande..." maxlength="1000" autocomplete="off" />
            <button id="smk-chat-send" aria-label="Skicka" disabled>
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
        </div>
    </div>

    <script id="smk-ai-chat-js">
    (function() {
        'use strict';

        var CFG = {
            ajaxUrl: <?php echo wp_json_encode($ajax_url); ?>,
            nonce: <?php echo wp_json_encode($nonce); ?>,
            welcome: <?php echo wp_json_encode($welcome); ?>,
            quoteEnabled: <?php echo $quote_enabled ? 'true' : 'false'; ?>,
            maxMessages: 20
        };

        var state = { open: false, sending: false, messageCount: 0, history: [], quoteFormOpen: false };

        var bubble = document.getElementById('smk-chat-bubble');
        var panel = document.getElementById('smk-chat-panel');
        var closeBtn = document.getElementById('smk-chat-close');
        var messagesEl = document.getElementById('smk-chat-messages');
        var inputEl = document.getElementById('smk-chat-input');
        var sendBtn = document.getElementById('smk-chat-send');
        var noticeEl = document.getElementById('smk-chat-notice');
        var quoteForm = document.getElementById('smk-quote-form');
        var qfSend = document.getElementById('smk-qf-send');
        var qfCancel = document.getElementById('smk-qf-cancel');

        var storedCount = sessionStorage.getItem('smk_chat_count');
        if (storedCount) state.messageCount = parseInt(storedCount, 10) || 0;

        var typingEl = document.createElement('div');
        typingEl.className = 'smk-typing';
        typingEl.innerHTML = '<div class="smk-typing-dots"><span></span><span></span><span></span></div>';
        messagesEl.appendChild(typingEl);

        addMessage('ai', CFG.welcome);

        bubble.addEventListener('click', togglePanel);
        closeBtn.addEventListener('click', togglePanel);
        inputEl.addEventListener('input', function() { sendBtn.disabled = !inputEl.value.trim() || state.sending; });
        inputEl.addEventListener('keydown', function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
        sendBtn.addEventListener('click', sendMessage);

        // Quote form events
        if (qfCancel) qfCancel.addEventListener('click', function() { quoteForm.classList.remove('smk-show'); state.quoteFormOpen = false; });
        if (qfSend) qfSend.addEventListener('click', submitQuote);

        function togglePanel() {
            state.open = !state.open;
            panel.classList.toggle('smk-open', state.open);
            if (state.open) { inputEl.focus(); scrollToBottom(); }
        }

        function addMessage(role, text, showQuoteBtn) {
            var div = document.createElement('div');
            div.className = 'smk-msg smk-msg-' + (role === 'user' ? 'user' : 'ai');

            if (role === 'ai') {
                // Strip quote marker
                var clean = text.replace(/\[OFFERT_KLAR\]/g, '').trim();
                var escaped = escapeHtml(clean);
                escaped = escaped.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
                div.innerHTML = escaped;

                if (showQuoteBtn && CFG.quoteEnabled) {
                    var btn = document.createElement('button');
                    btn.className = 'smk-quote-btn';
                    btn.textContent = 'Skicka offertforfragan';
                    btn.addEventListener('click', function() {
                        quoteForm.classList.add('smk-show');
                        state.quoteFormOpen = true;
                        scrollToBottom();
                    });
                    div.appendChild(btn);
                }
            } else {
                div.textContent = text;
            }

            messagesEl.insertBefore(div, typingEl);
            scrollToBottom();
        }

        function escapeHtml(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
        function showTyping() { typingEl.style.display = 'block'; scrollToBottom(); }
        function hideTyping() { typingEl.style.display = 'none'; }
        function scrollToBottom() { messagesEl.scrollTop = messagesEl.scrollHeight; }
        function showNotice(t) { noticeEl.textContent = t; noticeEl.style.display = 'block'; }

        function sendMessage() {
            var text = inputEl.value.trim();
            if (!text || state.sending) return;
            if (state.messageCount >= CFG.maxMessages) { showNotice('Du har natt maxgransan. Ladda om sidan eller ring 070-305 23 56.'); return; }

            state.sending = true;
            sendBtn.disabled = true;
            inputEl.value = '';
            addMessage('user', text);
            showTyping();

            state.messageCount++;
            sessionStorage.setItem('smk_chat_count', state.messageCount);

            var fd = new FormData();
            fd.append('action', 'smk_ai_chat');
            fd.append('nonce', CFG.nonce);
            fd.append('message', text);
            fd.append('history', JSON.stringify(state.history));

            fetch(CFG.ajaxUrl, { method: 'POST', body: fd, credentials: 'same-origin' })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                hideTyping();
                state.sending = false;

                if (data.success && data.data && data.data.reply) {
                    var reply = data.data.reply;
                    var hasQuote = data.data.has_quote || false;
                    addMessage('ai', reply, hasQuote);
                    state.history.push({ role: 'user', content: text });
                    state.history.push({ role: 'assistant', content: reply.replace(/\[OFFERT_KLAR\]/g, '') });
                    if (state.history.length > 10) state.history = state.history.slice(-10);
                } else {
                    var err = (data.data && data.data.message) ? data.data.message : 'Nagonting gick fel. Forsok igen.';
                    addMessage('ai', err);
                }

                sendBtn.disabled = !inputEl.value.trim();
                var rem = CFG.maxMessages - state.messageCount;
                if (rem <= 5 && rem > 0) showNotice(rem + ' meddelanden kvar.');
                else if (rem <= 0) { showNotice('Maxgrans natt. Ladda om sidan.'); inputEl.disabled = true; sendBtn.disabled = true; }
            })
            .catch(function() {
                hideTyping(); state.sending = false;
                addMessage('ai', 'Natverksfel. Kontrollera din internetanslutning.');
                sendBtn.disabled = !inputEl.value.trim();
            });
        }

        function submitQuote() {
            var company = document.getElementById('smk-qf-company').value.trim();
            var contact = document.getElementById('smk-qf-contact').value.trim();
            var email = document.getElementById('smk-qf-email').value.trim();
            var phone = document.getElementById('smk-qf-phone').value.trim();
            var comment = document.getElementById('smk-qf-comment').value.trim();

            if (!company || !contact || !email) { alert('Fyll i foretagsnamn, kontaktperson och e-post.'); return; }

            // Build transcript from history
            var transcript = '';
            for (var i = 0; i < state.history.length; i++) {
                var m = state.history[i];
                transcript += (m.role === 'user' ? 'Kund' : 'AI') + ': ' + m.content + '\n\n';
            }

            qfSend.disabled = true;
            qfSend.textContent = 'Skickar...';

            var fd = new FormData();
            fd.append('action', 'smk_ai_quote');
            fd.append('nonce', CFG.nonce);
            fd.append('company', company);
            fd.append('contact', contact);
            fd.append('email', email);
            fd.append('phone', phone);
            fd.append('comment', comment);
            fd.append('transcript', transcript);

            fetch(CFG.ajaxUrl, { method: 'POST', body: fd, credentials: 'same-origin' })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                quoteForm.classList.remove('smk-show');
                state.quoteFormOpen = false;
                qfSend.disabled = false;
                qfSend.textContent = 'Skicka offertforfragan';

                if (data.success) {
                    addMessage('ai', 'Din offertforfragan har skickats. Vi aterkommer inom 24 timmar.');
                } else {
                    addMessage('ai', (data.data && data.data.message) || 'Kunde inte skicka. Ring 070-305 23 56.');
                }
            })
            .catch(function() {
                qfSend.disabled = false;
                qfSend.textContent = 'Skicka offertforfragan';
                addMessage('ai', 'Natverksfel. Ring 070-305 23 56.');
                quoteForm.classList.remove('smk-show');
            });
        }
    })();
    </script>
    <?php
}
