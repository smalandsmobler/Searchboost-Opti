#!/usr/bin/env bun
import { parseArgs } from 'util';
import { loadConfig } from './config.js';
import { runAgentWithRetry, type AgentEvent } from './agent.js';
import { initSessionDir, saveMessage, newSessionPath } from './session.js';

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  options: {
    'no-session': { type: 'boolean' },
    site: { type: 'string', short: 's' },
    json: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
  },
  allowPositionals: true,
  strict: false,
});

if (values.help) {
  process.stdout.write(`Searchboost SEO Agent

Användning:
  seo-agent [alternativ] "<prompt>"
  echo "<prompt>" | seo-agent

Alternativ:
  -s, --site <slug>   Kör direkt mot en kund (t.ex. mobelrondellen)
  --json              Skriv ut NDJSON-händelseström
  --no-session        Spara inte session
  -h, --help          Visa hjälp

Exempel:
  seo-agent "Analysera SEO på mobelrondellen"
  seo-agent -s jelmtech "Fixa saknade meta-descriptions"
  seo-agent "Uppdatera alt-text på alla bilder för humanpower"
`);
  process.exit(0);
}

const config = loadConfig();
const sessionEnabled = config.sessionEnabled && !values['no-session'];

let prompt = positionals.join(' ').trim();
if (!prompt && !process.stdin.isTTY) {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  prompt = Buffer.concat(chunks).toString('utf-8').trim();
}

if (!prompt) {
  process.stderr.write('Fel: Ingen prompt angiven. Kör seo-agent --help för hjälp.\n');
  process.exit(1);
}

// Prepend site slug if --site is given
if (values.site) {
  prompt = `Site: ${values.site}\n\n${prompt}`;
}

// Session
let sessionPath = '';
if (sessionEnabled) {
  initSessionDir(config.sessionDir);
  sessionPath = newSessionPath(config.sessionDir);
  saveMessage(sessionPath, { role: 'user', content: prompt });
}

const emitJson = (obj: object) => process.stdout.write(JSON.stringify(obj) + '\n');

const onEvent = (event: AgentEvent) => {
  if (values.json) {
    emitJson(event);
    return;
  }
  switch (event.type) {
    case 'text':
      process.stdout.write(event.delta);
      break;
    case 'tool_call':
      process.stderr.write(`\n[${event.name}] ${JSON.stringify(event.args).slice(0, 120)}\n`);
      break;
    case 'tool_result':
      process.stderr.write(`  → ${event.output.slice(0, 150)}\n`);
      break;
    case 'turn_end':
      process.stderr.write('\n');
      break;
    case 'done':
      if (event.usage) {
        const t = event.usage.totalTokens ?? ((event.usage.inputTokens ?? 0) + (event.usage.outputTokens ?? 0));
        process.stderr.write(`\n[seo-agent] Klart på ${(event.durationMs / 1000).toFixed(1)}s | ${t} tokens\n`);
      }
      break;
  }
};

try {
  const result = await runAgentWithRetry(config, prompt, { onEvent });

  if (sessionEnabled && result.text) {
    saveMessage(sessionPath, { role: 'assistant', content: result.text });
  }

  if (!values.json) process.stdout.write('\n');
  process.exit(0);
} catch (err: any) {
  process.stderr.write(`[seo-agent] Fel: ${err?.message ?? err}\n`);
  process.exit(1);
}
