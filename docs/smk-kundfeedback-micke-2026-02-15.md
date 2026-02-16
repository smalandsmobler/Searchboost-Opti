# SMK — Kundfeedback Micke Nilsson 2026-02-15

## 5 punkter + lösningar

---

### 1. Exkl/inkl moms-reglage
**Problem**: Kunden vill kunna växla mellan exkl och inkl moms-priser
**Lösning**: WooCommerce-toggle i header/footer

```php
// mu-plugin: smk-moms-toggle.php
add_action('wp_footer', function() { ?>
<div id="smk-moms-toggle" style="position:fixed;bottom:20px;right:20px;z-index:9999;background:#566754;padding:10px 16px;border-radius:8px;color:#fff;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
  <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
    <span>Priser:</span>
    <select id="smk-moms-val" style="background:#fff;color:#333;border:none;border-radius:4px;padding:4px 8px;font-size:13px">
      <option value="excl">Exkl moms</option>
      <option value="incl">Inkl moms</option>
    </select>
  </label>
</div>
<script>
(function(){
  var sel = document.getElementById('smk-moms-val');
  var saved = localStorage.getItem('smk_moms') || 'excl';
  sel.value = saved;

  function updatePrices(mode) {
    localStorage.setItem('smk_moms', mode);
    // WooCommerce tax toggle via cookie
    document.cookie = 'smk_tax_display=' + mode + ';path=/;max-age=31536000';
    location.reload();
  }

  sel.addEventListener('change', function() { updatePrices(this.value); });
})();
</script>
<?php });

// Hook into WooCommerce tax display
add_filter('woocommerce_get_tax_display', function($display) {
  if (isset($_COOKIE['smk_tax_display'])) {
    return $_COOKIE['smk_tax_display'] === 'incl' ? 'incl' : 'excl';
  }
  return $display;
});
```

**WooCommerce-approach**: Alternativt kan man använda WC:s inbyggda `woocommerce_tax_display_shop`-filter. Men enklast är att byta tax display mode dynamiskt med en cookie.

**Status**: Behöver uppladdas som mu-plugin

---

### 2. Sökrutan fungerar inte
**Problem**: Sökrutan i sidhuvudet ger inga resultat / fungerar inte
**Möjliga orsaker**:
- GeneratePress sök-widget inte konfigurerad
- WooCommerce produktsök kräver `?post_type=product`
- Sökindexet är tomt

**Lösning**: Kolla om sökningen använder `/?s=sökord` eller `/?s=sökord&post_type=product`

```php
// mu-plugin: smk-search-fix.php
// Inkludera produkter i standardsökning
add_filter('pre_get_posts', function($query) {
  if ($query->is_search() && !is_admin() && $query->is_main_query()) {
    $query->set('post_type', array('product', 'post', 'page'));
  }
  return $query;
});
```

**Status**: Behöver testas + uppladdas

---

### 3. Alla produkter på en sida (ingen paginering)
**Problem**: Kunden vill se alla produkter per kategori utan att klicka "sida 2"
**Lösning**: Öka WooCommerce produkter per sida

```php
// mu-plugin (eller WooCommerce → Inställningar → Produkter)
add_filter('loop_shop_per_page', function() { return 999; });
```

Alternativt: WooCommerce → Inställningar → Produkter → "Produkter per rad" / "Rader per sida"
Sätt rader per sida till 100+ så visas alla.

**OBS**: Om det finns 896 produkter i en kategori kan det bli tungt. Men de flesta kategorier har <50 produkter.

**Status**: Enkel fix — antingen via WP-admin eller mu-plugin

---

### 4. Leveranstider saknas
**Problem**: Inga leveranstider visas på produktsidorna
**Lösning**: Använd WooCommerce-fältet "Leveranstid" eller custom meta

