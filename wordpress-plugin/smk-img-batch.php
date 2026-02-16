<?php
/**
 * SMK Image Batch Downloader v2.0 (SHORTINIT)
 * Laddar ner externa produktbilder till wp-content/uploads/smk-imported/
 * Placeras i WordPress-roten.
 * Använder SHORTINIT + raw SQL + curl istället för full WP (WP 6.9.1 crash fix)
 *
 * ?action=status            Visa antal externa bilder
 * ?action=download&batch=10 Ladda ner nästa batch
 * ?action=reset             Börja om
 * ?key=smkimg2026           Auth-nyckel
 */

define('WP_USE_THEMES', false);
define('SHORTINIT', true);

$wp = __DIR__.'/wp-load.php';
if (!file_exists($wp)) die(json_encode(['error' => 'Placera i WP-roten.']));
require_once $wp;

// Auth — SHORTINIT har ingen current_user_can(), så bara key-check
if (($_GET['key'] ?? '') !== 'smkimg2026') {
    header('HTTP/1.1 403 Forbidden');
    die(json_encode(['error' => 'Ej behorig. Lagg till ?key=smkimg2026']));
}

header('Content-Type: application/json; charset=utf-8');

// Beräkna sökvägar manuellt (ingen wp_upload_dir i SHORTINIT)
$upload_base = ABSPATH . 'wp-content/uploads';

// get_option finns inte i SHORTINIT — hämta siteurl från DB
$site_row = $wpdb->get_row("SELECT option_value FROM {$wpdb->options} WHERE option_name='siteurl' LIMIT 1");
$siteurl = $site_row ? $site_row->option_value : '';
$upload_url = rtrim($siteurl, '/') . '/wp-content/uploads';

// Kolla om det finns custom upload-dir i wp_options
$upload_path_row = $wpdb->get_row("SELECT option_value FROM {$wpdb->options} WHERE option_name='upload_path' LIMIT 1");
if ($upload_path_row && !empty($upload_path_row->option_value)) {
    $upload_base = $upload_path_row->option_value;
}
$upload_url_row = $wpdb->get_row("SELECT option_value FROM {$wpdb->options} WHERE option_name='upload_url_path' LIMIT 1");
if ($upload_url_row && !empty($upload_url_row->option_value)) {
    $upload_url = $upload_url_row->option_value;
}

$tdir = $upload_base . '/smk-imported';
$turl = $upload_url . '/smk-imported';
$logf = $tdir . '/.progress.json';
$maxt = 25; // max sekunder per request
$t0   = time();

// Hämta home_url för att identifiera lokala bilder
$home_row = $wpdb->get_row("SELECT option_value FROM {$wpdb->options} WHERE option_name='home' LIMIT 1");
$lhost = $home_row ? parse_url($home_row->option_value, PHP_URL_HOST) : 'ny.smalandskontorsmobler.se';

if (!is_dir($tdir)) @mkdir($tdir, 0755, true);

$act = $_GET['action'] ?? 'status';
$bsz = min((int)($_GET['batch'] ?? 10), 50);

// == Helper functions ==

function prog_get($f) {
    if (file_exists($f)) {
        $d = json_decode(file_get_contents($f), true);
        if (is_array($d)) return $d;
    }
    return ['dl' => 0, 'fail' => 0, 'log' => []];
}

function prog_save($f, $p) {
    if (count($p['log']) > 200) $p['log'] = array_slice($p['log'], -200);
    file_put_contents($f, json_encode($p, JSON_UNESCAPED_SLASHES));
}

