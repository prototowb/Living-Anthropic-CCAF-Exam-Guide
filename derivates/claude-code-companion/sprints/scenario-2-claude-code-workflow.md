# Scenario 2 — Code Generation with Claude Code

> *Verbatim from the exam guide:* "You are using Claude Code to accelerate software development. Your team uses it for code generation, refactoring, debugging, and documentation. You need to integrate it into your development workflow with custom slash commands, CLAUDE.md configurations, and understand when to use plan mode vs direct execution."
>
> *Primary domains:* Claude Code Configuration & Workflows · Context Management & Reliability

## What this scenario teaches the engineer reading the source

Uniquely meta: the engineer doesn't read code that *demonstrates* Scenario 2 — they read the **project's own developer workflow**, which IS Scenario 2 in production. CLAUDE.md hierarchy, slash commands, skills, plan-vs-direct rules are real files Claude Code consumes when you work *on this repo*. The recursion: an engineer using Claude Code to extend the companion is themselves practising what the companion teaches.

## v0.1 state (already shipped)

- `CLAUDE.md` (root) — repo-wide conventions, plan-vs-direct rubric, "what NOT to do"
- `src/agents/CLAUDE.md` — Tutor `allowedTools` mandate, ToolResponse contract, capabilities rule
- `src/data/CLAUDE.md` — purity rule, types-first, beginner voice
- `src/views/CLAUDE.md` — store-only access, MarkdownBlock funnel, the under-the-hood vocabulary boundary
- `.claude/commands/author-lesson.md` — first custom slash command
- `.claude/skills/stage-author/SKILL.md` — first custom skill

## v0.2 plan

1. **Add three slash commands aligned with active scenarios.**
   - `.claude/commands/extract-content.md` — runs the Scenario 6 content pipeline against a markdown source.
   - `.claude/commands/explain-this.md` — runs the Scenario 4 codebase researcher against the selected file.
   - `.claude/commands/review-component.md` — Scenario-5-shaped review prompt, narrowed to one Vue component.
   - Acceptance: each file exists, has frontmatter `description:`, and a manual `claude > /extract-content` invocation produces the expected behaviour.
2. **Two new skills.**
   - `.claude/skills/lesson-quality/SKILL.md` — gates lesson PRs: checks rung label sanity, anchor-question fit, voice rule. Triggers on edits to `src/data/lessons.ts`.
   - `.claude/skills/sandbox-author/SKILL.md` — scaffolds a new sandbox (transcript JSON in `src/data/sandboxes.ts` + component shell + index registration).
3. **`docs/LIVING_WORKFLOW.md`** — narrated walkthrough: "Here is how I used Claude Code to build `FlowBuilderRunner.vue`." Includes the prompt, the plan-mode output, where direct execution kicked in. Acceptance: a developer reading it can replay the workflow.

## v0.3 plan

4. **Plan-mode rubric refinement in root CLAUDE.md.** v0.1 has two paragraphs; expand to a small decision table with seven concrete examples drawn from this repo's actual change history. Acceptance: the rubric correctly classifies ten retrospective changes from the v0.1 work.
5. **`.claude/settings.json` with hooks.** Configure project-level permission allow/deny plus a `preToolUse` hook that runs `npm run typecheck` after Edit calls in `src/**`. Acceptance: an Edit that breaks typecheck triggers the hook and surfaces the error in-session.
6. **Local-model conventions.** A new section in root CLAUDE.md covering "what local model adapters can/can't do safely" — mirroring the project plan's §7a but framed as developer rules ("don't author prompts that assume native tool use"). Acceptance: cross-reference from `src/agents/CLAUDE.md`.
7. **Per-scenario CLAUDE.md.** Add `src/agents/helpBot/CLAUDE.md` (Scenario 1 area), `src/agents/tutor/CLAUDE.md` (Scenario 3 area), `scripts/extract/CLAUDE.md` (Scenario 6 area). Each ~15 lines, encoding the local rules unique to that scenario's directory.

## v0.4 plan

8. **Output-style file.** `.claude/output-styles/companion.md` — locks the response shape Claude uses when working on this repo (terse, no trailing summaries, file-paths-with-line-numbers).
9. **Status-line config.** `.claude/status-line.sh` (or settings.json equivalent) surfaces "current stage being authored" and "test status" while working.
10. **`/under-the-hood` inspector.** New section on the page that lists every `.claude/**` file with one-line purpose and a "view source" link. Acceptance: the page makes the Scenario 2 artefacts inspectable from the running app.
11. **CLAUDE.md hygiene check.** A script at `scripts/check-claude-md.ts` that fails CI if any subdirectory adds new conventions that contradict the root file. Acceptance: a deliberately conflicting subdir CLAUDE.md trips the check.

## Risks and open questions

- **Skill bloat.** Easy to author skills; harder to retire them. Tag each skill with the version it was added so audits can prune.
- **Settings.json scope confusion.** Project `.claude/settings.json` vs user `~/.claude/settings.json` vs `settings.local.json` — the LIVING_WORKFLOW.md must explain the scope precedence, not just demonstrate it.
- **CLAUDE.md hierarchy bleed.** Subdirectory CLAUDE.md files extend the root; they shouldn't restate it. The hygiene check at task 11 must distinguish "extends" from "duplicates."

## Cross-cutting notes

Scenario 2 is the **frame** for every other scenario's work. Concretely:
- Scenario 1 — `src/agents/helpBot/CLAUDE.md` (task 7) localises rules for that area.
- Scenario 3 — `src/agents/tutor/CLAUDE.md` (task 7) ditto.
- Scenario 4 — `.claude/commands/explain-this.md` (task 1) drives the codebase researcher.
- Scenario 5 — the CI workflow shares prompt conventions with `.claude/commands/review-component.md`; v0.4 hooks into `.claude/settings.json`.
- Scenario 6 — `.claude/commands/extract-content.md` (task 1) is the developer-facing entry point.

This scenario has no runtime `capabilities` check — its artefacts are .md files that Claude Code itself consumes; no in-app code path branches on them.
