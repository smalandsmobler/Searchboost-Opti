#!/usr/bin/env node
/**
 * onboard-wedosigns.js
 * Komplett onboarding av Wedo Signs i Searchboost Opti-systemet.
 *
 * Kör: node scripts/onboard-wedosigns.js
 *
 * Förutsättningar:
 * - AWS CLI konfigurerad (profil mickedanne@gmail.com)
 * - WP app-password i SSM: /seo-mcp/wordpress/wedosigns/app-password
 * - Rank Math Pro ZIP nedladdad (sökväg anges nedan)
 *
 * Steg som körs:
 * 1. Hämta WP-credentials från SSM
 * 2. Skapa kund i pipeline (POST /api/prospects)
 * 3. Lägg in ABC-nyckelord (POST /api/customers/wedosigns/keywords)
 * 4. Lägg in 3-månadersplan (POST /api/customers/wedosigns/manual-action-plan)
 * 5. Deploya mu-plugins (schema + offertknapp) till WP
 * 6. Sätt meta descriptions på alla sidor via Rank Math
 * 7. Installera Rank Math Pro (om Free finns — uppgradera)
 * 8. Instruktioner för GSC, GA4, GTM
 */

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ── Config ──
const AWS_REGION = 'eu-north-1';
const API_BASE = 'https://51.21.116.7';
const WP_BASE = 'https://wedosigns.se';
const CUSTOMER_ID = 'wedosigns';

const ssm = new SSMClient({ region: AWS_REGION });

async function getSSM(name) {
  const cmd = new GetParameterCommand({ Name: name, WithDecryption: true });
  const res = await ssm.send(cmd);
  return res.Parameter.Value;
}

// ── Helpers ──
function wpAuth(username, appPassword) {
  return 'Basic ' + Buffer.from(`${username}:${appPassword}`).toString('base64');
}

async function wpApi(method, endpoint, auth, data = null) {
  const url = `${WP_BASE}/wp-json${endpoint}`;
  const config = {
    method,
    url,
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    timeout: 30000,
  };
  if (data) config.data = data;
  const res = await axios(config);
  return res.data;
}

async function dashboardApi(method, endpoint, apiKey, data = null) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    method,
    url,
    headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
    httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
    timeout: 30000,
  };
  if (data) config.data = data;
  const res = await axios(config);
  return res.data;
}

// ── Steg 1: Hämta credentials ──
async function getCredentials() {
  console.log('\n=== STEG 1: Hämtar credentials från SSM ===');
  const [wpUrl, wpUser, wpPass, apiKey] = await Promise.all([
    getSSM('/seo-mcp/wordpress/wedosigns/url'),
    getSSM('/seo-mcp/wordpress/wedosigns/username'),
    getSSM('/seo-mcp/wordpress/wedosigns/app-password'),
    getSSM('/seo-mcp/dashboard/api-key'),
  ]);
  console.log(`  WP URL: ${wpUrl}`);
  console.log(`  WP User: ${wpUser}`);
  console.log(`  API Key: ${apiKey.substring(0, 10)}...`);
  return { wpUrl, wpUser, wpPass, apiKey };
}

// ── Steg 2: Skapa kund i pipeline ──
async function createProspect(apiKey) {
  console.log('\n=== STEG 2: Skapar kund i pipeline ===');
  try {
    const res = await dashboardApi('POST', '/api/prospects', apiKey, {
      customer_id: CUSTOMER_ID,
      company_name: 'Wedo Signs AB',
      website: 'https://wedosigns.se',
      contact_person: 'Danni Andersen',
      contact_email: 'info@wedosigns.se',
      contact_phone: '+46793020787',
      stage: 'active',
      monthly_budget: 5000,
      budget_tier: 'basic',
      notes: 'Skyltföretag i Göteborg. Rank Math Pro, Divi-tema. Onboardad 2026-03-08.'
    });
    console.log('  Kund skapad:', JSON.stringify(res).substring(0, 200));
  } catch (e) {
    if (e.response?.status === 409) {
      console.log('  Kund finns redan i pipeline — hoppar över');
    } else {
      console.error('  FEL:', e.message);
    }
  }
}

