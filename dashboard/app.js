// Searchboost Opti — Dashboard App
// Connects to MCP server API on EC2

const API_BASE = '';
const VALID_USERS = ['-wum12h', 'cyt5oy', '-hjo1a']; // mikael.searchboost@gmail.com, web.searchboost@gmail.com, searchboost.web@gmail.com
// Per-user password hashes (user hash → password hash)
const USER_PW = {
  '-wum12h': '-9pkod',  // mikael.searchboost@gmail.com → Opti0195
  'cyt5oy':  '-9pkod',  // web.searchboost@gmail.com → Opti0195
  '-hjo1a':  '-9pkod'   // searchboost.web@gmail.com → Opti0195
};
const API_KEY = 'sb-api-41bbf2ec7d8a17973d7b7ebcac07aafab9aa777feb08ce78';

// ── Role mapping ─────────────────────────────────────────────
const USER_ROLES = {
  '-wum12h': { role: 'sales', name: 'Mikael', title: 'Konsult', defaultView: 'pipeline' },
  'cyt5oy':  { role: 'sales', name: 'Mikael', title: 'Konsult', defaultView: 'pipeline' },
  '-hjo1a':  { role: 'tech',  name: 'Viktor', title: 'Tekniker', defaultView: 'overview' }
};

function getCurrentRole() {
  return sessionStorage.getItem('opti_role') || 'sales';
}
function getCurrentUser() {
  return sessionStorage.getItem('opti_user') || 'Mikael';
}
function isTech() { return getCurrentRole() === 'tech'; }
function isSales() { return getCurrentRole() === 'sales'; }

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Module-level state
let _previousView = 'overview';
let _allCustomers = [];
let _allPipelineData = null;
let _onboardingData = [];
let _currentCustomerPipeline = null;

// ── Frontend cache for API responses ──
const _apiCache = {};
const API_CACHE_TTL = 60000; // 1 min — GET-requests cachas automatiskt

function invalidateCache(pattern) {
  for (const key of Object.keys(_apiCache)) {
    if (!pattern || key.includes(pattern)) delete _apiCache[key];
  }
}

// ── Auth ──────────────────────────────────────────────────────
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

function doLogin() {
  const user = document.getElementById('loginUsername').value.trim().toLowerCase();
  const pw = document.getElementById('loginPassword').value;
  if (!user || !pw) return;
  const userHash = simpleHash(user);
  const pwHash = simpleHash(pw);
  const expectedPw = USER_PW[userHash];
  if (VALID_USERS.includes(userHash) && expectedPw && pwHash === expectedPw) {
    const profile = USER_ROLES[userHash] || { role: 'sales', name: user.split('@')[0], title: 'Anvandare', defaultView: 'overview' };
    sessionStorage.setItem('opti_auth', '1');
    sessionStorage.setItem('opti_role', profile.role);
    sessionStorage.setItem('opti_user', profile.name);
    sessionStorage.setItem('opti_default_view', profile.defaultView);
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('appShell').style.display = 'block';
    applyRoleUI();
    // Navigate to role's default view
    navigateToView(profile.defaultView);
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
}

function doLogout() {
  sessionStorage.removeItem('opti_auth');
  document.getElementById('appShell').style.display = 'none';
  document.getElementById('loginOverlay').style.display = '';
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').style.display = 'none';
}

// ── Role-based UI ────────────────────────────────────────────
function applyRoleUI() {
  const role = getCurrentRole();
  const userName = getCurrentUser();
  document.body.setAttribute('data-role', role);

  // Show user name + role in header
  const statusText = $('#status-text');
  if (statusText) {
    statusText.textContent = `${userName}`;
  }

  // Role badge in header
  let roleBadge = $('#role-badge');
  if (!roleBadge) {
    roleBadge = document.createElement('span');
    roleBadge.id = 'role-badge';
    roleBadge.className = 'role-badge';
    const headerStatus = $('.header-status');
    if (headerStatus) headerStatus.insertBefore(roleBadge, headerStatus.firstChild);
  }
  roleBadge.textContent = role === 'tech' ? 'Tekniker' : 'Konsult';
  roleBadge.className = `role-badge role-badge--${role}`;

  // Adjust nav visibility
  $$('.nav-link').forEach(link => {
    const view = link.dataset.view;
    // Show/hide sales-only nav items
    if (link.classList.contains('nav-sales-only')) {
      link.style.display = (role === 'sales') ? '' : 'none';
    }
    if (role === 'sales') {
      link.classList.toggle('nav-primary', view === 'consulting');
    } else {
      link.classList.toggle('nav-primary', view === 'queue' || view === 'optimizations');
    }
  });

  // Filter tech view: hide consulting customers from pipeline/overview
  if (role === 'tech') {
    document.body.classList.add('hide-consulting');
  } else {
    document.body.classList.remove('hide-consulting');
  }
}

// ── Consulting tab functions ─────────────────────────────────
function toggleConsultForm() {
  const form = $('#consult-form');
  if (form) form.style.display = form.style.display === 'none' ? '' : 'none';
}

async function loadConsulting() {
  const pipeData = await api('/api/pipeline');
  const pipeline = pipeData?.pipeline || [];
  // Filter consulting customers (tagged with is_consulting=true or notes contains [KONSULT])
  const consultCustomers = pipeline.filter(c =>
    c.is_consulting === true || c.is_consulting === 'true' ||
    (c.notes && c.notes.includes('[KONSULT]'))
  );

  // Stats
  const count = consultCustomers.length;
  const mrr = consultCustomers.reduce((sum, c) => sum + (parseFloat(c.monthly_budget) || 0), 0);
  $('#consult-stat-count').textContent = count;
  $('#consult-stat-mrr').textContent = mrr > 0 ? mrr.toLocaleString('sv-SE') : '0';

  // Optimization count for consulting customers
  const opts = await api('/api/optimizations');
  const consultIds = consultCustomers.map(c => c.customer_id);
  const consultOpts = (opts?.optimizations || []).filter(o => consultIds.includes(o.customer_id));
  $('#consult-stat-opts').textContent = consultOpts.length;

  // Render customer list
  const listEl = $('#consult-customer-list');
  if (consultCustomers.length === 0) {
    listEl.innerHTML = '<p class="empty">Inga konsultkunder annu. Klicka "+ Ny konsultkund" for att lagga till.</p>';
    return;
  }

  listEl.innerHTML = consultCustomers.map(c => {
    const domain = (c.website || '').replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    const displayName = c.company_name || domain;
    const budget = c.monthly_budget ? `${parseInt(c.monthly_budget).toLocaleString('sv-SE')} kr/man` : '';
    const stageColors = {
      prospect: '#eab308', audit: '#f97316', proposal: '#a855f7',
      contract: '#3b82f6', onboarding: '#06b6d4', active: '#22c55e'
    };
    const color = stageColors[c.stage] || '#888';
    return `
      <div class="list-item" style="cursor:pointer;border-left:3px solid ${color}" onclick="showCustomerDetail('${c.customer_id}','${c.website || ''}')">
        <div class="list-item-left">
          <div class="list-item-title">${displayName}</div>
          <div class="list-item-sub">${domain} ${budget ? '&middot; ' + budget : ''}</div>
        </div>
        <div class="list-item-right">
          <span class="tag" style="background:${color}20;color:${color};border:1px solid ${color}40">${c.stage || 'prospect'}</span>
        </div>
      </div>`;
  }).join('');
}

async function saveConsultCustomer() {
  const company = $('#cf-company').value.trim();
  const website = $('#cf-website').value.trim();
  if (!company || !website) return alert('Foretag och webbplats kravs');

  const contact = $('#cf-contact').value.trim();
  const email = $('#cf-email').value.trim();
  const budget = $('#cf-budget').value;
  const reportEmail = $('#cf-report-email').value.trim();
  const notes = $('#cf-notes').value.trim();

  const statusEl = $('#consult-save-status');
  statusEl.textContent = 'Sparar...';
  statusEl.style.color = '#888';

  // Save as prospect with [KONSULT] tag in notes
  const consultNote = `[KONSULT] rapport-mail:${reportEmail || 'ej satt'}\n${notes}`;
  const result = await api('/api/prospects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      company_name: company,
      website: website.startsWith('http') ? website : 'https://' + website,
      contact_person: contact,
      contact_email: email,
      monthly_budget: parseInt(budget) || 5000,
      notes: consultNote,
      salesperson: getCurrentUser()
    })
  });

  if (result) {
    statusEl.textContent = 'Sparad!';
    statusEl.style.color = '#22c55e';
    toggleConsultForm();
    // Clear form
    ['cf-company','cf-website','cf-contact','cf-email','cf-notes'].forEach(id => { const el = $(`#${id}`); if (el) el.value = ''; });
    invalidateCache('pipeline');
    loadConsulting();
  } else {
    statusEl.textContent = 'Fel vid sparning';
    statusEl.style.color = '#ef4444';
  }
}

function navigateToView(viewName) {
  $$('.nav-link').forEach(l => l.classList.remove('active'));
  const targetLink = $(`.nav-link[data-view="${viewName}"]`);
  if (targetLink) targetLink.classList.add('active');
  $$('.view').forEach(v => v.classList.remove('active'));
  const targetView = $(`#view-${viewName}`);
  if (targetView) targetView.classList.add('active');
  loadView(viewName);
}

// Auto-login if session exists
(function() {
  if (sessionStorage.getItem('opti_auth') === '1') {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('appShell').style.display = 'block';
    applyRoleUI();
  }
})();

// ── Navigation ────────────────────────────────────────────────
$$('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const view = link.dataset.view;
    $$('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    $$('.view').forEach(v => v.classList.remove('active'));
    $(`#view-${view}`).classList.add('active');
    loadView(view);
  });
});

// ── API Fetch with error handling + auto-cache on GET ─────────
async function api(endpoint, options) {
  try {
    const isGet = !options || (!options.method || options.method === 'GET');

    // Cache GET requests (1 min TTL)
    if (isGet) {
      const now = Date.now();
      const cached = _apiCache[endpoint];
      if (cached && (now - cached.ts) < API_CACHE_TTL) {
        return cached.data;
      }
    }

    // Lägg till API-nyckel i alla requests
    if (!options) options = {};
    if (!options.headers) options.headers = {};
    options.headers['X-Api-Key'] = API_KEY;
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();

    // Cache GET responses
    if (isGet) {
      _apiCache[endpoint] = { data, ts: Date.now() };
    } else {
      // POST/PUT → invalidate related caches
      invalidateCache(endpoint.split('/').slice(0, 4).join('/'));
    }

    return data;
  } catch (err) {
    console.error(`API error (${endpoint}):`, err);
    return null;
  }
}

