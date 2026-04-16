#!/usr/bin/env python3
"""
SMK Page Rebuild — 5 kategori/landningssidor med SMK brand design.
Färger: olivgrön (#3d4f3b), brons (#B48C5A), varm bakgrund (#f5f2eb).
"""

import subprocess
import requests
import json
import sys

def get_ssm(name):
    result = subprocess.run(
        ["aws", "ssm", "get-parameter", "--name", name,
         "--with-decryption", "--region", "eu-north-1",
         "--profile", "mickedanne@gmail.com",
         "--query", "Parameter.Value", "--output", "text"],
        capture_output=True, text=True
    )
    return result.stdout.strip()

WP_USER = get_ssm("/seo-mcp/wordpress/smalandskontorsmobler/username")
WP_PASS = get_ssm("/seo-mcp/wordpress/smalandskontorsmobler/app-password")
BASE_URL = "https://smalandskontorsmobler.se/wp-json/wp/v2/pages"
AUTH = (WP_USER, WP_PASS)

# ─────────────────────────────────────────────────────────────────────────────
# SHARED STYLES
# ─────────────────────────────────────────────────────────────────────────────

SHARED_STYLES = """
<style>
/* ── SMK Brand Reset ── */
:root {
  --smk-bronze:    #B48C5A;
  --smk-bronze-dk: #9a7545;
  --smk-olive-dk:  #3d4f3b;
  --smk-olive-md:  #566754;
  --smk-olive-ft:  #2c3b2a;
  --smk-bg-warm:   #f5f2eb;
  --smk-bg-mid:    #e8e0d5;
  --smk-bg-card:   #f5efe8;
  --smk-text:      #1a1a1a;
  --smk-white:     #ffffff;
  --smk-radius:    10px;
  --smk-shadow:    0 4px 16px rgba(61,79,59,.12);
}
.smk-wrap { max-width:1160px; margin:0 auto; padding:0 24px; }
.smk-eyebrow {
  display:inline-block;
  color:var(--smk-bronze);
  font-size:.75rem;
  font-weight:700;
  letter-spacing:.12em;
  text-transform:uppercase;
  margin-bottom:12px;
}
.smk-btn-bronze {
  display:inline-block;
  background:var(--smk-bronze);
  color:var(--smk-white) !important;
  padding:14px 32px;
  border-radius:50px;
  font-weight:700;
  font-size:.95rem;
  text-decoration:none;
  transition:background .2s;
}
.smk-btn-bronze:hover { background:var(--smk-bronze-dk); }
.smk-btn-outline {
  display:inline-block;
  border:2px solid var(--smk-white);
  color:var(--smk-white) !important;
  padding:13px 30px;
  border-radius:50px;
  font-weight:700;
  font-size:.95rem;
  text-decoration:none;
  transition:background .2s,color .2s;
}
.smk-btn-outline:hover { background:var(--smk-white); color:var(--smk-olive-dk) !important; }
.smk-btn-bronze-outline {
  display:inline-block;
  border:2px solid var(--smk-bronze);
  color:var(--smk-bronze) !important;
  padding:13px 30px;
  border-radius:50px;
  font-weight:700;
  font-size:.95rem;
  text-decoration:none;
  transition:background .2s,color .2s;
}
.smk-btn-bronze-outline:hover { background:var(--smk-bronze); color:var(--smk-white) !important; }

/* ── Hero ── */
.smk-hero {
  background:var(--smk-olive-dk);
  padding:80px 0 70px;
  position:relative;
  overflow:hidden;
}
.smk-hero::before {
  content:'';
  position:absolute;
  inset:0;
  background:url('https://smalandskontorsmobler.se/wp-content/uploads/2026/03/smk-workspace.jpg') center/cover no-repeat;
  opacity:.13;
}
.smk-hero-inner { position:relative; z-index:1; }
.smk-hero h1 {
  color:var(--smk-white);
  font-size:clamp(1.9rem,4vw,3rem);
  font-weight:700;
  letter-spacing:-.02em;
  line-height:1.2;
  margin:0 0 18px;
}
.smk-hero p {
  color:rgba(255,255,255,.82);
  font-size:1.1rem;
  max-width:560px;
  margin:0 0 32px;
  line-height:1.6;
}
.smk-hero-btns { display:flex; gap:14px; flex-wrap:wrap; }

/* ── USP Bar ── */
.smk-usp-bar {
  background:var(--smk-bg-warm);
  padding:32px 0;
  border-bottom:1px solid var(--smk-bg-mid);
}
.smk-usp-bar-grid {
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:16px;
}
@media(max-width:768px){ .smk-usp-bar-grid{ grid-template-columns:repeat(2,1fr); } }
.smk-usp-item { display:flex; align-items:center; gap:14px; }
.smk-usp-icon {
  width:46px; height:46px;
  background:var(--smk-bronze);
  color:var(--smk-white);
  border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-size:1.2rem;
  flex-shrink:0;
}
.smk-usp-text { font-size:.88rem; color:var(--smk-text); line-height:1.4; }
.smk-usp-text strong { display:block; font-size:.95rem; color:var(--smk-olive-dk); }

/* ── 2-col Guide Section ── */
.smk-guide {
  padding:70px 0;
  background:var(--smk-white);
}
.smk-guide-grid {
  display:grid;
  grid-template-columns:1fr 380px;
  gap:48px;
  align-items:start;
}
@media(max-width:900px){ .smk-guide-grid{ grid-template-columns:1fr; } }
.smk-guide h2 {
  font-size:1.8rem;
  font-weight:700;
  letter-spacing:-.02em;
  color:var(--smk-olive-dk);
  margin:0 0 12px;
}
.smk-guide p { color:#444; line-height:1.7; margin:0 0 24px; }

/* ── Accordion ── */
.smk-accordion { border-top:1px solid var(--smk-bg-mid); }
.smk-acc-item { border-bottom:1px solid var(--smk-bg-mid); }
.smk-acc-trigger {
  width:100%;
  background:none;
  border:none;
  padding:16px 4px;
  text-align:left;
  font-size:.97rem;
  font-weight:600;
  color:var(--smk-olive-dk);
  cursor:pointer;
  display:flex;
  justify-content:space-between;
  align-items:center;
}
.smk-acc-trigger:hover { color:var(--smk-bronze); }
.smk-acc-body {
  max-height:0;
  overflow:hidden;
  transition:max-height .3s ease;
}
.smk-acc-body.open { max-height:300px; }
.smk-acc-body p {
  padding:4px 4px 16px;
  color:#555;
  font-size:.9rem;
  line-height:1.65;
  margin:0;
}

/* ── Info Card (right col) ── */
.smk-info-card {
  background:var(--smk-olive-dk);
  color:var(--smk-white);
  border-radius:var(--smk-radius);
  padding:28px;
}
.smk-info-card h3 {
  font-size:1.05rem;
  font-weight:700;
  color:var(--smk-bronze);
  margin:0 0 18px;
  letter-spacing:.02em;
}
.smk-info-table { width:100%; border-collapse:collapse; }
.smk-info-table tr { border-bottom:1px solid rgba(255,255,255,.12); }
.smk-info-table td {
  padding:10px 6px;
  font-size:.88rem;
  color:rgba(255,255,255,.88);
  vertical-align:top;
}
.smk-info-table td:first-child {
  font-weight:600;
  color:var(--smk-bronze);
  white-space:nowrap;
  padding-right:16px;
  width:40%;
}

/* ── Product Grid Header ── */
.smk-prod-header {
  background:var(--smk-bg-warm);
  padding:48px 0 20px;
  text-align:center;
}
.smk-prod-header h2 {
  font-size:1.9rem;
  font-weight:700;
  letter-spacing:-.02em;
  color:var(--smk-olive-dk);
  margin:8px 0 10px;
}
.smk-prod-header p { color:#555; max-width:560px; margin:0 auto; }
.smk-prod-grid-wrap {
  background:var(--smk-bg-warm);
  padding:20px 0 60px;
}

/* ── B2B CTA ── */
.smk-b2b {
  background:var(--smk-olive-dk);
  padding:64px 0;
}
.smk-b2b-inner { text-align:center; }
.smk-b2b h2 {
  color:var(--smk-white);
  font-size:1.85rem;
  font-weight:700;
  letter-spacing:-.02em;
  margin:8px 0 14px;
}
.smk-b2b p {
  color:rgba(255,255,255,.8);
  max-width:540px;
  margin:0 auto 30px;
  line-height:1.6;
}

/* ── Size/Category Cards ── */
.smk-cards-section {
  background:var(--smk-bg-warm);
  padding:64px 0;
}
.smk-cards-section h2 {
  font-size:1.8rem;
  font-weight:700;
  letter-spacing:-.02em;
  color:var(--smk-olive-dk);
  margin:8px 0 10px;
}
.smk-cards-section > .smk-wrap > p { color:#555; margin:0 0 36px; }
.smk-card-grid {
  display:grid;
  gap:24px;
}
.smk-card-grid-3 { grid-template-columns:repeat(3,1fr); }
.smk-card-grid-4 { grid-template-columns:repeat(4,1fr); }
@media(max-width:900px){
  .smk-card-grid-3,.smk-card-grid-4{ grid-template-columns:repeat(2,1fr); }
}
@media(max-width:580px){
  .smk-card-grid-3,.smk-card-grid-4{ grid-template-columns:1fr; }
}
.smk-card {
  background:var(--smk-bg-card);
  border-radius:var(--smk-radius);
  padding:28px 24px;
  box-shadow:var(--smk-shadow);
  transition:border-color .2s, transform .2s;
  border:2px solid transparent;
}
.smk-card:hover { border-color:var(--smk-bronze); transform:translateY(-3px); }
.smk-card-icon {
  width:52px; height:52px;
  background:var(--smk-olive-dk);
  color:var(--smk-bronze);
  border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-size:1.4rem;
  margin-bottom:16px;
}
.smk-card h3 {
  font-size:1.05rem;
  font-weight:700;
  color:var(--smk-olive-dk);
  margin:0 0 8px;
}
.smk-card p { font-size:.88rem; color:#555; line-height:1.55; margin:0; }
.smk-card .smk-price {
  display:block;
  color:var(--smk-bronze);
  font-weight:700;
  font-size:.85rem;
  margin-top:10px;
}

/* ── B2B Benefits ── */
.smk-benefits-grid {
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:24px;
}
@media(max-width:900px){ .smk-benefits-grid{ grid-template-columns:repeat(2,1fr); } }
@media(max-width:580px){ .smk-benefits-grid{ grid-template-columns:1fr; } }
.smk-benefit {
  background:var(--smk-bg-card);
  border-radius:var(--smk-radius);
  padding:28px 22px;
  box-shadow:var(--smk-shadow);
}
.smk-benefit-icon {
  width:52px; height:52px;
  background:var(--smk-bronze);
  color:var(--smk-white);
  border-radius:var(--smk-radius);
  display:flex; align-items:center; justify-content:center;
  font-size:1.3rem;
  margin-bottom:14px;
}
.smk-benefit h3 {
  font-size:1rem;
  font-weight:700;
  color:var(--smk-olive-dk);
  margin:0 0 8px;
}
.smk-benefit p { font-size:.88rem; color:#555; line-height:1.55; margin:0; }

/* ── Process Steps ── */
.smk-steps {
  background:var(--smk-olive-dk);
  padding:70px 0;
}
.smk-steps h2 {
  text-align:center;
  color:var(--smk-white);
  font-size:1.8rem;
  font-weight:700;
  letter-spacing:-.02em;
  margin:8px 0 40px;
}
.smk-steps-grid {
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:24px;
}
@media(max-width:900px){ .smk-steps-grid{ grid-template-columns:repeat(2,1fr); } }
.smk-step { text-align:center; }
.smk-step-num {
  width:56px; height:56px;
  background:var(--smk-bronze);
  color:var(--smk-white);
  border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  font-size:1.4rem;
  font-weight:700;
  margin:0 auto 16px;
}
.smk-step h3 { color:var(--smk-white); font-size:1rem; font-weight:700; margin:0 0 8px; }
.smk-step p { color:rgba(255,255,255,.75); font-size:.88rem; line-height:1.55; margin:0; }

/* ── Contact CTA ── */
.smk-contact-cta {
  background:var(--smk-bg-warm);
  padding:64px 0;
}
.smk-contact-cta-inner {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:48px;
  align-items:center;
}
@media(max-width:768px){ .smk-contact-cta-inner{ grid-template-columns:1fr; } }
.smk-contact-cta h2 {
  font-size:1.8rem;
  font-weight:700;
  letter-spacing:-.02em;
  color:var(--smk-olive-dk);
  margin:8px 0 14px;
}
.smk-contact-cta p { color:#444; line-height:1.65; margin:0 0 24px; }
.smk-contact-info { display:flex; flex-direction:column; gap:14px; }
.smk-contact-row { display:flex; align-items:center; gap:14px; }
.smk-contact-row-icon {
  width:40px; height:40px;
  background:var(--smk-olive-dk);
  color:var(--smk-bronze);
  border-radius:8px;
  display:flex; align-items:center; justify-content:center;
  font-size:1rem;
  flex-shrink:0;
}
.smk-contact-row span { font-size:.92rem; color:var(--smk-text); }
.smk-contact-row strong { display:block; font-size:.8rem; color:#666; }

/* ── Accordion JS ── */
</style>
<script>
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.smk-acc-trigger').forEach(function(btn){
    btn.addEventListener('click',function(){
      var body = this.nextElementSibling;
      var arrow = this.querySelector('.smk-acc-arrow');
      if(body.classList.contains('open')){
        body.classList.remove('open');
        if(arrow) arrow.textContent = '+';
      } else {
        // close siblings
        var parent = this.closest('.smk-accordion');
        parent.querySelectorAll('.smk-acc-body.open').forEach(function(b){
          b.classList.remove('open');
        });
        parent.querySelectorAll('.smk-acc-arrow').forEach(function(a){
          a.textContent = '+';
        });
        body.classList.add('open');
        if(arrow) arrow.textContent = '−';
      }
    });
  });
  // open first item
  document.querySelectorAll('.smk-accordion').forEach(function(acc){
    var first = acc.querySelector('.smk-acc-body');
    var arrow = acc.querySelector('.smk-acc-arrow');
    if(first){ first.classList.add('open'); }
    if(arrow){ arrow.textContent = '−'; }
  });
});
</script>
"""

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 1 — Kontorsstolar (ID 17851)
# ─────────────────────────────────────────────────────────────────────────────

