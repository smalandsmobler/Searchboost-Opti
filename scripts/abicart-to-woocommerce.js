/**
 * Abicart CSV to WooCommerce CSV Converter
 *
 * Converts an Abicart product export CSV into WooCommerce-compatible
 * import format, handling:
 *   - Simple products (single row per Produktnummer)
 *   - Variable products with variations (multiple rows per Produktnummer)
 *   - Swedish characters (UTF-8)
 *   - Weight conversion (grams -> kg)
 *   - Category mapping (Produktgrupp > Undergrupp 1)
 *   - Attribute extraction from Abicart attribute columns
 *
 * Usage: node abicart-to-woocommerce.js
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// --- Configuration ---
const INPUT_FILE = '/Users/weerayootandersson/Downloads/webshop_articles_66230 (3).csv';
const OUTPUT_DIR = path.resolve(__dirname, 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'woocommerce-import.csv');

// Abicart attribute columns (index 42-96) — all the "(SV)" columns
// We extract the attribute name from the header by stripping " (SV)" and trailing colons/spaces
const ATTRIBUTE_COL_START = 42;
const ATTRIBUTE_COL_END = 96; // inclusive

// --- Helpers ---

/**
 * Clean an attribute name from the CSV header.
 * "Färg: (SV)" -> "Färg"
 * "Storlek skiva: (SV)" -> "Storlek skiva"
 * "Färg (SV)" -> "Färg"
 */
function cleanAttributeName(header) {
  return header
    .replace(/\s*\(SV\)\s*$/i, '')  // remove (SV) suffix
    .replace(/:\s*$/, '')             // remove trailing colon
    .replace(/:{2,}\s*$/, '')         // remove double colons (e.g. "Plast rygg::")
    .trim();
}

/**
 * Convert grams to kg, return as string with up to 3 decimals.
 */
function gramsToKg(grams) {
  if (!grams || grams === '0') return '';
  const kg = parseFloat(grams) / 1000;
  if (isNaN(kg) || kg === 0) return '';
  return kg.toFixed(3).replace(/\.?0+$/, ''); // trim trailing zeros
}

/**
 * Build WooCommerce category string: "Parent > Child"
 */
function buildCategory(produktgrupp, undergrupp) {
  const parent = (produktgrupp || '').trim();
  const child = (undergrupp || '').trim();
  if (!parent) return '';
  if (!child) return parent;
  return `${parent} > ${child}`;
}

/**
 * Strip BOM from string
 */
function stripBom(str) {
  if (str.charCodeAt(0) === 0xFEFF) {
    return str.slice(1);
  }
  return str;
}

// --- Main ---

