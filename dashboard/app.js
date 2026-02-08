// Searchboost Opti — Dashboard App
// Connects to MCP server API on EC2

const API_BASE = '';
const PW_HASH = '-9pkod';
const VALID_USERS = ['fk0v1o', 'cyt5oy']; // mikael@searchboost.se, web.searchboost@gmail.com

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

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
  if (VALID_USERS.includes(userHash) && pwHash === PW_HASH) {
    sessionStorage.setItem('opti_auth', '1');
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('appShell').style.display = 'block';
    loadOverview();
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

// Auto-login if session exists
(function() {
  if (sessionStorage.getItem('opti_auth') === '1') {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('appShell').style.display = 'block';
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

// ── API Fetch with error handling ─────────────────────────────
async function api(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error(`API error (${endpoint}):`, err);
    return null;
  }
}

// ── Time formatting ───────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
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

  // Update stats
  $('#stat-customers').textContent = customers?.customers?.length || '0';
  $('#stat-optimizations').textContent = optimizations?.optimizations?.length || '0';
  $('#stat-queue').textContent = queue?.queue?.length || '0';
  $('#stat-score').textContent = '—';

  // Update status
  const dot = $('.status-dot');
  const statusText = $('#status-text');
  if (customers) {
    dot.classList.add('connected');
    dot.classList.remove('error');
    statusText.textContent = 'Ansluten';
  } else {
    dot.classList.add('error');
    dot.classList.remove('connected');
    statusText.textContent = 'Offline';
  }

  // Recent optimizations
  const recentEl = $('#recent-optimizations');
  if (optimizations?.optimizations?.length > 0) {
    recentEl.innerHTML = optimizations.optimizations.slice(0, 8).map(opt => `
      <div class="list-item">
        <div class="list-item-left">
          <div class="list-item-title">${opt.optimization_type.replace(/_/g, ' ')}</div>
          <div class="list-item-sub">${opt.page_url || opt.site_url} &middot; ${timeAgo(opt.timestamp)}</div>
        </div>
        <div class="list-item-right">
          <span class="tag tag--${typeTag(opt.optimization_type)}">${opt.optimization_type}</span>
        </div>
      </div>
    `).join('');
  } else {
    recentEl.innerHTML = '<p class="empty">Inga optimeringar \u00e4n. Systemet startar n\u00e4r WordPress-sites \u00e4r konfigurerade.</p>';
  }

  // Customers (clickable, sorted alphabetically)
  const custEl = $('#customer-list');
  if (customers?.customers?.length > 0) {
    const sorted = [...customers.customers].sort((a, b) => a.id.localeCompare(b.id, 'sv'));
    custEl.innerHTML = sorted.map(c => {
      const initials = c.url.replace(/https?:\/\/(www\.)?/, '').substring(0, 2).toUpperCase();
      const domain = c.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '');
      return `
        <div class="customer-item customer-item--clickable" onclick="showCustomerDetail('${c.id}', '${c.url}')">
          <div class="customer-avatar">${initials}</div>
          <div class="customer-info">
            <div class="customer-name">${c.id}</div>
            <div class="customer-url">${domain}</div>
          </div>
          <div class="customer-arrow">&rsaquo;</div>
        </div>
      `;
    }).join('');
  } else {
    custEl.innerHTML = '<p class="empty">Inga kunder konfigurerade \u00e4nnu. L\u00e4gg till WordPress-sites i SSM Parameter Store.</p>';
  }
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
            <th>Impact</th>
          </tr>
        </thead>
        <tbody>
          ${data.optimizations.map(opt => `
            <tr>
              <td>${timeAgo(opt.timestamp)}</td>
              <td><span class="tag tag--${typeTag(opt.optimization_type)}">${opt.optimization_type}</span></td>
              <td>${opt.site_url || '—'}</td>
              <td>${opt.page_url ? `<a href="${opt.page_url}" target="_blank">${new URL(opt.page_url).pathname}</a>` : '—'}</td>
              <td>${opt.impact_estimate ? (opt.impact_estimate * 10).toFixed(1) : '—'}</td>
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
              <td><span class="tag tag--${typeTag(task.task_type)}">${task.task_type}</span></td>
              <td>${task.customer_id}</td>
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
          <div class="report-meta">${report.recipient_list?.join(', ') || '—'}</div>
        </div>
        <div class="report-meta">${report.metrics_json ? JSON.parse(report.metrics_json).total + ' optimeringar' : '—'}</div>
      </div>
    `).join('');
  } else {
    el.innerHTML = '<p class="empty">Inga rapporter genererade \u00e4nnu. Rapporten skickas automatiskt varje m\u00e5ndag 08:00.</p>';
  }
}

// ── View router ───────────────────────────────────────────────
async function loadView(view) {
  switch (view) {
    case 'overview': return loadOverview();
    case 'optimizations': return loadOptimizations();
    case 'queue': return loadQueue();
    case 'reports': return loadReports();
  }
}

// ── Customer Detail ───────────────────────────────────────────

async function showCustomerDetail(customerId, customerUrl) {
  // Switch to detail view
  $$('.nav-link').forEach(l => l.classList.remove('active'));
  $$('.view').forEach(v => v.classList.remove('active'));
  $('#view-customer-detail').classList.add('active');

  const initials = customerUrl.replace(/https?:\/\/(www\.)?/, '').substring(0, 2).toUpperCase();
  const domain = customerUrl.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '');

  $('#detail-avatar').textContent = initials;
  $('#detail-name').textContent = customerId;
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
  $('#detail-stat-types').textContent = data.stats.by_type?.length || 0;

  // Optimizations list
  const optEl = $('#detail-optimizations');
  if (data.optimizations?.length > 0) {
    optEl.innerHTML = data.optimizations.map(opt => `
      <div class="list-item">
        <div class="list-item-left">
          <div class="list-item-title">${opt.optimization_type?.replace(/_/g, ' ') || '—'}</div>
          <div class="list-item-sub">${opt.page_url || opt.site_url || '—'} &middot; ${timeAgo(opt.timestamp)}</div>
        </div>
        <div class="list-item-right">
          <span class="tag tag--${typeTag(opt.optimization_type)}">${opt.optimization_type}</span>
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
          <div class="list-item-title">${task.task_type?.replace(/_/g, ' ') || '—'}</div>
          <div class="list-item-sub">${task.page_url || '—'}</div>
        </div>
        <div class="list-item-right">
          <span class="tag tag--${severityTag(task.priority)}">${task.priority}</span>
          <span class="tag tag--${task.status}">${task.status}</span>
        </div>
      </div>
    `).join('');
  } else {
    qEl.innerHTML = '<p class="empty">Ingen aktiv arbetskö.</p>';
  }

  // Load SE Ranking positions (async, don't block)
  loadRankings(customerId);
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
    rankEl.innerHTML = `
      <div class="ranking-summary">
        <span class="tag tag--links">Topp 3: ${rankData.stats.top3}</span>
        <span class="tag tag--schema">Topp 10: ${rankData.stats.top10}</span>
        <span class="tag tag--content">Topp 30: ${rankData.stats.top30}</span>
        <span class="detail-badge">${rankData.date}</span>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Sökord</th>
            <th>Position</th>
            <th>Förändring</th>
            <th>Volym</th>
          </tr>
        </thead>
        <tbody>
          ${rankData.rankings.map(r => {
            const posClass = !r.position ? '' : r.position <= 3 ? 'rank-top3' : r.position <= 10 ? 'rank-top10' : r.position <= 30 ? 'rank-top30' : '';
            const changeHtml = r.change > 0
              ? `<span class="rank-up">+${r.change}</span>`
              : r.change < 0
              ? `<span class="rank-down">${r.change}</span>`
              : '<span class="rank-same">—</span>';
            return `
              <tr>
                <td><strong>${r.keyword}</strong></td>
                <td><span class="rank-pos ${posClass}">${r.position ?? '—'}</span></td>
                <td>${changeHtml}</td>
                <td>${r.volume ?? '—'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } else {
    rankEl.innerHTML = '<p class="empty">Inga sökord konfigurerade i SE Ranking för denna kund.</p>';
  }

// Back button
document.getElementById('back-to-overview')?.addEventListener('click', (e) => {
  e.preventDefault();
  $$('.view').forEach(v => v.classList.remove('active'));
  $('#view-overview').classList.add('active');
  $$('.nav-link').forEach(l => l.classList.remove('active'));
  $('[data-view="overview"]').classList.add('active');
});

// ── Init ──────────────────────────────────────────────────────
if (sessionStorage.getItem('opti_auth') === '1') {
  loadOverview();
}

// Auto-refresh every 30 seconds
setInterval(() => {
  if (sessionStorage.getItem('opti_auth') !== '1') return;
  const activeView = $('.nav-link.active')?.dataset.view || 'overview';
  loadView(activeView);
}, 30000);
