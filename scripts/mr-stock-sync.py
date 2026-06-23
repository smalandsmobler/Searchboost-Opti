#!/usr/bin/env python3
"""
Möbelrondellen — Leverantörs-stocksync
=======================================
Läser daglig Excel-fil från leverantören och uppdaterar WooCommerce
med lagersaldo + ETA-datum.

Kör: python3 mr-stock-sync.py --file stock-2026-04-05.xlsx
     python3 mr-stock-sync.py --file stock-2026-04-05.xlsx --dry-run

Mappning: SKU i WooCommerce = ItemNum i leverantörsfilen (t.ex. "1001-408")
EAN:      Lagras som meta-fält _supplier_ean i WooCommerce
"""

import argparse
import json
import openpyxl
import sys
import urllib.request
import urllib.error
import base64
import time
from datetime import datetime

# === KONFIGURATION ===
WC_URL = "https://www.mobelrondellen.se"
WC_USER = "Mickedanne"
# Hämtas från SSM i produktion — sätt manuellt vid lokal körning
WC_APP_PASSWORD = ""  # Fyll i vid körning

BATCH_SIZE = 20       # Max produkter per API-request
SLEEP_BETWEEN = 0.3   # Sekunder mellan requests

def load_stock_file(filepath: str) -> dict:
    """Laddar Excel-filen och returnerar {item_num: row_data}."""
    wb = openpyxl.load_workbook(filepath)
    ws = wb.active
    stock = {}
    for row in ws.iter_rows(values_only=True):
        if row[0] == 'ItemNum' or not row[0]:
            continue
        item_num = str(row[0]).strip()
        stock[item_num] = {
            'item_num':   item_num,
            'name':       row[1] or '',
            'qty':        int(row[2]) if row[2] else 0,
            'eta_week':   int(row[3]) if row[3] and row[3] != 0 else None,
            'eta_date':   str(row[4])[:10] if row[4] else None,
            'next_recv':  int(row[5]) if row[5] else 0,
            'category':   row[6] or '',
            'ean':        str(row[7]) if row[7] else None,
        }
    return stock

def get_wc_products(auth_header: str) -> list:
    """Hämtar alla WooCommerce-produkter med SKU satt."""
    products = []
    page = 1
    while True:
        url = f"{WC_URL}/wp-json/wc/v3/products?per_page=100&page={page}&status=publish"
        req = urllib.request.Request(url, headers={"Authorization": auth_header})
        with urllib.request.urlopen(req) as r:
            batch = json.loads(r.read())
        if not batch:
            break
        products.extend(batch)
        total_pages = int(r.headers.get('X-WP-TotalPages', 1))
        if page >= total_pages:
            break
        page += 1
    return products

