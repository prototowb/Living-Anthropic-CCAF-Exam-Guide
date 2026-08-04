// Mock SDK adapter — default for the companion. Returns deterministic,
// hand-authored responses that demonstrate the Tutor (Scenario 3 hub-and-spoke)
// and Help Bot (Scenario 1 support agent) without an API key.
//
// The real adapter (realAdapter.ts) is a thin wrapper around @anthropic-ai/sdk.
// WebLLM / Ollama / LM Studio adapters are wired since v0.5. All share this
// interface.
//
// The jsonSchema branch honours two schema shapes: the Tutor's intent
// classification (default) and the Scenario 6 glossary document (keyed on
// the schema title — see ./mockGlossary.ts). That keeps the mock's
// `schemaMode: true` claim honest for every schema the app actually sends.

import type {
  CreateMessageOptions,
  CreateMessageResponse,
  SdkAdapter,
} from './types';
import { isGlossarySchema, parseGlossaryMarkdown } from './mockGlossary';

function rough(text: string) {
  return { inputTokens: Math.ceil(text.length / 4), outputTokens: 0 };
}

/**
 * Beginner-level explanations for Claude Code concepts. The Tutor's explainer
 * subagent reads from this when the mock adapter is active. Keyed loosely —
 * the keyword check is intentionally generous because beginners phrase things
 * many different ways.
 */
function explainConcept(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes('permission') || lower.includes('approve') || lower.includes('allow')) {
    return `**Why Claude pauses to ask.** Claude Code groups its abilities into named tools (Read, Edit, Write, Bash, Grep, Glob, …). The first time it wants to use one in your project, it asks you. That's the **permission prompt**. You can answer once, allow for the session, or allow always (writes to your project's \`settings.json\`). The four permission modes — \`default\`, \`acceptEdits\`, \`plan\`, \`yolo\` — set how strict that gate is. Beginners stay on \`default\`.`;
  }
  if (lower.includes('claude.md') || lower.includes('claude md') || lower.includes('memory')) {
    return `**CLAUDE.md is how you teach Claude about your project.** Put a \`CLAUDE.md\` at your repo root with the rules Claude should follow: which package manager you use, which files to avoid, your testing convention. Claude reads it at session start. You can also drop a \`CLAUDE.md\` inside a subdirectory and it'll override the root file for work in that area — that's the **hierarchy**.`;
  }
  if (lower.includes('slash') || lower.includes('command')) {
    return `**Slash commands are reusable prompts.** Type \`/\` in the Claude Code prompt and you get a menu of them. Built-ins like \`/clear\`, \`/compact\`, \`/resume\`, \`/help\` come with Claude Code. You can add your own by dropping a markdown file in \`.claude/commands/\` — the filename becomes the command name, and the file body is the prompt.`;
  }
  if (lower.includes('skill')) {
    return `**Skills bundle a prompt with files Claude needs.** A skill lives in \`.claude/skills/<name>/\` with a \`SKILL.md\` that tells Claude when to use it and what it does. Use skills when you want Claude to reach for a specific workflow (e.g., "review-pr", "init-tests") without you having to re-explain it each time.`;
  }
  if (lower.includes('plan mode') || lower.includes('plan')) {
    return `**Plan mode = think before you edit.** Press Shift+Tab once to enter plan mode. Claude will research and propose a step-by-step plan but **won't touch any file** until you approve. Use it before any change that spans more than two or three files, or when you're not sure what the right approach is.`;
  }
  if (lower.includes('subagent') || lower.includes('task') || lower.includes('delegate')) {
    return `**Subagents are Claude spawning more Claudes.** When Claude calls the \`Task\` tool, it kicks off a separate Claude session with its own context. Useful for parallel research ("explore three directories at once"), or for keeping the main thread's context window clean. You'll see a "Running Task" indicator while a subagent is working.`;
  }
  if (lower.includes('headless') || lower.includes('script') || lower.includes('automate')) {
    return `**Headless mode runs Claude without the REPL.** Use \`claude -p "your prompt" --output-format json\` to get a one-shot response you can parse in a shell script or CI step. Combine with \`jq\` to extract the field you want. This is the foundation for putting Claude Code into a CI pipeline.`;
  }
  if (lower.includes('mcp')) {
    return `**MCP servers plug external systems into Claude Code.** Think: GitHub, Linear, your internal docs. You add them in \`.mcp.json\` for the project (committed) or in your global config for personal credentials. As a beginner, you probably don't need MCP yet — wait until you have a recurring "Claude can't see X" problem.`;
  }
  if (lower.includes('hook')) {
    return `**Hooks are scripts that run on Claude Code events** — before a tool call, after one, when a session stops. They live in \`.claude/settings.json\`. Use them for things like "always run the linter after Claude edits a file" or "deny any \`rm -rf\` no matter what." Beginners can skip these.`;
  }
  if (lower.includes('first') || lower.includes('start') || lower.includes('begin')) {
    return `**Your first session.** Open a terminal in your project, run \`claude\`, type a question or a small task. Claude will think, possibly read a file, and propose an edit or an answer. The first time it tries to edit a file, you'll see a permission prompt — accept it once to keep going. When you're done, type \`/exit\` or press Ctrl+D.`;
  }

  return `That's a great starting point — try a more specific question. Some good first questions: *"what's a permission prompt?"*, *"what is CLAUDE.md?"*, *"how do slash commands work?"*, *"what's plan mode?"*`;
}

