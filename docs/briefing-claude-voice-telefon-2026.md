# Claude AI + Telefon/Rost — Forskningsrapport

> Skapat: 2026-02-14
> Syfte: Hur kan Claude "ringa" Mikael med notiser, rapporter och rost-AI?
> OBS: Priser baserade pa kunskap t.o.m. maj 2025 — verifiera aktuella priser pa resp. plattform.

---

## Sammanfattning

Det finns **5 nivaer** av "Claude ringer dig":

| Niva | Vad | Kostnad/mån | Komplexitet |
|------|-----|-------------|-------------|
| 1. Push-notis | Pushover/ntfy → telefon-notis med ljud | ~50 kr | Minimal |
| 2. SMS | Twilio SMS till +46 | ~100-300 kr | Lag |
| 3. TTS-samtal | Twilio ringer + laser upp text | ~200-500 kr | Medel |
| 4. AI-rostsamtal | Bland/Vapi — tvavags rostsamtal med AI | ~500-2000 kr | Medel-Hog |
| 5. Realtids-rostassistent | Claude som telefon-sekreterare | ~2000+ kr | Hog |

**Rekommendation**: Borja med **Niva 1 (Pushover)** idag, lagg till **Niva 3 (Twilio TTS)** for viktiga samtal. Bygger ni ut med n8n sa ar detta trivialt att koppla in.

---

## 1. Push-notiser (ENKLASTE — Bygg idag)

### Pushover
- **Vad**: App for iOS/Android som tar emot push-notiser via API
- **Pris**: Engangskostnad ~$5 per plattform (iOS eller Android), sedan GRATIS
- **API**: Extremt enkelt — en HTTP POST med token + message
- **Ljud**: Kan valja olika notisljud (kritisk, hog prioritet, tyst)
- **Prioritet**: P2 = kringgrar "Stor ej"-lage pa telefon
- **Begrransning**: 10 000 meddelanden/manad (mer an tillrackligt)

```javascript
// Exempel: Pushover-notis fran n8n eller Lambda
const pushover = await fetch('https://api.pushover.net/1/messages.json', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'APP_TOKEN',        // Pushover app-token
    user: 'USER_KEY',          // Mikaels Pushover user key
    title: 'Searchboost Opti',
    message: 'Veckorapport klar for Mobelrondellen: 12 optimeringar, +3 positioner',
    priority: 1,               // 0=normal, 1=hog, 2=akut (kraver bekraftelse)
    sound: 'magic'             // Notisljud
  })
});
```

### ntfy.sh (Gratis alternativ)
- **Vad**: Open-source push-notis-tjanst
- **Pris**: Helt gratis (self-hosted eller ntfy.sh)
- **API**: Annu enklare — `curl -d "meddelande" ntfy.sh/searchboost-opti`
- **App**: Android (Play Store), iOS (via PWA)

### Rekommendation
Pushover ar bast for Mikael — pålitligt, billigt, fungerar perfekt pa iPhone. Kan integreras i **alla** Lambda-funktioner och n8n-workflows pa 5 minuter.

---

## 2. SMS via Twilio

### Setup
- Twilio-konto med svenskt nummer (+46) eller internationellt nummer
- SMS till Sverige: ~$0.07-0.09/SMS (ca 0.70-0.90 kr)
- Inget svenskt nummer kravs — kan skicka fran amerikanskt nummer till +46

```javascript
// Twilio SMS
const twilio = require('twilio')('ACCOUNT_SID', 'AUTH_TOKEN');
await twilio.messages.create({
  body: 'Ny lead pa Fiverr: "Need SEO for e-commerce" — Budget $500',
  from: '+1XXXXXXXXXX',  // Twilio-nummer
  to: '+46XXXXXXXXX'     // Mikaels nummer
});
```

### Priser (verifiera pa twilio.com/sms/pricing/se)
- Utgaende SMS till Sverige: ~$0.07-0.09/st
- Twilio-nummer (US): ~$1.15/manad
- Twilio-nummer (SE, +46): ~$6/manad
- **Uppskattad manadskostnad**: 50-200 kr (beroende pa volym)

---

## 3. Twilio Rostsamtal med TTS (REKOMMENDERAD for viktiga notiser)

### Hur det fungerar
1. Nagot viktigt hander (ny lead, rapport klar, fel i systemet)
2. Lambda/n8n trigger ett Twilio API-anrop
3. Twilio ringer Mikaels telefon
4. Nar Mikael svarar — TTS laser upp meddelandet
5. Valfritt: Mikael kan trycka knappar for att bekrafta/agera

### Kod-exempel

