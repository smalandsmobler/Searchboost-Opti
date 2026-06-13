/**
 * Content Validator — deterministisk kontroll före content-write till WP
 *
 * Skyddar mot regressioner som annars förstör page-builder-data eller försämrar
 * sidan. Returnerar { ok, errors, warnings } där ok=false betyder att caller
 * MÅSTE blockera skrivningen.
 *
 * Användning:
 *   const v = validateContent(oldContent, newContent, { strict: true });
 *   if (!v.ok) throw new Error('Validation failed: ' + v.errors.join('; '));
 *
 * Skapad 2026-05-01 — del av safe-write-strategin efter optimizer-incidenten.
 */

function countMatches(str, regex) {
  if (!str) return 0;
  const m = str.match(regex);
  return m ? m.length : 0;
}

function countSwedishChars(str) {
  if (!str) return { a: 0, o: 0, ae: 0 };
  return {
    a: countMatches(str, /[åÅ]/g),
    o: countMatches(str, /[öÖ]/g),
    ae: countMatches(str, /[äÄ]/g),
  };
}

function countShortcodes(str) {
  if (!str) return 0;
  // Matcha [shortcode] och [shortcode attr="..."] (men inte [self-closing /]
  // som vi räknar separat — viktigt för Divi och WooCommerce)
  return countMatches(str, /\[[a-zA-Z][a-zA-Z0-9_-]*(\s+[^\]]*)?\]/g);
}

function countGutenbergBlocks(str) {
  if (!str) return { open: 0, close: 0 };
  return {
    open: countMatches(str, /<!--\s*wp:[a-zA-Z0-9/_-]+/g),
    close: countMatches(str, /<!--\s*\/wp:[a-zA-Z0-9/_-]+/g),
  };
}

