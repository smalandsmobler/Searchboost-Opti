// Searchboost Opti — Dashboard App
// Connects to MCP server API on EC2

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://api.opti.searchboost.se'; // Update with actual API URL

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

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

  // Customers
  const custEl = $('#customer-list');
  if (customers?.customers?.length > 0) {
    custEl.innerHTML = customers.customers.map(c => {
      const initials = c.url.replace(/https?:\/\/(www\.)?/, '').substring(0, 2).toUpperCase();
      const domain = c.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '');
      return `
        <div class="customer-item">
          <div class="customer-avatar">${initials}</div>
          <div class="customer-info">
            <div class="customer-name">${c.id}</div>
            <div class="customer-url">${domain}</div>
          </div>
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

// ── Init ──────────────────────────────────────────────────────
loadOverview();

// Auto-refresh every 30 seconds
setInterval(() => {
  const activeView = $('.nav-link.active')?.dataset.view || 'overview';
  loadView(activeView);
}, 30000);
