// ══════════════════════════════════════════════════════════════
// Searchboost Opti — Kundportal Frontend
// JWT-baserad auth, datahämtning, ApexCharts-gauges, AI-chatt
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
let _sparkCharts = {};

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
    errEl.textContent = err.message || 'Fel e-post eller lösenord';
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
  $('#appShell').style.display = 'flex';

  // Sidebar customer info
  $('#headerName').textContent = _portalCustomer.name || _portalCustomer.id;
  $('#headerUrl').textContent = _portalCustomer.url || '';

  // Topbar welcome
  const firstName = (_portalCustomer.name || '').split(' ')[0] || 'Kund';
  $('#welcomeTitle').textContent = 'Välkomna, ' + firstName + '!';

  // Date in welcome banner
  const now = new Date();
  const months = ['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'];
  const weekdays = ['söndag','måndag','tisdag','onsdag','torsdag','fredag','lördag'];
  $('#welcomeDate').textContent = weekdays[now.getDay()] + ' ' + now.getDate() + ' ' + months[now.getMonth()] + ' ' + now.getFullYear();

  // Update timestamp
  if (typeof updateTimestamp === 'function') updateTimestamp();

  loadDashboard();

  // Auto-refresh var 5:e minut
  if (_refreshTimer) clearInterval(_refreshTimer);
  _refreshTimer = setInterval(loadDashboard, 300000);
}

// Auto-login från session
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
    throw new Error('Sessionen har gått ut');
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

  const days = _currentPeriod || 30;
  const [perfData, rankings, stats, planData, optimizations, gscHistory] = await Promise.all([
    portalApi('/api/customers/' + cid + '/performance').catch(function() { return null; }),
    portalApi('/api/customers/' + cid + '/rankings').catch(function() { return null; }),
    portalApi('/api/customers/' + cid + '/stats').catch(function() { return null; }),
    portalApi('/api/customers/' + cid + '/action-plan').catch(function() { return null; }),
    portalApi('/api/optimizations?customer_id=' + cid).catch(function() { return null; }),
    portalApi('/api/customers/' + cid + '/gsc-history?days=' + days).catch(function() { return null; })
  ]);

  renderKpiCards(rankings, stats, gscHistory);
  renderGauges(perfData, rankings, planData);
  renderKeywords(rankings, gscHistory);
  renderOptimizations(optimizations);
  renderActionPlan(planData);
  renderAlerts(rankings, gscHistory);

  // Update timestamp
  if (typeof updateTimestamp === 'function') updateTimestamp();
}

// ══════════════════════════════════════════════════════════════
// KPI CARDS (top row in overview)
// ══════════════════════════════════════════════════════════════

