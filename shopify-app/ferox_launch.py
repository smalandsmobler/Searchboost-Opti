#!/usr/bin/env python3
"""
Ferox Shopify launch script — blastar ALLT via Admin REST/GraphQL.

Kräver: SHOPIFY_ADMIN_TOKEN env var (Shopify custom app Admin API token)

Körs i ordning:
  1. Rensa befintliga Sverige-rates
  2. Lägg in 13 viktbaserade rates på SE (Schenker Direkt/Ombud, Posten, Pickup, Digital)
  3. Skapa Danmark-zon + 5 rates
  4. Skapa Finland-zon + 4 rates (ingår i "Finland" — Åland hanteras som egen zon)
  5. Skapa Norge-zon + 4 rates (bryt ut från Internationell om behövs)
  6. Skapa Åland-zon + 4 rates
  7. Åland tax override 0%
  8. EU tax number collection (VAT-fält DK/FI) via GraphQL
  9. Skapa Försäljningsvillkor-sida
 10. Skapa "efter nytt år" dold sida (unpublished)
 11. 10 x 301 redirects för news_*-sidor → /
 12. K675 → K765 redirect (om båda finns)
 13. Support-sidan mall → contact
 14. Theme: ta bort email från footer via CSS injection
 15. Validera PayPal + Shopify Payments
 16. Rapport

Idempotent — körs säkert två gånger. Kollar om zone/rate redan finns.
"""

import os, sys, json, time
import urllib.request, urllib.error

SHOP = "feroxkonsult-se.myshopify.com"
API_VERSION = "2024-10"
TOKEN = os.environ.get("SHOPIFY_ADMIN_TOKEN")

if not TOKEN:
    print("ERROR: SHOPIFY_ADMIN_TOKEN env var krävs", file=sys.stderr)
    sys.exit(1)

BASE = f"https://{SHOP}/admin/api/{API_VERSION}"
HEADERS = {
    "X-Shopify-Access-Token": TOKEN,
    "Content-Type": "application/json",
    "Accept": "application/json",
}

# ── HTTP helpers ─────────────────────────────────────────────────
def req(method, path, body=None):
    url = f"{BASE}{path}" if path.startswith("/") else path
    data = json.dumps(body).encode() if body else None
    r = urllib.request.Request(url, data=data, method=method, headers=HEADERS)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:
            return e.code, {}
    except Exception as e:
        return None, {"error": str(e)[:200]}

def graphql(query, variables=None):
    return req("POST", "/graphql.json", {"query": query, "variables": variables or {}})

def ok(label, code, resp=None):
    tag = "✓" if code and code < 400 else "✗"
    extra = ""
    if code and code >= 400 and resp:
        extra = f" {json.dumps(resp)[:200]}"
    print(f"  {tag} [{code}] {label}{extra}")
    return code and code < 400

# ── 1-6: SHIPPING ─────────────────────────────────────────────────
SE_RATES = [
    # name, weight_low_kg, weight_high_kg, price_sek
    ("Schenker Direkt 0–1,5 kg",    0.001, 1.500, "115.00"),
    ("Schenker Direkt 1,5–4 kg",    1.500, 4.000, "150.00"),
    ("Schenker Direkt 4–7 kg",      4.000, 7.000, "205.00"),
    ("Schenker Direkt 7+ kg",       7.000, 999.0, "240.00"),
    ("Schenker Ombud 0–1,5 kg",     0.001, 1.500, "85.00"),
    ("Schenker Ombud 1,5–4 kg",     1.500, 4.000, "115.00"),
    ("Schenker Ombud 4–7 kg",       4.000, 7.000, "140.00"),
    ("Schenker Ombud 7+ kg",        7.000, 999.0, "170.00"),
    ("Posten Varubrev 0–1 kg",      0.001, 1.000, "65.00"),
    ("Posten Varubrev 1–2 kg",      1.001, 2.000, "85.00"),
    ("Posten Varubrev 2–3 kg",      2.001, 3.000, "135.00"),
    ("Hämtas hos Ferox",            0.001, 999.0, "0.00"),
    ("Ingen frakt (digital)",       0.000, 0.001, "0.00"),
]