PAGE_KONTORSSTOLAR = SHARED_STYLES + """
<!-- HERO -->
<section class="smk-hero">
  <div class="smk-wrap smk-hero-inner">
    <span class="smk-eyebrow">Kontorsstolar</span>
    <h1>Kontorsstolar som håller<br>hela arbetsdagen</h1>
    <p>Ergonomiska kontorsstolar för kontor av alla storlekar. Vi hjälper dig hitta rätt stol – oavsett om det gäller en enskild chef eller hela kontoret.</p>
    <div class="smk-hero-btns">
      <a href="#vara-kontorsstolar" class="smk-btn-bronze">Se alla stolar</a>
      <a href="/kontakt/" class="smk-btn-outline">Fri konsultation</a>
    </div>
  </div>
</section>

<!-- USP BAR -->
<section class="smk-usp-bar">
  <div class="smk-wrap">
    <div class="smk-usp-bar-grid">
      <div class="smk-usp-item">
        <div class="smk-usp-icon">&#10003;</div>
        <div class="smk-usp-text"><strong>Fri frakt</strong>vid order över 2 000 kr</div>
      </div>
      <div class="smk-usp-item">
        <div class="smk-usp-icon">&#9679;</div>
        <div class="smk-usp-text"><strong>Volymrabatt</strong>för företag, 5+ stolar</div>
      </div>
      <div class="smk-usp-item">
        <div class="smk-usp-icon">&#9733;</div>
        <div class="smk-usp-text"><strong>5 års garanti</strong>på stomme &amp; mekanik</div>
      </div>
      <div class="smk-usp-item">
        <div class="smk-usp-icon">&#128241;</div>
        <div class="smk-usp-text"><strong>Snabb leverans</strong>2–5 arbetsdagar</div>
      </div>
    </div>
  </div>
</section>

<!-- GUIDE -->
<section class="smk-guide">
  <div class="smk-wrap">
    <div class="smk-guide-grid">
      <!-- LEFT: text + accordion -->
      <div>
        <span class="smk-eyebrow">Köpguide</span>
        <h2>Välj rätt kontorsstol</h2>
        <p>En bra kontorsstol är en investering i hälsa och produktivitet. Här är fyra faktorer som avgör vilket val som passar dig eller ditt företag bäst.</p>
        <div class="smk-accordion">
          <div class="smk-acc-item">
            <button class="smk-acc-trigger">Ergonomi &amp; ryggstöd<span class="smk-acc-arrow">+</span></button>
            <div class="smk-acc-body"><p>Välj en stol med justerbart ländryggsstöd och möjlighet att ställa in säteshöjd, armstöd och nackstöd. Bra ergonomi minskar belastningsskador och ökar koncentrationen under långa arbetsdagar.</p></div>
          </div>
          <div class="smk-acc-item">
            <button class="smk-acc-trigger">Sätesmaterial &amp; andningsförmåga<span class="smk-acc-arrow">+</span></button>
            <div class="smk-acc-body"><p>Nätrygg (mesh) ger bättre luftcirkulation och håller kroppen sval. Stoppat tyg eller konstläder passar i kallare miljöer. Välj material efter klimat och personlig preferens.</p></div>
          </div>
          <div class="smk-acc-item">
            <button class="smk-acc-trigger">Justerbarhet &amp; belastningsklass<span class="smk-acc-arrow">+</span></button>
            <div class="smk-acc-body"><p>Kontorsstolar finns i klass 2 (upp till 8 h/dag) och klass 3 (dygnet-runt-bruk). För kontorsmiljöer räcker vanligtvis klass 2, men välj klass 3 om stolen används av skiftpersonal.</p></div>
          </div>
          <div class="smk-acc-item">
            <button class="smk-acc-trigger">Pris vs. kvalitet – vad är rimligt?<span class="smk-acc-arrow">+</span></button>
            <div class="smk-acc-body"><p>En kontorsstol av god kvalitet kostar 2 000–6 000 kr. Billigare modeller saknar ofta justeringsmöjligheter och håller kortare. Räknat per dag under fem år är en investering på 3 000 kr bara 1,65 kr/dag.</p></div>
          </div>
        </div>
      </div>
      <!-- RIGHT: info card -->
      <div>
        <div class="smk-info-card">
          <h3>Snabbguide — Stoltyper</h3>
          <table class="smk-info-table">
            <tr><td>Kontorsstol</td><td>Dagligt kontorsarbete, 6–8 h</td></tr>
            <tr><td>Chefsstol</td><td>Representativt utseende + komfort</td></tr>
            <tr><td>Operatörsstol</td><td>Klass 3, dygnet-runt-drift</td></tr>
            <tr><td>Konferensstol</td><td>Kortare möten, stapelbar</td></tr>
            <tr><td>Ergonomisk stol</td><td>Kroniska besvär, extra stöd</td></tr>
          </table>
          <div style="margin-top:22px;">
            <a href="/kontakt/" class="smk-btn-bronze" style="font-size:.85rem;padding:11px 22px;">Personlig rådgivning</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- PRODUCT GRID HEADER -->
<div id="vara-kontorsstolar">
<section class="smk-prod-header">
  <div class="smk-wrap">
    <span class="smk-eyebrow">Sortimentet</span>
    <h2>Våra kontorsstolar</h2>
    <p>Ergonomiska modeller för alla behov och budgetar – från enkel konferens till fullutrustad chefsstol.</p>
  </div>
</section>
<div class="smk-prod-grid-wrap">
  <div class="smk-wrap">
    [ux_products columns="4" columns__sm="2" category="kontorsstolar" number="12"]
  </div>
</div>
</div>

<!-- B2B -->
<section class="smk-b2b">
  <div class="smk-wrap smk-b2b-inner">
    <span class="smk-eyebrow" style="color:var(--smk-bronze);">Företag &amp; B2B</span>
    <h2>Inreder ni ett helt kontor?</h2>
    <p>Vi erbjuder volympriser, faktura 30 dagar och fri frakt för företagsbeställningar. Kontakta oss för en skräddarsydd offert.</p>
    <a href="/kontakt/" class="smk-btn-bronze">Begär företagsoffert</a>
  </div>
</section>
"""

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 2 — Höj-sänkbara skrivbord (ID 17937)
# ─────────────────────────────────────────────────────────────────────────────