```javascript
const twilio = require('twilio')('ACCOUNT_SID', 'AUTH_TOKEN');

// Steg 1: Skapa samtalet
const call = await twilio.calls.create({
  url: 'https://51.21.116.7/api/twilio/voice-callback', // TwiML-endpoint
  to: '+46XXXXXXXXX',     // Mikael
  from: '+46XXXXXXXXX',   // Twilio SE-nummer
  statusCallback: 'https://51.21.116.7/api/twilio/status'
});

// Steg 2: TwiML-endpoint pa EC2-servern
app.post('/api/twilio/voice-callback', (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  // Svenska med Google TTS (eller Amazon Polly)
  twiml.say({
    voice: 'Google.sv-SE-Standard-A',  // Svensk rost
    language: 'sv-SE'
  }, 'Hej Mikael! Veckorapporten for Mobelrondellen ar klar. ' +
     'Tolv optimeringar utforda, tre forbattrade positioner. ' +
     'Tryck ett for att hora mer, eller tva for att avsluta.');

  // Knapptryck
  const gather = twiml.gather({
    numDigits: 1,
    action: '/api/twilio/handle-input'
  });

  res.type('text/xml');
  res.send(twiml.toString());
});
```

### Twilio Rostsamtal — Priser till Sverige
- **Utgaende samtal till svenskt mobilnummer**: ~$0.14-0.18/minut
- **Utgaende samtal till svenskt fastnummer**: ~$0.03-0.05/minut
- **Twilio svenskt nummer (+46)**: ~$6/manad
- **TTS (Google/Amazon Polly)**: Ingår i Twilio — ingen extra kostnad
- **Typiskt samtal (30 sek)**: ~$0.07-0.09 = ca 0.70-0.90 kr

### TTS-kvalitet pa svenska
| Motor | Kvalitet | Kommentar |
|-------|----------|-----------|
| Twilio Basic | 3/5 | Robot-aktigt, forstaligt men inte naturligt |
| Google TTS (sv-SE) | 4/5 | Bra kvalitet, flera roster, ingår i Twilio |
| Amazon Polly (sv-SE) | 4/5 | Neural TTS, mycket naturligt, ingår i Twilio |
| ElevenLabs (sv) | 5/5 | Bast kvalitet, men kraver separat integration |

**Amazon Polly Neural** via Twilio ar den basta balansen mellan kvalitet och enkelhet for svenska.

### Uppskattad manadskostnad
- 20 samtal/manad a 30 sek = ~$2.80 = ~28 kr
- Twilio-nummer: ~$6 = ~60 kr
- **Total: ~90 kr/manad**

---

## 4. AI-rostplattformar (Tvavags samtal med Claude)

### 4a. Bland AI
- **Vad**: AI-telefonagent som kan ringa och ta emot samtal
- **LLM-stod**: Egen modell, GPT-4, Claude (via API)
- **Svenska**: Begransat — primar engelska, men stodjer flersprakigt via TTS
- **Pris** (verifiera pa bland.ai/pricing):
  - Starter: ~$0.09/minut (ingaende + utgaende)
  - Enterprise: Anpassat
  - Minsta fakturering: ~$50/manad
- **Anvandningsfall**: Kalla samtal, kundservice, bokningar
- **For Mikael**: Overkill for notiser, men intressant om han vill ha en AI-sekreterare

### 4b. Vapi.ai
- **Vad**: Voice AI-plattform — bygg rostassistenter som ringer/svarar
- **LLM-stod**: GPT-4, Claude, Groq, egna modeller — **JA, Claude stods**
- **Svenska**: Stodjer svenska via ElevenLabs/PlayHT TTS
- **Pris** (verifiera pa vapi.ai/pricing):
  - Pay-as-you-go: ~$0.05/minut (LLM-kostnad tillkommer)
  - Pro: ~$0.05/minut + $49/manad
  - Total med Claude: ~$0.10-0.15/minut
- **Fardiga integrationer**: Twilio, n8n, Make, Zapier
- **For Mikael**: Basta alternativet om han vill ha tvavags rostsamtal med Claude

### 4c. Retell AI
- **Vad**: Conversational voice AI — bygger telefonagenter
- **LLM-stod**: GPT-4, Claude, egna modeller — **JA, Claude stods**
- **Svenska**: Stodjer via ElevenLabs
- **Pris** (verifiera pa retellai.com/pricing):
  - Pay-as-you-go: ~$0.07-0.12/minut
  - Pro: anpassat
- **Specialitet**: Extremt lag latens (under 1 sek)
- **For Mikael**: Bra alternativ till Vapi, liknande funktionalitet

