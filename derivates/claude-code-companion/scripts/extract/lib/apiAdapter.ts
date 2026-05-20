// API adapter — wraps `src/sdk/realAdapter.ts` to drive the extraction pipeline
// against the real Anthropic Messages API.
//
// Mirrors the shape and conventions of `fixtureAdapter.ts` (same `ExtractAdapter`
// surface) so the orchestrator picks the adapter purely by env var without
// branching anywhere else. The fixture remains the regression baseline (CLAUDE.md
// rule 6 in scripts/extract/CLAUDE.md); this adapter is the live path.
//
// Architect mandates honoured:
//   - TS 4.3 — extraction goes through tool_use. `realAdapter` builds a single
//     forced `extract` tool from `opts.jsonSchema` and reads the `input` off
//     the resulting `tool_use` block. No free-text parsing on the happy path.
//   - TS 4.4 — the orchestrator wraps this in a bounded retry loop, threading
//     Ajv error paths back as `opts.feedback`.
//
// API key resolution: `ANTHROPIC_API_KEY` only. We deliberately do NOT silently
// fall back to a fixture when the key is missing — that would hide the failure
// in a hard-to-debug way for someone running `EXTRACT_ADAPTER=api npm run extract`.

import { createRealAdapter } from '../../../src/sdk/realAdapter';
import type { Message } from '../../../src/sdk/types';
import type { ExtractAdapter, FewShotExample } from './types';

export function createApiAdapter(): ExtractAdapter {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'apiAdapter: ANTHROPIC_API_KEY is not set. Either export it in your shell or run with EXTRACT_ADAPTER=fixture (the v0.2 default).',
    );
  }
  const real = createRealAdapter(apiKey);

  return {
    kind: 'api',
    label: 'Anthropic SDK (extraction)',
    async extract(opts: {
      system: string;
      user: string;
      schema: Record<string, unknown>;
      fewShot: FewShotExample[];
      sourceId: string;
      feedback?: string;
    }): Promise<unknown> {
      const userContent = opts.feedback
        ? `${opts.user}\n\n--- VALIDATION FEEDBACK (retry) ---\n${opts.feedback}\n--- END FEEDBACK ---`
        : opts.user;

      const messages: Message[] = [{ role: 'user', content: userContent }];

      const res = await real.createMessage({
        system: opts.system,
        messages,
        jsonSchema: opts.schema,
        fewShot: opts.fewShot,
        toolChoice: { type: 'tool', name: 'extract' },
      });

      if (res.data === undefined) {
        throw new Error(
          `apiAdapter: real adapter returned no structured data for sourceId="${opts.sourceId}" (stopReason=${res.stopReason}). Expected a tool_use block named "extract".`,
        );
      }
      return res.data;
    },
  };
}
