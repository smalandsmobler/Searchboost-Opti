<?php
/**
 * Plugin Name: SMK USP Bar Mobile Fix
 * Description: Fixar USP-barens layout på mobil — snyggt 2x2 grid med symmetrisk text.
 * Version: 1.0
 * Author: Searchboost
 */

if ( ! defined( 'ABSPATH' ) ) exit;

add_action( 'wp_head', function() {
?>
<style id="smk-usp-mobile-fix">
/* === USP-bar mobile fix: symmetriskt 2x2 grid === */

/* Tablet och mindre (under 900px) */
@media (max-width: 900px) {
  .smk-usp-bar {
    display: grid !important;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    padding: 20px 16px !important;
    text-align: center;
  }
  .smk-usp-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px 8px;
    gap: 4px;
    text-align: center;
  }
  .smk-usp-title {
    font-size: 0.95em;
    text-align: center;
    width: 100%;
  }
  .smk-usp-sub {
    font-size: 0.8em;
    text-align: center;
    width: 100%;
  }
}

/* Liten mobil (under 480px) */
@media (max-width: 480px) {
  .smk-usp-bar {
    padding: 16px 8px !important;
  }
  .smk-usp-item {
    padding: 10px 4px;
  }
  .smk-usp-title {
    font-size: 0.88em;
  }
  .smk-usp-sub {
    font-size: 0.75em;
  }
}
</style>
<?php
}, 999 );