// ── Time formatting ───────────────────────────────────────────
function timeAgo(dateInput) {
  // Handle BigQuery timestamp objects {value: "2026-02-12T..."} and plain strings
  const dateStr = dateInput?.value || dateInput;
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff)) return '—';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just nu';
  if (mins < 60) return `${mins}m sedan`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h sedan`;
  const days = Math.floor(hours / 24);
  return `${days}d sedan`;
}

// ── Tag class helper ──────────────────────────────────────────
function typeTag(type) {
  const map = {
    'metadata': 'metadata',
    'internal_links': 'links',
    'faq_schema': 'schema',
    'short_title': 'metadata',
    'long_title': 'metadata',
    'no_internal_links': 'links',
    'thin_content': 'content',
    'no_schema': 'schema',
    'missing_h1': 'content',
    'missing_alt_text': 'content'
  };
  return map[type] || 'content';
}

// ── Tydliga svenska namn för SEO-uppgifter ──────────────────
function formatTaskType(type) {
  const names = {
    'short_title': 'Förlängde titel',
    'long_title': 'Kortade ner titel',
    'thin_content': 'Utökade innehåll',
    'missing_h1': 'La till H1-rubrik',
    'no_internal_links': 'La till interna länkar',
    'missing_alt_text': 'La till alt-text på bilder',
    'no_schema': 'La till schema markup',
    'metadata': 'Optimerade metadata',
    'title': 'Optimerade sidtitel',
    'description': 'Skrev meta-beskrivning',
    'faq_schema': 'La till FAQ-schema',
    'internal_links': 'Förbättrade intern länkning',
    'content': 'Innehållsoptimering',
    'schema': 'La till schema markup',
    'technical': 'Teknisk SEO-fix',
    'manual': 'Manuell åtgärd'
  };
  return names[type] || type?.replace(/_/g, ' ') || 'SEO-optimering';
}

// ── Beskrivning av väntande uppgifter (kö-vy) ──────────────
function formatQueueTask(type) {
  const names = {
    'short_title': 'Förläng titel (för kort)',
    'long_title': 'Korta ner titel (för lång)',
    'thin_content': 'Utöka innehåll (för tunt)',
    'missing_h1': 'Lägg till H1-rubrik',
    'no_internal_links': 'Lägg till interna länkar',
    'missing_alt_text': 'Lägg till alt-text på bilder',
    'no_schema': 'Lägg till schema markup',
    'metadata': 'Optimera metadata',
    'title': 'Optimera sidtitel',
    'description': 'Skriv meta-beskrivning',
    'faq_schema': 'Lägg till FAQ-schema',
    'internal_links': 'Förbättra intern länkning',
    'content': 'Optimera innehåll',
    'schema': 'Lägg till schema markup',
    'technical': 'Teknisk SEO-fix',
    'manual': 'Manuell åtgärd'
  };
  return names[type] || type?.replace(/_/g, ' ') || 'SEO-uppgift';
}

function severityTag(priority) {
  if (priority >= 6) return 'high';
  if (priority >= 3) return 'medium';
  return 'low';
}

// ── Load views ────────────────────────────────────────────────

async function loadOverview() {
  const [customers, optimizations, queue] = await Promise.all([
    api('/api/customers'),
    api('/api/optimizations'),
    api('/api/queue')
  ]);

  // Update stats with trend indicators
  const custCount = customers?.customers?.length || 0;
  const optCount = optimizations?.optimizations?.length || 0;
  const queueCount = queue?.queue?.length || 0;

  $('#stat-customers').textContent = custCount;
  $('#stat-optimizations').textContent = optCount;
  $('#stat-queue').textContent = queueCount;

  // Add trend badges
  if (optCount > 0) {
    const trendEl = document.createElement('div');
    trendEl.className = 'stat-trend stat-trend--up';
    trendEl.innerHTML = '&#x2191; aktiv';
    const optCard = $('#stat-optimizations').closest('.stat-card');
    if (optCard && !optCard.querySelector('.stat-trend')) optCard.appendChild(trendEl);
  }

  // Load pipeline MRR for overview
  const pipeData = await api('/api/pipeline');
  const mrr = pipeData?.summary?.mrr || 0;
  $('#stat-score').textContent = mrr > 0 ? mrr.toLocaleString('sv-SE') : '—';
  // Update label
  const scoreLabel = $('#stat-score')?.closest('.stat-card')?.querySelector('.stat-label');
  if (scoreLabel && mrr > 0) scoreLabel.textContent = 'MRR (kr)';

  // Update status
  const dot = $('.status-dot');
  const statusText = $('#status-text');
  if (customers) {
    dot.classList.add('connected');
    dot.classList.remove('error');
    statusText.textContent = getCurrentUser();
  } else {
    dot.classList.add('error');
    dot.classList.remove('connected');
    statusText.textContent = 'Offline';
  }

  // ── Role-specific overview cards ──
  const salesSummary = $('#sales-summary');
  const systemHealth = $('#system-health');

  if (isSales() && salesSummary) {
    salesSummary.style.display = '';
    if (systemHealth) systemHealth.style.display = 'none';
    // Pipeline counts
    const pipeline = pipeData?.pipeline || [];
    const inPipeline = pipeline.filter(p => ['prospect','audit','proposal'].includes(p.stage)).length;
    const proposals = pipeline.filter(p => p.stage === 'proposal').length;
    const active = pipeline.filter(p => p.stage === 'active').length;
    const total = pipeline.length;
    const convRate = total > 0 ? Math.round((active / total) * 100) : 0;
    $('#sales-pipeline-count').textContent = inPipeline;
    $('#sales-proposals').textContent = proposals;
    $('#sales-conversion').textContent = convRate + '%';
  } else if (isTech() && systemHealth) {
    systemHealth.style.display = '';
    if (salesSummary) salesSummary.style.display = 'none';
    // Queue health
    $('#health-queue-val').textContent = queueCount;
    // Error count from optimizations
    const errors = optimizations?.optimizations?.filter(o => o.status === 'error')?.length || 0;
    const healthErrorCard = $('#health-errors');
    if (errors > 0) {
      healthErrorCard?.classList.remove('health-card--ok');
      healthErrorCard?.classList.add('health-card--warn');
      $('#health-errors-val').textContent = errors;
      $('#health-errors-sub').textContent = 'Behover undersokas';
    } else {
      healthErrorCard?.classList.remove('health-card--warn');
      healthErrorCard?.classList.add('health-card--ok');
      $('#health-errors-val').textContent = '0';
      $('#health-errors-sub').textContent = 'Inga fel';
    }
    // Lambda last run — check latest optimization timestamp
    if (optimizations?.optimizations?.length > 0) {
      const latest = optimizations.optimizations[0];
      const ts = latest.timestamp?.value || latest.timestamp;
      $('#health-lambda-val').textContent = timeAgo(ts);
      $('#health-lambda-sub').textContent = 'Senaste optimering';
    }
  }

  // Recent optimizations — group by customer for cleaner display
  const recentEl = $('#recent-optimizations');
  if (optimizations?.optimizations?.length > 0) {
    recentEl.innerHTML = optimizations.optimizations.slice(0, 10).map(opt => {
      const domain = (opt.page_url || opt.site_url || '').replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '');
      const shortDomain = domain.split('/')[0];
      return `
      <div class="list-item">
        <div class="list-item-left">
          <div class="list-item-title">${formatTaskType(opt.optimization_type)}</div>
          <div class="list-item-sub">${shortDomain} &middot; ${timeAgo(opt.timestamp)}</div>
        </div>
        <div class="list-item-right">
          <span class="tag tag--${typeTag(opt.optimization_type)}">${CUSTOMER_NAMES[opt.customer_id] || opt.customer_id}</span>
        </div>
      </div>
    `;
    }).join('');
  } else {
    recentEl.innerHTML = '<p class="empty">Inga optimeringar \u00e4n. Systemet startar n\u00e4r WordPress-sites \u00e4r konfigurerade.</p>';
  }

  // Customers (clickable, sorted alphabetically)
  _allCustomers = customers?.customers ? [...customers.customers].sort((a, b) => a.id.localeCompare(b.id, 'sv')) : [];
  renderCustomerList(_allCustomers);
  const searchInput = $('#search-customers');
  if (searchInput && !searchInput.value) searchInput.value = '';

  // Load onboarding status
  loadOnboardingStatus();
}

// Map customer IDs to proper company names
const CUSTOMER_NAMES = {
  'searchboost': 'Searchboost',
  'mobelrondellen': 'M\u00f6belrondellen',
  'phvast': 'Phvast',
  'smalandskontorsmobler': 'Sm\u00e5lands Kontorsm\u00f6bler',
  'kompetensutveckla': 'Kompetensutveckla',
  'ilmonte': 'Il Monte',
  'ferox': 'Ferox Konsult',
  'tobler': 'Tobler',
  'traficator': 'Traficator',
  'wedosigns': 'Wedosigns',
  'nordicsnusonline-com': 'Nordic Snus Online'
};

function getCustomerDisplayName(c) {
  // Use mapped name, or fallback to domain
  if (CUSTOMER_NAMES[c.id]) return CUSTOMER_NAMES[c.id];
  const domain = (c.url || '').replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  return domain || c.id;
}

function renderCustomerList(list) {
  const custEl = $('#customer-list');
  // Sort alphabetically by display name
  const sorted = [...list].sort((a, b) => getCustomerDisplayName(a).localeCompare(getCustomerDisplayName(b), 'sv'));
  if (sorted.length > 0) {
    custEl.innerHTML = sorted.map(c => {
      const name = getCustomerDisplayName(c);
      const initials = name.substring(0, 2).toUpperCase();
      const domain = (c.url || '').replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '');
      return `
        <div class="customer-item customer-item--clickable" onclick="showCustomerDetail('${c.id}', '${c.url}')">
          <div class="customer-avatar">${initials}</div>
          <div class="customer-info">
            <div class="customer-name">${name}</div>
            <div class="customer-url">${domain}</div>
          </div>
          <div class="customer-arrow">&rsaquo;</div>
        </div>
      `;
    }).join('');
  } else {
    custEl.innerHTML = '<p class="empty">Inga kunder hittades.</p>';
  }
}

function filterCustomers(query) {
  const q = query.toLowerCase().trim();
  if (!q) return renderCustomerList(_allCustomers);
  const filtered = _allCustomers.filter(c =>
    c.id.toLowerCase().includes(q) ||
    c.url.toLowerCase().includes(q) ||
    getCustomerDisplayName(c).toLowerCase().includes(q)
  );
  renderCustomerList(filtered);
}

async function loadOptimizations() {
  const data = await api('/api/optimizations');
  const el = $('#all-optimizations');

  if (data?.optimizations?.length > 0) {
    el.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Tid</th>
            <th>Typ</th>
            <th>Site</th>
            <th>Sida</th>
            <th>Av</th>
            <th>Tid (min)</th>
          </tr>
        </thead>
        <tbody>
          ${data.optimizations.map(opt => `
            <tr>
              <td>${timeAgo(opt.timestamp)}</td>
              <td><span class="tag tag--${typeTag(opt.optimization_type)}">${formatTaskType(opt.optimization_type)}</span></td>
              <td>${CUSTOMER_NAMES[opt.customer_id] || opt.site_url || '—'}</td>
              <td>${opt.page_url ? `<a href="${opt.page_url}" target="_blank">${new URL(opt.page_url).pathname}</a>` : '—'}</td>
              <td>${opt.performed_by || '—'}</td>
              <td>${opt.time_spent_minutes ? opt.time_spent_minutes + ' min' : '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else {
    el.innerHTML = '<p class="empty">Inga optimeringar registrerade \u00e4nnu.</p>';
  }
}

