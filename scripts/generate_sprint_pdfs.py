#!/usr/bin/env python3
"""
Searchboost — Sprint-PDF Generator
Genererar A4-PDFer per kund med Searchboost-branding.
Format: vit bakgrund, rosa accent (#e91e8c), svart text.
Innehall: Status/KPIer, Utfort sprint, Nasta sprint, 12-man potential, CTA.
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import KeepTogether
import os, sys, json

# === FARG-PALETTE ===
PINK     = HexColor('#e91e8c')
CYAN     = HexColor('#00d4ff')
GREEN    = HexColor('#00c853')
DARK_BG  = HexColor('#0f172a')
GRAY_BG  = HexColor('#f8f9fa')
GRAY_MID = HexColor('#64748b')
GRAY_LT  = HexColor('#e2e8f0')
BLACK    = HexColor('#1a1a2e')

PAGE_W, PAGE_H = A4  # 595 x 842 pt

def make_styles():
    s = {}
    s['h_logo']  = ParagraphStyle('logo',  fontName='Helvetica-Bold',  fontSize=22, textColor=PINK,  spaceAfter=2)
    s['h_tagline']= ParagraphStyle('tag',  fontName='Helvetica',       fontSize=9,  textColor=GRAY_MID)
    s['h1']      = ParagraphStyle('h1',    fontName='Helvetica-Bold',  fontSize=22, textColor=BLACK, spaceBefore=8, spaceAfter=4)
    s['h2']      = ParagraphStyle('h2',    fontName='Helvetica-Bold',  fontSize=13, textColor=PINK,  spaceBefore=10, spaceAfter=4)
    s['h3']      = ParagraphStyle('h3',    fontName='Helvetica-Bold',  fontSize=10, textColor=BLACK, spaceBefore=6, spaceAfter=2)
    s['body']    = ParagraphStyle('body',  fontName='Helvetica',       fontSize=9,  textColor=BLACK, leading=13, spaceAfter=3)
    s['body_sm'] = ParagraphStyle('bsm',   fontName='Helvetica',       fontSize=8,  textColor=GRAY_MID, leading=11)
    s['bullet']  = ParagraphStyle('bul',   fontName='Helvetica',       fontSize=9,  textColor=BLACK, leading=13, leftIndent=10, bulletIndent=0, spaceAfter=2)
    s['kpi_val'] = ParagraphStyle('kpiv',  fontName='Helvetica-Bold',  fontSize=26, textColor=BLACK, alignment=TA_CENTER)
    s['kpi_lab'] = ParagraphStyle('kpil',  fontName='Helvetica',       fontSize=7,  textColor=GRAY_MID, alignment=TA_CENTER)
    s['cta_h']   = ParagraphStyle('ctah',  fontName='Helvetica-Bold',  fontSize=18, textColor=white, alignment=TA_CENTER, spaceAfter=6)
    s['cta_b']   = ParagraphStyle('ctab',  fontName='Helvetica',       fontSize=10, textColor=white, alignment=TA_CENTER, spaceAfter=4)
    s['footer']  = ParagraphStyle('foot',  fontName='Helvetica',       fontSize=7,  textColor=GRAY_MID, alignment=TA_CENTER)
    s['date']    = ParagraphStyle('date',  fontName='Helvetica',       fontSize=8,  textColor=GRAY_MID, alignment=TA_RIGHT)
    s['section_label'] = ParagraphStyle('slbl', fontName='Helvetica-Bold', fontSize=7, textColor=white)
    return s

def kpi_table(metrics_list, styles):
    """metrics_list = [(value, label, color), ...]"""
    cols = len(metrics_list)
    col_w = (PAGE_W - 30*mm) / cols

    header_cells = []
    value_cells  = []
    label_cells  = []

    for val, lab, clr in metrics_list:
        header_cells.append('')
        value_cells.append(Paragraph(str(val), styles['kpi_val']))
        label_cells.append(Paragraph(lab, styles['kpi_lab']))

    data = [value_cells, label_cells]

    ts = TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), GRAY_BG),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, GRAY_LT),
    ])

    # Color top border per metric
    for i, (val, lab, clr) in enumerate(metrics_list):
        ts.add('LINEABOVE', (i,0), (i,0), 3, clr)

    col_widths = [col_w] * cols
    t = Table(data, colWidths=col_widths)
    t.setStyle(ts)
    return t

def section_badge(text, color=PINK):
    """Liten bakgrundsfarad badge som sektionsrubrik."""
    data = [[Paragraph(f'<font color="white"><b>{text}</b></font>',
                       ParagraphStyle('badge', fontName='Helvetica-Bold', fontSize=8, textColor=white))]]
    t = Table(data, colWidths=[PAGE_W - 30*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), color),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    return t

def bullet_item(text, styles, icon='•', color=PINK):
    icon_html = f'<font color="{color.hexval()}">{icon}</font>'
    return Paragraph(f'{icon_html}  {text}', styles['bullet'])


def generate_pdf(data, output_path):
    styles = make_styles()

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=15*mm,
        rightMargin=15*mm,
        topMargin=12*mm,
        bottomMargin=15*mm,
    )

    company  = data['company_name']
    domain   = data['domain']
    date_str = data.get('date', '2026-04-22')

    # GSC
    gsc_clicks     = data.get('gsc_clicks', 0)
    gsc_impressions= data.get('gsc_impressions', 0)
    gsc_avg_pos    = data.get('gsc_avg_pos', 0)
    gsc_top10      = data.get('gsc_top10', 0)
    total_opts     = data.get('total_optimizations', 0)

    done_this_sprint = data.get('done_this_sprint', [])
    next_sprint      = data.get('next_sprint', [])
    potential        = data.get('potential', '')
    notes            = data.get('notes', '')

    story = []

    # ===== HEADER BAR =====
    header_data = [[
        Paragraph('<b><font color="#e91e8c">SEARCHBOOST</font></b>',
                  ParagraphStyle('hdr', fontName='Helvetica-Bold', fontSize=14, textColor=PINK)),
        Paragraph(f'Sprint-rapport  |  {date_str}',
                  ParagraphStyle('hdrr', fontName='Helvetica', fontSize=8, textColor=GRAY_MID, alignment=TA_RIGHT))
    ]]
    header_t = Table(header_data, colWidths=[80*mm, PAGE_W - 30*mm - 80*mm])
    header_t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LINEBELOW', (0,0), (-1,0), 2, PINK),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(header_t)
    story.append(Spacer(1, 6*mm))

    # ===== KUND-RUBRIK =====
    story.append(Paragraph(company, styles['h1']))
    story.append(Paragraph(domain, ParagraphStyle('dom', fontName='Helvetica', fontSize=9, textColor=GRAY_MID, spaceAfter=6)))
    story.append(HRFlowable(width='100%', thickness=0.5, color=GRAY_LT, spaceAfter=6))

    # ===== KPI-SEKTION =====
    story.append(section_badge('STATUS & KPI:ER — APRIL 2026'))
    story.append(Spacer(1, 3*mm))

    pos_str = f'{gsc_avg_pos:.1f}' if gsc_avg_pos > 0 else '—'
    metrics = [
        (f'{gsc_clicks:,}'.replace(',', ' '), 'Klick (30 dagar)', PINK),
        (f'{gsc_impressions:,}'.replace(',', ' '), 'Impressioner (30 dagar)', CYAN),
        (pos_str, 'Snittsposition', GREEN if gsc_avg_pos > 0 and gsc_avg_pos <= 10 else PINK),
        (str(gsc_top10), 'Sökord topp 10', HexColor('#7c4dff')),
        (str(total_opts), 'Optimeringar totalt', PINK),
    ]
    story.append(kpi_table(metrics, styles))
    story.append(Spacer(1, 5*mm))

    # ===== UTFORT DENNA SPRINT =====
    story.append(section_badge('UTFORT DENNA SPRINT (22 APRIL)'))
    story.append(Spacer(1, 3*mm))

    if done_this_sprint:
        for item in done_this_sprint:
            story.append(bullet_item(item, styles, icon='✓', color=GREEN))
    else:
        story.append(Paragraph('Inga registrerade insatser denna sprint.', styles['body_sm']))

    story.append(Spacer(1, 5*mm))

    # ===== NASTA SPRINT =====
    story.append(section_badge('NASTA SPRINT — PRIORITERADE ATGARDER'))
    story.append(Spacer(1, 3*mm))

    if next_sprint:
        for item in next_sprint:
            story.append(bullet_item(item, styles, icon='→', color=PINK))
    else:
        story.append(Paragraph('Planeras i nasta mote.', styles['body_sm']))

    story.append(Spacer(1, 5*mm))

    # ===== 12-MAN POTENTIAL =====
    story.append(section_badge('12-MANADERS TILLVAXTPOTENTIAL', color=HexColor('#0f172a')))
    story.append(Spacer(1, 3*mm))

    if potential:
        pot_data = [[Paragraph(potential, ParagraphStyle('pot', fontName='Helvetica', fontSize=9, textColor=BLACK, leading=14))]]
        pot_t = Table(pot_data, colWidths=[PAGE_W - 30*mm])
        pot_t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), GRAY_BG),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
            ('LINERIGHT', (0,0), (0,-1), 3, CYAN),
        ]))
        story.append(pot_t)

    story.append(Spacer(1, 5*mm))

    # ===== NOTER (om finns) =====
    if notes:
        story.append(section_badge('NOTER / ATGARDER FRAN KUND', color=HexColor('#f59e0b')))
        story.append(Spacer(1, 3*mm))
        story.append(Paragraph(notes, styles['body']))
        story.append(Spacer(1, 5*mm))

    # ===== CTA-BOX =====
    cta_data = [[
        Paragraph('Redo for nasta steg?', styles['cta_h']),
    ], [
        Paragraph(f'Kontakta Mikael for att diskutera er SEO-strategi och nasta sprints mal.', styles['cta_b']),
    ], [
        Paragraph('mikael@searchboost.se  |  0760-19 49 05  |  searchboost.se', styles['cta_b']),
    ]]
    cta_t = Table(cta_data, colWidths=[PAGE_W - 30*mm])
    cta_t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), DARK_BG),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 15),
        ('RIGHTPADDING', (0,0), (-1,-1), 15),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(KeepTogether(cta_t))
    story.append(Spacer(1, 4*mm))

    # ===== FOOTER =====
    story.append(HRFlowable(width='100%', thickness=0.5, color=GRAY_LT, spaceBefore=4))
    story.append(Paragraph(
        f'Searchboost.se  |  SEO-sprint {date_str}  |  Genererad automatiskt',
        styles['footer']
    ))

    doc.build(story)
    print(f'PDF sparad: {output_path}')


# ================================================================
# KUNDDATA
# ================================================================

CUSTOMERS = {
    'humanpower': {
        'company_name': 'Human Power AB',
        'domain': 'humanpower.se',
        'gsc_clicks': 0,
        'gsc_impressions': 21,
        'gsc_avg_pos': 15.3,
        'gsc_top10': 6,
        'total_optimizations': 13,
        'done_this_sprint': [
            'Kritisk SEO-fix: Rank Math emittade 0 meta-tags — SBS SEO head emitter deployad (Title + meta desc + 7 OG-tags + 4 JSON-LD blocks)',
            'Interlinking 33/33 artiklar — Relaterade artiklar-block med 3 amnesmatcade lankar',
            'llms.txt expanderad (328 → 3 334 bytes) — retreat, samtal, kosttillskott, 15 topartiklar',
            'robots.txt hardning — wp-admin, kassan, sokformular disallowed',
            'Sanity-check 10/10 kritiska sidor: 200 OK, 0 fatal errors, 1 H1 per sida',
            'H2-optimering pa kosttillskott-sidan (3 H2 + 4 H3 tillagda)',
            '3 artiklar vecka 24: utmattningssyndrom, aterhamtning utbrandhet, stresshantering',
            'Bokningsformular CF7 #634 skapat for Utvecklande samtal',
        ],
        'next_sprint': [
            'Lagg till SA i GSC (seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com) for att aktivera GSC-data',
            'Utred Rank Math setup wizard — RM emittar korrekt via snippet men bor konfigureras inbyggt',
            'Bio + foto fran Anette Brink (Human Power) och David (Reboot) till Om oss-sidan',
            'Klarlagg korresa-priser (Anette ska tydliggora exakt avsnitt/sida)',
            'Ny batch 3 artiklar vecka 25',
            'Schema markup: LocalBusiness + Person for Anette pa startsidan',
        ],
        'potential': (
            'Humanpower.se ar en ny sajt med litet GSC-fotsparat. Med Google SA-access och fortsatt '
            'artikelproduktion (3/vecka) + teknisk SEO-grund nu lagd, beraknas sajten na 200-400 '
            'organiska klick/manad inom 6-9 manader. Nyckelord som "stresshantering", "utmattningssyndrom", '
            '"retreat Sverige" har volym i tusentals sokningar/maned. Rank Math-metadatan ar nu pa plats — '
            'indexeringen kan ta fart sa snart Google crawlar de fixade sidorna.'
        ),
        'notes': 'GSC SA-access behover laggas till manuellt av Mikael i Google Search Console.',
    },

    'ilmonte': {
        'company_name': 'Ilmonte AB',
        'domain': 'ilmonte.se',
        'gsc_clicks': 42,
        'gsc_impressions': 2553,
        'gsc_avg_pos': 11.2,
        'gsc_top10': 29,
        'total_optimizations': 69,
        'done_this_sprint': [
            'Interlinking 43/43 artiklar — Relaterade artiklar-block med 3 amnesmatcade lankar',
            'SEO-grund verifierad: Sitemap 773 URLer (8 sub-sitemaps), Rank Math emittar korrekt',
            'Malware-cleanup KLAR: ~4 118 casino/spam-URLer rensade, databas sakrad, sajt migrerad till Loopia',
            '11-sidig forensisk rapport levererad till Peter Vikstrom',
            'GSC-uppfoljning: 42 klick, 29 sidor i topp 10, "ilmonte" pos 1',
        ],
        'next_sprint': [
            'Beslutspunkt 9 maj: Peter bekraftar om fortsatt samarbete eller avslutar',
            'Ny batch artiklar for scenprodukter, eventmoblering, backstage-losningar',
            'Schema markup for produktkategorier (Product + CollectionPage)',
            'Uppfoljning pa GSC-position for "dansmatta", "podier", "teleskoplaktare"',
            'Beebyte-hosting: verifiera backup-rutin efter malware-incidenten',
        ],
        'potential': (
            '29 sidor rankar redan i topp 10. Med fortsatt artikelproduktion kring scenlosningar, '
            'eventmoblering och backstage-utrustning finns potential att na 200-500 klick/manad. '
            '"Scenpodier" (pos 3.5) och "teleskoplaktare" (pos 2.2) ar nara topp 3 — '
            'optimerade produktsidor kan oka klick med 40-80% for dessa sorkord. '
            'Retention-beslut i maj avgör langsiktig plan.'
        ),
        'notes': 'RETENTION: 30 dagars gratis-period. Beslut fran Peter Vikstrom vantas 9 maj 2026.',
    },

    'jelmtech': {
        'company_name': 'Jelmtech Produktutveckling AB',
        'domain': 'jelmtech.se',
        'gsc_clicks': 18,
        'gsc_impressions': 144,
        'gsc_avg_pos': 24.0,
        'gsc_top10': 13,
        'total_optimizations': 17,
        'done_this_sprint': [
            'Kritisk SEO-fix: Rank Math emittade 0 JSON-LD + ofullstandiga OG — SBS SEO head emitter deployad',
            'Sitemap-fix: /sitemap.xml → 301 till /sitemap_index.xml (fungerar nu korrekt)',
            'robots.txt omskriven: wp-admin, sokformular, feed disallowed',
            'Interlinking 64/64 artiklar — Relaterade artiklar-block med 3 amnesmatcade lankar',
            'llms.txt expanderad (700 → 3 162 bytes) — produktutvecklings-tjanster, 15 topartiklar',
            '3 artiklar vecka 24: glasfiberarmerad plast, kostnad formsprutningsverktyg, bioplast',
            'Tjanstesidor: Relaterade tjanster-block pa 5 sidor (plastkonstruktion, industridesign m fl)',
            'Google Analyticator (dott plugin) deaktiverat',
        ],
        'next_sprint': [
            'Startsidans H1 och hero-text optimera for "produktutveckling plast"',
            'Rank Math setup wizard — avsluta konfiguration sa inbyggd RM kan ta over',
            'Ny batch 3 artiklar vecka 25 (formsprutning, plastmaterial, prototypcertifiering)',
            '/produktutveckling/-kategorisida: lagg till H1 + intro-text via Rank Math',
            'Schema: LocalBusiness + aggregateRating pa startsidan',
            'GSC SA-access: verifiera att property ar kopplad',
        ],
        'potential': (
            'Jelmtech har nisch B2B-sokord (plastkonstruktion, formsprutning, produktutveckling) '
            'med latent sokvolym. Med teknisk SEO nu lagd och 64 artiklar interlankat, '
            'beraknas klickvolymen oka fran nuvarande 18 till 100-200/manad inom 6 manader. '
            '"jelmtech" rankar #1 — varumarkes-trafik stabil. Branschord med hog koparintention '
            '(kostnad formsprutningsverktyg, plastprototyp pris) kan driva B2B-leads.'
        ),
        'notes': '',
    },

    'mobelrondellen': {
        'company_name': 'Mobelrondellen',
        'domain': 'mobelrondellen.se',
        'gsc_clicks': 0,
        'gsc_impressions': 0,
        'gsc_avg_pos': 0,
        'gsc_top10': 0,
        'total_optimizations': 23,
        'done_this_sprint': [
            'Yoast → Rank Math meta-migration: alla 157 Yoast-meta-rader kopierade till rank_math_*',
            'Rank Math emittar nu fullt schema: Article + Person + Organization + ImageObject + BreadcrumbList',
            'Interlinking 32/32 artiklar — Relaterade artiklar-block med 3 amnesmatcade lankar',
            'SEO-grund OK: Sitemap (WP core), 2 JSON-LD + 7 OG + canonical',
            'llms.txt 2872 chars med alla produktkategorier',
            '3 artiklar vecka 24: inreda vardagsrum, koksbord guide, sovrum inredning',
            'Teknisk fix: kontaktsidan CF7-formular rensat fran [honeypot email]',
        ],
        'next_sprint': [
            'GA4 analytics-kod installeras (ingen tracking-kod i React SPA just nu — kravs!)',
            'Mattias laddar upp leverantörsbilder som kategori-thumbnails',
            'Byt permalink-struktur fran date-based till /%postname%/ i WP-admin',
            'GSC SA-access: lagg till service account for att aktivera GSC-data i Opti',
            'Ny batch 3 artiklar vecka 25',
            'Schema markup for produktsidor (Product + CollectionPage)',
        ],
        'potential': (
            'Mobelrondellen opererar i en kompetitiv men hog-volym-nisch (mobler, inredning). '
            'GSC-data saknas pa grund av obopplad SA — aktivering av GSC ar hogsta prio. '
            'Med Rank Math nu korrekt konfigurerat och 23 optimeringar genomforda, '
            'finns starka forutsattningar. Typisk metrik for moblerbranschen: 500-2000 klick/manad '
            'inom 9-12 manader med kontinuerlig artikelproduktion.'
        ),
        'notes': 'GSC SA ej kopplad — aktivering kravs for att visa GSC-data i rapporten. Sucuri WAF aktiv.',
    },

    'nordicsnusonline': {
        'company_name': 'Nordic Snus Online',
        'domain': 'nordicsnusonline.com/sv',
        'gsc_clicks': 0,
        'gsc_impressions': 0,
        'gsc_avg_pos': 0,
        'gsc_top10': 0,
        'total_optimizations': 14,
        'done_this_sprint': [
            'Interlinking 44/44 artiklar — Relaterade artiklar-block med 3 amnesmatcade lankar',
            'SEO-grund verifierad OK: Sitemap 434 URLer, robots.txt hardad, Rank Math full schema + 13 OG-tags',
            'CookieHub + Consent Mode v2 aktiv, GDPR-kompatibel',
            '3 artiklar vecka 24: g3 nikotinpasar recension, styrka guide, kopa nikotinpasar online',
            'Motesunderlag for fredag 25 april: 14 sparstigar (programmatisk SEO, LinkedIn, YouTube m fl)',
        ],
        'next_sprint': [
            'MOTE FREDAG 25 APRIL: prissatta sprint-paket A (programmatisk SEO 33k) + B (LinkedIn 2.5k/man)',
            'Verifiera GA4 purchase events + quantity (dosor) for provisionstrackning',
            'Bygg Google Sheet: daglig rapport antal dosor × 0.70 kr provision',
            'Ny batch artiklar vecka 25',
            'Aktivera GSC SA-access for att lampsa GSC-data i Opti-dashboarden',
        ],
        'potential': (
            'Affarmodell: 70 ore/sold dosa — SEO ar enda marknadsforingskanalen (inga Google/Meta-annonser). '
            'Nikotinpasar ar ett snabbvaxande segment i Sverige. '
            'Med programmatisk SEO (33k engangsprojekt) kan 100-500 nya rankade produktsidor genereras '
            'som driver direkt konvertering. Uppskattad potential: 1 000-3 000 dosor/manad inom 12 manader '
            '= 700-2 100 kr/manad provision fran organisk trafik. '
            'GA4-tracking ar kritisk for att bevisa ROI mot provisionsmodellen.'
        ),
        'notes': 'Provision-modell: 70 öre/dosa. GA4 tracking maste veriferas omgaende.',
    },

    'smalandskontorsmobler': {
        'company_name': 'Smalands Kontorsmobler',
        'domain': 'smalandskontorsmobler.se',
        'gsc_clicks': 4,
        'gsc_impressions': 1890,
        'gsc_avg_pos': 21.8,
        'gsc_top10': 12,
        'total_optimizations': 23,
        'done_this_sprint': [
            'GSC sitemap_index.xml submittad — 1 093 sidor upptackta (property: www.smalandskontorsmobler.se)',
            'Interlinking 71/71 artiklar — Relaterade artiklar-block med kat-lankar',
            'llms.txt expanderad (1 017 → 5 474 bytes) — full produktkategori-trad, 15 top guides',
            'robots.txt hardning: /cart/, /checkout/, /my-account/, /?filter_*/, /search/ disallowed',
            'ContactPage + AboutPage schema pa /kontakt/ och /om-oss/',
            'H-struktur fixad: 3 artiklar med duplicate H1 korrigerade',
            'Schema-audit OK: Organization, Product, BlogPosting, FAQPage pa ratt sidor',
            'Flatsome demo-post ID 17854 raderad',
            '3 artiklar vecka 24: stabord kontor, loungemöbler, kontorsstol ergonomi',
        ],
        'next_sprint': [
            'Byt permalink-struktur fran date-based (/2026/04/12/slug/) till /%postname%/ i WP-admin',
            'Skapa GSC URL-prefix property + SA-access for korrekt GSC-data',
            'GA4 — analytics-kod behövs (Measurement ID saknas)',
            '8 variabla produkter saknar per-fargbilder — Micke/Mikael laddar upp',
            '137 produkter saknar varumarke — granskning och tilldelning',
            'Social media Lambda-deploy: social-scheduler.js klar lokalt, behover Lambda-deploy',
        ],
        'potential': (
            '1 890 impressioner/manad visar att Google ser sajten — men position 21.8 ger fa klick. '
            'Kontorsmöbler ar ett hog-volym B2B-nischord med tusentals sokningar/maned. '
            '"hoj-sankbart-skrivbord" (pos 13.8) ar nara topp 10 — ett push kan tredubbla klicken. '
            'Med 71 interlankat artiklar och teknisk SEO-grund lagd, beraknas sajten na '
            '50-200 klick/manad inom 3-6 manader och 500+ inom 12 manader.'
        ),
        'notes': 'WooCommerce-migrering fran Abicart klar. Permalink-fix prioriteras — paverkar all URL-historik.',
    },

    'tobler': {
        'company_name': 'Tobler Stallningsprodukter AB',
        'domain': 'tobler.se',
        'gsc_clicks': 5,
        'gsc_impressions': 1364,
        'gsc_avg_pos': 15.2,
        'gsc_top10': 26,
        'total_optimizations': 24,
        'done_this_sprint': [
            'Interlinking 13/13 artiklar — Relaterade artiklar-block med amnesmatcade lankar',
            'robots.txt hardning: cart/checkout/my-account/search/feed/xmlrpc disallowed',
            'SEO-grund verifierad OK: Sitemap 213 URLer, Rank Math emittar JSON-LD + 7 OG + meta desc',
            'Meta Pixel installerad (ID: 1997637907505774) — live via Code Snippets',
            '3 artiklar vecka 24: fasadstallning, rullstallning, begagnad byggstallning',
        ],
        'next_sprint': [
            'Ny hemsida i Flatsome (WooCommerce) — byggstart (avtalat i 18k-paketet)',
            'Fortnox-integration: WooCommerce → automatisk fakturahantering',
            '3 Facebook-annonser (ingar i paketet) — kampanjuppstart',
            'LinkedIn + Facebook organisk postning',
            'Produktbilder: 3 st fran Jakob (efterfragade)',
            'Fortnox API-nyckel fran Jakob (efterfragad)',
        ],
        'potential': (
            '26 sidor rankar i topp 10 — stark teknisk bas. "aluminiumplank" pos 1, '
            '"bockrygg" pos 3. Med ny Flatsome-hemsida och WooCommerce-integration '
            'kan e-handelskonvertering aktiveras. Byggbranschen koper material online allt mer — '
            'startpaket-erbjudanden (ny stallningsbolag) ar en undeutnyttjad mojlighet. '
            'Facebook-annonser + organisk postning kan addera 20-50 leads/manad utover SEO.'
        ),
        'notes': 'Faktura #135 (22 500 kr) forfaller 2026-05-11. Ny hemsida-bygge startar nasta sprint.',
    },

    'traficator': {
        'company_name': 'Traficator AB',
        'domain': 'traficator.se',
        'gsc_clicks': 1,
        'gsc_impressions': 701,
        'gsc_avg_pos': 21.6,
        'gsc_top10': 13,
        'total_optimizations': 44,
        'done_this_sprint': [
            'Interlinking 53/53 artiklar — Relaterade artiklar-block med amnesmatcade lankar',
            'llms.txt expanderad med alla gjuttjanster, referensprojekt, 15 topartiklar',
            'robots.txt hardning: wp-login, sokformular, feed, xmlrpc disallowed',
            'Sitemap verifierad: 99 URLer, /sitemap_index.xml 200 OK',
            'hreflang pa 10 SV/EN-par (Code Snippet #33) — korrekt flersprakig signalering',
            '3 artiklar vecka 20: pressgjutning aluminium, gjutgods konstruktion, prototyp gjutning',
            'Alle 6 Patrik-klago-sidor aterstallda korrekt (sandgjutning, metallgjutning, EN-sidor)',
            'Engelska meny fullt ateruppbyggd (10 items)',
        ],
        'next_sprint': [
            'MOTE FREDAG 24 APRIL: pitch Traficator Plast ny hemsida + SEO (se presentations/traficator-plast-pitch-2026-04-24.md)',
            'Verifiera GA4 i GTM-container GTM-KRTLTBXM',
            'GSC SA-access: verifiera att property https://traficator.se/ ar kopplad',
            'Bygga branschsidor + materialsidor + jamforelsesidor (expansion)',
            'Uppfoljning manadskonto 3 maj (GSC-data for april)',
            'Faktura 22 500 kr forfaller 26 april — bekrafta betalning',
        ],
        'potential': (
            'Gjutbranschen ar en nisch B2B-marknad med hog ordervarde. Med 44 genomforda '
            'optimeringar och 53 interlankat artiklar ar den tekniska basen stark. '
            '"aluminiumgjutning" (pos 10.9) och "pressgjutning" ar nara topp 10. '
            'Traficator Plast-expansion innebar en potentiellt dubblad sajt med egna '
            'sokord (plast, formsprutning, precisionsdelar). Kombinerat SEO + ny hemsida '
            'kan driva 100-300 B2B-besok/manad inom 9 manader.'
        ),
        'notes': 'Faktura 22 500 kr forfaller 26 april. Skicka uppdateringsmail till Patrik efter varje andring.',
    },

    'searchboost': {
        'company_name': 'Searchboost',
        'domain': 'searchboost.se',
        'gsc_clicks': 0,
        'gsc_impressions': 113,
        'gsc_avg_pos': 37.2,
        'gsc_top10': 1,
        'total_optimizations': 8,
        'done_this_sprint': [
            'Artikel publicerad: "SEO vs Google Ads — vilket ger mest?" (organisk trafik-ingang)',
            'Artikel publicerad: "AI-sok och GEO — framtidens SEO" (thought leadership)',
            'Meta description bulk-sweep: 20+ sidor uppdaterade',
            'Alt-text bulk: bilder pa searchboost.se optimerade',
            'llms.txt och robots.txt optimerade',
        ],
        'next_sprint': [
            'Total rebuild av searchboost.se — Sveriges snyggaste SEO-byra-sajt (PRIO 1)',
            'Hero + audit-formulär + prispaket + live case studies fran riktiga kunder',
            'GSC-data-integration: dagligt mail kl 07:00 med alla kunders viktigaste siffror',
            'Credential manager UI i Opti-dashboarden',
            'LinkedIn ghostwriter-lancering for kunder (2 000 kr/man/kund)',
        ],
        'potential': (
            'Searchboost.se ar byrans egna varumärkes-sajt och ar kritisk for foresaljs-trafik. '
            'Nuvarande GSC visar 113 impressioner men noll klick — sajten syns ej pa relevanta '
            'sokord ("SEO-byra Sverige", "SEO-konsult", "soke-optimering"). '
            'En total rebuild med tydlig hero, case studies, prispaket och audit-formulär '
            'beraknas kunna driva 10-30 nya leads/manad inom 6 manader. '
            'Satt mal: 5 nya kunder/kvartal fran organisk trafik.'
        ),
        'notes': '',
    },
}


if __name__ == '__main__':
    output_dir = '/Users/weerayootandersson/Downloads/Searchboost-Opti/presentations/sprint-pdf-2026-04-22'
    os.makedirs(output_dir, exist_ok=True)

    customers_to_generate = list(CUSTOMERS.keys())
    if len(sys.argv) > 1:
        customers_to_generate = sys.argv[1:]

    generated = []
    failed = []

    for slug in customers_to_generate:
        if slug not in CUSTOMERS:
            print(f'WARNING: Okand kund {slug}')
            failed.append(slug)
            continue

        data = CUSTOMERS[slug].copy()
        data['date'] = '2026-04-22'

        # Filnamn: smalandskontorsmobler → smk
        file_slug = slug
        if slug == 'smalandskontorsmobler':
            file_slug = 'smk'
        elif slug == 'nordicsnusonline':
            file_slug = 'nordicsnusonline'

        output_path = os.path.join(output_dir, f'{file_slug}-sprint-2026-04-22.pdf')

        try:
            generate_pdf(data, output_path)
            generated.append(f'{file_slug}: {output_path}')
        except Exception as e:
            print(f'FEL for {slug}: {e}')
            import traceback; traceback.print_exc()
            failed.append(slug)

    print(f'\n=== KLAR ===')
    print(f'Genererade: {len(generated)}')
    for g in generated:
        print(f'  {g}')
    if failed:
        print(f'Misslyckades: {failed}')
