<?php
/**
 * Plugin Name: Searchboost Onboarding
 * Description: Onboarding-formulär för nya SEO-kunder. Shortcode: [searchboost_uppstart]
 * Version: 1.0.0
 * Author: Searchboost
 */

if (!defined('ABSPATH')) exit;

// Settings page
add_action('admin_menu', function() {
    add_options_page('SB Onboarding', 'SB Onboarding', 'manage_options', 'sb-onboarding', 'sb_onboarding_settings_page');
});

add_action('admin_init', function() {
    register_setting('sb_onboarding', 'sb_onboarding_api_url');
    register_setting('sb_onboarding', 'sb_onboarding_api_key');
});

function sb_onboarding_settings_page() {
    ?>
    <div class="wrap">
        <h1>Searchboost Onboarding</h1>
        <form method="post" action="options.php">
            <?php settings_fields('sb_onboarding'); ?>
            <table class="form-table">
                <tr>
                    <th>API URL</th>
                    <td><input type="url" name="sb_onboarding_api_url" value="<?php echo esc_attr(get_option('sb_onboarding_api_url', 'https://51.21.116.7/api/onboard')); ?>" class="regular-text" /></td>
                </tr>
                <tr>
                    <th>API-nyckel</th>
                    <td><input type="password" name="sb_onboarding_api_key" value="<?php echo esc_attr(get_option('sb_onboarding_api_key', '')); ?>" class="regular-text" /></td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

// AJAX handler
add_action('wp_ajax_sb_onboard', 'sb_onboard_handler');
add_action('wp_ajax_nopriv_sb_onboard', 'sb_onboard_handler');

function sb_onboard_handler() {
    check_ajax_referer('sb_onboard_nonce', 'nonce');

    $api_url = get_option('sb_onboarding_api_url', '');
    $api_key = get_option('sb_onboarding_api_key', '');

    if (empty($api_url) || empty($api_key)) {
        wp_send_json_error('Plugin ej konfigurerat. Kontakta admin.');
        return;
    }

    $data = array(
        'company_name'           => sanitize_text_field($_POST['company_name'] ?? ''),
        'contact_person'         => sanitize_text_field($_POST['contact_person'] ?? ''),
        'contact_email'          => sanitize_email($_POST['contact_email'] ?? ''),
        'wordpress_url'          => esc_url_raw($_POST['wordpress_url'] ?? ''),
        'wordpress_username'     => sanitize_text_field($_POST['wordpress_username'] ?? ''),
        'wordpress_app_password' => sanitize_text_field($_POST['wordpress_app_password'] ?? ''),
        'gsc_property'           => esc_url_raw($_POST['gsc_property'] ?? ''),
        'ga_property_id'         => sanitize_text_field($_POST['ga_property_id'] ?? ''),
        'google_ads_id'          => sanitize_text_field($_POST['google_ads_id'] ?? ''),
        'meta_pixel_id'          => sanitize_text_field($_POST['meta_pixel_id'] ?? ''),
        'gtm_id'                => sanitize_text_field($_POST['gtm_id'] ?? ''),
    );

    $response = wp_remote_post($api_url, array(
        'timeout'   => 30,
        'sslverify' => false,
        'headers'   => array(
            'Content-Type' => 'application/json',
            'X-Api-Key'    => $api_key,
        ),
        'body' => wp_json_encode($data),
    ));

    if (is_wp_error($response)) {
        wp_send_json_error('Kunde inte nå servern: ' . $response->get_error_message());
        return;
    }

    $code = wp_remote_retrieve_response_code($response);
    $body = json_decode(wp_remote_retrieve_body($response), true);

    if ($code >= 200 && $code < 300 && !empty($body['success'])) {
        wp_send_json_success($body);
    } else {
        wp_send_json_error($body['error'] ?? 'Okänt fel från servern');
    }
}

// Enqueue script via wp_footer when shortcode is present
add_action('wp_footer', function() {
    global $sb_onboard_form_rendered;
    if (empty($sb_onboard_form_rendered)) return;
    ?>
    <script>
    function sbSubmitForm() {
        var form = document.getElementById('sb-onboard-form');
        var btn = document.getElementById('sb-submit-btn');
        var errBox = document.getElementById('sb-error-box');
        errBox.style.display = 'none';
        form.querySelectorAll('.sb-error').forEach(function(el) { el.classList.remove('sb-error'); });
        var fields = {};
        var valid = true;
        form.querySelectorAll('input').forEach(function(input) {
            fields[input.name] = input.value.trim();
            if (input.required && !input.value.trim()) {
                input.classList.add('sb-error');
                valid = false;
            }
        });
        if (fields.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.contact_email)) {
            form.querySelector('[name="contact_email"]').classList.add('sb-error');
            valid = false;
        }
        if (fields.wordpress_url && !/^https?:\/\/.+/.test(fields.wordpress_url)) {
            form.querySelector('[name="wordpress_url"]').classList.add('sb-error');
            valid = false;
        }
        if (!valid) {
            errBox.textContent = 'Fyll i alla obligatoriska fält korrekt.';
            errBox.style.display = 'block';
            return;
        }
        btn.disabled = true;
        btn.textContent = 'Skickar...';
        var formData = new FormData();
        formData.append('action', 'sb_onboard');
        formData.append('nonce', '<?php echo wp_create_nonce("sb_onboard_nonce"); ?>');
        for (var k in fields) { formData.append(k, fields[k]); }
        fetch('<?php echo admin_url("admin-ajax.php"); ?>', { method: 'POST', body: formData })
        .then(function(r) { return r.json(); })
        .then(function(res) {
            if (res.success) {
                form.style.display = 'none';
                document.getElementById('sb-success').style.display = 'block';
                window.scrollTo({ top: document.getElementById('sb-success').offsetTop - 100, behavior: 'smooth' });
            } else {
                errBox.textContent = res.data || 'Något gick fel. Försök igen.';
                errBox.style.display = 'block';
                btn.disabled = false;
                btn.textContent = 'Skicka uppgifter';
            }
        })
        .catch(function() {
            errBox.textContent = 'Nätverksfel. Kontrollera din internetanslutning.';
            errBox.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Skicka uppgifter';
        });
    }
    </script>
    <?php
});

