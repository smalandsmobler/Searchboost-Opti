/**
 * Parser för Google Takeout-export (Google Fit och/eller Fitbit).
 *
 * Allt körs i webbläsaren — ingen data lämnar enheten här. Vi extraherar
 * dagliga sammanfattningar (sömn, vilopuls, HRV, steg, aktiva minuter,
 * förbrända kalorier) och slänger råfilerna.
 *
 * Exporten ser olika ut beroende på klocka/app, så parsern är medvetet
 * tolerant: den plockar det den känner igen och rapporterar vad den hittade.
 */

/* global JSZip */

// En dag: { sleepMinutes, restingHR, hrv, steps, activeMinutes, calories }
function emptyDay() {
  return {};
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return { header: [], rows: [] };
  const split = (l) => l.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
  const header = split(lines[0]);
  const rows = lines.slice(1).map(split);
  return { header, rows };
}

function findCol(header, ...keywords) {
  const lower = header.map(h => h.toLowerCase());
  for (let i = 0; i < lower.length; i++) {
    if (keywords.every(k => lower[i].includes(k))) return i;
  }
  return -1;
}

function num(v) {
  if (v == null || v === '') return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function isoDate(value) {
  // Plockar ut YYYY-MM-DD ur diverse format.
  const m = String(value).match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function ensure(days, date) {
  if (!date) return null;
  if (!days[date]) days[date] = emptyDay();
  return days[date];
}

// --- Fitbit JSON-filer (per dag eller per intervall) -----------------------
function parseFitbitJson(name, json, days, found) {
  const base = name.split('/').pop().toLowerCase();

  // Sömn: sleep-YYYY-MM-DD.json → [{ dateOfSleep, minutesAsleep }]
  if (base.startsWith('sleep') && Array.isArray(json)) {
    json.forEach(rec => {
      const date = isoDate(rec.dateOfSleep || rec.startTime);
      const d = ensure(days, date);
      if (d && rec.minutesAsleep != null) {
        d.sleepMinutes = (d.sleepMinutes || 0) + Number(rec.minutesAsleep);
      }
    });
    found.add('sömn');
    return;
  }

  // Vilopuls: resting_heart_rate-YYYY-MM-DD.json → [{ dateTime, value:{value} }]
  if (base.includes('resting_heart_rate') && Array.isArray(json)) {
    json.forEach(rec => {
      const date = isoDate(rec.dateTime);
      const d = ensure(days, date);
      const v = rec.value && (rec.value.value ?? rec.value);
      if (d && num(v) != null) d.restingHR = num(v);
    });
    found.add('vilopuls');
    return;
  }

  // Steg (per minut) → summera per dag
  if (base.startsWith('steps') && Array.isArray(json)) {
    json.forEach(rec => {
      const date = isoDate(rec.dateTime);
      const d = ensure(days, date);
      const v = num(rec.value);
      if (d && v != null) d.steps = (d.steps || 0) + v;
    });
    found.add('steg');
    return;
  }

  // Kalorier (per minut) → summera per dag
  if (base.startsWith('calories') && Array.isArray(json)) {
    json.forEach(rec => {
      const date = isoDate(rec.dateTime);
      const d = ensure(days, date);
      const v = num(rec.value);
      if (d && v != null) d.calories = (d.calories || 0) + v;
    });
    found.add('kalorier');
    return;
  }

  // Aktiva minuter (very/fairly active)
  if ((base.includes('active_minutes') || base.includes('very_active')) && Array.isArray(json)) {
    json.forEach(rec => {
      const date = isoDate(rec.dateTime);
      const d = ensure(days, date);
      const v = num(rec.value);
      if (d && v != null) d.activeMinutes = (d.activeMinutes || 0) + v;
    });
    found.add('aktiva minuter');
  }
}

// --- Fitbit CSV (HRV-sammanfattning, Active Zone Minutes) ------------------
function parseFitbitCsv(name, text, days, found) {
  const lower = name.toLowerCase();
  const { header, rows } = parseCSV(text);
  if (header.length === 0) return;

  if (lower.includes('heart rate variability') || lower.includes('hrv')) {
    const tCol = findCol(header, 'timestamp') !== -1 ? findCol(header, 'timestamp') : 0;
    const rmssd = findCol(header, 'rmssd');
    if (rmssd !== -1) {
      rows.forEach(r => {
        const d = ensure(days, isoDate(r[tCol]));
        if (d && num(r[rmssd]) != null) d.hrv = num(r[rmssd]);
      });
      found.add('HRV');
    }
  }
}

// --- Google Fit "Daily activity metrics" CSV ------------------------------
function parseGoogleFitCsv(name, text, days, found) {
  const { header, rows } = parseCSV(text);
  if (header.length === 0) return;

  const dateCol = findCol(header, 'date');
  if (dateCol === -1) return; // Inte en daglig metrik-fil

  const stepCol = findCol(header, 'step');
  const moveCol = findCol(header, 'move', 'minute');
  const avgHrCol = findCol(header, 'average', 'heart', 'rate');
  const calCol = findCol(header, 'calor');
  const sleepCol = findCol(header, 'sleep'); // ofta i millisekunder

  // Datumet i Google Fit-filnamnet ligger ibland bara i filnamnet.
  const fileDate = isoDate(name.split('/').pop());

  rows.forEach(r => {
    const date = isoDate(r[dateCol]) || fileDate;
    const d = ensure(days, date);
    if (!d) return;
    if (stepCol !== -1 && num(r[stepCol]) != null) d.steps = num(r[stepCol]);
    if (moveCol !== -1 && num(r[moveCol]) != null) d.activeMinutes = num(r[moveCol]);
    if (avgHrCol !== -1 && num(r[avgHrCol]) != null) d.restingHR = num(r[avgHrCol]);
    if (calCol !== -1 && num(r[calCol]) != null) d.calories = num(r[calCol]);
    if (sleepCol !== -1 && num(r[sleepCol]) != null) {
      const v = num(r[sleepCol]);
      // Millisekunder → minuter om värdet är orimligt stort.
      d.sleepMinutes = v > 1000 ? Math.round(v / 60000) : v;
    }
  });
  found.add('Google Fit dagsdata');
}

/**
 * Huvudfunktion. Tar en File (zip) → { days, found, range, dayCount }.
 * onProgress(0..1) anropas under uppackning.
 */
async function parseTakeout(file, onProgress) {
  const zip = await JSZip.loadAsync(file);
  const days = {};
  const found = new Set();

  const entries = Object.values(zip.files).filter(f => !f.dir);
  let i = 0;

  for (const entry of entries) {
    i++;
    if (onProgress) onProgress(i / entries.length);

    const name = entry.name;
    const lower = name.toLowerCase();

    // Hoppa över irrelevanta/tunga filer vi inte använder.
    if (!/\.(json|csv)$/i.test(lower)) continue;
    if (lower.includes('intraday') && lower.endsWith('.json') && lower.includes('heart')) {
      continue; // per-sekund-puls är enormt och behövs inte
    }

    try {
      const text = await entry.async('string');
      if (lower.endsWith('.json')) {
        let json;
        try { json = JSON.parse(text); } catch { continue; }
        parseFitbitJson(name, json, days, found);
      } else if (lower.endsWith('.csv')) {
        if (lower.includes('fit/') || lower.includes('daily activity')) {
          parseGoogleFitCsv(name, text, days, found);
        } else {
          parseFitbitCsv(name, text, days, found);
        }
      }
    } catch (e) {
      // Tolerant: hoppa över filer som strular.
      console.warn('Hoppade över', name, e.message);
    }
  }

  const dates = Object.keys(days).filter(d => Object.keys(days[d]).length > 0).sort();
  return {
    days,
    found: [...found],
    range: dates.length ? { from: dates[0], to: dates[dates.length - 1] } : null,
    dayCount: dates.length,
  };
}

window.parseTakeout = parseTakeout;