function countDiviShortcodes(str) {
  if (!str) return 0;
  return countMatches(str, /\[et_pb_[a-zA-Z0-9_]+/g);
}

function hasScriptTag(str) {
  if (!str) return false;
  return /<script[\s>]/i.test(str);
}

/**
 * Validera ny content mot gammal.
 *
 * @param {string} oldContent  Befintligt content från WP (post.content.raw helst)
 * @param {string} newContent  Det vi vill skriva tillbaka
 * @param {object} opts
 *   - strict: boolean — om true, varningar blir errors
 *   - allowGrowthPct: number — hur mycket innehåll får växa (default 200%)
 *   - allowShrinkPct: number — hur mycket får krympa (default 30% — d.v.s. minst 70% kvar)
 * @returns {{ ok: boolean, errors: string[], warnings: string[], stats: object }}
 */
function validateContent(oldContent, newContent, opts = {}) {
  const strict = opts.strict === true;
  const allowGrowthPct = opts.allowGrowthPct ?? 200; // få växa 3x
  const allowShrinkPct = opts.allowShrinkPct ?? 30;  // få krympa 30%

  const errors = [];
  const warnings = [];

  // Hard checks — blockerar alltid
  if (typeof newContent !== 'string' || newContent.length === 0) {
    errors.push('newContent är tom eller inte en sträng');
    return { ok: false, errors, warnings, stats: {} };
  }

  if (hasScriptTag(newContent) && !hasScriptTag(oldContent || '')) {
    errors.push('Ny content innehåller <script>-tag som inte fanns innan (Divi/WP filtrerar ofta bort)');
  }

  if (typeof oldContent !== 'string' || oldContent.length === 0) {
    // Ingen baseline att jämföra mot — kör bara sanity checks
    warnings.push('Ingen oldContent att jämföra mot — diff-kontroller hoppade');
    return {
      ok: errors.length === 0,
      errors,
      warnings,
      stats: { oldLen: 0, newLen: newContent.length }
    };
  }

  // Längd-bounds
  const oldLen = oldContent.length;
  const newLen = newContent.length;
  const growthPct = ((newLen - oldLen) / oldLen) * 100;

  if (growthPct > allowGrowthPct) {
    warnings.push(`Innehåll växer ${growthPct.toFixed(0)}% (>${allowGrowthPct}% gräns)`);
  }
  if (growthPct < -allowShrinkPct) {
    errors.push(`Innehåll krymper ${Math.abs(growthPct).toFixed(0)}% (>${allowShrinkPct}% gräns) — riskerar att tappa data`);
  }

  // ÅÄÖ-preservation
  const oldSwe = countSwedishChars(oldContent);
  const newSwe = countSwedishChars(newContent);
  for (const k of ['a', 'o', 'ae']) {
    const lossPct = oldSwe[k] > 0 ? ((oldSwe[k] - newSwe[k]) / oldSwe[k]) * 100 : 0;
    if (lossPct > 20) {
      const charLabel = k === 'a' ? 'å/Å' : k === 'o' ? 'ö/Ö' : 'ä/Ä';
      errors.push(`Förlorar ${lossPct.toFixed(0)}% av ${charLabel}-tecken (${oldSwe[k]}→${newSwe[k]}) — encoding-bug?`);
    }
  }

  // Shortcode-count match
  const oldSC = countShortcodes(oldContent);
  const newSC = countShortcodes(newContent);
  if (newSC < oldSC * 0.8) {
    errors.push(`Tappar shortcodes: ${oldSC}→${newSC} (>20% förlust riskerar page-builder)`);
  } else if (newSC < oldSC) {
    warnings.push(`Färre shortcodes: ${oldSC}→${newSC}`);
  }

  // Divi-shortcode-count
  const oldDivi = countDiviShortcodes(oldContent);
  const newDivi = countDiviShortcodes(newContent);
  if (oldDivi > 0 && newDivi < oldDivi) {
    errors.push(`Tappar Divi-blocks: ${oldDivi}→${newDivi} (skadar Divi-layouten)`);
  }

  // Gutenberg-block-delimiter-match
  const oldGB = countGutenbergBlocks(oldContent);
  const newGB = countGutenbergBlocks(newContent);
  if (oldGB.open > 0) {
    if (newGB.open < oldGB.open * 0.8) {
      errors.push(`Tappar Gutenberg-block: ${oldGB.open}→${newGB.open} (>20% förlust)`);
    }
    if (newGB.open !== newGB.close) {
      errors.push(`Trasiga Gutenberg-block-tags i nytt content (open=${newGB.open}, close=${newGB.close})`);
    }
  }

  const stats = {
    oldLen, newLen, growthPct: growthPct.toFixed(1),
    oldSwedishChars: oldSwe, newSwedishChars: newSwe,
    oldShortcodes: oldSC, newShortcodes: newSC,
    oldDiviBlocks: oldDivi, newDiviBlocks: newDivi,
    oldGutenbergBlocks: oldGB, newGutenbergBlocks: newGB,
  };

  if (strict && warnings.length > 0) {
    errors.push(...warnings.map(w => `[strict] ${w}`));
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats,
  };
}

/**
 * Validera meta-fält (Rank Math etc.) — separat från content
 */
function validateMeta(meta) {
  const errors = [];
  const warnings = [];

  if (meta?.rank_math_title) {
    const t = meta.rank_math_title;
    if (t.length < 20) warnings.push(`rank_math_title kort: ${t.length} tecken (<20)`);
    if (t.length > 60) warnings.push(`rank_math_title lång: ${t.length} tecken (>60)`);
  }

  if (meta?.rank_math_description) {
    const d = meta.rank_math_description;
    if (d.length < 100) warnings.push(`rank_math_description kort: ${d.length} tecken (<100)`);
    if (d.length > 160) warnings.push(`rank_math_description lång: ${d.length} tecken (>160)`);
  }

  return { ok: errors.length === 0, errors, warnings };
}

module.exports = { validateContent, validateMeta };

// CLI test mode
if (require.main === module) {
  const old = `<!-- wp:paragraph -->
<p>Smålands Kontorsmöbler är en svensk leverantör. [woo_products id="1,2,3"]</p>
<!-- /wp:paragraph -->`;
  const newGood = `<!-- wp:paragraph -->
<p>Smålands Kontorsmöbler är en svensk leverantör av kontorsstolar. [woo_products id="1,2,3"]</p>
<!-- /wp:paragraph -->`;
  const newBad = `<p>Smalands Kontorsmobler ar en svensk leverantor.</p>`;

  console.log('GOOD update:', JSON.stringify(validateContent(old, newGood), null, 2));
  console.log('\nBAD update (lost ÅÄÖ + shortcodes + blocks):', JSON.stringify(validateContent(old, newBad), null, 2));
}
