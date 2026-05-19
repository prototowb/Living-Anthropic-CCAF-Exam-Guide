// Mock SDK adapter — default for the playbook. Returns deterministic,
// hand-authored responses that demonstrate the architect's patterns without
// requiring an API key. The real adapter (realAdapter.ts) is a thin wrapper
// around @anthropic-ai/sdk and conforms to the same interface.

import { quizSections } from '@/data/quizData';
import { domains } from '@/data/domains';
import type {
  CreateMessageOptions,
  CreateMessageResponse,
  SdkAdapter,
} from './types';

function rough(text: string) {
  return { inputTokens: Math.ceil(text.length / 4), outputTokens: 0 };
}

function pickKeyword(prompt: string, options: string[]): string | undefined {
  const lower = prompt.toLowerCase();
  return options.find((o) => lower.includes(o.toLowerCase()));
}

function explainConcept(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes('hub') || lower.includes('spoke') || lower.includes('coordinator')) {
    return `**Hub-and-Spoke (Domain 1).** A single coordinator owns the conversation and decides which specialized subagents to dispatch. Subagents never call each other directly — they go back through the hub. The coordinator's allowedTools list MUST include \`Task\` so it can spawn subagents at all. Independent subagents run with \`Promise.all\` so latency is bounded by the slowest spoke.`;
  }
  if (lower.includes('few-shot') || lower.includes('few shot')) {
    return `**Few-Shot Prompting (Domain 4).** When a classification or extraction task is ambiguous, 2–4 worked examples beat declarative rules every time. The model copies the pattern — including the reasoning step. Don't dump 15 examples; the model reads the first few most reliably.`;
  }
  if (lower.includes('mcp')) {
    return `**MCP Scoping (Domain 2).** Team tools live in \`.mcp.json\` (committed to the repo) and reference env vars like \`\${GITHUB_TOKEN}\` so secrets stay out of git. Personal credentials live in \`~/.claude.json\` (never committed).`;
  }
  if (lower.includes('plan mode') || lower.includes('plan vs')) {
    return `**Plan Mode vs Direct Execution (Domain 3).** Plan Mode is for architectural changes — anything ambiguous, multi-file, or that introduces a dependency. Direct Execution is for narrow, single-file bug fixes where the change is obvious.`;
  }
  if (lower.includes('scratchpad') || lower.includes('context decay')) {
    return `**Scratchpad Pattern (Domain 5).** Long sessions decay. After each coordinator turn, append a one-line "key finding" to a scratchpad (a \`.md\` file or, here, localStorage). Future turns recall the scratchpad before reasoning — that's how you persist insight across the context window.`;
  }
  if (lower.includes('batch')) {
    return `**Message Batches API (Domain 4).** 50% cheaper, up to 24h latency, fire-and-forget. Perfect for nightly reports and weekly audits. Useless for PR pre-merge checks or any tool-calling loop — there is no mid-request callback to return tool results.`;
  }
  if (lower.includes('granular') || lower.includes('tool')) {
    return `**Granular Tools (Domain 2).** Many small, single-purpose tools beat one monolithic one. Tool description is the only signal the model has for selection — if two tools share words, the model picks wrong. Use clear, distinct names and one-job descriptions.`;
  }
  if (lower.includes('json schema') || lower.includes('structured output')) {
    return `**JSON Schema responses (Domain 4).** Send the schema to the Messages API and the model is constrained to schema-conformant output. No parse failures, no regex extraction, no schema drift.`;
  }
  if (lower.includes('escalation') || lower.includes('escalate')) {
    return `**Escalation (Domain 5).** Don't rely on soft prompt phrases. Hard-code the predicates: user asked, two business-category errors in a row, or coordinator confidence below threshold → escalate. Add 2–3 few-shot examples so the model recognizes the patterns.`;
  }
  if (lower.includes('claude.md') || lower.includes('hierarchy')) {
    return `**CLAUDE.md hierarchy (Domain 3).** Root file states repo-wide rules. Subdirectory CLAUDE.md files (e.g. \`src/agents/CLAUDE.md\`) extend or override for that area. The closest file wins. Use this to keep area-specific guidance close to the code it governs.`;
  }
  if (lower.includes('pruning') || lower.includes('prune')) {
    return `**Context Pruning (Domain 5).** Tool outputs are verbose — page content, reasoning chains, full payloads. Pass them through a pruner that drops any field longer than a budget unless tagged keep: true. Otherwise the context window fills with noise the next turn cannot afford.`;
  }

  return `That maps to multiple architect patterns. Try a more specific query — e.g. "hub and spoke", "few-shot prompting", "context pruning", "MCP scoping", or name a domain by number (1–5).`;
}

function pickQuizQuestion(prompt: string) {
  const lower = prompt.toLowerCase();
  const target =
    pickKeyword(lower, ['s1', 's2', 's3', 's4']) ??
    (lower.includes('ci') ? 's1'
      : lower.includes('support') ? 's2'
      : lower.includes('code') ? 's3'
      : lower.includes('multi') || lower.includes('research') ? 's4'
      : null);

  const section =
    quizSections.find((s) => s.id === target) ??
    quizSections[Math.floor(Math.random() * quizSections.length)];

  const q = section.questions[Math.floor(Math.random() * section.questions.length)];
  return { section, q };
}

