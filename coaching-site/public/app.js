/* Coachning — frontend-logik. All hälsodata lever i localStorage på enheten. */

const STORE = {
  health: 'coach.health',
  checkins: 'coach.checkins',
  tone: 'coach.tone',
  chat: 'coach.chat',
  token: 'coach.token',
};

const TONE_WORDS = { 1: 'Bara vila', 2: 'Mjuk', 3: 'Balanserad', 4: 'Peppig', 5: 'Full fart' };

const load = (k, fallback) => {
  try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
  catch { return fallback; }
};
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// --- Navigering -----------------------------------------------------------
function goTo(tab) {
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === tab));
  if (tab === 'overview') renderOverview();
  if (tab === 'checkin') renderCheckinHistory();
}
$$('.tab').forEach(t => t.addEventListener('click', () => goTo(t.dataset.tab)));
document.addEventListener('click', (e) => {
  const g = e.target.closest('[data-goto]');
  if (g) { e.preventDefault(); goTo(g.dataset.goto); }
});

// --- Ton-reglage ----------------------------------------------------------
const toneSlider = $('#tone');
toneSlider.value = load(STORE.tone, 2);
function syncTone() {
  $('#tone-label').textContent = TONE_WORDS[toneSlider.value];
  save(STORE.tone, Number(toneSlider.value));
}
toneSlider.addEventListener('input', syncTone);
syncTone();

// --- Datasammanfattning (det enda som skickas till coachen) ---------------
function series(days, metric, transform = (v) => v) {
  return Object.keys(days).sort()
    .map(d => ({ date: d, v: days[d][metric] }))
    .filter(p => p.v != null)
    .map(p => ({ date: p.date, v: transform(p.v) }));
}
const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
const lastN = (arr, n) => arr.slice(-n);
const round = (v, d = 0) => v == null ? null : Number(v.toFixed(d));

function buildDataSummary() {
  const health = load(STORE.health, null);
  const checkins = load(STORE.checkins, []);
  const lines = [];

  if (health && health.dayCount) {
    lines.push(`Period: ${health.range.from} till ${health.range.to} (${health.dayCount} dagar med data).`);

    const sleep = series(health.days, 'sleepMinutes', v => v / 60);
    if (sleep.length) {
      const a7 = round(avg(lastN(sleep, 7).map(p => p.v)), 1);
      const a30 = round(avg(lastN(sleep, 30).map(p => p.v)), 1);
      lines.push(`Sömn: snitt ${a7}h senaste 7 dgr (${a30}h senaste 30 dgr).`);
    }
    const rhr = series(health.days, 'restingHR');
    if (rhr.length) lines.push(`Vilopuls: snitt ${round(avg(lastN(rhr, 7).map(p => p.v)))} bpm senaste 7 dgr.`);

    const hrv = series(health.days, 'hrv');
    if (hrv.length) lines.push(`HRV (rmssd): snitt ${round(avg(lastN(hrv, 7).map(p => p.v)))} senaste 7 dgr.`);

    const steps = series(health.days, 'steps');
    if (steps.length) lines.push(`Steg: snitt ${round(avg(lastN(steps, 7).map(p => p.v)))}/dag senaste 7 dgr.`);

    const act = series(health.days, 'activeMinutes');
    if (act.length) lines.push(`Aktiva minuter: snitt ${round(avg(lastN(act, 7).map(p => p.v)))}/dag senaste 7 dgr.`);
  }

  if (checkins.length) {
    const recent = lastN(checkins, 3).map(c =>
      `${c.date}: energi ${c.energy}/5, humör ${c.mood}/5, vila ${c.rested}/5${c.note ? ` — "${c.note}"` : ''}`
    );
    lines.push(`Senaste incheckningar:\n${recent.join('\n')}`);
  }

  return lines.join('\n');
}

function todaysCheckin() {
  const checkins = load(STORE.checkins, []);
  const today = new Date().toISOString().slice(0, 10);
  const c = checkins.find(x => x.date === today);
  if (!c) return '';
  return `Energi ${c.energy}/5, humör ${c.mood}/5, vila ${c.rested}/5${c.note ? `. Skrev: "${c.note}"` : ''}`;
}

