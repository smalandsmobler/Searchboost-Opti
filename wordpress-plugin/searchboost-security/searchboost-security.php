<?php
/**
 * Plugin Name: Searchboost Security
 * Plugin URI:  https://searchboost.se
 * Description: Realtidsövervakning av säkerhetshändelser. Rapporterar till Searchboost Opti.
 * Version:     1.0.0
 * Author:      Searchboost
 * License:     Private
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'SB_SECURITY_VERSION', '1.0.0' );
define( 'SB_SECURITY_OPTION_PREFIX', 'searchboost_security_' );

// ─── Inställningsformulär (Admin > Inställningar > Searchboost Security) ───

add_action( 'admin_menu', function () {
    add_options_page(
        'Searchboost Security',
        'Searchboost Security',
        'manage_options',
        'searchboost-security',
        'sb_security_settings_page'
    );
} );

add_action( 'admin_init', function () {
    register_setting( 'sb_security_group', 'searchboost_security_api_url' );
    register_setting( 'sb_security_group', 'searchboost_security_api_key' );
    register_setting( 'sb_security_group', 'searchboost_security_customer_id' );
    register_setting( 'sb_security_group', 'searchboost_security_enabled' );
} );

function sb_security_settings_page() {
    ?>
    <div class="wrap">
        <h1>Searchboost Security</h1>
        <p>Säkerhetsövervakning kopplad till Searchboost Opti-dashboarden.</p>
        <form method="post" action="options.php">
            <?php settings_fields( 'sb_security_group' ); ?>
            <table class="form-table">
                <tr>
                    <th><label for="sb_api_url">API URL</label></th>
                    <td>
                        <input type="url" id="sb_api_url" name="searchboost_security_api_url"
                               value="<?php echo esc_attr( get_option( 'searchboost_security_api_url', 'https://opti.searchboost.se' ) ); ?>"
                               class="regular-text" />
                        <p class="description">Standard: https://opti.searchboost.se</p>
                    </td>
                </tr>
                <tr>
                    <th><label for="sb_api_key">API-nyckel</label></th>
                    <td>
                        <input type="text" id="sb_api_key" name="searchboost_security_api_key"
                               value="<?php echo esc_attr( get_option( 'searchboost_security_api_key', '' ) ); ?>"
                               class="regular-text" autocomplete="off" />
                    </td>
                </tr>
                <tr>
                    <th><label for="sb_customer_id">Kund-ID</label></th>
                    <td>
                        <input type="text" id="sb_customer_id" name="searchboost_security_customer_id"
                               value="<?php echo esc_attr( get_option( 'searchboost_security_customer_id', '' ) ); ?>"
                               class="regular-text" />
                        <p class="description">T.ex. "mobelrondellen" eller "kompetensutveckla"</p>
                    </td>
                </tr>
                <tr>
                    <th><label for="sb_enabled">Aktiverad</label></th>
                    <td>
                        <input type="checkbox" id="sb_enabled" name="searchboost_security_enabled" value="1"
                               <?php checked( 1, get_option( 'searchboost_security_enabled', 1 ) ); ?> />
                        <label for="sb_enabled">Skicka säkerhetshändelser till Searchboost</label>
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
        <hr>
        <h2>Status</h2>
        <p><strong>Plugin-version:</strong> <?php echo SB_SECURITY_VERSION; ?></p>
        <p><strong>API URL:</strong> <?php echo esc_html( get_option( 'searchboost_security_api_url', 'ej konfigurerad' ) ); ?></p>
        <p><strong>Kund-ID:</strong> <?php echo esc_html( get_option( 'searchboost_security_customer_id', 'ej konfigurerat' ) ); ?></p>
        <p><strong>Övervakning:</strong> <?php echo get_option( 'searchboost_security_enabled', 1 ) ? '<span style="color:green">Aktiv</span>' : '<span style="color:red">Inaktiv</span>'; ?></p>
    </div>
    <?php
}

// ─── Hjälpfunktion — skicka event (fire-and-forget) ───

function sb_report_event( $event_type, $severity, $details ) {
    if ( ! get_option( 'searchboost_security_enabled', 1 ) ) {
        return;
    }

    $api_url     = rtrim( get_option( 'searchboost_security_api_url', 'https://opti.searchboost.se' ), '/' );
    $api_key     = get_option( 'searchboost_security_api_key', '' );
    $customer_id = get_option( 'searchboost_security_customer_id', '' );

    if ( empty( $api_key ) || empty( $customer_id ) ) {
        return; // Inte konfigurerat
    }

    $payload = wp_json_encode( [
        'customer_id' => $customer_id,
        'site_url'    => get_site_url(),
        'event_type'  => $event_type,
        'severity'    => $severity,
        'details'     => $details,
        'detected_at' => current_time( 'c' ),
    ] );

    wp_remote_post( $api_url . '/api/security/event', [
        'blocking'  => false,   // Fire-and-forget — blockerar aldrig sidinladdning
        'timeout'   => 1,
        'headers'   => [
            'Content-Type' => 'application/json',
            'X-Api-Key'    => $api_key,
        ],
        'body'      => $payload,
        'sslverify' => false,
    ] );
}

// ─── Hooks ───

// Misslyckat inloggningsförsök
add_action( 'wp_login_failed', function ( $username ) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'okänd';
    sb_report_event(
        'failed_login',
        'warning',
        sprintf( 'Misslyckat inloggningsförsök för "%s" från IP %s', sanitize_text_field( $username ), $ip )
    );
} );

// Ny användare skapad
add_action( 'user_register', function ( $user_id ) {
    $user = get_userdata( $user_id );
    if ( ! $user ) return;
    $is_admin = in_array( 'administrator', (array) $user->roles, true );
    $severity = $is_admin ? 'critical' : 'info';
    sb_report_event(
        'user_register',
        $severity,
        sprintf( 'Ny användare skapad: "%s" (%s) — Roller: %s', $user->display_name, $user->user_email, implode( ', ', $user->roles ) )
    );
} );

// Roll ändrad till administrator
add_action( 'set_user_role', function ( $user_id, $role, $old_roles ) {
    if ( $role === 'administrator' ) {
        $user = get_userdata( $user_id );
        if ( ! $user ) return;
        sb_report_event(
            'role_changed_to_admin',
            'critical',
            sprintf( 'Användare "%s" (%s) fick admin-roll (var: %s)', $user->display_name, $user->user_email, implode( ', ', $old_roles ) )
        );
    }
}, 10, 3 );

// Plugin aktiverat
add_action( 'activated_plugin', function ( $plugin ) {
    sb_report_event(
        'plugin_activated',
        'info',
        sprintf( 'Plugin aktiverat: %s', $plugin )
    );
} );

// Sajt-URL ändrad (potentiellt intrång)
add_action( 'update_option_siteurl', function ( $old_value, $new_value ) {
    if ( $old_value !== $new_value ) {
        sb_report_event(
            'siteurl_changed',
            'critical',
            sprintf( 'Sajt-URL ändrad från "%s" till "%s"', $old_value, $new_value )
        );
    }
}, 10, 2 );

// Lyckad inloggning (bara logga, ingen Slack-notis — hanteras av severity=info)
add_action( 'wp_login', function ( $user_login, $user ) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'okänd';
    sb_report_event(
        'successful_login',
        'info',
        sprintf( 'Lyckad inloggning: "%s" från IP %s', $user_login, $ip )
    );
}, 10, 2 );
