#!/usr/bin/env python3
"""
Searchboost Prospect Scanner
Analyserar en webbplats SEO-hälsa och beräknar ett säljpoäng.

Usage:
    python3 prospect-scanner.py reklamateljen.se
    python3 prospect-scanner.py --bulk domains.txt
    python3 prospect-scanner.py reklamateljen.se --email
    python3 prospect-scanner.py --bulk domains.txt --email
"""

import sys
import time
import json
import csv
import argparse
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime
from html.parser import HTMLParser


# ── HTML Parser ───────────────────────────────────────────────

class PageParser(HTMLParser):
    """Enkel HTML-parser som extraherar nyckeldata utan externa beroenden."""

    def __init__(self):
        super().__init__()
        self.title = None
        self.meta_description = None
        self.meta_robots = None
        self.og_title = None
        self.og_description = None
        self.h1_count = 0
        self.has_json_ld = False
        self._in_title = False
        self._in_script = False
        self._script_type = None
        self._script_content = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)

        if tag == 'title':
            self._in_title = True

        elif tag == 'meta':
            name = (attrs_dict.get('name') or '').lower()
            prop = (attrs_dict.get('property') or '').lower()
            content = attrs_dict.get('content', '')

            if name == 'description':
                self.meta_description = content
            elif name == 'robots':
                self.meta_robots = content.lower()
            elif prop == 'og:title':
                self.og_title = content
            elif prop == 'og:description':
                self.og_description = content

        elif tag == 'h1':
            self.h1_count += 1

        elif tag == 'script':
            script_type = (attrs_dict.get('type') or '').lower()
            if 'application/ld+json' in script_type:
                self._in_script = True
                self._script_type = 'json-ld'
                self._script_content = []

    def handle_endtag(self, tag):
        if tag == 'title':
            self._in_title = False
        elif tag == 'script' and self._in_script:
            content = ''.join(self._script_content).strip()
            if content:
                self.has_json_ld = True
            self._in_script = False
            self._script_type = None
            self._script_content = []

    def handle_data(self, data):
        if self._in_title and self.title is None:
            self.title = data.strip()
        elif self._in_script:
            self._script_content.append(data)


# ── Fetch helpers ─────────────────────────────────────────────

def fetch_url(url, timeout=10):
    """Hämtar en URL och returnerar (final_url, status_code, headers, body)."""
    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': (
                'Mozilla/5.0 (compatible; SearchboostScanner/1.0; '
                '+https://searchboost.se/scanner)'
            )
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read(200000).decode('utf-8', errors='replace')
            return resp.geturl(), resp.status, dict(resp.headers), body
    except urllib.error.HTTPError as e:
        return url, e.code, {}, ''
    except Exception as e:
        return url, 0, {}, ''


