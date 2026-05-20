# Scenario 2 — Deepening pass

> Addendum to scenario-2-claude-code-workflow.md. Reviewed against Task Statements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 5.1.

## Architect mandates we are honouring

- **3.1 — Hierarchy.** Root `CLAUDE.md` plus three directory-level files (`src/agents/`, `src/data/`, `src/views/`) each explicitly stating "these rules **extend** the root". The "closer files win" framing is correct hierarchy language.
- **3.1 — Scoping.** Every subdirectory file opens with the path it scopes to ("apply only to `src/agents/**`"). Good practice for diagnosing scope confusion.
- **3.2 — Project-scoped commands.** `.claude/commands/author-lesson.md` lives under version control with a `description:` frontmatter — meets the team-shared definition.
- **3.2 — Skill with on-demand triggers.** `.claude/skills/stage-author/SKILL.md` has a `description:` that names invocation phrases ("Author stage S3").
- **3.4 — Plan vs direct rubric.** Root `CLAUDE.md` already contains a small rubric and v0.3 task 4 expands it to a decision table.
- **3.6 — CLAUDE.md as CI context.** v0.4 task 11 (`scripts/check-claude-md.ts`) and Scenario 5 v0.3 task 4 wire the same file into CI gates.

## Architect mandates we are NOT yet honouring (gaps)

- **3.1 — `@import` syntax.** No file uses `@import` to compose modular standards. Today the four CLAUDE.md files duplicate the "extends the root" preamble. **New task → v0.3:** import a shared `.claude/rules/voice.md` from each subdirectory file instead of restating beginner-voice in three places.
- **3.1 — user-level vs project-level distinction.** Nothing in the plan teaches the reader that `~/.claude/CLAUDE.md` is not versioned. **New task → v0.3:** add a "scope precedence" sidebar to `docs/LIVING_WORKFLOW.md` (already on v0.2 deck — extend its acceptance criterion).
- **3.3 — Path-specific rules via glob.** Zero `.claude/rules/` files exist. Some rules (e.g., "tests must use `vi.mock`", "Vue components must declare `defineProps` first") cross directory boundaries and belong in glob-scoped rule files, not CLAUDE.md. **New task → v0.3.**
- **3.2 — Skill frontmatter coverage.** `stage-author/SKILL.md` lacks `context: fork`, `allowed-tools`, and `argument-hint`. The skill is verbose (reads several files, writes three) — a textbook case for `context: fork`. **New task → v0.2** (revise existing skill, not a new one).
- **3.5 — Iterative refinement.** No artefact teaches the interview pattern, test-first iteration, or the "interacting vs independent issues" heuristic. **New task → v0.3:** add a section to `docs/LIVING_WORKFLOW.md` showing one worked example of each.
- **3.4 — Explore subagent.** The plan-vs-direct rubric (root CLAUDE.md + v0.3 task 4) doesn't mention the Explore subagent for context preservation during discovery. **New task → v0.3:** add a third row to the decision table.
- **5.1 — Context management conventions.** Nothing names `/compact`, `/clear`, or `/resume`. No "case facts block" convention. No rule for trimming verbose tool outputs. **New task → v0.4:** add a `## Long-session conventions` section to root `CLAUDE.md`.

## Liftable patterns from the parent project

- **Reference Index table.** The parent's "📋 Reference Index" lists every top-level doc with a one-line purpose and a "Read When" trigger. Our root `CLAUDE.md` jumps straight into conventions. Port the table form so a new contributor sees what to read first.
- **Trigger → Capability table.** The parent has a keyword-to-capability mapping. We have skills and slash commands but no central trigger list. Port a slimmer version naming the four to six commands and the active skills.
- **Generated/hand-edited markers.** The parent uses `<!-- proto-gear:agent-context begin -->` fences to mark auto-regenerated sections. The v0.4 task 11 hygiene check would benefit from the same convention: treat fenced regions as authoritative; subdirectory rules outside the fence are "extensions" that the check tolerates.

## Efficiency wins (shared with other scenarios)

- **Slash command coordination.** Three commands are proposed across the deck: `/explain-this` (S2 v0.2 task 1, drives S4 researcher), `/extract-content` (S2 v0.2 task 1, drives S6 pipeline), `/review-component` (S2 v0.2 task 1, shares prompt body with S5 CI review). They are coordinated — no duplication — but each command file MUST sit in `.claude/commands/` and reference the canonical implementation, not inline it. Acceptance addition: each command body is ≤ 25 lines and ends with "see `<path-to-real-implementation>`".
- **`.claude/settings.json` spec (single source).** Spec'd once here, consumed by Scenario 5 v0.3 task 4:
  - `permissions.allow`: `Edit(src/**)`, `Edit(scripts/**)`, `Bash(npm run *)`, `Bash(git diff *)`, `Bash(git status)`.
  - `permissions.deny`: `Bash(rm *)`, `Bash(rm -rf *)`, `Bash(git push *)`, `Bash(curl * | bash)`, `WebFetch(*)` except `raw.githubusercontent.com`, `docs.github.com`.
  - `hooks.preToolUse`: `.claude/hooks/scope-guard.sh` for Edit/Write scoping (Scenario 5 v0.3 task 4) AND a chained `npm run typecheck` after Edits in `src/**` (Scenario 2 v0.3 task 5).
  - `hooks.postToolUse`: noop in v0.3; reserved for status-line refresh (v0.4 task 9).
  Both scenarios reference this section instead of restating.