def update_product_stock(product_id: int, qty: int, status: str,
                         eta_date: str, next_recv: int,
                         auth_header: str, dry_run=False) -> bool:
    """Uppdaterar en WooCommerce-produkt med lagerdata."""
    payload = {
        "manage_stock": True,
        "stock_quantity": qty,
        "stock_status": status,  # "instock" eller "outofstock"
        "meta_data": [
            {"key": "_supplier_eta_date",   "value": eta_date or ""},
            {"key": "_supplier_eta_week",   "value": str(next_recv) if next_recv else ""},
            {"key": "_supplier_last_sync",  "value": datetime.now().strftime("%Y-%m-%d")},
        ]
    }
    if dry_run:
        return True
    
    data = json.dumps(payload).encode()
    url = f"{WC_URL}/wp-json/wc/v3/products/{product_id}"
    req = urllib.request.Request(url, data=data,
                                  headers={"Authorization": auth_header,
                                           "Content-Type": "application/json"},
                                  method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status in (200, 201)
    except urllib.error.HTTPError as e:
        print(f"  FEL {e.code}: {e.read().decode()[:100]}")
        return False

def match_by_ean(stock_data: dict, ean: str):
    """Söker efter produkt i leverantörsfil via EAN."""
    for item in stock_data.values():
        if item['ean'] == ean:
            return item
    return None

def main():
    parser = argparse.ArgumentParser(description='Möbelrondellen stock sync')
    parser.add_argument('--file', required=True, help='Sökväg till Excel-filen')
    parser.add_argument('--dry-run', action='store_true', help='Kör utan att skriva till WC')
    parser.add_argument('--password', help='WooCommerce app-lösenord (override)')
    args = parser.parse_args()

    password = args.password or WC_APP_PASSWORD
    if not password:
        # Försök hämta från SSM
        try:
            import subprocess
            result = subprocess.run(
                ['aws', 'ssm', 'get-parameter',
                 '--name', '/seo-mcp/wordpress/mobelrondellen/app-password',
                 '--with-decryption', '--region', 'eu-north-1',
                 '--profile', 'mickedanne@gmail.com',
                 '--query', 'Parameter.Value', '--output', 'text'],
                capture_output=True, text=True
            )
            password = result.stdout.strip()
        except Exception:
            print("FEL: Inget WC-lösenord. Använd --password eller konfigurera SSM.")
            sys.exit(1)

    auth = "Basic " + base64.b64encode(f"{WC_USER}:{password}".encode()).decode()
    mode = "[DRY-RUN] " if args.dry_run else ""

    print(f"{mode}Möbelrondellen Stock Sync — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"Fil: {args.file}")
    print()

    # Ladda leverantörsfil
    print("Laddar leverantörsfil...")
    stock_data = load_stock_file(args.file)
    in_stock = sum(1 for s in stock_data.values() if s['qty'] > 0)
    print(f"  {len(stock_data):,} artiklar | {in_stock:,} i lager | {len(stock_data)-in_stock:,} slutsålda")

    # Hämta WC-produkter
    print("\nHämtar WooCommerce-produkter...")
    wc_products = get_wc_products(auth)
    print(f"  {len(wc_products)} produkter hittade")

    # Matcha och uppdatera
    updated = 0
    skipped = 0
    not_found = []

    print(f"\n{'='*60}")
    print(f"{'Produkt':<45} {'Qty':>5} {'Status':<12} {'ETA'}")
    print(f"{'='*60}")

    for p in wc_products:
        sku = (p.get('sku') or '').strip()
        name = p['name'][:45]

        # Sök match: SKU = ItemNum (primär) eller via EAN (sekundär)
        supplier_item = stock_data.get(sku)
        
        if not supplier_item:
            # Försök EAN-matchning via meta_data
            ean_meta = next((m['value'] for m in p.get('meta_data', [])
                             if m['key'] == '_supplier_ean'), None)
            if ean_meta:
                supplier_item = match_by_ean(stock_data, str(ean_meta))

        if not supplier_item:
            skipped += 1
            not_found.append(f"  [{sku or 'INGET SKU'}] {name}")
            continue

        qty = max(0, supplier_item['qty'])
        status = "instock" if qty > 0 else "outofstock"
        eta = supplier_item['eta_date']
        next_recv = supplier_item['next_recv']
        
        eta_display = f"v.{supplier_item['eta_week']} ({eta})" if eta else ""
        
        print(f"  {name:<43} {qty:>5} {status:<12} {eta_display}")
        
        ok = update_product_stock(
            p['id'], qty, status, eta, next_recv, auth, args.dry_run
        )
        if ok:
            updated += 1
        time.sleep(SLEEP_BETWEEN)

    print(f"\n{'='*60}")
    print(f"Klart: {updated} uppdaterade | {skipped} utan matchning")

    if not_found:
        print(f"\nSaknar leverantörsmatchning ({len(not_found)} st):")
        for line in not_found[:20]:
            print(line)
        if len(not_found) > 20:
            print(f"  ... och {len(not_found)-20} till")
        print("\n→ SKU i WooCommerce måste matcha ItemNum i leverantörsfilen")
        print("  Använd mr-stock-mapping.csv för att koppla ihop dem")

if __name__ == '__main__':
    main()
