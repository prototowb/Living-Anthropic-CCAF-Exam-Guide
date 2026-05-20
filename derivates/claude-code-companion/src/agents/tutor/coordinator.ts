// The Tutor — hub-and-spoke coordinator
// (Architect Scenario 3 — Multi-Agent Research System).
//
//   • allowedTools MUST include 'Task' (asserted at module load)
//   • independent subagents dispatched via dispatchAllSettled (v0.2 fix —
//     TS 5.3 mandates error propagation that does NOT reject the whole turn
//     on a single spoke failure; Promise.all was the anti-pattern).
//   • Capabilities flag → serial fallback on small local models (v0.3 story).
//   • every turn writes a one-line finding to the scratchpad
//   • all tool outputs pass through the context pruner before merge

import { getAdapter } from '@/sdk';
import type { AdapterCapabilities } from '@/sdk/types';
import { intentSchema, type IntentResult } from './schemas/intentClassification';
import {
  ROUTE_INTENT_FEWSHOT,
  SYSTEM_PROMPT,
  type TutorSubagentName,
} from './prompts/fewShot';
import { subagentRegistry, type SubagentInvocation } from './subagents';
import { tutorScratchpad } from '../scratchpad';
import { prune } from '../contextPruner';
import { dispatchAllSettled, describeError } from './dispatch';
import { extractFirstJsonObject, retryWithFeedback } from '@/agents/schemas';

export const ALLOWED_TOOLS = ['Task', 'Read', 'Grep'] as const;
export type AllowedTool = (typeof ALLOWED_TOOLS)[number];

if (!ALLOWED_TOOLS.includes('Task' as AllowedTool)) {
  throw new Error(
    "Tutor misconfiguration: allowedTools MUST include 'Task' so it can spawn subagents.",
  );
}

export interface SpokeFailure {
  /** Name of the subagent whose invocation threw. */
  name: TutorSubagentName;
  /** Human-readable error from `describeError`. */
  message: string;
}

export interface TutorTurn {
  reply: string;
  subagents: SubagentInvocation[];
  rationale: string;
  totalMs: number;
  parallel: boolean;
  adapterKind: string;
  /** v0.3: snapshot of the dispatching adapter's capabilities so the UI can
   *  render `<CapabilitiesBadge>` per turn — capabilities can change mid
   *  session (real ↔ mock ↔ webllm) and old turns must keep their original
   *  meta intact rather than retroactively re-rendering. */
  capabilities: AdapterCapabilities;
  /** v0.3: human-readable adapter label (e.g. "Mock (scripted)"). */
  adapterLabel: string;
  /** v0.2 (SYNTHESIS.md S-3): when one or more spokes fail, the others still
   *  return — and the UI surfaces this list as a footer. Empty array on a
   *  fully successful turn. */
  errors: SpokeFailure[];
}

const VALID_SUBAGENT_NAMES = new Set<TutorSubagentName>([
  'explainer',
  'quizmaster',
  'codebase-researcher',
  'doc-synthesiser',
]);

/** Validate raw intent JSON against the `IntentResult` shape. Returns either
 *  the validated object or a feedback-friendly `Error`. */
function validateIntent(raw: unknown): IntentResult | Error {
  if (!raw || typeof raw !== 'object') {
    return new Error('Response was not a JSON object.');
  }
  const rec = raw as Record<string, unknown>;
  if (!Array.isArray(rec.subagents)) {
    return new Error('Missing required `subagents` array.');
  }
  if (rec.subagents.length < 1) {
    return new Error('`subagents` must contain at least one name.');
  }
  for (const name of rec.subagents) {
    if (typeof name !== 'string' || !VALID_SUBAGENT_NAMES.has(name as TutorSubagentName)) {
      return new Error(
        `Invalid subagent name "${String(name)}". Allowed: explainer, quizmaster, codebase-researcher, doc-synthesiser.`,
      );
    }
  }
  if (typeof rec.rationale !== 'string') {
    return new Error('Missing required `rationale` string.');
  }
  return { subagents: rec.subagents as IntentResult['subagents'], rationale: rec.rationale };
}

