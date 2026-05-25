---
description: Path-specific rules for the data layer. Glob-scoped per TS 3.3.
paths:
  - "src/data/**"
---

# Data layer rules (glob-scoped)

These rules are activated by path glob `src/data/**`. They overlap with `src/data/CLAUDE.md` on purpose — the *binding mechanism* differs. CLAUDE.md is loaded when the working directory is under `src/data/`; this file is loaded when *the edited file* matches the glob, no matter where the session is rooted.

1. **Pure data, no side effects.** No imports from `@/stores`, `@/views`, or `@/agents`. The data layer is the source of truth — everyone else reads.
2. **Types live in `src/data/types.ts`.** Every other file in this directory imports its shape from there. If a new shape is needed, add it to `types.ts` first.
3. **Stage authoring.** All eight stages (S1–S8) are authored content in v0.3 — full `body`, non-empty `lessonIds`, and a `sandboxId`. A stage with empty `lessonIds` is a stub and should be flagged before merge; the `stageStub()` helper is no longer used.
4. **Beginner voice.** Stage bodies, lesson summaries, quiz explanations should never reference the architect exam, the six scenarios, or the word "mandate". Forbidden tokens: `Scenario`, `architect`, `mandate`, `TS 4.`, `TS 5.`, `subagent`. That vocabulary belongs only to `src/views/UnderTheHoodView.vue`.
5. **Content authored against anchor questions.** Each stage has an `anchorQuestion`. Every quiz item and lesson in that stage should be answerable from the body — or should be a sandbox that teaches the gap.
6. **`_generated/*` is read-only here.** Edits to `src/data/_generated/**` belong to the extraction pipeline (`scripts/extract/`). The settings.json deny list backs this rule with a tool-level refusal.
