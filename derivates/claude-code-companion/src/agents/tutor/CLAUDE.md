# Tutor — local rules (Scenario 3 area)

These rules **extend** the root `CLAUDE.md` and `src/agents/CLAUDE.md`. They apply only to `src/agents/tutor/**`.

1. **`allowedTools` MUST include `'Task'`.** Asserted at module load in `coordinator.ts`. Spawning subagents is the whole point of Scenario 3; removing `Task` is a misconfiguration.
2. **Capabilities-aware dispatch is mandatory.** The parallel branch fires only when `adapter.capabilities.parallelSubagents === true` AND `intent.subagents.length > 1`. Every other case is serial. Do not unconditionally parallelise — small local models cannot service concurrent generations.
3. **No `Promise.all` on subagent dispatch.** Use `dispatchAllSettled` from `./dispatch.ts`. A single spoke failure must not reject the whole turn (SYNTHESIS.md §S-3, TS 5.3). The serial branch uses an explicit try/catch loop with the same `{ results, errors }` split.
4. **Intent classification uses `jsonSchema` + few-shot.** When `adapter.capabilities.schemaMode === false`, fall back to `extractFirstJsonObject` from `src/agents/schemas/parse.ts` (SYNTHESIS.md §S-6). Never re-parse prose for the same shape twice.
5. **Scratchpad append is mandatory.** Every turn appends one line to `tutorScratchpad` (`src/agents/scratchpad.ts`). The `/under-the-hood` view renders this — silence is a Scenario 3 demo failure.
6. **Subagent registry is the only dispatch path.** Coordinator code references `subagentRegistry[name]`. Hard-coded if-chains over subagent names are a refactor smell — extend the registry instead.
7. **Failure footers compose in the coordinator, never the view.** `TutorTurn.reply` carries the merged text including the `[N spoke(s) failed]` footer. Views render the string; they do not know about `SpokeFailure[]` shape.