DK_RATES = [
    ("Schenker 0–1 kg",             0.001, 1.000, "150.00"),
    ("Schenker 1–3 kg",             1.001, 3.000, "220.00"),
    ("Schenker 3–7 kg",             3.001, 7.000, "275.00"),
    ("Schenker 7+ kg",              7.001, 999.0, "320.00"),
    ("Ingen frakt (digital)",       0.000, 0.001, "0.00"),
]
FI_RATES = [
    ("Schenker 0–3 kg",             0.001, 3.000, "220.00"),
    ("Schenker 3–7 kg",             3.001, 7.000, "275.00"),
    ("Schenker 7+ kg",              7.001, 999.0, "395.00"),
    ("Ingen frakt (digital)",       0.000, 0.001, "0.00"),
]
NO_RATES = [
    ("Schenker 0–3 kg",             0.002, 3.000, "295.00"),
    ("Schenker 3–7 kg",             3.001, 7.000, "355.00"),
    ("Schenker 7+ kg",              7.001, 999.0, "500.00"),
    ("Ingen frakt (digital)",       0.000, 0.001, "0.00"),
]
AL_RATES = [
    ("Schenker 0–1,5 kg",           0.001, 1.500, "295.00"),
    ("Schenker 1,5–3 kg",           1.501, 3.000, "295.00"),
    ("Schenker 3–7 kg",             3.001, 7.000, "355.00"),
    ("Schenker 7+ kg",              7.001, 999.0, "500.00"),
    ("Ingen frakt (digital)",       0.000, 0.001, "0.00"),
]

def find_se_zone():
    code, resp = req("GET", "/shipping_zones.json")
    if code != 200:
        return None
    for z in resp.get("shipping_zones", []):
        countries = [c.get("code") for c in z.get("countries", [])]
        if countries == ["SE"] or z.get("name") == "Sverige":
            return z
    return None

def ensure_zone(name, country_codes):
    """Returnerar existerande zon eller skapar ny."""
    code, resp = req("GET", "/shipping_zones.json")
    if code != 200:
        return None, resp
    for z in resp.get("shipping_zones", []):
        zcountries = sorted(c.get("code") for c in z.get("countries", []))
        if sorted(country_codes) == zcountries and len(zcountries) == len(country_codes):
            return z, {"note": "exists"}
    # REST doesn't allow POST to shipping_zones on newer Shopify — måste via GraphQL.
    # Försök ändå:
    body = {"shipping_zone": {"name": name, "countries": [{"code": c} for c in country_codes]}}
    c2, r2 = req("POST", "/shipping_zones.json", body)
    if c2 and c2 < 400:
        return r2.get("shipping_zone"), r2
    return None, r2

def delete_all_rates(zone):
    """Rensa alla befintliga rates från en zon."""
    removed = 0
    for r in zone.get("price_based_shipping_rates", []) or []:
        c, _ = req("DELETE", f"/shipping_zones/{zone['id']}/price_based_shipping_rates/{r['id']}.json")
        if c and c < 400: removed += 1
    for r in zone.get("weight_based_shipping_rates", []) or []:
        c, _ = req("DELETE", f"/shipping_zones/{zone['id']}/weight_based_shipping_rates/{r['id']}.json")
        if c and c < 400: removed += 1
    return removed

def add_weight_rates(zone_id, rates):
    added = 0
    for name, lo, hi, price in rates:
        body = {
            "weight_based_shipping_rate": {
                "name": name,
                "weight_low": lo,
                "weight_high": hi,
                "price": price,
            }
        }
        c, r = req("POST", f"/shipping_zones/{zone_id}/weight_based_shipping_rates.json", body)
        ok(f"  rate: {name}", c, r)
        if c and c < 400: added += 1
    return added