/**
 * Quizmaster — surfaces one quiz item. The mock returns a deterministic stub
 * because the real quiz set is owned by `src/data/quizData.ts` and the
 * Tutor's quizmaster subagent reads from there (wired in v0.2).
 */
function quizmasterReply(_prompt: string): string {
  return [
    `**Quick check.**`,
    '',
    `When Claude Code asks for permission to run a tool, which of these is **not** a real permission mode?`,
    '',
    `A. default`,
    `B. acceptEdits`,
    `C. plan`,
    `D. autoMerge`,
    '',
    `*(Reply with \`answer: <letter>\` to be graded.)*`,
  ].join('\n');
}

function helpBotReply(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes('quiz')) return `Quizzes are at **/quiz**. You can filter by stage.`;
  if (lower.includes('lesson')) return `Lessons are at **/lessons** — four formats: reorder, fill-in-blanks, MCQ, build-the-flow.`;
  if (lower.includes('sandbox') || lower.includes('repl')) return `The First-Session REPL sandbox is at **/sandboxes/first-session-repl**.`;
  if (lower.includes('progress') || lower.includes('how am i')) return `Your progress is on the home page **/** — and per-stage on each stage page.`;
  return `I can point you to a quiz, lesson, or sandbox. Try: *"where are the quizzes?"* or *"show me a sandbox"*. If I can't find it, I'll fall through to the docs.`;
}

// Tutor enum (must mirror `src/agents/tutor/schemas/intentClassification.ts`).
// `helpBot` is *not* a Tutor spoke — it's a separate agent. The mock's free-form
// branch keeps a `helpBot` reply category for navigation prompts that come in
// outside the tutor context, but the schema branch never emits it.
type TutorSubagentName = 'explainer' | 'quizmaster' | 'codebase-researcher' | 'doc-synthesiser';
type Intent = { subagents: TutorSubagentName[]; rationale: string };