async function loadQueue() {
  const data = await api('/api/queue');
  const el = $('#work-queue');

  if (data?.queue?.length > 0) {
    el.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Prioritet</th>
            <th>Typ</th>
            <th>Kund</th>
            <th>Sida</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${data.queue.map(task => `
            <tr>
              <td><span class="tag tag--${severityTag(task.priority)}">${task.priority}</span></td>
              <td><span class="tag tag--${typeTag(task.task_type)}">${formatQueueTask(task.task_type)}</span></td>
              <td>${CUSTOMER_NAMES[task.customer_id] || task.customer_id}</td>
              <td>${task.page_url ? `<a href="${task.page_url}" target="_blank">${new URL(task.page_url).pathname}</a>` : '—'}</td>
              <td><span class="tag tag--${task.status}">${task.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else {
    el.innerHTML = '<p class="empty">Arbetsk\u00f6n \u00e4r tom. K\u00f6r en audit f\u00f6r att fylla den.</p>';
  }
}

async function loadReports() {
  const data = await api('/api/reports');
  const el = $('#reports-list');

  if (data?.reports?.length > 0) {
    el.innerHTML = data.reports.map(report => `
      <div class="report-card">
        <div class="report-header">
          <div class="report-date">${new Date(report.email_sent_at).toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div class="report-meta">${Array.isArray(report.recipient_list) ? report.recipient_list.join(', ') : (report.recipient_list || '—')}</div>
        </div>
        <div class="report-meta">${report.metrics_json ? JSON.parse(report.metrics_json).total + ' optimeringar' : '—'}</div>
      </div>
    `).join('');
  } else {
    el.innerHTML = '<p class="empty">Inga rapporter genererade \u00e4nnu. Rapporten skickas automatiskt varje m\u00e5ndag 08:00.</p>';
  }
}

// ── Pipeline view ─────────────────────────────────────────────

const STAGE_ORDER = [
  { key: 'analys',           label: 'Analys',        color: '#f59e0b', icon: '\uD83D\uDD0D' },
  { key: 'presentation',     label: 'Presentation',  color: '#8b5cf6', icon: '\uD83C\uDFAF' },
  { key: 'forsaljning',      label: 'F\u00F6rs\u00E4ljning',   color: '#ec4899', icon: '\uD83D\uDCB0' },
  { key: 'orderbekraftelse', label: 'Order',          color: '#3b82f6', icon: '\u2705' },
  { key: 'uppstart',         label: 'Uppstart',      color: '#06b6d4', icon: '\uD83D\uDE80' },
  { key: 'atgardsplan',      label: '\u00C5tg\u00E4rdsplan',   color: '#14b8a6', icon: '\uD83D\uDCCB' },
  { key: 'aktiv',            label: 'Aktiv',          color: '#10b981', icon: '\u26A1' },
  { key: 'completed',        label: 'Avslutad',      color: '#6b7280', icon: '\uD83C\uDFC1' }
];

async function loadPipeline() {
  const [data, onboardData] = await Promise.all([
    api('/api/pipeline'),
    api('/api/customers/onboarding-status')
  ]);
  _allPipelineData = data;
  _onboardingData = onboardData?.customers || [];

  // Filter out consulting customers for tech role
  const stages = data?.pipeline || {};
  if (isTech()) {
    for (const key of Object.keys(stages)) {
      if (Array.isArray(stages[key])) {
        stages[key] = stages[key].filter(c =>
          !(c.is_consulting === true || c.is_consulting === 'true' ||
            (c.notes && c.notes.includes('[KONSULT]')))
        );
      }
    }
  }

  // Stats
  const summary = data?.summary || {};
  const inPipeline = (stages.analys || []).length + (stages.presentation || []).length + (stages.forsaljning || []).length;
  $('#pipe-stat-prospects').textContent = inPipeline;
  $('#pipe-stat-active').textContent = summary.active || 0;
  $('#pipe-stat-mrr').textContent = summary.mrr ? summary.mrr.toLocaleString('sv-SE') : '0';
  $('#pipe-stat-total').textContent = summary.total || 0;

  renderPipelineKanban(stages);
  const searchInput = $('#search-pipeline');
  if (searchInput && !searchInput.value) searchInput.value = '';
}

function renderPipelineKanban(stages, filterQuery) {
  const kanban = $('#pipeline-kanban');
  const q = (filterQuery || '').toLowerCase().trim();

  kanban.innerHTML = STAGE_ORDER.map(s => {
    let items = stages[s.key] || [];
    if (q) {
      items = items.filter(c =>
        (c.company_name || '').toLowerCase().includes(q) ||
        (c.customer_id || '').toLowerCase().includes(q) ||
        (c.website_url || '').toLowerCase().includes(q)
      );
    }
    return `
      <div class="kanban-col">
        <div class="kanban-header" style="border-color:${s.color}">
          <span class="kanban-title">${s.label}</span>
          <span class="kanban-count">${items.length}</span>
        </div>
        <div class="kanban-cards">
          ${items.length > 0 ? items.map(c => {
            const daysLeft = c.contract_end_date ? Math.ceil((new Date(c.contract_end_date) - Date.now()) / 86400000) : null;
            const expiryClass = daysLeft !== null && daysLeft < 0 ? 'kanban-card--expired' : daysLeft !== null && daysLeft < 30 ? 'kanban-card--expiring' : '';
            const scoreColor = c.analysis_score >= 70 ? '#10b981' : c.analysis_score >= 40 ? '#f59e0b' : c.analysis_score > 0 ? '#ef4444' : '#666';
            return `
            <div class="kanban-card ${expiryClass}" onclick="showCustomerDetail('${c.customer_id}', '${c.website_url || ''}')">
              <div class="kanban-card-name">${getHealthDot(c.customer_id)} ${CUSTOMER_NAMES[c.customer_id] || c.company_name || c.customer_id}</div>
              <div class="kanban-card-url">${c.website_url ? new URL(c.website_url).hostname : ''}</div>
              <div class="kanban-card-tags">
                ${c.analysis_score ? `<span class="tag" style="background:${scoreColor}22;color:${scoreColor};border-color:${scoreColor}">${c.analysis_score}/100</span>` : ''}
                ${c.cost_estimate_sek ? `<span class="tag tag--schema">${c.cost_estimate_sek.toLocaleString('sv-SE')} kr</span>` : ''}
                ${c.monthly_amount_sek ? `<span class="tag tag--links">${c.monthly_amount_sek.toLocaleString('sv-SE')} kr/mån</span>` : ''}
                ${c.assigned_to_name ? `<span class="tag tag--metadata">${c.assigned_to_name}</span>` : ''}
                ${daysLeft !== null && daysLeft < 30 ? `<span class="tag tag--${daysLeft < 0 ? 'high' : 'medium'}">${daysLeft < 0 ? 'Utgånget' : daysLeft + 'd kvar'}</span>` : ''}
              </div>
            </div>
          `;}).join('') : '<div class="kanban-empty">Inga</div>'}
        </div>
      </div>
    `;
  }).join('');
}

function filterPipeline(query) {
  if (!_allPipelineData?.pipeline) return;
  renderPipelineKanban(_allPipelineData.pipeline, query);
}

// ── Prospect form ────────────────────────────────────────────
function toggleProspectForm() {
  const form = $('#prospect-form');
  form.style.display = form.style.display === 'none' ? '' : 'none';
}

async function saveProspect() {
  const statusEl = $('#prospect-save-status');
  const company = $('#pf-company').value.trim();
  const website = $('#pf-website').value.trim();

  if (!company || !website) {
    statusEl.textContent = 'Företag och webbplats krävs';
    statusEl.className = 'save-status error';
    return;
  }

  statusEl.textContent = 'Sparar...';
  statusEl.className = 'save-status saving';

  const result = await api('/api/prospects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      company_name: company,
      website_url: website.startsWith('http') ? website : 'https://' + website,
      contact_person: $('#pf-contact').value.trim(),
      contact_email: $('#pf-email').value.trim(),
      prospect_notes: $('#pf-notes').value.trim(),
      initial_traffic_trend: $('#pf-trend').value
    })
  });

  if (result?.success) {
    statusEl.textContent = 'Prospect tillagd!';
    statusEl.className = 'save-status saved';
    // Clear form
    $('#pf-company').value = '';
    $('#pf-website').value = '';
    $('#pf-contact').value = '';
    $('#pf-email').value = '';
    $('#pf-notes').value = '';
    $('#pf-trend').value = 'unknown';
    // Hide form after short delay
    setTimeout(() => { $('#prospect-form').style.display = 'none'; statusEl.textContent = ''; }, 1500);
    // Refresh pipeline
    loadPipeline();
  } else {
    statusEl.textContent = result?.error || 'Fel vid sparande';
    statusEl.className = 'save-status error';
  }
}

// ── Stage controls (customer detail) ─────────────────────────
function renderStageControls(customer) {
  const el = $('#detail-stage-controls');
  const currentStage = customer.stage || 'analys';

  el.innerHTML = `
    <div class="stage-row">
      <span class="stage-label">Pipeline:</span>
      ${STAGE_ORDER.map(s => {
        const isCurrent = s.key === currentStage;
        return `<button class="stage-btn ${isCurrent ? 'stage-btn--active' : ''}"
          ${isCurrent ? 'disabled' : ''}
          onclick="changeStage('${customer.customer_id}', '${s.key}')">${s.label}</button>`;
      }).join('')}
    </div>
    <div id="stage-contract-fields" class="stage-contract-fields" style="display:none">
      <div class="form-grid-2" style="margin-top:8px">
        <div><label class="form-label">Tjänstetyp *</label>
          <select id="sc-service" class="form-select">
            <option value="SEO Basic">SEO Basic</option>
            <option value="SEO Standard">SEO Standard</option>
            <option value="SEO Premium">SEO Premium</option>
          </select>
        </div>
        <div><label class="form-label">Månadsbelopp (SEK) *</label><input type="number" id="sc-amount" class="form-input" placeholder="5000"></div>
        <div><label class="form-label">Startdatum *</label><input type="date" id="sc-start" class="form-input"></div>
      </div>
      <div style="margin-top:8px; display:flex; gap:8px; align-items:center">
        <button class="btn-primary" onclick="confirmStageChange()">Bekräfta</button>
        <button class="btn-secondary" onclick="cancelStageChange()">Avbryt</button>
        <span id="stage-save-status" class="save-status"></span>
      </div>
    </div>
  `;
}

let _pendingStageChange = null;

async function changeStage(customerId, newStage) {
  // If moving to orderbekraftelse, show extra fields first
  if (newStage === 'orderbekraftelse' || newStage === 'aktiv') {
    const fields = $('#stage-contract-fields');
    fields.style.display = '';
    _pendingStageChange = { customerId, newStage };
    // Pre-fill start date with today
    const today = new Date().toISOString().slice(0, 10);
    const startInput = $('#sc-start');
    if (startInput && !startInput.value) startInput.value = today;
    return;
  }

  // Direct stage change
  await executeStageChange(customerId, newStage, {});
}

async function confirmStageChange() {
  if (!_pendingStageChange) return;
  const { customerId, newStage } = _pendingStageChange;
  const serviceType = $('#sc-service').value;
  const amount = parseInt($('#sc-amount').value);
  const startDate = $('#sc-start').value;

  if (!amount || !startDate) {
    const statusEl = $('#stage-save-status');
    statusEl.textContent = 'Fyll i belopp och startdatum';
    statusEl.className = 'save-status error';
    return;
  }

  await executeStageChange(customerId, newStage, {
    service_type: serviceType,
    monthly_amount_sek: amount,
    contract_start_date: startDate
  });
}

function cancelStageChange() {
  _pendingStageChange = null;
  const fields = $('#stage-contract-fields');
  if (fields) fields.style.display = 'none';
}

async function executeStageChange(customerId, newStage, extraData) {
  const statusEl = $('#stage-save-status') || document.createElement('span');
  statusEl.textContent = 'Uppdaterar...';
  statusEl.className = 'save-status saving';

  const result = await api(`/api/customers/${customerId}/stage`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage: newStage, ...extraData })
  });

  if (result?.success) {
    statusEl.textContent = 'Uppdaterat!';
    statusEl.className = 'save-status saved';
    _pendingStageChange = null;
    const fields = $('#stage-contract-fields');
    if (fields) fields.style.display = 'none';
    // Refresh customer detail
    const url = $('#detail-url').textContent;
    showCustomerDetail(customerId, url.startsWith('http') ? url : 'https://' + url);
  } else {
    statusEl.textContent = result?.error || 'Fel vid uppdatering';
    statusEl.className = 'save-status error';
  }
}

// ── View router ───────────────────────────────────────────────
async function loadView(view) {
  switch (view) {
    case 'overview': return loadOverview();
    case 'pipeline': return loadPipeline();
    case 'consulting': return loadConsulting();
    case 'optimizations': return loadOptimizations();
    case 'queue': return loadQueue();
    case 'reports': return loadReports();
  }
}

// ── Customer Detail ───────────────────────────────────────────

async function showCustomerDetail(customerId, customerUrl) {
  // Remember where we came from
  const activeNav = $('.nav-link.active');
  _previousView = activeNav?.dataset?.view || 'overview';

  // Switch to detail view
  $$('.nav-link').forEach(l => l.classList.remove('active'));
  $$('.view').forEach(v => v.classList.remove('active'));
  $('#view-customer-detail').classList.add('active');

  const displayName = CUSTOMER_NAMES[customerId] || customerUrl.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  const initials = displayName.substring(0, 2).toUpperCase();
  const domain = customerUrl.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '');

  $('#detail-avatar').textContent = initials;
  $('#detail-name').textContent = displayName;
  $('#detail-url').textContent = domain;
  $('#detail-integrations').innerHTML = '<span class="tag tag--pending">Laddar...</span>';
  $('#detail-stat-opts').textContent = '—';
  $('#detail-stat-queue').textContent = '—';
  $('#detail-stat-top10').textContent = '—';
  $('#detail-stat-keywords').textContent = '—';
  $('#detail-optimizations').innerHTML = '<p class="empty">Laddar...</p>';
  $('#detail-queue').innerHTML = '<p class="empty">Laddar...</p>';
  $('#detail-rankings').innerHTML = '<p class="empty">Laddar positioner...</p>';

  const data = await api(`/api/customers/${customerId}/stats`);
  if (!data) {
    $('#detail-integrations').innerHTML = '<span class="tag tag--high">Kunde inte hämta data</span>';
    return;
  }

  // Integrations badges
  const c = data.customer;
  const badges = [];
  if (c['company-name']) badges.push(`<span class="detail-badge">${c['company-name']}</span>`);
  if (c['contact-email']) badges.push(`<span class="detail-badge">${c['contact-email']}</span>`);
  if (c['gsc-property']) badges.push(`<span class="tag tag--links">GSC</span>`);
  if (c['ga-property-id']) badges.push(`<span class="tag tag--links">GA4</span>`);
  if (c['google-ads-id']) badges.push(`<span class="tag tag--schema">Ads</span>`);
  if (c['meta-pixel-id']) badges.push(`<span class="tag tag--metadata">Meta</span>`);
  if (!badges.length) badges.push(`<span class="tag tag--content">Ingen integrationsdata</span>`);
  $('#detail-integrations').innerHTML = badges.join(' ');

  // Stats
  $('#detail-stat-opts').textContent = data.stats.total_optimizations;
  $('#detail-stat-queue').textContent = data.stats.queue_items;

  // Optimizations list
  const optEl = $('#detail-optimizations');
  if (data.optimizations?.length > 0) {
    optEl.innerHTML = data.optimizations.map(opt => `
      <div class="list-item">
        <div class="list-item-left">
          <div class="list-item-title">${formatTaskType(opt.optimization_type)}</div>
          <div class="list-item-sub">${opt.page_url || opt.site_url || '—'} &middot; ${timeAgo(opt.timestamp)}${opt.performed_by ? ' &middot; ' + opt.performed_by : ''}${opt.time_spent_minutes ? ', ' + opt.time_spent_minutes + ' min' : ''}</div>
        </div>
        <div class="list-item-right">
          <span class="tag tag--${typeTag(opt.optimization_type)}">${formatTaskType(opt.optimization_type)}</span>
        </div>
      </div>
    `).join('');
  } else {
    optEl.innerHTML = '<p class="empty">Inga optimeringar de senaste 30 dagarna.</p>';
  }

  // Queue list
  const qEl = $('#detail-queue');
  if (data.queue?.length > 0) {
    qEl.innerHTML = data.queue.map(task => `
      <div class="list-item">
        <div class="list-item-left">
          <div class="list-item-title">${formatQueueTask(task.task_type)}</div>
          <div class="list-item-sub">${task.page_url || '—'}</div>
        </div>
        <div class="list-item-right">
          <span class="tag tag--${severityTag(task.priority)}">${task.priority}</span>
          <span class="tag tag--${task.status}">${task.status}</span>
          ${task.source ? `<span class="source-badge source-badge--${task.source}">${task.source === 'manual' ? 'Manuell' : task.source}</span>` : ''}
        </div>
      </div>
    `).join('');
  } else {
    qEl.innerHTML = '<p class="empty">Ingen aktiv arbetskö.</p>';
  }

  // Load GSC + Trello keyword positions (async, don't block)
  loadRankings(customerId);

  // Load presentation list
  loadPresentationList();

  // Load pipeline data (contract info, action plan)
  loadCustomerPipeline(customerId);

  // Init manual input forms
  initManualForms(customerId);

  // Render performance gauges
  renderPerformanceGauges(customerId, data);

  // Render touchpoints + AI chat + ads
  renderTouchpoints(customerId);
  renderAds(customerId);
  _aiChatCustomerId = customerId;
}

// ── Performance Gauges (ApexCharts radialBar) ─────────────────
let _gaugeCharts = {};

function renderGauge(elementId, value, maxValue, color, label, invertScale) {
  // Clean up existing chart
  if (_gaugeCharts[elementId]) {
    _gaugeCharts[elementId].destroy();
  }

  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = '';

  // For position gauge: lower is better, so we invert the percentage
  let percent;
  if (invertScale) {
    // Position: 1 = 100%, 50+ = 0%
    percent = Math.max(0, Math.min(100, Math.round((1 - (value - 1) / (maxValue - 1)) * 100)));
  } else {
    percent = Math.max(0, Math.min(100, Math.round((value / maxValue) * 100)));
  }

  const options = {
    series: [percent],
    chart: {
      type: 'radialBar',
      height: 180,
      sparkline: { enabled: false },
      background: 'transparent',
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          size: '60%',
          background: 'transparent',
        },
        track: {
          background: 'rgba(255,255,255,0.06)',
          strokeWidth: '100%',
          margin: 0,
        },
        dataLabels: {
          name: { show: false },
          value: {
            show: true,
            fontSize: '1.6rem',
            fontWeight: 700,
            fontFamily: 'IBM Plex Sans',
            color: '#fafafa',
            offsetY: 8,
            formatter: function() {
              if (invertScale) return value.toFixed(1);
              return Math.round(value);
            }
          }
        }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        shadeIntensity: 0.3,
        gradientToColors: [color],
        stops: [0, 100]
      }
    },
    colors: [color],
    stroke: { lineCap: 'round' },
    labels: [label],
  };

  const chart = new ApexCharts(el, options);
  chart.render();
  _gaugeCharts[elementId] = chart;
}

function setGaugeDelta(elementId, currentValue, previousValue, invertScale) {
  const el = document.getElementById(elementId);
  if (!el) return;

  if (previousValue === null || previousValue === undefined) {
    el.textContent = '';
    el.className = 'gauge-delta neutral';
    return;
  }

  const diff = currentValue - previousValue;
  const absDiff = Math.abs(diff);

  let isPositive;
  if (invertScale) {
    // For position: going DOWN is good
    isPositive = diff < 0;
  } else {
    isPositive = diff > 0;
  }

  const sign = diff > 0 ? '+' : '';
  const displayDiff = invertScale ? diff.toFixed(1) : Math.round(absDiff);
  el.textContent = `${sign}${invertScale ? diff.toFixed(1) : (diff > 0 ? '+' : '') + Math.round(diff)} från förra veckan`;
  el.className = `gauge-delta ${isPositive ? 'positive' : diff === 0 ? 'neutral' : 'negative'}`;
}

async function renderPerformanceGauges(customerId, statsData) {
  const gaugeRow = document.getElementById('gauge-row');
  if (!gaugeRow) return;

  // Show loading state
  ['gauge-mobile', 'gauge-desktop', 'gauge-seo', 'gauge-position'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<div style="text-align:center;padding:40px 0;color:var(--gray-500);font-size:0.8rem">Laddar...</div>';
  });

  // Fetch performance data, SEO plan, and rankings in parallel
  const [perfData, planData, rankings] = await Promise.all([
    api(`/api/customers/${customerId}/performance`).catch(() => null),
    api(`/api/customers/${customerId}/action-plan`).catch(() => null),
    api(`/api/customers/${customerId}/rankings`).catch(() => null)
  ]);

  // Mobile + Desktop scores from Performance API
  const mobileScore = perfData?.mobile?.score || 0;
  const desktopScore = perfData?.desktop?.score || 0;
  const prevMobile = perfData?.previous?.mobile_score ?? null;
  const prevDesktop = perfData?.previous?.desktop_score ?? null;

  // SEO journey: % of action plan tasks completed
  let seoPercent = 0;
  if (planData?.plan) {
    let totalTasks = 0, completedTasks = 0;
    for (const [month, data] of Object.entries(planData.plan)) {
      totalTasks += data.total || 0;
      completedTasks += data.completed || 0;
    }
    seoPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  }

  // Average position from GSC data
  let avgPosition = 0;
  if (rankings?.rankings?.length > 0) {
    const positions = rankings.rankings.map(r => r.position).filter(p => p > 0);
    avgPosition = positions.length > 0 ? +(positions.reduce((a, b) => a + b, 0) / positions.length).toFixed(1) : 0;
  }

  // Render gauges
  renderGauge('gauge-mobile', mobileScore, 100, '#ff2d9b', 'Mobil', false);
  renderGauge('gauge-desktop', desktopScore, 100, '#00d4ff', 'Desktop', false);
  renderGauge('gauge-seo', seoPercent, 100, '#a855f7', 'SEO', false);
  renderGauge('gauge-position', avgPosition || 0, 50, '#22c55e', 'Position', true);

  // Deltas from previous scan
  setGaugeDelta('gauge-mobile-delta', mobileScore, prevMobile);
  setGaugeDelta('gauge-desktop-delta', desktopScore, prevDesktop);
  setGaugeDelta('gauge-seo-delta', seoPercent, null);
  setGaugeDelta('gauge-position-delta', avgPosition, null, true);

  // Show Core Web Vitals tooltip on hover
  if (perfData?.mobile) {
    const mobileEl = document.getElementById('gauge-mobile')?.closest('.gauge-card');
    if (mobileEl) {
      mobileEl.title = `FCP: ${perfData.mobile.fcp || '—'}\nLCP: ${perfData.mobile.lcp || '—'}\nCLS: ${perfData.mobile.cls || '—'}\nTBT: ${perfData.mobile.tbt || '—'}`;
    }
  }
  if (perfData?.desktop) {
    const desktopEl = document.getElementById('gauge-desktop')?.closest('.gauge-card');
    if (desktopEl) {
      desktopEl.title = `FCP: ${perfData.desktop.fcp || '—'}\nLCP: ${perfData.desktop.lcp || '—'}\nCLS: ${perfData.desktop.cls || '—'}\nTBT: ${perfData.desktop.tbt || '—'}`;
    }
  }
}

// ── Touchpoints (kontaktytor) ────────────────────────────────
let _touchpointCharts = {};

async function renderTouchpoints(customerId) {
  const row = document.getElementById('touchpoints-row');
  const chatCard = document.getElementById('ai-chat-card');
  if (!row) return;

  // Show sections
  row.style.display = '';
  if (chatCard) chatCard.style.display = '';

  // Store customerId for chat
  if (chatCard) chatCard.dataset.customerId = customerId;

  try {
    const data = await api(`/api/customers/${customerId}/touchpoints`);

    // Update values
    document.getElementById('tp-phone').textContent = data.phone_clicks ?? 0;
    document.getElementById('tp-email').textContent = data.email_clicks ?? 0;
    document.getElementById('tp-form').textContent = data.form_submissions ?? 0;
    document.getElementById('tp-total').textContent = data.total ?? 0;

    // Mock indicator
    if (data.mock) {
      row.classList.add('touchpoints-mock');
      row.title = data.message || 'GA4 ej konfigurerad';
    } else {
      row.classList.remove('touchpoints-mock');
      row.title = '';
    }

    // Render sparklines if daily data exists
    if (data.daily && data.daily.length > 0) {
      const dailyValues = data.daily.map(d => d.total);
      renderTouchpointSparkline('tp-total-spark', dailyValues, '#db007f');
    }

  } catch (err) {
    console.error('Touchpoints error:', err);
    document.getElementById('tp-phone').textContent = '—';
    document.getElementById('tp-email').textContent = '—';
    document.getElementById('tp-form').textContent = '—';
    document.getElementById('tp-total').textContent = '—';
  }
}

function renderTouchpointSparkline(elementId, data, color) {
  const el = document.getElementById(elementId);
  if (!el || !data || data.length === 0) return;

  // Destroy existing chart
  if (_touchpointCharts[elementId]) {
    _touchpointCharts[elementId].destroy();
  }

  el.innerHTML = '';

  const options = {
    series: [{ data }],
    chart: {
      type: 'area',
      height: 35,
      width: '100%',
      sparkline: { enabled: true },
      animations: { enabled: false }
    },
    stroke: { curve: 'smooth', width: 1.5 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.3,
        opacityTo: 0.05
      }
    },
    colors: [color],
    tooltip: {
      enabled: true,
      fixed: { enabled: false },
      x: { show: false },
      y: { title: { formatter: () => '' } },
      theme: 'dark'
    }
  };

  const chart = new ApexCharts(el, options);
  chart.render();
  _touchpointCharts[elementId] = chart;
}

// ── AI Analytics Chat ────────────────────────────────────────
let _aiChatCustomerId = null;

async function sendAiChat() {
  const input = document.getElementById('ai-chat-input');
  const messagesDiv = document.getElementById('ai-chat-messages');
  const chatCard = document.getElementById('ai-chat-card');
  if (!input || !messagesDiv) return;

  const message = input.value.trim();
  if (!message) return;

  // Get customer ID from chat card
  const customerId = chatCard?.dataset?.customerId || _aiChatCustomerId;
  if (!customerId) {
    messagesDiv.innerHTML += '<div class="ai-chat-msg ai-chat-msg--error">Ingen kund vald.</div>';
    return;
  }

  // Add user message
  messagesDiv.innerHTML += `<div class="ai-chat-msg ai-chat-msg--user">${escapeHtml(message)}</div>`;
  input.value = '';

  // Add loading indicator
  const loadingId = 'ai-loading-' + Date.now();
  messagesDiv.innerHTML += `<div class="ai-chat-msg ai-chat-msg--loading" id="${loadingId}">Tanker...</div>`;
  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  try {
    const data = await api(`/api/customers/${customerId}/analytics-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    // Remove loading
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();

    // Add AI response
    messagesDiv.innerHTML += `<div class="ai-chat-msg ai-chat-msg--ai">${escapeHtml(data.answer)}</div>`;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

  } catch (err) {
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();
    messagesDiv.innerHTML += `<div class="ai-chat-msg ai-chat-msg--error">Fel: ${escapeHtml(err.message)}</div>`;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ── Ads Dashboard ────────────────────────────────────────────
async function renderAds(customerId) {
  const card = document.getElementById('ads-dashboard-card');
  if (!card) return;

  try {
    const data = await api(`/api/customers/${customerId}/ads/spend`);
    if (!data || !data.platforms) {
      card.style.display = 'none';
      return;
    }

    card.style.display = '';
    const platforms = data.platforms;
    let activeCount = 0;

    // Update each platform card
    const mapping = {
      google_ads: { spend: 'ads-google-spend', clicks: 'ads-google-clicks', conv: 'ads-google-conv' },
      meta_ads:   { spend: 'ads-meta-spend',   clicks: 'ads-meta-clicks',   conv: 'ads-meta-conv' },
      linkedin_ads: { spend: 'ads-linkedin-spend', clicks: 'ads-linkedin-clicks', conv: 'ads-linkedin-conv' },
      tiktok_ads: { spend: 'ads-tiktok-spend', clicks: 'ads-tiktok-clicks', conv: 'ads-tiktok-conv' }
    };

    for (const [key, els] of Object.entries(mapping)) {
      const p = platforms[key];
      const cardEl = document.querySelector(`.ads-platform-card[data-platform="${key}"]`);
      if (p && p.available) {
        activeCount++;
        if (cardEl) cardEl.classList.add('active');
        const spendEl = document.getElementById(els.spend);
        const clicksEl = document.getElementById(els.clicks);
        const convEl = document.getElementById(els.conv);
        if (spendEl) spendEl.textContent = parseFloat(p.spend || 0).toLocaleString('sv-SE') + ' kr';
        if (clicksEl) clicksEl.textContent = (p.clicks || 0).toLocaleString('sv-SE') + ' klick';
        if (convEl) convEl.textContent = (p.conversions || 0) + ' konv';
      } else {
        if (cardEl) cardEl.classList.remove('active');
        const spendEl = document.getElementById(els.spend);
        if (spendEl) spendEl.textContent = 'Ej kopplad';
      }
    }

    // Total bar
    const totalSpend = document.getElementById('ads-total-spend');
    const totalClicks = document.getElementById('ads-total-clicks');
    const totalConv = document.getElementById('ads-total-conv');
    if (totalSpend) totalSpend.textContent = parseFloat(data.totalSpend || 0).toLocaleString('sv-SE') + ' kr';
    if (totalClicks) {
      const tc = Object.values(platforms).reduce((s, p) => s + (p.available ? (p.clicks || 0) : 0), 0);
      totalClicks.textContent = tc.toLocaleString('sv-SE') + ' klick';
    }
    if (totalConv) {
      const cv = Object.values(platforms).reduce((s, p) => s + (p.available ? (p.conversions || 0) : 0), 0);
      totalConv.textContent = cv + ' konverteringar';
    }

    const countEl = document.getElementById('ads-platforms-count');
    if (countEl) countEl.textContent = `${activeCount}/4 plattformar aktiva`;

  } catch (err) {
    console.warn('Ads data fetch failed:', err.message);
    card.style.display = 'none';
  }
}

async function loadCustomerPipeline(customerId) {
  // Contract info bar
  const contractBar = $('#detail-contract-bar');
  const budgetBar = $('#detail-budget-bar');
  const planEl = $('#detail-action-plan');

  const pipeData = await api('/api/pipeline');
  let customer = null;
  if (pipeData?.pipeline) {
    for (const stage of Object.values(pipeData.pipeline)) {
      const found = stage.find(c => c.customer_id === customerId);
      if (found) { customer = found; break; }
    }
  }

  _currentCustomerPipeline = customer;
  const stageControls = $('#detail-stage-controls');

  if (customer && (customer.service_type || customer.monthly_amount_sek)) {
    const daysLeft = customer.contract_end_date
      ? Math.max(0, Math.ceil((new Date(customer.contract_end_date) - Date.now()) / 86400000))
      : null;
    const expiryClass = daysLeft !== null && daysLeft < 30 ? (daysLeft <= 0 ? 'contract-bar--expired' : 'contract-bar--expiring') : '';
    contractBar.style.display = '';
    contractBar.className = `contract-bar ${expiryClass}`;
    contractBar.innerHTML = `
      <span class="contract-item"><strong>Tjänst:</strong> ${customer.service_type || '—'}</span>
      <span class="contract-item"><strong>Belopp:</strong> ${customer.monthly_amount_sek ? customer.monthly_amount_sek.toLocaleString('sv-SE') + ' kr/mån' : '—'}</span>
      <span class="contract-item"><strong>Period:</strong> ${customer.contract_start_date || '—'} — ${customer.contract_end_date || '—'}</span>
      ${daysLeft !== null ? `<span class="contract-item"><strong>Dagar kvar:</strong> <span class="${daysLeft < 30 ? 'text-warning' : ''}">${daysLeft}</span></span>` : ''}
      <span class="tag tag--${customer.stage === 'aktiv' ? 'links' : 'content'}">${customer.stage}</span>
    `;
  } else {
    contractBar.style.display = 'none';
  }

  // Stage controls
  if (customer) {
    stageControls.style.display = '';
    renderStageControls(customer);
    // New: Guided workflow + analysis summary + stage-specific cards
    renderNextAction(customer);
    renderAnalysisSummary(customer);
    showStageCards(customer);
    // Update name with company name from pipeline
    if (customer.company_name) {
      $('#detail-name').textContent = customer.company_name;
    }
  } else {
    stageControls.style.display = 'none';
  }

  // Action plan
  const planData = await api(`/api/customers/${customerId}/action-plan`);
  if (planData?.plan && Object.keys(planData.plan).length > 0) {
    // Budget bar
    if (planData.budget) {
      budgetBar.style.display = '';
      const pct = Math.min(100, Math.round(planData.budget.used / planData.budget.limit * 100));
      budgetBar.innerHTML = `
        <div class="budget-label">Budget denna månad: ${planData.budget.used} / ${planData.budget.limit} åtgärder (${planData.tier})</div>
        <div class="budget-track"><div class="budget-fill" style="width:${pct}%"></div></div>
      `;
    }

    let html = '';
    for (const [month, data] of Object.entries(planData.plan)) {
      const completed = data.completed || 0;
      const total = data.total || 0;
      const pct = total > 0 ? Math.round(completed / total * 100) : 0;
      html += `
        <div class="plan-month">
          <div class="plan-month-header">
            <h3>Månad ${month}</h3>
            <span class="plan-progress">${completed}/${total} (${pct}%)</span>
          </div>
          <div class="budget-track"><div class="budget-fill" style="width:${pct}%"></div></div>
          <div class="plan-tasks">
            ${(data.tasks || []).map(t => `
              <div class="plan-task plan-task--${t.status}">
                <span class="plan-task-status">${t.status === 'completed' ? '✅' : t.status === 'queued' ? '🔄' : '📋'}</span>
                <span class="plan-task-desc">${t.task_description}</span>
                <span class="tag tag--${typeTag(t.task_type)}">${formatQueueTask(t.task_type)}</span>
                <span class="tag tag--${t.estimated_effort === 'auto' ? 'links' : 'content'}">${t.estimated_effort}</span>
                ${t.source ? `<span class="source-badge source-badge--${t.source}">${t.source === 'manual' ? 'Manuell' : t.source === 'auto' ? 'Auto' : t.source}</span>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    planEl.innerHTML = html;
  } else {
    planEl.innerHTML = '<p class="empty">Ingen åtgärdsplan skapad ännu.</p>';
    budgetBar.style.display = 'none';
  }
}

async function loadRankings(customerId) {
  const rankEl = $('#detail-rankings');
  const rankData = await api(`/api/customers/${customerId}/rankings`);

  if (!rankData || rankData.error) {
    rankEl.innerHTML = `<p class="empty">${rankData?.error || 'Kunde inte hämta positioner.'}</p>`;
    return;
  }

  // Update stats
  $('#detail-stat-top10').textContent = rankData.stats?.top10 ?? '—';
  $('#detail-stat-keywords').textContent = rankData.stats?.total ?? '—';

  if (rankData.rankings?.length > 0) {
    const abcInfo = rankData.stats?.abc;
    const abcSummary = abcInfo && (abcInfo.A || abcInfo.B || abcInfo.C)
      ? `<span class="tag tag--high">A: ${abcInfo.A}</span>
         <span class="tag tag--metadata">B: ${abcInfo.B}</span>
         <span class="tag tag--content">C: ${abcInfo.C}</span>`
      : '';
    const sourceLabel = rankData.trello_keywords
      ? 'ABC-ord från Trello + GSC-positioner'
      : 'Topp sökord från Google Search Console';

    rankEl.innerHTML = `
      <div class="ranking-summary">
        ${abcSummary}
        <span class="tag tag--links">Topp 3: ${rankData.stats.top3}</span>
        <span class="tag tag--schema">Topp 10: ${rankData.stats.top10}</span>
        <span class="detail-badge">${rankData.date}</span>
      </div>
      <p class="ranking-source">${sourceLabel} (senaste 7 dagar)</p>
      <table class="data-table">
        <thead>
          <tr>
            <th>Sökord</th>
            ${rankData.trello_keywords ? '<th>Klass</th>' : ''}
            <th>Position</th>
            <th>Klick</th>
            <th>Visningar</th>
            <th>CTR</th>
          </tr>
        </thead>
        <tbody>
          ${rankData.rankings.map(r => {
            const posClass = !r.position ? '' : r.position <= 3 ? 'rank-top3' : r.position <= 10 ? 'rank-top10' : r.position <= 30 ? 'rank-top30' : '';
            const catClass = r.category === 'A' ? 'cat-a' : r.category === 'B' ? 'cat-b' : r.category === 'C' ? 'cat-c' : '';
            return `
              <tr>
                <td><strong>${r.keyword}</strong></td>
                ${rankData.trello_keywords ? `<td><span class="rank-cat ${catClass}">${r.category || '—'}</span></td>` : ''}
                <td><span class="rank-pos ${posClass}">${r.position ?? '—'}</span></td>
                <td>${r.clicks || 0}</td>
                <td>${r.impressions || 0}</td>
                <td>${r.ctr ? r.ctr + '%' : '—'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } else {
    rankEl.innerHTML = '<p class="empty">Inga sökord hittades. Lägg till ABC-ord i Trello eller verifiera GSC-åtkomst.</p>';
  }
}

// ── Manual Input Forms ──────────────────────────────────────

let _currentCustomerId = null;

function switchTab(btn) {
  const tabId = btn.dataset.tab;
  btn.closest('.manual-input-card').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.closest('.manual-input-card').querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

function addAuditIssueRow() {
  const container = document.getElementById('audit-issues');
  const row = document.createElement('div');
  row.className = 'issue-row';
  row.innerHTML = `
    <input type="text" class="form-input issue-url" placeholder="Sida (URL)">
    <select class="form-select issue-type">
      <option value="thin_content">Tunt innehåll</option>
      <option value="missing_title">Titel saknas/dålig</option>
      <option value="missing_meta">Meta saknas</option>
      <option value="missing_h1">H1 saknas</option>
      <option value="missing_alt">Alt-text saknas</option>
      <option value="slow_speed">Långsam laddning</option>
      <option value="missing_schema">Schema saknas</option>
      <option value="broken_links">Trasiga länkar</option>
      <option value="duplicate_content">Duplicerat innehåll</option>
      <option value="other">Övrigt</option>
    </select>
    <select class="form-select issue-severity">
      <option value="high">Hög</option>
      <option value="medium" selected>Medel</option>
      <option value="low">Låg</option>
    </select>
    <input type="number" class="form-input issue-priority" placeholder="Prio" min="1" max="10" value="5" style="width:60px">
    <input type="text" class="form-input issue-desc" placeholder="Beskrivning">
    <button class="btn-small btn-remove" onclick="this.parentElement.remove()">×</button>
  `;
  container.appendChild(row);
}

function initKeywordRows() {
  const tiers = [{ id: 'kw-a-rows', tier: 'A', count: 5 }, { id: 'kw-b-rows', tier: 'B', count: 5 }, { id: 'kw-c-rows', tier: 'C', count: 10 }];
  for (const t of tiers) {
    const container = document.getElementById(t.id);
    container.innerHTML = '';
    for (let i = 0; i < t.count; i++) {
      const row = document.createElement('div');
      row.className = 'kw-row';
      row.innerHTML = `
        <span class="kw-num">${t.tier}${i + 1}</span>
        <input type="text" class="form-input kw-word" placeholder="Sökord">
        <input type="number" class="form-input kw-vol" placeholder="Sökvolym" style="width:90px">
        <input type="number" class="form-input kw-diff" placeholder="Svårighet" style="width:90px" min="0" max="100">
      `;
      container.appendChild(row);
    }
  }
}

function addPlanTaskRow(month) {
  const container = document.getElementById(`plan-month-${month}-rows`);
  const row = document.createElement('div');
  row.className = 'plan-task-row';
  row.innerHTML = `
    <input type="text" class="form-input plan-desc" placeholder="Åtgärd">
    <select class="form-select plan-type">
      <option value="content_creation">Innehåll</option>
      <option value="meta_optimization">Meta</option>
      <option value="technical_fix">Teknisk fix</option>
      <option value="link_building">Länkbygge</option>
      <option value="schema_markup">Schema</option>
      <option value="speed_optimization">Hastighet</option>
      <option value="keyword_mapping">Nyckelord</option>
      <option value="other">Övrigt</option>
    </select>
    <input type="text" class="form-input plan-keyword" placeholder="Nyckelord" style="width:120px">
    <input type="text" class="form-input plan-url" placeholder="Sida (URL)" style="width:160px">
    <select class="form-select plan-effort">
      <option value="manual">Manuell</option>
      <option value="auto">Auto</option>
    </select>
    <button class="btn-small btn-remove" onclick="this.parentElement.remove()">×</button>
  `;
  container.appendChild(row);
}

async function saveManualAudit() {
  const statusEl = document.getElementById('audit-save-status');
  statusEl.textContent = 'Sparar...';
  statusEl.className = 'save-status saving';

  const summary = document.getElementById('audit-summary').value.trim();
  const issueRows = document.querySelectorAll('#audit-issues .issue-row');
  const issues = [];
  issueRows.forEach(row => {
    const url = row.querySelector('.issue-url').value.trim();
    const type = row.querySelector('.issue-type').value;
    const severity = row.querySelector('.issue-severity').value;
    const priority = parseInt(row.querySelector('.issue-priority').value) || 5;
    const desc = row.querySelector('.issue-desc').value.trim();
    if (url || desc) {
      issues.push({ url, problem_type: type, severity, priority, description: desc });
    }
  });

  const result = await api(`/api/customers/${_currentCustomerId}/manual-audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary, issues })
  });

  if (result?.success) {
    statusEl.textContent = 'Sparat!';
    statusEl.className = 'save-status saved';
    loadAuditData(_currentCustomerId);
  } else {
    statusEl.textContent = result?.error || 'Fel vid sparande';
    statusEl.className = 'save-status error';
  }
}

async function saveManualKeywords() {
  const statusEl = document.getElementById('kw-save-status');
  statusEl.textContent = 'Sparar...';
  statusEl.className = 'save-status saving';

  const phase = document.querySelector('input[name="kw-phase"]:checked').value;
  const keywords = [];
  const tiers = [{ id: 'kw-a-rows', tier: 'A' }, { id: 'kw-b-rows', tier: 'B' }, { id: 'kw-c-rows', tier: 'C' }];

  for (const t of tiers) {
    const rows = document.querySelectorAll(`#${t.id} .kw-row`);
    rows.forEach(row => {
      const word = row.querySelector('.kw-word').value.trim();
      if (word) {
        keywords.push({
          keyword: word,
          tier: t.tier,
          phase,
          monthly_search_volume: parseInt(row.querySelector('.kw-vol').value) || null,
          keyword_difficulty: parseInt(row.querySelector('.kw-diff').value) || null
        });
      }
    });
  }

  if (!keywords.length) {
    statusEl.textContent = 'Ange minst ett nyckelord';
    statusEl.className = 'save-status error';
    return;
  }

  const result = await api(`/api/customers/${_currentCustomerId}/keywords`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phase, keywords })
  });

  if (result?.success) {
    statusEl.textContent = `Sparat ${result.inserted} nyckelord!`;
    statusEl.className = 'save-status saved';
  } else {
    statusEl.textContent = result?.error || 'Fel vid sparande';
    statusEl.className = 'save-status error';
  }
}

async function saveManualPlan() {
  const statusEl = document.getElementById('plan-save-status');
  statusEl.textContent = 'Sparar...';
  statusEl.className = 'save-status saving';

  const tasks = [];
  for (let month = 1; month <= 3; month++) {
    const rows = document.querySelectorAll(`#plan-month-${month}-rows .plan-task-row`);
    rows.forEach(row => {
      const desc = row.querySelector('.plan-desc').value.trim();
      if (desc) {
        tasks.push({
          month,
          description: desc,
          task_type: row.querySelector('.plan-type').value,
          keyword: row.querySelector('.plan-keyword').value.trim(),
          target_url: row.querySelector('.plan-url').value.trim(),
          effort: row.querySelector('.plan-effort').value
        });
      }
    });
  }

  if (!tasks.length) {
    statusEl.textContent = 'Ange minst en åtgärd';
    statusEl.className = 'save-status error';
    return;
  }

  const result = await api(`/api/customers/${_currentCustomerId}/manual-action-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks })
  });

  if (result?.success) {
    statusEl.textContent = `Sparat ${result.tasks_added} åtgärder!`;
    statusEl.className = 'save-status saved';
    loadCustomerPipeline(_currentCustomerId);
  } else {
    statusEl.textContent = result?.error || 'Fel vid sparande';
    statusEl.className = 'save-status error';
  }
}

// ══════════════════════════════════════════
// PRESENTATION GENERATOR
// ══════════════════════════════════════════

async function generatePresentation(useAI = false) {
  const statusEl = document.getElementById('presentation-status');
  statusEl.style.display = 'block';
  statusEl.innerHTML = `<div style="padding:12px;background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.2);border-radius:8px;color:#00d4ff;font-size:13px">
    ${useAI ? '🤖 Genererar AI-presentation... (kan ta 15-30 sek)' : '⚡ Genererar presentation...'}
  </div>`;

  try {
    const result = await api('/api/presentations/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: _currentCustomerId,
        template: 'seo-audit',
        use_ai: useAI
      })
    });

    if (result?.success) {
      statusEl.innerHTML = `<div style="padding:12px;background:rgba(0,230,118,0.1);border:1px solid rgba(0,230,118,0.2);border-radius:8px;display:flex;justify-content:space-between;align-items:center">
        <span style="color:#00e676;font-size:13px">✅ Presentation genererad! (${result.slides} slides)</span>
        <div style="display:flex;gap:8px">
          <a href="${result.url}" target="_blank" style="padding:6px 14px;background:linear-gradient(135deg,#e91e8c,#7c4dff);color:#fff;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600">🎬 Visa presentation</a>
          <a href="${result.url}" download style="padding:6px 14px;background:rgba(0,212,255,0.15);color:#00d4ff;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600;border:1px solid rgba(0,212,255,0.3)">📥 Ladda ner HTML</a>
        </div>
      </div>`;
      // Refresh presentation list
      loadPresentationList();
    } else {
      throw new Error(result?.error || 'Okänt fel');
    }
  } catch (err) {
    statusEl.innerHTML = `<div style="padding:12px;background:rgba(255,23,68,0.1);border:1px solid rgba(255,23,68,0.2);border-radius:8px;color:#ff1744;font-size:13px">
      ❌ Fel: ${err.message}
    </div>`;
  }
}

async function loadPresentationList() {
  const listEl = document.getElementById('presentation-list');
  if (!listEl) return;

  try {
    const result = await api('/api/presentations');
    if (!result?.presentations?.length) {
      listEl.innerHTML = '';
      return;
    }

    // Filter to current customer
    const customerPres = result.presentations.filter(p => p.customer_id === _currentCustomerId);
    if (!customerPres.length) {
      listEl.innerHTML = '';
      return;
    }

    listEl.innerHTML = `
      <div style="font-size:12px;color:#888;margin-bottom:8px">Tidigare presentationer:</div>
      ${customerPres.slice(0, 5).map(p => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(17,17,40,0.5);border:1px solid #1a1a3e;border-radius:6px;margin-bottom:4px">
          <span style="font-size:12px;color:#e0e0e0">${new Date(p.created_at).toLocaleString('sv-SE')}</span>
          <a href="${p.url}" target="_blank" style="font-size:11px;color:#00d4ff;text-decoration:none">Öppna →</a>
        </div>
      `).join('')}
    `;
  } catch (err) {
    // Silently fail
  }
}

async function autoGeneratePlan() {
  const statusEl = document.getElementById('plan-save-status');
  statusEl.textContent = 'Genererar...';
  statusEl.className = 'save-status saving';

  const result = await api(`/api/customers/${_currentCustomerId}/action-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  if (result?.success) {
    statusEl.textContent = `Genererat ${result.tasks_created} åtgärder!`;
    statusEl.className = 'save-status saved';
    loadCustomerPipeline(_currentCustomerId);
  } else {
    statusEl.textContent = result?.error || 'Fel vid generering';
    statusEl.className = 'save-status error';
  }
}

// ── Manual work log ──────────────────────────────────────────

function addWorklogRow() {
  const container = document.getElementById('worklog-rows');
  const row = document.createElement('div');
  row.className = 'worklog-row';
  const now = new Date();
  const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  row.innerHTML = `
    <div class="worklog-row-top">
      <input type="datetime-local" class="form-input worklog-date" value="${localISO}">
      <select class="form-select worklog-type">
        <option value="Metadata">Metadata</option>
        <option value="Innehåll">Innehåll</option>
        <option value="Teknisk SEO">Teknisk SEO</option>
        <option value="Bilder">Bilder</option>
        <option value="Intern länkning">Intern länkning</option>
        <option value="Schema">Schema</option>
        <option value="Annat">Annat</option>
      </select>
      <input type="text" class="form-input worklog-url" placeholder="Sida-URL (valfritt)">
    </div>
    <div class="worklog-row-bottom">
      <input type="text" class="form-input worklog-desc" placeholder="Beskrivning av utfört arbete">
      <input type="number" class="form-input worklog-time" placeholder="Min" style="width:70px" min="0">
      <select class="form-select worklog-by">
        <option value="Mikael">Mikael</option>
        <option value="Viktor">Viktor</option>
      </select>
      <button class="btn-small btn-remove" onclick="this.closest('.worklog-row').remove()">×</button>
    </div>
  `;
  container.appendChild(row);
}

async function saveManualWork() {
  const statusEl = document.getElementById('worklog-save-status');
  statusEl.textContent = 'Sparar...';
  statusEl.className = 'save-status saving';

  const rows = document.querySelectorAll('#worklog-rows .worklog-row');
  const entries = [];
  rows.forEach(row => {
    const desc = row.querySelector('.worklog-desc').value.trim();
    if (desc) {
      entries.push({
        date: row.querySelector('.worklog-date').value,
        type: row.querySelector('.worklog-type').value,
        page_url: row.querySelector('.worklog-url').value.trim(),
        description: desc,
        time_minutes: parseInt(row.querySelector('.worklog-time').value) || 0,
        performed_by: row.querySelector('.worklog-by').value
      });
    }
  });

  if (!entries.length) {
    statusEl.textContent = 'Fyll i minst en rad';
    statusEl.className = 'save-status error';
    return;
  }

  const result = await api(`/api/customers/${_currentCustomerId}/manual-work-log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries })
  });

  if (result?.success) {
    statusEl.textContent = `Sparat ${result.logged} poster!`;
    statusEl.className = 'save-status saved';
    // Clear rows and add fresh ones
    document.getElementById('worklog-rows').innerHTML = '';
    addWorklogRow();
    // Refresh optimizations list
    showCustomerDetail(_currentCustomerId, document.getElementById('detail-url').textContent);
  } else {
    statusEl.textContent = result?.error || 'Fel vid sparande';
    statusEl.className = 'save-status error';
  }
}

async function loadAuditData(customerId) {
  const existingEl = document.getElementById('audit-existing');
  const auditData = await api(`/api/customers/${customerId}/audit`);
  if (auditData?.summary) {
    existingEl.style.display = '';
    existingEl.innerHTML = `
      <div class="audit-summary-box">
        <strong>Sparad analys:</strong>
        <pre class="audit-pre">${auditData.summary}</pre>
      </div>
    `;
    document.getElementById('audit-summary').value = auditData.summary;
  } else {
    existingEl.style.display = 'none';
  }
}

function initManualForms(customerId) {
  _currentCustomerId = customerId;
  // Init keyword rows
  initKeywordRows();
  // Init with 2 starter rows for audit issues
  document.getElementById('audit-issues').innerHTML = '';
  addAuditIssueRow();
  addAuditIssueRow();
  // Init with 2 starter rows per month for plan
  for (let m = 1; m <= 3; m++) {
    document.getElementById(`plan-month-${m}-rows`).innerHTML = '';
    addPlanTaskRow(m);
    addPlanTaskRow(m);
  }
  // Init worklog rows
  document.getElementById('worklog-rows').innerHTML = '';
  addWorklogRow();
  addWorklogRow();
  // Clear statuses
  document.querySelectorAll('.save-status').forEach(el => { el.textContent = ''; el.className = 'save-status'; });
  document.getElementById('audit-summary').value = '';
  // Load existing audit data
  loadAuditData(customerId);
  // Load existing keywords into form
  loadExistingKeywords(customerId);
  // Load credentials status
  loadCredentialsTab(customerId);
}

async function loadExistingKeywords(customerId) {
  const kwData = await api(`/api/customers/${customerId}/keywords`);
  if (!kwData?.keywords?.length) return;
  const tierMap = { A: 'kw-a-rows', B: 'kw-b-rows', C: 'kw-c-rows' };
  const counters = { A: 0, B: 0, C: 0 };
  for (const kw of kwData.keywords) {
    const tier = kw.tier || 'C';
    const containerId = tierMap[tier];
    if (!containerId) continue;
    const rows = document.querySelectorAll(`#${containerId} .kw-row`);
    const idx = counters[tier]++;
    if (idx < rows.length) {
      rows[idx].querySelector('.kw-word').value = kw.keyword || '';
      if (kw.monthly_search_volume) rows[idx].querySelector('.kw-vol').value = kw.monthly_search_volume;
      if (kw.keyword_difficulty) rows[idx].querySelector('.kw-diff').value = kw.keyword_difficulty;
    }
  }
  if (kwData.keywords[0]?.phase) {
    const radio = document.querySelector(`input[name="kw-phase"][value="${kwData.keywords[0].phase}"]`);
    if (radio) radio.checked = true;
  }
}

// Back button — remembers where you came from
document.getElementById('back-to-overview')?.addEventListener('click', (e) => {
  e.preventDefault();
  const targetView = _previousView || 'overview';
  $$('.view').forEach(v => v.classList.remove('active'));
  $(`#view-${targetView}`).classList.add('active');
  $$('.nav-link').forEach(l => l.classList.remove('active'));
  $(`[data-view="${targetView}"]`)?.classList.add('active');
});

// ── Init ──────────────────────────────────────────────────────
if (sessionStorage.getItem('opti_auth') === '1') {
  loadOverview();
}

// Auto-refresh every 5 minutes (was 30s — caused massive load)
setInterval(() => {
  if (sessionStorage.getItem('opti_auth') !== '1') return;
  const activeView = $('.nav-link.active')?.dataset.view || 'overview';
  loadView(activeView);
}, 300000);

// ══════════════════════════════════════════
// SALES FLOW — Domain analysis, cost editor, order, startup, activate
// ══════════════════════════════════════════

// Salesperson filter state
let _currentSalesperson = null;

function filterBySalesperson(value) {
  _currentSalesperson = value || null;
  invalidateCache();
  const activeView = $('.nav-link.active')?.dataset.view || 'overview';
  loadView(activeView);
}

async function loadSalespeopleDropdown() {
  const data = await api('/api/salespeople');
  const select = $('#salesperson-filter');
  if (!select || !data?.salespeople) return;
  select.innerHTML = '<option value="">Alla s\u00E4ljare</option>';
  for (const sp of data.salespeople) {
    select.innerHTML += `<option value="${sp.salesperson_id}">${sp.display_name}</option>`;
  }
  select.style.display = '';
}

// Init salesperson dropdown on login
if (sessionStorage.getItem('opti_auth') === '1') {
  loadSalespeopleDropdown();
}

// ── Domain Analysis ──────────────────────────────────────────
async function runDomainAnalysis() {
  const domain = $('#domain-input').value.trim();
  if (!domain) return alert('Ange en dom\u00E4n');
  const company = $('#domain-company').value.trim();

  const loadingEl = $('#analysis-loading');
  const resultEl = $('#analysis-result');
  loadingEl.style.display = 'flex';
  resultEl.style.display = 'none';

  const data = await api('/api/domain-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      domain,
      company_name: company || null,
      salesperson_id: _currentSalesperson || 'mikael'
    })
  });

  loadingEl.style.display = 'none';

  if (!data || !data.success) {
    resultEl.style.display = 'block';
    resultEl.innerHTML = `<div class="analysis-error">\u274C ${data?.error || 'Kunde inte analysera sajten'}</div>`;
    return;
  }

  const scoreColor = data.score >= 70 ? '#10b981' : data.score >= 40 ? '#f59e0b' : '#ef4444';
  const criticalCount = (data.issues || []).filter(i => i.severity === 'high').length;
  const warningCount = (data.issues || []).filter(i => i.severity === 'medium').length;

  resultEl.style.display = 'block';
  resultEl.innerHTML = `
    <div class="analysis-result-grid">
      <div class="analysis-score-box">
        <div class="score-circle" style="--score-color:${scoreColor}">
          <span class="score-value">${data.score}</span>
          <span class="score-label">/100</span>
        </div>
        <div class="score-sublabel">SEO-po\u00E4ng</div>
      </div>
      <div class="analysis-summary-box">
        <h3 style="color:#fff;margin:0 0 8px 0">${data.company_name}</h3>
        <p class="analysis-pitch">${data.summary}</p>
        <div class="analysis-badges">
          ${criticalCount > 0 ? `<span class="tag tag--high">${criticalCount} kritiska</span>` : ''}
          ${warningCount > 0 ? `<span class="tag tag--medium">${warningCount} varningar</span>` : ''}
          <span class="tag tag--schema">${(data.issues || []).length} totalt</span>
          ${data.additional_pages?.length > 0 ? `<span class="tag tag--links">${data.additional_pages.length + 1} sidor</span>` : ''}
        </div>
      </div>
      <div class="analysis-cost-box">
        <div class="cost-estimate-value">${data.cost_estimate?.amount?.toLocaleString('sv-SE') || '5 000'} kr/m\u00E5n</div>
        <div class="cost-estimate-tier">${data.cost_estimate?.tier || 'standard'} — ${data.cost_estimate?.reason || ''}</div>
        ${data.page_speed ? `<div class="pagespeed-mini" style="margin-top:8px;font-size:11px;color:#94a3b8">
          📱 Mobil: ${data.page_speed.mobile?.score || '–'} &nbsp; 💻 Desktop: ${data.page_speed.desktop?.score || '–'}
        </div>` : ''}
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn-primary" onclick="showCustomerDetail('${data.customer_id}', '${data.website_url}')">
            \u2192 \u00D6ppna kund
          </button>
          ${data.pdf_report ? `<a href="${API_BASE}${data.pdf_report.url}" target="_blank" class="btn-secondary" style="display:inline-flex;align-items:center;gap:4px;text-decoration:none">
            📄 Åtgärdsrapport PDF
          </a>` : ''}
        </div>
      </div>
    </div>
  `;

  // Refresh pipeline
  invalidateCache('/api/pipeline');
  loadPipeline();
}

