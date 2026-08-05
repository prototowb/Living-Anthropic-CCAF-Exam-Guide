/**
 * Drill items for `/drill` — the scenario-recognition skill itself.
 *
 * Each item shows a fragment (requirement, log excerpt, or stakeholder quote)
 * and asks the learner to place it: which scenario is this from, or which
 * domain does this decision belong to? Fragments are authored — deliberately
 * NOT verbatim from the briefs or the sample Q&A, so recognition can't fall
 * back on string memory.
 */
export type DrillKind = 'requirement' | 'log' | 'quote'

export interface DrillItem {
  id: string
  kind: DrillKind
  prompt: string
  /** What is being asked: place the fragment by scenario, or by domain. */
  ask: 'scenario' | 'domain'
  /** Scenario number (1–6) when ask=scenario; DomainId (1–5) when ask=domain. */
  answer: number
  explain: string
}

export const DRILL_ITEMS: DrillItem[] = [
  // ── Scenario placement ────────────────────────────────────────────────
  {
    id: 'sc-1a',
    kind: 'log',
    ask: 'scenario',
    answer: 1,
    prompt:
      'PreToolUse hook: DENY process_refund — amount_usd 1200 exceeds ceiling 500. Redirected to escalate_to_human with structured handoff { customer_id, root_cause, recommended_action }.',
    explain:
      'A compliance hook gating a refund tool and producing a structured human handoff is the support-resolution agent. The refund ceiling is enforced programmatically, not by prompt (TS 1.4/1.5).',
  },
  {
    id: 'sc-1b',
    kind: 'quote',
    ask: 'scenario',
    answer: 1,
    prompt:
      '"Most tickets should be closed on the first reply — but the bot must never touch an account it hasn\'t verified, and anything policy-shaped goes to a person."',
    explain:
      'First-contact resolution targets plus verify-before-act plus explicit escalation criteria are the three signatures of the customer support resolution scenario.',
  },
  {
    id: 'sc-2a',
    kind: 'requirement',
    ask: 'scenario',
    answer: 2,
    prompt:
      'The team wants repo conventions enforced automatically: root rules for everyone, stricter per-package overrides, and any change touching more than two files must produce a reviewable plan before edits land.',
    explain:
      'CLAUDE.md hierarchy plus a plan-mode-vs-direct-execution policy is the code-generation-with-Claude-Code scenario — configuring the tool to fit a team\'s workflow.',
  },
  {
    id: 'sc-2b',
    kind: 'log',
    ask: 'scenario',
    answer: 2,
    prompt: '> /fix-issue 1234\n· loaded .claude/commands/fix-issue.md ($ARGUMENTS = "1234")\n· plan mode: 4-step plan proposed, awaiting approval',
    explain:
      'Custom slash commands with $ARGUMENTS and plan-mode gating are day-to-day Claude Code workflow configuration (Scenario 2).',
  },
  {
    id: 'sc-3a',
    kind: 'requirement',
    ask: 'scenario',
    answer: 3,
    prompt:
      'A research question fans out to specialised workers — one per source family — running concurrently; a coordinator merges their findings into one cited report. Wall-clock time matters more than token cost.',
    explain:
      'Hub-and-spoke with parallel subagent dispatch and synthesis is the multi-agent research system (Scenario 3). "Concurrent workers + coordinator merge" is the tell.',
  },
  {
    id: 'sc-3b',
    kind: 'log',
    ask: 'scenario',
    answer: 3,
    prompt:
      "AssertionError at load: coordinator config missing 'Task' in allowedTools — cannot spawn subagents. 4 pending dispatches aborted.",
    explain:
      'Only the multi-agent scenario requires the Task tool in allowedTools; asserting it at load time is the guard the parent playbook mandates for coordinators.',
  },
  {
    id: 'sc-4a',
    kind: 'quote',
    ask: 'scenario',
    answer: 4,
    prompt:
      '"Engineers lose an afternoon whenever they ask \'where is this implemented?\' — I want them to get an answer with file paths they can click, straight from our own source tree."',
    explain:
      'An agent answering codebase questions with cited file paths via Read/Grep/Glob is the developer-productivity scenario (Scenario 4).',
  },
  {
    id: 'sc-4b',
    kind: 'requirement',
    ask: 'scenario',
    answer: 4,
    prompt:
      'Expose the internal ticket tracker and design docs to the agent through a small set of read-only MCP tools, so "what changed around this feature?" can be answered without leaving the editor.',
    explain:
      'Wiring internal systems into a developer\'s daily loop through scoped MCP tools is developer productivity (Scenario 4) — contrast with Scenario 1, where MCP tools drive customer-facing actions.',
  },
  {
    id: 'sc-5a',
    kind: 'log',
    ask: 'scenario',
    answer: 5,
    prompt:
      'PR #212 · automated review posted (3 findings, 1 blocker) · gate: migrations touched → approval withheld · hook denied Bash(rm -rf tmp/) during review run.',
    explain:
      'Claude reviewing PRs with hard do-not-approve gates and deny-listed destructive actions in CI is Scenario 5 — Claude Code for continuous integration.',
  },
  {
    id: 'sc-5b',
    kind: 'requirement',
    ask: 'scenario',
    answer: 5,
    prompt:
      'Every pull request gets an automated review bounded to the touched files, judged against named criteria, with false positives treated as a first-class failure mode of the prompt.',
    explain:
      'Bounded scope, named criteria, and false-positive minimisation are the prompt-engineering concerns of the CI review scenario (Scenario 5).',
  },
  {
    id: 'sc-6a',
    kind: 'requirement',
    ask: 'scenario',
    answer: 6,
    prompt:
      'Ten thousand free-text supplier invoices must become typed records. The output schema is checked into the repo; anything that fails validation is retried once with the validator error appended, then flagged for a human.',
    explain:
      'Schema-constrained extraction with a validation-retry loop over a large batch is structured data extraction (Scenario 6).',
  },
  {
    id: 'sc-6b',
    kind: 'log',
    ask: 'scenario',
    answer: 6,
    prompt:
      'batch item 3412: schema validation failed at $.line_items[3].qty (expected integer, got "two") — retrying with error message appended to the prompt (attempt 2/2).',
    explain:
      'JSON-path validation failures feeding a bounded retry loop are the runtime signature of the extraction pipeline (Scenario 6, TS 4.4).',
  },

  // ── Domain placement ──────────────────────────────────────────────────
  {
    id: 'dm-1',
    kind: 'requirement',
    ask: 'domain',
    answer: 1,
    prompt:
      'Decide: one agent holding fourteen tools, or a coordinator that delegates to three specialised subagents — and if the latter, which calls can run in parallel without racing.',
    explain:
      'Single-agent vs hub-and-spoke and parallelisation of subagent dispatch are Domain 1 — Agentic Architecture & Orchestration.',
  },
  {
    id: 'dm-2',
    kind: 'requirement',
    ask: 'domain',
    answer: 2,
    prompt:
      'Decide the granularity of the lookup tools and the shape of their failure envelope — should a stock-out be an exception, or a typed business error the model can reason about?',
    explain:
      'Tool granularity and structured error categories (transient vs business) are Domain 2 — Tool Design & MCP Integration.',
  },
  {
    id: 'dm-3',
    kind: 'requirement',
    ask: 'domain',
    answer: 3,
    prompt:
      'Decide where the frontend\'s stricter lint conventions live so the agent honours them only under packages/web/, and which kinds of change should require a plan before any edit.',
    explain:
      'Path-scoped CLAUDE.md rules and plan-vs-direct policy are Domain 3 — Claude Code Configuration & Workflows.',
  },
  {
    id: 'dm-4',
    kind: 'requirement',
    ask: 'domain',
    answer: 4,
    prompt:
      'The extractor keeps drifting between date formats. Decide: more few-shot examples, a JSON schema constraint on the output, or both — and how many examples are worth their tokens.',
    explain:
      'Few-shot selection and schema-constrained output are Domain 4 — Prompt Engineering & Structured Output.',
  },
  {
    id: 'dm-5a',
    kind: 'requirement',
    ask: 'domain',
    answer: 5,
    prompt:
      'The agent\'s session grows past 40 turns and it starts forgetting the claim amounts it verified earlier. Decide what gets pruned, what lives in a persistent facts block, and when to hand off.',
    explain:
      'Context pruning, persistent case-facts, and escalation timing are Domain 5 — Context Management & Reliability.',
  },
  {
    id: 'dm-5b',
    kind: 'quote',
    ask: 'domain',
    answer: 5,
    prompt:
      '"Before its verdict can gate a merge, we need evidence the reviewer\'s confidence scores mean something — sweep a labelled corpus and pick the threshold, don\'t trust vibes."',
    explain:
      'Calibrating model confidence against ground truth before it gates human-consequential decisions is Domain 5 (TS 5.5 — human review & confidence).',
  },
]
