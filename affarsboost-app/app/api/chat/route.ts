import { NextRequest, NextResponse } from "next/server";
import {
  appendMessage,
  updateMessage,
  getRecentMessages,
  generateId,
  type ChatMessage,
} from "@/lib/chat-store";
import { isLinnéaOnline, getLinnéaInfo } from "@/lib/linnea-schedule";

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

async function callGemini(userMessages: ChatMessage[], newUserText: string): Promise<string> {
  if (!GEMINI_KEY) return "Linnéa är inte konfigurerad just nu.";

  // Bygg konversationshistorik (max 10 senaste par)
  const history = userMessages
    .filter((m) => m.role === "user" || m.role === "linnea")
    .slice(-20)
    .map((m) => ({
      role: m.role === "linnea" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  history.push({ role: "user", parts: [{ text: newUserText }] });

  const body = {
    system_instruction: { parts: [{ text: LINNEA_SYSTEM }] },
    contents: history,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512,
    },
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
    console.error("Gemini error:", await res.text());
    return "Något gick fel — försök igen om en stund.";
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "Kunde inte generera svar.";
}

// GET — hämta senaste meddelanden + Linnéas status
export async function GET() {
  const messages = getRecentMessages(80);
  const info = getLinnéaInfo();
  return NextResponse.json({ messages, linnea: info });
}

// POST — skicka nytt meddelande
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.content || typeof body.content !== "string") {
    return NextResponse.json({ error: "Saknar content" }, { status: 400 });
  }

  const userName: string = (body.name ?? "Anonym").slice(0, 40);
  const userContent: string = body.content.slice(0, 1000);

  // Spara användarmeddelandet
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
    // Linnéa offline — spara ett systemmeddelande om nästa online-tid
    const info = getLinnéaInfo();
    const offlineMsg: ChatMessage = {
      id: generateId(),
      role: "system",
      name: "System",
      content: `Linnéa är offline just nu. ${info.sublabel}. Ditt meddelande är sparat och besvaras när Linnéa är online igen.`,
      timestamp: new Date().toISOString(),
    };
    appendMessage(offlineMsg);
    return NextResponse.json({ queued: true, info });
  }

  // Linnéa online — generera svar
  const pendingId = generateId();
  const pendingMsg: ChatMessage = {
    id: pendingId,
    role: "linnea",
    name: "Linnéa",
    content: "",
    timestamp: new Date().toISOString(),
    pending: true,
  };
  appendMessage(pendingMsg);

  // Kalla Gemini asynkront (men vänta på svaret i samma request för enkelhet)
  try {
    const replyText = await callGemini(msgs, userContent);
    updateMessage(pendingId, { content: replyText, pending: false });
    return NextResponse.json({ replied: true, content: replyText });
  } catch (err) {
    updateMessage(pendingId, {
      content: "Något gick fel just nu. Försök igen om ett ögonblick.",
      pending: false,
    });
    console.error("Chat error:", err);
    return NextResponse.json({ replied: true, error: true });
  }
}
