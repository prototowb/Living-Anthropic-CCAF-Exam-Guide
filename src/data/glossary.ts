// Glossary — quick-reference for the technical terms a learner runs into
// across the patterns. Each entry has:
//
//  - `term`: the term as it appears in the wild (preserving capitalization /
//    punctuation, e.g. `stop_reason`, `--print`, `tool_choice`, `Promise.all`).
//  - `slug`: kebab-case canonical id (URL-stable).
//  - `oneLiner`: one-sentence explanation.
//  - `category`: `'sdk' | 'cli' | 'pattern' | 'concept' | 'feature'`.
//  - `relatedPatternIds`: patterns whose `tags` mention this term — DERIVED at
//    module load against `src/data/domain-content/*` so it stays in sync.

import { domains } from './domains';

export type GlossaryCategory = 'sdk' | 'cli' | 'pattern' | 'concept' | 'feature';

export interface GlossaryEntry {
  term: string;
  slug: string;
  oneLiner: string;
  category: GlossaryCategory;
  /** Synonyms / tag aliases that also count as a match against pattern tags. */
  aliases?: string[];
  relatedPatternIds: string[];
}

// Hand-authored entries. relatedPatternIds is filled in below by walking
// every pattern's `tags` array.
const RAW_ENTRIES: Omit<GlossaryEntry, 'relatedPatternIds'>[] = [
  // --- SDK / API surface ----------------------------------------------------
  {
    term: 'stop_reason',
    slug: 'stop_reason',
    oneLiner:
      'The SDK\'s explicit, structured control signal at the end of a response. Drive the agent loop on this — never on text-sniffing the assistant\'s words.',
    category: 'sdk',
    aliases: ['stopReason'],
  },
  {
    term: 'tool_choice',
    slug: 'tool_choice',
    oneLiner:
      'Field on the SDK request that forces (or constrains) which tool the model will call. Use `{ type: "tool", name }` to require a specific extractor to fire first.',
    category: 'sdk',
  },
  {
    term: 'tool-use',
    slug: 'tool-use',
    oneLiner:
      'Stop-reason indicating the model wants to call one or more tools. Execute, append results, call again — that is the agentic loop.',
    category: 'sdk',
    aliases: ['tool_use'],
  },
  {
    term: 'end_turn',
    slug: 'end-turn',
    oneLiner:
      'Stop-reason indicating the model is done with this turn. Treat this — not iteration count — as the primary termination signal.',
    category: 'sdk',
    aliases: ['end-turn'],
  },
  {
    term: 'json-schema',
    slug: 'json-schema',
    oneLiner:
      'Structured-output mechanism: declare the response shape and the model returns conforming JSON. Eliminates regex parsing of natural-language responses.',
    category: 'sdk',
    aliases: ['json_schema', 'structured-output'],
  },
  {
    term: 'custom_id',
    slug: 'custom_id',
    oneLiner:
      'Per-request identifier you attach when submitting a batch. Lets you correlate response → original request when results stream back asynchronously.',
    category: 'sdk',
  },
  {
    term: 'batches',
    slug: 'batches',
    oneLiner:
      'Asynchronous Message Batches API: 50% cost vs sync, up to 24h latency. Right call for overnight bulk work; wrong call for interactive UX.',
    category: 'sdk',
    aliases: ['message-batches', 'batch'],
  },
  {
    term: 'dangerouslyAllowBrowser',
    slug: 'dangerously-allow-browser',
    oneLiner:
      'SDK flag that allows calls directly from a browser. Bypasses the default safety net — keys are exposed; intended for local dev only, never production.',
    category: 'sdk',
  },
  {
    term: 'jsonSchema (adapter)',
    slug: 'json-schema-adapter',
    oneLiner:
      'The playbook\'s own SdkAdapter forwards a `jsonSchema` option through to the SDK so mock and real adapters share a contract.',
    category: 'sdk',
  },

  // --- CLI / Claude Code surface --------------------------------------------
  {
    term: '--print',
    slug: 'print-flag',
    oneLiner:
      'CLI flag (alias `-p`) that runs Claude in non-interactive mode: process the prompt, write to stdout, exit. Foundation of every CI integration.',
    category: 'cli',
    aliases: ['-p'],
  },
  {
    term: '--output-format',
    slug: 'output-format-flag',
    oneLiner:
      'CLI flag selecting how the response is serialized (text / json / streaming-json). Pair with `--json-schema` for parseable pipeline output.',
    category: 'cli',
  },
  {
    term: '--json-schema',
    slug: 'json-schema-flag',
    oneLiner:
      'CLI flag pointing to a JSON Schema file; the response is constrained to conform. Lets CI scripts parse findings deterministically.',
    category: 'cli',
  },
  {
    term: '--resume',
    slug: 'resume-flag',
    oneLiner:
      'CLI flag that resumes a previous session by id. Underpins crash-recovery and longer-than-one-session workflows.',
    category: 'cli',
  },
  {
    term: 'fork_session',
    slug: 'fork-session',
    oneLiner:
      'Resume a session into a NEW branch instead of continuing the original — exploration without contaminating the trunk.',
    category: 'cli',
    aliases: ['context: fork', 'context-fork'],
  },
  {
    term: 'CLAUDE.md',
    slug: 'claude-md',
    oneLiner:
      'Project-scoped context file loaded into every invocation. Hierarchy: user `~/.claude/CLAUDE.md` → project `./CLAUDE.md` → per-directory overrides.',
    category: 'cli',
  },
  {
    term: '.claude/rules',
    slug: 'claude-rules',
    oneLiner:
      'Path-scoped, glob-matched rule files. Apply test conventions to `**/*.test.ts` everywhere without duplicating per-directory CLAUDE.md.',
    category: 'cli',
    aliases: ['path-scoped'],
  },
  {
    term: '.mcp.json',
    slug: 'mcp-json',
    oneLiner:
      'Project-scoped MCP server config — committed to git with `${ENV_VAR}` expansion so personal credentials live in the user\'s shell, not the repo.',
    category: 'cli',
    aliases: ['mcp'],
  },
  {
    term: '/compact',
    slug: 'compact-command',
    oneLiner:
      'Slash command that summarizes older context to free up window for new work. Use deliberately — premature compaction loses transactional detail.',
    category: 'cli',
  },
  {
    term: 'allowedTools',
    slug: 'allowed-tools',
    oneLiner:
      'Mandate: declare the exact tools an agent may call. `Task` MUST appear here if the agent dispatches subagents — without it, spawn silently fails.',
    category: 'cli',
    aliases: ['allowed-tools'],
  },
  {
    term: 'Task',
    slug: 'task-tool',
    oneLiner:
      'The tool a coordinator uses to spawn a subagent. Without it in allowedTools, hub-and-spoke architectures silently fail to dispatch.',
    category: 'cli',
  },
  {
    term: 'skills',
    slug: 'skills',
    oneLiner:
      'Reusable, declaratively-described capability bundles. Forked into their own context (`context: fork`) and gated by `allowed-tools`.',
    category: 'cli',
  },
  {
    term: 'argument-hint',
    slug: 'argument-hint',
    oneLiner:
      'Hints attached to a slash-command argument so the model knows what shape of value to ask for. Cuts ambiguity in command invocation.',
    category: 'cli',
  },

  // --- Patterns -------------------------------------------------------------
  {
    term: 'Hub-and-spoke',
    slug: 'hub-and-spoke',
    oneLiner:
      'Coordinator (hub) owns the turn and dispatches specialized subagents (spokes). Spokes never talk to each other — all routing flows through the hub.',
    category: 'pattern',
    aliases: ['coordinator', 'orchestration', 'hub'],
  },
  {
    term: 'Few-shot',
    slug: 'few-shot',
    oneLiner:
      'Inject 2–4 worked examples into the prompt to disambiguate classification or formatting. Beats long declarative instructions for ambiguous cases.',
    category: 'pattern',
    aliases: ['few-shot'],
  },
  {
    term: 'Scratchpad',
    slug: 'scratchpad',
    oneLiner:
      'Persist one-line findings after each turn; prepend before the next turn. Counteracts long-session drift toward generic "typical patterns".',
    category: 'pattern',
  },
  {
    term: 'Context pruning',
    slug: 'context-pruning',
    oneLiner:
      'Drop verbose fields from tool outputs BEFORE they enter the model\'s window. Prevents "lost in the middle" erasure of relevant findings.',
    category: 'pattern',
    aliases: ['pruning', 'context'],
  },
  {
    term: 'Case-facts block',
    slug: 'case-facts-block',
    oneLiner:
      'Transactional details (amounts, dates, IDs) kept VERBATIM and prepended to every prompt — never paraphrased by summarization.',
    category: 'pattern',
    aliases: ['case-facts'],
  },
  {
    term: 'Escalation predicate',
    slug: 'escalation-predicate',
    oneLiner:
      'Hard-coded triggers — explicit user request, repeated business errors, low confidence, policy gap. NOT sentiment, NOT self-reported confidence.',
    category: 'pattern',
    aliases: ['escalation'],
  },
  {
    term: 'PostToolUse',
    slug: 'posttool-hooks',
    oneLiner:
      'Hook that fires AFTER a tool runs but BEFORE the model sees the result. Use to normalize formats (Unix → ISO 8601) consistently — works for third-party MCP too.',
    category: 'pattern',
    aliases: ['hooks', 'posttool-hooks', 'PreToolUse'],
  },
  {
    term: 'Plan mode',
    slug: 'plan-mode',
    oneLiner:
      'Explore the design space and present a recommendation before coding. Right call when the spec is ambiguous and choice carries significant architectural impact.',
    category: 'pattern',
    aliases: ['plan-mode', 'direct-execution'],
  },
  {
    term: 'Multi-instance review',
    slug: 'multi-instance-review',
    oneLiner:
      'Generator and reviewer run as INDEPENDENT instances. The reviewer never sees the generator\'s reasoning, so it catches the bugs self-review rationalizes away.',
    category: 'pattern',
    aliases: ['multi-instance', 'independent-review'],
  },

  // --- Concepts -------------------------------------------------------------
  {
    term: 'isError / errorCategory',
    slug: 'is-error',
    oneLiner:
      'Architect-mandated tool-response shape. `isError: boolean` plus `errorCategory: "transient" | "business"` lets the caller branch deterministically.',
    category: 'concept',
    aliases: ['isError', 'errorCategory', 'structured-errors'],
  },
  {
    term: 'isRetryable',
    slug: 'is-retryable',
    oneLiner:
      'Per-error flag indicating whether the operation is worth retrying. Transient + isRetryable → backoff + retry; business → change strategy or escalate.',
    category: 'concept',
  },
  {
    term: 'lost in the middle',
    slug: 'lost-in-the-middle',
    oneLiner:
      'Attention failure where content in the middle of a long context window is reasoned over less effectively than the head or tail. Drives the pruning mandate.',
    category: 'concept',
    aliases: ['lost-in-the-middle'],
  },
  {
    term: 'context window',
    slug: 'context-window',
    oneLiner:
      'The token budget per turn. Defenses: case-facts block (keep transactional detail), pruning (drop verbose tool output), scratchpad (preserve findings across turns).',
    category: 'concept',
    aliases: ['token-budget'],
  },
  {
    term: 'context decay',
    slug: 'context-decay',
    oneLiner:
      'In long sessions, the model drifts toward generic "typical patterns" and loses session-specific specifics. Scratchpad + case-facts are the architect-mandated counters.',
    category: 'concept',
  },
  {
    term: 'provenance',
    slug: 'provenance',
    oneLiner:
      'Every extracted claim carries `{ value, source, collectedAt }`. Lost provenance kills auditability — downstream summarization MUST preserve it.',
    category: 'concept',
    aliases: ['claim-source'],
  },
  {
    term: 'partitioning',
    slug: 'partitioning',
    oneLiner:
      'Decompose a research topic into named subtopics BEFORE dispatch. Narrow decomposition is the #1 failure mode of multi-agent research runs.',
    category: 'concept',
    aliases: ['decomposition', 'task-decomposition'],
  },
  {
    term: 'stratified sampling',
    slug: 'stratified-sampling',
    oneLiner:
      'When sampling high-confidence batches for human review, stratify across document types — a global threshold hides per-segment failures.',
    category: 'concept',
    aliases: ['stratified-sampling'],
  },

  // --- Features -------------------------------------------------------------
  {
    term: 'Prompt caching',
    slug: 'prompt-caching',
    oneLiner:
      'Stable preamble (CLAUDE.md, few-shot block, tool specs) is cached and reused across turns at ~10% cost. Anything dynamic invalidates the cache for that turn.',
    category: 'feature',
    aliases: ['cache_control'],
  },
];