// ── Steg 3: ABC-nyckelord ──
async function addKeywords(apiKey) {
  console.log('\n=== STEG 3: Lägger in ABC-nyckelord ===');

  const keywords = {
    A: [
      { keyword: 'skyltar göteborg', search_volume: 320 },
      { keyword: 'bildekor göteborg', search_volume: 210 },
      { keyword: 'skyltföretag göteborg', search_volume: 110 },
      { keyword: 'ljusskyltar göteborg', search_volume: 90 },
      { keyword: 'bilfoliering göteborg', search_volume: 60 },
      { keyword: 'skyltning göteborg', search_volume: 50 },
      { keyword: 'bildekor pris', search_volume: 110 },
      { keyword: 'fordonsdekor göteborg', search_volume: 50 },
      { keyword: 'skylttillverkare göteborg', search_volume: 40 },
      { keyword: 'plåtskyltar göteborg', search_volume: 40 },
    ],
    B: [
      { keyword: 'neonskyltar göteborg', search_volume: 40 },
      { keyword: 'foliering göteborg', search_volume: 40 },
      { keyword: 'dekalproduktion göteborg', search_volume: 30 },
      { keyword: 'banderoller göteborg', search_volume: 50 },
      { keyword: 'dekaler göteborg', search_volume: 40 },
      { keyword: 'reklamskylt', search_volume: 40 },
      { keyword: 'skyltbelysning', search_volume: 30 },
      { keyword: 'företagsskyltar', search_volume: 30 },
      { keyword: 'fasadskylt göteborg', search_volume: 30 },
      { keyword: 'bilreklam göteborg', search_volume: 30 },
      { keyword: 'klisterdekor', search_volume: 20 },
    ],
    C: [
      { keyword: 'golvdekor göteborg', search_volume: 20 },
      { keyword: 'solfilm göteborg', search_volume: 70 },
      { keyword: 'insynsskydd kontor', search_volume: 30 },
      { keyword: 'fönsterfolie företag', search_volume: 20 },
      { keyword: 'mässmaterial', search_volume: 30 },
      { keyword: 'roll-ups göteborg', search_volume: 20 },
      { keyword: 'frostat glas folie', search_volume: 20 },
      { keyword: 'bildekor design', search_volume: 20 },
      { keyword: 'namnskyltar dörr', search_volume: 20 },
      { keyword: 'eventmaterial göteborg', search_volume: 20 },
      { keyword: 'klistermärken göteborg', search_volume: 40 },
    ],
  };

  // Skicka i batchar (max 10 per request för att undvika timeout)
  for (const [grade, kws] of Object.entries(keywords)) {
    for (let i = 0; i < kws.length; i += 10) {
      const batch = kws.slice(i, i + 10).map(k => ({
        ...k,
        grade,
        customer_id: CUSTOMER_ID,
      }));
      try {
        await dashboardApi('POST', `/api/customers/${CUSTOMER_ID}/keywords`, apiKey, { keywords: batch });
        console.log(`  ${grade}-nyckelord batch ${Math.floor(i/10)+1}: ${batch.length} st inlagda`);
      } catch (e) {
        console.error(`  FEL ${grade}-batch:`, e.message);
      }
    }
  }
}

