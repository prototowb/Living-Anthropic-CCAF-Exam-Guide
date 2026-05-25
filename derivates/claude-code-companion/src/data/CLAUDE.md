# Data layer — local rules

These rules **extend** the root `CLAUDE.md`. They apply only to `src/data/**`.

1. **Pure data, no side effects.** No imports from `@/stores`, `@/views`, or `@/agents`. The data layer is the source of truth — everyone else reads.
2. **Types live in `types.ts`.** Every other file in this directory imports its shape from there. If a new shape is needed, add it to `types.ts` first.
3. **Stage authoring.** All eight stages (S1–S8) are authored content in v0.3 — full `body`, non-empty `lessonIds`, `sandboxId`. The `stageStub()` helper is no longer used.
4. **Beginner voice.** Stage bodies, lesson summaries, quiz explanations should never reference the architect exam, the six scenarios, or the word "mandate". That vocabulary belongs only to `src/views/UnderTheHoodView.vue`.
5. **Content authored against anchor questions.** Each stage has an `anchorQuestion`. Every quiz item and lesson in that stage should be answerable from the body — or should be a sandbox that teaches the gap.