### 4d. ElevenLabs + Claude (DIY)
- **Vad**: Bygg egen rostpipeline: Claude genererar text → ElevenLabs gor tal → Twilio spelar upp
- **Pris**:
  - ElevenLabs: Fran $5/manad (30 min audio), $22/manad for 100 min
  - Twilio: Som ovan (~$0.14/min till SE)
  - Claude API: ~$0.003/anrop (Haiku)
- **Kvalitet**: Bast mojliga TTS — ElevenLabs ar marknadsledande
- **Svenska**: ElevenLabs stodjer svenska sedan 2024, bra kvalitet
- **Komplexitet**: Medel — kraver egen orkestrering

### Jamforelse AI-rostplattformar

| Plattform | Claude-stod | Svenska | Pris/min | Tvavags | Komplexitet |
|-----------|-------------|---------|----------|---------|-------------|
| Bland AI | Ja | Begransat | ~$0.09 | Ja | Lag (hosted) |
| Vapi.ai | Ja | Ja (ElevenLabs) | ~$0.10-0.15 | Ja | Lag-Medel |
| Retell AI | Ja | Ja (ElevenLabs) | ~$0.07-0.12 | Ja | Lag-Medel |
| DIY (EL+Twilio) | Ja | Ja | ~$0.05-0.10 | Med jobb | Hog |

---

## 5. Anthropic Direkt Rost-kapacitet (2026 status)

### Vad Anthropic erbjuder sjalva
- **Claude API**: Enbart text/bild in-ut (inget direkt rost-stod per maj 2025)
- **Claude.ai**: Web/app-granssnitt, inget telefonsamtalsstod
- **Framtida**: Anthropic har hintat om multimodalt stod (rost in/ut) men inget officiellt lans per min kunskap
- **Slutsats**: For rost maste man anvanda tredjepartslager (Twilio, Vapi, Bland etc.)

---

## 6. n8n-integration (Passar perfekt i er stack)

Enligt `docs/plan-n8n-migration.md` planerar ni redan n8n-migrering. Alla rost/telefon-funktioner kan byggas som n8n-workflows:

### Workflow 1: Veckorapport → Rostsamtal
```
Trigger (Cron mandag 08:15)
  → HTTP Request: GET /api/reports (senaste rapporten)
  → Claude (Haiku): Sammanfatta rapporten i 3 meningar pa svenska
  → Twilio: Ring Mikael, las upp sammanfattningen
  → IF Mikael trycker 1: Skicka fullstandig rapport via mail
```

### Workflow 2: Ny Lead → Instant Notis
```
Trigger (Webhook fran Fiverr/Upwork/formullar)
  → Claude (Haiku): Klassificera lead (hot/varm/kall)
  → IF hot: Twilio samtal → "Ny hot lead: [namn], [budget], [beskrivning]"
  → IF varm: Pushover notis
  → IF kall: Bara Trello-kort
```

### Workflow 3: Systemlarm
```
Trigger (Webhook fran Lambda/EC2)
  → IF kritiskt fel: Twilio samtal
  → IF varning: SMS
  → IF info: Pushover
```

### Workflow 4: Morgon-briefing (Avancerat)
```
Trigger (Cron vardag 07:30)
  → HTTP Request: GET /api/pipeline (pipeline-status)
  → HTTP Request: GET /api/queue (koll pa arbetskon)
  → HTTP Request: GET /api/customers (kundstatus)
  → Claude (Sonnet): Generera 60-sekunders morgon-briefing
  → Twilio/Vapi: Ring Mikael med briefingen
```

---

## 7. GDPR-overvaganden

### Vad galler for rostsamtal + AI i Sverige?
- **Inspelning av samtal**: Kraver samtycke fran BADA parter i Sverige
- **Twilio**: Kan stanga av inspelning — da inget GDPR-problem
- **AI-rostsamtal till kunder**: Kraver informerat samtycke + DPA med leverantorer
- **Interna samtal till Mikael**: Minimalt GDPR-problem (inga personuppgifter fran tredje part)
- **Rekommendation**: For interna notiser till Mikael — inga GDPR-hinder. For kundsamtal — krav utredning.

### Datalagringsaspekter
- Twilio lagrar samtalsloggar (ej inspelning om avstangt) — DPA med Twilio kravs
- Vapi/Bland — kontrollera var data lagras (foredra EU)
- Pushover — minimal datalagring, inga personuppgifter

---

## 8. Rekommenderad Implementeringsplan

### Fas 1: Pushover-notiser (Idag — 1 timme)
**Kostnad**: ~50 kr engång
**Vad**:
1. Mikael installerar Pushover-appen pa iPhone (~$5)
2. Skapa Pushover Application (gratis, pa pushover.net)
3. Lagg till i Lambda-funktioner: `weekly-report.js`, `autonomous-optimizer.js`
4. Notis nar: rapport klar, optimering klar, fel uppstått

