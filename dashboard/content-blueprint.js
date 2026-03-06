// ── Content Blueprint ─────────────────────────────────────────────────────
// Laddar och renderar content blueprints + Viktor-flödet
// Inkluderas i app.js via append nedan (eller lägg <script src="content-blueprint.js"> i HTML)

let _blueprintData = [];
let _blueprintFiltered = [];

async function loadContentBlueprint() {
  const gridEl = $('#blueprint-grid');
  if (gridEl) gridEl.innerHTML = '<p class="empty">Laddar...</p>';

  // Hämta tillgängliga månader för dropdownen
  try {
    const monthData = await api('/api/content-blueprint/months');
    const monthSelect = $('#cb-filter-month');
    if (monthSelect && monthData?.months?.length > 0) {
      const current = monthSelect.value;
      const opts = monthData.months.map(m =>
        `<option value="${m}" ${m === current ? 'selected' : ''}>${m}</option>`
      ).join('');
      monthSelect.innerHTML = `<option value="">Senaste per kund</option>${opts}`;
    }
  } catch (e) {}

  // Hämta blueprints
  const month = $('#cb-filter-month')?.value || '';
  const url = month
    ? `/api/content-blueprints?month=${encodeURIComponent(month)}`
    : '/api/content-blueprints';

  const data = await api(url);
  _blueprintData = data?.blueprints || [];

  // Populera kund-filter
  const customerSelect = $('#cb-filter-customer');
  const triggerSelect = $('#cb-trigger-customer');
  if (customerSelect) {
    const uniqueCustomers = [...new Map(_blueprintData.map(b => [b.customer_id, b])).values()];
    customerSelect.innerHTML = '<option value="">Alla kunder</option>' +
      uniqueCustomers.map(b => `<option value="${b.customer_id}">${b.company_name || b.customer_id}</option>`).join('');
  }
  if (triggerSelect) {
    // Hämta alla aktiva kunder för trigger-panelen
    const cData = await api('/api/customers');
    const allCustomers = cData?.customers || _blueprintData;
    triggerSelect.innerHTML = '<option value="">Välj kund...</option>' +
      allCustomers.map(c => `<option value="${c.customer_id || c.id}">${c.company_name || c.customer_id || c.id}</option>`).join('');
  }

  // Beräkna stats
  const totalArticles = _blueprintData.reduce((s, b) => s + (b.articles?.length || 0), 0);
  const totalWins = _blueprintData.reduce((s, b) => s + (b.quick_wins?.length || 0), 0);
  const uniqueC = new Set(_blueprintData.map(b => b.customer_id)).size;

  const setV = (id, v) => { const el = $(`#${id}`); if (el) el.textContent = v; };
  setV('cb-stat-total', _blueprintData.length);
  setV('cb-stat-articles', totalArticles);
  setV('cb-stat-wins', totalWins);
  setV('cb-stat-customers', uniqueC);

  // Rendera med aktiv kundfilter
  const activeFilter = $('#cb-filter-customer')?.value || '';
  _blueprintFiltered = activeFilter
    ? _blueprintData.filter(b => b.customer_id === activeFilter)
    : _blueprintData;

  renderBlueprintGrid(_blueprintFiltered);
  renderViktorTodoList(_blueprintFiltered);
}

function filterBlueprintByCustomer(customerId) {
  _blueprintFiltered = customerId
    ? _blueprintData.filter(b => b.customer_id === customerId)
    : _blueprintData;
  renderBlueprintGrid(_blueprintFiltered);
  renderViktorTodoList(_blueprintFiltered);
}

function renderBlueprintGrid(blueprints) {
  const el = $('#blueprint-grid');
  if (!el) return;

  if (!blueprints || blueprints.length === 0) {
    el.innerHTML = `
      <div style="grid-column:1/-1">
        <div class="card" style="text-align:center;padding:40px">
          <div style="font-size:36px;margin-bottom:12px">📋</div>
          <p style="color:#888;margin:0 0 8px 0">Inga content blueprints ännu.</p>
          <p style="color:#666;font-size:13px;margin:0">Blueprints genereras automatiskt den 1:a varje månad.<br>Trigga manuellt nedan för att skapa en nu.</p>
        </div>
      </div>`;
    return;
  }

  el.innerHTML = blueprints.map(b => renderBlueprintCard(b)).join('');
}