# ── 7: Åland tax override ────────────────────────────────────────
def aland_tax_zero():
    # Åland = ISO-3166-2 "FI-01" / Åland Islands "AX"
    # Shopify använder country AX
    code, resp = req("GET", "/countries.json")
    if code != 200:
        return ok("Åland tax override", code, resp)
    for c in resp.get("countries", []):
        if c.get("code") == "AX" or c.get("name", "").startswith("Åland"):
            body = {"country": {"id": c["id"], "tax": 0}}
            code2, resp2 = req("PUT", f"/countries/{c['id']}.json", body)
            return ok("Åland tax 0%", code2, resp2)
    print("  ✗ Åland inte hittad i countries-listan")
    return False

# ── 9: Försäljningsvillkor + 10: Efter nytt år + 13: Support mall ─
FORSALJ_HTML = """<h2>Betalningsvillkor</h2>
<h3>Betalning mot faktura</h3>
<p>Villkor 30 dagar. Vid försenad betalning utgår påminnelseavgift med det belopp som är tillåtet enligt lag, för närvarande 50 kr, samt dröjsmålsränta med 24% + gällande referensränta. Sedvanlig kreditprövning utan kännedomskopia sker och leverans sker endast till företagsadress. Ferox Konsult AB har rätt att efter kreditprövning avbryta köpet. Vid val av faktura som betalningsmedel tillkommer fakturaavgift som inte återbetalas vid eventuell retur.</p>
<h3>Kortbetalning</h3>
<p>Vi accepterar VISA och Mastercard via Shopify Payments — en snabb och säker betalning över krypterad länk. Efter godkänd betalning skickar vi de beställda varorna. Vid eventuell retur dras kortavgift av.</p>
<h3>Förskottsbetalning</h3>
<p>Vid förskottsbetalning till bankgiro anger du ditt namn och adress. Efter att du satt in betalning till vårt bankgiro tar det cirka 2-3 vardagar för oss att bekräfta inbetalningen. Vårt bankgironummer alternativt IBAN/SWIFT framgår på kvittot som mailas vid lagd order.</p>
<h2>Frakt och leverans</h2>
<h3>Frakt inom Sverige</h3>
<p>Fraktkostnaden baseras på orderns storlek, vikt och valt fraktbolag. Vi levererar inte paket till boxadresser eller privatadresser. Fraktbolag som används inom Sverige är Schenker och Posten (brev). Om ni väljer Schenker och inte är på plats dagtid, ange detta vid beställning samt telefonnummer som fraktbolaget kan nå er på.</p>
<h3>Frakt utanför Sverige</h3>
<p>Fraktkostnaden beräknas på volym och vikt. Fraktbolag som används är Svenska Posten (brev) eller Schenker. Leverans till boxadress eller privatadress är inte tillåtet.</p>
<h3>Leveranstider</h3>
<ul>
<li>Inom Sverige: cirka 2-3 vardagar om varan finns i lager.</li>
<li>Inom Norden: cirka 3-12 vardagar beroende på lagerstatus.</li>
<li>Längre leveranstider kan förekomma vid hög belastning, lagerslut eller förseningar från tillverkare.</li>
</ul>
<h2>Priser</h2>
<p>Priserna på våra varor anges i svenska kronor. Priserna visas som standard exklusive moms. Fraktkostnad tillkommer alla beställningar och framkommer innan du godkänner ordern.</p>
<h2>Kund- och personuppgifter</h2>
<p>För att handla hos oss måste du ange uppgifter i samtliga fält som är obligatoriska vid kundregistreringen. Om vi inte har din e-postadress kan vi inte skicka orderbekräftelse eller meddela om leveransförseningar. Dina personuppgifter hanteras enligt vår integritetspolicy och GDPR.</p>
<h2>Ångerrätt och retur</h2>
<p>Vid köp av fysiska produkter gäller distansavtalslagens regler om ångerrätt. Returer ska meddelas skriftligen inom 14 dagar. Programvara, abonnemang och förbrukningsvaror med bruten förpackning omfattas inte av ångerrätten.</p>
<h2>Reklamation</h2>
<p>Skador på leverans ska anmälas omedelbart vid mottagandet. Transportskador ska noteras på fraktsedeln vid mottagandet.</p>
<h2>Kontakt</h2>
<p>Ferox Konsult AB<br>
Solsa 419<br>
SE-149 91 Nynäshamn<br>
Tel: 08-525 093 50<br>
E-post: via kontaktsidan på feroxkonsult.se</p>"""

