#!/usr/bin/env python3
"""
Searchboost SEO Agent — stirrup + OpenRouter (gratis modeller)

Användning:
  python3 seo_agent.py mobelrondellen "Fixa saknade meta-descriptions"
  python3 seo_agent.py jelmtech "Analysera SEO på alla sidor"
  python3 seo_agent.py --all "Veckorapport SEO-status"
"""

import asyncio
import sys
import os
import json
import base64
import urllib.request
from datetime import datetime
from pathlib import Path

from stirrup import Agent
from stirrup.clients.chat_completions_client import ChatCompletionsClient

# ── Konfiguration ────────────────────────────────────────────────────────────

OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY", "")
SB_API = os.getenv("SEARCHBOOST_API_URL", "https://51.21.116.7")
SB_KEY = os.getenv("SEARCHBOOST_API_KEY", "")

PRIMARY_MODEL   = "nvidia/nemotron-3-super-120b-a12b:free"
FALLBACK_MODEL  = "meta-llama/llama-3.3-70b-instruct:free"

SYSTEM_PROMPT = """Du är en expert-SEO-agent för Searchboost. Du optimerar WordPress-sajter autonomt med gratis AI-modeller via OpenRouter.

PLANERING FÖRE HANDLING:
Innan du agerar — tänk igenom:
- Vilken kund/site gäller uppgiften?
- Vilka sidor saknar title/description? (prioritera dessa)
- Vilka bilder saknar alt-text?
- Hur många optimeringar ryms inom budgeten (max 15)?
Agera INTE förrän du har svaren på ovanstående.

ARBETSFLÖDE:
1. get_credentials(site) — hämta WP URL + inloggning
2. wp_list_pages(wp_url, username, app_password) — lista alla sidor
3. wp_get_seo(wp_url, username, app_password, page_url) — analysera per sida
4. Identifiera luckor: saknad title, description, focus-keyword, alt-text
5. Generera optimerat innehåll baserat på sidans faktiska text
6. wp_update_seo(...) — skriv tillbaka
7. wp_images_no_alt(...) — hitta bilder utan alt
8. wp_update_alt(...) — sätt alt-text

SEO-CHECKLISTA (kör automatiskt på varje sida):
- Title: max 60 tecken, primärt nyckelord + varumärke
- Description: max 160 tecken, nyckelord naturligt + tydlig CTA
- Focus keyword: ett tydligt målord (singular)
- Alt-text: beskrivande, innehåller relevanta nyckelord
- Robots: index,follow

REGLER:
- Skriv ALLTID på svenska med korrekt ÅÄÖ
- Prioritera sidor utan title/description — snabbast resultat
- Max 15 optimeringar per körning
- Logga varje ändring: "Uppdaterade [sidtitel]: title + description satta"
- Verifiera att ok=True i svaret
"""

# ── HTTP-hjälpare (utan requests-bibliotek) ──────────────────────────────────

def _fetch(url: str, headers: dict, method: str = "GET", body: dict | None = None) -> dict:
    import ssl
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
        return json.loads(r.read())


def _wp_auth(username: str, password: str) -> str:
    return base64.b64encode(f"{username}:{password}".encode()).decode()


# ── Verktyg (tools) som stirrup-agenten kan använda ─────────────────────────

def get_credentials(site: str) -> dict:
    """Hämta WordPress-credentials för en Searchboost-kund."""
    try:
        return _fetch(
            f"{SB_API}/api/site/{site}/wp-credentials",
            {"X-Api-Key": SB_KEY},
        )
    except Exception as e:
        return {"error": str(e)}


def wp_list_pages(wp_url: str, username: str, app_password: str, per_page: int = 50) -> dict:
    """Hämta alla publicerade sidor från WordPress."""
    auth = _wp_auth(username, app_password)
    try:
        pages = _fetch(
            f"{wp_url}/wp-json/wp/v2/pages?per_page={per_page}&status=publish&_fields=id,title,link,slug",
            {"Authorization": f"Basic {auth}", "Accept": "application/json"},
        )
        if not isinstance(pages, list):
            return {"error": "Oväntat svar", "raw": str(pages)[:300]}
        return {
            "count": len(pages),
            "pages": [{"id": p["id"], "title": p["title"]["rendered"], "url": p["link"], "slug": p["slug"]} for p in pages],
        }
    except Exception as e:
        return {"error": str(e)}


def wp_get_seo(wp_url: str, username: str, app_password: str, page_url: str) -> dict:
    """Hämta Rank Math SEO-metadata för en sida."""
    auth = _wp_auth(username, app_password)
    try:
        return _fetch(
            f"{wp_url}/wp-json/rankmath/v1/getHead?url={urllib.parse.quote(page_url)}",
            {"Authorization": f"Basic {auth}", "Accept": "application/json"},
        )
    except Exception as e:
        return {"error": str(e)}


