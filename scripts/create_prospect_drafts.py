#!/usr/bin/env python3
"""
Skapar Apple Mail drafts för alla gamla prospects.
Kör: python3 create_prospect_drafts.py
"""

import subprocess
import time

# Template — anpassas per namn
SUBJECT = "Sista försöket — fick du min analys?"

BODY_NAMED = """Hej {first},

Jag hör av mig en sista gång.

För några månader sedan skickade jag en SEO-analys till er. Fick inget svar — och förstår att det kanske inte var rätt tidpunkt.

Men analysen visar fortfarande samma sak: er sajt syns knappt alls på Google för de sökningar era kunder gör. Och konkurrenterna drar nytta av det varje dag.

Har ni 15 minuter för ett snabbt samtal? Jag visar precis vad som behöver göras — utan förpliktelser.

Mikael Larsson
Searchboost
mikael@searchboost.se
searchboost.se"""

BODY_GENERIC = """Hej,

Jag hör av mig en sista gång.

För några månader sedan skickade jag en SEO-analys till er. Fick inget svar — och förstår att det kanske inte var rätt tidpunkt.

Men analysen visar fortfarande samma sak: er sajt syns knappt alls på Google för de sökningar era kunder gör. Och konkurrenterna drar nytta av det varje dag.

Har ni 15 minuter för ett snabbt samtal? Jag visar precis vad som behöver göras — utan förpliktelser.

Mikael Larsson
Searchboost
mikael@searchboost.se
searchboost.se"""

# Prospects — email → förnamn (None = generiskt hälsning)
PROSPECTS = [
    ("gramoz@gksafety.se", "Gramoz"),
    ("nima@autoparken.se", "Nima"),
    ("marcus@trygghetspartner.se", "Marcus"),
    ("magnus.heijel@mavis.se", "Magnus"),
    ("service@tollab.se", None),
    ("david.landqvist@rallab.se", "David"),
    ("mikael.n@smalandsinredningar.se", "Mikael"),
    ("Eleonor.rehback@haldotesch.se", "Eleonor"),
    ("anton@totallager.se", "Anton"),
    ("info@frontsign.se", None),
    ("patrik@eabyggtjanst.se", "Patrik"),
    ("lars@thinea.se", "Lars"),
    ("workshop@appertiff.com", None),
    ("info@acriplan.se", None),
    ("jonas.svensson@fireseal.se", "Jonas"),
    ("emma@tupac.se", "Emma"),
    ("Ulrika.Porscke@wcr.se", "Ulrika"),
    ("andreas@objektbyggen.se", "Andreas"),
    ("andre.norberg@demoleringsgruppen.se", "Andre"),
    ("mohamed@nykyrkamaskiner.se", "Mohamed"),
    ("mikael@sweedhome.se", "Mikael"),
    ("ricky.nilsson@naturvard.nu", "Ricky"),
    ("jonas.anundsson@qtsystems.se", "Jonas"),
    ("patricia@isela.se", "Patricia"),
    ("ted@reklamateljen.se", "Ted"),
    ("kim.christiansson@jlmgroup.se", "Kim"),
    ("info@ckmarine.se", None),
    ("anders.wallenquist@vertel.se", "Anders"),
    ("daniel@boxess.se", "Daniel"),
    ("oliver@savehyr.se", "Oliver"),
    ("jan.gaardsdal@fouroffice.se", "Jan"),
    ("henrik.lennartsson@recoma.se", "Henrik"),
    ("jimmy.westerlund@stalstaden.se", "Jimmy"),
    ("joakim.linden@voidmalardalen.se", "Joakim"),
    ("johan@visuellpartner.se", "Johan"),
    ("mikael@visabsanering.se", "Mikael"),
    ("Info@lerich.se", None),
    ("alexandra@adeptcollection.se", "Alexandra"),
    ("sophia@renthus.se", "Sophia"),
    ("marcus.jakobsson@kbdab.com", "Marcus"),
    ("tobias.henriksson@adamantgolv.se", "Tobias"),
    ("evalotta@adactapersonalplanering.se", "Eva-Lotta"),
    ("info@zeromaxmovers.se", None),
    ("info@hyrabyggstallningar.se", None),
    ("maja@solcellskompaniet.se", "Maja"),
    ("Info@design4all.se", None),
    ("mattias@vtm.se", "Mattias"),
    ("magnus@luckyshot.se", "Magnus"),
    ("david_sprangare@hotmail.com", "David"),
    ("david.landqvist@rallab.se", "David"),  # rallab — hade offert
]

# Deduplicera
seen = set()
unique_prospects = []
for email, name in PROSPECTS:
    key = email.lower()
    if key not in seen:
        seen.add(key)
        unique_prospects.append((email, name))

print(f"Skapar {len(unique_prospects)} draft-mail...")

def create_draft(to_email, first_name):
    if first_name:
        body = BODY_NAMED.format(first=first_name)
    else:
        body = BODY_GENERIC

    # Escape för AppleScript
    body_escaped = body.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n')
    subject_escaped = SUBJECT.replace('"', '\\"')
    to_escaped = to_email.replace('"', '\\"')

    script = f'''
tell application "Mail"
    set newMsg to make new outgoing message with properties {{subject:"{subject_escaped}", content:"{body_escaped}", visible:false}}
    tell newMsg
        make new to recipient with properties {{address:"{to_escaped}"}}
        set sender to "Mikael Larsson <mikael@searchboost.se>"
    end tell
    save newMsg
end tell
'''
    result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  FEL {to_email}: {result.stderr.strip()}")
        return False
    return True

ok = 0
fail = 0
for i, (email, name) in enumerate(unique_prospects):
    display = f"{name or '(generisk)'} <{email}>"
    if create_draft(email, name):
        ok += 1
        print(f"  [{i+1}/{len(unique_prospects)}] OK   {display}")
    else:
        fail += 1
        print(f"  [{i+1}/{len(unique_prospects)}] FEL  {display}")

print(f"\nKlart! {ok} drafts skapade, {fail} fel.")
print("Öppna Mail → Drafts för att se alla.")