// ── Steg 4: 3-månadersplan ──
async function addActionPlan(apiKey) {
  console.log('\n=== STEG 4: Lägger in 3-månadersplan ===');
  const plan = {
    customer_id: CUSTOMER_ID,
    plan_type: 'manual',
    months: [
      {
        month: 1,
        title: 'Grund och lansering',
        tasks: [
          { task: 'Deploya schema mu-plugin (LocalBusiness + Service + FAQ)', priority: 'high', status: 'pending' },
          { task: 'Installera Rank Math Pro + konfigurera', priority: 'high', status: 'pending' },
          { task: 'Meta descriptions för alla 20 sidor', priority: 'high', status: 'pending' },
          { task: 'FAQ-sektioner på 6 tjänstesidor', priority: 'high', status: 'pending' },
          { task: 'Interna länkar mellan tjänstesidor', priority: 'medium', status: 'pending' },
          { task: 'Fixa /print-goteborg-2/ slug → /print-goteborg/', priority: 'medium', status: 'pending' },
          { task: 'Ta bort Hello World-inlägget', priority: 'low', status: 'pending' },
          { task: 'Sätta upp GSC + skicka in sitemap', priority: 'high', status: 'pending' },
          { task: 'Sätta upp GA4 + GTM', priority: 'high', status: 'pending' },
          { task: 'PHP-uppgradering 7.4 → 8.2+', priority: 'high', status: 'pending' },
        ],
      },
      {
        month: 2,
        title: 'Innehåll och optimering',
        tasks: [
          { task: 'Skriv 2 bloggartiklar (skyltguide + bildekor)', priority: 'medium', status: 'pending' },
          { task: 'Optimera bildernas alt-texter', priority: 'high', status: 'pending' },
          { task: 'Skapa referensprojekt-sida med case studies', priority: 'medium', status: 'pending' },
          { task: 'Lägg till säkerhetsheaders (.htaccess)', priority: 'medium', status: 'pending' },
          { task: 'Optimera sidladdningstid (bilder, cache)', priority: 'medium', status: 'pending' },
          { task: 'Google Business Profile — skapa och verifiera', priority: 'high', status: 'pending' },
        ],
      },
      {
        month: 3,
        title: 'Tillväxt och lokal SEO',
        tasks: [
          { task: 'Skriv 2 till bloggartiklar', priority: 'medium', status: 'pending' },
          { task: 'Bygga lokala länkar (Eniro, Hitta.se, kataloger)', priority: 'high', status: 'pending' },
          { task: 'Lägg till prisindikationer på tjänstesidor', priority: 'medium', status: 'pending' },
          { task: 'Skapa områdessidor (Mölndal, Partille, Kungsbacka)', priority: 'medium', status: 'pending' },
          { task: 'Optimera Google Business Profile (bilder, inlägg)', priority: 'medium', status: 'pending' },
          { task: 'Utvärdera GSC-data och justera keywords', priority: 'medium', status: 'pending' },
        ],
      },
    ],
  };

  try {
    await dashboardApi('POST', `/api/customers/${CUSTOMER_ID}/manual-action-plan`, apiKey, plan);
    console.log('  3-månadersplan inlagd');
  } catch (e) {
    console.error('  FEL:', e.message);
  }
}

// ── Steg 5: Deploya mu-plugins ──
async function deployMuPlugins(auth) {
  console.log('\n=== STEG 5: Deployar mu-plugins till WordPress ===');

  const plugins = [
    {
      name: 'sb-wedosigns-schema.php',
      localPath: path.join(__dirname, '..', 'content-pages', 'wedosigns-schema-muplugin.php'),
    },
    {
      name: 'sb-wedosigns-quote-button.php',
      localPath: path.join(__dirname, '..', 'content-pages', 'wedosigns-quote-button-muplugin.php'),
    },
  ];

  for (const plugin of plugins) {
    const content = fs.readFileSync(plugin.localPath, 'utf8');
    console.log(`  ${plugin.name}: ${content.length} tecken`);

    // mu-plugins kan inte installeras via REST API direkt
    // Vi skapar ett temporärt PHP-script som skriver filen
    // Alternativ: använd WP-CLI via SSH
    console.log(`  OBS: mu-plugins måste laddas upp manuellt via FTP/SSH till:`);
    console.log(`    /wp-content/mu-plugins/${plugin.name}`);
  }

  console.log('\n  Alternativ: Kör via SSH:');
  console.log('    scp content-pages/wedosigns-schema-muplugin.php user@wedosigns-host:/wp-content/mu-plugins/sb-wedosigns-schema.php');
  console.log('    scp content-pages/wedosigns-quote-button-muplugin.php user@wedosigns-host:/wp-content/mu-plugins/sb-wedosigns-quote-button.php');
}

