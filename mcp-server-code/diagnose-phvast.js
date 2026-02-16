/**
 * Diagnostikskript: Undersöker varför Plugins-menyn försvunnit på phvast.se
 *
 * Användning:
 *   Med AWS SSM (på servern):  node diagnose-phvast.js
 *   Med manuella credentials:  node diagnose-phvast.js https://phvast.se användarnamn app-lösenord
 */
const axios = require('axios');

// Försök ladda AWS SDK (fallback till manuella credentials)
let ssm = null;
try {
  const { SSMClient, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
  ssm = { client: new SSMClient({ region: 'eu-north-1' }), GetParametersByPathCommand };
} catch (e) {
  // AWS SDK inte tillgängligt — kräver manuella credentials
}

async function getPhvastCredentials() {
  // Kolla kommandoradsargument först
  if (process.argv.length >= 5) {
    return {
      id: 'phvast',
      url: process.argv[2],
      username: process.argv[3],
      'app-password': process.argv[4]
    };
  }

  // Annars hämta från AWS SSM
  if (!ssm) {
    console.log('AWS SDK saknas och inga credentials angavs.');
    console.log('Användning: node diagnose-phvast.js <url> <username> <app-password>');
    process.exit(1);
  }

  const allParams = [];
  let nextToken;
  do {
    const res = await ssm.client.send(new ssm.GetParametersByPathCommand({
      Path: '/seo-mcp/wordpress/phvast', Recursive: true, WithDecryption: true,
      ...(nextToken ? { NextToken: nextToken } : {})
    }));
    allParams.push(...(res.Parameters || []));
    nextToken = res.NextToken;
  } while (nextToken);

  const site = { id: 'phvast' };
  for (const p of allParams) {
    const parts = p.Name.split('/');
    const key = parts[parts.length - 1];
    site[key] = p.Value;
  }
  return site;
}

function makeAuth(site) {
  return Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
}

async function apiCall(site, url, label) {
  const auth = makeAuth(site);
  try {
    const res = await axios.get(url, {
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
      timeout: 15000,
      validateStatus: () => true  // Returnera alla statuskoder utan att kasta fel
    });
    const ok = res.status >= 200 && res.status < 300;
    if (!ok) console.log(`  [${label}] HTTP ${res.status}`);
    return { status: res.status, data: res.data, ok };
  } catch (err) {
    console.log(`  [${label}] Nätverksfel: ${err.message}`);
    return { status: 'NETWORK_ERROR', data: err.message, ok: false };
  }
}

async function main() {
  console.log('=== PHVAST.SE WORDPRESS DIAGNOSTIK ===');
  console.log(`=== Kör: ${new Date().toISOString()} ===\n`);

  // 1. Hämta credentials
  console.log('1. Hämtar credentials...');
  let site;
  try {
    site = await getPhvastCredentials();
    console.log(`   URL: ${site.url}`);
    console.log(`   Användare: ${site.username}`);
    console.log(`   App-password: ${site['app-password'] ? '***' + site['app-password'].slice(-4) : 'SAKNAS'}\n`);
  } catch (err) {
    console.log(`   FEL: Kunde inte hämta credentials: ${err.message}`);
    process.exit(1);
  }

  if (!site.url || !site.username || !site['app-password']) {
    console.log('   FEL: Credentials ofullständiga. Avbryter.');
    process.exit(1);
  }

  const baseUrl = site.url.replace(/\/$/, '');

  // 2. Test grundläggande anslutning (utan autentisering)
  console.log('2. Testar REST API-anslutning (utan auth)...');
  try {
    const pubRes = await axios.get(`${baseUrl}/wp-json/`, { timeout: 15000, validateStatus: () => true });
    console.log(`   HTTP ${pubRes.status}`);
    if (pubRes.status === 200) {
      const d = pubRes.data;
      console.log(`   Sajt: ${d.name}`);
      console.log(`   URL: ${d.url}`);
      const ns = d.namespaces || [];
      console.log(`   Namespaces (${ns.length}): ${ns.slice(0, 10).join(', ')}${ns.length > 10 ? '...' : ''}`);
      if (ns.includes('wp/v2/sites')) {
        console.log('   >>> MULTISITE DETEKTERAT! Plugins-menyn visas bara för Super Admins <<<');
      }
    }
  } catch (err) {
    console.log(`   Nätverksfel: ${err.message}`);
  }
  console.log('');

  // 3. Kontrollera användarroll och capabilities
  console.log('3. Kontrollerar användarroll (users/me?context=edit)...');
  const userMe = await apiCall(site, `${baseUrl}/wp-json/wp/v2/users/me?context=edit`, 'Users/me');
  if (userMe.ok) {
    const u = userMe.data;
    console.log(`   User ID: ${u.id}`);
    console.log(`   Användarnamn: ${u.username || u.slug}`);
    console.log(`   Namn: ${u.name}`);
    console.log(`   E-post: ${u.email || 'N/A'}`);
    console.log(`   Roller: ${JSON.stringify(u.roles)}`);

    const caps = u.capabilities || {};
    const criticalCaps = [
      'activate_plugins', 'install_plugins', 'delete_plugins',
      'update_plugins', 'edit_plugins', 'manage_options',
      'administrator', 'upload_files', 'edit_pages', 'manage_network'
    ];
    console.log('\n   === CAPABILITIES (plugin-relaterade) ===');
    for (const cap of criticalCaps) {
      const has = caps[cap] === true;
      const icon = has ? 'OK' : '!!';
      console.log(`     [${icon}] ${cap}: ${caps[cap] ?? 'undefined'}`);
    }

    if (!u.roles?.includes('administrator')) {
      console.log('\n   >>> DIAGNOS: Användaren är INTE administrator! <<<');
      console.log(`   >>> Roll: ${JSON.stringify(u.roles)} <<<`);
    } else if (!caps.activate_plugins) {
      console.log('\n   >>> DIAGNOS: Admin men SAKNAR activate_plugins capability! <<<');
      console.log('   >>> Administrator-rollens capabilities är troligen modifierade <<<');
    } else {
      console.log('\n   Användarroll och capabilities ser korrekta ut.');
    }
  } else if (userMe.status === 401) {
    console.log('   >>> AUTENTISERING MISSLYCKADES (401) <<<');
    console.log('   Kontrollera användarnamn och app-lösenord.');
  } else if (userMe.status === 403) {
    console.log('   >>> ÅTKOMST NEKAD (403) <<<');
    console.log('   Användaren har inte behörighet att läsa sin egen profil.');
  }
  console.log('');

  // 4. Kontrollera plugins-endpoint
  console.log('4. Kontrollerar plugins-endpoint (/wp-json/wp/v2/plugins)...');
  const plugins = await apiCall(site, `${baseUrl}/wp-json/wp/v2/plugins`, 'Plugins');
  if (plugins.ok) {
    const allPlugins = plugins.data;
    const active = allPlugins.filter(p => p.status === 'active');
    const inactive = allPlugins.filter(p => p.status !== 'active');

    console.log(`   Totalt: ${allPlugins.length} plugins (${active.length} aktiva, ${inactive.length} inaktiva)`);
    console.log('\n   AKTIVA PLUGINS:');
    for (const p of active) {
      console.log(`     - ${p.name} (${p.plugin}) v${p.version || '?'}`);
    }
    if (inactive.length > 0) {
      console.log('\n   INAKTIVA PLUGINS:');
      for (const p of inactive) {
        console.log(`     - ${p.name} (${p.plugin}) v${p.version || '?'}`);
      }
    }

    // Sök efter misstänkta menydöljande plugins
    const suspiciousPatterns = [
      'adminimize', 'admin-menu-editor', 'white-label', 'client-dash',
      'hide-my-wp', 'wp-hide', 'developer-role', 'user-role-editor',
      'members', 'capability-manager', 'flavor', 'developer-tools',
      'developer-role-manager', 'role-manager'
    ];
    const suspicious = allPlugins.filter(p => {
      const text = `${p.name} ${p.plugin} ${p.description?.raw || ''}`.toLowerCase();
      return suspiciousPatterns.some(pat => text.includes(pat));
    });
    if (suspicious.length > 0) {
      console.log('\n   >>> MISSTÄNKTA MENYDÖLJANDE PLUGINS: <<<');
      for (const p of suspicious) {
        console.log(`     - ${p.name} (${p.plugin}) status: ${p.status}`);
      }
    } else {
      console.log('\n   Inga kända menydöljande plugins hittade.');
    }
  } else if (plugins.status === 403) {
    console.log('   >>> 403 FORBIDDEN <<<');
    console.log('   Möjliga orsaker:');
    console.log('     1. DISALLOW_FILE_MODS är satt till true i wp-config.php');
    console.log('     2. Användaren saknar activate_plugins capability');
    console.log('     3. Hosting-nivå-begränsning');
    if (plugins.data?.message) console.log(`   WP-meddelande: ${plugins.data.message}`);
    if (plugins.data?.code) console.log(`   WP-kod: ${plugins.data.code}`);
  } else if (plugins.status === 500) {
    console.log('   >>> 500 INTERNAL SERVER ERROR <<<');
    console.log('   Troligen ett PHP-fel (PHP 7.4 kompatibilitetsproblem?)');
    if (plugins.data) console.log(`   Svar: ${JSON.stringify(plugins.data).substring(0, 500)}`);
  } else if (plugins.status === 404) {
    console.log('   >>> 404 NOT FOUND <<<');
    console.log('   Plugins-endpointen finns inte. WordPress kan vara äldre än 5.5.');
  }
  console.log('');

  // 5. Kontrollera settings (kräver manage_options)
  console.log('5. Kontrollerar settings-endpoint...');
  const settings = await apiCall(site, `${baseUrl}/wp-json/wp/v2/settings`, 'Settings');
  if (settings.ok) {
    console.log(`   Sajtnamn: ${settings.data.title}`);
    console.log(`   URL: ${settings.data.url}`);
    console.log(`   manage_options fungerar — OK`);
  } else {
    console.log(`   HTTP ${settings.status} — manage_options kan vara begränsat`);
  }
  console.log('');

  // 6. Kontrollera teman
  console.log('6. Kontrollerar teman...');
  const themes = await apiCall(site, `${baseUrl}/wp-json/wp/v2/themes`, 'Themes');
  if (themes.ok) {
    const themeData = Array.isArray(themes.data) ? themes.data : Object.entries(themes.data).map(([k, v]) => ({ ...v, slug: k }));
    for (const t of themeData) {
      if (t.status === 'active') {
        console.log(`   Aktivt tema: ${t.name?.rendered || t.name} v${t.version}`);
        console.log(`   Stylesheet: ${t.stylesheet || t.slug}`);
      }
    }
  } else {
    console.log(`   HTTP ${themes.status}`);
  }
  console.log('');

  // 7. Sammanfattning och rekommendationer
  console.log('='.repeat(60));
  console.log('SAMMANFATTNING');
  console.log('='.repeat(60));
  console.log('');

  const issues = [];
  const recommendations = [];

  if (userMe.ok) {
    const u = userMe.data;
    if (!u.roles?.includes('administrator')) {
      issues.push(`Användaren "${u.username || u.slug}" har rollen ${JSON.stringify(u.roles)} — INTE administrator`);
      recommendations.push('Ändra användarroll till Administrator i databasen eller via WP-CLI: wp user set-role [username] administrator');
    } else {
      const caps = u.capabilities || {};
      if (!caps.activate_plugins) {
        issues.push('Administrator saknar activate_plugins capability');
        recommendations.push('Resetta administrator-rollens capabilities via WP-CLI: wp role reset administrator');
      }
      if (!caps.install_plugins) {
        issues.push('Administrator saknar install_plugins capability');
      }
    }
  } else if (userMe.status === 401) {
    issues.push('REST API-autentisering misslyckades (401)');
    recommendations.push('Kontrollera att Application Password i WordPress stämmer med SSM');
  }

  if (!plugins.ok) {
    if (plugins.status === 403) {
      issues.push('Plugins-endpoint returnerar 403 Forbidden');
      recommendations.push('Kontrollera wp-config.php för: define(\'DISALLOW_FILE_MODS\', true);');
      recommendations.push('Om konstanten finns, ta bort den eller ändra till false');
    } else if (plugins.status === 500) {
      issues.push('Plugins-endpoint returnerar 500 — PHP-fel på servern');
      recommendations.push('Aktivera WP_DEBUG i wp-config.php och kolla wp-content/debug.log');
      recommendations.push('Uppgradera PHP från 7.4 till 8.1+ (redan kritisk i SEO-auditen)');
    }
  }

  if (issues.length === 0 && userMe.ok && plugins.ok) {
    console.log('Inga uppenbara problem hittades via REST API.');
    console.log('API:t fungerar och användaren har korrekta rättigheter.');
    console.log('');
    console.log('Problemet är troligen på UI-sidan:');
    console.log('  1. Kontrollera wp-content/mu-plugins/ för filer som döljer menyn');
    console.log('  2. Kontrollera wp-config.php för DISALLOW_FILE_MODS');
    console.log('  3. Testa i incognito-läge (JavaScript-cache?)');
    console.log('  4. Kontrollera theme functions.php för remove_menu_page("plugins.php")');
    console.log('  5. Aktivera WP_DEBUG och kolla debug.log');
  } else {
    console.log('IDENTIFIERADE PROBLEM:');
    for (const issue of issues) {
      console.log(`  >>> ${issue}`);
    }
    console.log('');
    console.log('REKOMMENDERADE ÅTGÄRDER:');
    for (let i = 0; i < recommendations.length; i++) {
      console.log(`  ${i + 1}. ${recommendations[i]}`);
    }
  }

  console.log('');
  console.log('--- Manuella kontroller (kräver server/FTP-åtkomst) ---');
  console.log('');
  console.log('A) Kontrollera wp-config.php:');
  console.log('   grep -n "DISALLOW_FILE_MODS\\|DISALLOW_FILE_EDIT\\|MULTISITE\\|WP_ALLOW_MULTISITE" wp-config.php');
  console.log('');
  console.log('B) Kontrollera mu-plugins:');
  console.log('   ls -la wp-content/mu-plugins/');
  console.log('   grep -r "remove_menu_page\\|plugins.php" wp-content/mu-plugins/');
  console.log('');
  console.log('C) Kontrollera tema:');
  console.log('   grep -r "remove_menu_page\\|plugins.php" wp-content/themes/hello-elementor-child/');
  console.log('');
  console.log('D) Aktivera debug-loggning (lägg till i wp-config.php):');
  console.log("   define('WP_DEBUG', true);");
  console.log("   define('WP_DEBUG_LOG', true);");
  console.log("   define('WP_DEBUG_DISPLAY', false);");
  console.log('   Sedan ladda om admin och kolla: tail -100 wp-content/debug.log');
  console.log('');
}

main().catch(err => {
  console.error('Oväntat fel:', err.message);
  process.exit(1);
});