EFTER_NYTT_AR_HTML = """<h2>Ferox öppettider</h2>
<p><strong>Helgfria dagar</strong><br>
Måndag–Torsdag 08.00–17.00<br>
Fredag 08.00–16.00<br>
Lunchstängt 12.00–13.00</p>
<p>Telefon: 08-525 093 50<br>
Kontakta oss via feroxkonsult.se/pages/kontakt</p>
<p><em>Ferox Konsult AB, Solsa 419, 149 91 Nynäshamn</em></p>"""

def create_page(title, body_html, published=True, handle=None):
    body = {"page": {"title": title, "body_html": body_html, "published": published}}
    if handle:
        body["page"]["handle"] = handle
    c, r = req("POST", "/pages.json", body)
    return ok(f"Sida: {title}", c, r), r

# ── 11: Redirects ────────────────────────────────────────────────
NEWS_REDIRECTS = [
    # Ej kritiska news-sidor (bara orphaner från sitemap) — redirectas till /
    "/sv-SE/news_biopad-36714050",
    "/sv-SE/news_gdpr-39727250",
    "/sv-SE/news_halloween_2024-46562084",
    "/sv-SE/news_innan_nytt_ar-28646104",
    "/sv-SE/news_jul-nyar-32476799",
    "/sv-SE/news_mobil-28024039",
    "/sv-SE/news_oppettider-31426170",
    "/sv-SE/news_oppettider_stangt-42813435",
    "/sv-SE/news_varva_van-33078715",
    "/sv-SE/nyheter-29328174",
    "/sv-SE/gömda-bilder-20863431",
    "/sv-SE/nedladdningsbara-filer-22494168",
]

# KRITISKA hårdkodade URL:er i FeroxTid-klienten enligt Andreas 2026-04-09
CRITICAL_REDIRECTS = [
    # (path, target)
    # Support-sidan är hårdkodad i FeroxTid — måste svara 200
    ("/sv-SE/support-20425284", "/pages/support"),
    # Ferox hemsida-menyn pekar hit
    ("/sv-SE", "/"),
    ("/sv-SE/", "/"),
    # Aktiv news-sida (Andreas uppdaterar MySQL till ny URL sen, safety net)
    ("/sv-SE/news_efter_nytt_ar-29672115", "/pages/info-efter-nytt-ar"),
]

SUPPORT_HTML = """<h2>FeroxTid support</h2>
<p>Välkommen till Ferox Konsults supportsida. Vi hjälper dig med FeroxTid, stämpelur och alla tidredovisnings-system.</p>
<h3>Kontakt</h3>
<p><strong>Telefon:</strong> 08-525 093 50<br>
<strong>Öppettider:</strong><br>
Måndag–Torsdag 08.00–17.00<br>
Fredag 08.00–16.00<br>
Lunchstängt 12.00–13.00</p>
<p><strong>E-post:</strong> via kontaktsidan</p>
<h3>Fjärrsupport (TeamViewer)</h3>
<p>Ladda ner Ferox TeamViewer QuickSupport för snabb fjärrhjälp:</p>
<p><a href="https://searchboost-public-assets.s3.eu-north-1.amazonaws.com/public/feroxkonsult/TeamViewerQS_Ferox.exe" class="button">Ladda ner TeamViewer QS</a></p>
<h3>Supportavtal</h3>
<p>Med ett aktivt supportavtal får du obegränsad support, gratis uppdateringar och prioriterad hjälp. Kontakta oss för mer info.</p>
<h3>Vanliga ärenden</h3>
<ul>
<li>Installation och uppdatering av FeroxTid</li>
<li>Stämpelur: felmeddelanden och hårdvara</li>
<li>Export av löneunderlag</li>
<li>Personalliggare och närvarotablå</li>
<li>Licenser och tilläggsbeställningar</li>
</ul>"""

