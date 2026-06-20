/**
 * Coachning — liten, fristående server.
 *
 * Integritetsmodell:
 *   - All hälsodata parsas och lagras i webbläsaren (localStorage).
 *   - Servern lagrar INGEN hälsodata.
 *   - Enda servern gör: ta emot ett chattmeddelande + en kort sammanfattning
 *     av datan och proxa anropet till Claude (så API-nyckeln aldrig hamnar
 *     i klienten).
 *
 * API-nyckel hämtas från SSM (/seo-mcp/anthropic/api-key) precis som resten
 * av systemet, med fallback till miljövariabeln ANTHROPIC_API_KEY för lokal
 * körning.
 */

const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3100;

// ---------------------------------------------------------------------------
// Inloggning. Ett enda privat konto. Lösenordet lagras aldrig i klartext —
// bara en bcrypt-hash. Kan överskrivas via env (COACH_EMAIL / COACH_PASS_HASH)
// vid deploy. JWT-token gäller 30 dagar så hon slipper logga in jämt.
// ---------------------------------------------------------------------------
const AUTH = {
  email: (process.env.COACH_EMAIL || 'fridalindgren0@gmail.com').toLowerCase(),
  passHash: process.env.COACH_PASS_HASH || '$2b$12$8ijtdjQp0f/8TMdsUdY13uOND67zuSn2fabOxWkIk3ObnnS524nWi',
};
const JWT_SECRET = process.env.COACH_JWT_SECRET || AUTH.passHash; // stabil men icke-klartext
const TOKEN_TTL = '30d';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Inte inloggad' });
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Sessionen har gått ut. Logga in igen.' });
  }
}

// Coachen ska kännas personlig och resonera väl kring hälsodata — Sonnet 4.6
// är en bra balans mellan kvalitet och kostnad.
const MODEL = process.env.COACH_MODEL || 'claude-sonnet-4-6';

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// API-nyckel: SSM med env-fallback. Cachas efter första hämtningen.
// ---------------------------------------------------------------------------
let cachedKey = null;
async function getApiKey() {
  if (cachedKey) return cachedKey;
  if (process.env.ANTHROPIC_API_KEY) {
    cachedKey = process.env.ANTHROPIC_API_KEY;
    return cachedKey;
  }
  const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
  const ssm = new SSMClient({ region: process.env.AWS_REGION || 'eu-north-1' });
  const res = await ssm.send(new GetParameterCommand({
    Name: '/seo-mcp/anthropic/api-key',
    WithDecryption: true,
  }));
  cachedKey = res.Parameter.Value;
  return cachedKey;
}

// ---------------------------------------------------------------------------
// Coach-persona. Tonen skalas av reglaget (toneLevel 1–5) som hon själv
// ställer in. Lägst = ren återhämtning/validering, högst = mer peppig och
// konkret utmaning. Återhämtning-först gäller alltid.
// ---------------------------------------------------------------------------
const TONE_GUIDES = {
  1: 'Ton: mycket mjuk och vilsam. Bekräfta och normalisera. Föreslå INGEN träning utöver vila, andning och kanske en kort promenad om hon själv vill. Inga mål, inga "borde".',
  2: 'Ton: mjuk och omsorgsfull. Små, helt frivilliga förslag på lätt rörelse och näring. Mest lyssna och validera.',
  3: 'Ton: varm och uppmuntrande, balanserad. Lagom konkreta förslag, alltid valfria. Fira små steg.',
  4: 'Ton: peppig och engagerad. Lite mer konkreta tränings- och kostförslag, men fortfarande snäll och utan press.',
  5: 'Ton: energisk peppare och coach. Konkreta, utmanande (men rimliga) förslag. Fortfarande nollskuld — utmaning erbjuds, krävs aldrig.',
};