// ── Next Action Card (Guided Workflow) ───────────────────────
function renderNextAction(customer) {
  const card = $('#next-action-card');
  if (!card) return;

  const stage = customer.stage;
  const actions = {
    'analys': {
      icon: '\uD83D\uDD0D', title: 'Analysen \u00E4r klar',
      desc: 'Granska sammanfattningen och justera kostnadsf\u00F6rslaget innan du genererar presentationen.',
      primary: { label: 'Redigera pris & Generera presentation', action: () => { showCostEditor(customer); } },
      secondary: { label: 'Visa sammanfattning', action: () => { scrollToEl('#analysis-summary-card'); } },
      extra: customer.last_presentation_url ? { label: '\uD83D\uDCC4 Ladda ner \u00E5tg\u00E4rdsrapport', action: () => window.open(API_BASE + '/api/reports/pdf/' + customer.last_presentation_url.split('/').pop(), '_blank') } : null
    },
    'presentation': {
      icon: '\uD83C\uDFAF', title: 'Presentation redo',
      desc: customer.last_presentation_url ? 'Presentationen \u00E4r genererad. Skicka den till kunden eller boka m\u00F6te.' : 'Generera en presentation f\u00F6r att skicka till kunden.',
      primary: customer.last_presentation_url
        ? { label: '\u00D6ppna presentation', action: () => window.open(customer.last_presentation_url, '_blank') }
        : { label: 'Generera presentation', action: () => showCostEditor(customer) },
      secondary: { label: 'Markera som S\u00E5ld \u2192', action: () => changeStageQuick(customer.customer_id, 'forsaljning') }
    },
    'forsaljning': {
      icon: '\uD83D\uDCB0', title: 'F\u00F6rs\u00E4ljning p\u00E5g\u00E5r',
      desc: 'V\u00E4ntar p\u00E5 kundens beslut.',
      primary: { label: 'Bekr\u00E4fta order \u2714', action: () => showOrderForm(customer) },
      secondary: { label: 'Markera som f\u00F6rlorad', action: () => changeStageQuick(customer.customer_id, 'churned') }
    },
    'orderbekraftelse': {
      icon: '\u2705', title: 'Order bekr\u00E4ftad!',
      desc: 'Dags att boka uppstartsm\u00F6te och definiera nyckelord.',
      primary: { label: 'Starta uppstart \u2192', action: () => showStartupForm(customer) }
    },
    'uppstart': {
      icon: '\uD83D\uDE80', title: 'Uppstart p\u00E5g\u00E5r',
      desc: 'Fyll i nyckelord och geografiskt fokus.',
      primary: { label: 'Generera \u00E5tg\u00E4rdsplan', action: () => autoGeneratePlan() }
    },
    'atgardsplan': {
      icon: '\uD83D\uDCCB', title: '\u00C5tg\u00E4rdsplan klar',
      desc: 'Granska planen och aktivera automatisk optimering.',
      primary: { label: 'Aktivera optimering!', action: () => activateCustomer() }
    },
    'aktiv': {
      icon: '\u26A1', title: 'Kunden \u00E4r aktiv',
      desc: 'Automatisk optimering k\u00F6rs var 6:e timme.',
      primary: null
    }
  };

  const a = actions[stage];
  if (!a) { card.style.display = 'none'; return; }

  card.style.display = 'block';
  card.innerHTML = `
    <div class="next-action-inner" style="border-left: 4px solid ${STAGE_ORDER.find(s => s.key === stage)?.color || '#888'}">
      <div class="next-action-content">
        <div class="next-action-icon">${a.icon}</div>
        <div>
          <h3 class="next-action-title">${a.title}</h3>
          <p class="next-action-desc">${a.desc}</p>
        </div>
      </div>
      <div class="next-action-buttons">
        ${a.primary ? `<button class="btn-primary" id="next-action-primary">${a.primary.label}</button>` : ''}
        ${a.secondary ? `<button class="btn-secondary" id="next-action-secondary">${a.secondary.label}</button>` : ''}
        ${a.extra ? `<button class="btn-secondary" id="next-action-extra" style="background:rgba(233,30,140,0.15);border-color:#e91e8c;color:#e91e8c">${a.extra.label}</button>` : ''}
      </div>
    </div>
  `;

  if (a.primary) {
    document.getElementById('next-action-primary')?.addEventListener('click', a.primary.action);
  }
  if (a.secondary) {
    document.getElementById('next-action-secondary')?.addEventListener('click', a.secondary.action);
  }
  if (a.extra) {
    document.getElementById('next-action-extra')?.addEventListener('click', a.extra.action);
  }
}

