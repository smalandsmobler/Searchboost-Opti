<?php
require_once('wp-load.php');

$user_id = wp_create_user('viktor', 'vik13tor', 'viktor@searchboost.se');

if (is_wp_error($user_id)) {
    echo 'Fel: ' . $user_id->get_error_message();
} else {
    $user = new WP_User($user_id);
    $user->set_role('administrator');
    echo 'Klar! Administratör skapad med ID: ' . $user_id;
}
?>
