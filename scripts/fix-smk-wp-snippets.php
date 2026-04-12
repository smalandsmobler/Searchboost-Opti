<?php
/**
 * SMK Emergency Fix — Inaktivera alla Code Snippets
 *
 * Ladda upp till SMK:s WordPress-rot via Loopia filhanterare.
 * Kör sedan: https://smalandskontorsmobler.se/fix-smk-wp-snippets.php
 * RADERA FILEN EFTER ANVÄNDNING!
 */

// Ladda WordPress
define('SHORTINIT', false);
require_once(__DIR__ . '/wp-load.php');

global $wpdb;

echo "<h1>SMK Code Snippets Fix</h1>\n";

// 1. Lista alla aktiva snippets
$table = $wpdb->prefix . 'snippets';
$table_exists = $wpdb->get_var("SHOW TABLES LIKE '$table'");

if (!$table_exists) {
    echo "<p>Code Snippets-tabellen finns inte. Problemet är inte snippets.</p>";
    exit;
}

$snippets = $wpdb->get_results("SELECT id, name, scope, active FROM $table ORDER BY id");

echo "<h2>Alla snippets:</h2>\n<table border='1' cellpadding='5'>\n";
echo "<tr><th>ID</th><th>Namn</th><th>Scope</th><th>Aktiv</th></tr>\n";
foreach ($snippets as $s) {
    $color = $s->active ? 'red' : 'green';
    echo "<tr style='background:$color;color:white'>";
    echo "<td>{$s->id}</td><td>{$s->name}</td><td>{$s->scope}</td><td>{$s->active}</td>";
    echo "</tr>\n";
}
echo "</table>\n";

// 2. Inaktivera alla aktiva snippets
if (isset($_GET['fix']) && $_GET['fix'] === 'yes') {
    $count = $wpdb->query("UPDATE $table SET active = 0 WHERE active = 1");
    echo "<h2 style='color:green'>$count snippets inaktiverade!</h2>";
    echo "<p>Ladda om <a href='https://smalandskontorsmobler.se'>startsidan</a> och kolla om det funkar.</p>";
    echo "<p><strong>RADERA DENNA FIL FRÅN SERVERN NÄR DU ÄR KLAR!</strong></p>";
} else {
    echo "<h2>Vill du inaktivera alla?</h2>";
    echo "<p><a href='?fix=yes' style='font-size:20px;color:red;font-weight:bold'>JA — Inaktivera alla snippets</a></p>";
    echo "<p>Detta ändrar bara databasen. Du kan aktivera dem igen i WP-admin efteråt.</p>";
}

// 3. Visa senaste PHP-fel
echo "<h2>Senaste error_log:</h2><pre>";
$log = __DIR__ . '/wp-content/debug.log';
if (file_exists($log)) {
    $lines = file($log);
    $last = array_slice($lines, -30);
    echo htmlspecialchars(implode('', $last));
} else {
    echo "(Ingen debug.log hittad — aktivera WP_DEBUG i wp-config.php)";
}
echo "</pre>\n";

echo "<p style='color:red;font-weight:bold'>⚠️ RADERA DENNA FIL EFTER ANVÄNDNING — den ger full access!</p>";
