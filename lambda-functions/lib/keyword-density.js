/**
 * Keyword density analyzer
 *
 * Räknar hur ofta ett nyckelord (eller flera varianter) förekommer i en text.
 * Optimerad för svenska:
 *   - hanterar ÅÄÖ
 *   - hanterar compound words (matcher "sängar" inom "Kontinentalsängar")
 *   - case-insensitive
 *   - normaliserar whitespace + interpunktion
 *
 * Returnerar:
 *   - density: procent (0–100)
 *   - count: antal förekomster
 *   - totalWords: total ordräkning
 *   - matchedVariants: vilka varianter som hittades
 *
 * Tröskelvärden (rekommenderat för SEO 2026):
 *   - low: < 0.5%
 *   - ok:  0.5–2.5%
 *   - high: > 3%   (risk för keyword stuffing)
 */

const SWEDISH_STOPWORDS = new Set([
  'och','i','att','det','som','en','på','är','av','för','med','till','den','har',
  'de','men','om','inte','jag','han','hon','vi','ni','du','sig','så','här','där',
  'kan','ska','skall','var','vara','varit','ett','eller','när','vad','vem','vilken',
  'mig','dig','sin','sitt','sina','denna','detta','dessa','sedan','också','bara',
  'mycket','mer','mest','några','någon','något','alla','alltid','aldrig','redan',
  'nu','då','då','då','än','ändå','utan','genom','mellan','över','under','före','efter',
  'från','hos','vid','enligt','via','varje','samma','annan','annat','andra','flera'
]);

/**
 * Normalisera text till lowercase, behåll svenska tecken
 */
function normalize(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[^a-zåäöéüø0-9\s-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Räkna ord i text (exklusive stopwords)
 */
function countWords(text, includeStopwords = false) {
  const words = normalize(text).split(/\s+/).filter(w => w.length > 0);
  if (includeStopwords) return words.length;
  return words.filter(w => !SWEDISH_STOPWORDS.has(w)).length;
}

/**
 * Generera varianter av ett nyckelord (singular/plural, böjningar)
 */
function generateVariants(keyword) {
  const k = normalize(keyword);
  const variants = new Set([k]);

  // Svenska pluralformer
  if (k.endsWith('er')) variants.add(k.slice(0, -2));     // skrivare → skrivar
  if (k.endsWith('ar')) variants.add(k.slice(0, -2));     // sängar → säng
  if (k.endsWith('or')) variants.add(k.slice(0, -2));     // soffor → soff
  if (k.endsWith('n'))  variants.add(k.slice(0, -1));     // sängen → säng
  if (k.endsWith('na')) variants.add(k.slice(0, -2));     // sängarna → säng
  if (k.endsWith('s'))  variants.add(k.slice(0, -1));     // genitiv

  // Lägg till basformer och pluraler
  if (!k.endsWith('ar') && !k.endsWith('er') && !k.endsWith('or')) {
    variants.add(k + 'ar');
    variants.add(k + 'er');
    variants.add(k + 'or');
  }

  return Array.from(variants).filter(v => v.length >= 3);
}

/**
 * Räkna förekomster av nyckelordet i texten (inkl. compound words)
 *
 * @param {string} text - texten att analysera
 * @param {string|string[]} keyword - nyckelord eller lista av nyckelord
 * @param {object} opts - { allowCompound: bool, exactOnly: bool }
 */
function countOccurrences(text, keyword, opts = {}) {
  const { allowCompound = true, exactOnly = false } = opts;
  const normalized = normalize(text);
  const keywords = Array.isArray(keyword) ? keyword : [keyword];

  let total = 0;
  const matchedVariants = new Set();

  for (const kw of keywords) {
    const k = normalize(kw);
    if (!k || k.length < 3) continue;

    const variants = exactOnly ? [k] : generateVariants(k);

    for (const variant of variants) {
      // Word boundary match (exakta ordmatchningar)
      const wordRe = new RegExp(`\\b${escapeRegex(variant)}\\b`, 'gi');
      const wordMatches = (normalized.match(wordRe) || []).length;

      if (wordMatches > 0) {
        total += wordMatches;
        matchedVariants.add(variant);
        continue;
      }

      // Compound word match (för svenska — "sängar" inom "kontinentalsängar")
      if (allowCompound && variant.length >= 4) {
        const compoundRe = new RegExp(escapeRegex(variant), 'gi');
        const compoundMatches = (normalized.match(compoundRe) || []).length;
        if (compoundMatches > 0) {
          total += compoundMatches;
          matchedVariants.add(variant + ' (compound)');
        }
      }
    }
  }

  return { count: total, matchedVariants: Array.from(matchedVariants) };
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Klassa densitet enligt SEO-rekommendationer
 *
 * @param {number} density - densitet i procent
 * @param {number} totalWords - total ordmängd (för thin-content-detektion)
 */
function classifyDensity(density, totalWords = null) {
  // Thin content prioriteras — om sidan är < 80 ord är det inte densitet som är problemet
  if (totalWords !== null && totalWords < 80 && density > 0) return 'thin_content';
  if (density === 0) return 'missing';
  if (density < 0.5) return 'low';
  if (density > 3.0) return 'high';
  if (density > 2.5) return 'borderline_high';
  return 'ok';
}

/**
 * Huvud-API: beräkna keyword density för en text + nyckelord
 *
 * @param {string} text
 * @param {string|string[]} keyword
 * @param {object} opts
 * @returns {object} { density, count, totalWords, status, matchedVariants, recommendation }
 */
function analyzeDensity(text, keyword, opts = {}) {
  const totalWords = countWords(text, true); // inkl stopwords för accurate %
  const { count, matchedVariants } = countOccurrences(text, keyword, opts);
  const density = totalWords > 0 ? (count / totalWords) * 100 : 0;
  const status = classifyDensity(density, totalWords);

  let recommendation = null;
  if (status === 'thin_content') {
    const wordsNeeded = 150 - totalWords;
    recommendation = `Thin content — sidan har bara ${totalWords} ord. Lägg till ~${wordsNeeded} ord brödtext (beskrivande stycke om kategorin, materialval, vanliga frågor) för att nå rekommenderat minimum 150 ord`;
  } else if (status === 'missing') {
    recommendation = `Nyckelordet "${Array.isArray(keyword) ? keyword[0] : keyword}" saknas helt — lägg till i H1, ingress och 1–2 ggr i brödtexten`;
  } else if (status === 'low') {
    const target = Math.max(2, Math.ceil(totalWords * 0.012));
    recommendation = `Densiteten är låg (${density.toFixed(2)}%) — öka från ${count} till ca ${target} förekomster för ~1.2% densitet`;
  } else if (status === 'high') {
    const target = Math.max(1, Math.ceil(totalWords * 0.02));
    recommendation = `Densiteten är för hög (${density.toFixed(2)}%) — keyword stuffing-risk. Minska från ${count} till ca ${target} förekomster, eller utöka brödtexten`;
  } else if (status === 'borderline_high') {
    recommendation = `Densiteten ligger högt (${density.toFixed(2)}%) men inom acceptabelt — håll koll och variera med synonymer`;
  }

  return {
    density: Number(density.toFixed(3)),
    count,
    totalWords,
    status,
    matchedVariants,
    recommendation
  };
}

/**
 * Strippa HTML och extrahera ren text för analys
 */
function htmlToText(html) {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = {
  analyzeDensity,
  countWords,
  countOccurrences,
  generateVariants,
  classifyDensity,
  htmlToText,
  normalize,
  SWEDISH_STOPWORDS
};