async function renderKpiCards(rankings, stats, gscHistory) {
  // Wait for ApexCharts
  if (typeof ApexCharts === 'undefined') {
    await new Promise(function(resolve) {
      var check = setInterval(function() {
        if (typeof ApexCharts !== 'undefined') { clearInterval(check); resolve(); }
      }, 100);
    });
  }

  var top10 = 0, totalClicks = 0, totalImpressions = 0, avgPos = 0;

  if (rankings && rankings.rankings && rankings.rankings.length > 0) {
    var rows = rankings.rankings;
    top10 = rows.filter(function(r) { return r.position > 0 && r.position <= 10; }).length;
    totalClicks = rows.reduce(function(sum, r) { return sum + (r.clicks || 0); }, 0);
    totalImpressions = rows.reduce(function(sum, r) { return sum + (r.impressions || 0); }, 0);
    var positions = rows.map(function(r) { return r.position; }).filter(function(p) { return p > 0; });
    avgPos = positions.length > 0 ? +(positions.reduce(function(a, b) { return a + b; }, 0) / positions.length).toFixed(1) : 0;
  }

  // Override with stats if available
  if (stats) {
    if (stats.total_clicks !== undefined) totalClicks = stats.total_clicks;
    if (stats.total_impressions !== undefined) totalImpressions = stats.total_impressions;
    if (stats.avg_position !== undefined && stats.avg_position > 0) avgPos = +stats.avg_position.toFixed(1);
  }

  // Set values
  var kpiTop10El = document.getElementById('kpi-top10');
  var kpiClicksEl = document.getElementById('kpi-clicks');
  var kpiImpEl = document.getElementById('kpi-impressions');
  var kpiPosEl = document.getElementById('kpi-position');

  if (kpiTop10El) kpiTop10El.textContent = top10;
  if (kpiClicksEl) kpiClicksEl.textContent = formatNum(totalClicks);
  if (kpiImpEl) kpiImpEl.textContent = formatNum(totalImpressions);
  if (kpiPosEl) kpiPosEl.textContent = avgPos > 0 ? avgPos.toFixed(1) : '--';

  // Build daily aggregates from gsc-history for sparklines
  var dailyClicks = [], dailyImpressions = [], dailyPositions = [];
  if (gscHistory && gscHistory.data && gscHistory.data.length > 0) {
    var byDate = {};
    gscHistory.data.forEach(function(row) {
      var d = row.date;
      if (!byDate[d]) byDate[d] = { clicks: 0, impressions: 0, positions: [], top10: 0 };
      byDate[d].clicks += (row.clicks || 0);
      byDate[d].impressions += (row.impressions || 0);
      if (row.position > 0) {
        byDate[d].positions.push(row.position);
        if (row.position <= 10) byDate[d].top10++;
      }
    });
    var sortedDates = Object.keys(byDate).sort();
    sortedDates.forEach(function(d) {
      var day = byDate[d];
      dailyClicks.push(day.clicks);
      dailyImpressions.push(day.impressions);
      var posArr = day.positions;
      dailyPositions.push(posArr.length > 0 ? +(posArr.reduce(function(a,b){return a+b;},0)/posArr.length).toFixed(1) : 0);
    });
  }

  // Trends: compare first half vs second half of period
  if (dailyClicks.length >= 4) {
    var half = Math.floor(dailyClicks.length / 2);
    var prevClicks = dailyClicks.slice(0, half).reduce(function(a,b){return a+b;},0);
    var currClicks = dailyClicks.slice(half).reduce(function(a,b){return a+b;},0);
    var prevImp = dailyImpressions.slice(0, half).reduce(function(a,b){return a+b;},0);
    var currImp = dailyImpressions.slice(half).reduce(function(a,b){return a+b;},0);
    var prevPosArr = dailyPositions.slice(0, half).filter(function(p){return p>0;});
    var currPosArr = dailyPositions.slice(half).filter(function(p){return p>0;});
    var prevPosAvg = prevPosArr.length > 0 ? prevPosArr.reduce(function(a,b){return a+b;},0)/prevPosArr.length : null;
    var currPosAvg = currPosArr.length > 0 ? currPosArr.reduce(function(a,b){return a+b;},0)/currPosArr.length : null;
    setKpiTrend('kpi-clicks-trend', currClicks, prevClicks, false);
    setKpiTrend('kpi-impressions-trend', currImp, prevImp, false);
    setKpiTrend('kpi-position-trend', currPosAvg, prevPosAvg, true);
    setKpiTrend('kpi-top10-trend', null, null, false);
  } else {
    setKpiTrend('kpi-top10-trend', null, null, false);
    setKpiTrend('kpi-clicks-trend', null, null, false);
    setKpiTrend('kpi-impressions-trend', null, null, false);
    setKpiTrend('kpi-position-trend', null, null, true);
  }

  // Render sparklines with real data or placeholders
  renderSparkline('kpi-top10-spark', generatePlaceholderSeries(top10), '#ff2d9b');
  renderSparkline('kpi-clicks-spark', dailyClicks.length >= 4 ? dailyClicks.slice(-14) : generatePlaceholderSeries(totalClicks), '#00d4ff');
  renderSparkline('kpi-impressions-spark', dailyImpressions.length >= 4 ? dailyImpressions.slice(-14) : generatePlaceholderSeries(totalImpressions), '#a855f7');
  renderSparkline('kpi-position-spark', dailyPositions.length >= 4 ? dailyPositions.slice(-14) : generatePlaceholderSeries(avgPos, true), '#22c55e');
}

