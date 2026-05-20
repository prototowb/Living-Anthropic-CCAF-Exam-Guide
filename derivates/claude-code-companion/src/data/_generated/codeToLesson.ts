// Hand-authored mapping from source-tree path prefixes to lesson ids.
//
// Scenario 4 v0.4 task 11. Despite living under `_generated/`, this file is
// hand-authored — the heuristic table is *small enough* that a generation
// pipeline would add more maintenance cost than value (cf. the deepening
// note "lower priority than the TS 5.4 context-isolation work"). The naming
// exception is deliberate: it sits next to `sourceIndex.ts` so future tooling
// CAN consume both from the same import root.
//
// Each key is a path PREFIX. Lookup is longest-prefix-wins so a more specific
// prefix can override a broader one. Values are lesson ids that exist in
// `src/data/lessons.ts` — keep this list in sync when lesson ids change.
//
// Rules:
// 1. Pure data, no side effects (per `src/data/CLAUDE.md` rule 1).
// 2. The view layer is allowed to import this module (it lives in `src/data/`,
//    not `src/agents/` — no agent-layer wall is crossed).
// 3. Beginner-voice neutral — the strings here are ids, not content.

export const codeToLesson: Record<string, string[]> = {
  // Help Bot — the lesson on Claude Code permission modes and adding custom
  // slash commands both teach concepts the help bot's coordinator demonstrates.
  'src/agents/helpBot/': ['l-s2-mcq-modes', 'l-s2-reorder-add-cmd'],
  'src/agents/helpBot/coordinator.ts': ['l-s2-mcq-modes', 'l-s2-reorder-add-cmd'],
  'src/agents/helpBot/tools/': ['l-s2-mcq-modes'],

  // SDK — the lesson on headless `-p --output-format json` is the closest
  // beginner-voice surface for "what shape does the SDK return?".
  'src/sdk/': ['l-s2-blanks-headless'],

  // Tutor coordinator + subagents — there is no S3+ lesson yet (stages are
  // stubs in v0.1), so route to the closest S1/S2 anchor. When S5/S6 lessons
  // ship in v0.2 this entry should re-point at them.
  'src/agents/tutor/coordinator.ts': ['l-s1-reorder-turn', 'l-s1-flow-first-session'],
  'src/agents/tutor/subagents/': ['l-s1-reorder-turn'],
  'src/agents/tutor/tools/': ['l-s2-blanks-headless'],

  // Stage/lesson data — points at the canonical "what a turn looks like"
  // lesson because the data layer is what views render those turns over.
  'src/data/stages.ts': ['l-s1-reorder-turn'],
  'src/data/lessons.ts': ['l-s1-reorder-turn'],

  // Views — anything in the views surface that the researcher might cite
  // (e.g. `TutorView.vue`, `StageView.vue`) maps to the first-session lesson
  // as a soft "this is what you're using right now" affordance.
  'src/views/': ['l-s1-flow-first-session'],
};

/** Longest-prefix-wins lookup. Returns the lesson ids associated with the
 *  most specific prefix of `path`, or an empty array if nothing matches.
 *
 *  Used by `src/views/TutorView.vue` to decorate citation chips with a
 *  "study this" affordance (Scenario 4 v0.4 task 11). */
export function findRelatedLessons(path: string): string[] {
  let bestKey = '';
  for (const key of Object.keys(codeToLesson)) {
    if (path.startsWith(key) && key.length > bestKey.length) {
      bestKey = key;
    }
  }
  return bestKey ? codeToLesson[bestKey] : [];
}