function find_ext() {
    global $wpdb, $lhost;
    $r = [];

    // Metod 1: _wp_attached_file med extern URL
    $rows = $wpdb->get_results("
        SELECT p.ID as aid, pm.meta_value as url, p.post_parent as pid
        FROM {$wpdb->posts} p
        JOIN {$wpdb->postmeta} pm ON p.ID=pm.post_id AND pm.meta_key='_wp_attached_file'
        WHERE p.post_type='attachment' AND p.post_mime_type LIKE 'image/%'
        AND (pm.meta_value LIKE 'http://%' OR pm.meta_value LIKE 'https://%')
        LIMIT 5000
    ");
    foreach ($rows as $row) {
        $h = parse_url($row->url, PHP_URL_HOST);
        if ($h && stripos($h, $lhost) === false) {
            $r[$row->aid] = [
                'pid' => (int)$row->pid,
                'aid' => (int)$row->aid,
                'url' => $row->url,
                'src' => 'meta'
            ];
        }
    }

    // Metod 2: guid med extern URL
    $rows2 = $wpdb->get_results("
        SELECT ID as aid, guid as url, post_parent as pid
        FROM {$wpdb->posts}
        WHERE post_type='attachment' AND post_mime_type LIKE 'image/%'
        AND guid NOT LIKE '%{$lhost}%'
        AND (guid LIKE 'http://%' OR guid LIKE 'https://%')
        LIMIT 5000
    ");
    foreach ($rows2 as $row) {
        if (!isset($r[$row->aid])) {
            $r[$row->aid] = [
                'pid' => (int)$row->pid,
                'aid' => (int)$row->aid,
                'url' => $row->url,
                'src' => 'guid'
            ];
        }
    }
    return array_values($r);
}

function dl_img($url, $dir) {
    // Ren PHP curl istället för wp_remote_get
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_USERAGENT => 'Mozilla/5.0 SMK-ImageBot/2.0',
        CURLOPT_HTTPHEADER => ['Accept: image/*,*/*'],
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($body === false) return ['ok' => false, 'err' => $err ?: 'curl failed'];
    if ($code !== 200) return ['ok' => false, 'err' => "HTTP $code"];
    if (strlen($body) < 100) return ['ok' => false, 'err' => 'For liten (<100b)'];

    $bn = basename(parse_url($url, PHP_URL_PATH) ?: 'image.jpg');
    $bn = preg_replace('/[^a-zA-Z0-9._-]/', '', $bn);
    if (!$bn || strpos($bn, '.') === false) $bn = 'img-' . md5($url) . '.jpg';
    $fp = $dir . '/' . $bn;
    if (file_exists($fp)) {
        $i = pathinfo($bn);
        $bn = $i['filename'] . '-' . substr(md5($url), 0, 6) . '.' . ($i['extension'] ?? 'jpg');
        $fp = $dir . '/' . $bn;
    }
    file_put_contents($fp, $body);
    $chk = @getimagesize($fp);
    if (!$chk) { @unlink($fp); return ['ok' => false, 'err' => 'Ej giltig bild']; }
    return [
        'ok' => true, 'path' => $fp, 'fn' => $bn, 'sz' => strlen($body),
        'mime' => $chk['mime'], 'w' => $chk[0], 'h' => $chk[1]
    ];
}

function upd_att($aid, $fp, $fn, $mime, $turl) {
    global $wpdb;

    // Uppdatera _wp_attached_file
    $exists = $wpdb->get_var($wpdb->prepare(
        "SELECT meta_id FROM {$wpdb->postmeta} WHERE post_id=%d AND meta_key='_wp_attached_file'", $aid
    ));
    if ($exists) {
        $wpdb->update($wpdb->postmeta,
            ['meta_value' => 'smk-imported/' . $fn],
            ['post_id' => $aid, 'meta_key' => '_wp_attached_file']
        );
    } else {
        $wpdb->insert($wpdb->postmeta, [
            'post_id' => $aid,
            'meta_key' => '_wp_attached_file',
            'meta_value' => 'smk-imported/' . $fn
        ]);
    }

    // Uppdatera guid och mime_type
    $wpdb->update($wpdb->posts,
        ['guid' => $turl . '/' . $fn, 'post_mime_type' => $mime],
        ['ID' => $aid]
    );

    // Uppdatera _wp_attachment_metadata med grundläggande info
    $meta = serialize([
        'width' => 0, 'height' => 0, 'file' => 'smk-imported/' . $fn,
        'sizes' => [], 'image_meta' => []
    ]);
    // Läs bilddimensioner om möjligt
    $sz = @getimagesize($fp);
    if ($sz) {
        $meta = serialize([
            'width' => $sz[0], 'height' => $sz[1], 'file' => 'smk-imported/' . $fn,
            'sizes' => [], 'image_meta' => []
        ]);
    }
    $meta_exists = $wpdb->get_var($wpdb->prepare(
        "SELECT meta_id FROM {$wpdb->postmeta} WHERE post_id=%d AND meta_key='_wp_attachment_metadata'", $aid
    ));
    if ($meta_exists) {
        $wpdb->update($wpdb->postmeta,
            ['meta_value' => $meta],
            ['post_id' => $aid, 'meta_key' => '_wp_attachment_metadata']
        );
    } else {
        $wpdb->insert($wpdb->postmeta, [
            'post_id' => $aid,
            'meta_key' => '_wp_attachment_metadata',
            'meta_value' => $meta
        ]);
    }
}

// == Actions ==

if ($act === 'status') {
    $ext = find_ext();
    $p = prog_get($logf);
    echo json_encode([
        'action' => 'status',
        'external_images' => count($ext),
        'downloaded' => $p['dl'],
        'failed' => $p['fail'],
        'target_dir' => $tdir,
        'sample' => array_slice($ext, 0, 5)
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($act === 'reset') {
    if (file_exists($logf)) unlink($logf);
    echo json_encode(['action' => 'reset', 'ok' => true]);
    exit;
}

if ($act === 'download') {
    $ext = find_ext();
    $p = prog_get($logf);
    $done = array_column($p['log'], 'aid');
    $todo = array_values(array_filter($ext, function($i) use ($done) {
        return !in_array($i['aid'], $done);
    }));
    if (!$todo) {
        echo json_encode([
            'action' => 'download', 'message' => 'Klart!',
            'downloaded' => $p['dl'], 'failed' => $p['fail']
        ], JSON_PRETTY_PRINT);
        exit;
    }
    $batch = array_slice($todo, 0, $bsz);
    $res = [];
    foreach ($batch as $img) {
        if ((time() - $t0) >= $maxt) {
            $res[] = ['aid' => $img['aid'], 'status' => 'timeout'];
            break;
        }
        $dl = dl_img($img['url'], $tdir);
        if ($dl['ok']) {
            upd_att($img['aid'], $dl['path'], $dl['fn'], $dl['mime'], $turl);
            $p['dl']++;
            $p['log'][] = [
                'aid' => $img['aid'], 'pid' => $img['pid'],
                'url' => $img['url'], 'fn' => $dl['fn'], 'sz' => $dl['sz'],
                'status' => 'ok', 't' => date('H:i:s')
            ];
            $res[] = ['aid' => $img['aid'], 'status' => 'ok', 'fn' => $dl['fn'], 'sz' => $dl['sz']];
        } else {
            $p['fail']++;
            $p['log'][] = [
                'aid' => $img['aid'], 'pid' => $img['pid'],
                'url' => $img['url'], 'status' => 'fail',
                'err' => $dl['err'], 't' => date('H:i:s')
            ];
            $res[] = ['aid' => $img['aid'], 'status' => 'fail', 'err' => $dl['err']];
        }
    }
    prog_save($logf, $p);
    echo json_encode([
        'action' => 'download', 'processed' => count($res),
        'remaining' => count($todo) - count($batch),
        'downloaded' => $p['dl'], 'failed' => $p['fail'],
        'results' => $res, 'elapsed' => (time() - $t0) . 's'
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

echo json_encode(['error' => 'Okand action. Anvand: status, download, reset']);
