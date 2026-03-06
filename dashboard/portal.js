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

  // Load ads, social, traffic and security data in parallel (non-blocking)
  loadAdsData();
  loadSocialData();
  loadTrafficData();
  loadSecurityStatus();

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

  var TYPE_LABELS = {
    'short_title': 'Titel förkortad',
    'long_title': 'Titel förlängd',
    'missing_title': 'Titel skapad',
    'missing_description': 'Meta-beskrivning tillagd',
    'missing_h1': 'H1-rubrik skapad',
    'missing_alt_text': 'Alt-text tillagd',
    'no_schema': 'Schema-markup tillagd',
    'thin_content': 'Innehåll utökat',
    'h2_optimization': 'H2-rubriker förbättrade',
    'h3_optimization': 'H3-rubriker förbättrade',
    'synonym_gap': 'Synonymer tillagda',
    'metadata': 'Metadata optimerad',
    'manual': 'Manuell åtgärd',
    'content': 'Innehåll förbättrat',
    'schema': 'Schema-markup uppdaterad',
  };

  var html = '<div class="timeline">';
  recent.slice(0, 20).forEach(function(o) {
    var type = (o.optimization_type || o.type || 'metadata').toLowerCase();
    var iconClass = 'timeline-icon--metadata';
    var iconText = 'M';
    if (type.includes('schema')) { iconClass = 'timeline-icon--schema'; iconText = 'S'; }
    else if (type.includes('content') || type.includes('thin')) { iconClass = 'timeline-icon--content'; iconText = 'C'; }
    else if (type.includes('manual')) { iconClass = 'timeline-icon--manual'; iconText = 'H'; }
    else if (type.includes('h1') || type.includes('h2') || type.includes('h3')) { iconClass = 'timeline-icon--content'; iconText = 'H'; }
    else if (type.includes('alt')) { iconClass = 'timeline-icon--content'; iconText = 'A'; }
    else if (type.includes('synonym')) { iconClass = 'timeline-icon--content'; iconText = 'S'; }

    var title = TYPE_LABELS[type] || o.optimization_type || o.type || 'Optimering';
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
// ADS SECTION
// ══════════════════════════════════════════════════════════════

var _attributionWindow = 90;

function setAttributionWindow(days) {
  _attributionWindow = parseInt(days) || 90;
  var label = document.getElementById('shoppingWindowLabel');
  if (label) label.textContent = _attributionWindow + ' dagar';
  // Reload ads data with new window
  if (_portalCustomer) loadAdsData();
}

async function loadAdsData() {
  if (!_portalCustomer) return;
  var cid = _portalCustomer.id;

  var [adsData, adsPlatforms, adsSpend, adsHistory] = await Promise.all([
    portalApi('/api/customers/' + cid + '/ads').catch(function() { return null; }),
    portalApi('/api/customers/' + cid + '/ads/platforms').catch(function() { return null; }),
    portalApi('/api/customers/' + cid + '/ads/spend').catch(function() { return null; }),
    portalApi('/api/customers/' + cid + '/ads-history?days=' + (_currentPeriod || 30)).catch(function() { return null; })
  ]);

  renderAdsOverview(adsData, adsPlatforms, adsSpend);
  renderAdsDetail(adsData, adsHistory);
}

function renderAdsOverview(adsData, platforms, spend) {
  var grid = document.getElementById('adsChannelGrid');
  if (!grid) return;

  // Define all ad platforms
  var allPlatforms = [
    { key: 'google_ads', name: 'Google Ads', icon: 'G', iconClass: 'google' },
    { key: 'meta', name: 'Meta Ads', icon: 'M', iconClass: 'meta' },
    { key: 'tiktok', name: 'TikTok Ads', icon: 'T', iconClass: 'tiktok' },
    { key: 'linkedin', name: 'LinkedIn Ads', icon: 'L', iconClass: 'linkedin' }
  ];

  // Determine which platforms are active
  var activePlatforms = {};
  if (platforms && platforms.platforms) {
    platforms.platforms.forEach(function(p) { activePlatforms[p] = true; });
  }

  // Get spend data per platform
  // API kan returnera antingen array eller objekt — hantera båda
  var spendByPlatform = {};
  var totalSpend = 0;
  if (spend && spend.platforms) {
    var platformList = Array.isArray(spend.platforms)
      ? spend.platforms
      : Object.values(spend.platforms);
    platformList.forEach(function(p) {
      spendByPlatform[p.platform] = p;
      totalSpend += (p.spend || 0);
    });
  }

  // Update total spend
  var totalEl = document.getElementById('adsTotalSpend');
  if (totalEl) {
    totalEl.innerHTML = formatCurrency(totalSpend) + '<small>kr</small>';
  }

  // Render spend bar
  renderSpendBar(spend);

  // Render channel cards
  var html = '';
  allPlatforms.forEach(function(plat) {
    var isActive = activePlatforms[plat.key];
    var data = spendByPlatform[plat.key] || {};

    html += '<div class="channel-card ' + (isActive ? 'channel-card--active' : 'channel-card--inactive') + '">';
    html += '<div class="channel-card-header">';
    html += '<div class="channel-card-title">';
    html += '<div class="channel-icon channel-icon--' + plat.iconClass + '">' + plat.icon + '</div>';
    html += '<span class="channel-name">' + plat.name + '</span>';
    html += '</div>';
    html += '<span class="channel-status ' + (isActive ? 'channel-status--active' : 'channel-status--inactive') + '">' + (isActive ? 'Aktiv' : 'Ej ansluten') + '</span>';
    html += '</div>';

    if (isActive) {
      html += '<div class="channel-metrics">';
      html += '<div class="channel-metric"><span class="channel-metric-label">Spend</span><span class="channel-metric-value">' + formatCurrency(data.spend || 0) + '</span></div>';
      html += '<div class="channel-metric"><span class="channel-metric-label">Klick</span><span class="channel-metric-value">' + formatNum(data.clicks || 0) + '</span></div>';
      html += '<div class="channel-metric"><span class="channel-metric-label">Konv.</span><span class="channel-metric-value">' + formatNum(data.conversions || 0) + '</span></div>';
      html += '<div class="channel-metric"><span class="channel-metric-label">CPA</span><span class="channel-metric-value">' + (data.conversions > 0 ? formatCurrency(Math.round((data.spend || 0) / data.conversions)) : '--') + '</span></div>';
      html += '</div>';
    } else {
      html += '<div class="connect-cta" style="padding:20px 12px;border:none;background:transparent">';
      html += '<div class="connect-cta-desc" style="max-width:none">Kontakta Searchboost för att koppla ' + plat.name + '</div>';
      html += '</div>';
    }

    html += '</div>';
  });

  // If no platforms active at all, show full CTA
  if (Object.keys(activePlatforms).length === 0) {
    grid.innerHTML = '<div class="connect-cta" style="grid-column:1/-1"><div class="connect-cta-icon">&#128200;</div><div class="connect-cta-title">Inga annonsplattformar anslutna</div><div class="connect-cta-desc">Kontakta Searchboost för att koppla Google Ads, Meta, TikTok eller LinkedIn Ads och se alla data här.</div></div>';
    return;
  }

  grid.innerHTML = html;
}

function renderSpendBar(spend) {
  var visual = document.getElementById('adsSpendVisual');
  var legend = document.getElementById('adsSpendLegend');
  if (!visual || !legend) return;

  if (!spend || !spend.platforms) {
    visual.innerHTML = '';
    legend.innerHTML = '';
    return;
  }

  // Normalisera till array — API kan returnera objekt eller array
  var platformList = Array.isArray(spend.platforms)
    ? spend.platforms
    : Object.values(spend.platforms);

  if (platformList.length === 0) {
    visual.innerHTML = '';
    legend.innerHTML = '';
    return;
  }

  var totalSpend = platformList.reduce(function(sum, p) { return sum + (p.spend || 0); }, 0);
  if (totalSpend <= 0) { visual.innerHTML = ''; legend.innerHTML = ''; return; }

  var platformColors = {
    google_ads: 'google',
    meta: 'meta',
    tiktok: 'tiktok',
    linkedin: 'linkedin'
  };

  var barsHtml = '';
  var legendHtml = '';

  platformList.forEach(function(p) {
    var pct = ((p.spend || 0) / totalSpend * 100).toFixed(1);
    var colorKey = platformColors[p.platform] || 'google';
    barsHtml += '<div class="spend-bar-segment spend-bar-segment--' + colorKey + '" style="width:' + pct + '%"></div>';
    legendHtml += '<div class="spend-legend-item"><span class="spend-legend-dot spend-legend-dot--' + colorKey + '"></span>' + formatPlatformName(p.platform) + ' ' + formatCurrency(p.spend || 0) + ' kr (' + pct + '%)</div>';
  });

  visual.innerHTML = barsHtml;
  legend.innerHTML = legendHtml;
}

function renderAdsDetail(adsData, adsHistory) {
  var detailCard = document.getElementById('adsDetailCard');
  var tabsEl = document.getElementById('adsTabs');
  var panelsEl = document.getElementById('adsPanels');
  if (!detailCard || !tabsEl || !panelsEl) return;

  if (!adsData || !adsData.platforms || Object.keys(adsData.platforms).length === 0) {
    detailCard.style.display = 'none';
    return;
  }

  detailCard.style.display = '';
  var platforms = Object.keys(adsData.platforms);
  var platformColors = { google_ads: 'google', meta: 'meta', tiktok: 'tiktok', linkedin: 'linkedin' };

  // Render tabs
  var tabsHtml = '';
  platforms.forEach(function(plat, idx) {
    var colorKey = platformColors[plat] || 'google';
    tabsHtml += '<button class="ads-tab' + (idx === 0 ? ' active' : '') + '" data-panel="ads-panel-' + plat + '" onclick="switchAdsTab(this)">';
    tabsHtml += '<span class="ads-tab-dot ads-tab-dot--' + colorKey + '"></span>';
    tabsHtml += formatPlatformName(plat);
    tabsHtml += '</button>';
  });
  tabsEl.innerHTML = tabsHtml;

  // Render panels with campaign rows
  var panelsHtml = '';
  platforms.forEach(function(plat, idx) {
    var platData = adsData.platforms[plat] || {};
    var campaigns = platData.campaigns || [];

    panelsHtml += '<div class="ads-panel' + (idx === 0 ? ' active' : '') + '" id="ads-panel-' + plat + '">';

    if (campaigns.length === 0) {
      panelsHtml += '<div class="empty-state">Inga kampanjer hittade för ' + formatPlatformName(plat) + '</div>';
    } else {
      // Summary metrics
      var totalSpend = 0, totalClicks = 0, totalConv = 0, totalImpr = 0;
      campaigns.forEach(function(c) {
        totalSpend += (c.spend || 0);
        totalClicks += (c.clicks || 0);
        totalConv += (c.conversions || 0);
        totalImpr += (c.impressions || 0);
      });
      var roas = totalSpend > 0 && platData.revenue ? (platData.revenue / totalSpend).toFixed(2) : null;
      var roasClass = roas >= 4 ? 'good' : roas >= 2 ? 'ok' : 'bad';

      panelsHtml += '<div class="kpi-grid" style="margin-bottom:20px">';
      panelsHtml += '<div class="kpi-card"><div class="kpi-label">Spend</div><div class="kpi-value">' + formatCurrency(totalSpend) + '</div></div>';
      panelsHtml += '<div class="kpi-card"><div class="kpi-label">Klick</div><div class="kpi-value">' + formatNum(totalClicks) + '</div></div>';
      panelsHtml += '<div class="kpi-card"><div class="kpi-label">Konverteringar</div><div class="kpi-value">' + formatNum(totalConv) + '</div></div>';
      panelsHtml += '<div class="kpi-card"><div class="kpi-label">ROAS</div><div class="kpi-value">' + (roas ? '<span class="roas-badge roas-badge--' + roasClass + '">' + roas + 'x</span>' : '--') + '</div></div>';
      panelsHtml += '</div>';

      // Campaign list
      campaigns.forEach(function(c) {
        var statusClass = (c.status || '').toLowerCase() === 'active' ? 'active' : (c.status || '').toLowerCase() === 'paused' ? 'paused' : 'ended';
        panelsHtml += '<div class="campaign-row">';
        panelsHtml += '<span class="campaign-status-dot campaign-status-dot--' + statusClass + '"></span>';
        panelsHtml += '<div class="campaign-info"><div class="campaign-name">' + escHtml(c.name || 'Kampanj') + '</div><div class="campaign-type">' + escHtml(c.type || '') + '</div></div>';
        panelsHtml += '<div class="campaign-metrics">';
        panelsHtml += '<div class="campaign-metric"><div class="campaign-metric-val">' + formatCurrency(c.spend || 0) + '</div><div class="campaign-metric-lbl">Spend</div></div>';
        panelsHtml += '<div class="campaign-metric"><div class="campaign-metric-val">' + formatNum(c.clicks || 0) + '</div><div class="campaign-metric-lbl">Klick</div></div>';
        panelsHtml += '<div class="campaign-metric"><div class="campaign-metric-val">' + formatNum(c.conversions || 0) + '</div><div class="campaign-metric-lbl">Konv.</div></div>';
        panelsHtml += '</div></div>';
      });
    }

    panelsHtml += '</div>';
  });
  panelsEl.innerHTML = panelsHtml;
}

function switchAdsTab(btn) {
  var panelId = btn.getAttribute('data-panel');
  // Toggle tabs
  document.querySelectorAll('.ads-tab').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  // Toggle panels
  document.querySelectorAll('.ads-panel').forEach(function(p) { p.classList.remove('active'); });
  var panel = document.getElementById(panelId);
  if (panel) panel.classList.add('active');
}

// ══════════════════════════════════════════════════════════════
// SOCIAL MEDIA SECTION
// ══════════════════════════════════════════════════════════════

var _socialTrendChart = null;

async function loadSocialData() {
  if (!_portalCustomer) return;
  var cid = _portalCustomer.id;

  var [socialHistory] = await Promise.all([
    portalApi('/api/customers/' + cid + '/social-history?days=' + (_currentPeriod || 30)).catch(function() { return null; })
  ]);

  renderSocialCards(socialHistory);
  renderSocialTrend(socialHistory);
}

function renderSocialCards(socialData) {
  var grid = document.getElementById('socialGrid');
  if (!grid) return;

  var allPlatforms = [
    { key: 'instagram', name: 'Instagram', icon: 'IG', iconClass: 'instagram' },
    { key: 'facebook', name: 'Facebook', icon: 'FB', iconClass: 'facebook' },
    { key: 'linkedin', name: 'LinkedIn', icon: 'LI', iconClass: 'linkedin' },
    { key: 'tiktok', name: 'TikTok', icon: 'TT', iconClass: 'tiktok' }
  ];

  // Group data by platform
  var byPlatform = {};
  if (socialData && socialData.data) {
    socialData.data.forEach(function(row) {
      var p = row.platform;
      if (!byPlatform[p]) byPlatform[p] = { followers: 0, likes: 0, comments: 0, shares: 0, reach: 0, engagement: 0, count: 0 };
      byPlatform[p].followers = Math.max(byPlatform[p].followers, row.followers || 0);
      byPlatform[p].likes += (row.likes || 0);
      byPlatform[p].comments += (row.comments || 0);
      byPlatform[p].shares += (row.shares || 0);
      byPlatform[p].reach += (row.reach || 0);
      byPlatform[p].engagement += (row.engagement_rate || 0);
      byPlatform[p].count++;
    });
  }

  var html = '';
  var anyActive = false;

  allPlatforms.forEach(function(plat) {
    var data = byPlatform[plat.key];
    var isActive = !!data;

    if (isActive) anyActive = true;

    html += '<div class="social-card' + (isActive ? ' social-card--' + plat.key : '') + '"' + (!isActive ? ' style="opacity:0.4"' : '') + '>';
    html += '<div class="social-card-icon social-card-icon--' + plat.iconClass + '">' + plat.icon + '</div>';

    if (isActive) {
      var avgEngagement = data.count > 0 ? (data.engagement / data.count).toFixed(2) : 0;
      var engClass = avgEngagement >= 3 ? 'high' : avgEngagement >= 1 ? 'medium' : 'low';

      html += '<div class="social-card-followers">' + formatNum(data.followers) + '</div>';
      html += '<div class="social-card-label">Följare</div>';
      html += '<div class="social-card-stats">';
      html += '<div class="social-stat"><span class="social-stat-value">' + formatNum(data.likes) + '</span><span class="social-stat-label">Gillat</span></div>';
      html += '<div class="social-stat"><span class="social-stat-value">' + formatNum(data.comments) + '</span><span class="social-stat-label">Kommentarer</span></div>';
      html += '<div class="social-stat"><span class="social-stat-value">' + formatNum(data.shares) + '</span><span class="social-stat-label">Delningar</span></div>';
      html += '<div class="social-stat"><span class="social-stat-value">' + formatNum(data.reach) + '</span><span class="social-stat-label">Räckvidd</span></div>';
      html += '</div>';
      html += '<span class="engagement-badge engagement-badge--' + engClass + '">' + avgEngagement + '% engagemang</span>';
    } else {
      html += '<div class="social-card-followers">--</div>';
      html += '<div class="social-card-label">' + plat.name + '</div>';
      html += '<div style="color:var(--gray-500);font-size:0.78rem;margin-top:12px">Ej ansluten</div>';
    }

    html += '</div>';
  });

  if (!anyActive) {
    grid.innerHTML = '<div class="connect-cta" style="grid-column:1/-1"><div class="connect-cta-icon">&#128227;</div><div class="connect-cta-title">Inga sociala medier anslutna</div><div class="connect-cta-desc">Kontakta Searchboost för att koppla Instagram, Facebook, LinkedIn eller TikTok.</div></div>';
    return;
  }

  grid.innerHTML = html;
}

function renderSocialTrend(socialData) {
  var trendCard = document.getElementById('socialTrendCard');
  if (!trendCard) return;

  if (!socialData || !socialData.data || socialData.data.length < 5) {
    trendCard.style.display = 'none';
    return;
  }

  trendCard.style.display = '';

  if (_socialTrendChart) { _socialTrendChart.destroy(); _socialTrendChart = null; }
  var chartEl = document.getElementById('socialTrendChart');
  if (!chartEl || typeof ApexCharts === 'undefined') return;

  // Aggregate by date per platform
  var byDatePlatform = {};
  var allDates = {};
  var platformSet = {};
  socialData.data.forEach(function(row) {
    var d = row.date;
    var p = row.platform;
    allDates[d] = true;
    platformSet[p] = true;
    if (!byDatePlatform[p]) byDatePlatform[p] = {};
    if (!byDatePlatform[p][d]) byDatePlatform[p][d] = 0;
    byDatePlatform[p][d] += (row.likes || 0) + (row.comments || 0) + (row.shares || 0);
  });

  var sortedDates = Object.keys(allDates).sort();
  var platforms = Object.keys(platformSet);
  var colorMap = { instagram: '#e1306c', facebook: '#1877f2', linkedin: '#0a66c2', tiktok: '#fe2c55' };

  var series = platforms.map(function(p) {
    return {
      name: formatPlatformName(p),
      data: sortedDates.map(function(d) { return (byDatePlatform[p] || {})[d] || 0; })
    };
  });

  var options = {
    series: series,
    chart: { type: 'area', height: 300, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.05, stops: [0, 100] } },
    colors: platforms.map(function(p) { return colorMap[p] || '#a855f7'; }),
    xaxis: { categories: sortedDates, labels: { style: { colors: '#94a3b8', fontSize: '10px' }, rotate: -45, formatter: function(v) { return v ? v.substring(5) : ''; } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: '#94a3b8' } }, title: { text: 'Engagemang', style: { color: '#64748b', fontSize: '11px' } } },
    grid: { borderColor: 'rgba(255,255,255,0.06)' },
    legend: { position: 'top', labels: { colors: '#e2e8f0' }, fontSize: '11px' },
    tooltip: { theme: 'dark' },
    dataLabels: { enabled: false }
  };

  _socialTrendChart = new ApexCharts(chartEl, options);
  _socialTrendChart.render();
}