function scrollToEl(selector) {
  const el = $(selector);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

async function changeStageQuick(customerId, newStage) {
  await api(`/api/customers/${customerId}/stage`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage: newStage })
  });
  invalidateCache();
  showCustomerDetail(customerId);
}

// ── Analysis Summary Card ────────────────────────────────────
function renderAnalysisSummary(customer) {
  const card = $('#analysis-summary-card');
  if (!card || !customer.analysis_score) { if (card) card.style.display = 'none'; return; }

  const scoreColor = customer.analysis_score >= 70 ? '#10b981' : customer.analysis_score >= 40 ? '#f59e0b' : '#ef4444';
  card.style.display = 'block';
  card.innerHTML = `
    <div class="analysis-result-grid" style="margin:0">
      <div class="analysis-score-box">
        <div class="score-circle" style="--score-color:${scoreColor}">
          <span class="score-value">${customer.analysis_score}</span>
          <span class="score-label">/100</span>
        </div>
      </div>
      <div class="analysis-summary-box" style="flex:2">
        <h3 style="color:#fff;margin:0 0 8px 0">SEO-sammanfattning</h3>
        <p class="analysis-pitch">${customer.analysis_summary || 'Ingen analys k\u00F6rd \u00E4n.'}</p>
        ${customer.analysis_date ? `<span style="color:#666;font-size:12px">Analyserad: ${new Date(customer.analysis_date).toLocaleDateString('sv-SE')}</span>` : ''}
      </div>
      <div class="analysis-cost-box">
        <div class="cost-estimate-value">${customer.cost_estimate_sek ? customer.cost_estimate_sek.toLocaleString('sv-SE') + ' kr/m\u00E5n' : '\u2014'}</div>
        <div class="cost-estimate-tier">${customer.cost_estimate_type === 'manual' ? 'Justerat pris' : 'Auto-ber\u00E4knat'}</div>
        <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
          ${customer.last_presentation_url && customer.last_presentation_url.includes('atgardsrapport') ? `
            <a href="${API_BASE}/api/reports/pdf/${customer.last_presentation_url.split('/').pop()}" target="_blank"
               class="btn-secondary" style="font-size:12px;padding:4px 10px;text-decoration:none;display:inline-flex;align-items:center;gap:3px">
              \uD83D\uDCC4 \u00D6ppna PDF
            </a>
          ` : `
            <button class="btn-secondary" style="font-size:12px;padding:4px 10px" onclick="regeneratePDF('${customer.customer_id}')">
              \uD83D\uDCC4 Generera PDF
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}

