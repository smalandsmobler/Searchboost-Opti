/**
 * perispa — Widget/Element shortcut tools
 * add_heading, add_text, add_image, add_button, add_section, etc.
 * Lägger till HTML-element direkt i sidans content
 */

const { z } = require('zod');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

module.exports = function registerWidgetTools(server, getSite, wpFetch) {

  async function appendToPage(s, pageId, type, html) {
    const endpoint = type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
    const res = await wpFetch(s, `${endpoint}/${pageId}`, { params: { context: 'edit' } });
    let content = res.data.content?.raw || res.data.content?.rendered || '';
    content += '\n' + html;
    await wpFetch(s, `${endpoint}/${pageId}`, { method: 'POST', body: { content } });
    return { added: true, page_id: pageId };
  }

  // --- Heading ---
  server.tool('perispa_add_heading', 'Lägg till en rubrik på en sida', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    text: z.string().describe('Rubriktext'),
    level: z.number().optional().default(2).describe('Rubriknivå 1-6'),
    css_class: z.string().optional(),
    id: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const attrs = [];
      if (args.css_class) attrs.push(`class="${args.css_class}"`);
      if (args.id) attrs.push(`id="${args.id}"`);
      const html = `<h${args.level}${attrs.length ? ' ' + attrs.join(' ') : ''}>${args.text}</h${args.level}>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Text/Paragraph ---
  server.tool('perispa_add_text', 'Lägg till ett textstycke', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    content: z.string().describe('Text (HTML tillåtet)'),
    css_class: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const cls = args.css_class ? ` class="${args.css_class}"` : '';
      const html = `<p${cls}>${args.content}</p>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Image ---
  server.tool('perispa_add_image', 'Lägg till en bild', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    src: z.string().describe('Bild-URL'),
    alt: z.string().optional().default(''),
    width: z.number().optional(),
    height: z.number().optional(),
    css_class: z.string().optional(),
    link: z.string().optional().describe('Länk runt bilden'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const attrs = [`src="${args.src}"`, `alt="${args.alt}"`];
      if (args.width) attrs.push(`width="${args.width}"`);
      if (args.height) attrs.push(`height="${args.height}"`);
      if (args.css_class) attrs.push(`class="${args.css_class}"`);
      attrs.push('loading="lazy"');

      let html = `<img ${attrs.join(' ')} />`;
      if (args.link) html = `<a href="${args.link}">${html}</a>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Button ---
  server.tool('perispa_add_button', 'Lägg till en knapp/CTA', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    text: z.string().describe('Knapptext'),
    url: z.string().describe('Länk-URL'),
    css_class: z.string().optional().default('button'),
    target: z.string().optional().default('_self').describe('_self eller _blank'),
    style: z.string().optional().describe('Inline CSS'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const attrs = [`href="${args.url}"`, `class="${args.css_class}"`, `target="${args.target}"`];
      if (args.style) attrs.push(`style="${args.style}"`);
      const html = `<a ${attrs.join(' ')}>${args.text}</a>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Video ---
  server.tool('perispa_add_video', 'Lägg till en video (YouTube/Vimeo embed eller HTML5)', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    url: z.string().describe('Video-URL (YouTube, Vimeo, eller direkt MP4)'),
    width: z.number().optional().default(800),
    height: z.number().optional().default(450),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      let html;

      if (args.url.includes('youtube.com') || args.url.includes('youtu.be')) {
        const videoId = args.url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1];
        html = `<iframe width="${args.width}" height="${args.height}" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen loading="lazy"></iframe>`;
      } else if (args.url.includes('vimeo.com')) {
        const videoId = args.url.match(/vimeo\.com\/(\d+)/)?.[1];
        html = `<iframe width="${args.width}" height="${args.height}" src="https://player.vimeo.com/video/${videoId}" frameborder="0" allowfullscreen loading="lazy"></iframe>`;
      } else {
        html = `<video width="${args.width}" height="${args.height}" controls><source src="${args.url}" type="video/mp4"></video>`;
      }

      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- HTML ---
  server.tool('perispa_add_html', 'Lägg till rå HTML', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    html: z.string().describe('HTML-kod'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      return text(await appendToPage(s, args.page_id, args.type, args.html));
    } catch (e) { return err(e.message); }
  });

  // --- Section ---
  server.tool('perispa_add_section', 'Lägg till en sektion/div-wrapper', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    content: z.string().describe('Sektionens innehåll (HTML)'),
    css_class: z.string().optional().default('section'),
    id: z.string().optional(),
    style: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const attrs = [`class="${args.css_class}"`];
      if (args.id) attrs.push(`id="${args.id}"`);
      if (args.style) attrs.push(`style="${args.style}"`);
      const html = `<section ${attrs.join(' ')}>\n${args.content}\n</section>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Divider ---
  server.tool('perispa_add_divider', 'Lägg till en avdelare (hr)', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    style: z.string().optional(),
    css_class: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const attrs = [];
      if (args.css_class) attrs.push(`class="${args.css_class}"`);
      if (args.style) attrs.push(`style="${args.style}"`);
      const html = `<hr${attrs.length ? ' ' + attrs.join(' ') : ''} />`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Spacer ---
  server.tool('perispa_add_spacer', 'Lägg till vertikalt utrymme', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    height: z.string().optional().default('40px'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const html = `<div style="height:${args.height}" aria-hidden="true"></div>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Gallery ---
  server.tool('perispa_add_gallery', 'Lägg till ett bildgalleri', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    images: z.array(z.object({
      src: z.string(),
      alt: z.string().optional().default(''),
      caption: z.string().optional(),
    })).describe('Lista med bilder'),
    columns: z.number().optional().default(3),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const items = args.images.map(img => {
        let item = `<figure><img src="${img.src}" alt="${img.alt}" loading="lazy" />`;
        if (img.caption) item += `<figcaption>${img.caption}</figcaption>`;
        item += `</figure>`;
        return item;
      }).join('\n');
      const html = `<div class="gallery" style="display:grid;grid-template-columns:repeat(${args.columns},1fr);gap:16px">\n${items}\n</div>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Accordion ---
  server.tool('perispa_add_accordion', 'Lägg till en accordion/FAQ', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    items: z.array(z.object({
      title: z.string(),
      content: z.string(),
    })).describe('Accordion-items'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const items = args.items.map(item =>
        `<details>\n<summary>${item.title}</summary>\n<div>${item.content}</div>\n</details>`
      ).join('\n');
      const html = `<div class="accordion">\n${items}\n</div>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Tabs ---
  server.tool('perispa_add_tabs', 'Lägg till flikar/tabs', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    tabs: z.array(z.object({
      title: z.string(),
      content: z.string(),
    })),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const tabId = 'tabs-' + Date.now();
      const buttons = args.tabs.map((t, i) =>
        `<button class="tab-btn${i === 0 ? ' active' : ''}" data-tab="${tabId}-${i}">${t.title}</button>`
      ).join('\n');
      const panels = args.tabs.map((t, i) =>
        `<div id="${tabId}-${i}" class="tab-panel" style="${i > 0 ? 'display:none' : ''}">${t.content}</div>`
      ).join('\n');
      const html = `<div class="tabs">\n<div class="tab-buttons">\n${buttons}\n</div>\n${panels}\n</div>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Icon list ---
  server.tool('perispa_add_icon_list', 'Lägg till en ikonlista', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    items: z.array(z.object({
      icon: z.string().optional().default('✓'),
      text: z.string(),
    })),
    css_class: z.string().optional().default('icon-list'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const lis = args.items.map(item =>
        `<li><span class="icon">${item.icon}</span> ${item.text}</li>`
      ).join('\n');
      const html = `<ul class="${args.css_class}" style="list-style:none;padding:0">\n${lis}\n</ul>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Social icons ---
  server.tool('perispa_add_social_icons', 'Lägg till sociala medie-ikoner', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    links: z.array(z.object({
      platform: z.string().describe('facebook, instagram, linkedin, twitter, youtube, tiktok'),
      url: z.string(),
    })),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const icons = args.links.map(l =>
        `<a href="${l.url}" target="_blank" rel="noopener" class="social-icon social-${l.platform}">${l.platform}</a>`
      ).join('\n');
      const html = `<div class="social-icons" style="display:flex;gap:12px">\n${icons}\n</div>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Map ---
  server.tool('perispa_add_map', 'Lägg till en Google Maps-embed', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    address: z.string().describe('Adress att visa'),
    width: z.string().optional().default('100%'),
    height: z.string().optional().default('400px'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const q = encodeURIComponent(args.address);
      const html = `<iframe src="https://maps.google.com/maps?q=${q}&output=embed" width="${args.width}" height="${args.height}" style="border:0" loading="lazy" allowfullscreen></iframe>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Testimonial ---
  server.tool('perispa_add_testimonial', 'Lägg till ett kundomdöme/testimonial', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    quote: z.string(),
    author: z.string(),
    role: z.string().optional(),
    image_url: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      let html = `<blockquote class="testimonial">\n<p>"${args.quote}"</p>\n<footer>`;
      if (args.image_url) html += `<img src="${args.image_url}" alt="${args.author}" width="48" height="48" style="border-radius:50%" /> `;
      html += `<strong>${args.author}</strong>`;
      if (args.role) html += ` <span>${args.role}</span>`;
      html += `</footer>\n</blockquote>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Counter ---
  server.tool('perispa_add_counter', 'Lägg till en siffra/counter', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    number: z.string().describe('Siffran att visa (t.ex. "500+")'),
    label: z.string().describe('Etikett under siffran'),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const num = `${args.prefix || ''}${args.number}${args.suffix || ''}`;
      const html = `<div class="counter" style="text-align:center">\n<div style="font-size:3rem;font-weight:bold">${num}</div>\n<div>${args.label}</div>\n</div>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Pricing table ---
  server.tool('perispa_add_pricing_table', 'Lägg till en pristabell', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    plans: z.array(z.object({
      name: z.string(),
      price: z.string(),
      period: z.string().optional().default('/mån'),
      features: z.array(z.string()),
      cta_text: z.string().optional().default('Välj'),
      cta_url: z.string().optional().default('#'),
      highlighted: z.boolean().optional().default(false),
    })),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const cards = args.plans.map(plan => {
        const features = plan.features.map(f => `<li>${f}</li>`).join('\n');
        const highlight = plan.highlighted ? ' style="border:2px solid #e91e8c;transform:scale(1.05)"' : '';
        return `<div class="pricing-card"${highlight}>
<h3>${plan.name}</h3>
<div class="price"><span style="font-size:2rem;font-weight:bold">${plan.price}</span>${plan.period}</div>
<ul style="list-style:none;padding:0">\n${features}\n</ul>
<a href="${plan.cta_url}" class="button">${plan.cta_text}</a>
</div>`;
      }).join('\n');

      const html = `<div class="pricing-table" style="display:grid;grid-template-columns:repeat(${Math.min(args.plans.length, 3)},1fr);gap:24px">\n${cards}\n</div>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Form ---
  server.tool('perispa_add_form', 'Lägg till ett kontaktformulär', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    fields: z.array(z.object({
      name: z.string(),
      label: z.string(),
      type: z.string().optional().default('text'),
      required: z.boolean().optional().default(false),
      placeholder: z.string().optional(),
    })),
    action: z.string().optional().default('#'),
    submit_text: z.string().optional().default('Skicka'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const fields = args.fields.map(f => {
        const req = f.required ? ' required' : '';
        const ph = f.placeholder ? ` placeholder="${f.placeholder}"` : '';
        if (f.type === 'textarea') {
          return `<div class="form-field"><label for="${f.name}">${f.label}</label><textarea name="${f.name}" id="${f.name}"${ph}${req}></textarea></div>`;
        }
        return `<div class="form-field"><label for="${f.name}">${f.label}</label><input type="${f.type}" name="${f.name}" id="${f.name}"${ph}${req} /></div>`;
      }).join('\n');

      const html = `<form action="${args.action}" method="post" class="contact-form">\n${fields}\n<button type="submit" class="button">${args.submit_text}</button>\n</form>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Progress bar ---
  server.tool('perispa_add_progress_bar', 'Lägg till en progress bar', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    label: z.string(),
    value: z.number().describe('Procent 0-100'),
    color: z.string().optional().default('#e91e8c'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const html = `<div class="progress-bar">
<div style="display:flex;justify-content:space-between"><span>${args.label}</span><span>${args.value}%</span></div>
<div style="background:#eee;border-radius:4px;height:12px"><div style="width:${args.value}%;background:${args.color};height:100%;border-radius:4px"></div></div>
</div>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Toggle ---
  server.tool('perispa_add_toggle', 'Lagg till ett toggle/collapsible-element', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    title: z.string(),
    content: z.string(),
    open: z.boolean().optional().default(false),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const html = `<details${args.open ? ' open' : ''}>\n<summary>${args.title}</summary>\n<div>${args.content}</div>\n</details>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Icon ---
  server.tool('perispa_add_icon', 'Lagg till en ikon (FontAwesome, dashicons, eller emoji)', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    icon: z.string().describe('Ikon-klass (t.ex. "fa fa-star") eller emoji'),
    size: z.string().optional().default('24px'),
    color: z.string().optional(),
    link: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const style = `font-size:${args.size}${args.color ? ';color:' + args.color : ''}`;
      let html;
      if (args.icon.includes('fa ') || args.icon.includes('dashicons')) {
        html = `<i class="${args.icon}" style="${style}" aria-hidden="true"></i>`;
      } else {
        html = `<span style="${style}">${args.icon}</span>`;
      }
      if (args.link) html = `<a href="${args.link}">${html}</a>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Search ---
  server.tool('perispa_add_search', 'Lagg till ett sokfalt', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    placeholder: z.string().optional().default('Sok...'),
    button_text: z.string().optional().default('Sok'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const html = `<form role="search" method="get" action="${getSite(args.site).url}">
<div style="display:flex;gap:8px">
<input type="search" name="s" placeholder="${args.placeholder}" style="flex:1;padding:8px 12px;border:1px solid #ccc;border-radius:4px" />
<button type="submit" class="button">${args.button_text}</button>
</div>
</form>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Slider ---
  server.tool('perispa_add_slider', 'Lagg till en enkel bildslider (CSS-baserad)', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    images: z.array(z.object({
      src: z.string(),
      alt: z.string().optional().default(''),
      caption: z.string().optional(),
    })),
    height: z.string().optional().default('400px'),
    auto_play: z.boolean().optional().default(true),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const sliderId = 'slider-' + Date.now();
      const slides = args.images.map((img, i) => {
        let slide = `<div class="slide" style="min-width:100%;scroll-snap-align:start">`;
        slide += `<img src="${img.src}" alt="${img.alt}" style="width:100%;height:${args.height};object-fit:cover" loading="lazy" />`;
        if (img.caption) slide += `<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.6);color:#fff;padding:12px">${img.caption}</div>`;
        slide += `</div>`;
        return slide;
      }).join('\n');

      const html = `<div id="${sliderId}" class="slider" style="overflow-x:auto;scroll-snap-type:x mandatory;display:flex;position:relative">
${slides}
</div>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- Alert ---
  server.tool('perispa_add_alert', 'Lagg till en notis/alert-box', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    content: z.string(),
    alert_type: z.string().optional().default('info').describe('info, success, warning, error'),
    title: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const colors = { info: '#2196F3', success: '#4CAF50', warning: '#FF9800', error: '#F44336' };
      const color = colors[args.alert_type] || colors.info;
      let html = `<div class="alert alert-${args.alert_type}" style="border-left:4px solid ${color};padding:16px;margin:16px 0;background:${color}11">`;
      if (args.title) html += `<strong>${args.title}</strong><br>`;
      html += `${args.content}</div>`;
      return text(await appendToPage(s, args.page_id, args.type, html));
    } catch (e) { return err(e.message); }
  });

  // --- add_menu shortcut ---
  // Lägger till en nav_menu-widget i en sidebar/widget-area via WP REST API (WP 5.8+)
  server.tool('perispa_add_menu',
    'Snabbväg för att lägga till en navigeringmeny i en widget-area (sidebar, footer, header). ' +
    'Hittar widget-area via sidebar_id och lägger till en nav_menu-widget. ' +
    'Kräver WordPress 5.8+ med widget-block API.',
    {
      site: z.string().optional(),
      sidebar_id: z.string().describe('Widget-area ID (t.ex. "sidebar-1", "footer-1", "header-sidebar")'),
      menu_id: z.number().optional().describe('Meny-ID (term_id). Hämta med perispa_list_menus.'),
      menu_slug: z.string().optional().describe('Meny-slug (alternativ till menu_id)'),
      title: z.string().optional().describe('Widget-titel (visas ovan menyn). Lämna tom för ingen titel.'),
    },
    async (args) => {
      try {
        if (!args.menu_id && !args.menu_slug) {
          return err('Ange menu_id eller menu_slug');
        }
        const s = getSite(args.site);

        // Lösa upp menu_id från slug om nödvändigt
        let menuId = args.menu_id;
        if (!menuId && args.menu_slug) {
          const menusRes = await wpFetch(s, 'wp/v2/menus', { params: { slug: args.menu_slug } }).catch(() => null)
            || await wpFetch(s, 'wp/v2/navigation', { params: { slug: args.menu_slug } }).catch(() => null);
          if (menusRes?.data?.length) {
            menuId = menusRes.data[0].id;
          } else {
            return err(`Hittade ingen meny med slug "${args.menu_slug}"`);
          }
        }

        // Hämta befintliga widgets i sidebar
        const sidebarRes = await wpFetch(s, `wp/v2/sidebars/${args.sidebar_id}`);

        // Skapa nav_menu widget-block
        const widgetBlock = `<!-- wp:navigation {"ref":${menuId}} /-->`;

        // Lägg till widget via REST
        const widgetBody = {
          id: `nav_menu-${Date.now()}`,
          sidebar: args.sidebar_id,
          instance: {
            encoded: '',
            hash: '',
            raw: {
              title: args.title || '',
              nav_menu: menuId,
            },
          },
          rendered: '',
        };

        // Prova widget-block API (WP 5.8+)
        try {
          const res = await wpFetch(s, 'wp/v2/widgets', {
            method: 'POST',
            body: {
              sidebar: args.sidebar_id,
              id_base: 'nav_menu',
              instance: {
                raw: { title: args.title || '', nav_menu: menuId },
              },
            },
          });
          return text({
            added: true,
            widget_id: res.data.id,
            sidebar: args.sidebar_id,
            menu_id: menuId,
          });
        } catch (widgetErr) {
          // Fallback: rapportera vad som behöver göras manuellt
          return err(
            `Kunde inte lägga till widget via REST API: ${widgetErr.message}. ` +
            `Lägg till meny-widget manuellt i WP Admin → Utseende → Widgets → "${args.sidebar_id}".`
          );
        }
      } catch (e) { return err(e.message); }
    }
  );

};