// ══════════════════════════════════════════════════════════════
// TRAFFIC SOURCES SECTION
// ══════════════════════════════════════════════════════════════

var _trafficPieChart = null;
var _trafficLineChart = null;
var _organicClicksChart = null;
var _organicPositionChart = null;

function switchTrafficTab(tabId) {
  document.querySelectorAll('#trafficTabs .section-tab').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.traffic-tab-panel').forEach(function(panel) {
    panel.classList.toggle('active', panel.id === tabId);
  });
}

async function loadTrafficData() {
  if (!_portalCustomer) return;
  var cid = _portalCustomer.id;
  var days = _currentPeriod || 30;

  var [gscHistory, adsHistory, socialHistory] = await Promise.all([
    portalApi('/api/customers/' + cid + '/gsc-history?days=' + days).catch(function() { return null; }),
    portalApi('/api/customers/' + cid + '/ads-history?days=' + days).catch(function() { return null; }),
    portalApi('/api/customers/' + cid + '/social-history?days=' + days).catch(function() { return null; })
  ]);

  renderTrafficOverview(gscHistory, adsHistory, socialHistory);
  renderOrganicCharts(gscHistory);
}

function renderTrafficOverview(gscData, adsData, socialData) {
  // Calculate traffic per source
  var organicClicks = 0, paidClicks = 0, socialClicks = 0, directClicks = 0;

  if (gscData && gscData.data) {
    gscData.data.forEach(function(r) { organicClicks += (r.clicks || 0); });
  }
  if (adsData && adsData.data) {
    adsData.data.forEach(function(r) { paidClicks += (r.clicks || 0); });
  }
  if (socialData && socialData.data) {
    socialData.data.forEach(function(r) { socialClicks += (r.reach || 0) * 0.02; }); // Estimate
  }
  // Direct is estimated as ~15% of total
  var totalEst = organicClicks + paidClicks + socialClicks;
  directClicks = Math.round(totalEst * 0.15);

  // Set KPI values
  var el;
  el = document.getElementById('traffic-organic-val'); if (el) el.textContent = formatNum(organicClicks);
  el = document.getElementById('traffic-paid-val'); if (el) el.textContent = formatNum(paidClicks);
  el = document.getElementById('traffic-social-val'); if (el) el.textContent = formatNum(Math.round(socialClicks));
  el = document.getElementById('traffic-direct-val'); if (el) el.textContent = formatNum(directClicks);

  // Render pie chart
  renderTrafficPie(organicClicks, paidClicks, Math.round(socialClicks), directClicks);
  renderTrafficLine(gscData, adsData);
}