PAGE_SKRIVBORD = SHARED_STYLES + """
<!-- HERO -->
<section class="smk-hero" style="background-image:none;">
  <div class="smk-wrap smk-hero-inner">
    <span class="smk-eyebrow">Höj-sänkbara skrivbord</span>
    <h1>Höj-sänkbara skrivbord för<br>en aktiv arbetsdag</h1>
    <p>Minska stillasittandet och öka energin med ett höj- och sänkbart skrivbord. Vi har modeller för alla kontor – från enstaka arbetsplatser till hela plan.</p>
    <div class="smk-hero-btns">
      <a href="#vara-skrivbord" class="smk-btn-bronze">Se alla skrivbord</a>
      <a href="/kontakt/" class="smk-btn-outline">Fri konsultation</a>
    </div>
  </div>
</section>

<!-- USP BAR -->
<section class="smk-usp-bar">
  <div class="smk-wrap">
    <div class="smk-usp-bar-grid">
      <div class="smk-usp-item">
        <div class="smk-usp-icon">&#10003;</div>
        <div class="smk-usp-text"><strong>Fri frakt</strong>vid order över 2 000 kr</div>
      </div>
      <div class="smk-usp-item">
        <div class="smk-usp-icon">&#9889;</div>
        <div class="smk-usp-text"><strong>Elmotor</strong>tyst och snabb lyftmekanism</div>
      </div>
      <div class="smk-usp-item">
        <div class="smk-usp-icon">&#9733;</div>
        <div class="smk-usp-text"><strong>5 års garanti</strong>på motor &amp; stativ</div>
      </div>
      <div class="smk-usp-item">
        <div class="smk-usp-icon">&#128230;</div>
        <div class="smk-usp-text"><strong>Snabb leverans</strong>3–6 arbetsdagar</div>
      </div>
    </div>
  </div>
</section>

<!-- GUIDE -->
<section class="smk-guide">
  <div class="smk-wrap">
    <div class="smk-guide-grid">
      <div>
        <span class="smk-eyebrow">Köpguide</span>
        <h2>Varför välja höj-sänkbart?</h2>
        <p>Forskning visar att regelbundna positionsskiften minskar ryggvärk, förbättrar blodcirkulationen och ökar koncentrationen. Fyra faktorer att tänka på när du väljer modell:</p>
        <div class="smk-accordion">
          <div class="smk-acc-item">
            <button class="smk-acc-trigger">Motorstyrka &amp; lyfthöjd<span class="smk-acc-arrow">+</span></button>
            <div class="smk-acc-body"><p>Välj en motor med minst 80 kg lyftkraft om du planerar att ha dator, skärmar och tillbehör på skivan. Lyfthöjden bör täcka 68–120 cm för att passa de flesta kroppstyper.</p></div>
          </div>
          <div class="smk-acc-item">
            <button class="smk-acc-trigger">Minneshöjder &amp; styrpanel<span class="smk-acc-arrow">+</span></button>
            <div class="smk-acc-body"><p>En styrpanel med 3–4 minneshöjder gör det enkelt att växla position utan att ställa om varje gång. Enklare modeller har ett enda upp/ner-reglage.</p></div>
          </div>
          <div class="smk-acc-item">
            <button class="smk-acc-trigger">Skivstorlek &amp; material<span class="smk-acc-arrow">+</span></button>
            <div class="smk-acc-body"><p>Standard kontorsyta är 120×70 cm, men 140×70 eller 160×80 cm ger bättre plats för dubbla skärmar. MDF-kärna med melaminyta är tålig och enkel att hålla ren.</p></div>
          </div>
          <div class="smk-acc-item">
            <button class="smk-acc-trigger">Kabeldragning &amp; tillbehör<span class="smk-acc-arrow">+</span></button>
            <div class="smk-acc-body"><p>Kabelkorg under skivan och kabelränna längs benet håller arbetsplatsen snygg oavsett höjd. Komplettera gärna med monitorarm och kabelclips.</p></div>
          </div>
        </div>
      </div>
      <div>
        <div class="smk-info-card">
          <h3>Snabbjämförelse — Skrivbordstyper</h3>
          <table class="smk-info-table">
            <tr><td>Manuellt</td><td>Vev, tyst, inget el, lägre pris</td></tr>
            <tr><td>El – 1 motor</td><td>Bra för 1 person, 70–90 kg last</td></tr>
            <tr><td>El – 2 motorer</td><td>Snabbare, stabilare, 120+ kg</td></tr>
            <tr><td>Hörnskrivbord</td><td>L-form, maximal yta, 2-motor</td></tr>
            <tr><td>Sittstå-modul</td><td>Monteras på befintligt skrivbord</td></tr>
          </table>
          <div style="margin-top:22px;">
            <a href="/kontakt/" class="smk-btn-bronze" style="font-size:.85rem;padding:11px 22px;">Rådgivning</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- PRODUCT GRID HEADER -->
<div id="vara-skrivbord">
<section class="smk-prod-header">
  <div class="smk-wrap">
    <span class="smk-eyebrow">Sortimentet</span>
    <h2>Våra höj-sänkbara skrivbord</h2>
    <p>El-drivna och manuella modeller i olika storlekar och utföranden.</p>
  </div>
</section>
<div class="smk-prod-grid-wrap">
  <div class="smk-wrap">
    [ux_products columns="4" columns__sm="2" category="hoj-och-sankbara-skrivbord" number="12"]
  </div>
</div>
</div>

<!-- B2B -->
<section class="smk-b2b">
  <div class="smk-wrap smk-b2b-inner">
    <span class="smk-eyebrow" style="color:var(--smk-bronze);">Företag &amp; B2B</span>
    <h2>Planerar ni att byta ut hela kontorsplanets skrivbord?</h2>
    <p>Vi levererar volymorder med faktura, fri frakt och fri montering vid beställning av 10+ skrivbord. Kontakta oss för offert.</p>
    <a href="/kontakt/" class="smk-btn-bronze">Begär företagsoffert</a>
  </div>
</section>
"""

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 3 — Konferensbord (ID 18136)
# ─────────────────────────────────────────────────────────────────────────────