**Approach A** — Global leveranstid (enklast):
```php
// mu-plugin: smk-delivery-time.php
add_action('woocommerce_single_product_summary', function() {
  echo '<div class="smk-delivery" style="margin:10px 0;padding:8px 12px;background:#f0f9f0;border-left:3px solid #566754;font-size:14px">';
  echo '<strong>Leveranstid:</strong> 3-5 arbetsdagar';
  echo '</div>';
}, 25);
```

**Approach B** — Per produkt (custom field):
Kräver att leveranstid läggs in per produkt i WP-admin.

**Status**: Behöver beslut om approach (global eller per produkt) + uppladdning

---

### 5. Erbjudande-banners — Rätta produktlänkar
**Problem**: De 4 erbjudandekorten på startsidan pekar på fel sidor
**Nuvarande (i smk-homepage.php)**:

| Banner | Nuvarande länk | Ska vara |
|--------|---------------|----------|
| KONTORSSTOLAR (Caen) | `/produkt-kategori/sittmobler/` | `/product/caen-kontorsstol-svart-eller-vit/` |
| FÄLLBORD (Dinner Style) | `/produkt-kategori/skrivbord-for-kontoret/` | `/product/dinner-style-fallbord-perfekt-fallbord-for-konferens-och-event/` |
| SKJUTDÖRRSKÅP | `/produkt-kategori/forvaring/` | `/produkt-kategori/forvaring/` (OK — eller specifik produkt) |
| HÖJ & SÄNKBARA | `/produkt-kategori/skrivbord-for-kontoret/` | `/produkt-kategori/bord/` (ny kategori) |

**Ändring i smk-homepage.php** (`var promos` array):
```javascript
var promos = [
    {
        title: 'KONTORSSTOLAR',
        price: '985:-',
        sub: 'exkl moms',
        name: 'Caen kontorsstol',
        img: bannerBase + 'kontorsstolar.jpg',
        link: '/product/caen-kontorsstol-svart-eller-vit/'  // ÄNDRAD
    },
    {
        title: 'FÄLLBORD',
        price: 'från 1 295:-',
        sub: 'exkl moms',
        name: 'Dinner Style',  // Micke vill ha kvar detta — det är produktnamnet
        img: bannerBase + 'fallbord.jpg',
        link: '/product/dinner-style-fallbord-perfekt-fallbord-for-konferens-och-event/'  // ÄNDRAD
    },
    {
        title: 'SKJUTDÖRRSKÅP FÖR KONTORET',
        price: 'från 2 295:-',
        sub: 'exkl moms',
        name: '',  // Ta bort "Dinner Style" — det är inte rätt produktnamn här
        img: bannerBase + 'skjutdorrskap.jpg',
        link: '/produkt-kategori/forvaring/'  // OK
    },
    {
        title: 'HÖJ & SÄNKBARA SKRIVBORD',
        price: 'från 1 995:-',
        sub: 'exkl moms',
        name: '',
        img: bannerBase + 'skrivbord.jpg',
        link: '/produkt-kategori/bord/'  // ÄNDRAD (ny kategori)
    }
];
```

**Status**: Kräver redigering av mu-plugin-fil på servern (Chrome/FTP/Loopia Kundzon)

---

## Sammanfattning — Åtgärdslista

| # | Problem | Svårighetsgrad | Tid | Kräver |
|---|---------|---------------|-----|--------|
| 1 | Moms-reglage | Medel | 30 min | mu-plugin upload |
| 2 | Sökrutan | Enkel | 15 min | mu-plugin upload |
| 3 | Paginering | Enkel | 5 min | WP-admin eller mu-plugin |
| 4 | Leveranstider | Enkel–Medel | 15–30 min | mu-plugin upload |
| 5 | Bannerlänkar | Enkel | 10 min | smk-homepage.php redigering |

**Total tid**: ~1-1.5 timmar
**Alla kräver filåtkomst till servern** (Chrome inloggad i WP-admin, Loopia Kundzon, eller FTP)
