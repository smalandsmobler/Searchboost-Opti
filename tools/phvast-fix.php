<?php
/**
 * Phvast.se — Tillfällig felsökningsfil
 * Ladda upp till: wp-content/plugins/phvast-fix.php
 * Kör via: https://phvast.se/wp-content/plugins/phvast-fix.php
 * TA BORT FILEN NÄR DU ÄR KLAR!
 */

// Ladda WordPress
require_once dirname(__DIR__, 2) . '/wp-load.php';

if (!current_user_can('manage_options')) {
    wp_die('Du måste vara inloggad som admin. Logga in på /wp-admin/ först och besök denna URL igen.');
}

$action = isset($_GET['action']) ? $_GET['action'] : 'list';

echo '<html><head><title>Phvast Fix</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:8px;text-align:left}
a{color:#0073aa}.active{color:green;font-weight:bold}.inactive{color:#999}
.btn{display:inline-block;padding:6px 14px;background:#0073aa;color:#fff;text-decoration:none;border-radius:3px;margin:2px}
.btn.danger{background:#dc3232}</style></head><body>';
echo '<h1>Phvast.se — Plugin-felsökning</h1>';

if ($action === 'deactivate' && isset($_GET['plugin'])) {
    $plugin = sanitize_text_field($_GET['plugin']);
    deactivate_plugins($plugin);
    echo '<p style="color:green;font-size:18px">&#10004; Avaktiverade: <strong>' . esc_html($plugin) . '</strong></p>';
    echo '<p><a href="?">Tillbaka till listan</a> | <a href="' . admin_url() . '">Gå till wp-admin</a> (kolla om menyn fungerar nu)</p>';
}

if ($action === 'activate' && isset($_GET['plugin'])) {
    $plugin = sanitize_text_field($_GET['plugin']);
    activate_plugin($plugin);
    echo '<p style="color:green;font-size:18px">&#10004; Aktiverade: <strong>' . esc_html($plugin) . '</strong></p>';
    echo '<p><a href="?">Tillbaka till listan</a></p>';
}

if ($action === 'deactivate_all') {
    $active = get_option('active_plugins', array());
    update_option('phvast_backup_plugins', $active); // spara backup
    deactivate_plugins($active);
    echo '<p style="color:green;font-size:18px">&#10004; Alla plugins avaktiverade! Backup sparad.</p>';
    echo '<p><a href="' . admin_url() . '">Gå till wp-admin</a> och kolla om menyn fungerar.</p>';
    echo '<p><a href="?action=restore">Återställ alla plugins</a></p>';
}

if ($action === 'restore') {
    $backup = get_option('phvast_backup_plugins', array());
    if (!empty($backup)) {
        update_option('active_plugins', $backup);
        echo '<p style="color:green;font-size:18px">&#10004; Alla plugins återställda från backup!</p>';
    } else {
        echo '<p style="color:red">Ingen backup hittades.</p>';
    }
    echo '<p><a href="?">Tillbaka till listan</a></p>';
}

if ($action === 'clear_rocket_cache') {
    if (function_exists('rocket_clean_domain')) {
        rocket_clean_domain();
        echo '<p style="color:green;font-size:18px">&#10004; WP Rocket cache rensad!</p>';
    } else {
        echo '<p style="color:red">WP Rocket verkar inte vara aktivt.</p>';
    }
    echo '<p><a href="?">Tillbaka</a></p>';
}

// Visa lista
if ($action === 'list' || $action === 'deactivate' || $action === 'activate') {
    $all_plugins = get_plugins();
    $active_plugins = get_option('active_plugins', array());

    echo '<p><strong>PHP-version:</strong> ' . phpversion() . '</p>';
    echo '<p><strong>WordPress-version:</strong> ' . get_bloginfo('version') . '</p>';
    echo '<hr>';

    echo '<p>';
    echo '<a class="btn danger" href="?action=deactivate_all" onclick="return confirm(\'Avaktivera ALLA plugins?\')">Avaktivera ALLA plugins</a> ';
    echo '<a class="btn" href="?action=restore">Återställ från backup</a> ';
    echo '<a class="btn" href="?action=clear_rocket_cache">Rensa WP Rocket cache</a>';
    echo '</p>';

    echo '<table><tr><th>Plugin</th><th>Version</th><th>Status</th><th>Åtgärd</th></tr>';

    foreach ($all_plugins as $file => $info) {
        $is_active = in_array($file, $active_plugins);
        $status = $is_active ? '<span class="active">Aktiv</span>' : '<span class="inactive">Inaktiv</span>';

        if ($is_active) {
            $btn = '<a class="btn danger" href="?action=deactivate&plugin=' . urlencode($file) . '">Avaktivera</a>';
        } else {
            $btn = '<a class="btn" href="?action=activate&plugin=' . urlencode($file) . '">Aktivera</a>';
        }

        echo '<tr><td>' . esc_html($info['Name']) . '</td><td>' . esc_html($info['Version']) . '</td><td>' . $status . '</td><td>' . $btn . '</td></tr>';
    }
    echo '</table>';

    echo '<hr><p style="color:red"><strong>OBS:</strong> Ta bort denna fil (phvast-fix.php) när felsökningen är klar!</p>';
}

echo '</body></html>';