PAGE_KONFERENSBORD = SHARED_STYLES + """
<!-- HERO -->
<section class="smk-hero">
  <div class="smk-wrap smk-hero-inner">
    <span class="smk-eyebrow">Konferensbord</span>
    <h1>Konferensbord för<br>moderna mötesrum</h1>
    <p>Från intima möten för fyra till styrelsemöten för tjugo personer – vi har rätt konferensbord för ert mötesrum.</p>
    <div class="smk-hero-btns">
      <a href="#vara-konferensbord" class="smk-btn-bronze">Se alla bord</a>
      <a href="/kontakt/" class="smk-btn-outline">Fri rådgivning</a>
    </div>
  </div>
</section>

<!-- SIZE CARDS -->
<section class="smk-cards-section">
  <div class="smk-wrap">
    <span class="smk-eyebrow">Välj storlek</span>
    <h2>Hitta rätt bordsstorlek</h2>
    <p>Räkna med 60–70 cm per person längs bordet för bekvämt sittande med anteckningsblock och laptop.</p>
    <div class="smk-card-grid smk-card-grid-3">
      <div class="smk-card">
        <div class="smk-card-icon" style="font-size:1.1rem;font-weight:700;">2–6</div>
        <h3>Litet mötesrum</h3>
        <p>Bordsformat 120×80 – 160×90 cm. Passar brainstorming, rekryteringsintervjuer och teamhuddle.</p>
        <span class="smk-price">Från 3 990 kr</span>
      </div>
      <div class="smk-card">
        <div class="smk-card-icon" style="font-size:1.1rem;font-weight:700;">6–12</div>
        <h3>Mellanstor konferens</h3>
        <p>Bordsformat 200×90 – 280×100 cm. Det vanligaste valet för avdelningsmöten och kundpresentationer.</p>
        <span class="smk-price">Från 7 490 kr</span>
      </div>
      <div class="smk-card">
        <div class="smk-card-icon" style="font-size:1.1rem;font-weight:700;">12+</div>
        <h3>Styrelserum</h3>
        <p>Bordsformat 340×120 cm och uppåt. Ofta modulärt eller båtformat för god ögonkontakt runt bordet.</p>
        <span class="smk-price">Från 14 900 kr</span>
      </div>
    </div>
  </div>
</section>

<!-- GUIDE -->
<section class="smk-guide">
  <div class="smk-wrap">
    <div class="smk-guide-grid">
      <div>
        <span class="smk-eyebrow">Köpguide</span>
        <h2>Välja konferensbord — 5 faktorer</h2>
        <p>Rätt konferensbord förbättrar möteskulturen och gör ett professionellt intryck på kunder och partners.</p>
        <div class="smk-accordion">
          <div class="smk-acc-item">
            <button class="smk-acc-trigger">Rumsform &amp; placering<span class="smk-acc-arrow">+</span></button>
            <div class="smk-acc-body"><p>Lämna minst 90 cm runt bordet så att stolar kan dras ut och folk kan gå förbi. Mät rummet innan du beställer – ett bord som är för stort blockerar rörelseutrymmet och skapar en klaustrofobisk känsla.</p></div>
          </div>
          <div class="smk-acc-item">
            <button class="smk-acc-trigger">Bordform &amp; kommunikation<span class="smk-acc-arrow">+</span></button>
            <div class="smk-acc-body"><p>Runda och ovala bord ger bättre ögonkontakt och känsla av jämlikhet. Rektangulära bord signalerar hierarki och passar styrelserum. Båtformade är en kompromiss – bra ögonkontakt med tydlig plats för ordförande.</p></div>
          </div>
          <div class="smk-acc-item">
            <button class="smk-acc-trigger">Material &amp; ytbehandling<span class="smk-acc-arrow">+</span></button>
            <div class="smk-acc-body"><p>Bordsskivor i laminat är lättskött och tålig mot repor. Fanér och massivt trä ger mer exklusiv känsla men kräver mer underhåll. Välj matta ytor för att undvika blänk mot projektor.</p></div>
          </div>
          <div class="smk-acc-item">
            <button class="smk-acc-trigger">Teknisk integration<span class="smk-acc-arrow">+</span></button>
            <div class="smk-acc-body"><p>Inbyggda kabelintag (flush-monterade boxar) för ström och HDMI gör det enkelt att koppla upp laptops utan sladdar på bordet. Planera kabeldragningen innan bordet installeras.</p></div>
          </div>
          <div class="smk-acc-item">
            <button class="smk-acc-trigger">Modulärt vs fast bord<span class="smk-acc-arrow">+</span></button>
            <div class="smk-acc-body"><p>Modulära konferensbord kan delas upp till mindre bord eller arrangeras i U-form. Praktiskt för mötesrum som används till kurser, workshops och presentationer.</p></div>
          </div>
        </div>
      </div>
      <div>
        <div class="smk-info-card">
          <h3>Storleksguide</h3>
          <table class="smk-info-table">
            <tr><td>2–4 pers</td><td>120 cm</td></tr>
            <tr><td>4–6 pers</td><td>160 cm</td></tr>
            <tr><td>6–8 pers</td><td>200 cm</td></tr>
            <tr><td>8–10 pers</td><td>240 cm</td></tr>
            <tr><td>10–12 pers</td><td>280 cm</td></tr>
            <tr><td>12–16 pers</td><td>320–360 cm</td></tr>
            <tr><td>16–20 pers</td><td>400+ cm (modulärt)</td></tr>
          </table>
          <p style="font-size:.78rem;color:rgba(255,255,255,.6);margin-top:10px;">Räknat med 70 cm per person.</p>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- PRODUCT GRID -->
<div id="vara-konferensbord">
<section class="smk-prod-header">
  <div class="smk-wrap">
    <span class="smk-eyebrow">Sortimentet</span>
    <h2>Våra konferensbord</h2>
    <p>Alla storlekar och former – från compaktbord för litet mötesrum till stora modulära lösningar.</p>
  </div>
</section>
<div class="smk-prod-grid-wrap">
  <div class="smk-wrap">
    [ux_products columns="4" columns__sm="2" category="konferensbord" number="12"]
  </div>
</div>
</div>

<!-- B2B -->
<section class="smk-b2b">
  <div class="smk-wrap smk-b2b-inner">
    <span class="smk-eyebrow" style="color:var(--smk-bronze);">Inredningsprojekt</span>
    <h2>Inreder ni ett helt kontor?</h2>
    <p>Vi hjälper er med planlösning, leverans och montering. Kontakta oss för en kostnadsfri genomgång av era lokaler.</p>
    <a href="/kontakt/" class="smk-btn-bronze">Kom igång</a>
  </div>
</section>
"""

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 4 — Förvaring (ID 18135)
# ─────────────────────────────────────────────────────────────────────────────