// ── Steg 6: Meta descriptions via Rank Math ──
async function setMetaDescriptions(auth) {
  console.log('\n=== STEG 6: Sätter meta descriptions via Rank Math ===');

  const metaDescriptions = {
    'skyltar-goteborg': 'Professionella skyltar i Göteborg. Plåtskyltar, ljusskyltar, flaggskyltar och fasadskyltar med lång livslängd. Begär offert från Wedo Signs.',
    'bildekor-goteborg': 'Bildekor och fordonsfoliering i Göteborg. Helfoliering, delfoliering och bilreklam med 3M-folie. Offert samma dag från Wedo Signs.',
    'banderoller-goteborg': 'Banderoller i Göteborg. PVC- och mesh-banderoller för fasad, event och reklam. Snabb leverans från Wedo Signs.',
    'klistermarken-goteborg': 'Klistermärken i Göteborg. Stickers och dekaler för reklam, produktmärkning och dekoration. Wedo Signs levererar i hela Västra Götaland.',
    'insynsskydd-goteborg': 'Insynsskydd med fönsterfolie i Göteborg. Frostad film, dekorfolie och solfilm för kontor och butik. Wedo Signs monterar.',
    'event-exponering-goteborg': 'Event och exponering i Göteborg. Roll-ups, banderoller, mässmaterial och eventproduktion för företag. Wedo Signs levererar snabbt.',
    'print-goteborg-2': 'Print och tryck i Göteborg. Storformatstryck, affischer, roll-ups och mässmaterial med hög kvalitet. Begär offert från Wedo Signs.',
    'print-goteborg': 'Print och tryck i Göteborg. Storformatstryck, affischer, roll-ups och mässmaterial med hög kvalitet. Begär offert från Wedo Signs.',
    'dekaler-goteborg': 'Beställ dekaler i Göteborg. Företagsdekaler, bildekaler, fönsterdekaler och produktmärkning med hållbar vinylfolie. Begär offert.',
    'platskyltar-goteborg': 'Plåtskyltar i Göteborg. Hållbara skyltar för fasad, entré och vägvisning. Pulverlackerade med lång livslängd. Wedo Signs.',
    'ljusskyltar-goteborg': 'Ljusskyltar i Göteborg. LED-belysta skyltar för fasad och skyltfönster. Energieffektiva med hög synlighet. Wedo Signs.',
    'namnskyltar-goteborg': 'Namnskyltar i Göteborg. Aluminium, akryl och mässing för kontor, dörrar och reception. Wedo Signs levererar snabbt.',
    'flaggskylt-fasad-goteborg': 'Flaggskyltar och fasadskyltar i Göteborg. Dubbelsidig profil för maximal synlighet. Offert från Wedo Signs.',
    'folie-dekor-goteborg': 'Foliedekor i Göteborg. Fönsterfolie, väggdekor och fordonsdekor. Skräddarsydda lösningar från Wedo Signs.',
    'golvdekor-goteborg': 'Golvdekor och golvgrafik i Göteborg. Halkfria laminat för butiker, mässor och kontor. Wedo Signs.',
    'frost-film-goteborg': 'Frostad glasfilm i Göteborg. Frostad glasfilm för insynsskydd och dekoration. Elegant uttryck. Wedo Signs monterar.',
    'solfilm-goteborg': 'Solfilm i Göteborg. Reducerar värme och UV-strålning. Professionell montering av Wedo Signs.',
    'offerter-wedosigns': 'Begär offert från Wedo Signs i Göteborg. Snabb återkoppling på skyltar, bildekor, folie och tryck. Ring 0793-020787.',
    'galleri': 'Se exempel på vårt arbete. Skyltar, bildekor, folieringar och banderoller producerade av Wedo Signs i Göteborg.',
    'om-oss': 'Om Wedo Signs — skyltföretag i Askim, Göteborg. Vi tillverkar skyltar, bildekor, folie och tryck för företag.',
  };

  // Hämta alla sidor
  let allPages = [];
  let page = 1;
  while (true) {
    try {
      const pages = await wpApi('GET', `/wp/v2/pages?per_page=50&page=${page}&_fields=id,slug,title`, auth);
      if (!pages.length) break;
      allPages = allPages.concat(pages);
      page++;
    } catch (e) {
      break;
    }
  }
  console.log(`  Hittade ${allPages.length} sidor`);

  let updated = 0;
  for (const pg of allPages) {
    const desc = metaDescriptions[pg.slug];
    if (!desc) continue;

    try {
      // Rank Math meta sparas som post meta: rank_math_description
      await wpApi('POST', `/wp/v2/pages/${pg.id}`, auth, {
        meta: {
          rank_math_description: desc,
        },
      });
      console.log(`  ✓ ${pg.slug}: "${desc.substring(0, 60)}..."`);
      updated++;
    } catch (e) {
      console.error(`  ✗ ${pg.slug}: ${e.message}`);
    }
  }
  console.log(`  ${updated}/${Object.keys(metaDescriptions).length} meta descriptions uppdaterade`);

  // Startsidan (ID kan vara specialfall)
  try {
    const frontPageId = await getFrontPageId(auth);
    if (frontPageId) {
      await wpApi('POST', `/wp/v2/pages/${frontPageId}`, auth, {
        meta: {
          rank_math_description: 'Wedo Signs — skyltföretag i Göteborg. Plåtskyltar, ljusskyltar, bildekor, folie och banderoller. Begär kostnadsfri offert.',
        },
      });
      console.log('  ✓ Startsida: meta description satt');
    }
  } catch (e) {
    console.error('  ✗ Startsida:', e.message);
  }
}

