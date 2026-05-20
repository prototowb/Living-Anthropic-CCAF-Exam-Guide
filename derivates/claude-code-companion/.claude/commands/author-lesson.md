---
description: Author a new micro-lesson tied to a stage, in the project's beginner voice.
---

You are about to add a new lesson to `src/data/lessons.ts`. Follow this contract:

1. Ask which stage (`s1` … `s8`) the lesson anchors to. If the stage is a stub (S3-S8 in v0.1), confirm with the user before authoring — content for those stages is gated to v0.2.
2. Ask which format: `reorder`, `blanks`, `mcq`, `flow-builder`. If unsure, default to `mcq` for binary recall, `reorder` for process knowledge.
3. Read `src/data/types.ts` to confirm the lesson shape.
4. Generate an id of the form `l-<stageId>-<format>-<slug>` (e.g., `l-s2-mcq-modes`).
5. Add the lesson object to the `lessons` array in `src/data/lessons.ts`, near other lessons for the same stage.
6. Append the new id to `stages.lessonIds` for the matching stage in `src/data/stages.ts`.
7. **Beginner voice.** Never reference the architect exam, the six scenarios, or the word "mandate". This rule comes from the root CLAUDE.md.
8. Run `npm run typecheck` before reporting back.