PAGE_FORVARING = SHARED_STYLES + """
<!-- HERO -->
<section class="smk-hero">
  <div class="smk-wrap smk-hero-inner">
    <span class="smk-eyebrow">Förvaring</span>
    <h1>Smarta förvaringslösningar<br>för kontoret</h1>
    <p>Ett organiserat kontor är ett produktivt kontor. Vi erbjuder arkivskåp, bokhyllor, lådskåp och garderobslösningar som passar alla kontorsmiljöer.</p>
    <div class="smk-hero-btns">
      <a href="#vara-forvaring" class="smk-btn-bronze">Se sortimentet</a>
      <a href="/kontakt/" class="smk-btn-outline">Fri rådgivning</a>
    </div>
  </div>
</section>

<!-- CATEGORY CARDS -->
<section class="smk-cards-section">
  <div class="smk-wrap">
    <span class="smk-eyebrow">Kategorier</span>
    <h2>Vad letar du efter?</h2>
    <p>Vi har förvaringslösningar för alla delar av kontoret.</p>
    <div class="smk-card-grid smk-card-grid-4">
      <div class="smk-card">
        <div class="smk-card-icon">&#128196;</div>
        <h3>Arkivskåp</h3>
        <p>Stål- och träskåp för pärmar och dokument. Med eller utan lås, i flera höjder.</p>
      </div>
      <div class="smk-card">
        <div class="smk-card-icon">&#128218;</div>
        <h3>Bokhyllor</h3>
        <p>Öppna hyllor och bokhyllor i trä och metall, anpassade för kontor och reception.</p>
      </div>
      <div class="smk-card">
        <div class="smk-card-icon">&#128230;</div>
        <h3>Lådskåp</h3>
        <p>Rollcontainers och lådskåp för kontorsmaterial och personliga tillhörigheter.</p>
      </div>
      <div class="smk-card">
        <div class="smk-card-icon">&#128082;</div>
        <h3>Garderob</h3>
        <p>Omklädningsskåp och halvhöga garderober för personalutrymmen och entréer.</p>
      </div>
    </div>
  </div>
</section>

<!-- GUIDE -->
<section class="smk-guide">
  <div class="smk-wrap">
    <div class="smk-guide-grid">
      <div>
        <span class="smk-eyebrow">Fördelar</span>
        <h2>Varför förvaring lönar sig</h2>
        <p>En genomtänkt förvaringslösning sparar tid varje dag – och gör ett professionellt intryck på kunder och besökare.</p>
        <ul style="list-style:none;padding:0;margin:0 0 24px;display:flex;flex-direction:column;gap:12px;">
          <li style="display:flex;gap:12px;align-items:flex-start;">
            <span style="color:var(--smk-bronze);font-weight:700;margin-top:2px;">&#10003;</span>
            <span style="color:#444;font-size:.93rem;line-height:1.5;">Minskat söktid – allt på sin plats</span>
          </li>
          <li style="display:flex;gap:12px;align-items:flex-start;">
            <span style="color:var(--smk-bronze);font-weight:700;margin-top:2px;">&#10003;</span>
            <span style="color:#444;font-size:.93rem;line-height:1.5;">GDPR-efterlevnad med låsbara skåp</span>
          </li>
          <li style="display:flex;gap:12px;align-items:flex-start;">
            <span style="color:var(--smk-bronze);font-weight:700;margin-top:2px;">&#10003;</span>
            <span style="color:#444;font-size:.93rem;line-height:1.5;">Bättre arbetsmiljö och lägre stress</span>
          </li>
          <li style="display:flex;gap:12px;align-items:flex-start;">
            <span style="color:var(--smk-bronze);font-weight:700;margin-top:2px;">&#10003;</span>
            <span style="color:#444;font-size:.93rem;line-height:1.5;">Skalbar – lägg till moduler vid behov</span>
          </li>
        </ul>
        <a href="/kontakt/" class="smk-btn-bronze-outline">Begär planlösning</a>
      </div>
      <div>
        <div class="smk-info-card">
          <h3>Produkttyper i detalj</h3>
          <div style="margin-bottom:16px;">
            <div style="color:var(--smk-bronze);font-weight:700;font-size:.88rem;margin-bottom:4px;">Arkivskåp</div>
            <p style="color:rgba(255,255,255,.8);font-size:.83rem;margin:0;line-height:1.5;">Välj höjd efter antal pärmar. 4-sektionsskåp rymmer ~360 A4-pärmar.</p>
          </div>
          <div style="margin-bottom:16px;">
            <div style="color:var(--smk-bronze);font-weight:700;font-size:.88rem;margin-bottom:4px;">Rollcontainer</div>
            <p style="color:rgba(255,255,255,.8);font-size:.83rem;margin:0;line-height:1.5;">Passar under skrivbord med central lås. Standard BxD: 43×58 cm.</p>
          </div>
          <div>
            <div style="color:var(--smk-bronze);font-weight:700;font-size:.88rem;margin-bottom:4px;">Kombinationsskåp</div>
            <p style="color:rgba(255,255,255,.8);font-size:.83rem;margin:0;line-height:1.5;">Överdel med hyllor + nederdel med lådor. Flexibel dagligdagsförvaring.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- PRODUCT GRID -->
<div id="vara-forvaring">
<section class="smk-prod-header">
  <div class="smk-wrap">
    <span class="smk-eyebrow">Sortimentet</span>
    <h2>Våra förvaringslösningar</h2>
    <p>Arkivskåp, hyllor, lådskåp och garderober – allt du behöver för ett organiserat kontor.</p>
  </div>
</section>
<div class="smk-prod-grid-wrap">
  <div class="smk-wrap">
    [ux_products columns="4" columns__sm="2" category="forvaring" number="12"]
  </div>
</div>
</div>

<!-- B2B -->
<section class="smk-b2b">
  <div class="smk-wrap smk-b2b-inner">
    <span class="smk-eyebrow" style="color:var(--smk-bronze);">Inredningsprojekt</span>
    <h2>Nytt kontor eller renovering?</h2>
    <p>Vi hjälper er att planera förvaringen för hela kontoret. Kostnadsfri genomgång och offert på volymorder.</p>
    <a href="/kontakt/" class="smk-btn-bronze">Prata med oss</a>
  </div>
</section>
"""

