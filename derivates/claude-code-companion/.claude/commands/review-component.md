---
description: Review one Vue component file with the Scenario 5 CI review rubric, narrowed to that file.
---

You are about to review a single Vue component using the same rubric the Scenario 5 CI pipeline uses. Follow this contract:

1. Identify the component file. Must end in `.vue` and live under `src/components/**` or `src/views/**`. Refuse other paths.
2. Read the file in full.
3. Score against the rubric below — each finding is one of `must-fix`, `should-fix`, `nit`:
   - **Store boundary** — does the component read from `useFooStore()` only, or does it import from `src/agents/*` or `src/data/*` directly? (Views CLAUDE.md rule 2.)
   - **Markdown funnel** — any raw HTML for stage/lesson bodies? Should flow through `MarkdownBlock.vue`.
   - **Beginner voice** — any architect-substrate vocabulary ("Scenario N", "mandate", "TS X.Y") outside `UnderTheHoodView.vue`?
   - **Props & state** — `defineProps` first, single concept per component (one of: quiz section, quiz question, lesson, stage, sandbox).
   - **Persistence** — any direct `localStorage` access? Must use `src/stores/persist.ts`.
4. Output one section per finding, with `path:line` citation and a one-sentence fix.
5. **Do-not-approve gates** — if ANY `must-fix` is present, end with `STATUS: changes-required`. Otherwise `STATUS: approved`.

This prompt body is shared with `.github/workflows/claude-review.yml` (Scenario 5). Keep them in sync.