function classifyIntent(prompt: string): Intent {
  const lower = prompt.toLowerCase();
  const wantsQuiz = /\bquiz|test me|question|practice\b/.test(lower);
  const wantsExplain = /\bexplain|what is|what's|describe|how does|how do\b/.test(lower);
  // "Where is X *in the code*" — the Scenario 4 codebase-researcher's beat.
  // Distinct from app-level navigation ("where are the quizzes") which the
  // Help Bot owns (and which the Tutor punts on).
  const wantsResearch =
    /\b(?:where (?:is|are) .*(?:implement|defin|written|wired|coded)|implement(?:ed|ation)?|source\s+code|in the (?:code|codebase|source)|show me the (?:code|impl|implementation)|find the (?:function|class|file)|\.(?:ts|vue|js))\b/i.test(
      lower,
    );
  // v0.2 — doc-synthesiser intent. "Summarise" / "give me an overview" /
  // "merged summary" routes to a single synthesis spoke that handles its
  // own concept + implementation fan-out. Checked BEFORE the other branches
  // so it doesn't get partially absorbed by `wantsExplain` (overview prompts
  // often contain "what is" too).
  const wantsSynthesis =
    /\b(?:summari[sz]e|give me an overview|overview of|merged summary|synthesi[sz]e|consolidate)\b/i.test(
      lower,
    );

  if (wantsSynthesis) {
    return {
      subagents: ['doc-synthesiser'],
      rationale:
        'Synthesis ask — doc-synthesiser composes a cited concept + impl paragraph.',
    };
  }
  if (wantsResearch && wantsExplain) {
    return {
      subagents: ['explainer', 'codebase-researcher'],
      rationale: 'Explain the concept and show where it lives in the code — parallel.',
    };
  }
  if (wantsResearch) {
    return {
      subagents: ['codebase-researcher'],
      rationale: 'Code-research question — locate the implementation in this project.',
    };
  }
  if (wantsQuiz && wantsExplain) {
    return { subagents: ['explainer', 'quizmaster'], rationale: 'Independent jobs — explain then quiz.' };
  }
  if (wantsQuiz) return { subagents: ['quizmaster'], rationale: 'Quiz request.' };
  if (wantsExplain) return { subagents: ['explainer'], rationale: 'Explanation.' };
  return { subagents: ['explainer'], rationale: 'Default — explanation.' };
}

// Free-form replies used only when no jsonSchema is passed (i.e. an individual
// subagent has called the adapter for its own text). `helpBot` is kept here
// as a navigation fallback for prompts that come in outside the Tutor pipeline.
type FreeFormName = TutorSubagentName | 'helpBot';

const SUBAGENT_REPLIES: Record<FreeFormName, (p: string) => string> = {
  explainer: explainConcept,
  quizmaster: quizmasterReply,
  helpBot: helpBotReply,
  // The codebase-researcher does not consult the SDK in v0.2 — it walks the
  // source index directly. If the free-form branch ever lands here, fall
  // through to the explainer reply.
  'codebase-researcher': explainConcept,
  // The doc-synthesiser also drives its own fan-out and does not need an
  // SDK free-form reply. The explainer fallback covers the unlikely path
  // where the mock free-form branch is ever invoked under this label.
  'doc-synthesiser': explainConcept,
};

export const mockAdapter: SdkAdapter = {
  kind: 'mock',
  label: 'Mock (scripted)',
  capabilities: {
    nativeToolUse: true,
    parallelSubagents: true,
    schemaMode: true,
  },

  async createMessage<T = unknown>(
    opts: CreateMessageOptions<T>,
  ): Promise<CreateMessageResponse<T>> {
    const userMessage = [...opts.messages].reverse().find((m) => m.role === 'user');
    const prompt = userMessage?.content ?? '';

    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));

    if (opts.jsonSchema) {
      if (isGlossarySchema(opts.jsonSchema)) {
        const doc = { entries: parseGlossaryMarkdown(prompt) };
        const fauxJson = JSON.stringify(doc);
        const data = (opts.parser ? opts.parser(fauxJson) : doc) as unknown as T;
        return { text: fauxJson, data, stopReason: 'end_turn', usage: rough(prompt) };
      }
      const intent = classifyIntent(prompt);
      const fauxJson = JSON.stringify(intent);
      const data = (opts.parser ? opts.parser(fauxJson) : intent) as unknown as T;
      return { text: fauxJson, data, stopReason: 'end_turn', usage: rough(prompt) };
    }

    const intent = classifyIntent(prompt);
    const replies = intent.subagents.map(
      (name) => `**[${name}]** ${SUBAGENT_REPLIES[name](prompt)}`,
    );
    const text = replies.join('\n\n---\n\n');
    const out = rough(text);
    return {
      text,
      stopReason: 'end_turn',
      usage: { inputTokens: rough(prompt).inputTokens, outputTokens: out.inputTokens },
    };
  },
};
