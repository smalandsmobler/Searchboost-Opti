import { NextRequest, NextResponse } from "next/server";
import {
  appendMessage,
  updateMessage,
  getRecentMessages,
  generateId,
  type ChatMessage,
} from "@/lib/chat-store";
import { isLinnéaOnline, getLinnéaInfo } from "@/lib/linnea-schedule";
import { checkRateLimit, getRateLimitRetryAfter } from "@/lib/rate-limiter";
import { verifyTurnstile } from "@/lib/turnstile-verify";

const GEMINI_KEY = process.env.GOOGLE_AI_STUDIO_KEY ?? "";
const GEMINI_MODEL = "gemini-2.0-flash";

const LINNEA_SYSTEM = `Du är Linnéa — en AI-affärsrådgivare på plattformen Affärsboost.
Du hjälper svenska egenföretagare, soloföretagare och småföretag.

Personlighet:
- Vänlig, direkt och konkret — aldrig fluffig
- Pratar svenska hela tiden
- Ger korta svar (max 3-4 meningar om det inte krävs mer)
- Hänvisar till Affärsboost-funktioner när det är relevant (mallar, veckonyhetsbrev, AI-coach)

Expertis:
- Svenska skatteregler, momsavdrag, F-skatt, A-skatt
- Startbidrag: ALMI, Tillväxtverket, Europeiska fonden, kommunala bidrag
- Avtalsmallar och juridik för småföretag
- Digital marknadsföring och SEO för svenska marknaden
- Prissättning, kundvård, tillväxtstrategier

Regler:
- Om du tillfrågas om du är en AI, svara alltid ärligt: "Ja, jag är en AI-assistent"
- Ge aldrig råd om specifika investeringar, medicin eller juridiska tvister
- Håll dig till affärsrelaterade frågor
- Om du inte vet svaret: säg det ärligt och hänvisa till rätt myndighet

Affärsboost-priser (om någon frågar): 299 kr/mån, ingen bindningstid.
Webbplats: affarsboost.se`;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

async function callGemini(history: ChatMessage[], newText: string): Promise<string> {
  if (!GEMINI_KEY) return "Linnéa är inte konfigurerad just nu — försök igen senare.";

  const contents = history
    .filter((m) => (m.role === "user" || m.role === "linnea") && !m.pending)
    .slice(-20)
    .map((m) => ({
      role: m.role === "linnea" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  contents.push({ role: "user", parts: [{ text: newText }] });

  const body = {
    system_instruction: { parts: [{ text: LINNEA_SYSTEM }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    console.error("Gemini error:", res.status, await res.text());
    return "Något gick fel — försök igen om en stund.";
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "Kunde inte generera svar.";
}

// GET — senaste meddelanden + Linnéas status
export async function GET() {
  const messages = getRecentMessages(80);
  const info = getLinnéaInfo();
  return NextResponse.json({ messages, linnea: info });
}

// POST — skicka meddelande
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit: max 30 meddelanden per IP per timme
  if (!checkRateLimit(`chat:${ip}`, 30)) {
    const retryAfter = getRateLimitRetryAfter(`chat:${ip}`);
    return NextResponse.json(
      { error: "För många meddelanden. Försök igen om en stund.", retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body?.content || typeof body.content !== "string") {
    return NextResponse.json({ error: "Saknar content" }, { status: 400 });
  }

  // Honeypot — bots fyller i detta fält, riktiga användare gör det inte
  if (body.website) {
    return NextResponse.json({ queued: true }); // tyst avvisa
  }

  // Turnstile-verifiering (krävs vid första meddelandet, dvs när firstMessage=true)
  if (body.firstMessage) {
    const valid = await verifyTurnstile(body.turnstileToken, ip);
    if (!valid) {
      return NextResponse.json(
        { error: "Verifiering misslyckades. Ladda om sidan och försök igen." },
        { status: 403 }
      );
    }
  }

  const userName: string = (body.name ?? "Anonym").slice(0, 40);
  const userContent: string = body.content.slice(0, 1000);

  const userMsg: ChatMessage = {
    id: generateId(),
    role: "user",
    name: userName,
    content: userContent,
    timestamp: new Date().toISOString(),
  };
  const msgs = appendMessage(userMsg);

  const online = isLinnéaOnline();

  if (!online) {
    const info = getLinnéaInfo();
    const offlineMsg: ChatMessage = {
      id: generateId(),
      role: "system",
      name: "System",
      content: `Linnéa är offline just nu. ${info.sublabel}. Ditt meddelande är sparat.`,
      timestamp: new Date().toISOString(),
    };
    appendMessage(offlineMsg);
    return NextResponse.json({ queued: true, info });
  }

  const pendingId = generateId();
  appendMessage({
    id: pendingId,
    role: "linnea",
    name: "Linnéa",
    content: "",
    timestamp: new Date().toISOString(),
    pending: true,
  });

  try {
    const reply = await callGemini(msgs, userContent);
    updateMessage(pendingId, { content: reply, pending: false });
    return NextResponse.json({ replied: true });
  } catch (err) {
    updateMessage(pendingId, {
      content: "Något gick fel. Försök igen om ett ögonblick.",
      pending: false,
    });
    console.error("Chat error:", err);
    return NextResponse.json({ replied: true, error: true });
  }
}