async function getFrontPageId(auth) {
  try {
    const settings = await wpApi('GET', '/wp/v2/settings', auth);
    return settings.page_on_front || null;
  } catch (e) {
    // Försök hitta via slug
    const pages = await wpApi('GET', '/wp/v2/pages?slug=hem&_fields=id', auth);
    return pages.length ? pages[0].id : null;
  }
}

// ── Steg 7: Installera Rank Math Pro ──
async function upgradeToRankMathPro(auth) {
  console.log('\n=== STEG 7: Rank Math Pro ===');
  console.log('  Rank Math Free är redan installerat.');
  console.log('  För att uppgradera till Pro:');
  console.log('  1. Logga in på wedosigns.se/wp-admin');
  console.log('  2. Rank Math → Dashboard → "Connect Account"');
  console.log('  3. Logga in med Searchboost Rank Math-konto');
  console.log('  4. Klicka "Activate License"');
  console.log('  ');
  console.log('  Alternativt — installera ZIP manuellt:');
  console.log('  1. WP-admin → Plugins → Lägg till ny → Ladda upp plugin');
  console.log('  2. Välj nedladdad Rank Math Pro ZIP-fil');
  console.log('  3. Installera och aktivera');
  console.log('  4. Avaktivera "Rank Math SEO" (Free) om den finns kvar');
}