# ─────────────────────────────────────────────────────────────────────────────
# PAGE 5 — Företag & B2B (ID 10526)
# ─────────────────────────────────────────────────────────────────────────────

PAGE_FORETAG = SHARED_STYLES + """
<!-- HERO -->
<section class="smk-hero">
  <div class="smk-wrap smk-hero-inner">
    <span class="smk-eyebrow">Företag &amp; B2B</span>
    <h1>Kontorsmöbler för företag</h1>
    <p>Vi är er partner för kompletta kontorsinredningar. Volympriser, faktura 30 dagar och dedikerad kontaktperson – från idé till monterat kontor.</p>
    <div class="smk-hero-btns">
      <a href="#kontakta-oss" class="smk-btn-bronze">Begär offert</a>
      <a href="tel:+46XXXXXXXXXX" class="smk-btn-outline">Ring oss direkt</a>
    </div>
  </div>
</section>

<!-- BENEFITS CARDS -->
<section class="smk-cards-section" style="background:var(--smk-bg-warm);">
  <div class="smk-wrap">
    <span class="smk-eyebrow">Fördelar</span>
    <h2 style="font-size:1.8rem;font-weight:700;letter-spacing:-.02em;color:var(--smk-olive-dk);margin:8px 0 10px;">Varför välja Smälands Kontorsmöbler?</h2>
    <p style="color:#555;margin:0 0 36px;">Vi erbjuder mer än möbler – vi erbjuder en komplett inredningslösning för ert kontor.</p>
    <div class="smk-benefits-grid">
      <div class="smk-benefit">
        <div class="smk-benefit-icon">&#128181;</div>
        <h3>Volympriser</h3>
        <p>Rabatterade priser vid beställning av 5 eller fler enheter. Ju fler, desto bättre pris.</p>
      </div>
      <div class="smk-benefit">
        <div class="smk-benefit-icon">&#128203;</div>
        <h3>Faktura 30 dagar</h3>
        <p>Alla registrerade företag kan handla på faktura med 30 dagars betalningsvillkor.</p>
      </div>
      <div class="smk-benefit">
        <div class="smk-benefit-icon">&#128101;</div>
        <h3>Dedikerad kontakt</h3>
        <p>En kontaktperson som känner ert konto och följer er order från läggning till leverans.</p>
      </div>
      <div class="smk-benefit">
        <div class="smk-benefit-icon">&#128666;</div>
        <h3>Fri frakt</h3>
        <p>Fri leverans till er dörr vid order över 10 000 kr. Vi erbjuder även montering på plats.</p>
      </div>
      <div class="smk-benefit">
        <div class="smk-benefit-icon">&#127968;</div>
        <h3>Planlösning ingår</h3>
        <p>Vi hjälper er ta fram en planlösning som maximerar era lokaler och arbetsmiljön.</p>
      </div>
      <div class="smk-benefit">
        <div class="smk-benefit-icon">&#127807;</div>
        <h3>Hållbara val</h3>
        <p>Vi prioriterar leverantörer med miljöcertifieringar och erbjuder cirkulärt återbruk.</p>
      </div>
    </div>
  </div>
</section>

<!-- HOW IT WORKS -->
<section class="smk-steps">
  <div class="smk-wrap">
    <span class="smk-eyebrow" style="color:var(--smk-bronze);display:block;text-align:center;">Processen</span>
    <h2>Så fungerar det</h2>
    <div class="smk-steps-grid">
      <div class="smk-step">
        <div class="smk-step-num">1</div>
        <h3>Kontakt &amp; behovsanalys</h3>
        <p>Ni kontaktar oss via formulär eller telefon. Vi lyssnar på era behov och lokaler.</p>
      </div>
      <div class="smk-step">
        <div class="smk-step-num">2</div>
        <h3>Offert &amp; planlösning</h3>
        <p>Vi tar fram ett förslag med produkter, priser och planlösning – utan kostnad.</p>
      </div>
      <div class="smk-step">
        <div class="smk-step-num">3</div>
        <h3>Godkännande &amp; order</h3>
        <p>Ni godkänner offerten, vi lägger order och bekräftar leveransdatum.</p>
      </div>
      <div class="smk-step">
        <div class="smk-step-num">4</div>
        <h3>Leverans &amp; montering</h3>
        <p>Vi levererar och monterar på plats. Ni kan börja arbeta direkt efter leveransen.</p>
      </div>
    </div>
  </div>
</section>

<!-- CONTACT CTA -->
<section class="smk-contact-cta" id="kontakta-oss">
  <div class="smk-wrap">
    <div class="smk-contact-cta-inner">
      <div>
        <span class="smk-eyebrow">Kontakt</span>
        <h2>Redo att inreda ert kontor?</h2>
        <p>Fyll i formuläret nedan eller kontakta oss direkt. Vi återkommer inom en arbetsdag med ett förslag anpassat för er.</p>
        <a href="/kontakt/" class="smk-btn-bronze">Skicka förfrågan</a>
      </div>
      <div>
        <div class="smk-contact-info">
          <div class="smk-contact-row">
            <div class="smk-contact-row-icon">&#128222;</div>
            <span><strong>Telefon</strong>Se kontaktsidan för aktuellt nummer</span>
          </div>
          <div class="smk-contact-row">
            <div class="smk-contact-row-icon">&#9993;</div>
            <span><strong>E-post</strong>info@smalandskontorsmobler.se</span>
          </div>
          <div class="smk-contact-row">
            <div class="smk-contact-row-icon">&#128336;</div>
            <span><strong>Svarstid</strong>Inom 1 arbetsdag</span>
          </div>
          <div class="smk-contact-row">
            <div class="smk-contact-row-icon">&#128205;</div>
            <span><strong>Leveransområde</strong>Hela Sverige</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
"""