- **Per-scenario CLAUDE.md directory boundaries.** v0.3 task 7 proposes `src/agents/helpBot/CLAUDE.md`, `src/agents/tutor/CLAUDE.md`, `scripts/extract/CLAUDE.md`. Boundaries are sane — each maps to one scenario's runtime code. **Watch-out:** `src/agents/tutor/subagents/` is owned by Scenario 4 (codebase researcher body). If a fourth file `src/agents/tutor/subagents/CLAUDE.md` materialises, that's a path-specific-rule case (3.3) and belongs in `.claude/rules/` instead.

## Re-prioritised tasks

- **Move v0.4 task 11 (CLAUDE.md hygiene check) → v0.3.** Justification: the v0.3 plan adds three per-scenario CLAUDE.md files (task 7); the hygiene check should land in the same sprint so subdirectory files are validated as they appear.
- **Move v0.3 task 6 (Local-model conventions) → v0.4.** Justification: local-model adapters are PROJECT_PLAN §7a, which is v0.3 work for Scenarios 1/3/6. The dev-facing conventions land cleanly only after the adapters exist.

## New tasks to add

- **Title:** `.claude/rules/voice.md` shared rule file
  **Sprint:** v0.3
  **Files:** `.claude/rules/voice.md` (new), all three subdirectory `CLAUDE.md` files (replace inline rule with `@.claude/rules/voice.md`).
  **Acceptance:** beginner-voice rule appears once; subdirectory files import it via `@import` syntax; `/memory` lists `voice.md` as loaded when working in `src/data/**` or `src/views/**`.

- **Title:** Path-specific rules under `.claude/rules/`
  **Sprint:** v0.3
  **Files:** `.claude/rules/tests.md` (`paths: ["**/*.test.ts", "**/*.spec.ts"]`), `.claude/rules/vue-components.md` (`paths: ["src/**/*.vue"]`), `.claude/rules/scripts.md` (`paths: ["scripts/**/*"]`).
  **Acceptance:** editing a `.vue` file in a `claude` session loads the Vue rules; editing a `.ts` file outside `src/` does not load Vue rules. Verified via `/memory`.

- **Title:** Revise `stage-author/SKILL.md` frontmatter to add `context: fork`, `allowed-tools`, `argument-hint`
  **Sprint:** v0.2
  **Files:** `.claude/skills/stage-author/SKILL.md`.
  **Acceptance:** skill runs in a forked subagent; main session transcript does not contain the multi-file reads; `allowed-tools` excludes `Bash` except `Bash(npm run typecheck)`; invoking without arguments prompts "which stage?".

- **Title:** Iterative-refinement teaching section in `docs/LIVING_WORKFLOW.md`
  **Sprint:** v0.3
  **Files:** `docs/LIVING_WORKFLOW.md` (extend v0.2 task 3).
  **Acceptance:** the doc shows one worked example each of (a) interview pattern, (b) test-first iteration sharing failures, (c) interacting-vs-independent issue bundling. Each example cites a real commit in this repo.

- **Title:** Long-session conventions in root `CLAUDE.md` (Task Statement 5.1)
  **Sprint:** v0.4
  **Files:** root `CLAUDE.md`.
  **Acceptance:** a `## Long-session conventions` section names when to invoke `/compact` (before context fills past ~70 %), when to `/clear` (between independent tickets), and the "case facts block" pattern for multi-ticket sessions. Cross-link from `docs/LIVING_WORKFLOW.md`.

- **Title:** Explore-subagent row in plan-vs-direct decision table
  **Sprint:** v0.3
  **Files:** root `CLAUDE.md` (extend v0.3 task 4).
  **Acceptance:** decision table contains a row "verbose discovery before a plan" → "Explore subagent, then plan mode" with one concrete example from this repo (e.g., "map every `ToolResponse<T>` consumer before refactoring the type").

- **Title:** Reference Index + Trigger table in root `CLAUDE.md` (parent-project pattern)
  **Sprint:** v0.4
  **Files:** root `CLAUDE.md`.
  **Acceptance:** root file opens with a Reference Index table (lists `PROJECT_PLAN.md`, `docs/LIVING_WORKFLOW.md`, the four directory CLAUDE.md files, each `.claude/rules/` file) and a Trigger → Capability table for the project's slash commands and skills. Both tables sit above the conventions section.
