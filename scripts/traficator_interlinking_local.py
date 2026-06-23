#!/usr/bin/env python3
"""
Traficator — interlinking för 8 lokala SEO-sidor.
Lägger till "Relaterade tjänster & marknader"-block i post_content.
Kör när siten är uppe igen (500-felet fixat).
"""
import requests, base64, time, json

WP_URL = "https://traficator.se/wp-json/wp/v2"
USER   = "mikael"
PASSWD = "V7gn HAb6 p9Yn 85BZ ujMi OINQ"
AUTH   = base64.b64encode(f"{USER}:{PASSWD}".encode()).decode()
H      = {"Authorization": f"Basic {AUTH}", "Content-Type": "application/json"}

# ---- Lokala sidor & deras interna länkblock ----
# Format: (id, slug, html_block_to_append)

INTERLINKS = [
    (1847, "gjuteri-jonkoping", """
<div class="sbs-related-pages" style="margin-top:40px;padding:28px 32px;background:#f8f8f8;border-left:4px solid #c0392b;border-radius:4px">
<h3 style="margin:0 0 14px;font-size:18px;color:#1a1a1a">Relaterade tjänster och marknader</h3>
<ul style="margin:0;padding:0 0 0 18px;line-height:2">
<li><a href="/gjuteri-gnosjoregionen/" title="Gjuteri Gnosjöregionen">Gjuteri Gnosjöregionen — GGVV-klustret</a></li>
<li><a href="/gjuteri-smaland/" title="Gjuteri Småland">Gjuteri Småland — regional hub</a></li>
<li><a href="/gjuteri-sverige/" title="Gjuteri Sverige">Metallgjutning i Sverige — alla marknader</a></li>
<li><a href="/vara-tjanster/metallgjutning/" title="Metallgjutning">Metallgjutning — tjänsteöversikt</a></li>
<li><a href="/vara-tjanster/sandgjutning/" title="Sandgjutning">Sandgjutning för komplexa detaljer</a></li>
<li><a href="/vara-tjanster/pressgjutning/" title="Pressgjutning">Pressgjutning av aluminium</a></li>
</ul>
</div>
"""),

    (1849, "gjuteri-gnosjoregionen", """
<div class="sbs-related-pages" style="margin-top:40px;padding:28px 32px;background:#f8f8f8;border-left:4px solid #c0392b;border-radius:4px">
<h3 style="margin:0 0 14px;font-size:18px;color:#1a1a1a">Relaterade tjänster och marknader</h3>
<ul style="margin:0;padding:0 0 0 18px;line-height:2">
<li><a href="/gjuteri-jonkoping/" title="Gjuteri Jönköping">Gjuteri Jönköping — närmaste stad</a></li>
<li><a href="/gjuteri-smaland/" title="Gjuteri Småland">Gjuteri Småland — hela regionen</a></li>
<li><a href="/gjuteri-sverige/" title="Gjuteri Sverige">Metallgjutning i Sverige — alla marknader</a></li>
<li><a href="/vara-tjanster/metallgjutning/" title="Metallgjutning">Metallgjutning — tjänsteöversikt</a></li>
<li><a href="/vara-tjanster/sandgjutning/" title="Sandgjutning">Sandgjutning — flexibel metod för Gnosjöregionen</a></li>
<li><a href="/offert/" title="Begär offert">Begär offert på metallgjutning</a></li>
</ul>
</div>
"""),

    (1851, "gjuteri-goteborg", """
<div class="sbs-related-pages" style="margin-top:40px;padding:28px 32px;background:#f8f8f8;border-left:4px solid #c0392b;border-radius:4px">
<h3 style="margin:0 0 14px;font-size:18px;color:#1a1a1a">Relaterade tjänster och marknader</h3>
<ul style="margin:0;padding:0 0 0 18px;line-height:2">
<li><a href="/gjuteri-malmo/" title="Gjuteri Malmö">Gjuteri Malmö — Sydsverige</a></li>
<li><a href="/gjuteri-eskilstuna/" title="Gjuteri Eskilstuna">Gjuteri Eskilstuna — precisionstillverkning</a></li>
<li><a href="/gjuteri-sverige/" title="Gjuteri Sverige">Metallgjutning i Sverige — alla marknader</a></li>
<li><a href="/vara-tjanster/metallgjutning/" title="Metallgjutning">Metallgjutning — tjänsteöversikt</a></li>
<li><a href="/vara-tjanster/pressgjutning/" title="Pressgjutning">Pressgjutning av aluminium — Volvos leverantörer</a></li>
<li><a href="/industrier/fordonsindustrin/" title="Fordonsindustrin">Gjutgods för fordonsindustrin</a></li>
</ul>
</div>
"""),

    (1853, "gjuteri-eskilstuna", """
<div class="sbs-related-pages" style="margin-top:40px;padding:28px 32px;background:#f8f8f8;border-left:4px solid #c0392b;border-radius:4px">
<h3 style="margin:0 0 14px;font-size:18px;color:#1a1a1a">Relaterade tjänster och marknader</h3>
<ul style="margin:0;padding:0 0 0 18px;line-height:2">
<li><a href="/gjuteri-vasteras/" title="Gjuteri Västerås">Gjuteri Västerås — Mälardalen</a></li>
<li><a href="/gjuteri-stockholm/" title="Gjuteri Stockholm">Gjuteri Stockholm — Storstockholm</a></li>
<li><a href="/gjuteri-sverige/" title="Gjuteri Sverige">Metallgjutning i Sverige — alla marknader</a></li>
<li><a href="/vara-tjanster/metallgjutning/" title="Metallgjutning">Metallgjutning — tjänsteöversikt</a></li>
<li><a href="/vara-tjanster/precisionsgjutning-och-vaxgjutning/" title="Precisionsgjutning">Precisionsgjutning för snäva toleranser</a></li>
<li><a href="/offert/" title="Begär offert">Begär offert på metallgjutning i Eskilstuna</a></li>
</ul>
</div>
"""),

    (1855, "gjuteri-malmo", """
<div class="sbs-related-pages" style="margin-top:40px;padding:28px 32px;background:#f8f8f8;border-left:4px solid #c0392b;border-radius:4px">
<h3 style="margin:0 0 14px;font-size:18px;color:#1a1a1a">Relaterade tjänster och marknader</h3>
<ul style="margin:0;padding:0 0 0 18px;line-height:2">
<li><a href="/gjuteri-goteborg/" title="Gjuteri Göteborg">Gjuteri Göteborg — Västsverige</a></li>
<li><a href="/gjuteri-sverige/" title="Gjuteri Sverige">Metallgjutning i Sverige — alla marknader</a></li>
<li><a href="/vara-tjanster/metallgjutning/" title="Metallgjutning">Metallgjutning — tjänsteöversikt</a></li>
<li><a href="/vara-tjanster/sandgjutning/" title="Sandgjutning">Sandgjutning för Skånsk industri</a></li>
<li><a href="/vara-tjanster/precisionsgjutning-och-vaxgjutning/" title="Precisionsgjutning">Precisionsgjutning för Alfa Laval-sektorn</a></li>
<li><a href="/offert/" title="Begär offert">Begär offert på metallgjutning i Malmö</a></li>
</ul>
</div>
"""),

    (1857, "gjuteri-vasteras", """
<div class="sbs-related-pages" style="margin-top:40px;padding:28px 32px;background:#f8f8f8;border-left:4px solid #c0392b;border-radius:4px">
<h3 style="margin:0 0 14px;font-size:18px;color:#1a1a1a">Relaterade tjänster och marknader</h3>
<ul style="margin:0;padding:0 0 0 18px;line-height:2">
<li><a href="/gjuteri-eskilstuna/" title="Gjuteri Eskilstuna">Gjuteri Eskilstuna — "Sveriges Sheffield"</a></li>
<li><a href="/gjuteri-stockholm/" title="Gjuteri Stockholm">Gjuteri Stockholm — Storstockholm</a></li>
<li><a href="/gjuteri-sverige/" title="Gjuteri Sverige">Metallgjutning i Sverige — alla marknader</a></li>
<li><a href="/vara-tjanster/metallgjutning/" title="Metallgjutning">Metallgjutning — tjänsteöversikt</a></li>
<li><a href="/vara-tjanster/pressgjutning/" title="Pressgjutning">Pressgjutning för ABB och energisektorn</a></li>
<li><a href="/industrier/energisektorn/" title="Energisektorn">Gjutgods för energisektorn</a></li>
</ul>
</div>
"""),

    (1861, "gjuteri-stockholm", """
<div class="sbs-related-pages" style="margin-top:40px;padding:28px 32px;background:#f8f8f8;border-left:4px solid #c0392b;border-radius:4px">
<h3 style="margin:0 0 14px;font-size:18px;color:#1a1a1a">Relaterade tjänster och marknader</h3>
<ul style="margin:0;padding:0 0 0 18px;line-height:2">
<li><a href="/gjuteri-vasteras/" title="Gjuteri Västerås">Gjuteri Västerås — Mälardalen</a></li>
<li><a href="/gjuteri-eskilstuna/" title="Gjuteri Eskilstuna">Gjuteri Eskilstuna — precisionstillverkning</a></li>
<li><a href="/gjuteri-sverige/" title="Gjuteri Sverige">Metallgjutning i Sverige — alla marknader</a></li>
<li><a href="/vara-tjanster/metallgjutning/" title="Metallgjutning">Metallgjutning — tjänsteöversikt</a></li>
<li><a href="/vara-tjanster/precisionsgjutning-och-vaxgjutning/" title="Precisionsgjutning">Precisionsgjutning för Stockholms teknikföretag</a></li>
<li><a href="/offert/" title="Begär offert">Begär offert på metallgjutning i Stockholm</a></li>
</ul>
</div>
"""),

    (1867, "gjutgods-leverantor", """
<div class="sbs-related-pages" style="margin-top:40px;padding:28px 32px;background:#f8f8f8;border-left:4px solid #c0392b;border-radius:4px">
<h3 style="margin:0 0 14px;font-size:18px;color:#1a1a1a">Relaterade tjänster och marknader</h3>
<ul style="margin:0;padding:0 0 0 18px;line-height:2">
<li><a href="/gjuteri-sverige/" title="Gjuteri Sverige">Metallgjutning i Sverige — alla marknader</a></li>
<li><a href="/vara-tjanster/metallgjutning/" title="Metallgjutning">Metallgjutning — tjänsteöversikt</a></li>
<li><a href="/vara-tjanster/pressgjutning/" title="Pressgjutning">Pressgjutning av aluminium</a></li>
<li><a href="/vara-tjanster/sandgjutning/" title="Sandgjutning">Sandgjutning för stora detaljer</a></li>
<li><a href="/vara-tjanster/precisionsgjutning-och-vaxgjutning/" title="Precisionsgjutning">Precisionsgjutning och vaxgjutning</a></li>
<li><a href="/offert/" title="Begär offert">Begär offert — svar inom 24 timmar</a></li>
</ul>
</div>
"""),
]


