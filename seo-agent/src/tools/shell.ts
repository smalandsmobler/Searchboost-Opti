import { tool } from '@openrouter/agent/tool';
import { z } from 'zod';

export const shellTool = tool({
  name: 'shell',
  description: 'Kör ett shell-kommando och returnera stdout/stderr. Använd för curl-anrop mot WP REST API och Searchboost API.',
  inputSchema: z.object({
    command: z.string().describe('Shell-kommando att köra'),
    timeout: z.number().optional().default(30000).describe('Timeout i ms (default 30s)'),
  }),
  execute: async ({ command, timeout = 30000 }) => {
    const proc = Bun.spawn(['bash', '-c', command], {
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const timer = setTimeout(() => proc.kill(), timeout);

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);

    clearTimeout(timer);

    return {
      exitCode,
      stdout: stdout.slice(0, 8000),
      stderr: stderr.slice(0, 2000),
      ...(exitCode !== 0 && { error: `Avslutade med kod ${exitCode}` }),
    };
  },
});