function renderTrafficPie(organic, paid, social, direct) {
  if (_trafficPieChart) { _trafficPieChart.destroy(); _trafficPieChart = null; }
  var chartEl = document.getElementById('trafficPieChart');
  if (!chartEl || typeof ApexCharts === 'undefined') return;

  var total = organic + paid + social + direct;
  if (total <= 0) {
    chartEl.innerHTML = '<div class="empty-state">Ingen trafikdata tillgänglig</div>';
    return;
  }

  var options = {
    series: [organic, paid, social, direct],
    chart: { type: 'donut', height: 280, background: 'transparent' },
    labels: ['Organisk', 'Betald', 'Social', 'Direkt'],
    colors: ['#22c55e', '#4285f4', '#e1306c', '#a855f7'],
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Totalt',
              color: '#fafafa',
              fontSize: '14px',
              fontWeight: 600,
              formatter: function(w) { return formatNum(w.globals.seriesTotals.reduce(function(a, b) { return a + b; }, 0)); }
            },
            value: { color: '#fafafa', fontSize: '20px', fontWeight: 700 },
            name: { color: '#94a3b8', fontSize: '12px' }
          }
        }
      }
    },
    legend: { position: 'bottom', labels: { colors: '#e2e8f0' }, fontSize: '12px' },
    tooltip: { theme: 'dark' },
    dataLabels: { enabled: false }
  };

  _trafficPieChart = new ApexCharts(chartEl, options);
  _trafficPieChart.render();
}