// ── Regenerate PDF for existing customer ──
async function regeneratePDF(customerId) {
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = 'Genererar...';
  try {
    const result = await api('/api/reports/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customerId })
    });
    if (result?.success && result.pdf_report) {
      window.open(API_BASE + '/api/reports/pdf/' + result.pdf_report.filename, '_blank');
      btn.textContent = '\u2705 PDF klar!';
      // Refresh to show the link
      setTimeout(() => showCustomerDetail(customerId), 1000);
    } else {
      btn.textContent = '\u274C Fel';
    }
  } catch (e) {
    btn.textContent = '\u274C ' + e.message;
  }
}

// ── Cost Editor ──────────────────────────────────────────────
function showCostEditor(customer) {
  const card = $('#cost-editor-card');
  if (!card) return;
  card.style.display = 'block';

  if (customer.cost_estimate_sek) {
    $('#cost-total').value = customer.cost_estimate_sek;
  }

  // Auto-select tier based on amount
  const amount = customer.cost_estimate_sek || 5000;
  const tier = amount <= 5000 ? 'basic' : amount <= 10000 ? 'standard' : 'premium';
  $('#cost-tier').value = tier;

  // Render breakdown
  let breakdown = [];
  try {
    if (customer.cost_estimate_json) {
      const parsed = typeof customer.cost_estimate_json === 'string' ? JSON.parse(customer.cost_estimate_json) : customer.cost_estimate_json;
      breakdown = parsed.breakdown || [];
    }
  } catch (e) {}

  const breakdownEl = $('#cost-breakdown');
  if (breakdown.length > 0) {
    breakdownEl.innerHTML = '<h4 style="color:#888;margin:8px 0">Ing\u00E5r:</h4>' + breakdown.map(b =>
      `<div class="cost-line-item"><span>${b.name}</span><span>${b.price}</span></div>`
    ).join('');
  }

  card.scrollIntoView({ behavior: 'smooth' });
}

