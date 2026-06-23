/**
 * perispa — WooCommerce tools
 * Produkter, variationer, ordrar, kunder, kuponger, rapporter, inställningar, SEO
 * ~57 verktyg
 */

const { z } = require('zod');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

module.exports = function registerWooTools(server, getSite, wpFetch) {

  // ============================================================
  // PRODUKTER
  // ============================================================

  server.tool('perispa_woo_list_products', 'Lista WooCommerce-produkter', {
    site: z.string().optional(),
    per_page: z.number().optional().default(20),
    page: z.number().optional().default(1),
    search: z.string().optional(),
    status: z.string().optional().default('publish'),
    category: z.number().optional(),
    tag: z.number().optional(),
    type: z.string().optional().describe('simple, variable, grouped, external'),
    orderby: z.string().optional().default('date'),
    order: z.string().optional().default('desc'),
    sku: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const params = { per_page: Math.min(args.per_page, 100), page: args.page, status: args.status, orderby: args.orderby, order: args.order };
      if (args.search) params.search = args.search;
      if (args.category) params.category = args.category;
      if (args.tag) params.tag = args.tag;
      if (args.type) params.type = args.type;
      if (args.sku) params.sku = args.sku;
      const res = await wpFetch(s, 'wc/v3/products', { params });
      return text({ total: res.total, products: res.data.map(p => ({ id: p.id, name: p.name, slug: p.slug, type: p.type, status: p.status, price: p.price, regular_price: p.regular_price, sale_price: p.sale_price, sku: p.sku, stock_status: p.stock_status, stock_quantity: p.stock_quantity, categories: p.categories?.map(c => c.name) || [], permalink: p.permalink })) });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_get_product', 'Hämta en WooCommerce-produkt med alla detaljer', {
    site: z.string().optional(),
    id: z.number(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wc/v3/products/${args.id}`);
      return text(res.data);
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_create_product', 'Skapa en ny WooCommerce-produkt', {
    site: z.string().optional(),
    name: z.string(),
    type: z.string().optional().default('simple'),
    description: z.string().optional().default(''),
    short_description: z.string().optional().default(''),
    regular_price: z.string().optional(),
    sale_price: z.string().optional(),
    sku: z.string().optional(),
    status: z.string().optional().default('draft'),
    manage_stock: z.boolean().optional(),
    stock_quantity: z.number().optional(),
    categories: z.array(z.object({ id: z.number() })).optional(),
    tags: z.array(z.object({ id: z.number() })).optional(),
    images: z.array(z.object({ src: z.string() })).optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = { name: args.name, type: args.type, description: args.description, short_description: args.short_description, status: args.status };
      const opt = ['regular_price','sale_price','sku','manage_stock','stock_quantity','categories','tags','images'];
      for (const f of opt) if (args[f] !== undefined) body[f] = args[f];
      const res = await wpFetch(s, 'wc/v3/products', { method: 'POST', body });
      return text({ created: true, id: res.data.id, name: res.data.name, permalink: res.data.permalink });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_update_product', 'Uppdatera en WooCommerce-produkt', {
    site: z.string().optional(),
    id: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    short_description: z.string().optional(),
    regular_price: z.string().optional(),
    sale_price: z.string().optional(),
    sku: z.string().optional(),
    stock_quantity: z.number().optional(),
    stock_status: z.string().optional().describe('instock, outofstock, onbackorder'),
    manage_stock: z.boolean().optional(),
    status: z.string().optional(),
    categories: z.array(z.object({ id: z.number() })).optional(),
    tags: z.array(z.object({ id: z.number() })).optional(),
    images: z.array(z.object({ src: z.string(), alt: z.string().optional() })).optional(),
    meta_data: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = {};
      const fields = ['name','description','short_description','regular_price','sale_price','sku','stock_quantity','stock_status','manage_stock','status','categories','tags','images','meta_data'];
      for (const f of fields) if (args[f] !== undefined) body[f] = args[f];
      const res = await wpFetch(s, `wc/v3/products/${args.id}`, { method: 'POST', body });
      return text({ updated: true, id: res.data.id, name: res.data.name, permalink: res.data.permalink });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_delete_product', 'Radera en WooCommerce-produkt', {
    site: z.string().optional(),
    id: z.number(),
    force: z.boolean().optional().default(false).describe('true = permanent radering, false = flytta till papperskorgen'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      await wpFetch(s, `wc/v3/products/${args.id}`, { method: 'DELETE', params: { force: args.force } });
      return text({ deleted: true, id: args.id });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_batch_update_products', 'Uppdatera flera produkter samtidigt (priser, status, lager)', {
    site: z.string().optional(),
    create: z.array(z.object({}).passthrough()).optional().default([]),
    update: z.array(z.object({ id: z.number() }).passthrough()).optional().default([]),
    delete: z.array(z.number()).optional().default([]),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = { create: args.create, update: args.update, delete: args.delete };
      const res = await wpFetch(s, 'wc/v3/products/batch', { method: 'POST', body });
      return text({ created: res.data.create?.length || 0, updated: res.data.update?.length || 0, deleted: res.data.delete?.length || 0 });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_duplicate_product', 'Duplicera en WooCommerce-produkt via WP REST', {
    site: z.string().optional(),
    id: z.number(),
    new_name: z.string().optional(),
    new_status: z.string().optional().default('draft'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const src = (await wpFetch(s, `wc/v3/products/${args.id}`)).data;
      const body = { ...src, name: args.new_name || `${src.name} (kopia)`, status: args.new_status, id: undefined };
      delete body.id; delete body.date_created; delete body.date_modified; delete body.permalink; delete body.link;
      const res = await wpFetch(s, 'wc/v3/products', { method: 'POST', body });
      return text({ duplicated: true, id: res.data.id, name: res.data.name });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_bulk_update_prices', 'Massjustera priser på produkter i en kategori eller alla', {
    site: z.string().optional(),
    category_id: z.number().optional().describe('Lämna tom för alla produkter'),
    adjustment_type: z.enum(['percent_increase','percent_decrease','fixed_increase','fixed_decrease','set_price']),
    value: z.number().describe('Procent eller kronor'),
    apply_to_sale_price: z.boolean().optional().default(false),
    dry_run: z.boolean().optional().default(true).describe('true = visa vad som skulle ändras, false = kör'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const params = { per_page: 100, status: 'publish' };
      if (args.category_id) params.category = args.category_id;
      const res = await wpFetch(s, 'wc/v3/products', { params });
      const updates = [];
      for (const p of res.data) {
        const oldPrice = parseFloat(p.regular_price || '0');
        if (!oldPrice) continue;
        let newPrice = oldPrice;
        if (args.adjustment_type === 'percent_increase') newPrice = oldPrice * (1 + args.value / 100);
        else if (args.adjustment_type === 'percent_decrease') newPrice = oldPrice * (1 - args.value / 100);
        else if (args.adjustment_type === 'fixed_increase') newPrice = oldPrice + args.value;
        else if (args.adjustment_type === 'fixed_decrease') newPrice = oldPrice - args.value;
        else if (args.adjustment_type === 'set_price') newPrice = args.value;
        newPrice = Math.max(0, Math.round(newPrice * 100) / 100);
        updates.push({ id: p.id, name: p.name, old: oldPrice, new: newPrice, regular_price: String(newPrice) });
      }
      if (args.dry_run) return text({ dry_run: true, would_update: updates.length, products: updates });
      const batchBody = { update: updates.map(u => ({ id: u.id, regular_price: u.regular_price })) };
      await wpFetch(s, 'wc/v3/products/batch', { method: 'POST', body: batchBody });
      return text({ updated: updates.length, products: updates });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_missing_content_report', 'Rapport: produkter som saknar beskrivning, bild eller SKU (SEO-kritiskt)', {
    site: z.string().optional(),
    per_page: z.number().optional().default(100),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, 'wc/v3/products', { params: { per_page: Math.min(args.per_page, 100), status: 'publish' } });
      const missing = { no_description: [], no_short_description: [], no_image: [], no_sku: [], no_price: [] };
      for (const p of res.data) {
        if (!p.description) missing.no_description.push({ id: p.id, name: p.name });
        if (!p.short_description) missing.no_short_description.push({ id: p.id, name: p.name });
        if (!p.images?.length) missing.no_image.push({ id: p.id, name: p.name });
        if (!p.sku) missing.no_sku.push({ id: p.id, name: p.name });
        if (!p.regular_price && p.type !== 'variable') missing.no_price.push({ id: p.id, name: p.name });
      }
      return text({ total_checked: res.data.length, missing });
    } catch (e) { return err(e.message); }
  });

  // ============================================================
  // VARIATIONER
  // ============================================================

  server.tool('perispa_woo_list_variations', 'Lista variationer för en variabel produkt', {
    site: z.string().optional(),
    product_id: z.number(),
    per_page: z.number().optional().default(100),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wc/v3/products/${args.product_id}/variations`, { params: { per_page: args.per_page } });
      return text(res.data.map(v => ({ id: v.id, sku: v.sku, price: v.price, regular_price: v.regular_price, sale_price: v.sale_price, stock_status: v.stock_status, stock_quantity: v.stock_quantity, attributes: v.attributes })));
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_update_variation', 'Uppdatera en produktvariation', {
    site: z.string().optional(),
    product_id: z.number(),
    variation_id: z.number(),
    regular_price: z.string().optional(),
    sale_price: z.string().optional(),
    sku: z.string().optional(),
    stock_quantity: z.number().optional(),
    stock_status: z.string().optional(),
    manage_stock: z.boolean().optional(),
    status: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = {};
      const fields = ['regular_price','sale_price','sku','stock_quantity','stock_status','manage_stock','status'];
      for (const f of fields) if (args[f] !== undefined) body[f] = args[f];
      const res = await wpFetch(s, `wc/v3/products/${args.product_id}/variations/${args.variation_id}`, { method: 'POST', body });
      return text({ updated: true, id: res.data.id, price: res.data.price });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_create_variation', 'Skapa en ny variation för en variabel produkt', {
    site: z.string().optional(),
    product_id: z.number(),
    regular_price: z.string().optional(),
    sku: z.string().optional(),
    stock_quantity: z.number().optional(),
    manage_stock: z.boolean().optional().default(false),
    attributes: z.array(z.object({ id: z.number().optional(), name: z.string(), option: z.string() })).optional(),
    status: z.string().optional().default('publish'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = { status: args.status };
      const fields = ['regular_price','sku','stock_quantity','manage_stock','attributes'];
      for (const f of fields) if (args[f] !== undefined) body[f] = args[f];
      const res = await wpFetch(s, `wc/v3/products/${args.product_id}/variations`, { method: 'POST', body });
      return text({ created: true, id: res.data.id });
    } catch (e) { return err(e.message); }
  });

  // ============================================================
  // ATTRIBUT
  // ============================================================

  server.tool('perispa_woo_list_attributes', 'Lista produktattribut (färg, storlek, etc.)', {
    site: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, 'wc/v3/products/attributes', { params: { per_page: 100 } });
      return text(res.data.map(a => ({ id: a.id, name: a.name, slug: a.slug, type: a.type, order_by: a.order_by, has_archives: a.has_archives })));
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_list_attribute_terms', 'Lista termer för ett attribut (t.ex. alla storlekar)', {
    site: z.string().optional(),
    attribute_id: z.number(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wc/v3/products/attributes/${args.attribute_id}/terms`, { params: { per_page: 100 } });
      return text(res.data.map(t => ({ id: t.id, name: t.name, slug: t.slug, count: t.count })));
    } catch (e) { return err(e.message); }
  });

  // ============================================================
  // KATEGORIER & TAGGAR
  // ============================================================

  server.tool('perispa_woo_list_categories', 'Lista WooCommerce-produktkategorier', {
    site: z.string().optional(),
    per_page: z.number().optional().default(100),
    hide_empty: z.boolean().optional().default(false),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, 'wc/v3/products/categories', { params: { per_page: args.per_page, hide_empty: args.hide_empty } });
      return text(res.data.map(c => ({ id: c.id, name: c.name, slug: c.slug, count: c.count, parent: c.parent, description: c.description?.slice(0, 150) || '' })));
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_create_category', 'Skapa en ny produktkategori', {
    site: z.string().optional(),
    name: z.string(),
    description: z.string().optional().default(''),
    slug: z.string().optional(),
    parent: z.number().optional().default(0),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = { name: args.name, description: args.description, parent: args.parent };
      if (args.slug) body.slug = args.slug;
      const res = await wpFetch(s, 'wc/v3/products/categories', { method: 'POST', body });
      return text({ created: true, id: res.data.id, name: res.data.name, slug: res.data.slug });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_update_category', 'Uppdatera en produktkategori', {
    site: z.string().optional(),
    id: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    image: z.object({ src: z.string(), alt: z.string().optional() }).optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = {};
      if (args.name) body.name = args.name;
      if (args.description !== undefined) body.description = args.description;
      if (args.image) body.image = args.image;
      const res = await wpFetch(s, `wc/v3/products/categories/${args.id}`, { method: 'POST', body });
      return text({ updated: true, id: res.data.id, name: res.data.name });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_list_tags', 'Lista produkttaggar', {
    site: z.string().optional(),
    per_page: z.number().optional().default(100),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, 'wc/v3/products/tags', { params: { per_page: args.per_page } });
      return text(res.data.map(t => ({ id: t.id, name: t.name, slug: t.slug, count: t.count })));
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_create_tag', 'Skapa en ny produkttagg', {
    site: z.string().optional(),
    name: z.string(),
    description: z.string().optional().default(''),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, 'wc/v3/products/tags', { method: 'POST', body: { name: args.name, description: args.description } });
      return text({ created: true, id: res.data.id, name: res.data.name });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_get_category', 'Hämta en WooCommerce-produktkategori med alla detaljer', {
    site: z.string().optional(),
    id: z.number().describe('Kategori-ID'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wc/v3/products/categories/${args.id}`);
      return text(res.data);
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_delete_category', 'Ta bort en WooCommerce-produktkategori', {
    site: z.string().optional(),
    id: z.number().describe('Kategori-ID'),
    force: z.boolean().optional().default(true).describe('WooCommerce kräver force=true för att radera kategorier'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wc/v3/products/categories/${args.id}`, { method: 'DELETE', params: { force: args.force } });
      return text({ deleted: true, id: args.id });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_get_tag', 'Hämta en WooCommerce-produkttagg med alla detaljer', {
    site: z.string().optional(),
    id: z.number().describe('Tagg-ID'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wc/v3/products/tags/${args.id}`);
      return text(res.data);
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_update_tag', 'Uppdatera en WooCommerce-produkttagg', {
    site: z.string().optional(),
    id: z.number().describe('Tagg-ID'),
    name: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = {};
      if (args.name !== undefined) body.name = args.name;
      if (args.slug !== undefined) body.slug = args.slug;
      if (args.description !== undefined) body.description = args.description;
      const res = await wpFetch(s, `wc/v3/products/tags/${args.id}`, { method: 'PUT', body });
      return text({ updated: true, id: res.data.id, name: res.data.name, slug: res.data.slug });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_delete_tag', 'Ta bort en WooCommerce-produkttagg', {
    site: z.string().optional(),
    id: z.number().describe('Tagg-ID'),
    force: z.boolean().optional().default(true).describe('WooCommerce kräver force=true för att radera taggar'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      await wpFetch(s, `wc/v3/products/tags/${args.id}`, { method: 'DELETE', params: { force: args.force } });
      return text({ deleted: true, id: args.id });
    } catch (e) { return err(e.message); }
  });

  // ============================================================
  // ORDRAR
  // ============================================================

  server.tool('perispa_woo_list_orders', 'Lista WooCommerce-ordrar', {
    site: z.string().optional(),
    per_page: z.number().optional().default(20),
    page: z.number().optional().default(1),
    status: z.string().optional().describe('pending, processing, completed, cancelled, refunded, failed, any'),
    customer: z.number().optional().describe('Kund-ID'),
    after: z.string().optional().describe('ISO-datum t.ex. 2026-01-01'),
    before: z.string().optional().describe('ISO-datum t.ex. 2026-12-31'),
    search: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const params = { per_page: Math.min(args.per_page, 100), page: args.page };
      if (args.status && args.status !== 'any') params.status = args.status;
      if (args.customer) params.customer = args.customer;
      if (args.after) params.after = args.after;
      if (args.before) params.before = args.before;
      if (args.search) params.search = args.search;
      const res = await wpFetch(s, 'wc/v3/orders', { params });
      return text({ total: res.total, orders: res.data.map(o => ({ id: o.id, number: o.number, status: o.status, total: o.total, currency: o.currency, date_created: o.date_created, billing_name: `${o.billing?.first_name||''} ${o.billing?.last_name||''}`.trim(), billing_email: o.billing?.email, items: o.line_items?.map(i => i.name) || [] })) });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_get_order', 'Hämta en order med alla detaljer', {
    site: z.string().optional(),
    id: z.number(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wc/v3/orders/${args.id}`);
      return text(res.data);
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_update_order', 'Uppdatera orderstatus eller anteckningar', {
    site: z.string().optional(),
    id: z.number(),
    status: z.string().optional().describe('pending, processing, completed, cancelled, refunded, failed'),
    customer_note: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = {};
      if (args.status) body.status = args.status;
      if (args.customer_note !== undefined) body.customer_note = args.customer_note;
      const res = await wpFetch(s, `wc/v3/orders/${args.id}`, { method: 'POST', body });
      return text({ updated: true, id: res.data.id, status: res.data.status });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_list_order_notes', 'Lista anteckningar på en order', {
    site: z.string().optional(),
    order_id: z.number(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wc/v3/orders/${args.order_id}/notes`);
      return text(res.data.map(n => ({ id: n.id, note: n.note, customer_note: n.customer_note, date_created: n.date_created })));
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_create_order_note', 'Lägg till en anteckning på en order', {
    site: z.string().optional(),
    order_id: z.number(),
    note: z.string(),
    customer_note: z.boolean().optional().default(false).describe('true = synlig för kunden'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wc/v3/orders/${args.order_id}/notes`, { method: 'POST', body: { note: args.note, customer_note: args.customer_note } });
      return text({ created: true, id: res.data.id });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_bulk_update_orders', 'Uppdatera status på flera ordrar samtidigt', {
    site: z.string().optional(),
    order_ids: z.array(z.number()),
    status: z.string().describe('completed, cancelled, processing etc.'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const update = args.order_ids.map(id => ({ id, status: args.status }));
      const res = await wpFetch(s, 'wc/v3/orders/batch', { method: 'POST', body: { update } });
      return text({ updated: res.data.update?.length || 0 });
    } catch (e) { return err(e.message); }
  });

  // ============================================================
  // KUNDER
  // ============================================================

  server.tool('perispa_woo_list_customers', 'Lista WooCommerce-kunder', {
    site: z.string().optional(),
    per_page: z.number().optional().default(20),
    page: z.number().optional().default(1),
    search: z.string().optional(),
    email: z.string().optional(),
    role: z.string().optional().default('customer'),
    orderby: z.string().optional().default('registered_date'),
    order: z.string().optional().default('desc'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const params = { per_page: Math.min(args.per_page, 100), page: args.page, role: args.role, orderby: args.orderby, order: args.order };
      if (args.search) params.search = args.search;
      if (args.email) params.email = args.email;
      const res = await wpFetch(s, 'wc/v3/customers', { params });
      return text({ total: res.total, customers: res.data.map(c => ({ id: c.id, email: c.email, first_name: c.first_name, last_name: c.last_name, orders_count: c.orders_count, total_spent: c.total_spent, date_created: c.date_created })) });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_get_customer', 'Hämta en kund med alla detaljer', {
    site: z.string().optional(),
    id: z.number(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wc/v3/customers/${args.id}`);
      return text(res.data);
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_get_customer_orders', 'Hämta alla ordrar för en specifik kund', {
    site: z.string().optional(),
    customer_id: z.number(),
    per_page: z.number().optional().default(20),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, 'wc/v3/orders', { params: { customer: args.customer_id, per_page: args.per_page } });
      return text({ total: res.total, orders: res.data.map(o => ({ id: o.id, number: o.number, status: o.status, total: o.total, date_created: o.date_created })) });
    } catch (e) { return err(e.message); }
  });

  // ============================================================
  // KUPONGER
  // ============================================================

  server.tool('perispa_woo_list_coupons', 'Lista WooCommerce-kuponger', {
    site: z.string().optional(),
    per_page: z.number().optional().default(20),
    search: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const params = { per_page: Math.min(args.per_page, 100) };
      if (args.search) params.search = args.search;
      const res = await wpFetch(s, 'wc/v3/coupons', { params });
      return text(res.data.map(c => ({ id: c.id, code: c.code, discount_type: c.discount_type, amount: c.amount, usage_count: c.usage_count, usage_limit: c.usage_limit, expiry_date: c.date_expires })));
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_create_coupon', 'Skapa en ny kupong', {
    site: z.string().optional(),
    code: z.string(),
    discount_type: z.enum(['percent','fixed_cart','fixed_product']).default('percent'),
    amount: z.string().describe('Belopp eller procent t.ex. "10" för 10%'),
    description: z.string().optional().default(''),
    expiry_date: z.string().optional().describe('ISO-datum t.ex. 2026-12-31'),
    usage_limit: z.number().optional(),
    individual_use: z.boolean().optional().default(false),
    free_shipping: z.boolean().optional().default(false),
    minimum_amount: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = { code: args.code, discount_type: args.discount_type, amount: args.amount, description: args.description, individual_use: args.individual_use, free_shipping: args.free_shipping };
      if (args.expiry_date) body.date_expires = args.expiry_date;
      if (args.usage_limit) body.usage_limit = args.usage_limit;
      if (args.minimum_amount) body.minimum_amount = args.minimum_amount;
      const res = await wpFetch(s, 'wc/v3/coupons', { method: 'POST', body });
      return text({ created: true, id: res.data.id, code: res.data.code });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_update_coupon', 'Uppdatera en kupong', {
    site: z.string().optional(),
    id: z.number(),
    code: z.string().optional(),
    amount: z.string().optional(),
    expiry_date: z.string().optional(),
    usage_limit: z.number().optional(),
    status: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = {};
      const fields = ['code','amount','usage_limit','status'];
      for (const f of fields) if (args[f] !== undefined) body[f] = args[f];
      if (args.expiry_date) body.date_expires = args.expiry_date;
      const res = await wpFetch(s, `wc/v3/coupons/${args.id}`, { method: 'POST', body });
      return text({ updated: true, id: res.data.id, code: res.data.code });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_delete_coupon', 'Radera en kupong', {
    site: z.string().optional(),
    id: z.number(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      await wpFetch(s, `wc/v3/coupons/${args.id}`, { method: 'DELETE', params: { force: true } });
      return text({ deleted: true, id: args.id });
    } catch (e) { return err(e.message); }
  });

  // ============================================================
  // RAPPORTER & STATISTIK
  // ============================================================

  server.tool('perispa_woo_revenue_report', 'Omsättningsrapport för en period', {
    site: z.string().optional(),
    period: z.enum(['week','month','last_month','year']).optional().default('month'),
    date_min: z.string().optional().describe('YYYY-MM-DD'),
    date_max: z.string().optional().describe('YYYY-MM-DD'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const params = { period: args.period };
      if (args.date_min) params.date_min = args.date_min;
      if (args.date_max) params.date_max = args.date_max;
      const res = await wpFetch(s, 'wc/v3/reports/sales', { params });
      return text(res.data);
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_top_sellers', 'Topplistade produkter baserat på sålda enheter', {
    site: z.string().optional(),
    period: z.enum(['week','month','last_month','year']).optional().default('month'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, 'wc/v3/reports/top_sellers', { params: { period: args.period } });
      return text(res.data);
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_orders_totals', 'Ordrar per status — totalt antal och summa', {
    site: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, 'wc/v3/reports/orders/totals');
      return text(res.data);
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_products_totals', 'Produkter per status — totalt antal', {
    site: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, 'wc/v3/reports/products/totals');
      return text(res.data);
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_customers_totals', 'Kunder per roll — totalt antal', {
    site: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, 'wc/v3/reports/customers/totals');
      return text(res.data);
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_reviews_totals', 'Recensioner per status', {
    site: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, 'wc/v3/reports/reviews/totals');
      return text(res.data);
    } catch (e) { return err(e.message); }
  });

  // ============================================================
  // LAGER
  // ============================================================

  server.tool('perispa_woo_stock_report', 'Lagerstatus — produkter slut eller lågt lager', {
    site: z.string().optional(),
    low_stock_threshold: z.number().optional().default(5),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const [outRes, allRes] = await Promise.all([
        wpFetch(s, 'wc/v3/products', { params: { per_page: 100, stock_status: 'outofstock' } }),
        wpFetch(s, 'wc/v3/products', { params: { per_page: 100, status: 'publish' } }),
      ]);
      const low = allRes.data.filter(p => p.manage_stock && p.stock_quantity !== null && p.stock_quantity <= args.low_stock_threshold && p.stock_quantity > 0);
      return text({ out_of_stock: outRes.data.map(p => ({ id: p.id, name: p.name, sku: p.sku })), low_stock: low.map(p => ({ id: p.id, name: p.name, sku: p.sku, stock_quantity: p.stock_quantity })) });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_bulk_update_stock', 'Massuppdatera lagerstatus på flera produkter', {
    site: z.string().optional(),
    updates: z.array(z.object({ id: z.number(), stock_quantity: z.number().optional(), stock_status: z.string().optional(), manage_stock: z.boolean().optional() })),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, 'wc/v3/products/batch', { method: 'POST', body: { update: args.updates } });
      return text({ updated: res.data.update?.length || 0 });
    } catch (e) { return err(e.message); }
  });

  // ============================================================
  // RECENSIONER
  // ============================================================

  server.tool('perispa_woo_list_reviews', 'Lista produktrecensioner', {
    site: z.string().optional(),
    per_page: z.number().optional().default(20),
    status: z.string().optional().describe('all, hold, approved, spam, trash'),
    product: z.number().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const params = { per_page: Math.min(args.per_page, 100) };
      if (args.status && args.status !== 'all') params.status = args.status;
      if (args.product) params.product = args.product;
      const res = await wpFetch(s, 'wc/v3/products/reviews', { params });
      return text(res.data.map(r => ({ id: r.id, product_id: r.product_id, reviewer: r.reviewer, status: r.status, rating: r.rating, review: r.review?.slice(0, 200), date_created: r.date_created })));
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_update_review', 'Godkänn eller markera recension som spam', {
    site: z.string().optional(),
    id: z.number(),
    status: z.string().describe('approved, hold, spam, trash'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wc/v3/products/reviews/${args.id}`, { method: 'POST', body: { status: args.status } });
      return text({ updated: true, id: res.data.id, status: res.data.status });
    } catch (e) { return err(e.message); }
  });

  // ============================================================
  // INSTÄLLNINGAR
  // ============================================================

  server.tool('perispa_woo_get_settings', 'Hämta WooCommerce-inställningar för en grupp', {
    site: z.string().optional(),
    group: z.string().optional().default('general').describe('general, products, tax, shipping, checkout, account, email'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wc/v3/settings/${args.group}`);
      return text(res.data.map(s => ({ id: s.id, label: s.label, value: s.value, type: s.type })));
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_list_shipping_zones', 'Lista leveranszoner och metoder', {
    site: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, 'wc/v3/shipping/zones');
      const zones = [];
      for (const z of res.data) {
        let methods = [];
        try {
          const m = await wpFetch(s, `wc/v3/shipping/zones/${z.id}/methods`);
          methods = m.data.map(m => ({ id: m.instance_id, title: m.title, method_id: m.method_id, enabled: m.enabled }));
        } catch (_) {}
        zones.push({ id: z.id, name: z.name, order: z.order, methods });
      }
      return text(zones);
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_list_payment_gateways', 'Lista betalningsmetoder och deras status', {
    site: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, 'wc/v3/payment_gateways');
      return text(res.data.map(g => ({ id: g.id, title: g.title, enabled: g.enabled, order: g.order, description: g.description?.slice(0, 100) })));
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_list_tax_rates', 'Lista momssatser', {
    site: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, 'wc/v3/taxes', { params: { per_page: 100 } });
      return text(res.data.map(t => ({ id: t.id, country: t.country, state: t.state, rate: t.rate, name: t.name, class: t.class, compound: t.compound })));
    } catch (e) { return err(e.message); }
  });

  // ============================================================
  // SAKNADE CRUD — get_variation, delete_variation,
  //                create_order, delete_order, get_coupon
  // ============================================================

  server.tool('perispa_woo_get_variation', 'Hämta en specifik produktvariation', {
    site: z.string().optional(),
    product_id: z.number().describe('Föräldraproduktens ID'),
    variation_id: z.number().describe('Variationens ID'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wc/v3/products/${args.product_id}/variations/${args.variation_id}`);
      const v = res.data;
      return text({
        id: v.id,
        sku: v.sku,
        status: v.status,
        price: v.price,
        regular_price: v.regular_price,
        sale_price: v.sale_price,
        stock_quantity: v.stock_quantity,
        stock_status: v.stock_status,
        manage_stock: v.manage_stock,
        attributes: v.attributes,
        image: v.image ? { id: v.image.id, url: v.image.src } : null,
        weight: v.weight,
        description: v.description,
      });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_delete_variation', 'Ta bort en produktvariation', {
    site: z.string().optional(),
    product_id: z.number().describe('Föräldraproduktens ID'),
    variation_id: z.number().describe('Variationens ID'),
    force: z.boolean().optional().default(true).describe('WooCommerce kräver force=true för att ta bort variationer'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      await wpFetch(s, `wc/v3/products/${args.product_id}/variations/${args.variation_id}`, {
        method: 'DELETE',
        params: { force: args.force ? 'true' : 'false' },
      });
      return text({ deleted: true, product_id: args.product_id, variation_id: args.variation_id });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_create_order', 'Skapa en ny WooCommerce-order', {
    site: z.string().optional(),
    status: z.string().optional().default('pending').describe('pending, processing, on-hold, completed, cancelled, refunded'),
    customer_id: z.number().optional().default(0).describe('0 = gästorder'),
    billing: z.object({
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      address_1: z.string().optional(),
      city: z.string().optional(),
      postcode: z.string().optional(),
      country: z.string().optional().default('SE'),
    }).optional(),
    shipping: z.object({
      first_name: z.string().optional(),
      last_name: z.string().optional(),
      address_1: z.string().optional(),
      city: z.string().optional(),
      postcode: z.string().optional(),
      country: z.string().optional().default('SE'),
    }).optional(),
    line_items: z.array(z.object({
      product_id: z.number(),
      quantity: z.number().default(1),
      variation_id: z.number().optional(),
    })).optional(),
    payment_method: z.string().optional().describe('t.ex. "bacs", "cod", "stripe"'),
    payment_method_title: z.string().optional(),
    customer_note: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = { status: args.status, customer_id: args.customer_id || 0 };
      if (args.billing) body.billing = args.billing;
      if (args.shipping) body.shipping = args.shipping;
      if (args.line_items?.length) body.line_items = args.line_items;
      if (args.payment_method) body.payment_method = args.payment_method;
      if (args.payment_method_title) body.payment_method_title = args.payment_method_title;
      if (args.customer_note) body.customer_note = args.customer_note;

      const res = await wpFetch(s, 'wc/v3/orders', { method: 'POST', body });
      return text({
        created: true,
        id: res.data.id,
        status: res.data.status,
        total: res.data.total,
        order_key: res.data.order_key,
        customer_email: res.data.billing?.email,
      });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_delete_order', 'Ta bort en WooCommerce-order', {
    site: z.string().optional(),
    id: z.number().describe('Orderns ID'),
    force: z.boolean().optional().default(false).describe('false = flytta till papperskorg, true = permanent borttagning'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wc/v3/orders/${args.id}`, {
        method: 'DELETE',
        params: { force: args.force ? 'true' : 'false' },
      });
      return text({ deleted: true, id: args.id, status: res.data?.status || 'removed' });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_woo_get_coupon', 'Hämta en specifik WooCommerce-kupong', {
    site: z.string().optional(),
    id: z.number().describe('Kupong-ID'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wc/v3/coupons/${args.id}`);
      const c = res.data;
      return text({
        id: c.id,
        code: c.code,
        amount: c.amount,
        discount_type: c.discount_type,
        description: c.description,
        date_expires: c.date_expires,
        usage_count: c.usage_count,
        usage_limit: c.usage_limit,
        usage_limit_per_user: c.usage_limit_per_user,
        minimum_amount: c.minimum_amount,
        maximum_amount: c.maximum_amount,
        free_shipping: c.free_shipping,
        product_ids: c.product_ids,
        excluded_product_ids: c.excluded_product_ids,
        product_categories: c.product_categories,
      });
    } catch (e) { return err(e.message); }
  });

};