function setKpiTrend(elementId, current, previous, invertScale) {
  var el = document.getElementById(elementId);
  if (!el) return;

  if (previous === null || previous === undefined || current === null) {
    el.innerHTML = '';
    el.className = 'kpi-trend neutral';
    return;
  }

  var diff = current - previous;
  var isPositive = invertScale ? diff < 0 : diff > 0;
  var sign = diff > 0 ? '+' : '';
  var pctChange = previous !== 0 ? Math.round((diff / previous) * 100) : 0;
  var arrow = isPositive ? '<span class="trend-arrow">&#9650;</span>' : '<span class="trend-arrow">&#9660;</span>';

  el.innerHTML = arrow + ' ' + sign + pctChange + '%';
  el.className = 'kpi-trend ' + (isPositive ? 'up' : diff === 0 ? 'neutral' : 'down');
}

function generatePlaceholderSeries(finalValue, inverted) {
  // Generate a plausible 7-point series ending at finalValue
  var series = [];
  var base = finalValue || 1;
  for (var i = 0; i < 7; i++) {
    var variance = (Math.random() - 0.4) * base * 0.3;
    var val = Math.max(0, base + variance - (inverted ? 0 : (6 - i) * base * 0.05));
    series.push(Math.round(val * 10) / 10);
  }
  series[6] = finalValue || 0;
  return series;
}

function renderSparkline(elementId, data, color) {
  if (_sparkCharts[elementId]) {
    _sparkCharts[elementId].destroy();
  }

  var el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = '';

  var options = {
    series: [{ data: data }],
    chart: {
      type: 'area',
      height: 32,
      sparkline: { enabled: true },
      background: 'transparent',
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 100]
      }
    },
    colors: [color],
    tooltip: { enabled: false },
  };

  var chart = new ApexCharts(el, options);
  chart.render();
  _sparkCharts[elementId] = chart;
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
  el.textContent = sign + displayVal + ' från förra veckan';
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

function renderKeywords(data, gscHistory) {
  const body = $('#keywordsBody');
  const summary = $('#keywordsSummary');

  if (!data || !data.rankings || data.rankings.length === 0) {
    body.innerHTML = '<div class="empty-state">Inga sökord att visa ännu. Vi arbetar på att samla in data.</div>';
    summary.innerHTML = '';
    return;
  }

  const rows = data.rankings;
  const top10 = rows.filter(function(r) { return r.position > 0 && r.position <= 10; }).length;
  const top30 = rows.filter(function(r) { return r.position > 0 && r.position <= 30; }).length;
  summary.innerHTML = '<strong>' + top10 + '</strong> sökord i topp 10 | <strong>' + top30 + '</strong> i topp 30 | <strong>' + rows.length + '</strong> totalt ' +
    '<button class="btn-export" onclick="exportKeywordsCsv()" title="Exportera som CSV">Exportera CSV</button>';

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
  html += '<th>Sökord</th><th>Klass</th><th>Position</th><th>Förändring</th><th>Klick</th><th>Visningar</th>';
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

  // Keyword ranking trend chart (from gsc-history)
  if (gscHistory && gscHistory.data && gscHistory.data.length > 0) {
    html += '<div style="margin-top:24px"><h3 style="color:var(--white);font-size:15px;font-weight:600;margin:0 0 12px">Ranking-trender (topp 5 sökord)</h3>';
    html += '<div id="keywordTrendChart" style="min-height:280px"></div></div>';
  }

  body.innerHTML = html;

  // Render trend chart if data exists
  if (gscHistory && gscHistory.data && gscHistory.data.length > 0) {
    renderKeywordTrendChart(gscHistory, rows);
  }
}