def append_to_page(page_id, html_block):
    """Hämtar nuvarande content, appendar html_block, sparar."""
    # GET current content
    r = requests.get(f"{WP_URL}/pages/{page_id}?_fields=id,slug,content",
                     headers=H, timeout=15)
    if r.status_code != 200:
        return False, f"GET failed: {r.status_code}"

    current_raw = r.json()["content"]["raw"] or ""

    # Check if already has our block
    if "sbs-related-pages" in current_raw:
        return True, "SKIP (already has related-pages block)"

    # Append
    new_content = current_raw.strip() + "\n\n" + html_block.strip()

    resp = requests.post(f"{WP_URL}/pages/{page_id}", headers=H,
                         json={"content": new_content}, timeout=20)
    if resp.status_code in (200, 201):
        return True, f"OK {resp.status_code}"
    return False, f"ERR {resp.status_code}: {resp.text[:150]}"


ok = fail = 0
for pid, slug, block in INTERLINKS:
    success, msg = append_to_page(pid, block)
    flag = "OK" if success else "FAIL"
    print(f"  [{flag}] ID:{pid} /{slug}/ — {msg}")
    if success:
        ok += 1
    else:
        fail += 1
    time.sleep(0.3)

print(f"\n=== RESULT: {ok} OK / {fail} FAIL / {len(INTERLINKS)} total ===")