function quizmasterReply(prompt: string): string {
  const { section, q } = pickQuizQuestion(prompt);
  const lines = [
    `**${section.title} — Q${q.id}**`,
    '',
    q.text,
    '',
    ...q.options.map((o) => `${o.letter}. ${o.text}`),
    '',
    `*(Reply with "answer ${section.id} q${q.id}: <letter>" to be graded.)*`,
  ];
  return lines.join('\n');
}

function explainerReply(prompt: string): string {
  return explainConcept(prompt);
}

function codeReviewerReply(prompt: string): string {
  const m = prompt.match(/answer\s+(s\d+)\s*q(\d+)\s*:\s*([A-Da-d])/i);
  if (!m) {
    return `To grade an answer, send something like \`answer s1 q4: B\` and I'll compare it to the expected option and explain why.`;
  }
  const [, section, idStr, letter] = m;
  const sec = quizSections.find((s) => s.id === section);
  const q = sec?.questions.find((q) => q.id === Number(idStr));
  if (!q) return `I couldn't find ${section} q${idStr}. Double-check the section + question id.`;

  const picked = letter.toUpperCase();
  const correct = q.correct === picked;
  if (correct) {
    return `✅ Correct — **${picked}**.\n\n${q.explanation}`;
  }
  const wrong = q.wrongExplanations?.[picked as 'A' | 'B' | 'C' | 'D'];
  return [
    `❌ Not quite — you picked **${picked}**, the expected answer is **${q.correct}**.`,
    '',
    wrong ?? q.explanation,
  ].join('\n');
}

const SUBAGENT_REPLIES: Record<string, (p: string) => string> = {
  explainer: explainerReply,
  quizmaster: quizmasterReply,
  'code-reviewer': codeReviewerReply,
};

function classifyIntent(
  prompt: string,
): { subagents: ('explainer' | 'quizmaster' | 'code-reviewer')[]; rationale: string } {
  const lower = prompt.toLowerCase();
  const isGrade = /^answer\s+s\d+\s*q\d+/i.test(prompt);
  if (isGrade) return { subagents: ['code-reviewer'], rationale: 'User submitted an answer for grading.' };

  const wantsExplain = /\bexplain|what is|describe|how does\b/.test(lower);
  const wantsQuiz = /\bquiz|test me|question|practice\b/.test(lower);

  if (wantsExplain && wantsQuiz) {
    return {
      subagents: ['explainer', 'quizmaster'],
      rationale: 'Two independent jobs — explain then quiz. Dispatch in parallel.',
    };
  }
  if (wantsQuiz) return { subagents: ['quizmaster'], rationale: 'User asked to be quizzed.' };
  if (wantsExplain) return { subagents: ['explainer'], rationale: 'User asked for an explanation.' };

  // Default: explainer (broadly useful).
  return { subagents: ['explainer'], rationale: 'Default — explanation.' };
}

function maybeAppendDomainHints(prompt: string): string {
  const lower = prompt.toLowerCase();
  for (const d of domains) {
    if (lower.includes(d.slug) || lower.includes(`domain ${d.number}`)) {
      const top = d.patterns
        .slice(0, 2)
        .map((p) => `• **${p.title}** — ${p.summary}`)
        .join('\n');
      return `\n\n_Related to Domain ${d.number}: ${d.title}_\n${top}`;
    }
  }
  return '';
}

export const mockAdapter: SdkAdapter = {
  kind: 'mock',

  async createMessage<T = unknown>(
    opts: CreateMessageOptions<T>,
  ): Promise<CreateMessageResponse<T>> {
    const userMessage = [...opts.messages].reverse().find((m) => m.role === 'user');
    const prompt = userMessage?.content ?? '';

    // Latency stub so the UI can show subagent timings.
    await new Promise((r) => setTimeout(r, 250 + Math.random() * 400));

    // Structured-output branch (intent classification, grading, etc.).
    if (opts.jsonSchema) {
      const intent = classifyIntent(prompt);
      const fauxJson = JSON.stringify(intent);
      const data = (opts.parser ? opts.parser(fauxJson) : intent) as unknown as T;
      return {
        text: fauxJson,
        data,
        stopReason: 'end_turn',
        usage: rough(prompt),
      };
    }

    // Free-form branch — return a composed reply.
    const intent = classifyIntent(prompt);
    const replies = intent.subagents.map((name) =>
      `**[${name}]** ${SUBAGENT_REPLIES[name](prompt)}`,
    );
    const text = replies.join('\n\n---\n\n') + maybeAppendDomainHints(prompt);

    const out = rough(text);
    return {
      text,
      stopReason: 'end_turn',
      usage: { inputTokens: rough(prompt).inputTokens, outputTokens: out.inputTokens },
    };
  },
};