# ─────────────────────────────────────────────────────────────────────────────
# DEPLOY
# ─────────────────────────────────────────────────────────────────────────────

PAGES = [
    {"id": 17851, "slug": "kontorsstolar", "title": "Kontorsstolar", "content": PAGE_KONTORSSTOLAR},
    {"id": 17937, "slug": "hoj-sankbara-skrivbord", "title": "Höj-sänkbara skrivbord", "content": PAGE_SKRIVBORD},
    {"id": 18134, "slug": "konferensbord", "title": "Konferensbord", "content": PAGE_KONFERENSBORD},
    {"id": 18135, "slug": "forvaring", "title": "Förvaring", "content": PAGE_FORVARING},
    {"id": 10526, "slug": "foretag-b2b", "title": "Företag & B2B", "content": PAGE_FORETAG},
]

results = []
for page in PAGES:
    url = f"{BASE_URL}/{page['id']}"
    payload = {
        "content": page["content"],
        "status": "publish",
    }
    try:
        r = requests.post(url, json=payload, auth=AUTH, timeout=30)
        if r.status_code in (200, 201):
            data = r.json()
            link = data.get("link", "N/A")
            results.append({"id": page["id"], "slug": page["slug"], "status": "OK", "url": link, "http": r.status_code})
            print(f"[OK] ID {page['id']} — {page['title']} → {link}")
        else:
            results.append({"id": page["id"], "slug": page["slug"], "status": "FAIL", "http": r.status_code, "body": r.text[:300]})
            print(f"[FAIL] ID {page['id']} — {page['title']} | HTTP {r.status_code}: {r.text[:200]}")
    except Exception as e:
        results.append({"id": page["id"], "slug": page["slug"], "status": "ERROR", "error": str(e)})
        print(f"[ERROR] ID {page['id']} — {page['title']}: {e}")

print("\n── Summary ──")
for r in results:
    print(json.dumps(r, ensure_ascii=False))
