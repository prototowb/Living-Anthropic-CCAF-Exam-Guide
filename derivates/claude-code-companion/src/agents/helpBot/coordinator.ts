// Help Bot — sidebar agent (Architect Scenario 1 — Customer Support Resolution).
//
// Resolves "where do I go for X?" beginner questions. Uses granular MCP-shaped
// tools that return ToolResponse<T> (never throw). Falls through to an explicit
// escalation when confidence is low or two consecutive business errors occur.

import { getLesson, checkProgress, escalateToDocs } from './tools';
import { shouldEscalate, ESCALATION_FEWSHOT } from '../escalation';
import { helpBotScratchpad } from '../scratchpad';
import { dispatchTools, type DispatchResult } from './toolDispatcher';
import type { ToolResponse, ErrorCategory } from '../tools/types';

export interface ToolCallRecord {
  name: string;
  input: Record<string, unknown>;
  ok: boolean;
  /** Widened in v0.2 (SYNTHESIS.md S-1): surfaces error category + retryability
   *  so the sidebar can show the right affordance (retry vs alternate-question). */
  errorCategory?: ErrorCategory;
  isRetryable?: boolean;
}

export interface HelpBotReply {
  text: string;
  toolCalls: ToolCallRecord[];
  escalated: { reason: string; docUrl?: string; docTitle?: string } | null;
  /** v0.3 — three-strikes telemetry (Architect Scenario 1 TS 5.2).
   *  Counts consecutive `business` errors across recent turns. Surfaced in
   *  the sidebar footer as "escalation budget: N/2" so the learner can see
   *  how close they are to a forced escalation. */
  consecutiveBusinessErrors: number;
  /** v0.3 — which dispatch branch ran. `null` when no model dispatch fired
   *  (regex routing alone). */
  dispatchBranch: DispatchResult['branch'] | null;
}

const NAV = [
  { keywords: ['quiz', 'question', 'test'], route: '/quiz', label: 'Quizzes' },
  { keywords: ['lesson', 'practice', 'reorder', 'blank'], route: '/lessons', label: 'Lessons' },
  { keywords: ['sandbox', 'repl', 'try', 'demo'], route: '/sandboxes', label: 'Sandboxes' },
  { keywords: ['atlas', 'map', 'concept'], route: '/atlas', label: 'Concept Atlas' },
  { keywords: ['stage', 'learn', 'start', 'begin'], route: '/learn', label: 'Stages' },
  { keywords: ['progress', 'how am i', 'doing'], route: '/', label: 'Home (progress)' },
  { keywords: ['tutor', 'chat'], route: '/tutor', label: 'Claude Tutor' },
] as const;

function matchNav(prompt: string) {
  const lower = prompt.toLowerCase();
  return NAV.find((entry) => entry.keywords.some((k) => lower.includes(k)));
}

let _consecutiveBusinessErrors = 0;

/** Escalation budget (architect mandate — repeated business errors trigger
 *  a forced escalation). `shouldEscalate` uses `>= 2` consecutive errors. */
export const ESCALATION_BUDGET_MAX = 2;

