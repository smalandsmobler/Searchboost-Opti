<?php
/**
 * Plugin Name: SMK Checkout Customizations
 * Description: Komplett B2B/B2C-kassa — kundtypsväljare, org.nr/personnr, fraktlogik, fakturaregler.
 * Version: 2.0
 * Author: Searchboost
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Text Domain: smk-checkout
 */

if (!defined('ABSPATH')) exit;

define('SMK_CHECKOUT_VERSION', '2.0');
define('SMK_CHECKOUT_PATH', plugin_dir_path(__FILE__));
define('SMK_CHECKOUT_URL', plugin_dir_url(__FILE__));
define('SMK_AVISERING_FEE', 490);
define('SMK_AVISERING_TAXABLE', true);

/* ─── Tvinga klassisk checkout ─── */
add_filter('woocommerce_checkout_block_is_active', '__return_false');
add_filter('wc_blocks_is_checkout_block_default', '__return_false');

/* ─── Ladda assets ─── */
add_action('wp_enqueue_scripts', 'smk_enqueue_assets');

/* ─── Checkout-fält ─── */
add_filter('woocommerce_billing_fields', 'smk_billing_fields');

/* ─── Kundtypsväljare (HTML) ─── */
add_action('woocommerce_before_checkout_billing_form', 'smk_customer_type_selector', 5);

/* ─── Frakt-info i ordersummering ─── */
add_action('woocommerce_review_order_before_shipping', 'smk_shipping_info');

/* ─── Aviseringsavgift ─── */
add_action('woocommerce_cart_calculate_fees', 'smk_avisering_fee');

/* ─── AJAX: Spara kundtyp i session ─── */
add_action('wp_ajax_smk_set_customer_type', 'smk_ajax_set_type');
add_action('wp_ajax_nopriv_smk_set_customer_type', 'smk_ajax_set_type');

/* ─── Faktura bara för företag ─── */
add_filter('woocommerce_available_payment_gateways', 'smk_restrict_invoice');

/* ─── Validering ─── */
add_action('woocommerce_checkout_process', 'smk_validate_checkout');

/* ─── Spara metadata ─── */
add_action('woocommerce_checkout_update_order_meta', 'smk_save_order_meta');

/* ─── Admin: visa metadata ─── */
add_action('woocommerce_admin_order_data_after_billing_address', 'smk_admin_order_fields');

/* ─── E-post: visa kundtyp ─── */
add_action('woocommerce_email_after_order_table', 'smk_email_order_meta', 10, 4);


/**
 * =============================================================
 *  IMPLEMENTATIONER
 * =============================================================
 */

/** Ladda CSS + JS på checkout-sidan */
function smk_enqueue_assets() {
    if (!is_checkout()) return;
    wp_enqueue_style('smk-checkout', SMK_CHECKOUT_URL . 'css/smk-checkout.css', array(), SMK_CHECKOUT_VERSION);
    wp_enqueue_script('smk-checkout', SMK_CHECKOUT_URL . 'js/smk-checkout.js', array('jquery'), SMK_CHECKOUT_VERSION, true);
    wp_localize_script('smk-checkout', 'smkCheckout', array(
        'ajaxUrl' => admin_url('admin-ajax.php'),
    ));
}

/** Lägg till/ändra checkout-fält */
function smk_billing_fields($fields) {
    if (isset($fields['billing_phone'])) {
        $fields['billing_phone']['required'] = true;
        $fields['billing_phone']['label'] = 'Telefon/Mobilnummer';
        $fields['billing_phone']['placeholder'] = '07X-XXX XX XX';
    }
    $fields['billing_personal_id'] = array(
        'label'       => 'Personnummer',
        'placeholder' => 'ÅÅÅÅMMDD-XXXX',
        'required'    => false,
        'class'       => array('form-row-wide', 'smk-field-private'),
        'priority'    => 25,
    );
    $fields['billing_org_number'] = array(
        'label'       => 'Organisationsnummer',
        'placeholder' => 'XXXXXX-XXXX',
        'required'    => false,
        'class'       => array('form-row-wide', 'smk-field-company'),
        'priority'    => 26,
    );
    $fields['billing_reference'] = array(
        'label'       => 'Er referens / Beställare',
        'placeholder' => 'Namn på beställare eller referensnummer',
        'required'    => false,
        'class'       => array('form-row-wide', 'smk-field-company'),
        'priority'    => 27,
    );
    return $fields;
}

/** Kundtypsväljare — radio-knappar överst i kassan */
function smk_customer_type_selector() {
    echo '<div id="smk-customer-type-wrap">';
    echo '<p class="smk-customer-type-label">Jag handlar som:</p>';
    echo '<div class="smk-toggle-buttons">';

    echo '<label class="smk-toggle-btn smk-active" data-type="company">';
    echo '<input type="radio" name="smk_customer_type" value="company" checked>';
    echo '<span class="smk-toggle-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4"/></svg></span>';
    echo '<span class="smk-toggle-text">Företag</span>';
    echo '</label>';

    echo '<label class="smk-toggle-btn" data-type="private">';
    echo '<input type="radio" name="smk_customer_type" value="private">';
    echo '<span class="smk-toggle-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/></svg></span>';
    echo '<span class="smk-toggle-text">Privatperson</span>';
    echo '</label>';

    echo '</div>';
    echo '<p class="smk-customer-type-hint smk-hint-company">Ange företagsnamn och organisationsnummer. Faktura (30 dagar) tillgänglig.</p>';
    echo '<p class="smk-customer-type-hint smk-hint-private" style="display:none;">Hemleverans med obligatorisk avisering. Betala med kort eller Swish.</p>';
    echo '</div>';
}