function main() {
  console.log('=== Abicart to WooCommerce CSV Converter ===\n');

  // 1. Read input CSV
  console.log(`Reading: ${INPUT_FILE}`);
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`ERROR: Input file not found: ${INPUT_FILE}`);
    process.exit(1);
  }

  const rawCsv = stripBom(fs.readFileSync(INPUT_FILE, 'utf-8'));

  // 2. Parse CSV
  console.log('Parsing CSV...');
  const records = parse(rawCsv, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: false, // preserve whitespace in descriptions
    bom: true,
  });

  console.log(`Parsed ${records.length} rows`);

  // Get headers to identify attribute columns
  const headers = Object.keys(records[0]);
  console.log(`CSV has ${headers.length} columns`);

  // Identify attribute columns (those ending with "(SV)" in the attribute range)
  // We'll collect all columns from index 42 onwards that contain "(SV)"
  const attributeColumns = [];
  for (let i = ATTRIBUTE_COL_START; i <= Math.min(ATTRIBUTE_COL_END, headers.length - 1); i++) {
    const h = headers[i];
    if (h && h.includes('(SV)')) {
      attributeColumns.push({
        index: i,
        originalHeader: h,
        cleanName: cleanAttributeName(h),
      });
    }
  }
  console.log(`Found ${attributeColumns.length} attribute columns`);

  // Key column names (from the actual headers)
  const COL = {
    produktnummer: headers[0],   // "Produktnummer" (may have BOM prefix)
    produkttyp: headers[1],       // "Produkttyp"
    namn: headers[4],             // "Namn (SV)"
    shortDesc: headers[5],        // "Inledande text (SV)"
    description: headers[6],      // "Beskrivning (SV)"
    pris: headers[8],             // "Pris (SEK)"
    extrapris: headers[9],        // "Extrapris (SEK)"
    moms: headers[10],            // "Moms procentsats"
    lagerhantering: headers[12],  // "Lagerhantering (1/0)"
    lagersaldo: headers[13],      // "Lagersaldo"
    bilder: headers[25],          // "Bilder"
    vikt: headers[32],            // "Vikt (g)"
    metaKeywords: headers[38],    // "META keywords (SV)"
    metaDesc: headers[39],        // "META description (SV)"
    varumarke: headers[40],       // "Varumärke"
    produktgrupp: headers[97],    // "Produktgrupp"
    undergrupp: headers[98],      // "Undergrupp 1"
    dolj: headers[29],            // "Dölj produkt (1/0)"
    enbart_visning: headers[31],  // "Enbart för visning (1/0)"
  };

  // Debug: print key column mappings
  console.log('\nColumn mappings:');
  for (const [key, val] of Object.entries(COL)) {
    console.log(`  ${key}: "${val}"`);
  }
  console.log('');

  // 3. Group rows by Produktnummer
  const groups = new Map(); // produktnummer -> array of rows
  let skippedEmpty = 0;
  let skippedHidden = 0;

  for (const row of records) {
    const pnr = (row[COL.produktnummer] || '').trim();
    if (!pnr) {
      skippedEmpty++;
      continue;
    }

    // Skip hidden/display-only products
    const isHidden = row[COL.dolj] === '1';
    if (isHidden) {
      skippedHidden++;
      continue;
    }

    if (!groups.has(pnr)) {
      groups.set(pnr, []);
    }
    groups.get(pnr).push(row);
  }

  console.log(`Grouped into ${groups.size} unique products`);
  console.log(`Skipped ${skippedEmpty} rows with empty Produktnummer`);
  console.log(`Skipped ${skippedHidden} hidden products`);

  // 4. Convert to WooCommerce format
  const wooRows = [];
  let simpleCount = 0;
  let variableCount = 0;
  let variationCount = 0;
  let skippedEmptyVariantsTotal = 0;

  for (const [pnr, rows] of groups) {
    const parentRow = rows[0]; // first row is always the parent
    const hasVariants = rows.length > 1;

    // Determine which attributes are used across all rows in this group
    const usedAttributes = [];
    if (hasVariants) {
      for (const attrCol of attributeColumns) {
        const values = new Set();
        for (const row of rows) {
          const val = (row[attrCol.originalHeader] || '').trim();
          if (val) values.add(val);
        }
        if (values.size > 0) {
          usedAttributes.push({
            ...attrCol,
            allValues: [...values],
          });
        }
      }
    }

    // --- Parent / Simple product ---
    const category = buildCategory(
      parentRow[COL.produktgrupp],
      parentRow[COL.undergrupp]
    );

    const name = (parentRow[COL.namn] || '').trim();
    const shortDesc = (parentRow[COL.shortDesc] || '').trim();
    const description = (parentRow[COL.description] || '').trim();
    const regularPrice = (parentRow[COL.pris] || '').trim();
    const salePrice = (parentRow[COL.extrapris] || '').trim();
    const momsPercent = (parentRow[COL.moms] || '').trim();
    const manageStock = parentRow[COL.lagerhantering] === '1' ? 'yes' : 'no';
    const stockQty = (parentRow[COL.lagersaldo] || '').trim();
    const inStock = manageStock === 'yes' ? (parseInt(stockQty) > 0 ? 1 : 0) : 1;
    const images = (parentRow[COL.bilder] || '').trim();
    const weightKg = gramsToKg(parentRow[COL.vikt]);
    const metaDesc = (parentRow[COL.metaDesc] || '').trim();
    const brand = (parentRow[COL.varumarke] || '').trim();

    // Tax class: 25% = standard (Swedish default)
    const taxClass = momsPercent === '25' ? '' : (momsPercent === '12' ? 'reduced-rate' : (momsPercent === '6' ? 'zero-rate' : ''));

    // Skip products with no name (variant-only rows that got grouped wrong)
    if (!name && !hasVariants) continue;
    // If name is empty but it has variants, use first variant info
    const displayName = name || `Product ${pnr}`;

    if (hasVariants) {
      // VARIABLE product
      variableCount++;

      const parentWoo = {
        'Type': 'variable',
        'SKU': pnr,
        'Name': displayName,
        'Published': 1,
        'Is featured?': 0,
        'Visibility in catalog': 'visible',
        'Short description': shortDesc,
        'Description': description,
        'Tax status': 'taxable',
        'Tax class': taxClass,
        'In stock?': 1,
        'Stock': '',
        'Manage stock?': 'no', // managed at variation level
        'Regular price': '', // set at variation level
        'Sale price': '',
        'Categories': category,
        'Tags': brand ? brand : '',
        'Images': images,
        'Weight (kg)': weightKg,
        'Parent': '',
        'Meta: _yoast_wpseo_metadesc': metaDesc,
      };

      // Add attribute columns for parent (all possible values, pipe-separated)
      for (let a = 0; a < usedAttributes.length; a++) {
        const attr = usedAttributes[a];
        const num = a + 1;
        parentWoo[`Attribute ${num} name`] = attr.cleanName;
        parentWoo[`Attribute ${num} value(s)`] = attr.allValues.join(' | ');
        parentWoo[`Attribute ${num} visible`] = 1;
        parentWoo[`Attribute ${num} global`] = 1;
      }

      wooRows.push(parentWoo);

      // VARIATIONS — skip the parent row (index 0), start from index 1
      // The parent row has Produkttyp="Standard" and the product name,
      // while variant rows have empty Produkttyp and attribute values.
      // Also skip variant rows that have NO attribute values (Abicart "default" variants).
      const variantRows = rows.slice(1).filter(varRow => {
        // Check if this variant row has at least one attribute value
        for (const attrCol of usedAttributes) {
          const val = (varRow[attrCol.originalHeader] || '').trim();
          if (val) return true;
        }
        return false;
      });
      let skippedEmptyVariants = rows.length - 1 - variantRows.length;
      if (skippedEmptyVariants > 0) {
        skippedEmptyVariantsTotal += skippedEmptyVariants;
      }
      for (let v = 0; v < variantRows.length; v++) {
        const varRow = variantRows[v];
        variationCount++;

        const varPrice = (varRow[COL.pris] || regularPrice || '').trim();
        const varSalePrice = (varRow[COL.extrapris] || '').trim();
        const varStock = (varRow[COL.lagersaldo] || '').trim();
        const varManageStock = varRow[COL.lagerhantering] === '1' ? 'yes' : (manageStock || 'no');
        const varInStock = varManageStock === 'yes' ? (parseInt(varStock) > 0 ? 1 : 0) : 1;
        const varImages = (varRow[COL.bilder] || '').trim();
        const varWeight = gramsToKg(varRow[COL.vikt]) || weightKg;

        // Build a SKU suffix from variant index
        const varSku = `${pnr}-${v + 1}`;

        const variationWoo = {
          'Type': 'variation',
          'SKU': varSku,
          'Name': '',
          'Published': 1,
          'Is featured?': 0,
          'Visibility in catalog': 'visible',
          'Short description': '',
          'Description': '',
          'Tax status': 'taxable',
          'Tax class': taxClass,
          'In stock?': varInStock,
          'Stock': varStock,
          'Manage stock?': varManageStock,
          'Regular price': varPrice,
          'Sale price': varSalePrice,
          'Categories': '',
          'Tags': '',
          'Images': varImages,
          'Weight (kg)': varWeight,
          'Parent': pnr, // parent SKU
          'Meta: _yoast_wpseo_metadesc': '',
        };

        // Add attribute values for this specific variation
        for (let a = 0; a < usedAttributes.length; a++) {
          const attr = usedAttributes[a];
          const num = a + 1;
          const val = (varRow[attr.originalHeader] || '').trim();
          variationWoo[`Attribute ${num} name`] = attr.cleanName;
          variationWoo[`Attribute ${num} value(s)`] = val;
          variationWoo[`Attribute ${num} visible`] = 1;
          variationWoo[`Attribute ${num} global`] = 1;
        }

        wooRows.push(variationWoo);
      }
    } else {
      // SIMPLE product
      simpleCount++;

      const simpleWoo = {
        'Type': 'simple',
        'SKU': pnr,
        'Name': displayName,
        'Published': 1,
        'Is featured?': 0,
        'Visibility in catalog': 'visible',
        'Short description': shortDesc,
        'Description': description,
        'Tax status': 'taxable',
        'Tax class': taxClass,
        'In stock?': inStock,
        'Stock': stockQty,
        'Manage stock?': manageStock,
        'Regular price': regularPrice,
        'Sale price': salePrice,
        'Categories': category,
        'Tags': brand ? brand : '',
        'Images': images,
        'Weight (kg)': weightKg,
        'Parent': '',
        'Meta: _yoast_wpseo_metadesc': metaDesc,
      };

      // Check if this single product has any attribute values (non-variant attributes)
      let attrNum = 0;
      for (const attrCol of attributeColumns) {
        const val = (parentRow[attrCol.originalHeader] || '').trim();
        if (val) {
          attrNum++;
          simpleWoo[`Attribute ${attrNum} name`] = attrCol.cleanName;
          simpleWoo[`Attribute ${attrNum} value(s)`] = val;
          simpleWoo[`Attribute ${attrNum} visible`] = 1;
          simpleWoo[`Attribute ${attrNum} global`] = 1;
        }
      }

      wooRows.push(simpleWoo);
    }
  }

  console.log(`\nConversion results:`);
  console.log(`  Simple products:   ${simpleCount}`);
  console.log(`  Variable products: ${variableCount}`);
  console.log(`  Variations:        ${variationCount}`);
  console.log(`  Skipped empty-attribute variants: ${skippedEmptyVariantsTotal}`);
  console.log(`  Total WooCommerce rows: ${wooRows.length}`);

  // 5. Collect all column names across all rows (since attribute columns vary)
  const allColumns = new Set();
  for (const row of wooRows) {
    for (const key of Object.keys(row)) {
      allColumns.add(key);
    }
  }

  // Sort columns: fixed columns first, then attributes sorted by number
  const fixedColumns = [
    'Type', 'SKU', 'Name', 'Published', 'Is featured?',
    'Visibility in catalog', 'Short description', 'Description',
    'Tax status', 'Tax class', 'In stock?', 'Stock', 'Manage stock?',
    'Regular price', 'Sale price', 'Categories', 'Tags', 'Images',
    'Weight (kg)', 'Parent', 'Meta: _yoast_wpseo_metadesc',
  ];

  const attrColumns = [...allColumns]
    .filter(c => c.startsWith('Attribute '))
    .sort((a, b) => {
      // Sort by attribute number, then by field type
      const numA = parseInt(a.match(/Attribute (\d+)/)[1]);
      const numB = parseInt(b.match(/Attribute (\d+)/)[1]);
      if (numA !== numB) return numA - numB;
      // Within same number: name < value(s) < visible < global
      const order = ['name', 'value(s)', 'visible', 'global'];
      const typeA = order.findIndex(t => a.includes(t));
      const typeB = order.findIndex(t => b.includes(t));
      return typeA - typeB;
    });

  const sortedColumns = [...fixedColumns, ...attrColumns];

  // Normalize rows: ensure every row has all columns
  const normalizedRows = wooRows.map(row => {
    const normalized = {};
    for (const col of sortedColumns) {
      normalized[col] = row[col] !== undefined ? row[col] : '';
    }
    return normalized;
  });

  // 6. Write output CSV
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`\nCreated output directory: ${OUTPUT_DIR}`);
  }

  const csvOutput = stringify(normalizedRows, {
    header: true,
    columns: sortedColumns,
    quoted: true,
    quoted_empty: false,
  });

  fs.writeFileSync(OUTPUT_FILE, csvOutput, 'utf-8');

  const fileSizeKb = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1);
  console.log(`\nOutput written to: ${OUTPUT_FILE}`);
  console.log(`File size: ${fileSizeKb} KB`);

  // 7. Print sample output
  console.log('\n--- Sample output (first 3 rows) ---');
  for (let i = 0; i < Math.min(3, normalizedRows.length); i++) {
    const row = normalizedRows[i];
    console.log(`\nRow ${i + 1} (${row.Type}):`);
    console.log(`  SKU: ${row.SKU}`);
    console.log(`  Name: ${row.Name}`);
    console.log(`  Price: ${row['Regular price']}`);
    console.log(`  Categories: ${row.Categories}`);
    console.log(`  Images: ${row.Images ? row.Images.substring(0, 80) + '...' : '(none)'}`);
    if (row.Parent) console.log(`  Parent: ${row.Parent}`);
    // Show attributes if present
    for (let a = 1; a <= 5; a++) {
      const attrName = row[`Attribute ${a} name`];
      const attrVal = row[`Attribute ${a} value(s)`];
      if (attrName) console.log(`  Attr ${a}: ${attrName} = ${attrVal}`);
    }
  }

  // 8. Summary of categories found
  const categories = new Set();
  for (const row of normalizedRows) {
    if (row.Categories) categories.add(row.Categories);
  }
  console.log(`\n--- Categories found (${categories.size}) ---`);
  for (const cat of [...categories].sort()) {
    console.log(`  ${cat}`);
  }

  console.log('\nDone!');
}

main();
