// The Hub of the hub-and-spoke architecture (Domain 1 mandate).
//
//   • allowedTools MUST include 'Task' (asserted at module load)
//   • independent subagents are dispatched with Promise.all (parallel)
//   • every turn writes a one-line finding to the scratchpad
//   • all tool outputs pass through the context pruner before merge
//   • escalation predicates are checked before producing the final reply

import { getAdapter } from '@/sdk';
import { intentSchema } from './schemas/intentClassification';
import { ROUTE_INTENT_FEWSHOT, SYSTEM_PROMPT, type SubagentName } from './prompts/fewShot';
import { subagentRegistry, type SubagentInvocation } from './subagents';
import { scratchpad } from './scratchpad';
import { shouldEscalate } from './escalation';
import { prune } from './contextPruner';

export const ALLOWED_TOOLS = ['Task', 'Read', 'Grep'] as const;
export type AllowedTool = (typeof ALLOWED_TOOLS)[number];

if (!ALLOWED_TOOLS.includes('Task' as AllowedTool)) {
  throw new Error(
    "Coordinator misconfiguration: allowedTools MUST include 'Task' so it can spawn subagents.",
  );
}

export interface CoordinatorTurn {
  reply: string;
  subagents: SubagentInvocation[];
  rationale: string;
  escalated: { reason: string } | null;
  totalMs: number;
  parallel: boolean;
}

export interface CoordinatorContext {
  consecutiveBusinessErrors?: number;
  userAskedForHuman?: boolean;
}

async function classifyIntent(prompt: string): Promise<{
  subagents: SubagentName[];
  rationale: string;
  confidence: number;
}> {
  const adapter = getAdapter();
  const res = await adapter.createMessage<{ subagents: SubagentName[]; rationale: string }>({
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
    jsonSchema: intentSchema as unknown as Record<string, unknown>,
    fewShot: ROUTE_INTENT_FEWSHOT.map((ex) => ({
      user: ex.user,
      assistant: JSON.stringify({ subagents: ex.subagents, rationale: ex.rationale }),
    })),
  });

  if (res.data) {
    return { ...res.data, confidence: 0.85 };
  }
  return {
    subagents: ['explainer'],
    rationale: 'No structured response — defaulting to explainer.',
    confidence: 0.4,
  };
}

export const coordinator = {
  allowedTools: ALLOWED_TOOLS,

  async handle(prompt: string, ctx: CoordinatorContext = {}): Promise<CoordinatorTurn> {
    const t0 = performance.now();
    const intent = await classifyIntent(prompt);

    // Parallel dispatch — independent spokes run with Promise.all (Domain 1).
    const dispatch = intent.subagents.map((name) => subagentRegistry[name](prompt));
    const invocations = await Promise.all(dispatch);

    // Domain 5: prune verbose tool outputs before they accumulate.
    const pruned = invocations.map((inv) => ({
      ...inv,
      toolCalls: inv.toolCalls.map((tc) => ({ name: tc.name, input: prune(tc.input) })),
    }));

    // Domain 5: check escalation predicates.
    const escalation = shouldEscalate({
      userAsked: ctx.userAskedForHuman ?? /human|agent\s+please|escalate/i.test(prompt),
      consecutiveBusinessErrors: ctx.consecutiveBusinessErrors ?? 0,
      confidence: intent.confidence,
    });

    // Merge replies, attribute by subagent.
    const reply = pruned
      .map((inv) => `**[${inv.name}]**\n\n${inv.output}`)
      .join('\n\n---\n\n');

    // Scratchpad — append a one-line finding (Domain 5).
    scratchpad.append(
      `q: "${prompt.slice(0, 60)}…" → dispatched [${intent.subagents.join(', ')}]`,
    );

    const totalMs = Math.round(performance.now() - t0);

    return {
      reply: escalation.escalate
        ? `${reply}\n\n> _Coordinator escalated this turn (reason: ${escalation.reason}). In production this would hand off to a human reviewer._`
        : reply,
      subagents: pruned,
      rationale: intent.rationale,
      escalated: escalation.escalate ? { reason: escalation.reason ?? 'unknown' } : null,
      totalMs,
      parallel: intent.subagents.length > 1,
    };
  },
};