/** Frakt-information i ordersummeringen */
function smk_shipping_info() {
    $fee = SMK_AVISERING_FEE;
    echo '<tr class="smk-shipping-info smk-show-private" style="display:none;"><td colspan="2">';
    echo '<div class="smk-info-box smk-info-notice"><strong>Hemleverans med avisering</strong><br>';
    echo 'Transportören kontaktar dig innan leverans för att boka tid. ';
    echo 'Aviseringsavgift ' . $fee . ' kr tillkommer.</div>';
    echo '</td></tr>';

    echo '<tr class="smk-shipping-info smk-show-company"><td colspan="2">';
    echo '<div class="smk-info-box smk-info-neutral"><strong>Företagsleverans</strong><br>';
    echo 'Leverans till företagsadress. Avisering valfritt (+' . $fee . ' kr).</div>';
    echo '</td></tr>';
}

/** Aviseringsavgift — automatisk för privatpersoner */
function smk_avisering_fee() {
    if (is_admin() && !defined('DOING_AJAX')) return;
    $type = WC()->session ? WC()->session->get('smk_customer_type', 'company') : 'company';
    if ($type === 'private') {
        WC()->cart->add_fee('Avisering (hemleverans)', SMK_AVISERING_FEE, SMK_AVISERING_TAXABLE, 'standard');
    }
}

/** AJAX-handler för att spara kundtyp i WC-session */
function smk_ajax_set_type() {
    if (!isset($_POST['type'])) wp_die();
    $type = sanitize_text_field($_POST['type']);
    if (in_array($type, array('company', 'private'))) {
        WC()->session->set('smk_customer_type', $type);
    }
    wp_die();
}

/** Dölj faktura-betalning för privatpersoner */
function smk_restrict_invoice($gateways) {
    if (is_admin()) return $gateways;
    $type = WC()->session ? WC()->session->get('smk_customer_type', 'company') : 'company';
    if ($type === 'private') {
        $ids = array('bacs', 'swedbankpay_invoice', 'swedbank_pay_invoice', 'payex_invoice');
        foreach ($ids as $id) {
            unset($gateways[$id]);
        }
    }
    return $gateways;
}

/** Validera checkout baserat på kundtyp */
function smk_validate_checkout() {
    $type = isset($_POST['smk_customer_type']) ? sanitize_text_field($_POST['smk_customer_type']) : 'company';
    if ($type === 'company') {
        if (empty($_POST['billing_company'])) {
            wc_add_notice('Ange företagsnamn.', 'error');
        }
        if (empty($_POST['billing_org_number'])) {
            wc_add_notice('Ange organisationsnummer.', 'error');
        }
    }
    if ($type === 'private') {
        if (empty($_POST['billing_personal_id'])) {
            wc_add_notice('Ange personnummer.', 'error');
        }
    }
}

/** Spara extra fält till order-metadata */
function smk_save_order_meta($order_id) {
    $keys = array('smk_customer_type', 'billing_personal_id', 'billing_org_number', 'billing_reference');
    foreach ($keys as $key) {
        if (!empty($_POST[$key])) {
            update_post_meta($order_id, '_' . $key, sanitize_text_field($_POST[$key]));
        }
    }
}

/** Visa kundtyp + extra fält i admin-ordervy */
function smk_admin_order_fields($order) {
    $id   = $order->get_id();
    $type = get_post_meta($id, '_smk_customer_type', true);
    $pnr  = get_post_meta($id, '_billing_personal_id', true);
    $org  = get_post_meta($id, '_billing_org_number', true);
    $ref  = get_post_meta($id, '_billing_reference', true);

    echo '<div style="margin-top:12px;padding:8px 12px;background:#f8f9fa;border-left:3px solid #2271b1;">';
    if ($type) echo '<p><strong>Kundtyp:</strong> ' . ($type === 'company' ? 'Företag' : 'Privatperson') . '</p>';
    if ($pnr) echo '<p><strong>Personnummer:</strong> ' . esc_html($pnr) . '</p>';
    if ($org) echo '<p><strong>Org.nr:</strong> ' . esc_html($org) . '</p>';
    if ($ref) echo '<p><strong>Referens:</strong> ' . esc_html($ref) . '</p>';
    echo '</div>';
}

/** Visa kundinfo i orderbekräftelse-mail */
function smk_email_order_meta($order, $sent_to_admin, $plain_text, $email) {
    $id   = $order->get_id();
    $type = get_post_meta($id, '_smk_customer_type', true);
    $org  = get_post_meta($id, '_billing_org_number', true);
    $ref  = get_post_meta($id, '_billing_reference', true);
    $pnr  = get_post_meta($id, '_billing_personal_id', true);

    if (!$type) return;

    if ($plain_text) {
        echo "\nKundtyp: " . ($type === 'company' ? 'Företag' : 'Privatperson') . "\n";
        if ($org) echo "Org.nr: $org\n";
        if ($ref) echo "Referens: $ref\n";
        if ($pnr) echo "Personnummer: $pnr\n";
        return;
    }

    echo '<div style="margin:16px 0;padding:12px;background:#f7f7f7;border-radius:4px;">';
    echo '<p style="margin:0 0 4px;"><strong>Kundtyp:</strong> ' . ($type === 'company' ? 'Företag' : 'Privatperson') . '</p>';
    if ($org) echo '<p style="margin:0 0 4px;"><strong>Org.nr:</strong> ' . esc_html($org) . '</p>';
    if ($ref) echo '<p style="margin:0;"><strong>Referens:</strong> ' . esc_html($ref) . '</p>';
    if ($pnr) echo '<p style="margin:0;"><strong>Personnummer:</strong> ' . esc_html($pnr) . '</p>';
    echo '</div>';
}