async function generatePresentationWithCost() {
  const total = parseInt($('#cost-total').value) || 5000;
  const tier = $('#cost-tier').value;

  // Save updated cost estimate
  const customerId = _currentCustomerPipeline?.customer_id;
  if (!customerId) return;

  await api(`/api/customers/${customerId}/cost-estimate`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cost_estimate_sek: total,
      cost_estimate_json: { tier, total, breakdown: [] }
    })
  });

  // Generate presentation with custom pricing
  const statusEl = $('#presentation-status');
  statusEl.style.display = 'block';
  statusEl.innerHTML = '<div style="color:#00d4ff;padding:12px;background:#00d4ff11;border-radius:8px">\uD83E\uDD16 Genererar presentation med pris ' + total.toLocaleString('sv-SE') + ' kr... (15-30 sek)</div>';

  const result = await api('/api/presentations/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: customerId,
      template: 'seo-audit',
      use_ai: true,
      custom_pricing: {
        total_price: total.toLocaleString('sv-SE') + ' kr/m\u00E5n',
        package_name: tier === 'basic' ? 'SEO Basic' : tier === 'standard' ? 'SEO Standard' : 'SEO Premium',
        pricing_items: [
          { icon: '\uD83D\uDD0D', icon_color: 'pink', name: 'SEO-analys & strategi', description: 'Komplett genomg\u00E5ng av sajten', price: '', price_class: '' },
          { icon: '\u2699\uFE0F', icon_color: 'cyan', name: 'Teknisk optimering', description: 'Metadata, schema, hastighet', price: '', price_class: '' },
          { icon: '\uD83D\uDCC8', icon_color: 'green', name: 'Inneh\u00E5ll & rapportering', description: 'M\u00E5natlig uppf\u00F6ljning & rapport', price: '', price_class: '' }
        ],
        pricing_includes: ['Automatisk metadata-optimering', 'Schema markup', 'Veckorapporter', 'Google Search Console-analys', 'ABC-nyckelordsstrategi'],
        timeline: '3 m\u00E5nader'
      }
    })
  });

  if (result?.success) {
    statusEl.innerHTML = `<div style="color:#10b981;padding:12px;background:#10b98111;border-radius:8px">
      \u2705 Presentation genererad! (${result.slides} slides)
      <div style="margin-top:8px;display:flex;gap:8px">
        <a href="${result.url}" target="_blank" class="btn-primary" style="text-decoration:none;font-size:13px">\uD83C\uDFAC Visa presentation</a>
        <a href="${result.url}" download class="btn-secondary" style="text-decoration:none;font-size:13px">\uD83D\uDCE5 Ladda ner</a>
      </div>
    </div>`;
    // Advance stage to presentation
    await changeStageQuick(customerId, 'presentation');
  } else {
    statusEl.innerHTML = `<div style="color:#ef4444;padding:12px;background:#ef444411;border-radius:8px">\u274C ${result?.error || 'Kunde inte generera'}</div>`;
  }
}

// ── Order Form ───────────────────────────────────────────────
function showOrderForm(customer) {
  const card = $('#order-form-card');
  if (!card) return;
  card.style.display = 'block';

  if (customer.cost_estimate_sek) {
    $('#order-amount').value = customer.cost_estimate_sek;
  }
  if (customer.service_type) {
    $('#order-service').value = customer.service_type;
  }
  // Default start date to today
  const today = new Date().toISOString().split('T')[0];
  $('#order-start').value = today;

  card.scrollIntoView({ behavior: 'smooth' });
}

