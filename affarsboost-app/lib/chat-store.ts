/**
 * Enkel fil-baserad chat-lagring på EC2.
 * Håller max MAX_MESSAGES senaste meddelanden i minnet + flushes till disk.
 */

import fs from "fs";
import path from "path";

export type MessageRole = "user" | "linnea" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  name: string;      // Användarnamn eller "Linnéa"
  content: string;
  timestamp: string; // ISO
  pending?: boolean; // sant om Linnéa ännu ej svarat
}

const DATA_DIR =
  process.env.CHAT_DATA_PATH ??
  (process.env.NODE_ENV === "production"
    ? "/home/ubuntu/affarsboost-data"
    : "/tmp");

const CHAT_FILE = path.join(DATA_DIR, "chat-messages.json");
const MAX_MESSAGES = 500;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

let _cache: ChatMessage[] | null = null;
let _dirty = false;

export function loadMessages(): ChatMessage[] {
  if (_cache) return _cache;
  ensureDir();
  try {
    const raw = fs.readFileSync(CHAT_FILE, "utf-8");
    _cache = JSON.parse(raw) as ChatMessage[];
  } catch {
    _cache = [];
  }
  return _cache;
}

export function saveMessages(msgs: ChatMessage[]) {
  ensureDir();
  const trimmed = msgs.slice(-MAX_MESSAGES);
  fs.writeFileSync(CHAT_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
  _cache = trimmed;
}

export function appendMessage(msg: ChatMessage): ChatMessage[] {
  const msgs = loadMessages();
  msgs.push(msg);
  const trimmed = msgs.slice(-MAX_MESSAGES);
  saveMessages(trimmed);
  return trimmed;
}

export function updateMessage(id: string, patch: Partial<ChatMessage>): ChatMessage[] {
  const msgs = loadMessages();
  const idx = msgs.findIndex((m) => m.id === id);
  if (idx !== -1) {
    msgs[idx] = { ...msgs[idx], ...patch };
    saveMessages(msgs);
  }
  return msgs;
}

export function getRecentMessages(limit = 60): ChatMessage[] {
  return loadMessages().slice(-limit);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
