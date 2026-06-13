import { mkdirSync, writeFileSync, appendFileSync, existsSync } from 'fs';
import { join } from 'path';

export type Message = { role: 'user' | 'assistant' | 'system'; content: string };

export function initSessionDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function newSessionPath(dir: string): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return join(dir, `session-${ts}.jsonl`);
}

export function saveMessage(path: string, msg: Message): void {
  appendFileSync(path, JSON.stringify(msg) + '\n');
}