def head_url(url, timeout=8):
    """Enkel HEAD-request, returnerar HTTP-statuskod."""
    req = urllib.request.Request(
        url,
        method='HEAD',
        headers={'User-Agent': 'Mozilla/5.0 (compatible; SearchboostScanner/1.0)'}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0


def fetch_pagespeed(url, timeout=20):
    """
    Anropar Google PageSpeed Insights API (gratis, ingen nyckel).
    Returnerar dict med score, lcp, tbt, cls eller None vid fel.
    """
    api_url = (
        'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
        '?url={}&strategy=mobile'.format(urllib.parse.quote(url, safe=''))
    )
    req = urllib.request.Request(
        api_url,
        headers={'User-Agent': 'SearchboostScanner/1.0'}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read())

        cats = data.get('lighthouseResult', {}).get('categories', {})
        score = cats.get('performance', {}).get('score')
        if score is not None:
            score = round(score * 100)

        audits = data.get('lighthouseResult', {}).get('audits', {})

        def metric(key):
            v = audits.get(key, {}).get('displayValue', '')
            return v.split('\xa0')[0].split(' ')[0] if v else None

        return {
            'score': score,
            'lcp': metric('largest-contentful-paint'),
            'tbt': metric('total-blocking-time'),
            'cls': metric('cumulative-layout-shift'),
        }
    except Exception:
        return None


# ── Platform detection ────────────────────────────────────────

def detect_platform(final_url, headers, body):
    """Identifierar webbplattform baserat på body-innehåll och headers."""
    body_lower = body.lower()
    headers_lower = {k.lower(): v.lower() for k, v in headers.items()}

    # Döda/standard-sidor
    if 'defaultwebpage.cgi' in body_lower or (len(body.strip()) < 200 and not body.strip()):
        return 'dead', 'Standard cPanel-sida eller tom — inget CMS installerat'

    if 'wixstatic.com' in body_lower or any('x-wix-' in k for k in headers_lower):
        return 'wix', 'Wix (begränsad optimeringsmöjlighet)'

    if 'squarespace.com' in body_lower:
        return 'squarespace', 'Squarespace (begränsad optimeringsmöjlighet)'

    if 'weebly.com' in body_lower:
        return 'weebly', 'Weebly (begränsad optimeringsmöjlighet)'

    if 'myshopify.com' in body_lower or 'shopify' in headers_lower.get('x-shopid', ''):
        return 'shopify', 'Shopify (optimerbar via metafält)'

    if 'wp-content' in body_lower or 'wp-json' in body_lower:
        return 'wordpress', 'WordPress (stark kandidat — full optimering möjlig)'

    return 'custom', 'Custom/okänt CMS'


# ── Main scan function ────────────────────────────────────────

def scan_domain(domain):
    """
    Skannar en domän och returnerar ett resultatobjekt.
    Försöker https:// först, faller tillbaka till http://.
    """
    domain = domain.strip().lower()
    # Normalisera
    domain = domain.replace('https://', '').replace('http://', '').rstrip('/')

    # Försök https → http
    https_url = 'https://' + domain
    http_url = 'http://' + domain

    final_url, status, headers, body = fetch_url(https_url)
    https_active = (status in range(200, 400))

    if not https_active or not body:
        final_url2, status2, headers2, body2 = fetch_url(http_url)
        if body2:
            final_url, status, headers, body = final_url2, status2, headers2, body2
            https_active = False

    # Om ingen sida svarar
    if status == 0 or not body:
        return {
            'domain': domain,
            'scan_date': datetime.now().strftime('%Y-%m-%d %H:%M'),
            'reachable': False,
            'error': 'Kunde inte nå domänen (timeout eller DNS-fel)',
            'score': 0,
            'platform': 'unknown',
            'platform_label': 'Okänd',
            'issues': [],
            'warnings': [],
            'good': [],
            'pitch': '',
            'pagespeed': None,
        }

    # Parse HTML
    parser = PageParser()
    parser.feed(body)

    platform_key, platform_label = detect_platform(final_url, headers, body)

    # ── SEO-checks ────────────────────────────────
    issues = []   # Kritiska
    warnings = []
    good = []

    # 1. Title
    title = parser.title
    if not title:
        issues.append('Ingen title-tagg — sidan visas utan rubrik i Google')
    elif len(title) < 30:
        warnings.append('Title för kort ({} tecken) — bör vara 30–60 tecken'.format(len(title)))
    elif len(title) > 60:
        warnings.append('Title för lång ({} tecken) — trunkeras i sökresultaten'.format(len(title)))
    else:
        good.append('Title: "{}" ({} tecken)'.format(title[:60], len(title)))

    # 2. Meta description
    desc = parser.meta_description
    if desc is None:
        issues.append('Ingen meta description — Google skriver sin egen, du tappar klick')
    elif len(desc) < 120:
        warnings.append('Meta description för kort ({} tecken) — bör vara 120–155 tecken'.format(len(desc)))
    elif len(desc) > 155:
        warnings.append('Meta description för lång ({} tecken) — trunkeras i sökresultaten'.format(len(desc)))
    else:
        good.append('Meta description: {} tecken'.format(len(desc)))

    # 3. H1
    if parser.h1_count == 0:
        issues.append('H1-tagg saknas — Google förstår inte vad sidan handlar om')
    elif parser.h1_count > 1:
        warnings.append('Flera H1-taggar ({} st) — bara en H1 per sida rekommenderas'.format(parser.h1_count))
    else:
        good.append('H1-tagg: exakt 1 st')

    # 4. HTTPS
    if https_active:
        good.append('HTTPS aktivt')
    else:
        issues.append('Ingen HTTPS — sidan är osäker och Google straffar det')

    # 5. Meta robots noindex
    if parser.meta_robots and 'noindex' in parser.meta_robots:
        issues.append('noindex-tagg hittad — sidan är DOLD för Google!')

    # 6. Structured data
    if not parser.has_json_ld:
        issues.append('Ingen structured data — du syns inte i rich results')
    else:
        good.append('Structured data (JSON-LD) hittad')

    # 7. Open Graph
    og_ok = parser.og_title and parser.og_description
    if not og_ok:
        warnings.append('Open Graph saknas — delningar på sociala medier ser dåliga ut')
    else:
        good.append('Open Graph: og:title och og:description hittade')

    # 8. Sitemap
    sitemap_url = 'https://' + domain + '/sitemap.xml'
    sitemap_status = head_url(sitemap_url, timeout=6)
    if sitemap_status in range(200, 300):
        good.append('Sitemap hittad på /sitemap.xml')
    else:
        warnings.append('Ingen sitemap — Google kanske missar sidor')

    # 9. PageSpeed
    pagespeed = fetch_pagespeed(final_url)
    ps_score = pagespeed['score'] if pagespeed else None

    if ps_score is not None:
        if ps_score < 50:
            issues.append('Sidhastighet (mobil): {}/100 — mycket långsam, Google straffar hårt'.format(ps_score))
        elif ps_score < 70:
            warnings.append('Sidhastighet (mobil): {}/100 — långsam, Google straffar'.format(ps_score))
        else:
            good.append('Sidhastighet (mobil): {}/100'.format(ps_score))
    else:
        warnings.append('Sidhastighet: kunde inte hämtas')

    # ── Score ──────────────────────────────────────
    score = 0
    score += len(issues) * 2
    score += len(warnings) * 1
    if platform_key in ('wix', 'squarespace', 'weebly', 'dead'):
        score += 3

    score = min(score, 10)

    if score >= 6:
        score_label = 'Stark kandidat'
    elif score >= 4:
        score_label = 'Möjlig kandidat'
    else:
        score_label = 'Lägre prio'

    # ── Pitch-text ─────────────────────────────────
    issue_count = len(issues)
    pitch = (
        'Vi körde en automatisk analys av {}. '
        'Vi hittade {} kritiska SEO-problem som kostar er synlighet varje dag. '
        'Kan vi visa er resultaten på 15 minuter?'
    ).format(domain, issue_count) if issue_count > 0 else (
        'Vi körde en automatisk analys av {}. '
        'Er sajt har bra grund men vi ser tydliga möjligheter att förbättra er synlighet i Google. '
        'Kan vi visa resultaten på 15 minuter?'
    ).format(domain)

    return {
        'domain': domain,
        'scan_date': datetime.now().strftime('%Y-%m-%d %H:%M'),
        'reachable': True,
        'platform': platform_key,
        'platform_label': platform_label,
        'https': https_active,
        'score': score,
        'score_label': score_label,
        'issues': issues,
        'warnings': warnings,
        'good': good,
        'pitch': pitch,
        'pagespeed': pagespeed,
        'title': title,
        'meta_description': desc,
    }


# ── BigQuery save ─────────────────────────────────────────────

def save_to_bigquery(result):
    """Sparar scanresultat till BigQuery-tabellen prospect_scans."""
    try:
        # Importeras här för att undvika krasch om google-cloud inte är installerat
        from google.cloud import bigquery as bq
        import subprocess, json as _json

        # Hämta credentials via aws ssm
        cred_cmd = [
            'aws', 'ssm', 'get-parameter',
            '--name', '/seo-mcp/bigquery/credentials',
            '--with-decryption',
            '--region', 'eu-north-1',
            '--profile', 'mickedanne@gmail.com',
            '--query', 'Parameter.Value',
            '--output', 'text'
        ]
        cred_json = subprocess.check_output(cred_cmd, stderr=subprocess.DEVNULL).decode().strip()
        import tempfile, os
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write(cred_json)
            tmp_path = f.name

        client = bq.Client.from_service_account_json(tmp_path, project='searchboost-485810')
        os.unlink(tmp_path)

        table_id = 'searchboost-485810.seo_data.prospect_scans'

        # Skapa tabell om den inte finns
        schema = [
            bq.SchemaField('domain', 'STRING'),
            bq.SchemaField('scan_date', 'TIMESTAMP'),
            bq.SchemaField('platform', 'STRING'),
            bq.SchemaField('score', 'INTEGER'),
            bq.SchemaField('issues_json', 'STRING'),
            bq.SchemaField('pitch_text', 'STRING'),
        ]
        try:
            client.get_table(table_id)
        except Exception:
            table = bq.Table(table_id, schema=schema)
            table.time_partitioning = bq.TimePartitioning(field='scan_date')
            client.create_table(table)

        row = {
            'domain': result['domain'],
            'scan_date': datetime.utcnow().isoformat() + 'Z',
            'platform': result.get('platform', 'unknown'),
            'score': result.get('score', 0),
            'issues_json': json.dumps(result.get('issues', []), ensure_ascii=False),
            'pitch_text': result.get('pitch', ''),
        }
        errors = client.insert_rows_json(table_id, [row])
        if errors:
            print('  [BQ-varning] Fel vid insert:', errors, file=sys.stderr)
    except ImportError:
        pass  # google-cloud inte installerat — hoppa över BQ
    except Exception as e:
        print('  [BQ-varning] Kunde inte spara till BigQuery:', e, file=sys.stderr)


# ── SES email ─────────────────────────────────────────────────

def send_email_ses(subject, body_text, to='mikael@searchboost.se'):
    """Skickar e-post via AWS SES."""
    try:
        import boto3
        ses = boto3.client(
            'ses',
            region_name='eu-north-1',
            profile_name='mickedanne@gmail.com'
        )
        # boto3 stöder inte profile_name direkt i client() — använd Session
        import boto3
        session = boto3.Session(profile_name='mickedanne@gmail.com', region_name='eu-north-1')
        ses = session.client('ses')

        ses.send_email(
            Source='noreply@searchboost.se',
            Destination={'ToAddresses': [to]},
            Message={
                'Subject': {'Data': subject, 'Charset': 'UTF-8'},
                'Body': {'Text': {'Data': body_text, 'Charset': 'UTF-8'}},
            }
        )
        print('E-post skickad till', to)
    except Exception as e:
        print('[SES-fel] Kunde inte skicka mail:', e, file=sys.stderr)


# ── Formatting ────────────────────────────────────────────────

def format_result(result):
    """Formaterar ett scanresultat till en läsbar textrapport."""
    domain = result['domain']
    now_parts = result['scan_date'].split(' ')
    datum = now_parts[0]
    tid = now_parts[1] if len(now_parts) > 1 else ''

    lines = []
    SEP = '=' * 53
    lines.append(SEP)
    lines.append('SEARCHBOOST PROSPECT SCAN — {}'.format(domain))
    lines.append('Datum: {}  Tid: {}'.format(datum, tid))
    lines.append(SEP)
    lines.append('')

    if not result.get('reachable', True):
        lines.append('FEL: {}'.format(result.get('error', 'Okänt fel')))
        lines.append('')
        lines.append(SEP)
        return '\n'.join(lines)

    platform_label = result.get('platform_label', result.get('platform', ''))
    https_str = 'Aktivt' if result.get('https') else 'Saknas'
    https_sym = 'v' if result.get('https') else 'X'

    lines.append('PLATTFORM:    {}'.format(platform_label))
    lines.append('HTTPS:        {} {}'.format(https_sym, https_str))
    lines.append('')

    issues = result.get('issues', [])
    warnings = result.get('warnings', [])
    good = result.get('good', [])

    if issues:
        lines.append('KRITISKA PROBLEM ({}):'.format(len(issues)))
        for issue in issues:
            lines.append('  X {}'.format(issue))
        lines.append('')

    if warnings:
        lines.append('VARNINGAR ({}):'.format(len(warnings)))
        for w in warnings:
            lines.append('  ! {}'.format(w))
        lines.append('')

    if good:
        lines.append('BRA:')
        for g in good:
            lines.append('  v {}'.format(g))
        lines.append('')

    score = result.get('score', 0)
    score_label = result.get('score_label', '')
    lines.append('PITCH-POANG: {}/10 — {}'.format(score, score_label))
    lines.append('')
    lines.append('SNABB PITCH:')
    lines.append('  {}'.format(result.get('pitch', '')))
    lines.append('')
    lines.append(SEP)

    return '\n'.join(lines)


# ── Bulk mode ─────────────────────────────────────────────────

def run_bulk(domains_file, send_email=False):
    """Skannar alla domäner i en fil, sparar JSON + CSV sorterat efter score."""
    try:
        with open(domains_file, 'r', encoding='utf-8') as f:
            domains = [line.strip() for line in f if line.strip() and not line.startswith('#')]
    except FileNotFoundError:
        print('Filen {} hittades inte.'.format(domains_file))
        sys.exit(1)

    print('Skannar {} domäner...'.format(len(domains)))
    results = []

    for i, domain in enumerate(domains, 1):
        print('[{}/{}] {}...'.format(i, len(domains), domain), end=' ', flush=True)
        result = scan_domain(domain)
        results.append(result)
        save_to_bigquery(result)
        score = result.get('score', 0)
        label = result.get('score_label', '')
        print('{}/10 — {}'.format(score, label))

        if i < len(domains):
            time.sleep(1)  # 1 sekunds fördröjning mellan skanningar

    # Sortera efter score fallande
    results.sort(key=lambda r: r.get('score', 0), reverse=True)

    date_str = datetime.now().strftime('%Y-%m-%d')
    json_file = 'prospect-results-{}.json'.format(date_str)
    csv_file = 'prospect-results-{}.csv'.format(date_str)

    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            'domain', 'score', 'score_label', 'platform',
            'https', 'issues_count', 'warnings_count', 'pitch'
        ])
        for r in results:
            writer.writerow([
                r.get('domain', ''),
                r.get('score', 0),
                r.get('score_label', ''),
                r.get('platform', ''),
                r.get('https', False),
                len(r.get('issues', [])),
                len(r.get('warnings', [])),
                r.get('pitch', ''),
            ])

    print()
    print('Resultat sparat:')
    print('  JSON: {}'.format(json_file))
    print('  CSV:  {}'.format(csv_file))
    print()
    print('TOP 5 — basta kandidater:')
    for r in results[:5]:
        print('  {}/10  {}'.format(r.get('score', 0), r.get('domain', '')))

    if send_email:
        top_lines = []
        for r in results[:10]:
            top_lines.append('{}/10  {}  [{}]'.format(
                r.get('score', 0), r.get('domain', ''), r.get('platform', '')
            ))
        email_body = (
            'Searchboost Prospect Scan — Bulk-rapport {}\n\n'
            'Antal skannade domäner: {}\n'
            'Antal starka kandidater (>=6): {}\n\n'
            'TOP 10:\n{}\n\n'
            'Komplett rapport: {}\n'
        ).format(
            date_str,
            len(results),
            sum(1 for r in results if r.get('score', 0) >= 6),
            '\n'.join(top_lines),
            json_file
        )
        send_email_ses(
            'Prospect Scan — {} domäner skannade {}'.format(len(results), date_str),
            email_body
        )


# ── Entry point ───────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description='Searchboost Prospect Scanner — analyserar SEO-halsa'
    )
    parser.add_argument('domain', nargs='?', help='Domännamn att skanna')
    parser.add_argument('--bulk', metavar='FILE', help='Fil med domäner (en per rad)')
    parser.add_argument('--email', action='store_true', help='Skicka resultat via SES till mikael@searchboost.se')
    args = parser.parse_args()

    if args.bulk:
        run_bulk(args.bulk, send_email=args.email)
        return

    if not args.domain:
        parser.print_help()
        sys.exit(1)

    result = scan_domain(args.domain)
    save_to_bigquery(result)

    report = format_result(result)
    print(report)

    if args.email:
        subject = 'Prospect Scan — {} — {}/10'.format(
            result['domain'], result.get('score', 0)
        )
        send_email_ses(subject, report)


if __name__ == '__main__':
    main()
