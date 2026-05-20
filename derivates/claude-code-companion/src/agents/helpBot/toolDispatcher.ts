// Capabilities-aware tool dispatch for the Help Bot (Scenario 1 v0.3).
//
// Two branches, branched at module-call time on `adapter.capabilities.nativeToolUse`:
//
//   nativeToolUse === true
//     → Hand the full HELP_BOT_TOOLS roster to the adapter with
//       `toolChoice: 'auto'` and let the model emit tool_use blocks. Each
//       block is dispatched against `TOOL_RUNNERS`.
//
//   nativeToolUse === false
//     → Ask the adapter for free-form text, then run `extractToolRequest`
//       (the shared JSON-in-prose parser from src/agents/schemas/parse.ts).
//       Wrap in `retryWithFeedback` so one bad payload becomes a corrective
//       second attempt rather than a silent fail-exit (TS 4.4).
//
// This file is the *new* code path described in the Scenario 1 v0.3 plan
// (task 6). The legacy regex path inside coordinator.ts still runs FIRST —
// this dispatcher provides an additional model-driven layer that augments,
// not replaces, the regex routing.

import { getAdapter } from '@/sdk';
// IMPORTANT: import helpBot specs DIRECTLY from `./tools` rather than the
// central `../tools/registry`. The registry re-exports BOTH helpBot AND
// tutor researcher specs — routing through it pulls
// `tutor/tools/sourceIndex` (and its ~190 KB of bundled `src/**` content)
// into every route that mounts the Help Bot. AppShell mounts the Help Bot
// globally, so this would leak the source-index weight out of the `/tutor`
// route split. The Scenario 4 bundle-size budget exists to prevent that.
import { helpBotToolSpecs as HELP_BOT_TOOLS } from './tools';
import {
  getLesson,
  checkProgress,
  lookupQuizAttempts,
  recordWeakSpot,
  escalateToDocs,
} from './tools';
import { extractToolRequest, retryWithFeedback } from '../schemas/parse';
import type { ToolResponse } from '../tools/types';

type AnyResponse = ToolResponse<unknown>;

/** Map from MCP-grade snake_case tool name to its TS implementation.
 *  Casts at the boundary are `unknown`-mediated — by the time we run a tool we
 *  trust the model's input only structurally; runtime validation belongs to the
 *  tool itself (every tool here rejects malformed input with a `validation`
 *  error, never a throw). */
const TOOL_RUNNERS: Record<string, (input: Record<string, unknown>) => AnyResponse> = {
  get_lesson: (i) => getLesson(i as unknown as Parameters<typeof getLesson>[0]),
  check_progress: () => checkProgress(),
  lookup_quiz_attempts: (i) =>
    lookupQuizAttempts(i as unknown as Parameters<typeof lookupQuizAttempts>[0]),
  record_weak_spot: (i) =>
    recordWeakSpot(i as unknown as Parameters<typeof recordWeakSpot>[0]),
  escalate_to_docs: (i) =>
    escalateToDocs(i as unknown as Parameters<typeof escalateToDocs>[0]),
};

export interface DispatchedCall {
  name: string;
  input: Record<string, unknown>;
  response: AnyResponse;
}

export interface DispatchResult {
  /** All tool runs executed during this turn (in order). */
  calls: DispatchedCall[];
  /** Free-form text the model produced alongside / before the tool_use blocks. */
  modelText: string;
  /** Which branch ran — useful for the under-the-hood and the limited badge. */
  branch: 'native_tool_use' | 'json_in_prose' | 'no_model_dispatch';
}

/**
 * Run the model-driven dispatch path. Returns an empty `calls` array (and
 * `branch: 'no_model_dispatch'`) if the model produced neither a tool_use
 * block nor a parseable JSON-in-prose tool request — the coordinator then
 * falls back to its regex routing for the final answer.
 */
export async function dispatchTools(prompt: string): Promise<DispatchResult> {
  const adapter = getAdapter();

  if (adapter.capabilities.nativeToolUse) {
    return dispatchNative(prompt);
  }
  return dispatchJsonInProse(prompt);
}

async function dispatchNative(prompt: string): Promise<DispatchResult> {
  const adapter = getAdapter();
  const res = await adapter.createMessage({
    system:
      'You are the in-app Help Bot. Use the provided tools to look up lessons, ' +
      'progress, quiz attempts, weak spots, or to escalate to the docs. Prefer ' +
      'specific tools over free-form text.',
    messages: [{ role: 'user', content: prompt }],
    tools: HELP_BOT_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema,
    })),
    toolChoice: 'auto',
  });

  const uses = res.toolUses ?? [];
  if (uses.length === 0) {
    return { calls: [], modelText: res.text, branch: 'no_model_dispatch' };
  }
  const calls: DispatchedCall[] = uses.map((use) => {
    const runner = TOOL_RUNNERS[use.name];
    if (!runner) {
      return {
        name: use.name,
        input: use.input,
        response: {
          isError: true,
          errorCategory: 'permission',
          isRetryable: false,
          message: `Tool "${use.name}" is not in the Help Bot roster.`,
        },
      };
    }
    return { name: use.name, input: use.input, response: runner(use.input) };
  });
  return { calls, modelText: res.text, branch: 'native_tool_use' };
}

async function dispatchJsonInProse(prompt: string): Promise<DispatchResult> {
  const adapter = getAdapter();
  // Wrap the model call inside retryWithFeedback so a malformed JSON payload
  // becomes a corrective second attempt (TS 4.4) rather than a silent miss.
  const validated = await retryWithFeedback<{
    name: string;
    input: Record<string, unknown>;
  }>(
    async (feedback) => {
      const messages = [
        {
          role: 'user' as const,
          content: feedback ? `${prompt}\n\n${feedback}` : prompt,
        },
      ];
      const r = await adapter.createMessage({
        system:
          'You are the in-app Help Bot. When a tool is appropriate, respond with ' +
          'a single JSON object `{ "tool": "<snake_case_name>", "input": { … } }`. ' +
          'Otherwise respond with plain text. Available tools: ' +
          HELP_BOT_TOOLS.map((t) => t.name).join(', ') +
          '.',
        messages,
      });
      return r.text;
    },
    (raw) => {
      const req = extractToolRequest(raw);
      if (!req) return new Error('No JSON tool-request object found in response.');
      if (!TOOL_RUNNERS[req.name]) {
        return new Error(
          `Unknown tool "${req.name}". Allowed: ${Object.keys(TOOL_RUNNERS).join(', ')}.`,
        );
      }
      return req;
    },
    1, // one retry — keep latency bounded on the fallback path
  );

  if (validated instanceof Error) {
    return { calls: [], modelText: '', branch: 'no_model_dispatch' };
  }

  const runner = TOOL_RUNNERS[validated.name];
  const response = runner(validated.input);
  return {
    calls: [{ name: validated.name, input: validated.input, response }],
    modelText: '',
    branch: 'json_in_prose',
  };
}