// ---------------------------------------------------------------------------
// Derivation: walk every pattern's `tags` array and match against each
// glossary entry's term / aliases (case-insensitive, normalized).
// ---------------------------------------------------------------------------
function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s_]+/g, '-');
}

function matches(tag: string, candidates: string[]): boolean {
  const t = normalize(tag);
  return candidates.some((c) => normalize(c) === t);
}

function deriveRelated(entry: Omit<GlossaryEntry, 'relatedPatternIds'>): string[] {
  const candidates = [entry.term, entry.slug, ...(entry.aliases ?? [])];
  const ids = new Set<string>();
  for (const d of domains) {
    for (const p of d.patterns) {
      if (p.tags.some((tag) => matches(tag, candidates))) {
        ids.add(p.id);
      }
    }
  }
  return Array.from(ids);
}

export const allGlossaryEntries: GlossaryEntry[] = RAW_ENTRIES.map((e) => ({
  ...e,
  relatedPatternIds: deriveRelated(e),
})).sort((a, b) => a.term.toLowerCase().localeCompare(b.term.toLowerCase()));

export function findGlossaryEntry(slug: string): GlossaryEntry | undefined {
  return allGlossaryEntries.find((e) => e.slug === slug);
}

export const glossaryCategories: GlossaryCategory[] = [
  'sdk',
  'cli',
  'pattern',
  'concept',
  'feature',
];

export const glossaryCategoryLabel: Record<GlossaryCategory, string> = {
  sdk: 'SDK / API',
  cli: 'CLI / Claude Code',
  pattern: 'Pattern',
  concept: 'Concept',
  feature: 'Feature',
};