function renderBlueprintCard(b) {
  const articles = b.articles || [];
  const wins = b.quick_wins || [];
  const createdAt = b.created_at ? new Date(b.created_at).toLocaleDateString('sv-SE') : '—';

  const statusColor = { active: '#22c55e', draft: '#eab308', archived: '#666' }[b.status] || '#00d4ff';
  const statusLabel = { active: 'Aktiv', draft: 'Utkast', archived: 'Arkiverad' }[b.status] || b.status || 'Aktiv';

  const articlesHtml = articles.slice(0, 3).map((a, i) => {
    const title = typeof a === 'string' ? a : (a.title || a.keyword || JSON.stringify(a));
    const kw = typeof a === 'object' ? (a.primary_keyword || a.keyword || '') : '';
    const diff = typeof a === 'object' ? (a.difficulty || '') : '';
    return `
      <div class="bp-article-row">
        <span class="bp-article-num">${i + 1}</span>
        <div class="bp-article-info">
          <div class="bp-article-title">${title}</div>
          ${kw ? `<div class="bp-article-meta">${kw}${diff ? ' · ' + diff : ''}</div>` : ''}
        </div>
      </div>`;
  }).join('');

  const moreArticles = articles.length > 3
    ? `<div style="color:#888;font-size:12px;margin-top:6px">+${articles.length - 3} till...</div>`
    : '';

  const winsHtml = wins.slice(0, 3).map(w =>
    `<div class="bp-win-item">✓ ${typeof w === 'string' ? w : (w.task || w.title || JSON.stringify(w))}</div>`
  ).join('');

  const moreWins = wins.length > 3
    ? `<div style="color:#888;font-size:12px;margin-top:4px">+${wins.length - 3} till...</div>`
    : '';

  return `
    <div class="blueprint-card">
      <div class="blueprint-card-header">
        <div>
          <div class="blueprint-card-company">${b.company_name || b.customer_id}</div>
          <div class="blueprint-card-month">${b.month || '—'}</div>
        </div>
        <span class="bp-status-badge" style="background:${statusColor}20;color:${statusColor};border-color:${statusColor}40">${statusLabel}</span>
      </div>

      ${b.theme ? `<div class="bp-theme"><span style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px">Tema</span><div style="color:#e91e8c;font-weight:600;margin-top:2px">${b.theme}</div></div>` : ''}

      ${articles.length > 0 ? `
        <div class="bp-section">
          <div class="bp-section-title">Artiklar (${articles.length})</div>
          ${articlesHtml}
          ${moreArticles}
        </div>` : ''}

      ${wins.length > 0 ? `
        <div class="bp-section">
          <div class="bp-section-title">Quick wins (${wins.length})</div>
          ${winsHtml}
          ${moreWins}
        </div>` : ''}

      ${b.monthly_goal ? `
        <div class="bp-goal">
          <span style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px">Mål</span>
          <div style="color:#e0e0e0;font-size:13px;margin-top:2px">${b.monthly_goal}</div>
        </div>` : ''}

      <div class="bp-footer">
        <span style="color:#666;font-size:11px">Genererad ${createdAt}</span>
        <button class="btn-small btn-ghost" onclick="showBlueprintDetail('${b.customer_id}')">Visa allt →</button>
      </div>
    </div>`;
}

function renderViktorTodoList(blueprints) {
  const el = $('#viktor-todo-list');
  if (!el) return;

  // Viktor-flödet: extrahera quick wins från alla aktiva blueprints → sorterade uppgiftslista
  const todos = [];
  for (const b of blueprints) {
    const wins = b.quick_wins || [];
    for (const w of wins) {
      const task = typeof w === 'string' ? w : (w.task || w.title || '');
      if (task) {
        todos.push({
          task,
          customer: b.company_name || b.customer_id,
          customerId: b.customer_id,
          month: b.month,
          priority: typeof w === 'object' ? (w.priority || 'medium') : 'medium'
        });
      }
    }
  }

  if (todos.length === 0) {
    el.innerHTML = '<p class="empty">Inga quick wins att visa. Generera blueprints för dina aktiva kunder.</p>';
    return;
  }

  // Sortera: high → medium → low
  const pOrder = { high: 0, medium: 1, low: 2 };
  todos.sort((a, b) => (pOrder[a.priority] || 1) - (pOrder[b.priority] || 1));

  const priorityColor = { high: '#ef4444', medium: '#eab308', low: '#22c55e' };
  const priorityLabel = { high: 'Hög', medium: 'Medium', low: 'Låg' };

  el.innerHTML = `
    <div class="viktor-flow-intro">
      <span style="color:#00d4ff;font-size:13px">
        ${todos.length} konkreta uppgifter från ${blueprints.length} aktiva blueprints
      </span>
    </div>
    <div class="viktor-todo-grid">
      ${todos.slice(0, 12).map((t, i) => `
        <div class="viktor-todo-item" onclick="showBlueprintDetail('${t.customerId}')">
          <div class="viktor-todo-num">${i + 1}</div>
          <div class="viktor-todo-body">
            <div class="viktor-todo-task">${t.task}</div>
            <div class="viktor-todo-meta">
              <span style="color:#888">${t.customer}</span>
              <span style="color:#666"> · ${t.month || '—'}</span>
            </div>
          </div>
          <span class="viktor-priority-badge" style="color:${priorityColor[t.priority] || '#888'}">
            ${priorityLabel[t.priority] || t.priority}
          </span>
        </div>`).join('')}
    </div>
    ${todos.length > 12 ? `<div style="text-align:center;color:#666;font-size:13px;margin-top:12px">+${todos.length - 12} fler uppgifter</div>` : ''}`;
}

// Modal: visa alla detaljer för en kunds blueprint-historik
async function showBlueprintDetail(customerId) {
  const data = await api(`/api/content-blueprints/${customerId}`);
  const blueprints = data?.blueprints || [];
  if (blueprints.length === 0) return;

  const latest = blueprints[0];
  const articles = latest.articles || [];
  const wins = latest.quick_wins || [];

  const articlesHtml = articles.map((a, i) => {
    const title = typeof a === 'string' ? a : (a.title || a.keyword || '');
    const kw = typeof a === 'object' ? (a.primary_keyword || a.keyword || '') : '';
    const intent = typeof a === 'object' ? (a.search_intent || '') : '';
    const diff = typeof a === 'object' ? (a.difficulty || '') : '';
    const format = typeof a === 'object' ? (a.format || '') : '';
    return `
      <tr>
        <td style="color:#e91e8c;font-weight:600;font-size:13px">${i + 1}</td>
        <td style="color:#e2e8f0;font-size:13px">${title}</td>
        <td style="color:#94a3b8;font-size:12px">${kw}</td>
        <td style="color:#94a3b8;font-size:12px">${intent}</td>
        <td style="color:#94a3b8;font-size:12px">${format}</td>
        <td style="color:#94a3b8;font-size:12px">${diff}</td>
      </tr>`;
  }).join('');

  const winsHtml = wins.map(w => {
    const task = typeof w === 'string' ? w : (w.task || w.title || '');
    const prio = typeof w === 'object' ? (w.priority || '') : '';
    const pColor = { high: '#ef4444', medium: '#eab308', low: '#22c55e' }[prio] || '#888';
    return `<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;gap:12px;align-items:center">
      <span style="color:#22c55e">✓</span>
      <span style="color:#e2e8f0;font-size:13px;flex:1">${task}</span>
      ${prio ? `<span style="color:${pColor};font-size:11px;text-transform:uppercase">${prio}</span>` : ''}
    </div>`;
  }).join('');

  // Bygg modal-innehåll och visa i customer detail (navigera dit)
  // Enklare: visa som en inline expand på samma sida
  alert(`Blueprint ${latest.month}: ${latest.company_name}\n\nTema: ${latest.theme || '—'}\n\n${articles.length} artiklar, ${wins.length} quick wins\n\nMål: ${latest.monthly_goal || '—'}`);
  // TODO: ersätt alert med proper modal när tid finns
}

async function triggerBlueprint() {
  const customerId = $('#cb-trigger-customer')?.value;
  const statusEl = $('#cb-trigger-status');
  if (!customerId) {
    if (statusEl) { statusEl.textContent = 'Välj en kund först'; statusEl.style.color = '#ef4444'; }
    return;
  }
  if (statusEl) { statusEl.textContent = 'Triggar...'; statusEl.style.color = '#00d4ff'; }
  try {
    const res = await api('/api/content-blueprints/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customerId })
    });
    if (res?.success) {
      if (statusEl) { statusEl.textContent = 'Startad — klart om ~60 sek'; statusEl.style.color = '#22c55e'; }
      setTimeout(() => loadContentBlueprint(), 65000);
    } else {
      if (statusEl) { statusEl.textContent = 'Fel: ' + (res?.error || 'okänt'); statusEl.style.color = '#ef4444'; }
    }
  } catch (e) {
    if (statusEl) { statusEl.textContent = 'Fel: ' + e.message; statusEl.style.color = '#ef4444'; }
  }
}
