#!/usr/bin/env python3
"""
GA4-inbjudningsmail till kunder
Skickas via Loopia SMTP från info@searchboost.se
"""
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_HOST = "mailcluster.loopia.se"
SMTP_PORT = 587
SMTP_USER = "info@searchboost.se"
SMTP_PASS = "Q5rYihHv!"

FROM_NAME = "Mikael Larsson"
FROM_ADDR = "info@searchboost.se"

SA_EMAIL = "seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com"

CUSTOMERS = [
    {
        "to": "anette.brink@humanpower.se",
        "name": "Anette",
        "company": "Human Power",
        "highlight": "Vi ser att er organiska trafik rör sig i rätt riktning — med GA4-data kan vi visa er exakt var och hur.",
    },
    {
        "to": "peter.vikstrom@ilmonte.se",
        "name": "Peter",
        "company": "Ilmonte",
        "highlight": "Med er produktkatalog och de optimeringar vi gjort den senaste månaden finns det konkreta förbättringar att visa — GA4 ger oss siffrorna.",
    },
    {
        "to": "mattias@mobelrondellen.se",
        "name": "Mattias",
        "company": "Möbelrondellen",
        "highlight": "Vi har jobbat aktivt med era kategorisidor och produkter — nu vill vi kunna visa er i siffror vad det gett.",
    },
    {
        "to": "mikael@smalandskontorsmobler.se",
        "name": "Mikael",
        "company": "Smålands Kontorsmöbler",
        "highlight": "Vi har jobbat aktivt med er sajt och det händer saker i er organiska synlighet — med GA4 kan vi visa er exakt vad det ger i trafik och konverteringar.",
    },
    {
        "to": "jakob@tobler.se",
        "name": "Jakob",
        "company": "Tobler",
        "highlight": "Vi har gjort en hel del på produktsidor och tekniken den senaste perioden — nu vill vi visa er konkret trafikutveckling.",
    },
    {
        "to": "patrik.carlsson@traficator.se",
        "name": "Patrik",
        "company": "Traficator",
        "highlight": "Det händer saker i er organiska synlighet — med GA4 kan vi bryta ner det per sida och nyckelord i varje rapport.",
    },
]

def build_email(customer):
    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;font-size:15px;color:#333;max-width:600px;margin:0 auto;padding:20px">

<p>Hej {customer['name']},</p>

<p>Vi har gjort om vårt rapportsystem från grunden — och vi är ärligt talat ganska nöjda med resultatet.</p>

<p>{customer['highlight']}</p>

<p>För att ni ska kunna se konkreta trafiksiffror, vilka sökord som klättrat och hur besökarna rör sig på sajten behöver vi läsrättighet till ert Google Analytics 4-konto. Det tar ungefär 2 minuter:</p>

<ol style="line-height:2">
  <li>Gå till <a href="https://analytics.google.com">analytics.google.com</a></li>
  <li>Klicka på kugghjulet <strong>(Admin)</strong> längst ned till vänster</li>
  <li>Under "Property" — klicka <strong>"Property Access Management"</strong></li>
  <li>Klicka på <strong>+</strong> uppe till höger</li>
  <li>Lägg till denna e-postadress med rollen <strong>"Viewer"</strong>:</li>
</ol>

<div style="background:#f5f5f5;border-left:3px solid #db007f;padding:12px 16px;margin:16px 0;font-family:monospace;font-size:13px;word-break:break-all">
  {SA_EMAIL}
</div>

<ol start="6" style="line-height:2">
  <li>Klicka <strong>"Add"</strong> — klart!</li>
</ol>

<p>Från och med nästa veckorapport ser ni tydliga trafikkurvor direkt i rapporten.</p>

<p>Hör gärna av er om ni har frågor eller stöter på problem.</p>

<p style="margin-top:32px">
Med vänliga hälsningar,<br>
<strong>Mikael Larsson</strong><br>
Searchboost<br>
<a href="https://searchboost.se" style="color:#db007f">searchboost.se</a>
</p>

</body>
</html>"""
    return html

def send_all(dry_run=False):
    print(f"{'[DRY RUN] ' if dry_run else ''}Skickar GA4-inbjudningsmail via Loopia SMTP...\n")

    smtp = None
    if not dry_run:
        smtp = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        smtp.starttls()
        smtp.login(SMTP_USER, SMTP_PASS)

    subject = "En liten åtgärd — så ser du konkret trafikutveckling i dina rapporter"

    for c in CUSTOMERS:
        plain = (
            f"Hej {c['name']},\n\n"
            f"Vi har gjort om rapportsystemet och behöver läsrättighet till ert GA4-konto.\n\n"
            f"Lägg till {SA_EMAIL} som Viewer i GA4 Admin → Property Access Management.\n\n"
            f"Mvh Mikael, Searchboost"
        )
        html = build_email(c)

        if dry_run:
            print(f"  [DRY] {c['company']} → {c['to']}")
        else:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{FROM_NAME} <{FROM_ADDR}>"
            msg["To"] = c["to"]
            msg["Reply-To"] = "mikael@searchboost.se"
            msg.attach(MIMEText(plain, "plain", "utf-8"))
            msg.attach(MIMEText(html, "html", "utf-8"))
            try:
                smtp.sendmail(FROM_ADDR, [c["to"]], msg.as_bytes())
                print(f"  [SKICKAT] {c['company']} → {c['to']}")
            except Exception as e:
                print(f"  [FEL] {c['company']} → {c['to']}: {e}")

    if smtp:
        smtp.quit()

    print(f"\n{len(CUSTOMERS)} mail {'förberedda' if dry_run else 'behandlade'}.")

if __name__ == "__main__":
    import sys
    dry = "--dry" in sys.argv
    send_all(dry_run=dry)