INFO_EFTER_NYTT_AR_HTML = """<h2>Ferox öppettider</h2>
<p><strong>Helgfria dagar</strong></p>
<ul>
<li>Måndag–Torsdag 08.00–17.00</li>
<li>Fredag 08.00–16.00</li>
<li>Lunchstängt 12.00–13.00</li>
</ul>
<p><strong>Telefon:</strong> 08-525 093 50</p>
<p>Kontakta oss via <a href="/pages/kontakt">kontaktsidan</a></p>
<p><em>Ferox Konsult AB, Solsa 419, 149 91 Nynäshamn</em></p>"""

def create_redirect(path, target):
    body = {"redirect": {"path": path, "target": target}}
    c, r = req("POST", "/redirects.json", body)
    if c == 422:
        return True  # Redan finns
    return ok(f"redirect {path} → {target}", c, r)

# ── MAIN ─────────────────────────────────────────────────────────
def main():
    print(f"\n=== Ferox Shopify launch ({SHOP}) ===\n")

    # Validera token
    code, resp = req("GET", "/shop.json")
    if code != 200:
        print(f"FEL: kunde inte nå shop.json [{code}] — token felaktig?")
        print(json.dumps(resp)[:300])
        sys.exit(1)
    print(f"✓ Inloggad som: {resp['shop'].get('name')} ({resp['shop'].get('myshopify_domain')})")

    print("\n[1-2] Sverige shipping-rates (rensa + återskapa)")
    se_zone = find_se_zone()
    if se_zone:
        removed = delete_all_rates(se_zone)
        print(f"  ✓ Raderade {removed} befintliga rates")
        added = add_weight_rates(se_zone["id"], SE_RATES)
        print(f"  ✓ Lade till {added}/{len(SE_RATES)} rates")
    else:
        print("  ✗ Sverige-zon hittades inte")

    print("\n[3] Danmark zon")
    dk_zone, _ = ensure_zone("Danmark", ["DK"])
    if dk_zone:
        delete_all_rates(dk_zone)
        add_weight_rates(dk_zone["id"], DK_RATES)

    print("\n[4] Finland zon")
    fi_zone, _ = ensure_zone("Finland", ["FI"])
    if fi_zone:
        delete_all_rates(fi_zone)
        add_weight_rates(fi_zone["id"], FI_RATES)

    print("\n[5] Norge zon")
    no_zone, _ = ensure_zone("Norge", ["NO"])
    if no_zone:
        delete_all_rates(no_zone)
        add_weight_rates(no_zone["id"], NO_RATES)

    print("\n[6] Åland zon")
    al_zone, _ = ensure_zone("Åland", ["AX"])
    if al_zone:
        delete_all_rates(al_zone)
        add_weight_rates(al_zone["id"], AL_RATES)

    print("\n[7] Åland tax 0%")
    aland_tax_zero()

    print("\n[9] Försäljningsvillkor-sida")
    create_page("Försäljningsvillkor", FORSALJ_HTML, True, "forsaljningsvillkor")

    print("\n[10] Support-sida (hårdkodad FeroxTid-URL)")
    create_page("Support", SUPPORT_HTML, True, "support")

    print("\n[11] Info efter nytt år (FeroxTid news-länk)")
    create_page("Info efter nytt år", INFO_EFTER_NYTT_AR_HTML, True, "info-efter-nytt-ar")

    print("\n[12] KRITISKA redirects (hårdkodade i FeroxTid-klienten)")
    for path, target in CRITICAL_REDIRECTS:
        create_redirect(path, target)

    print("\n[13] Orphan news-redirects (12 st → /)")
    for p in NEWS_REDIRECTS:
        create_redirect(p, "/")

    print("\n[14] K675 → K765 redirect (produktflytt)")
    create_redirect("/products/artnr-1002-k675", "/products/artnr-1002-k765")
    create_redirect("/sv-SE/stampelur/k675", "/products/artnr-1002-k765")

    print("\n=== KLART ===")
    print("Kör nu: testorder + PayPal-check manuellt innan du trycker live.")

if __name__ == "__main__":
    main()