export const helpBot = {
  /** Surfaced in the UI so the Help Bot sidebar can render its tool roster.
   *  v0.2 + v0.3 widened — the roster now matches `HELP_BOT_TOOLS`. */
  toolNames: [
    'getLesson',
    'checkProgress',
    'lookupQuizAttempts',
    'recordWeakSpot',
    'escalateToDocs',
  ] as const,

  /** Live read of the consecutive-business-error counter — for under-the-hood. */
  get escalationBudgetUsed(): number {
    return _consecutiveBusinessErrors;
  },

  escalationBudgetMax: ESCALATION_BUDGET_MAX,

  async handle(prompt: string): Promise<HelpBotReply> {
    const toolCalls: ToolCallRecord[] = [];
    const userAskedHuman = /\b(human|person|someone real|talk to a|connect me)\b/i.test(prompt);

    // 1) Nav-only intents: short-circuit (no tool call needed).
    const navHit = matchNav(prompt);
    let navAnswer = '';
    if (navHit) {
      navAnswer = `That's at **${navHit.label}** (\`${navHit.route}\`).`;
    }

    // 2) Progress questions → checkProgress tool.
    let progressAnswer = '';
    if (/\bprogress|how am i|next\b/i.test(prompt)) {
      const res = checkProgress();
      toolCalls.push(recordCall('checkProgress', {}, res));
      if (!res.isError) {
        const next = res.data.nextStageId
          ? ` Next up: \`/learn/${res.data.nextStageId}\`.`
          : ` You\'ve finished every stage.`;
        progressAnswer = `You've completed ${res.data.stagesCompleted}/${res.data.stagesTotal} stages and ${res.data.lessonsCompleted} lessons.${next}`;
      }
    }

    // 3) Specific-lesson questions → getLesson tool with a query.
    let lessonAnswer = '';
    const lessonMatch = prompt.match(/lesson(?:\s+(?:about|on))?\s+(.+?)(?:\?|$|\.)/i);
    let lessonBusinessError = false;
    if (lessonMatch) {
      const query = lessonMatch[1].trim();
      const res = getLesson({ query });
      toolCalls.push(recordCall('getLesson', { query }, res));
      lessonAnswer = formatLessonAnswer(res);
      // Only `business` errors count against the escalation budget — the user's
      // input was valid but no real-world match exists. `validation` errors
      // (multi-match) are NOT counted: they are a clarification request that
      // would be resolved on the next turn.
      lessonBusinessError = res.isError && res.errorCategory === 'business';
    }
    if (lessonBusinessError) _consecutiveBusinessErrors++;
    else _consecutiveBusinessErrors = 0;

    // 4) Capabilities-aware model dispatch (v0.3 / SYNTHESIS.md S-6).
    //    When the adapter supports native tool_use, the model can pick from
    //    the full HELP_BOT_TOOLS roster (e.g. lookup_quiz_attempts on a "how
    //    did I do on s2?" prompt). When it doesn't, a JSON-in-prose retry
    //    loop covers the gap. Either branch augments the regex routing
    //    above — it does not replace it.
    let dispatchBranch: DispatchResult['branch'] | null = null;
    try {
      const dispatched = await dispatchTools(prompt);
      dispatchBranch = dispatched.branch;
      for (const call of dispatched.calls) {
        toolCalls.push(recordCall(call.name, call.input, call.response));
      }
    } catch {
      // Adapter or dispatcher failure must never break the turn — the regex
      // routing has already produced an answer.
      dispatchBranch = null;
    }

    // 5) Compose, with explicit escalation when warranted.
    const parts = [navAnswer, progressAnswer, lessonAnswer].filter(Boolean);
    const confidence = parts.length > 0 ? 0.85 : 0.3;

    const escalation = shouldEscalate({
      userAsked: userAskedHuman,
      consecutiveBusinessErrors: _consecutiveBusinessErrors,
      confidence,
    });

    const baseText =
      parts.length > 0
        ? parts.join('\n\n')
        : `I'm not sure where to point you. Try: *"where are the quizzes?"*, *"show me a sandbox"*, or *"what's my progress?"*`;

    // 6) Escalation now resolves to a named docs link via escalate_to_docs.
    let escalationMeta: HelpBotReply['escalated'] = null;
    let escalationMessage = '';
    if (escalation.escalate) {
      const docRes = escalateToDocs({ topic: prompt });
      if (!docRes.isError) {
        toolCalls.push(recordCall('escalateToDocs', { topic: prompt }, docRes));
        escalationMeta = {
          reason: escalation.reason ?? 'unknown',
          docUrl: docRes.data.url,
          docTitle: docRes.data.title,
        };
        escalationMessage = `\n\n> _Falling through to the docs. (Reason: ${escalation.reason}.) [${docRes.data.title}](${docRes.data.url})._`;
      } else {
        escalationMeta = { reason: escalation.reason ?? 'unknown' };
        escalationMessage = `\n\n> _Falling through to the docs. (Reason: ${escalation.reason}.) See the Claude Code docs at https://code.claude.com/docs/en._`;
      }
    }

    helpBotScratchpad.append(
      `q: "${prompt.slice(0, 50)}…" → tools=${toolCalls.length} esc=${escalation.escalate} cbe=${_consecutiveBusinessErrors}`,
    );

    return {
      text: baseText + escalationMessage,
      toolCalls,
      escalated: escalationMeta,
      consecutiveBusinessErrors: _consecutiveBusinessErrors,
      dispatchBranch,
    };
  },

  /** Few-shot exemplars surfaced in /under-the-hood for the Scenario 1 demo. */
  escalationExemplars: ESCALATION_FEWSHOT,
};

function formatLessonAnswer(res: ToolResponse<{ id: string; title: string }>): string {
  if (!res.isError) {
    return `Found one: **${res.data.title}** (\`/lessons/${res.data.id}\`).`;
  }
  // Validation errors are clarification asks; business errors are dead ends.
  if (res.errorCategory === 'validation') {
    return `Need a bit more to find it — ${res.message}`;
  }
  return `I couldn't find that lesson — ${res.message}`;
}

function recordCall<T>(
  name: string,
  input: Record<string, unknown>,
  res: ToolResponse<T>,
): ToolCallRecord {
  if (!res.isError) return { name, input, ok: true };
  return {
    name,
    input,
    ok: false,
    errorCategory: res.errorCategory,
    isRetryable: res.isRetryable,
  };
}