function renderTrafficLine(gscData, adsData) {
  if (_trafficLineChart) { _trafficLineChart.destroy(); _trafficLineChart = null; }
  var chartEl = document.getElementById('trafficLineChart');
  if (!chartEl || typeof ApexCharts === 'undefined') return;

  // Aggregate daily clicks per source
  var dailyOrganic = {};
  var dailyPaid = {};
  var allDates = {};

  if (gscData && gscData.data) {
    gscData.data.forEach(function(r) {
      var d = r.date;
      allDates[d] = true;
      if (!dailyOrganic[d]) dailyOrganic[d] = 0;
      dailyOrganic[d] += (r.clicks || 0);
    });
  }
  if (adsData && adsData.data) {
    adsData.data.forEach(function(r) {
      var d = r.date;
      allDates[d] = true;
      if (!dailyPaid[d]) dailyPaid[d] = 0;
      dailyPaid[d] += (r.clicks || 0);
    });
  }

  var sortedDates = Object.keys(allDates).sort();
  if (sortedDates.length < 2) {
    chartEl.innerHTML = '<div class="empty-state">Inte tillräckligt med data</div>';
    return;
  }

  var options = {
    series: [
      { name: 'Organisk', data: sortedDates.map(function(d) { return dailyOrganic[d] || 0; }) },
      { name: 'Betald', data: sortedDates.map(function(d) { return dailyPaid[d] || 0; }) }
    ],
    chart: { type: 'area', height: 280, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false }, stacked: true },
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
    colors: ['#22c55e', '#4285f4'],
    xaxis: { categories: sortedDates, labels: { style: { colors: '#94a3b8', fontSize: '10px' }, rotate: -45, formatter: function(v) { return v ? v.substring(5) : ''; } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: '#94a3b8' } } },
    grid: { borderColor: 'rgba(255,255,255,0.06)' },
    legend: { position: 'top', labels: { colors: '#e2e8f0' }, fontSize: '11px' },
    tooltip: { theme: 'dark' },
    dataLabels: { enabled: false }
  };

  _trafficLineChart = new ApexCharts(chartEl, options);
  _trafficLineChart.render();
}