```javascript
// pushover-notify.js — lagg i mcp-server-code/
async function notify(title, message, priority = 0) {
  const response = await fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: process.env.PUSHOVER_APP_TOKEN,
      user: process.env.PUSHOVER_USER_KEY,
      title,
      message,
      priority,
      sound: priority >= 1 ? 'siren' : 'magic'
    })
  });
  return response.json();
}
module.exports = { notify };
```

### Fas 2: Twilio TTS-samtal (Vecka 2 — 2-3 timmar)
**Kostnad**: ~90 kr/manad
**Vad**:
1. Skapa Twilio-konto + kop svenskt nummer (+46)
2. Lagg till 2 endpoints pa EC2: `/api/twilio/voice-callback`, `/api/twilio/status`
3. Implementera "ring Mikael"-funktion i n8n eller Lambda
4. Trigger: Veckorapport-sammanfattning + kritiska larm

### Fas 3: AI-rostsamtal via Vapi (Manad 2 — 1 dag)
**Kostnad**: ~200-500 kr/manad
**Vad**:
1. Skapa Vapi-konto, koppla Claude som LLM
2. Bygg "Searchboost SEO Assistant" — kan svara pa fragor om kunddata
3. Koppla till Twilio-nummer — Mikael kan ringa in och fraga "Hur gick det for Mobelrondellen?"
4. Morgon-briefing: Vapi ringer Mikael 07:30 med dagens agenda

### Fas 4: Full rostassistent (Framtid)
**Kostnad**: ~1000+ kr/manad
**Vad**:
1. Tvavags rostsamtal dar Mikael kan ge instruktioner
2. "Ringa Kompetensutveckla och boka ett mote" (via AI-agent)
3. Inkommande samtal — AI svarar nar Mikael inte kan

---

## 9. Kostnadssammanfattning

| Losning | Setup-tid | Manadskostnad | Vad du far |
|---------|-----------|---------------|------------|
| Pushover | 1 timme | ~0 kr (engångskostnad ~50 kr) | Push-notiser med ljud, prioritet |
| Twilio SMS | 2 timmar | ~100-200 kr | SMS-notiser till mobil |
| Twilio TTS-samtal | 3 timmar | ~90-200 kr | Telefon ringer, laser upp text |
| Vapi + Claude | 1 dag | ~200-500 kr | Tvavags rostsamtal med AI |
| Bland AI | 1 dag | ~500-1000 kr | Full AI-telefonagent |
| Full rostassistent | 1 vecka | ~1000+ kr | AI-sekreterare pa telefon |

---

## 10. Slutsats och Rekommendation

### For Mikael specifikt:
1. **Borja IDAG med Pushover** — 50 kr, 1 timme, massa varde direkt
2. **Lagg till Twilio TTS** nar n8n ar uppsatt — ringer vid kritiska handelser
3. **Utvardera Vapi.ai** om Mikael vill ha tvavags-samtal med Claude

### Varfor inte Bland AI forst?
- Dyrare, mer fokuserat pa utgaende saljsamtal
- Mikael behover framst *inkommande notiser*, inte AI som ringer kunder
- Vapi.ai ar billigare och mer flexibelt for detta anvandningsfall

### Vad ar INTE mojligt idag:
- Claude kan inte direkt ringa — krav alltid en mellanhand (Twilio/Vapi/Bland)
- Anthropic har inget inbyggt rost-API (per maj 2025)
- Perfekt svensk rost finns — men krav ElevenLabs eller Amazon Polly Neural

### Snabbaste vagen till "Claude ringer mig":
```
n8n Webhook → Claude Haiku (sammanfatta) → Twilio Call → Mikael svarar → TTS laser upp
```
Total: ~3 timmars setup, ~100 kr/manad, fungerar pa dag 1.

---

## Tekniska Resurser

- **Twilio Voice Docs**: https://www.twilio.com/docs/voice
- **Twilio TwiML**: https://www.twilio.com/docs/voice/twiml
- **Twilio Sverige-priser**: https://www.twilio.com/voice/pricing/se
- **Pushover API**: https://pushover.net/api
- **Vapi.ai Docs**: https://docs.vapi.ai/
- **Bland AI Docs**: https://docs.bland.ai/
- **Retell AI Docs**: https://docs.retellai.com/
- **ElevenLabs API**: https://docs.elevenlabs.io/api-reference
- **n8n Twilio Node**: https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.twilio/
- **Amazon Polly Svenska**: https://docs.aws.amazon.com/polly/latest/dg/voicelist.html

---

*OBS: Priser baserade pa kunskap fram till maj 2025. Verifiera aktuella priser pa respektive plattforms hemsida fore implementation.*