def wp_update_seo(
    wp_url: str,
    username: str,
    app_password: str,
    post_id: int,
    rank_math_title: str = "",
    rank_math_description: str = "",
    rank_math_focus_keyword: str = "",
    rank_math_robots: str = "index,follow",
) -> dict:
    """Uppdatera Rank Math SEO-metadata för en sida."""
    auth = _wp_auth(username, app_password)
    meta = {}
    if rank_math_title:
        meta["rank_math_title"] = rank_math_title
    if rank_math_description:
        meta["rank_math_description"] = rank_math_description
    if rank_math_focus_keyword:
        meta["rank_math_focus_keyword"] = rank_math_focus_keyword
    if rank_math_robots:
        meta["rank_math_robots"] = rank_math_robots

    try:
        result = _fetch(
            f"{wp_url}/wp-json/rankmath/v1/updateMeta",
            {"Authorization": f"Basic {auth}", "Content-Type": "application/json"},
            method="POST",
            body={"objectID": post_id, "objectType": "post", **meta},
        )
        return {"method": "rankmath", "result": result}
    except Exception:
        # Fallback via wp/v2/pages
        try:
            result = _fetch(
                f"{wp_url}/wp-json/wp/v2/pages/{post_id}",
                {"Authorization": f"Basic {auth}", "Content-Type": "application/json"},
                method="POST",
                body={"meta": meta},
            )
            return {"method": "wp_meta_fallback", "result": result}
        except Exception as e2:
            return {"error": str(e2)}


def wp_images_no_alt(wp_url: str, username: str, app_password: str, per_page: int = 50) -> dict:
    """Hämta bilder utan alt-text."""
    auth = _wp_auth(username, app_password)
    try:
        imgs = _fetch(
            f"{wp_url}/wp-json/wp/v2/media?per_page={per_page}&media_type=image&_fields=id,title,alt_text,source_url",
            {"Authorization": f"Basic {auth}", "Accept": "application/json"},
        )
        if not isinstance(imgs, list):
            return {"error": "Oväntat svar"}
        missing = [i for i in imgs if not (i.get("alt_text") or "").strip()]
        return {
            "total": len(imgs),
            "missing_alt": len(missing),
            "images": [{"id": i["id"], "url": i["source_url"], "title": i["title"]["rendered"]} for i in missing],
        }
    except Exception as e:
        return {"error": str(e)}


def wp_update_alt(wp_url: str, username: str, app_password: str, media_id: int, alt_text: str) -> dict:
    """Uppdatera alt-text på en bild."""
    auth = _wp_auth(username, app_password)
    try:
        _fetch(
            f"{wp_url}/wp-json/wp/v2/media/{media_id}",
            {"Authorization": f"Basic {auth}", "Content-Type": "application/json"},
            method="POST",
            body={"alt_text": alt_text},
        )
        return {"id": media_id, "ok": True}
    except Exception as e:
        return {"id": media_id, "ok": False, "error": str(e)}


# ── Importera urllib.parse (används i wp_get_seo) ────────────────────────────
import urllib.parse

# ── Bygg agent ───────────────────────────────────────────────────────────────

def build_agent(model: str = PRIMARY_MODEL) -> Agent:
    client = ChatCompletionsClient(
        model=model,
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_KEY,
        max_tokens=4096,
        max_retries=2,
    )
    return Agent(
        client=client,
        name="searchboost-seo-agent",
        max_turns=40,
        system_prompt=SYSTEM_PROMPT,
        tools=[
            get_credentials,
            wp_list_pages,
            wp_get_seo,
            wp_update_seo,
            wp_images_no_alt,
            wp_update_alt,
        ],
    )


# ── Kör ─────────────────────────────────────────────────────────────────────

async def main():
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help"):
        print(__doc__)
        return

    # Bygg prompt
    if args[0] == "--all":
        site_info = "Kör på ALLA Searchboost-kunder: smalandskontorsmobler, jelmtech, ilmonte, humanpower, traficator, nordicsnusonline, tobler, mobelrondellen."
        task = " ".join(args[1:]) if len(args) > 1 else "Gör en SEO-statusrapport."
    else:
        site_info = f"Kund/site-slug: {args[0]}"
        task = " ".join(args[1:]) if len(args) > 1 else "Analysera och fixa SEO-problem."

    prompt = f"{site_info}\n\nUppgift: {task}"

    # Output-katalog
    out_dir = Path("output") / datetime.now().strftime("%Y-%m-%d_%H-%M")
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"[seo-agent] Modell: {PRIMARY_MODEL}")
    print(f"[seo-agent] Output: {out_dir}")
    print(f"[seo-agent] Prompt: {prompt[:100]}...")
    print()

    agent = build_agent()

    try:
        async with agent.session(output_dir=str(out_dir)) as session:
            await session.run(prompt)
    except Exception as e:
        if "429" in str(e) or "rate" in str(e).lower():
            print(f"\n[seo-agent] Rate limit, byter till {FALLBACK_MODEL}...")
            agent = build_agent(FALLBACK_MODEL)
            async with agent.session(output_dir=str(out_dir)) as session:
                await session.run(prompt)
        else:
            raise

    print(f"\n[seo-agent] Klar. Output sparad i {out_dir}/")


if __name__ == "__main__":
    asyncio.run(main())
