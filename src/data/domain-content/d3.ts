// Domain 3 — Claude Code Configuration & Workflows.
// Covers exam tasks 3.1 through 3.6.

import type { DomainPattern } from './types';

export const d3Patterns: DomainPattern[] = [
  // -----------------------------------------------------------------------
  // Task 3.1 — CLAUDE.md hierarchy
  // -----------------------------------------------------------------------
  {
    id: 'claude-md-hierarchy',
    title: 'CLAUDE.md hierarchy & `@import`',
    summary:
      'User-level (`~/.claude/CLAUDE.md`) applies only to one developer and is NOT ' +
      'shared via git. Project-level (root `CLAUDE.md` or `.claude/CLAUDE.md`) is ' +
      'shared. Directory-level files extend or override for that area. Use `@import` ' +
      'to keep CLAUDE.md modular by referencing package-specific standards files. ' +
      'Closest file wins.',
    source: 'CLAUDE.md, src/agents/CLAUDE.md, src/data/CLAUDE.md',
    language: 'md',
    codeSnippet: `# Root CLAUDE.md — repo-wide
- Use the Edit tool for changes; Write only for new files
- Run \`vue-tsc --noEmit\` before committing
- @import ./standards/typescript.md
- @import ./standards/testing.md

# src/agents/CLAUDE.md — area-specific
- Coordinator's allowedTools MUST include 'Task'
- Views NEVER call the SDK directly — go through src/agents/coordinator.ts

# src/data/CLAUDE.md — area-specific
- This directory is immutable at runtime — no mutation in views

# ~/.claude/CLAUDE.md — USER scope (your machine only)
- Personal preferences, not shared with teammates`,
    taskRef: '3.1',
    type: 'config',
    tags: ['CLAUDE.md', '@import', 'hierarchy', 'project-scope', 'user-scope'],
    related: ['path-scoped-rules', 'slash-commands-and-skills', 'mcp-scoping'],
    antiPattern: {
      title: 'Team standards in `~/.claude/CLAUDE.md`',
      language: 'md',
      badCode: `# ~/.claude/CLAUDE.md (on each existing developer's machine)
- Always include comprehensive error handling
- All exports must have JSDoc

# A new developer joins. They have no ~/.claude/CLAUDE.md — they don't get the rules.
# "Why does Claude not follow our error-handling guideline for them?"`,
      failureMode:
        'User-level config is per-machine and never reaches new teammates. Anything the ' +
        '*team* relies on must live in the project-scoped `.claude/CLAUDE.md`.',
    },
    quizQuestionRefs: [
      { sectionId: 's3', questionId: 6 },
      { sectionId: 's3', questionId: 7 },
    ],
  },

  // -----------------------------------------------------------------------
  // Task 3.2 — Slash commands and Skills
  // -----------------------------------------------------------------------
  {
    id: 'slash-commands-and-skills',
    title: 'Slash commands & Skills (`context: fork`, `allowed-tools`, `argument-hint`)',
    summary:
      'Project-scoped commands live in `.claude/commands/` (committed). Skills live in ' +
      '`.claude/skills/<name>/SKILL.md` and accept frontmatter: `context: fork` runs the ' +
      'skill in an isolated sub-agent context so verbose output never pollutes the main ' +
      'session; `allowed-tools` restricts what the skill can do; `argument-hint` prompts ' +
      'autocomplete to surface required parameters. Use a different NAME for a personal ' +
      'variant in `~/.claude/skills/` — project skills take precedence over personal ones ' +
      'with the same name.',
    source: '.claude/skills/migration/SKILL.md',
    language: 'md',
    codeSnippet: `---
description: Create a database migration file from a name and a description.
argument-hint: <migration-name> -- <one-line description>
context: fork
allowed-tools:
  - Write
  - Edit
---

# /migration

Create a new migration file at \`db/migrations/<timestamp>_<migration-name>.sql\`.

# Why these frontmatter keys?
#   argument-hint  — autocomplete shows what to type, so devs don't run /migration
#                    with no args and produce poorly-named files
#   context: fork  — runs in a fresh subagent; nothing the main session has been
#                    discussing about schema details leaks into this generation
#   allowed-tools  — even if the model decides to run \`rm -rf\`, it can't —
#                    only Write/Edit are exposed.`,
    taskRef: '3.2',
    type: 'config',
    tags: ['skills', 'slash-commands', 'context-fork', 'allowed-tools', 'argument-hint'],
    related: ['claude-md-hierarchy', 'path-scoped-rules', 'plan-vs-direct', 'iterative-refinement'],
    antiPattern: {
      title: 'Personal skill override using the same name',
      language: 'md',
      badCode: `# ~/.claude/skills/commit/SKILL.md  (the developer's personal /commit)
---
override: true   # not a real option
---
Use my custom commit message format.

# Problem: project skill at .claude/skills/commit/SKILL.md takes precedence.
# Personal override never fires.`,
      failureMode:
        'Project skills win when names collide. To get a personal variant, give it a ' +
        'DIFFERENT name (e.g. `/my-commit`) in `~/.claude/skills/`.',
    },
    quizQuestionRefs: [
      { sectionId: 's3', questionId: 3 },
      { sectionId: 's3', questionId: 8 },
      { sectionId: 's3', questionId: 9 },
      { sectionId: 's3', questionId: 14 },
    ],
  },

  // -----------------------------------------------------------------------
  // Task 3.3 — Path-specific rules
  // -----------------------------------------------------------------------
  {
    id: 'path-scoped-rules',
    title: 'Path-scoped rules in `.claude/rules/`',
    summary:
      'A rule file in `.claude/rules/` with a `paths:` glob in its frontmatter applies ' +
      'only to matching files. Beats subdirectory CLAUDE.md for cross-cutting concerns ' +
      '— test files live everywhere, but the test conventions are one rule with one ' +
      'glob.',
    source: '.claude/rules/tests.md',
    language: 'md',
    codeSnippet: `---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/__tests__/**/*"
---

# Test conventions
- Arrange / Act / Assert structure; one assertion per test where possible
- Mock at the boundary (network, filesystem, time); never mock collaborators
  inside the SUT
- Use the Testing Library queries (\`getByRole\`, \`getByLabelText\`); avoid
  \`getByTestId\` unless no semantic alternative exists`,
    taskRef: '3.3',
    type: 'config',
    tags: ['.claude/rules', 'glob', 'path-scoped', 'conditional-loading'],
    related: ['claude-md-hierarchy', 'slash-commands-and-skills'],
    antiPattern: {
      title: 'Subdirectory CLAUDE.md for files spread across directories',
      language: 'md',
      badCode: `# Trying to enforce test conventions everywhere — using directory-level CLAUDE.md.

src/auth/CLAUDE.md          # contains test rules
src/billing/CLAUDE.md       # repeats the same test rules
src/components/CLAUDE.md    # repeats them again
src/lib/CLAUDE.md           # …and again

# Six copies; they drift apart in a month.`,
      failureMode:
        'Test files are scattered across the codebase; a per-directory CLAUDE.md leads ' +
        'to duplication, drift, and divergence. One glob-scoped rule file is the right shape.',
    },
    quizQuestionRefs: [{ sectionId: 's3', questionId: 2 }],
  },

  // -----------------------------------------------------------------------
  // Task 3.4 — Plan vs Direct
  // -----------------------------------------------------------------------
  {
    id: 'plan-vs-direct',
    title: 'Plan Mode vs Direct Execution',
    summary:
      'Plan Mode for ambiguous specs, multi-file changes, architectural decisions, or ' +
      'anything that adds a dependency. Direct Execution for narrow, well-understood ' +
      'changes. Combine them: plan the migration in Plan Mode, then execute the plan ' +
      'directly. The Explore subagent isolates verbose discovery output so the main ' +
      'context survives multi-phase tasks.',
    source: 'src/agents/modes.ts',
    language: 'ts',
    codeSnippet: `// src/agents/modes.ts
export function chooseMode(req: ModeRequest): 'plan' | 'direct' {
  if (req.ambiguous)                 return 'plan'; // Slack: webhook vs bot vs app?
  if (req.files.length > 1)          return 'plan'; // monolith → microservices
  if (req.addsDependency)            return 'plan'; // new lib changes the boundary
  if (req.crossesArchBoundary)       return 'plan'; // schema migration, etc.
  return 'direct';                                   // one-file bug fix
}

// Phase 1 of a 120-file refactor produces verbose output — use the Explore
// subagent to isolate it and return only a summary to the main conversation.
const discovery = await Task({
  name: 'Explore',
  prompt: 'Find every call site of fetch() in src/, classify by retry behavior',
});
// Main session sees the summary; verbose listing stays in the subagent context.`,
    taskRef: '3.4',
    type: 'config',
    tags: ['plan-mode', 'direct-execution', 'Explore-subagent'],
    related: ['task-decomposition', 'iterative-refinement', 'context-pruning'],
    antiPattern: {
      title: '"I\'ll just start coding and figure it out"',
      language: 'ts',
      badCode: `// Ticket: "Add Slack support to the notification system."
// Spec doesn't say webhook vs bot vs app. Each is a different architecture.

// Direct Execution: copy the email channel, swap the transport. Halfway in,
// realize delivery confirmation needs bot tokens — rip out and restart.`,
      failureMode:
        'Without planning, you commit to an integration shape before knowing the ' +
        'requirements. Rework consumes more time than the plan would have taken.',
    },
    quizQuestionRefs: [
      { sectionId: 's3', questionId: 1 },
      { sectionId: 's3', questionId: 10 },
      { sectionId: 's3', questionId: 15 },
    ],
  },

  // -----------------------------------------------------------------------
  // Task 3.5 — Iterative refinement
  // -----------------------------------------------------------------------
  {
    id: 'iterative-refinement',
    title: 'Iterative refinement — I/O examples, TDD, interview',
    summary:
      'When prose descriptions produce inconsistent results, switch to concrete ' +
      'input/output examples — they collapse the ambiguity. Test-driven iteration: ' +
      'write the test suite first, then iterate by sharing failing tests as feedback. ' +
      'The interview pattern surfaces design considerations the developer may not have ' +
      'anticipated (cache invalidation, failure modes) before code is written. Group ' +
      'INTERACTING issues into one message; iterate sequentially only when issues are independent.',
    source: 'src/showcase/iterative-refinement.example.md',
    language: 'md',
    codeSnippet: `# Round 1 — prose only (produces inconsistent results)
"Transform the API response into our normalized format."

# Round 2 — replace prose with 2–3 concrete I/O examples
INPUT:
{ "id": 42, "ts": 1700000000, "items": [{ "sku": "A", "qty": 2 }] }
OUTPUT:
{ "orderId": "42", "placedAt": "2023-11-14T22:13:20Z",
  "lineItems": [{ "productCode": "A", "quantity": 2 }] }

INPUT:
{ "id": 7, "ts": 1700000001, "items": [], "promo": "FREESHIP" }
OUTPUT:
{ "orderId": "7", "placedAt": "2023-11-14T22:13:21Z",
  "lineItems": [], "promotion": "FREESHIP" }

# Round 3 — interview pattern (when the domain is unfamiliar)
> Before implementing, ask me about: cache invalidation, failure modes for
> the third-party API, idempotency, retry behavior, and how missing fields
> should surface.`,
    taskRef: '3.5',
    type: 'prompt',
    tags: ['few-shot', 'TDD', 'interview-pattern', 'io-examples'],
    related: ['few-shot', 'explicit-criteria', 'validation-retry-loops'],
    antiPattern: {
      title: 'More prose detail — and more prose detail — and more prose detail',
      language: 'md',
      badCode: `# Round 1: "Transform the API response into our normalized format."
# Round 2: "…with snake_case → camelCase, timestamps to ISO 8601."
# Round 3: "…and nested arrays should map keys 'items' → 'lineItems'…"
# Round 4: …
# Each round adds more abstract instructions. Output still drifts.`,
      failureMode:
        'Prose descriptions are inherently ambiguous; more prose tends to compound the ' +
        'ambiguity. Two concrete examples beat ten paragraphs of rules.',
    },
    quizQuestionRefs: [{ sectionId: 's3', questionId: 5 }],
  },

  // -----------------------------------------------------------------------
  // Task 3.6 — CI/CD integration
  // -----------------------------------------------------------------------
  {
    id: 'ci-cd-integration',
    title: 'CI/CD integration — `-p`, `--output-format json`, `--json-schema`',
    summary:
      'CI invocations MUST run non-interactively: `-p` (alias `--print`) processes the ' +
      'prompt, prints to stdout, exits. Pipe structured output back to your tooling ' +
      'with `--output-format json` + `--json-schema` for guaranteed-parseable findings. ' +
      'When re-running on a new commit, include prior findings in context so Claude ' +
      'reports only NEW or still-unaddressed issues — not duplicates.',
    source: '.github/workflows/claude-review.yml, .claude/rules/ci.md',
    language: 'bash',
    codeSnippet: `# .github/workflows/claude-review.yml
- name: PR style check (blocking, synchronous)
  run: |
    claude -p \\
      --output-format json \\
      --json-schema review-findings.schema.json \\
      "Review the diff for style violations" \\
      > findings.json
    node scripts/post-inline-comments.js findings.json

# review-findings.schema.json — guarantees machine-parseable output
{
  "type": "object",
  "required": ["findings"],
  "properties": {
    "findings": { "type": "array", "items": { "type": "object", "required":
      ["file", "line", "severity", "suggestion"] } }
  }
}

# On RE-RUN after new commits — pass prior findings so Claude only reports new issues:
$ claude -p --output-format json \\
    --context-file prior-findings.json \\
    "Review only NEW or still-unaddressed issues from prior-findings.json"`,
    taskRef: '3.6',
    type: 'config',
    tags: ['CI', 'CLI', '--print', '--output-format', '--json-schema', 'github-actions'],
    related: ['json-schema', 'message-batches', 'multi-instance-review', 'iterative-refinement'],
    antiPattern: {
      title: 'Running interactive Claude in a pipeline',
      language: 'yaml',
      badCode: `# Anti-pattern: omitting -p / --print in a CI step.
- run: claude "Analyze this PR for security issues"

# CI logs:
> Hello! I can help you analyze… Press Enter to continue.
# Job hangs. Times out 30 min later. PR never gets reviewed.`,
      failureMode:
        'Without `-p`, Claude waits for interactive input. The CI job hangs until the ' +
        'pipeline timeout fires. Always use `-p` (or `--print`) in automation.',
    },
    quizQuestionRefs: [
      { sectionId: 's1', questionId: 6 },
      { sectionId: 's1', questionId: 8 },
      { sectionId: 's1', questionId: 13 },
    ],
  },
];