// ── Steg 8: GSC + GA4 + GTM instruktioner ──
async function setupAnalytics() {
  console.log('\n=== STEG 8: GSC + GA4 + GTM setup ===');

  console.log('\n--- Google Search Console ---');
  console.log('  1. Gå till https://search.google.com/search-console');
  console.log('  2. Klicka "Lägg till egendom" → URL-prefix: https://wedosigns.se');
  console.log('  3. Verifiera via DNS (TXT-post) eller HTML-fil');
  console.log('  4. Efter verifiering: Inställningar → Användare → Lägg till användare:');
  console.log('     Email: seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com');
  console.log('     Behörighet: Fullständig');
  console.log('  5. Spara GSC property i SSM:');
  console.log('     aws ssm put-parameter --name /seo-mcp/integrations/wedosigns/gsc-property \\');
  console.log('       --value "https://wedosigns.se/" --type String --overwrite \\');
  console.log('       --region eu-north-1 --profile "mickedanne@gmail.com"');

  console.log('\n--- Google Analytics 4 ---');
  console.log('  1. Gå till https://analytics.google.com');
  console.log('  2. Admin → Skapa egendom → "Wedo Signs"');
  console.log('  3. Bransch: Marknadsföring, Storlek: Liten');
  console.log('  4. Skapa webdataström → URL: wedosigns.se');
  console.log('  5. Kopiera Measurement ID (G-XXXXXXXXXX)');
  console.log('  6. Aktivera Enhanced Measurements (scroll, outbound clicks, etc.)');

  console.log('\n--- Google Tag Manager ---');
  console.log('  1. Gå till https://tagmanager.google.com');
  console.log('  2. Skapa konto "Wedo Signs" → Container "wedosigns.se" (Web)');
  console.log('  3. Kopiera GTM-ID (GTM-XXXXXXX)');
  console.log('  4. I WP-admin — installera plugin "GTM4WP" eller lägg till i Rank Math:');
  console.log('     Rank Math → General Settings → Webmaster Tools → Google Tag Manager');
  console.log('  5. Importera container-template:');
  console.log('     GTM → Admin → Import Container → välj config/gtm-template.json');
  console.log('  6. Uppdatera variablerna:');
  console.log('     - GA4 Measurement ID');
  console.log('     - (valfritt) Google Ads Conversion ID');
  console.log('     - (valfritt) Meta Pixel ID');

  console.log('\n--- Rank Math + GA4 integration ---');
  console.log('  Rank Math Pro har inbyggd Analytics:');
  console.log('  1. Rank Math → Analytics → Connect Google');
  console.log('  2. Välj Search Console property: wedosigns.se');
  console.log('  3. Välj GA4 property: Wedo Signs');
  console.log('  4. Aktivera "Sync Data"');
}

