/**
 * fetch-eduadmin-data.js
 * 
 * Fetches ALL data from EduAdmin OData API for Kompetensutveckla
 * and saves as JSON files locally.
 * 
 * Usage: node scripts/fetch-eduadmin-data.js
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'kompetensutveckla');

const AUTH_URL = 'https://api.eduadmin.se/token';
const BASE_URL = 'https://api.eduadmin.se/v1/odata';

const AUTH_BODY = 'username=e653e65e49a6e79f&password=46eab736e0ec42449c01c4c73745356c&grant_type=password';

// ---- Auth ----

async function getToken() {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: AUTH_BODY,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  console.log(`Authenticated. Token expires in ${data.expires_in}s`);
  return data.access_token;
}

// ---- OData fetcher with proper URL encoding ----

async function odataGet(token, pathWithQuery) {
  // Split entity path from query string
  const qIndex = pathWithQuery.indexOf('?');
  let url;

  if (qIndex === -1) {
    url = `${BASE_URL}/${pathWithQuery}`;
  } else {
    const entity = pathWithQuery.substring(0, qIndex);
    const queryString = pathWithQuery.substring(qIndex + 1);

    // Parse and re-encode query params properly
    const params = new URLSearchParams();
    const pairs = queryString.split('&');
    for (const pair of pairs) {
      const eqIndex = pair.indexOf('=');
      if (eqIndex === -1) continue;
      const key = pair.substring(0, eqIndex);
      const value = pair.substring(eqIndex + 1);
      params.set(key, value);
    }

    url = `${BASE_URL}/${entity}?${params.toString()}`;
  }

  console.log(`  GET ${url.replace(BASE_URL, '...')}`);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OData request failed (${res.status}): ${text.substring(0, 500)}`);
  }

  const data = await res.json();
  return data.value || data;
}

// ---- Save helper ----

function saveJson(filename, data) {
  const filePath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  const count = Array.isArray(data) ? data.length : 1;
  console.log(`  Saved ${filename} (${count} records, ${(fs.statSync(filePath).size / 1024).toFixed(1)} KB)`);
  return count;
}

// ---- Sleep helper for rate limiting ----

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---- Main ----

async function main() {
  console.log('=== EduAdmin Data Fetcher for Kompetensutveckla ===\n');

  // Ensure output dir exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1. Authenticate
  console.log('1. Authenticating...');
  const token = await getToken();
  console.log('');

  const summary = {};

  // 2. Categories
  console.log('2. Fetching categories...');
  const categories = await odataGet(token, 'Categories?$orderby=CategoryName');
  summary.categories = saveJson('categories.json', categories);
  console.log('');

  // 3. Course Templates (basic)
  console.log('3. Fetching course templates...');
  const courseTemplates = await odataGet(token, 'CourseTemplates?$expand=PriceNames&$orderby=CourseName');
  summary.courseTemplates = saveJson('course-templates.json', courseTemplates);
  console.log('');

  // 4. Course Templates (full - individual fetch for each)
  console.log(`4. Fetching full course template details (${courseTemplates.length} templates)...`);
  const courseTemplatesFull = [];
  let fetchErrors = 0;

  for (let i = 0; i < courseTemplates.length; i++) {
    const ct = courseTemplates[i];
    const id = ct.CourseTemplateId;
    try {
      if (i > 0 && i % 10 === 0) {
        console.log(`     ... ${i}/${courseTemplates.length} done`);
      }
      const full = await odataGet(token, `CourseTemplates(${id})?$expand=PriceNames`);
      courseTemplatesFull.push(full);
      // Small delay to avoid rate limiting
      if (i % 5 === 0) await sleep(200);
    } catch (err) {
      fetchErrors++;
      console.log(`     Error fetching CourseTemplate ${id}: ${err.message.substring(0, 100)}`);
      courseTemplatesFull.push(ct);
    }
  }

  summary.courseTemplatesFull = saveJson('course-templates-full.json', courseTemplatesFull);
  if (fetchErrors > 0) console.log(`  (${fetchErrors} fetch errors, used basic data as fallback)`);
  console.log('');

  // 5. Events (all shown on web)
  console.log('5. Fetching events (ShowOnWeb)...');
  const events = await odataGet(token, 'Events?$filter=ShowOnWeb eq true&$expand=PriceNames&$orderby=StartDate&$top=1000');
  summary.events = saveJson('events.json', events);
  console.log('');

  // 6. On-demand events
  console.log('6. Fetching on-demand events...');
  const onDemand = await odataGet(token, 'Events?$filter=OnDemand eq true and ShowOnWeb eq true&$expand=PriceNames&$orderby=EventName');
  summary.onDemand = saveJson('on-demand.json', onDemand);
  console.log('');

  // 7. Bookings (last 90 days)
  console.log('7. Fetching bookings (last 90 days)...');
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const bookings = await odataGet(token, `Bookings?$filter=BookingDate gt ${ninetyDaysAgo}&$orderby=BookingDate desc&$top=1000`);
  summary.bookings90d = saveJson('bookings-90d.json', bookings);
  console.log('');

  // 8. Locations (orderby City - LocationName does not exist)
  console.log('8. Fetching locations...');
  const locations = await odataGet(token, 'Locations?$orderby=City');
  summary.locations = saveJson('locations.json', locations);
  console.log('');

  // 9. Personnel (orderby Name - LastName does not exist)
  console.log('9. Fetching personnel...');
  const personnel = await odataGet(token, 'Personnel?$orderby=Name');
  summary.personnel = saveJson('personnel.json', personnel);
  console.log('');

  // Summary
  console.log('=== SUMMARY ===');
  console.log('');
  console.log(`  Categories:              ${summary.categories}`);
  console.log(`  Course Templates:        ${summary.courseTemplates}`);
  console.log(`  Course Templates (full): ${summary.courseTemplatesFull}`);
  console.log(`  Events (ShowOnWeb):      ${summary.events}`);
  console.log(`  On-Demand Events:        ${summary.onDemand}`);
  console.log(`  Bookings (90d):          ${summary.bookings90d}`);
  console.log(`  Locations:               ${summary.locations}`);
  console.log(`  Personnel:               ${summary.personnel}`);
  console.log('');
  console.log(`  Output directory: ${OUTPUT_DIR}`);
  console.log('');
  console.log('Done!');
}

main().catch(err => {
  console.error('\nFATAL ERROR:', err.message);
  process.exit(1);
});