async function classifyIntent(prompt: string): Promise<{
  subagents: TutorSubagentName[];
  rationale: string;
  confidence: number;
}> {
  const adapter = getAdapter();

  // v0.3 — schemaMode false path. The adapter cannot honour `jsonSchema`
  // (small local model, mock-unreliable, …) so we parse JSON-in-prose from
  // the free-form reply and retry with feedback on validation failure.
  // SYNTHESIS.md §S-6: this is the canonical fallback shape; the helpBot,
  // codebase-researcher, and content pipeline all reuse the same primitive.
  if (!adapter.capabilities.schemaMode) {
    const call = async (feedback?: string): Promise<string> => {
      const systemPrompt = feedback ? `${SYSTEM_PROMPT}\n\n${feedback}` : SYSTEM_PROMPT;
      const res = await adapter.createMessage({
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        fewShot: ROUTE_INTENT_FEWSHOT.map((ex) => ({
          user: ex.user,
          assistant: JSON.stringify({ subagents: ex.subagents, rationale: ex.rationale }),
        })),
      });
      return res.text;
    };

    const validate = (raw: string): IntentResult | Error => {
      const parsed = extractFirstJsonObject(raw);
      if (parsed === null) {
        return new Error('No JSON object found in response.');
      }
      return validateIntent(parsed);
    };

    const result = await retryWithFeedback<IntentResult>(call, validate, 2);
    if (result instanceof Error) {
      // Exhausted — degrade to the safe default. The `low_confidence`
      // rationale is load-bearing: helpBot's escalation hook (shared via
      // `src/agents/escalation.ts`) will be able to read it later.
      return {
        subagents: ['explainer'],
        rationale: 'low_confidence',
        confidence: 0.3,
      };
    }
    return { ...result, confidence: 0.6 };
  }

  // Schema-mode path — the adapter honours `jsonSchema` and returns parsed
  // `data` on success. This is the canonical Scenario 6 happy path.
  const res = await adapter.createMessage<IntentResult>({
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
    jsonSchema: intentSchema as unknown as Record<string, unknown>,
    fewShot: ROUTE_INTENT_FEWSHOT.map((ex) => ({
      user: ex.user,
      assistant: JSON.stringify({ subagents: ex.subagents, rationale: ex.rationale }),
    })),
  });

  if (res.data) {
    return { ...res.data, confidence: 0.9 };
  }
  return {
    subagents: ['explainer'],
    rationale: 'low_confidence',
    confidence: 0.3,
  };
}

export const tutor = {
  allowedTools: ALLOWED_TOOLS,

  async handle(prompt: string): Promise<TutorTurn> {
    const t0 = performance.now();
    const adapter = getAdapter();
    const intent = await classifyIntent(prompt);

    // Capabilities-aware dispatch.
    // Architect Scenario 3 mandate: parallel when possible.
    // Local-model story (v0.3): serial fallback when capability is false.
    const canParallel =
      adapter.capabilities.parallelSubagents && intent.subagents.length > 1;

    // v0.2 (SYNTHESIS.md S-3 / TS 5.3): dispatchAllSettled, never Promise.all.
    // A single spoke failure must not reject the whole turn — partial replies
    // are valuable, and the surface renders a "[N spoke(s) failed]" footer.
    const { invocations, errors } = canParallel
      ? await runParallel(intent.subagents, prompt)
      : await runSerial(intent.subagents, prompt);

    // Prune verbose tool outputs.
    const pruned = invocations.map((inv) => ({
      ...inv,
      toolCalls: inv.toolCalls.map((tc) => ({
        name: tc.name,
        input: prune(tc.input),
      })),
    }));

    const baseReply = pruned
      .map((inv) => `**[${inv.name}]**\n\n${inv.output}`)
      .join('\n\n---\n\n');

    const failureFooter =
      errors.length > 0
        ? `\n\n---\n\n> _${errors.length} spoke${errors.length > 1 ? 's' : ''} failed: ${errors
            .map((e) => `**${e.name}** — ${e.message}`)
            .join('; ')}._`
        : '';

    const reply =
      pruned.length === 0
        ? `> _All ${errors.length} spoke${errors.length > 1 ? 's' : ''} failed this turn. Try again, or rephrase the question._${failureFooter}`
        : baseReply + failureFooter;

    tutorScratchpad.append(
      `q: "${prompt.slice(0, 60)}…" → [${intent.subagents.join(', ')}] (${
        canParallel ? 'parallel' : 'serial'
      })${errors.length ? ` errors=${errors.length}` : ''}`,
    );

    return {
      reply,
      subagents: pruned,
      rationale: intent.rationale,
      totalMs: Math.round(performance.now() - t0),
      parallel: canParallel,
      adapterKind: adapter.kind,
      capabilities: { ...adapter.capabilities },
      adapterLabel: adapter.label,
      errors,
    };
  },
};

async function runParallel(
  names: TutorSubagentName[],
  prompt: string,
): Promise<{ invocations: SubagentInvocation[]; errors: SpokeFailure[] }> {
  const outcome = await dispatchAllSettled(
    names.map((name) => () => subagentRegistry[name](prompt)),
  );
  return {
    invocations: outcome.results,
    errors: outcome.errors.map((e) => ({
      name: names[e.index],
      message: describeError(e.error),
    })),
  };
}

async function runSerial(
  names: TutorSubagentName[],
  prompt: string,
): Promise<{ invocations: SubagentInvocation[]; errors: SpokeFailure[] }> {
  const invocations: SubagentInvocation[] = [];
  const errors: SpokeFailure[] = [];
  for (const name of names) {
    try {
      invocations.push(await subagentRegistry[name](prompt));
    } catch (e) {
      errors.push({ name, message: describeError(e) });
    }
  }
  return { invocations, errors };
}
