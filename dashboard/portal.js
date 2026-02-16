// ══════════════════════════════════════════════════════════════
// Searchboost Opti — Kundportal Frontend
// JWT-baserad auth, data-hamtning, ApexCharts-gauges, AI-chatt
// ══════════════════════════════════════════════════════════════

const PORTAL_API_BASE = '';

// ── DOM helpers ──
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── State ──
let _portalToken = null;
let _portalCustomer = null;
let _gaugeCharts = {};
let _refreshTimer = null;

// ══════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════

function portalLogin() {
  const email = $('#loginEmail').value.trim().toLowerCase();
  const password = $('#loginPassword').value;
  if (!email || !password) return;

  const btn = document.querySelector('.login-btn');
  btn.textContent = 'Loggar in...';
  btn.disabled = true;

  fetch(`${PORTAL_API_BASE}/api/portal/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  .then(res => {
    if (!res.ok) throw new Error('Ogiltiga uppgifter');
    return res.json();
  })
  .then(data => {
    _portalToken = data.token;
    _portalCustomer = data.customer;
    sessionStorage.setItem('portal_token', data.token);
    sessionStorage.setItem('portal_customer', JSON.stringify(data.customer));
    showApp();
  })
  .catch(err => {
    const errEl = $('#loginError');
    errEl.style.display = 'block';
    errEl.textContent = err.message || 'Fel e-post eller losenord';
    btn.textContent = 'Logga in';
    btn.disabled = false;
  });
}

function portalLogout() {
  _portalToken = null;
  _portalCustomer = null;
  sessionStorage.removeItem('portal_token');
  sessionStorage.removeItem('portal_customer');
  if (_refreshTimer) clearInterval(_refreshTimer);
  $('#appShell').style.display = 'none';
  $('#loginOverlay').style.display = '';
  $('#loginEmail').value = '';
  $('#loginPassword').value = '';
  $('#loginError').style.display = 'none';
  document.querySelector('.login-btn').textContent = 'Logga in';
  document.querySelector('.login-btn').disabled = false;
}

function showApp() {
  $('#loginOverlay').style.display = 'none';
  $('#appShell').style.display = 'block';

  // Header
  $('#headerName').textContent = _portalCustomer.name || _portalCustomer.id;
  $('#headerUrl').textContent = _portalCustomer.url || '';

  // Welcome
  const firstName = (_portalCustomer.name || '').split(' ')[0] || 'Kund';
  $('#welcomeTitle').textContent = `Valkomna, ${firstName}!`;

  const now = new Date();
  const months = ['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'];
  const weekdays = ['sondag','mandag','tisdag','onsdag','torsdag','fredag','lordag'];
  $('#welcomeDate').textContent = `${weekdays[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

  loadDashboard();

  // Auto-refresh var 5:e minut
  if (_refreshTimer) clearInterval(_refreshTimer);
  _refreshTimer = setInterval(loadDashboard, 300000);
}

// Auto-login fran session
(function() {
  const savedToken = sessionStorage.getItem('portal_token');
  const savedCustomer = sessionStorage.getItem('portal_customer');
  if (savedToken && savedCustomer) {
    _portalToken = savedToken;
    try {
      _portalCustomer = JSON.parse(savedCustomer);
    } catch(e) {
      portalLogout();
      return;
    }
    // Verifiera token
    portalApi('/api/portal/me')
      .then(() => showApp())
      .catch(() => portalLogout());
  }
})();

// ══════════════════════════════════════════════════════════════
// API HELPER
// ══════════════════════════════════════════════════════════════

async function portalApi(endpoint, options) {
  if (!options) options = {};
  if (!options.headers) options.headers = {};
  options.headers['Authorization'] = `Bearer ${_portalToken}`;
  if (options.body && !options.headers['Content-Type']) {
    options.headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${PORTAL_API_BASE}${endpoint}`, options);
  if (res.status === 401) {
    portalLogout();
    throw new Error('Sessionen har gatt ut');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

// ══════════════════════════════════════════════════════════════
// LOAD DASHBOARD — Parallell datahämtning
// ══════════════════════════════════════════════════════════════

async function loadDashboard() {
  if (!_portalCustomer) return;
  const cid = _portalCustomer.id;

  const [perfData, rankings, stats, planData, optimizations] = await Promise.all([
    portalApi(`/api/customers/${cid}/performance`).catch(() => null),
    portalApi(`/api/customers/${cid}/rankings`).catch(() => null),
    portalApi(`/api/customers/${cid}/stats`).catch(() => null),
    portalApi(`/api/customers/${cid}/action-plan`).catch(() => null),
    portalApi(`/api/optimizations?customer_id=${cid}`).catch(() => null)
  ]);

  renderGauges(perfData, rankings, planData);
  renderKeywords(rankings);
  renderOptimizations(optimizations);
  renderActionPlan(planData);
}

// ══════════════════════════════════════════════════════════════
// GAUGES (ApexCharts radialBar)
// ══════════════════════════════════════════════════════════════

function renderSingleGauge(elementId, value, maxValue, color, invertScale) {
  if (_gaugeCharts[elementId]) {
    _gaugeCharts[elementId].destroy();
  }

  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = '';

  let percent;
  if (invertScale) {
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
  };

  const chart = new ApexCharts(el, options);
  chart.render();
  _gaugeCharts[elementId] = chart;
}

function setDelta(elementId, current, previous, invertScale) {
  const el = document.getElementById(elementId);
  if (!el) return;

  if (previous === null || previous === undefined) {
    el.textContent = '';
    el.className = 'gauge-delta neutral';
    return;
  }

  const diff = current - previous;
  let isPositive;
  if (invertScale) {
    isPositive = diff < 0;
  } else {
    isPositive = diff > 0;
  }

  const sign = diff > 0 ? '+' : '';
  const displayVal = invertScale ? diff.toFixed(1) : Math.round(diff);
  el.textContent = `${sign}${displayVal} fran forra veckan`;
  el.className = `gauge-delta ${isPositive ? 'positive' : diff === 0 ? 'neutral' : 'negative'}`;
}

async function renderGauges(perfData, rankings, planData) {
  let mobileScore = 0, desktopScore = 0, prevMobile = null, prevDesktop = null;
  let seoPercent = 0;
  let avgPosition = 0;

  // Performance scores
  if (perfData && perfData.current) {
    mobileScore = perfData.current.mobile || 0;
    desktopScore = perfData.current.desktop || 0;
    if (perfData.previous) {
      prevMobile = perfData.previous.mobile;
      prevDesktop = perfData.previous.desktop;
    }
  }

  // SEO progress from action plan
  if (planData && planData.plan && planData.plan.months) {
    let total = 0, done = 0;
    planData.plan.months.forEach(function(m) {
      if (m.tasks) {
        total += m.tasks.length;
        done += m.tasks.filter(function(t) { return t.status === 'completed'; }).length;
      }
    });
    seoPercent = total > 0 ? Math.round((done / total) * 100) : 0;
  }

  // Average position from rankings
  if (rankings && rankings.rankings && rankings.rankings.length > 0) {
    const positions = rankings.rankings.map(function(r) { return r.position; }).filter(function(p) { return p > 0; });
    avgPosition = positions.length > 0 ? +(positions.reduce(function(a, b) { return a + b; }, 0) / positions.length).toFixed(1) : 0;
  }

  // Wait for ApexCharts to load
  if (typeof ApexCharts === 'undefined') {
    await new Promise(function(resolve) {
      var check = setInterval(function() {
        if (typeof ApexCharts !== 'undefined') { clearInterval(check); resolve(); }
      }, 100);
    });
  }

  renderSingleGauge('gauge-mobile', mobileScore, 100, '#ff2d9b', false);
  renderSingleGauge('gauge-desktop', desktopScore, 100, '#00d4ff', false);
  renderSingleGauge('gauge-seo', seoPercent, 100, '#a855f7', false);
  renderSingleGauge('gauge-position', avgPosition || 0, 50, '#22c55e', true);

  setDelta('delta-mobile', mobileScore, prevMobile, false);
  setDelta('delta-desktop', desktopScore, prevDesktop, false);
  setDelta('delta-seo', seoPercent, null, false);

  // Position delta from history
  if (perfData && perfData.history && perfData.history.length > 1) {
    var prevPos = perfData.history[perfData.history.length - 2];
    if (prevPos && prevPos.avgPosition) {
      setDelta('delta-position', avgPosition, prevPos.avgPosition, true);
    } else {
      setDelta('delta-position', avgPosition, null, true);
    }
  } else {
    setDelta('delta-position', avgPosition, null, true);
  }
}

// ══════════════════════════════════════════════════════════════
// KEYWORDS TABLE
// ══════════════════════════════════════════════════════════════

function renderKeywords(data) {
  const body = $('#keywordsBody');
  const summary = $('#keywordsSummary');

  if (!data || !data.rankings || data.rankings.length === 0) {
    body.innerHTML = '<div class="empty-state">Inga sokord att visa annu. Vi arbetar pa att samla in data.</div>';
    summary.innerHTML = '';
    return;
  }

  const rows = data.rankings;
  const top10 = rows.filter(function(r) { return r.position > 0 && r.position <= 10; }).length;
  const top30 = rows.filter(function(r) { return r.position > 0 && r.position <= 30; }).length;
  summary.innerHTML = '<strong>' + top10 + '</strong> sokord i topp 10 | <strong>' + top30 + '</strong> i topp 30 | <strong>' + rows.length + '</strong> totalt';

  // ABC keyword map
  var abcMap = {};
  if (data.abc_keywords) {
    ['a','b','c'].forEach(function(cat) {
      if (data.abc_keywords[cat]) {
        data.abc_keywords[cat].forEach(function(kw) {
          abcMap[(kw.keyword || kw).toLowerCase()] = cat;
        });
      }
    });
  }

  // Sort by position (best first)
  rows.sort(function(a, b) {
    var pa = a.position || 999;
    var pb = b.position || 999;
    return pa - pb;
  });

  var html = '<table class="data-table">';
  html += '<thead><tr>';
  html += '<th>Sokord</th><th>Klass</th><th>Position</th><th>Forandring</th><th>Klick</th><th>Visningar</th>';
  html += '</tr></thead><tbody>';

  rows.forEach(function(r) {
    var keyword = r.keyword || r.query || '';
    var pos = r.position || 0;
    var change = r.change || 0;
    var clicks = r.clicks || 0;
    var impressions = r.impressions || 0;
    var cat = abcMap[keyword.toLowerCase()] || '';

    // Position styling
    var posClass = 'rank-50plus';
    if (pos > 0 && pos <= 3) posClass = 'rank-top3';
    else if (pos <= 10) posClass = 'rank-top10';
    else if (pos <= 30) posClass = 'rank-top30';

    // Change styling
    var changeHtml = '<span class="pos-same">--</span>';
    if (change > 0) {
      changeHtml = '<span class="pos-up">+' + change + '</span>';
    } else if (change < 0) {
      changeHtml = '<span class="pos-down">' + change + '</span>';
    }

    // ABC badge
    var catHtml = '';
    if (cat === 'a') catHtml = '<span class="kw-cat kw-cat-a">A</span>';
    else if (cat === 'b') catHtml = '<span class="kw-cat kw-cat-b">B</span>';
    else if (cat === 'c') catHtml = '<span class="kw-cat kw-cat-c">C</span>';

    html += '<tr>';
    html += '<td style="color:var(--white);font-weight:500">' + escHtml(keyword) + '</td>';
    html += '<td>' + catHtml + '</td>';
    html += '<td><span class="rank-pos ' + posClass + '">' + (pos > 0 ? pos.toFixed(1) : '--') + '</span></td>';
    html += '<td>' + changeHtml + '</td>';
    html += '<td>' + formatNum(clicks) + '</td>';
    html += '<td>' + formatNum(impressions) + '</td>';
    html += '</tr>';
  });

  html += '</tbody></table>';
  body.innerHTML = html;
}

// ══════════════════════════════════════════════════════════════
// OPTIMIZATIONS TIMELINE
// ══════════════════════════════════════════════════════════════

function renderOptimizations(data) {
  const body = $('#optimizationsBody');
  const summary = $('#optSummary');

  if (!data || !data.optimizations || data.optimizations.length === 0) {
    body.innerHTML = '<div class="empty-state">Inga optimeringar att visa annu.</div>';
    summary.innerHTML = '';
    return;
  }

  var opts = data.optimizations;

  // Filter last 30 days
  var cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  var recent = opts.filter(function(o) {
    return new Date(o.timestamp || o.created_at) >= cutoff;
  });

  if (recent.length === 0) {
    recent = opts.slice(0, 10);
  }

  // Unique pages
  var pages = {};
  recent.forEach(function(o) { if (o.page_url) pages[o.page_url] = true; });
  var pageCount = Object.keys(pages).length;

  summary.innerHTML = 'Vi har optimerat <strong>' + pageCount + ' sidor</strong> denna manad (' + recent.length + ' atgarder totalt)';

  var html = '<div class="timeline">';
  recent.slice(0, 20).forEach(function(o) {
    var type = (o.optimization_type || o.type || 'metadata').toLowerCase();
    var iconClass = 'timeline-icon--metadata';
    var iconText = 'M';
    if (type.includes('schema')) { iconClass = 'timeline-icon--schema'; iconText = 'S'; }
    else if (type.includes('content')) { iconClass = 'timeline-icon--content'; iconText = 'C'; }
    else if (type.includes('manual')) { iconClass = 'timeline-icon--manual'; iconText = 'H'; }

    var title = o.optimization_type || o.type || 'Optimering';
    var desc = o.description || o.changes_made || '';
    var date = formatDate(o.timestamp || o.created_at);
    var pageUrl = o.page_url || '';

    html += '<div class="timeline-item">';
    html += '<div class="timeline-icon ' + iconClass + '">' + iconText + '</div>';
    html += '<div class="timeline-body">';
    html += '<div class="timeline-title">' + escHtml(title) + '</div>';
    if (desc) html += '<div class="timeline-desc">' + escHtml(desc) + '</div>';
    if (pageUrl) html += '<div class="timeline-desc" style="color:var(--neon-blue);margin-top:2px">' + escHtml(shortenUrl(pageUrl)) + '</div>';
    html += '</div>';
    html += '<div class="timeline-date">' + date + '</div>';
    html += '</div>';
  });
  html += '</div>';

  body.innerHTML = html;
}

// ══════════════════════════════════════════════════════════════
// ACTION PLAN
// ══════════════════════════════════════════════════════════════

function renderActionPlan(data) {
  const body = $('#planBody');

  if (!data || !data.plan || !data.plan.months || data.plan.months.length === 0) {
    body.innerHTML = '<div class="empty-state">Ingen atgardsplan skapad annu. Vi arbetar pa att ta fram en plan for er.</div>';
    return;
  }

  var months = data.plan.months;
  var html = '';

  months.forEach(function(month, idx) {
    var tasks = month.tasks || [];
    var total = tasks.length;
    var done = tasks.filter(function(t) { return t.status === 'completed'; }).length;
    var pct = total > 0 ? Math.round((done / total) * 100) : 0;

    var monthLabel = month.title || ('Manad ' + (idx + 1));
    var fillClass = 'plan-progress-fill--m' + (idx + 1);

    html += '<div class="plan-month">';
    html += '<div class="plan-month-header">';
    html += '<h4>' + escHtml(monthLabel) + '</h4>';
    html += '<span class="plan-progress-text">' + done + '/' + total + ' klara (' + pct + '%)</span>';
    html += '</div>';
    html += '<div class="plan-progress-bar"><div class="plan-progress-fill ' + fillClass + '" style="width:' + pct + '%"></div></div>';
    html += '<div class="plan-tasks">';

    tasks.forEach(function(task) {
      var isDone = task.status === 'completed';
      var doneClass = isDone ? ' plan-task--done' : '';
      var checkClass = isDone ? 'plan-task-check--done' : 'plan-task-check--pending';
      var checkIcon = isDone ? '&#10003;' : '&#9675;';

      html += '<div class="plan-task' + doneClass + '">';
      html += '<span class="plan-task-check ' + checkClass + '">' + checkIcon + '</span>';
      html += '<span class="plan-task-text">' + escHtml(task.description || task.task || '') + '</span>';
      html += '</div>';
    });

    html += '</div></div>';
  });

  body.innerHTML = html;
}

// ══════════════════════════════════════════════════════════════
// AI CHAT
// ══════════════════════════════════════════════════════════════

function sendChat() {
  var input = $('#chatInput');
  var message = input.value.trim();
  if (!message) return;

  var messagesEl = $('#chatMessages');
  var btn = $('#chatSendBtn');

  // Add user message
  var userDiv = document.createElement('div');
  userDiv.className = 'chat-msg chat-msg--user';
  userDiv.textContent = message;
  messagesEl.appendChild(userDiv);

  // Clear input
  input.value = '';
  btn.disabled = true;

  // Scroll to bottom
  messagesEl.scrollTop = messagesEl.scrollHeight;

  // Show typing indicator
  var typingDiv = document.createElement('div');
  typingDiv.className = 'chat-msg chat-msg--typing';
  typingDiv.textContent = 'Tanker...';
  messagesEl.appendChild(typingDiv);
  messagesEl.scrollTop = messagesEl.scrollHeight;

  portalApi('/api/customers/' + _portalCustomer.id + '/analytics-chat', {
    method: 'POST',
    body: JSON.stringify({ message: message })
  })
  .then(function(data) {
    typingDiv.remove();
    var botDiv = document.createElement('div');
    botDiv.className = 'chat-msg chat-msg--bot';
    botDiv.innerHTML = formatChatResponse(data.response || data.answer || 'Jag kunde inte besvara fragan just nu.');
    messagesEl.appendChild(botDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  })
  .catch(function(err) {
    typingDiv.remove();
    var errDiv = document.createElement('div');
    errDiv.className = 'chat-msg chat-msg--bot';
    errDiv.textContent = 'Nagonting gick fel. Forsok igen om en stund.';
    messagesEl.appendChild(errDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  })
  .finally(function() {
    btn.disabled = false;
    input.focus();
  });
}

function formatChatResponse(text) {
  // Simple markdown-like formatting
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

// ══════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════

function escHtml(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatNum(n) {
  if (n === null || n === undefined) return '0';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  var day = d.getDate();
  var months = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];
  return day + ' ' + months[d.getMonth()];
}

function shortenUrl(url) {
  if (!url) return '';
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}
