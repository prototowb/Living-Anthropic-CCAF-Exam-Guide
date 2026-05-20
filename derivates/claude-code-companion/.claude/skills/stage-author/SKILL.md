---
name: stage-author
description: Author or extend a beginner-curriculum stage (S1–S8). Use when the user asks to write a stage body, add lessons to a stage, or expand a stage stub.
allowed-tools: Read, Edit, Write, Bash(npm run typecheck)
argument-hint: <stage-id>
---

# stage-author

Helps Claude author a stage of the beginner curriculum without drifting out of the project's voice.

## When to invoke

- "Author stage S3."
- "Expand the S5 stub."
- "Write the body for stage 4."

## Contract

1. Read the stage stub in `src/data/stages.ts` to find its anchor question and rungs.
2. Write the body in markdown, following the structure used by S1 and S2:
   - One-line intro
   - "What just happened?" or equivalent walkthrough
   - "The minimum you need to know" bullet list
   - "What's next" pointer
3. Tables are fine — `MarkdownBlock.vue` renders pipe tables.
4. Generate 8-10 quiz items for the stage in `src/data/quizData.ts`, mapped to the stage's `quizSectionId`.
5. Generate 3-4 lessons in `src/data/lessons.ts`, mixing formats.
6. Append lesson ids to `stages[s.id].lessonIds`.
7. Update `PROJECT_PLAN.md` quality-bar checklist for the relevant version.
8. **Beginner voice.** No architect-exam vocabulary on the surface. See root `CLAUDE.md`.

## Output

- Edits to `src/data/{stages,quizData,lessons}.ts`
- `npm run typecheck` runs clean
- Short report of what was added