// --- Anrop till coachen ---------------------------------------------------
async function askCoach(messages) {
  const res = await fetch('/api/coach', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem(STORE.token) || ''}`,
    },
    body: JSON.stringify({
      messages,
      dataSummary: buildDataSummary(),
      checkin: todaysCheckin(),
      toneLevel: Number(toneSlider.value),
    }),
  });
  if (res.status === 401) {
    showLogin();
    throw new Error('Du loggades ut. Logga in igen.');
  }
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'Något gick fel.');
  }
  return (await res.json()).reply;
}

// --- Översikt -------------------------------------------------------------
function sparkline(points) {
  if (points.length < 2) return '';
  const vals = points.map(p => p.v);
  const min = Math.min(...vals), max = Math.max(...vals);
  const span = max - min || 1;
  const w = 200, h = 38, pad = 3;
  const step = (w - pad * 2) / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = pad + i * step;
    const y = h - pad - ((p.v - min) / span) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
    <polyline points="${coords.join(' ')}" fill="none" stroke="var(--sage)" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function card(label, value, unit, points) {
  return `<div class="card">
    <div class="label">${label}</div>
    <div class="value">${value}<span class="unit"> ${unit}</span></div>
    ${sparkline(points)}
  </div>`;
}

function gentleNote(health) {
  const sleep = series(health.days, 'sleepMinutes', v => v / 60);
  const a7 = avg(lastN(sleep, 7).map(p => p.v));
  if (a7 != null && a7 < 6.5) {
    return 'Din kropp har fått ganska lite sömn senaste tiden. Det säger inget om dig — det är bara ett tecken på att vila får ta plats idag. Var extra snäll mot dig själv. 💛';
  }
  if (a7 != null && a7 >= 7.5) {
    return 'Fin sömn senaste veckan — kroppen får återhämtning. Inget måste idag, bara att fortsätta lyssna inåt. 🌿';
  }
  return 'Kom ihåg: siffrorna här är bara information, inte krav. Du gör tillräckligt precis som det är. 💛';
}

function renderOverview() {
  const health = load(STORE.health, null);
  const hasData = health && health.dayCount > 0;
  $('#no-data').classList.toggle('hidden', hasData);
  $('#overview-content').classList.toggle('hidden', !hasData);
  if (!hasData) return;

  $('#period').textContent = `Data från ${health.range.from} till ${health.range.to}`;

  const cards = [];
  const sleep = series(health.days, 'sleepMinutes', v => v / 60);
  if (sleep.length) cards.push(card('Sömn (snitt 7 dgr)', round(avg(lastN(sleep, 7).map(p => p.v)), 1), 'h', lastN(sleep, 30)));

  const rhr = series(health.days, 'restingHR');
  if (rhr.length) cards.push(card('Vilopuls', round(avg(lastN(rhr, 7).map(p => p.v))), 'bpm', lastN(rhr, 30)));

  const hrv = series(health.days, 'hrv');
  if (hrv.length) cards.push(card('HRV', round(avg(lastN(hrv, 7).map(p => p.v))), 'ms', lastN(hrv, 30)));

  const steps = series(health.days, 'steps');
  if (steps.length) cards.push(card('Steg (snitt 7 dgr)', round(avg(lastN(steps, 7).map(p => p.v))), '', lastN(steps, 30)));

  const act = series(health.days, 'activeMinutes');
  if (act.length) cards.push(card('Aktiva min', round(avg(lastN(act, 7).map(p => p.v))), 'min', lastN(act, 30)));

  $('#metric-cards').innerHTML = cards.join('');
  renderHero();
}

// --- Incheckning ----------------------------------------------------------
const checkinDraft = { energy: null, mood: null, rested: null };
$$('.emoji-row').forEach(row => {
  row.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    [...row.children].forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    checkinDraft[row.dataset.field] = Number(btn.dataset.val);
  });
});

$('#save-checkin').addEventListener('click', () => {
  const today = new Date().toISOString().slice(0, 10);
  const checkins = load(STORE.checkins, []).filter(c => c.date !== today);
  checkins.push({
    date: today,
    energy: checkinDraft.energy,
    mood: checkinDraft.mood,
    rested: checkinDraft.rested,
    note: $('#note').value.trim(),
  });
  save(STORE.checkins, checkins);
  $('#checkin-saved').classList.remove('hidden');
  renderCheckinHistory();
});

function renderCheckinHistory() {
  const checkins = load(STORE.checkins, []).slice().reverse().slice(0, 7);
  if (!checkins.length) { $('#checkin-history').innerHTML = ''; return; }
  $('#checkin-history').innerHTML = '<h3 style="font-weight:600;font-size:1rem">Senaste dagarna</h3>' +
    checkins.map(c => `<div class="checkin-entry">
      <span class="date">${c.date}</span><br>
      Energi ${c.energy ?? '–'}/5 · Humör ${c.mood ?? '–'}/5 · Vila ${c.rested ?? '–'}/5
      ${c.note ? `<br><em>${escapeHtml(c.note)}</em>` : ''}
    </div>`).join('');
}

// --- Kost & energi --------------------------------------------------------
const FOOD_TIPS = [
  ['Ät regelbundet', 'Vid utmattning hjälper jämn blodsockernivå humör och energi. Små mål ofta är ofta snällare än stora.'],
  ['Protein till frukost', 'Ägg, yoghurt, keso eller bönor på morgonen ger stadigare energi genom dagen.'],
  ['Magnesium &amp; B-vitaminer', 'Gröna blad, nötter, fullkorn och baljväxter stöttar nervsystemet. Bra mat för en trött kropp.'],
  ['Drick vatten', 'Lätt uttorkning känns ofta som trötthet. Ett glas vatten är ett snällt litet steg.'],
  ['Inga regler, ingen skam', 'Mat ska ge energi och glädje just nu — inte vara ännu en sak att prestera i.'],
];
$('#food-tips').innerHTML = FOOD_TIPS.map(([t, b]) =>
  `<div class="food-tip"><strong>${t}</strong>${b}</div>`).join('');

$('#meal-idea').addEventListener('click', async (e) => {
  const btn = e.target;
  btn.disabled = true;
  const out = $('#meal-output');
  out.classList.remove('hidden');
  out.textContent = 'Tänker ut något gott och enkelt...';
  try {
    const reply = await askCoach([{
      role: 'user',
      content: 'Ge mig en enkel, närande och energigivande måltidsidé för idag som inte kräver mycket ork att laga. Kort och snällt.',
    }]);
    out.textContent = reply;
  } catch (err) {
    out.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

// --- Chat -----------------------------------------------------------------
function escapeHtml(s) {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function renderChat() {
  const chat = load(STORE.chat, []);
  const box = $('#chat');
  if (!chat.length) {
    box.innerHTML = `<div class="bubble coach">Hej 💛 Jag finns här för dig — som PT, dietist, livscoach och peppare, men mest som någon som lyssnar. Hur mår du just nu?</div>`;
  } else {
    box.innerHTML = chat.map(m =>
      `<div class="bubble ${m.role === 'user' ? 'user' : 'coach'}">${escapeHtml(m.content)}</div>`).join('');
  }
  box.scrollTop = box.scrollHeight;
}

async function sendChat(text) {
  if (!text.trim()) return;
  const chat = load(STORE.chat, []);
  chat.push({ role: 'user', content: text.trim() });
  save(STORE.chat, chat);
  renderChat();

  const box = $('#chat');
  const typing = document.createElement('div');
  typing.className = 'bubble coach typing';
  typing.textContent = 'skriver...';
  box.appendChild(typing);
  box.scrollTop = box.scrollHeight;

  try {
    const reply = await askCoach(chat);
    chat.push({ role: 'assistant', content: reply });
    save(STORE.chat, chat);
  } catch (err) {
    chat.push({ role: 'assistant', content: err.message });
    save(STORE.chat, chat);
  }
  renderChat();
}

$('#chat-send').addEventListener('click', () => {
  const t = $('#chat-text').value;
  $('#chat-text').value = '';
  sendChat(t);
});
$('#chat-text').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    $('#chat-send').click();
  }
});

const QUICK = [
  'Jag är helt slut idag',
  'Hjälp mig komma igång varsamt',
  'Vad säger min sömn?',
  'Jag mår dåligt',
  'Peppa mig lite',
];
$('#quick-prompts').innerHTML = QUICK.map(q => `<button>${q}</button>`).join('');
$('#quick-prompts').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b) sendChat(b.textContent);
});

// --- Datauppladdning ------------------------------------------------------
const fileInput = $('#file-input');
$('#upload-zone').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', async () => {
  const file = fileInput.files[0];
  if (!file) return;
  const status = $('#parse-status');
  status.classList.remove('hidden');
  status.innerHTML = `Läser ${escapeHtml(file.name)}...
    <div class="progress-bar"><div id="pbar"></div></div>`;
  try {
    const result = await parseTakeout(file, (p) => {
      const bar = $('#pbar');
      if (bar) bar.style.width = `${Math.round(p * 100)}%`;
    });
    if (!result.dayCount) {
      status.innerHTML = 'Hittade ingen igenkänd hälsodata i filen. Kontrollera att du exporterade <strong>Fitbit</strong> eller <strong>Fit</strong> från Google Takeout.';
      return;
    }
    save(STORE.health, result);
    status.innerHTML = `Klart! 🌿 Hittade <strong>${result.dayCount}</strong> dagar med data
      (${result.found.join(', ')}), från ${result.range.from} till ${result.range.to}.
      <br><button class="btn-primary" style="margin-top:0.8rem" data-goto="overview">Visa min översikt</button>`;
  } catch (err) {
    status.innerHTML = `Kunde inte läsa filen: ${escapeHtml(err.message)}`;
  }
});

$('#clear-data').addEventListener('click', () => {
  if (!confirm('Radera all sparad data (hälsodata, incheckningar och chatt) från den här enheten?')) return;
  [STORE.health, STORE.checkins, STORE.chat].forEach(k => localStorage.removeItem(k));
  renderChat(); renderOverview(); renderCheckinHistory();
  $('#parse-status').classList.add('hidden');
  alert('Allt raderat från enheten.');
});

// --- Greeting & dagens råd -------------------------------------------------
function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'God natt 🌙';
  if (h < 10) return 'God morgon 🌅';
  if (h < 13) return 'Hej på dagen 💛';
  if (h < 18) return 'God eftermiddag 🌿';
  return 'God kväll 🌙';
}

function heroNote() {
  const health = load(STORE.health, null);
  if (health && health.dayCount) return gentleNote(health);
  return 'Ta det i din egen takt idag. Du behöver inte prestera något här.';
}

function renderHero() {
  $('#greeting').textContent = greeting();
  $('#hero-note').textContent = heroNote();
}

$('#daily-advice-btn').addEventListener('click', async (e) => {
  const btn = e.target;
  btn.disabled = true;
  const out = $('#daily-advice');
  out.classList.remove('hidden');
  out.textContent = 'Coachen tänker efter...';
  try {
    out.textContent = await askCoach([{
      role: 'user',
      content: 'Ge mig en kort, varm hälsning och ETT enda mjukt, konkret förslag för idag utifrån hur jag mått och min data. Max 3-4 meningar.',
    }]);
  } catch (err) {
    out.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

// --- Inloggning ------------------------------------------------------------
function showLogin() {
  $('#login-overlay').classList.remove('hidden');
  $('#app').classList.add('hidden');
}
function showApp() {
  $('#login-overlay').classList.add('hidden');
  $('#app').classList.remove('hidden');
  initApp();
}

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('#login-btn');
  const err = $('#login-error');
  err.classList.add('hidden');
  btn.disabled = true; btn.textContent = 'Loggar in...';
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: $('#login-email').value,
        password: $('#login-pass').value,
      }),
    });
    if (!res.ok) {
      const e2 = await res.json().catch(() => ({}));
      throw new Error(e2.error || 'Inloggning misslyckades.');
    }
    const { token } = await res.json();
    localStorage.setItem(STORE.token, token);
    showApp();
  } catch (e3) {
    err.textContent = e3.message;
    err.classList.remove('hidden');
  } finally {
    btn.disabled = false; btn.textContent = 'Logga in';
  }
});

$('#logout-btn').addEventListener('click', () => {
  localStorage.removeItem(STORE.token);
  showLogin();
});

// --- Init -----------------------------------------------------------------
let appInited = false;
function initApp() {
  renderHero();
  renderChat();
  renderOverview();
  renderCheckinHistory();
  appInited = true;
}

if (localStorage.getItem(STORE.token)) {
  showApp();
} else {
  showLogin();
}