// ── Steg 9: FAQ-data som custom fields ──
async function setFaqData(auth) {
  console.log('\n=== STEG 9: FAQ custom fields (sb_faq_data) ===');

  const faqData = {
    'skyltar-goteborg': [
      { q: 'Hur lång tid tar det att få en skylt tillverkad?', a: 'Leveranstiden beror på skylttyp och storlek. Enklare plåtskyltar tar normalt 5-7 arbetsdagar, medan ljusskyltar och specialtillverkade fasadskyltar kan ta 2-4 veckor.' },
      { q: 'Vad kostar det att beställa en skylt?', a: 'Priset varierar beroende på material, storlek och typ. En enkel plåtskylt börjar runt 2 000 kr, medan en ljusskylt med LED kan kosta från 8 000 kr. Begär kostnadsfri offert.' },
      { q: 'Vilka material använder ni för skyltar?', a: 'Vi arbetar med aluminium, akryl, plåt, trä, PVC och kompositmaterial. Valet beror på placering och önskad livslängd.' },
      { q: 'Behöver jag bygglov för en skylt?', a: 'I Göteborg krävs normalt bygglov för ljusskyltar och skyltning utanpå fasader. Vi hjälper till att bedöma om din skylt kräver tillstånd.' },
      { q: 'Monterar ni skyltarna också?', a: 'Ja, vi erbjuder komplett montering i hela Göteborgsområdet, från enkla dörrskyltar till stora fasadskyltar.' },
    ],
    'bildekor-goteborg': [
      { q: 'Hur länge håller bildekor?', a: 'Bildekor i premium vinylfolie håller normalt 5-7 år utomhus. Vi använder 3M och Avery Dennison som standard.' },
      { q: 'Kan man tvätta bilen med bildekor?', a: 'Ja, men undvik högtryckstvätt direkt på foliernas kanter. Vänta minst 48 timmar efter montering innan första tvätten.' },
      { q: 'Skadar bildekor lacken?', a: 'Nej, professionellt monterad vinylfolie skadar inte lacken. Den skyddar tvärtom mot stenskott och UV-strålning.' },
      { q: 'Vad kostar bildekor för en skåpbil?', a: 'En komplett foliering med logotyp och kontaktuppgifter kostar normalt 8 000-15 000 kr. Enkel text börjar runt 4 000 kr.' },
      { q: 'Hur lång tid tar montering av bildekor?', a: 'En skåpbil med text och logotyp tar normalt en arbetsdag. En helfoliering kan ta 2-3 dagar.' },
    ],
    'ljusskyltar-goteborg': [
      { q: 'Vilka typer av ljusskyltar erbjuder ni?', a: 'Vi tillverkar LED-ljuslådor, bokstavsarmatur med bakgrundsbelysning, neonskyltning och belysta plexiglasskyltar. Alla använder energieffektiv LED.' },
      { q: 'Vad kostar en ljusskylt?', a: 'En enkel LED-ljuslåda börjar runt 8 000 kr. Individuella bokstäver med bakgrundsbelysning kostar från 15 000 kr.' },
      { q: 'Hur mycket el drar en ljusskylt?', a: 'Moderna LED-ljusskyltar drar ofta under 100W. Driftkostnaden ligger typiskt på 200-500 kr per år.' },
      { q: 'Krävs bygglov för ljusskyltar i Göteborg?', a: 'Ja, i de flesta fall. Vi hjälper till med underlag och mått för ansökan hos Stadsbyggnadskontoret.' },
      { q: 'Hur länge håller LED-belysningen?', a: 'LED-moduler har en livslängd på 50 000-100 000 timmar, motsvarande 10-20 år. Vi ger 3-5 års garanti.' },
    ],
    'folie-dekor-goteborg': [
      { q: 'Vad kan man använda foliedekor till?', a: 'Foliedekor används för fönsterdekor, väggdekor, skyltning, fordon, butiksinredning och evenemang — i princip alla släta ytor.' },
      { q: 'Hur länge håller fönsterfolie?', a: 'Fönsterfolie inomhus håller 8-10 år. Folie utomhus håller normalt 5-7 år beroende på väderexponering.' },
      { q: 'Kan man ta bort foliedekor utan att skada ytan?', a: 'Ja, vinylfolie kan tas bort utan att skada glas, lack eller målade ytor. Limrester avlägsnas enkelt.' },
      { q: 'Vilka typer av folie finns?', a: 'Vi arbetar med klarglas, frostat, färgat, perforerat (one-way vision), reflekterande och holografisk folie.' },
      { q: 'Monterar ni foliedekor hos oss?', a: 'Ja, vi monterar på plats i hela Göteborgsområdet. Montering inkluderas ofta i priset vid större projekt.' },
    ],
    'banderoller-goteborg': [
      { q: 'Vilka material används för banderoller?', a: 'Vi producerar banderoller i PVC (vädersäkert), mesh (vindgenomsläppligt) och tyg (elegant för inomhus).' },
      { q: 'Hur stort kan en banderoll bli?', a: 'Vi producerar banderoller upp till 5 meter breda i ett stycke. Större storlekar svetsas ihop sömlöst.' },
      { q: 'Vad kostar en banderoll?', a: 'En standard PVC-banderoll (1x3 meter) med fullfärgstryck kostar runt 800-1 200 kr.' },
      { q: 'Hur snabbt kan ni leverera banderoller?', a: 'Standardleverans 3-5 arbetsdagar. Expressproduktion 1-2 dagar finns mot tillägg.' },
      { q: 'Kan ni montera banderollen åt oss?', a: 'Ja, vi monterar på fasader, staket, byggnadsställningar och eventplatser med öljetter och fästen.' },
    ],
    'dekaler-goteborg': [
      { q: 'Hur länge håller en dekal utomhus?', a: 'Dekaler i premium vinylfolie håller normalt 5-7 år utomhus. Inomhus håller de 8-10 år.' },
      { q: 'Kan man ta bort dekaler utan att skada ytan?', a: 'Ja, professionella vinyldekaler kan tas bort utan att skada lack, glas eller målade ytor.' },
      { q: 'Kan ni producera dekaler i specialformer?', a: 'Ja, vi skär dekaler i valfri form med CNC-skärare. Inga begränsningar på form.' },
      { q: 'Hur snabbt kan ni leverera?', a: 'Standardleverans 3-5 arbetsdagar. Expressproduktion 1-2 dagar finns vid brådskande beställningar.' },
      { q: 'Monterar ni dekaler åt oss?', a: 'Ja, vi monterar dekaler på fordon, fönster, väggar och andra ytor i hela Göteborgsområdet.' },
    ],
  };

  // Hämta alla sidor
  let allPages = [];
  let page = 1;
  while (true) {
    try {
      const pages = await wpApi('GET', `/wp/v2/pages?per_page=50&page=${page}&_fields=id,slug`, auth);
      if (!pages.length) break;
      allPages = allPages.concat(pages);
      page++;
    } catch (e) {
      break;
    }
  }

  let updated = 0;
  for (const pg of allPages) {
    const faq = faqData[pg.slug];
    if (!faq) continue;

    try {
      await wpApi('POST', `/wp/v2/pages/${pg.id}`, auth, {
        meta: {
          sb_faq_data: JSON.stringify(faq),
        },
      });
      console.log(`  ✓ ${pg.slug}: ${faq.length} FAQ-frågor`);
      updated++;
    } catch (e) {
      console.error(`  ✗ ${pg.slug}: ${e.message}`);
    }
  }
  console.log(`  ${updated}/${Object.keys(faqData).length} sidor uppdaterade med FAQ-data`);
}