// Shortcode
add_shortcode('searchboost_uppstart', 'sb_onboarding_form');

function sb_onboarding_form() {
    global $sb_onboard_form_rendered;
    $sb_onboard_form_rendered = true;
    ob_start();
    ?>
    <style>
        .sb-form { max-width: 700px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .sb-section { background: #f8f9fa; border-radius: 12px; padding: 28px; margin-bottom: 24px; border: 1px solid #e9ecef; }
        .sb-section h3 { margin: 0 0 6px 0; font-size: 1.2em; color: #1a1a1a; display: flex; align-items: center; gap: 10px; }
        .sb-section h3 .sb-icon { font-size: 1.4em; }
        .sb-section p.sb-desc { margin: 0 0 20px 0; color: #666; font-size: 0.9em; }
        .sb-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .sb-row.sb-full { grid-template-columns: 1fr; }
        .sb-field label { display: block; font-weight: 600; font-size: 0.85em; margin-bottom: 4px; color: #333; }
        .sb-field label .sb-req { color: #e74c3c; }
        .sb-field input { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.95em; box-sizing: border-box; transition: border-color 0.2s; }
        .sb-field input:focus { outline: none; border-color: #e91e8e; box-shadow: 0 0 0 3px rgba(233,30,142,0.1); }
        .sb-field input.sb-error { border-color: #e74c3c; }
        .sb-field .sb-hint { font-size: 0.8em; color: #888; margin-top: 4px; }
        .sb-field .sb-err-msg { font-size: 0.8em; color: #e74c3c; margin-top: 4px; display: none; }
        .sb-submit-wrap { text-align: center; margin-top: 8px; }
        .sb-submit { background: linear-gradient(135deg, #e91e8e, #ff6b9d); color: #fff; border: none; padding: 14px 48px; font-size: 1.1em; font-weight: 700; border-radius: 50px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
        .sb-submit:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(233,30,142,0.3); }
        .sb-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .sb-success { text-align: center; padding: 40px; background: linear-gradient(135deg, #f0fff4, #e8f5e8); border-radius: 12px; border: 1px solid #c3e6cb; }
        .sb-success h3 { color: #155724; font-size: 1.5em; }
        .sb-success p { color: #333; font-size: 1em; }
        .sb-error-box { background: #fff5f5; border: 1px solid #f5c6cb; border-radius: 8px; padding: 14px; color: #721c24; margin-bottom: 16px; display: none; }
        .sb-guide-toggle { background: none; border: 1px solid #d1d5db; border-radius: 6px; padding: 4px 12px; font-size: 0.8em; cursor: pointer; color: #666; margin-left: auto; }
        .sb-guide-toggle:hover { background: #f0f0f0; }
        .sb-guide { display: none; background: #fff; border-radius: 8px; padding: 16px; margin-top: 12px; font-size: 0.88em; color: #555; border: 1px solid #e9ecef; }
        .sb-guide ol { margin: 8px 0 0 0; padding-left: 20px; }
        .sb-guide li { margin-bottom: 6px; }
    </style>

    <div class="sb-form" id="sb-onboard-form">
        <div class="sb-error-box" id="sb-error-box"></div>

        <!-- Företagsinfo -->
        <div class="sb-section">
            <h3><span class="sb-icon">🏢</span> Företagsinformation</h3>
            <p class="sb-desc">Grundläggande info om ert företag.</p>
            <div class="sb-row">
                <div class="sb-field">
                    <label>Företagsnamn <span class="sb-req">*</span></label>
                    <input type="text" name="company_name" required placeholder="Företaget AB" />
                </div>
                <div class="sb-field">
                    <label>Kontaktperson</label>
                    <input type="text" name="contact_person" placeholder="Anna Svensson" />
                </div>
            </div>
            <div class="sb-row sb-full">
                <div class="sb-field">
                    <label>E-post <span class="sb-req">*</span></label>
                    <input type="email" name="contact_email" required placeholder="anna@foretaget.se" />
                </div>
            </div>
        </div>

        <!-- WordPress -->
        <div class="sb-section">
            <h3>
                <span class="sb-icon">🌐</span> WordPress
                <button type="button" class="sb-guide-toggle" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='block'?'none':'block'">Visa guide</button>
            </h3>
            <div class="sb-guide">
                <strong>Alternativ 1 — Lägg till oss som ny användare:</strong>
                <ol>
                    <li>Logga in på er WordPress-webbplats</li>
                    <li>Gå till <strong>Användare</strong> i adminpanelen och välj <strong>Lägg till ny</strong></li>
                    <li>Ange vår e-postadress <strong>mikael@searchboost.se</strong> och ge kontot rollen <strong>Administratör</strong></li>
                    <li>Klicka på <strong>Lägg till användare</strong></li>
                </ol>
                <strong>Alternativ 2 — Skapa ett app-lösenord:</strong>
                <ol>
                    <li>Logga in i WordPress → Användare → Din profil</li>
                    <li>Scrolla ner till "Applikationslösenord"</li>
                    <li>Skriv "Searchboost" som namn och klicka "Lägg till"</li>
                    <li>Kopiera lösenordet som visas (det visas bara en gång!)</li>
                </ol>
                <p style="margin-top:8px;font-size:0.85em;color:#888;">Har ni frågor eller fastnar på något steg? Tveka inte att kontakta oss — vi hjälper gärna till!</p>
            </div>
            <p class="sb-desc">Vi behöver ett app-lösenord för att kunna optimera er webbplats.</p>
            <div class="sb-row sb-full">
                <div class="sb-field">
                    <label>Webbplatsens URL <span class="sb-req">*</span></label>
                    <input type="url" name="wordpress_url" required placeholder="https://mittforetag.se" />
                </div>
            </div>
            <div class="sb-row">
                <div class="sb-field">
                    <label>Admin-användarnamn <span class="sb-req">*</span></label>
                    <input type="text" name="wordpress_username" required placeholder="admin" />
                </div>
                <div class="sb-field">
                    <label>App-lösenord <span class="sb-req">*</span></label>
                    <input type="password" name="wordpress_app_password" required placeholder="xxxx xxxx xxxx xxxx" />
                    <div class="sb-hint">Skapas under Användare → Din profil i WordPress</div>
                </div>
            </div>
        </div>

        <!-- Google Search Console -->
        <div class="sb-section">
            <h3>
                <span class="sb-icon">🔍</span> Google Search Console
                <button type="button" class="sb-guide-toggle" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='block'?'none':'block'">Visa guide</button>
            </h3>
            <div class="sb-guide">
                <strong>Lägg till oss som ny användare med administratörsrättigheter:</strong>
                <p style="margin:6px 0;font-size:0.88em;color:#555;">Om ni inte har ett Google Search Console-konto sedan tidigare eller vill ta bort det nuvarande kontot så kan vi lösa hela processen — ni behöver inte följa guiden nedan.</p>
                <ol>
                    <li>Logga in på <a href="https://search.google.com/search-console/" target="_blank">search.google.com/search-console</a></li>
                    <li>Klicka på <strong>Inställningar</strong> längst ner till vänster</li>
                    <li>Klicka på <strong>Användare och behörigheter</strong></li>
                    <li>Klicka på <strong>Lägg till användare</strong></li>
                    <li>Fyll i <strong>mikael@searchboost.se</strong></li>
                    <li>Välj <strong>Fullständig</strong></li>
                    <li>Klicka <strong>Lägg till</strong></li>
                </ol>
                <p style="margin-top:8px;font-size:0.85em;color:#888;">Har ni frågor eller fastnar på något steg? Tveka inte att kontakta oss — vi hjälper gärna till!</p>
            </div>
            <p class="sb-desc">Valfritt — hjälper oss övervaka er synlighet i Google.</p>
            <div class="sb-row sb-full">
                <div class="sb-field">
                    <label>Property URL</label>
                    <input type="url" name="gsc_property" placeholder="https://mittforetag.se" />
                </div>
            </div>
        </div>

        <!-- Google Analytics -->
        <div class="sb-section">
            <h3>
                <span class="sb-icon">📊</span> Google Analytics
                <button type="button" class="sb-guide-toggle" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='block'?'none':'block'">Visa guide</button>
            </h3>
            <div class="sb-guide">
                <strong>Lägg till oss som administratör i Google Analytics:</strong>
                <p style="margin:6px 0;font-size:0.88em;color:#555;">Om ni inte har ett Google Analytics-konto sedan tidigare kan vi lösa hela processen åt er.</p>
                <ol>
                    <li>Logga in på <a href="https://analytics.google.com" target="_blank">analytics.google.com</a></li>
                    <li>Klicka på <strong>kugghjulet</strong> längst ner till vänster</li>
                    <li>Klicka på <strong>Åtkomsthantering för konton</strong></li>
                    <li>Klicka på <strong>+</strong> längst upp till höger</li>
                    <li>Välj <strong>Lägg till användare</strong>, fyll i <strong>mikael@searchboost.se</strong></li>
                    <li>Välj <strong>Administratör</strong></li>
                    <li>Klicka <strong>Lägg till</strong></li>
                </ol>
                <strong style="display:block;margin-top:12px;">Hitta ert GA4 Property ID:</strong>
                <ol>
                    <li>Klicka på kugghjulet (Admin) → Property → Property-information</li>
                    <li>Kopiera Property ID (börjar med G-)</li>
                </ol>
                <p style="margin-top:8px;font-size:0.85em;color:#888;">Har ni frågor eller fastnar på något steg? Tveka inte att kontakta oss — vi hjälper gärna till!</p>
            </div>
            <p class="sb-desc">Valfritt — ger insikt om besökarnas beteende.</p>
            <div class="sb-row sb-full">
                <div class="sb-field">
                    <label>GA4 Property ID</label>
                    <input type="text" name="ga_property_id" placeholder="G-XXXXXXXXXX" />
                </div>
            </div>
        </div>

        <!-- Google Tag Manager -->
        <div class="sb-section">
            <h3>
                <span class="sb-icon">🏷️</span> Google Tag Manager
                <button type="button" class="sb-guide-toggle" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='block'?'none':'block'">Visa guide</button>
            </h3>
            <div class="sb-guide">
                <strong>Lägg till oss som administratör i Google Tag Manager:</strong>
                <p style="margin:6px 0;font-size:0.88em;color:#555;">Saknar ni ett GTM-konto eller vill börja om från början? Ingen fara, vi kan sätta upp allt åt er.</p>
                <ol>
                    <li>Logga in på <a href="https://tagmanager.google.com" target="_blank">tagmanager.google.com</a></li>
                    <li>Klicka på <strong>Administratör</strong></li>
                    <li>Välj <strong>Användarhantering</strong> under Konto-kolumnen</li>
                    <li>Klicka på <strong>+</strong> och välj <strong>Lägg till nya användare</strong></li>
                    <li>Ange: <strong>mikael@searchboost.se</strong></li>
                    <li>Välj behörighet — <strong>Administratör</strong> ger full åtkomst</li>
                    <li>Klicka <strong>Bjud in</strong></li>
                </ol>
                <p style="margin-top:8px;font-size:0.85em;color:#888;">Har ni frågor eller fastnar på något steg? Tveka inte att kontakta oss — vi hjälper gärna till!</p>
            </div>
            <p class="sb-desc">Valfritt — med GTM kan vi lägga till spårning och taggar utan att ändra er kod.</p>
            <div class="sb-row sb-full">
                <div class="sb-field">
                    <label>GTM Container-ID</label>
                    <input type="text" name="gtm_id" placeholder="GTM-XXXXXXX" />
                    <div class="sb-hint">Hittas uppe till höger i Tag Manager (format: GTM-XXXXXXX)</div>
                </div>
            </div>
        </div>

        <!-- Google Ads -->
        <div class="sb-section">
            <h3><span class="sb-icon">📣</span> Google Ads</h3>
            <p class="sb-desc">Valfritt — om ni kör Google Ads kan vi koppla ihop SEO och annonsdata.</p>
            <div class="sb-row sb-full">
                <div class="sb-field">
                    <label>Kund-ID</label>
                    <input type="text" name="google_ads_id" placeholder="123-456-7890" />
                    <div class="sb-hint">Hittas uppe till höger i Google Ads (format: xxx-xxx-xxxx)</div>
                </div>
            </div>
        </div>

        <!-- Meta Pixel -->
        <div class="sb-section">
            <h3><span class="sb-icon">📱</span> Meta Pixel (Facebook)</h3>
            <p class="sb-desc">Valfritt — för konverteringsspårning. Ger oss inte publiceringsåtkomst.</p>
            <div class="sb-row sb-full">
                <div class="sb-field">
                    <label>Pixel ID</label>
                    <input type="text" name="meta_pixel_id" placeholder="123456789012345" />
                    <div class="sb-hint">Hittas i Meta Events Manager → Datakällor → Pixel ID</div>
                </div>
            </div>
        </div>

        <div class="sb-submit-wrap">
            <button type="button" class="sb-submit" id="sb-submit-btn" onclick="sbSubmitForm()">Skicka uppgifter</button>
        </div>
    </div>

    <div class="sb-success" id="sb-success" style="display:none;">
        <h3>&#10003; Tack! Vi har tagit emot era uppgifter</h3>
        <p>Vi har registrerat ert konto och kommer att påbörja SEO-arbetet inom kort.</p>
        <p>Ett Trello-kort har skapats för att spåra ert projekt.</p>
        <p style="margin-top:20px;color:#666;">Ni får ett bekräftelsemail till den angivna e-postadressen.</p>
    </div>

    <!-- Script loaded via wp_footer -->
    <?php
    return ob_get_clean();
}