async function confirmOrder() {
  const customerId = _currentCustomerPipeline?.customer_id;
  if (!customerId) return;

  const statusEl = $('#order-save-status');
  statusEl.textContent = 'Bekr\u00E4ftar...';
  statusEl.className = 'save-status saving';

  const result = await api(`/api/customers/${customerId}/confirm-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_type: $('#order-service').value,
      monthly_amount_sek: parseInt($('#order-amount').value) || 5000,
      contract_start_date: $('#order-start').value
    })
  });

  if (result?.success) {
    statusEl.textContent = '\u2705 Order bekr\u00E4ftad!';
    statusEl.className = 'save-status success';
    invalidateCache();
    setTimeout(() => showCustomerDetail(customerId), 500);
  } else {
    statusEl.textContent = '\u274C ' + (result?.error || 'Misslyckades');
    statusEl.className = 'save-status error';
  }
}

// ── Startup Form ─────────────────────────────────────────────
function showStartupForm(customer) {
  const card = $('#startup-form-card');
  if (!card) return;
  card.style.display = 'block';

  if (customer.geographic_focus) {
    $('#startup-geo').value = customer.geographic_focus;
  }
  const today = new Date().toISOString().split('T')[0];
  $('#startup-date').value = today;

  // Init keyword rows
  ['startup-kw-a', 'startup-kw-b', 'startup-kw-c'].forEach(id => {
    const container = $(`#${id}`);
    if (!container) return;
    const tier = id.endsWith('-a') ? 'A' : id.endsWith('-b') ? 'B' : 'C';
    const count = tier === 'C' ? 10 : 5;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      container.innerHTML += `
        <div class="kw-row">
          <span class="kw-label">${tier}${i + 1}</span>
          <input type="text" class="form-input kw-word" placeholder="Nyckelord">
          <input type="number" class="form-input kw-vol" placeholder="S\u00F6kvolym" style="width:100px">
        </div>
      `;
    }
  });

  card.scrollIntoView({ behavior: 'smooth' });
}

async function saveStartupAndGeneratePlan() {
  const customerId = _currentCustomerPipeline?.customer_id;
  if (!customerId) return;

  const statusEl = $('#startup-save-status');
  statusEl.textContent = 'Sparar...';
  statusEl.className = 'save-status saving';

  // Collect keywords
  const keywords = [];
  ['startup-kw-a', 'startup-kw-b', 'startup-kw-c'].forEach(id => {
    const tier = id.endsWith('-a') ? 'A' : id.endsWith('-b') ? 'B' : 'C';
    const rows = $$(`#${id} .kw-row`);
    rows.forEach(row => {
      const word = row.querySelector('.kw-word')?.value?.trim();
      const vol = parseInt(row.querySelector('.kw-vol')?.value) || 0;
      if (word) {
        keywords.push({ keyword: word, tier, monthly_search_volume: vol });
      }
    });
  });

  // Save startup data
  const result = await api(`/api/customers/${customerId}/startup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      geographic_focus: $('#startup-geo').value.trim(),
      keywords,
      startup_meeting_date: $('#startup-date').value
    })
  });

  if (result?.success) {
    statusEl.textContent = `\u2705 Sparat! ${result.keywords_saved} nyckelord. Genererar \u00E5tg\u00E4rdsplan...`;
    statusEl.className = 'save-status success';

    // Auto-generate action plan
    await api(`/api/customers/${customerId}/action-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    // Advance stage
    await changeStageQuick(customerId, 'atgardsplan');
  } else {
    statusEl.textContent = '\u274C ' + (result?.error || 'Misslyckades');
    statusEl.className = 'save-status error';
  }
}

// ── Activate Customer ────────────────────────────────────────
async function activateCustomer() {
  const customerId = _currentCustomerPipeline?.customer_id;
  if (!customerId) return;

  const statusEl = $('#activate-status');
  statusEl.innerHTML = '<div style="color:#00d4ff">Aktiverar...</div>';

  const result = await api(`/api/customers/${customerId}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  if (result?.success) {
    statusEl.innerHTML = `<div style="color:#10b981">\u2705 Kunden \u00E4r nu aktiv! ${result.queued_tasks} uppgifter k\u00F6ade.
      ${result.warnings?.length ? '<br><span style="color:#f59e0b">\u26A0 ' + result.warnings.join(', ') + '</span>' : ''}
    </div>`;
    invalidateCache();
    setTimeout(() => showCustomerDetail(customerId), 1000);
  } else {
    statusEl.innerHTML = `<div style="color:#ef4444">\u274C ${result?.error || 'Misslyckades'}</div>`;
  }
}

// ── Show/Hide stage-specific cards ───────────────────────────
function showStageCards(customer) {
  const stage = customer.stage;

  // Hide all stage-specific cards
  const cards = ['cost-editor-card', 'order-form-card', 'startup-form-card', 'activate-card', 'presentation-card-standalone'];
  cards.forEach(id => {
    const el = $(`#${id}`);
    if (el) el.style.display = 'none';
  });

  // Show relevant cards based on stage
  switch (stage) {
    case 'analys':
    case 'presentation':
      showCostEditor(customer);
      break;
    case 'forsaljning':
      showOrderForm(customer);
      break;
    case 'orderbekraftelse':
      showStartupForm(customer);
      break;
    case 'uppstart':
      showStartupForm(customer);
      break;
    case 'atgardsplan':
      const activateCard = $('#activate-card');
      if (activateCard) activateCard.style.display = 'block';
      break;
    case 'aktiv':
    case 'completed':
      const presCard = $('#presentation-card-standalone');
      if (presCard) presCard.style.display = 'block';
      break;
  }
}

// ══════════════════════════════════════════
// ONBOARDING STATUS
// ══════════════════════════════════════════

function getHealthDot(customerId) {
  const customer = _onboardingData.find(c => c.customer_id === customerId);
  if (!customer) return '';
  const color = customer.health === 'green' ? '#10b981' : customer.health === 'yellow' ? '#f59e0b' : '#ef4444';
  const title = customer.missing.length > 0 ? `Saknar: ${customer.missing.join(', ')}` : 'Redo för automation';
  return `<span class="health-dot" style="background:${color}" title="${title}"></span>`;
}

async function loadOnboardingStatus() {
  const data = await api('/api/customers/onboarding-status');
  if (!data) return;

  _onboardingData = data.customers || [];
  const summary = data.summary || {};

  // Summary badge
  const summaryEl = document.getElementById('onboard-summary');
  if (summaryEl) {
    const readyColor = summary.automation_ready > 0 ? '#10b981' : '#ef4444';
    summaryEl.innerHTML = `<span style="color:${readyColor};font-weight:600">${summary.automation_ready}/${summary.total}</span> <span style="color:#94a3b8">redo för automation</span>`;
  }

  // Update stats card with active/total
  const statCustomers = document.getElementById('stat-customers');
  if (statCustomers) {
    statCustomers.innerHTML = `${summary.automation_ready}<span style="color:#94a3b8;font-size:14px">/${summary.total}</span>`;
  }

  // Table
  const tableEl = document.getElementById('onboarding-table');
  if (!tableEl) return;

  if (_onboardingData.length === 0) {
    tableEl.innerHTML = '<p class="empty">Inga kunder i systemet.</p>';
    return;
  }

  // Sort: red first, then yellow, then green
  const sorted = [..._onboardingData].sort((a, b) => {
    const order = { red: 0, yellow: 1, green: 2 };
    return (order[a.health] || 0) - (order[b.health] || 0);
  });

  tableEl.innerHTML = `
    <table class="data-table onboarding-table">
      <thead>
        <tr>
          <th style="width:30px"></th>
          <th>Företag</th>
          <th>Domän</th>
          <th>Stadium</th>
          <th>Saknas</th>
          <th style="width:120px">Åtgärd</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.map(c => {
          const dotColor = c.health === 'green' ? '#10b981' : c.health === 'yellow' ? '#f59e0b' : '#ef4444';
          const domain = c.website_url ? c.website_url.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '') : '—';
          const missingTags = c.missing.map(m => `<span class="missing-tag">${m}</span>`).join(' ');
          return `
            <tr class="onboarding-row" onclick="showCustomerDetail('${c.customer_id}', '${c.website_url || ''}')" style="cursor:pointer">
              <td><span class="health-dot" style="background:${dotColor}"></span></td>
              <td style="font-weight:500;color:#fff">${CUSTOMER_NAMES[c.customer_id] || c.company_name || c.customer_id}</td>
              <td style="color:#94a3b8;font-size:13px">${domain}</td>
              <td><span class="tag tag--${stageTagColor(c.stage)}">${c.stage}</span></td>
              <td>${c.missing.length > 0 ? missingTags : '<span style="color:#10b981">✓ Komplett</span>'}</td>
              <td>${c.completeness.automation_ready ? '<span style="color:#10b981;font-size:12px">Automation redo</span>' : '<span style="color:#ef4444;font-size:12px">Behöver config</span>'}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function stageTagColor(stage) {
  const map = { analys: 'medium', presentation: 'schema', forsaljning: 'links', orderbekraftelse: 'metadata', uppstart: 'content', atgardsplan: 'technical', aktiv: 'low', completed: 'info', churned: 'high' };
  return map[stage] || 'metadata';
}

// ══════════════════════════════════════════
// CREDENTIALS MANAGEMENT
// ══════════════════════════════════════════

async function saveCredentials() {
  const statusEl = document.getElementById('cred-save-status');
  const customerId = _currentCustomerId;
  if (!customerId) {
    statusEl.textContent = 'Ingen kund vald';
    statusEl.className = 'save-status error';
    return;
  }

  const body = {};
  const user = document.getElementById('cred-wp-user').value.trim();
  const pass = document.getElementById('cred-wp-pass').value.trim();
  const gsc = document.getElementById('cred-gsc').value.trim();
  const email = document.getElementById('cred-email').value.trim();
  const ga4 = document.getElementById('cred-ga4').value.trim();
  const gtm = document.getElementById('cred-gtm').value.trim();
  const gads = document.getElementById('cred-gads').value.trim();
  const meta = document.getElementById('cred-meta').value.trim();

  if (user) body.wordpress_username = user;
  if (pass) body.wordpress_app_password = pass;
  if (gsc) body.gsc_property = gsc;
  if (email) body.contact_email = email;
  if (ga4) body.ga4_property_id = ga4;
  if (gtm) body.gtm_container_id = gtm;
  if (gads) body.google_ads_id = gads;
  if (meta) body.meta_pixel_id = meta;
  body.test_connection = !!(user || pass);

  if (Object.keys(body).length <= 1) {
    statusEl.textContent = 'Fyll i minst ett fält';
    statusEl.className = 'save-status error';
    return;
  }

  statusEl.textContent = 'Sparar...';
  statusEl.className = 'save-status';

  const result = await api(`/api/customers/${customerId}/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (result?.success) {
    statusEl.textContent = `✓ Uppdaterat: ${result.updated.join(', ')}`;
    statusEl.className = 'save-status success';

    if (result.wp_connection) {
      const testEl = document.getElementById('cred-test-result');
      if (result.wp_connection.success) {
        testEl.innerHTML = `<div class="wp-test-ok">✅ WordPress-anslutning OK — ${result.wp_connection.posts_found} inlägg hittade</div>`;
      } else {
        testEl.innerHTML = `<div class="wp-test-fail">❌ WP-anslutning misslyckades: ${result.wp_connection.error}</div>`;
      }
    }

    // Clear fields after save
    document.getElementById('cred-wp-user').value = '';
    document.getElementById('cred-wp-pass').value = '';
    document.getElementById('cred-gsc').value = '';
    document.getElementById('cred-email').value = '';
    document.getElementById('cred-ga4').value = '';
    document.getElementById('cred-gtm').value = '';
    document.getElementById('cred-gads').value = '';
    document.getElementById('cred-meta').value = '';

    // Refresh onboarding data
    loadOnboardingStatus();
  } else {
    statusEl.textContent = result?.error || 'Fel vid sparning';
    statusEl.className = 'save-status error';
  }
}

async function testWpConnection() {
  const customerId = _currentCustomerId;
  if (!customerId) return;

  const testEl = document.getElementById('cred-test-result');
  testEl.innerHTML = '<div style="color:#94a3b8">Testar anslutning...</div>';

  const result = await api(`/api/customers/${customerId}/test-wp-connection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  if (result?.success) {
    testEl.innerHTML = `<div class="wp-test-ok">✅ WordPress REST API fungerar<br>URL: ${result.url}<br>Inlägg: ${result.posts_found} | Sidor: ${result.pages_found}</div>`;
  } else {
    testEl.innerHTML = `<div class="wp-test-fail">❌ Anslutning misslyckades<br>${result?.error || 'Okänt fel'}<br>${result?.hint ? '<em>' + result.hint + '</em>' : ''}</div>`;
  }
}

function loadCredentialsTab(customerId) {
  // Show current credentials status
  const currentEl = document.getElementById('cred-current');
  if (!currentEl) return;

  const customer = _onboardingData.find(c => c.customer_id === customerId);
  if (!customer) {
    currentEl.innerHTML = '<p style="color:#94a3b8">Laddar credential-status...</p>';
    return;
  }

  const items = [
    { label: 'WP-användarnamn', ok: customer.completeness.has_username },
    { label: 'WP App-lösenord', ok: customer.completeness.has_app_password },
    { label: 'GSC Property', ok: customer.completeness.has_gsc },
    { label: 'ABC-nyckelord', ok: customer.completeness.has_keywords }
  ];

  currentEl.innerHTML = `
    <div style="border-top:1px solid #1e293b;padding-top:12px">
      <h4 style="color:#94a3b8;margin:0 0 8px;font-size:13px">Nuvarande status</h4>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        ${items.map(i => `
          <div style="display:flex;align-items:center;gap:6px;font-size:13px">
            <span style="color:${i.ok ? '#10b981' : '#ef4444'}">${i.ok ? '✓' : '✗'}</span>
            <span style="color:${i.ok ? '#94a3b8' : '#fff'}">${i.label}</span>
          </div>
        `).join('')}
      </div>
      <div style="margin-top:8px;font-size:13px;color:${customer.completeness.automation_ready ? '#10b981' : '#ef4444'}">
        ${customer.completeness.automation_ready ? '✓ Redo för automatisk optimering' : '✗ Saknar credentials för automation'}
      </div>
    </div>
  `;
}