// ── Keyword Trend Chart ──
var _keywordTrendChart = null;
function renderKeywordTrendChart(gscHistory, rankings) {
  if (_keywordTrendChart) { _keywordTrendChart.destroy(); _keywordTrendChart = null; }
  var chartEl = document.getElementById('keywordTrendChart');
  if (!chartEl || typeof ApexCharts === 'undefined') return;

  // Pick top 5 keywords by clicks
  var topKw = rankings.slice().sort(function(a,b){ return (b.clicks||0) - (a.clicks||0); }).slice(0,5).map(function(r){ return (r.keyword||r.query||'').toLowerCase(); });
  if (topKw.length === 0) return;

  // Group gsc-history by date+query
  var byDateKw = {};
  var allDates = {};
  gscHistory.data.forEach(function(row) {
    var q = (row.query || '').toLowerCase();
    if (topKw.indexOf(q) === -1) return;
    var d = row.date;
    allDates[d] = true;
    if (!byDateKw[q]) byDateKw[q] = {};
    if (!byDateKw[q][d]) byDateKw[q][d] = { pos: [], clicks: 0 };
    if (row.position > 0) byDateKw[q][d].pos.push(row.position);
    byDateKw[q][d].clicks += (row.clicks || 0);
  });

  var sortedDates = Object.keys(allDates).sort();
  if (sortedDates.length < 2) return;

  var colors = ['#ff2d9b','#00d4ff','#a855f7','#22c55e','#f59e0b'];
  var series = topKw.map(function(kw, idx) {
    var data = sortedDates.map(function(d) {
      var entry = (byDateKw[kw] || {})[d];
      if (!entry || entry.pos.length === 0) return null;
      var avg = entry.pos.reduce(function(a,b){return a+b;},0) / entry.pos.length;
      return +avg.toFixed(1);
    });
    return { name: kw, data: data };
  });

  var options = {
    series: series,
    chart: { type: 'line', height: 280, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
    stroke: { curve: 'smooth', width: 2 },
    colors: colors.slice(0, topKw.length),
    xaxis: { categories: sortedDates, labels: { style: { colors: '#94a3b8', fontSize: '10px' }, rotate: -45, formatter: function(v){ return v ? v.substring(5) : ''; } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { reversed: true, min: 1, labels: { style: { colors: '#94a3b8' }, formatter: function(v){ return v ? Math.round(v) : ''; } }, title: { text: 'Position', style: { color: '#64748b', fontSize: '11px' } } },
    grid: { borderColor: 'rgba(255,255,255,0.06)', padding: { left: 10, right: 10 } },
    legend: { position: 'top', labels: { colors: '#e2e8f0' }, fontSize: '11px' },
    tooltip: { theme: 'dark', y: { formatter: function(v){ return v ? 'Pos ' + v : 'Ingen data'; } } },
    dataLabels: { enabled: false },
    markers: { size: 0, hover: { size: 4 } },
  };

  _keywordTrendChart = new ApexCharts(chartEl, options);
  _keywordTrendChart.render();
}

// ── CSV Export ──
function exportKeywordsCsv() {
  if (!_portalCustomer) return;
  var rows = document.querySelectorAll('#keywordsBody .data-table tbody tr');
  if (!rows || rows.length === 0) { alert('Inga sökord att exportera'); return; }

  var csv = 'Sökord;Klass;Position;Klick;Visningar\n';
  rows.forEach(function(row) {
    var cells = row.querySelectorAll('td');
    if (cells.length >= 6) {
      csv += '"' + (cells[0].textContent||'') + '";';
      csv += '"' + (cells[1].textContent||'') + '";';
      csv += '"' + (cells[2].textContent||'') + '";';
      csv += '"' + (cells[4].textContent||'') + '";';
      csv += '"' + (cells[5].textContent||'') + '"\n';
    }
  });

  var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = (_portalCustomer.id || 'sokord') + '-export-' + new Date().toISOString().split('T')[0] + '.csv';
  link.click();
}

// ── Alerts (ranking falls > 5 positions) ──
function renderAlerts(rankings, gscHistory) {
  // Remove existing alerts
  var existing = document.getElementById('portalAlerts');
  if (existing) existing.remove();

  if (!gscHistory || !gscHistory.data || gscHistory.data.length < 10) return;
  if (!rankings || !rankings.rankings) return;

  // Compare current position with historical average
  var historyByQuery = {};
  gscHistory.data.forEach(function(row) {
    var q = (row.query || '').toLowerCase();
    if (row.position > 0) {
      if (!historyByQuery[q]) historyByQuery[q] = [];
      historyByQuery[q].push({ date: row.date, position: row.position });
    }
  });

  var alerts = [];
  rankings.rankings.forEach(function(r) {
    var kw = (r.keyword || r.query || '').toLowerCase();
    var currentPos = r.position || 0;
    if (currentPos <= 0) return;

    var hist = historyByQuery[kw];
    if (!hist || hist.length < 5) return;

    // Average position from first half of history period
    hist.sort(function(a,b){ return a.date.localeCompare(b.date); });
    var firstHalf = hist.slice(0, Math.floor(hist.length/2));
    var avgOld = firstHalf.reduce(function(s,h){ return s+h.position; },0) / firstHalf.length;

    var drop = currentPos - avgOld;
    if (drop > 5) {
      alerts.push({ keyword: kw, currentPos: currentPos, oldPos: +avgOld.toFixed(1), drop: +drop.toFixed(1) });
    }
  });

  if (alerts.length === 0) return;

  alerts.sort(function(a,b){ return b.drop - a.drop; });

  var alertHtml = '<div id="portalAlerts" class="portal-alerts">';
  alertHtml += '<div class="alert-header">Varningar (' + alerts.length + ')</div>';
  alerts.slice(0, 5).forEach(function(a) {
    alertHtml += '<div class="alert-item">';
    alertHtml += '<span class="alert-icon">&#9888;</span>';
    alertHtml += '<span class="alert-text"><strong>' + escHtml(a.keyword) + '</strong> tappade ' + a.drop + ' positioner (pos ' + a.oldPos + ' &rarr; ' + a.currentPos.toFixed(1) + ')</span>';
    alertHtml += '</div>';
  });
  alertHtml += '</div>';

  // Insert after welcome banner
  var banner = document.getElementById('welcomeBanner');
  if (banner) {
    banner.insertAdjacentHTML('afterend', alertHtml);
  }
}

// ══════════════════════════════════════════════════════════════
// OPTIMIZATIONS TIMELINE
// ══════════════════════════════════════════════════════════════

function renderOptimizations(data) {
  const body = $('#optimizationsBody');
  const summary = $('#optSummary');

  if (!data || !data.optimizations || data.optimizations.length === 0) {
    body.innerHTML = '<div class="empty-state">Inga optimeringar att visa ännu.</div>';
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

  summary.innerHTML = 'Vi har optimerat <strong>' + pageCount + ' sidor</strong> denna månad (' + recent.length + ' åtgärder totalt)';

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
    body.innerHTML = '<div class="empty-state">Ingen åtgärdsplan skapad ännu. Vi arbetar på att ta fram en plan för er.</div>';
    return;
  }

  var months = data.plan.months;
  var html = '';

  months.forEach(function(month, idx) {
    var tasks = month.tasks || [];
    var total = tasks.length;
    var done = tasks.filter(function(t) { return t.status === 'completed'; }).length;
    var pct = total > 0 ? Math.round((done / total) * 100) : 0;

    var monthLabel = month.title || ('Månad ' + (idx + 1));
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
  typingDiv.textContent = 'Tänker...';
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
    botDiv.innerHTML = formatChatResponse(data.response || data.answer || 'Jag kunde inte besvara frågan just nu.');
    messagesEl.appendChild(botDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  })
  .catch(function(err) {
    typingDiv.remove();
    var errDiv = document.createElement('div');
    errDiv.className = 'chat-msg chat-msg--bot';
    errDiv.textContent = 'Någonting gick fel. Försök igen om en stund.';
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
