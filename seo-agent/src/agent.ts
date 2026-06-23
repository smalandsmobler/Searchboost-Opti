import { OpenRouter } from '@openrouter/agent';
import { stepCountIs, maxCost } from '@openrouter/agent/stop-conditions';
import type { AgentConfig } from './config.js';
import { tools } from './tools/index.js';

export type AgentEvent =
  | { type: 'text'; delta: string }
  | { type: 'tool_call'; name: string; callId: string; args: Record<string, unknown> }
  | { type: 'tool_result'; name: string; callId: string; output: string }
  | { type: 'turn_end' }
  | { type: 'done'; usage: { inputTokens?: number; outputTokens?: number; totalTokens?: number } | null | undefined; durationMs: number };

export async function runAgent(
  config: AgentConfig,
  input: string,
  options?: { onEvent?: (event: AgentEvent) => void; signal?: AbortSignal },
) {
  const startedAt = Date.now();
  const client = new OpenRouter({ apiKey: config.apiKey });

  const result = client.callModel({
    model: config.model,
    instructions: config.systemPrompt.replace('{cwd}', process.cwd()),
    input,
    tools,
    stopWhen: [stepCountIs(config.maxSteps), maxCost(config.maxCost)],
  });

  const onAbort = () => result.cancel();
  options?.signal?.addEventListener('abort', onAbort);
  if (options?.signal?.aborted) result.cancel();

  let accumulatedText = '';

  try {
    if (options?.onEvent) {
      const callNames = new Map<string, string>();

      const streamText = async () => {
        for await (const delta of result.getTextStream()) {
          if (options?.signal?.aborted) break;
          options.onEvent!({ type: 'text', delta });
          accumulatedText += delta;
        }
      };

      const streamTools = async () => {
        for await (const item of result.getItemsStream()) {
          if (options?.signal?.aborted) break;
          if (item.type === 'function_call') {
            callNames.set(item.callId, item.name);
            if (item.status === 'completed') {
              const args = (() => { try { return item.arguments ? JSON.parse(item.arguments) : {}; } catch { return {}; } })();
              options.onEvent!({ type: 'tool_call', name: item.name, callId: item.callId, args });
            }
          } else if (item.type === 'function_call_output') {
            const out = typeof item.output === 'string' ? item.output : JSON.stringify(item.output);
            options.onEvent!({
              type: 'tool_result',
              name: callNames.get(item.callId) ?? 'unknown',
              callId: item.callId,
              output: out.length > 300 ? out.slice(0, 300) + '...' : out,
            });
            options.onEvent!({ type: 'turn_end' });
          }
        }
      };

      await Promise.all([streamText(), streamTools()]);
    }

    const response = await result.getResponse();
    const durationMs = Date.now() - startedAt;
    const text = accumulatedText || (response.outputText ?? '');
    options?.onEvent?.({ type: 'done', usage: response.usage, durationMs });
    return { text, usage: response.usage, durationMs };
  } finally {
    options?.signal?.removeEventListener('abort', onAbort);
  }
}

export async function runAgentWithRetry(
  config: AgentConfig,
  input: string,
  options?: { onEvent?: (event: AgentEvent) => void; signal?: AbortSignal; maxRetries?: number },
) {
  for (let attempt = 0, max = options?.maxRetries ?? 3; attempt <= max; attempt++) {
    let toolCallsMade = 0;
    const wrapped = {
      ...options,
      onEvent: (event: AgentEvent) => {
        if (event.type === 'tool_call') toolCallsMade++;
        options?.onEvent?.(event);
      },
    };
    try {
      return await runAgent(config, input, wrapped);
    } catch (err: any) {
      const s = err?.status ?? err?.statusCode;
      const retryable = s === 429 || (s >= 500 && s < 600);
      if (!retryable || attempt === max || toolCallsMade > 0) {
        // Fallback to secondary model on 429
        if (s === 429 && attempt === 0 && config.fallbackModel && config.fallbackModel !== config.model) {
          process.stderr.write(`[seo-agent] Rate limit på ${config.model}, byter till ${config.fallbackModel}\n`);
          const fallbackConfig = { ...config, model: config.fallbackModel };
          return await runAgent(fallbackConfig, input, options);
        }
        throw err;
      }
      const delay = Math.min(1000 * 2 ** attempt, 30000);
      process.stderr.write(`[seo-agent] Retry ${attempt + 1}/${max} om ${delay}ms...\n`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('Unreachable');
}