function buildSystemPrompt({ toneLevel, dataSummary, checkin }) {
  const tone = TONE_GUIDES[toneLevel] || TONE_GUIDES[3];

  return `Du är en personlig hälsocoach som förenar fyra roller i en och samma varma röst:
- Personlig tränare (PT)
- Dietist
- Livscoach
- Peppare

Du pratar med en kvinna som just nu är SJUKSKRIVEN för utmattning ("gått in i väggen"). Detta är den viktigaste kontexten i allt du säger.

GRUNDPRINCIP — ÅTERHÄMTNING FÖRST:
- Prestationskrav är ofta en del av det som ledde till utmattningen. Lägg ALDRIG på press, skuld eller prestationsspråk.
- Fokus ligger på sömn, vila, stressreglering (HRV/vilopuls), näring för att läka och SNÄLL rörelse — inte på att maxa steg, kalorier eller träna hårt.
- Säg aldrig "du borde" eller "du måste". Erbjud, föreslå, undra — låt henne välja.
- Inga streaks, inga misslyckanden. En vilodag är ett bra beslut, inte ett misslyckande.
- Mat handlar om energi och näring för återhämtning — ALDRIG om bantning, restriktion eller "deff". Var extra varsam: undvik allt som kan trigga skam kring mat eller kropp.
- Validera känslor först, ge råd sen. Att må dåligt är okej. Hennes tempo gäller.

${tone}

DATA:
Du kan få en sammanfattning av hennes hälsodata (från hennes Google/Fitbit-klocka). Använd den för att göra råden personliga och konkreta, men:
- Tolka data milt och uppmuntrande. Dålig sömn = "din kropp ber om vila", inte "du sov för lite".
- Lyft mönster försiktigt, fråga hur hon själv upplever det.
- Hitta aldrig på siffror. Saknas data, säg det och fråga istället.

SÄKERHET:
- Du är inte läkare. Diagnostisera aldrig, ändra aldrig medicinering.
- Vid tecken på allvarligt mående (självskadetankar, mörka tankar, kraftig försämring) — möt det varmt, uppmuntra mjukt att kontakta vårdcentral/läkare, 1177, eller vid akut fara 112. Lämna henne aldrig ensam med tunga känslor.
- Vid medicinska frågor: hänvisa vänligt till hennes vårdkontakt.

FORM:
- Svara på svenska, varmt och personligt, som en trygg vän som råkar kunna det här.
- Håll det kort och smältbart — hon är trött. Inga väggar av text. Få, tydliga punkter eller ett par meningar.
- Ställ gärna en mjuk följdfråga istället för att leverera en lång lista.

${dataSummary ? `\nHENNES DATA (sammanfattning):\n${dataSummary}` : '\n(Ingen hälsodata uppladdad ännu.)'}
${checkin ? `\nDAGENS INCHECKNING:\n${checkin}` : ''}`;
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/login', async (req, res) => {
  const { email = '', password = '' } = req.body || {};
  const okEmail = email.trim().toLowerCase() === AUTH.email;
  const okPass = okEmail && await bcrypt.compare(password, AUTH.passHash);
  if (!okEmail || !okPass) {
    return res.status(401).json({ error: 'Fel e-post eller lösenord.' });
  }
  const token = jwt.sign({ sub: AUTH.email }, JWT_SECRET, { expiresIn: TOKEN_TTL });
  res.json({ token });
});

app.post('/api/coach', authMiddleware, async (req, res) => {
  try {
    const {
      messages = [],
      dataSummary = '',
      checkin = '',
      toneLevel = 3,
    } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages saknas' });
    }

    // Skicka bara role/content vidare — inget annat.
    const clean = messages
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }));

    const apiKey = await getApiKey();
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: buildSystemPrompt({ toneLevel, dataSummary, checkin }),
      messages: clean,
    });

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();

    res.json({ reply: text });
  } catch (err) {
    console.error('coach-error:', err.message);
    res.status(500).json({ error: 'Kunde inte nå coachen just nu. Försök igen om en stund.' });
  }
});

app.listen(PORT, () => {
  console.log(`Coachning körs på http://localhost:${PORT}`);
});