// ── MAIN ──
async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  WEDOSIGNS ONBOARDING — Searchboost Opti    ║');
  console.log('║  Datum: 2026-03-08                          ║');
  console.log('╚══════════════════════════════════════════════╝');

  try {
    // Steg 1: Credentials
    const creds = await getCredentials();
    const auth = wpAuth(creds.wpUser, creds.wpPass);

    // Verifiera WP-access
    console.log('\n  Testar WP-access...');
    const me = await wpApi('GET', '/wp/v2/users/me', auth);
    console.log(`  ✓ Inloggad som: ${me.name} (${me.slug})`);

    // Steg 2-4: Dashboard API (pipeline + keywords + action plan)
    await createProspect(creds.apiKey);
    await addKeywords(creds.apiKey);
    await addActionPlan(creds.apiKey);

    // Steg 5: mu-plugins (instruktioner)
    await deployMuPlugins(auth);

    // Steg 6: Meta descriptions
    await setMetaDescriptions(auth);

    // Steg 7: Rank Math Pro
    await upgradeToRankMathPro(auth);

    // Steg 8: Analytics setup instruktioner
    await setupAnalytics();

    // Steg 9: FAQ custom fields
    await setFaqData(auth);

    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║  ONBOARDING KLAR                             ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('\nManuella steg kvar:');
    console.log('  1. Installera Rank Math Pro (ZIP via WP-admin)');
    console.log('  2. Ladda upp mu-plugins via FTP/SSH');
    console.log('  3. Sätta upp GSC (verifiera + lägg till SA)');
    console.log('  4. Skapa GA4 property + GTM container');
    console.log('  5. PHP-uppgradering 7.4 → 8.2+ (hosting)');
    console.log('  6. Google Business Profile');

  } catch (e) {
    console.error('\nFATALT FEL:', e.message);
    if (e.response) {
      console.error('  Status:', e.response.status);
      console.error('  Data:', JSON.stringify(e.response.data).substring(0, 500));
    }
    process.exit(1);
  }
}

main();
