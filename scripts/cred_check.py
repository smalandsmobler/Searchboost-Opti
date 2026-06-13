#!/usr/bin/env python3
"""
Credential sanity-checker för alla Searchboost-kunder.

Kör session-start eller innan rapportering av "creds saknas".
Testar varje kunds WP-credentials LIVE via REST och rapporterar
faktisk status: kan skriva / kan läsa / role / capabilities.

Resultat sparas i /tmp/sbs_cred_check_{date}.json så rapporten
kan läsas av Claude vid behov under sessionen.

Usage:
    python3 cred_check.py             # kör på alla aktiva kunder
    python3 cred_check.py ilmonte     # bara en kund
"""

import json
import sys
import base64
import subprocess
import urllib.request
import urllib.error
from datetime import datetime

ACTIVE_CUSTOMERS = [
    "searchboost",
    "ilmonte",
    "mobelrondellen",
    "tobler",
    "traficator",
    "jelmtech",
    "smalandskontorsmobler",
    "humanpower",
]

def ssm(name, dec=False):
    cmd = [
        "aws", "ssm", "get-parameter",
        "--name", name,
        "--region", "eu-north-1",
        "--profile", "mickedanne@gmail.com",
        "--query", "Parameter.Value",
        "--output", "text",
    ]
    if dec:
        cmd.append("--with-decryption")
    try:
        return subprocess.check_output(cmd, stderr=subprocess.DEVNULL).decode().strip()
    except subprocess.CalledProcessError:
        return None

def req(method, url, auth, timeout=15):
    r = urllib.request.Request(
        url, method=method,
        headers={
            "Authorization": f"Basic {auth}",
            "User-Agent": "Mozilla/5.0 (SBS-CredCheck)",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            return resp.status, json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or "{}")
        except Exception:
            return e.code, {}
    except Exception as e:
        return None, {"error": str(e)[:200]}

def check(cust):
    result = {
        "customer": cust,
        "url": None,
        "user": None,
        "password_present": False,
        "auth_ok": False,
        "role": None,
        "can_read": False,
        "can_edit_posts": False,
        "can_publish_posts": False,
        "can_manage_options": False,
        "can_edit_files": False,
        "code_snippets_installed": False,
        "rank_math_installed": False,
        "woocommerce_installed": False,
        "error": None,
    }

    url = ssm(f"/seo-mcp/wordpress/{cust}/url")
    user = ssm(f"/seo-mcp/wordpress/{cust}/username")
    app = ssm(f"/seo-mcp/wordpress/{cust}/app-password", dec=True)

    result["url"] = url
    result["user"] = user
    result["password_present"] = bool(app and app != "placeholder" and len(app) >= 10)

    if not (url and user and result["password_present"]):
        result["error"] = "SSM creds missing/placeholder"
        return result

    auth = base64.b64encode(f"{user}:{app}".encode()).decode()
    base = url.rstrip("/")

    # 1. whoami via wp/v2/users/me?context=edit
    code, me = req("GET", f"{base}/wp-json/wp/v2/users/me?context=edit", auth)
    if code != 200:
        result["error"] = f"auth failed [{code}] {me.get('message', me.get('code', ''))}"
        return result

    result["auth_ok"] = True
    result["can_read"] = True
    roles = me.get("roles") or []
    result["role"] = roles[0] if roles else None
    caps = me.get("capabilities") or {}
    result["can_edit_posts"] = bool(caps.get("edit_posts"))
    result["can_publish_posts"] = bool(caps.get("publish_posts"))
    result["can_manage_options"] = bool(caps.get("manage_options"))
    result["can_edit_files"] = bool(caps.get("edit_files"))

    # 2. Plugin check
    code, ns_root = req("GET", f"{base}/wp-json/", auth)
    if code == 200:
        namespaces = ns_root.get("namespaces") or []
        result["code_snippets_installed"] = "code-snippets/v1" in namespaces
        result["rank_math_installed"] = "rankmath/v1" in namespaces
        result["woocommerce_installed"] = any(n.startswith("wc/") for n in namespaces)

    return result

def main():
    targets = sys.argv[1:] if len(sys.argv) > 1 else ACTIVE_CUSTOMERS
    results = []
    for c in targets:
        print(f"\n=== {c} ===")
        r = check(c)
        results.append(r)
        if r["error"]:
            print(f"  ✗ {r['error']}")
        else:
            flags = []
            if r["can_edit_posts"]:
                flags.append("edit")
            if r["can_publish_posts"]:
                flags.append("publish")
            if r["can_manage_options"]:
                flags.append("manage")
            plugins = []
            if r["code_snippets_installed"]:
                plugins.append("code-snippets")
            if r["rank_math_installed"]:
                plugins.append("rank-math")
            if r["woocommerce_installed"]:
                plugins.append("woocommerce")
            print(f"  ✓ user={r['user']} role={r['role']} caps={','.join(flags)} plugins={','.join(plugins)}")

    outfile = f"/tmp/sbs_cred_check_{datetime.now().strftime('%Y%m%d')}.json"
    with open(outfile, "w") as f:
        json.dump({"checked_at": datetime.now().isoformat(), "results": results}, f, indent=2, ensure_ascii=False)
    print(f"\n→ resultat sparat: {outfile}")

if __name__ == "__main__":
    main()