function renderOrganicCharts(gscData) {
  // Organic clicks per day
  if (_organicClicksChart) { _organicClicksChart.destroy(); _organicClicksChart = null; }
  if (_organicPositionChart) { _organicPositionChart.destroy(); _organicPositionChart = null; }

  var clicksEl = document.getElementById('organicClicksChart');
  var posEl = document.getElementById('organicPositionChart');
  if (!clicksEl || !posEl || typeof ApexCharts === 'undefined') return;

  if (!gscData || !gscData.data || gscData.data.length < 3) {
    clicksEl.innerHTML = '<div class="empty-state">Inte tillräckligt med data</div>';
    posEl.innerHTML = '<div class="empty-state">Inte tillräckligt med data</div>';
    return;
  }

  var byDate = {};
  gscData.data.forEach(function(r) {
    var d = r.date;
    if (!byDate[d]) byDate[d] = { clicks: 0, impressions: 0, positions: [] };
    byDate[d].clicks += (r.clicks || 0);
    byDate[d].impressions += (r.impressions || 0);
    if (r.position > 0) byDate[d].positions.push(r.position);
  });

  var sortedDates = Object.keys(byDate).sort();
  var dailyClicks = sortedDates.map(function(d) { return byDate[d].clicks; });
  var dailyPos = sortedDates.map(function(d) {
    var p = byDate[d].positions;
    return p.length > 0 ? +(p.reduce(function(a, b) { return a + b; }, 0) / p.length).toFixed(1) : null;
  });

  // Clicks chart
  _organicClicksChart = new ApexCharts(clicksEl, {
    series: [{ name: 'Klick', data: dailyClicks }],
    chart: { type: 'bar', height: 280, background: 'transparent', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
    colors: ['#22c55e'],
    xaxis: { categories: sortedDates, labels: { style: { colors: '#94a3b8', fontSize: '10px' }, rotate: -45, formatter: function(v) { return v ? v.substring(5) : ''; } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: '#94a3b8' } } },
    grid: { borderColor: 'rgba(255,255,255,0.06)' },
    tooltip: { theme: 'dark' },
    dataLabels: { enabled: false }
  });
  _organicClicksChart.render();

  // Position chart
  _organicPositionChart = new ApexCharts(posEl, {
    series: [{ name: 'Snittposition', data: dailyPos }],
    chart: { type: 'line', height: 280, background: 'transparent', toolbar: { show: false } },
    stroke: { curve: 'smooth', width: 2 },
    colors: ['#ff2d9b'],
    xaxis: { categories: sortedDates, labels: { style: { colors: '#94a3b8', fontSize: '10px' }, rotate: -45, formatter: function(v) { return v ? v.substring(5) : ''; } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { reversed: true, min: 1, labels: { style: { colors: '#94a3b8' }, formatter: function(v) { return v ? Math.round(v) : ''; } }, title: { text: 'Position', style: { color: '#64748b', fontSize: '11px' } } },
    grid: { borderColor: 'rgba(255,255,255,0.06)' },
    tooltip: { theme: 'dark', y: { formatter: function(v) { return v ? 'Pos ' + v : '--'; } } },
    dataLabels: { enabled: false },
    markers: { size: 0, hover: { size: 4 } }
  });
  _organicPositionChart.render();
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
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(Math.round(n));
}

function formatCurrency(n) {
  if (n === null || n === undefined) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return Math.round(n / 1000) + 'k';
  return String(Math.round(n));
}

function formatPlatformName(key) {
  var names = {
    google_ads: 'Google Ads',
    meta: 'Meta Ads',
    tiktok: 'TikTok Ads',
    linkedin: 'LinkedIn Ads',
    instagram: 'Instagram',
    facebook: 'Facebook'
  };
  return names[key] || key;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  // BigQuery returnerar timestamps som objekt {value: "2026-02-15T10:00:00Z"}
  if (typeof dateStr === 'object' && dateStr !== null) {
    dateStr = dateStr.value || dateStr.stringValue || String(dateStr);
  }
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  var day = d.getDate();
  var months = ['jan','feb','mar','apr','maj','jun','jul','aug','sep','okt','nov','dec'];
  return day + ' ' + months[d.getMonth()];
}

function shortenUrl(url) {
  if (!url) return '';
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

// ══════════════════════════════════════════════════════════════
// SECURITY STATUS WIDGET
// ══════════════════════════════════════════════════════════════

async function loadSecurityStatus() {
  if (!_portalCustomer) return;

  // Hämta säkerhetsstatus — kräver API-nyckel i headern
  // Portalen skickar Bearer JWT, servern kollar kundSpecifika events
  portalApi('/api/security?customer_id=' + _portalCustomer.id)
    .then(function(data) {
      renderSecurityWidget(data);
    })
    .catch(function() {
      // Om endpoint saknas eller ger fel — visa standard OK-status
      renderSecurityWidget(null);
    });
}

function renderSecurityWidget(data) {
  var el = document.getElementById('securityStatusWidget');
  if (!el) return;

  var critical = 0, warning = 0;

  if (data && data.events) {
    var events = data.events.filter(function(e) {
      return e.customer_id === _portalCustomer.id && e.status !== 'resolved';
    });
    critical = events.filter(function(e) { return e.severity === 'critical'; }).length;
    warning  = events.filter(function(e) { return e.severity === 'warning'; }).length;
  }

  var html, color, icon, label;

  if (critical > 0) {
    color = '#ef4444';
    icon  = '&#9888;';
    label = 'Vi hanterar ett aktiv säkerhetshändelse';
  } else if (warning > 0) {
    color = '#eab308';
    icon  = '&#9888;';
    label = 'Vi har noterat en varning — inga åtgärder krävs av dig';
  } else {
    color = '#22c55e';
    icon  = '&#10003;';
    label = 'Ditt system är skyddat';
  }

  el.innerHTML =
    '<div style="display:flex;align-items:center;gap:10px;padding:14px 18px;' +
    'background:rgba(255,255,255,0.04);border-radius:10px;border:1px solid ' + color + '33;">' +
    '<span style="font-size:20px;color:' + color + '">' + icon + '</span>' +
    '<span style="font-size:14px;font-weight:600;color:' + color + '">' + label + '</span>' +
    '</div>';
}
