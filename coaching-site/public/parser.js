/**
 * Parser för Google Takeout-export (Google Fit och/eller Fitbit).
 *
 * Stödjer både .zip och .tgz / .tar.gz (de två format Google Takeout erbjuder).
 * Allt körs i webbläsaren — ingen data lämnar enheten här. Vi extraherar
 * dagliga sammanfattningar (sömn, vilopuls, HRV, steg, aktiva minuter,
 * förbrända kalorier) och slänger råfilerna.
 *
 * Exporten ser olika ut beroende på klocka/app, så parsern är medvetet
 * tolerant: den plockar det den känner igen och rapporterar vad den hittade.
 */

/* global JSZip, pako */

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return { header: [], rows: [] };
  const split = (l) => l.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
  return { header: split(lines[0]), rows: lines.slice(1).map(split) };
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
  const m = String(value).match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function ensure(days, date) {
  if (!date) return null;
  if (!days[date]) days[date] = {};
  return days[date];
}

// --- Fitbit JSON-filer -----------------------------------------------------
function parseFitbitJson(name, json, days, found) {
  const base = name.split('/').pop().toLowerCase();

  if (base.startsWith('sleep') && Array.isArray(json)) {
    json.forEach(rec => {
      const d = ensure(days, isoDate(rec.dateOfSleep || rec.startTime));
      if (d && rec.minutesAsleep != null) d.sleepMinutes = (d.sleepMinutes || 0) + Number(rec.minutesAsleep);
    });
    found.add('sömn');
  } else if (base.includes('resting_heart_rate') && Array.isArray(json)) {
    json.forEach(rec => {
      const d = ensure(days, isoDate(rec.dateTime));
      const v = rec.value && (rec.value.value ?? rec.value);
      if (d && num(v) != null) d.restingHR = num(v);
    });
    found.add('vilopuls');
  } else if (base.startsWith('steps') && Array.isArray(json)) {
    json.forEach(rec => {
      const d = ensure(days, isoDate(rec.dateTime));
      const v = num(rec.value);
      if (d && v != null) d.steps = (d.steps || 0) + v;
    });
    found.add('steg');
  } else if (base.startsWith('calories') && Array.isArray(json)) {
    json.forEach(rec => {
      const d = ensure(days, isoDate(rec.dateTime));
      const v = num(rec.value);
      if (d && v != null) d.calories = (d.calories || 0) + v;
    });
    found.add('kalorier');
  } else if ((base.includes('active_minutes') || base.includes('very_active')) && Array.isArray(json)) {
    json.forEach(rec => {
      const d = ensure(days, isoDate(rec.dateTime));
      const v = num(rec.value);
      if (d && v != null) d.activeMinutes = (d.activeMinutes || 0) + v;
    });
    found.add('aktiva minuter');
  }
}

// --- Fitbit CSV (HRV-sammanfattning) ---------------------------------------
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
  if (dateCol === -1) return;

  const stepCol = findCol(header, 'step');
  const moveCol = findCol(header, 'move', 'minute');
  const avgHrCol = findCol(header, 'average', 'heart', 'rate');
  const calCol = findCol(header, 'calor');
  const sleepCol = findCol(header, 'sleep');
  const fileDate = isoDate(name.split('/').pop());

  rows.forEach(r => {
    const d = ensure(days, isoDate(r[dateCol]) || fileDate);
    if (!d) return;
    if (stepCol !== -1 && num(r[stepCol]) != null) d.steps = num(r[stepCol]);
    if (moveCol !== -1 && num(r[moveCol]) != null) d.activeMinutes = num(r[moveCol]);
    if (avgHrCol !== -1 && num(r[avgHrCol]) != null) d.restingHR = num(r[avgHrCol]);
    if (calCol !== -1 && num(r[calCol]) != null) d.calories = num(r[calCol]);
    if (sleepCol !== -1 && num(r[sleepCol]) != null) {
      const v = num(r[sleepCol]);
      d.sleepMinutes = v > 1000 ? Math.round(v / 60000) : v;
    }
  });
  found.add('Google Fit dagsdata');
}

// --- Routing per fil (gemensam för zip och tar) ----------------------------
function routeFile(name, text, days, found) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.json')) {
    let json;
    try { json = JSON.parse(text); } catch { return; }
    parseFitbitJson(name, json, days, found);
  } else if (lower.endsWith('.csv')) {
    if (lower.includes('fit/') || lower.includes('daily activity')) {
      parseGoogleFitCsv(name, text, days, found);
    } else {
      parseFitbitCsv(name, text, days, found);
    }
  }
}

function relevant(name) {
  const lower = name.toLowerCase();
  if (!/\.(json|csv)$/i.test(lower)) return false;
  // Per-sekund-puls är enormt och behövs inte.
  if (lower.includes('intraday') && lower.includes('heart')) return false;
  return true;
}

// --- TAR-parsning (för .tgz / .tar.gz) ------------------------------------
function parseTar(bytes, onEntry) {
  const decoder = new TextDecoder('utf-8');
  const readStr = (start, len) => decoder.decode(bytes.subarray(start, start + len)).replace(/\0.*$/, '').trim();
  let offset = 0;
  while (offset + 512 <= bytes.length) {
    const name = readStr(offset, 100);
    if (!name) break; // tom block = slut
    const sizeStr = readStr(offset + 124, 12);
    const size = parseInt(sizeStr, 8) || 0;
    const typeflag = String.fromCharCode(bytes[offset + 156]);
    const prefix = readStr(offset + 345, 155);
    const fullName = prefix ? `${prefix}/${name}` : name;
    const contentStart = offset + 512;

    // typeflag '0'/'' = vanlig fil. Hoppa över kataloger och pax/longlink.
    if ((typeflag === '0' || typeflag === '\0' || typeflag === '') &&
        !fullName.includes('PaxHeader') && !fullName.includes('@LongLink')) {
      onEntry(fullName, bytes.subarray(contentStart, contentStart + size), decoder);
    }
    offset = contentStart + Math.ceil(size / 512) * 512;
  }
}

/**
 * Huvudfunktion. Tar en File (.zip / .tgz / .tar.gz) → { days, found, range, dayCount }.
 */
async function parseTakeout(file, onProgress) {
  const days = {};
  const found = new Set();
  const name = file.name.toLowerCase();

  if (name.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(file);
    const entries = Object.values(zip.files).filter(f => !f.dir && relevant(f.name));
    let i = 0;
    for (const entry of entries) {
      i++;
      if (onProgress) onProgress(i / entries.length);
      try {
        routeFile(entry.name, await entry.async('string'), days, found);
      } catch (e) { console.warn('Hoppade över', entry.name, e.message); }
    }
  } else if (name.endsWith('.tgz') || name.endsWith('.tar.gz') || name.endsWith('.gz') || name.endsWith('.tar')) {
    if (onProgress) onProgress(0.15); // uppackning är inte stegvis mätbar
    const buf = new Uint8Array(await file.arrayBuffer());
    const tarBytes = name.endsWith('.tar') ? buf : pako.ungzip(buf);
    if (onProgress) onProgress(0.5);
    parseTar(tarBytes, (entryName, contentBytes, decoder) => {
      if (!relevant(entryName)) return;
      try {
        routeFile(entryName, decoder.decode(contentBytes), days, found);
      } catch (e) { console.warn('Hoppade över', entryName, e.message); }
    });
    if (onProgress) onProgress(1);
  } else {
    throw new Error('Okänt filformat. Använd .zip eller .tgz från Google Takeout.');
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
