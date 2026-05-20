---
name: lesson-quality
description: Gate edits to lessons in src/data/lessons.ts. Use whenever the user edits, adds, or reviews a lesson — checks rung label sanity, anchor-question fit, and beginner-voice rule.
allowed-tools: Read, Grep, Edit, Bash(npm run typecheck)
argument-hint: <lesson-id-or-path>
---

# lesson-quality

Verifies every change to `src/data/lessons.ts` upholds the three quality bars that distinguish a usable lesson from filler.

## When to invoke

- The user edits `src/data/lessons.ts` (any add / change / reorder).
- The user asks "is this lesson good?" or "review my lesson".
- After `/author-lesson` finishes — invoke before reporting back.

## Checks (all three must pass)

1. **Rung label sanity.** Each lesson references a stage `s1`–`s8`. The rung label in the lesson body must match `stages[stageId].rungLabel`. Reading `src/data/stages.ts` is mandatory before passing this check.
2. **Anchor-question fit.** Read `stages[stageId].anchorQuestion`. The lesson — completed correctly — must move the learner closer to answering it. If the connection is indirect, ask the user to either reword the anchor question or move the lesson to a different stage. Do not silently accept drift.
3. **Beginner voice.** Scan the lesson body (prompt, cards, rationale, explanation) for forbidden tokens: `Scenario`, `architect`, `mandate`, `TS 4.`, `TS 5.`, `subagent`. Forbidden tokens belong only in `src/views/UnderTheHoodView.vue` per `src/views/CLAUDE.md` rule 5.

## Output

- A list of `pass` / `fail` lines, one per check, with citations to `path:line`.
- For any `fail`: a proposed fix as an `Edit` patch, but apply it only after confirmation.
- Final: `npm run typecheck` exit code.
