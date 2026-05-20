// First-Contact Resolution (FCR) fixture suite for the Help Bot
// (Architect Scenario 1 — Customer Support Resolution Agent, v0.4 task 9).
//
// Architect-stated target: ≥ 80 % first-contact resolution against this set.
// "Resolution" = the helpBot returns a non-escalated, non-empty answer.
// A fixture with `expectedResolve: false` REQUIRES the helpBot to escalate
// (user_request | low_confidence | repeated_business_errors).
//
// Engineering-facing data only — never imported by views, stores, or agents.
// The `_fixtures/` prefix mirrors `_generated/` (also read-only at runtime
// from the SPA's perspective) and parallels `scripts/extract/fixtures/`.
//
// Stratification (matches sprints/scenario-1-...-deepening.md re-prioritised
// new task #5): each fixture is tagged with a `topic` so the eval can report
// per-stratum FCR alongside the aggregate.
//
// Authoring guard-rails:
//   - Nav prompts MUST contain at least one of the NAV keyword sets in
//     `coordinator.ts` (quiz | lesson | sandbox | atlas | stage | progress |
//     tutor + their synonyms).
//   - Lesson prompts use the canonical "lesson about X" or "lesson on X"
//     phrasing so the coordinator's lesson regex fires.
//   - Forced-escalation prompts hit one of the three escalation predicates:
//       userAsked   → matches /\b(human|person|someone real|talk to a|connect me)\b/i
//       low_conf    → produces no nav/progress/lesson part at all
//       repeated_be → not single-turn reproducible (see eval script note)

export type FixtureTopic =
  | 'navigation'
  | 'progress'
  | 'lesson'
  | 'escalation';

export interface HelpBotFixture {
  id: string;
  prompt: string;
  /** True when the helpBot is expected to give a non-escalated substantive
   *  answer on the first turn. False forces an escalation (any reason). */
  expectedResolve: boolean;
  /** Coarse topic for per-stratum FCR reporting. */
  topic: FixtureTopic;
  /** Optional check — if set, at least one toolCall name must match (camelCase
   *  as recorded in `HelpBotReply.toolCalls`). */
  expectedTool?: string;
  /** Optional check — when escalation IS expected, which reason. */
  expectedEscalationReason?: 'user_request' | 'low_confidence' | 'repeated_business_errors';
  /** Why this fixture exists (helps future maintainers prune drift). */
  rationale: string;
}

export const helpBotFixtures: HelpBotFixture[] = [
  // ---------------------------------------------------------------------
  // Navigation — pure nav keyword matches, no tool call required.
  // Each prompt resolves via matchNav() in coordinator.ts.
  // ---------------------------------------------------------------------
  {
    id: 'nav-quizzes',
    prompt: 'Where are the quizzes?',
    expectedResolve: true,
    topic: 'navigation',
    rationale: 'Canonical nav probe — "quiz" keyword routes to /quiz.',
  },
  {
    id: 'nav-sandbox',
    prompt: "Where's the sandbox?",
    expectedResolve: true,
    topic: 'navigation',
    rationale: '"sandbox" keyword routes to /sandboxes.',
  },
  {
    id: 'nav-atlas',
    prompt: 'Show me the concept atlas',
    expectedResolve: true,
    topic: 'navigation',
    rationale: '"atlas" keyword routes to /atlas.',
  },
  {
    id: 'nav-concept-map',
    prompt: 'Take me to the concept map',
    expectedResolve: true,
    topic: 'navigation',
    rationale: '"map" alias under NAV.atlas routes to /atlas.',
  },
  {
    id: 'nav-stage-begin',
    prompt: 'How do I begin a stage?',
    expectedResolve: true,
    topic: 'navigation',
    rationale: '"stage" and "begin" both NAV keywords for /learn.',
  },
  {
    id: 'nav-tutor',
    prompt: "Where's the tutor?",
    expectedResolve: true,
    topic: 'navigation',
    rationale: '"tutor" NAV keyword routes to /tutor.',
  },
  {
    id: 'nav-repl',
    prompt: 'Open the REPL please',
    expectedResolve: true,
    topic: 'navigation',
    rationale: '"repl" alias under NAV.sandbox routes to /sandboxes.',
  },
  {
    id: 'nav-try-demo',
    prompt: 'I want to try a demo',
    expectedResolve: true,
    topic: 'navigation',
    rationale: '"try" and "demo" both NAV.sandbox aliases.',
  },
  {
    id: 'nav-lessons-index',
    prompt: 'Take me to the lessons',
    expectedResolve: true,
    topic: 'navigation',
    rationale:
      '"lessons" (plural, no space) hits the nav keyword without firing the lesson regex.',
  },

  // ---------------------------------------------------------------------
  // Progress — triggers checkProgress() tool.
  // ---------------------------------------------------------------------
  {
    id: 'progress-status',
    prompt: "What's my progress?",
    expectedResolve: true,
    topic: 'progress',
    expectedTool: 'checkProgress',
    rationale: 'Direct "progress" word fires checkProgress + nav-to-home.',
  },
  {
    id: 'progress-how-am-i',
    prompt: 'How am I doing?',
    expectedResolve: true,
    topic: 'progress',
    expectedTool: 'checkProgress',
    rationale: '"how am i" and "doing" both NAV.progress keywords + progress regex.',
  },
  {
    id: 'progress-next',
    prompt: "What's next for me to do?",
    expectedResolve: true,
    topic: 'progress',
    expectedTool: 'checkProgress',
    rationale: '"next" word fires the progress regex.',
  },
  {
    id: 'progress-stages-done',
    prompt: 'How many stages have I done in my progress?',
    expectedResolve: true,
    topic: 'progress',
    expectedTool: 'checkProgress',
    rationale: 'Explicit "progress" word + nav.progress route.',
  },

  // ---------------------------------------------------------------------
  // Lesson — triggers getLesson() tool with a query.
  // Each `expectedResolve: true` prompt MUST produce a single-match lesson;
  // ambiguous-match prompts go in the validation-error sub-section below
  // (they DO produce a non-escalated answer, just with a clarification ask).
  // ---------------------------------------------------------------------
  {
    id: 'lesson-permissions',
    prompt: 'Show me the lesson about permissions',
    expectedResolve: true,
    topic: 'lesson',
    expectedTool: 'getLesson',
    rationale:
      '"permissions" query → "Permission modes" lesson (single match by title substring).',
  },
  {
    id: 'lesson-headless',
    prompt: 'Find a lesson on headless',
    expectedResolve: true,
    topic: 'lesson',
    expectedTool: 'getLesson',
    rationale: '"headless" query → "Headless command — fill in the blanks" lesson.',
  },
  {
    id: 'lesson-exit',
    prompt: 'Lesson about exit',
    expectedResolve: true,
    topic: 'lesson',
    expectedTool: 'getLesson',
    rationale: '"exit" query → "Exiting a Claude Code session" lesson.',
  },
  {
    id: 'lesson-slash-command',
    prompt: 'Lesson on slash command',
    expectedResolve: true,
    topic: 'lesson',
    expectedTool: 'getLesson',
    rationale: '"slash command" query → "Add a custom slash command" lesson.',
  },
  {
    id: 'lesson-first-session',
    prompt: 'Lesson about first session',
    expectedResolve: true,
    topic: 'lesson',
    expectedTool: 'getLesson',
    rationale: '"first session" query → "Compose a first session" lesson.',
  },
  {
    id: 'lesson-reorder-turn',
    prompt: 'Lesson on a single Claude Code turn',
    expectedResolve: true,
    topic: 'lesson',
    expectedTool: 'getLesson',
    rationale:
      '"a single Claude Code turn" query → "A single Claude Code turn, in order" lesson.',
  },
  {
    id: 'lesson-missing-quantum',
    prompt: 'Lesson on quantum cryptography',
    expectedResolve: true,
    topic: 'lesson',
    expectedTool: 'getLesson',
    rationale:
      'Business-error lesson — getLesson returns "no match"; the helpBot still returns a substantive "I couldn\'t find that lesson" reply (confidence 0.85 from non-empty parts), so it RESOLVES on the first turn. Two of these in a row would trip repeated_business_errors, but a single one does not.',
  },

  // ---------------------------------------------------------------------
  // Forced escalation — user_request predicate.
  // ---------------------------------------------------------------------
  {
    id: 'escalate-human',
    prompt: 'Connect me to a human about this',
    expectedResolve: false,
    topic: 'escalation',
    expectedTool: 'escalateToDocs',
    expectedEscalationReason: 'user_request',
    rationale: '"human" + "connect me" both trip the userAskedHuman regex.',
  },
  {
    id: 'escalate-real-person',
    prompt: 'Can I talk to a real person?',
    expectedResolve: false,
    topic: 'escalation',
    expectedTool: 'escalateToDocs',
    expectedEscalationReason: 'user_request',
    rationale: '"talk to a" + "person" both trip the userAskedHuman regex.',
  },
  {
    id: 'escalate-someone-real',
    prompt: 'I want to speak with someone real',
    expectedResolve: false,
    topic: 'escalation',
    expectedTool: 'escalateToDocs',
    expectedEscalationReason: 'user_request',
    rationale: '"someone real" trips the userAskedHuman regex.',
  },
  {
    id: 'escalate-talk-to-human-quantum',
    prompt: 'Talk to a human about quantum cryptography',
    expectedResolve: false,
    topic: 'escalation',
    expectedTool: 'escalateToDocs',
    expectedEscalationReason: 'user_request',
    rationale:
      'Cross-link demo prompt — also used by the Scenario1LiveDemo card. user_request wins over any other signal.',
  },

  // ---------------------------------------------------------------------
  // Forced escalation — low_confidence predicate.
  // No nav match, no progress match, no lesson match → parts is empty →
  // confidence 0.3 < 0.4 threshold → escalates.
  // ---------------------------------------------------------------------
  {
    id: 'escalate-low-confidence-vague',
    prompt: 'I dunno what to type',
    expectedResolve: false,
    topic: 'escalation',
    expectedTool: 'escalateToDocs',
    expectedEscalationReason: 'low_confidence',
    rationale: 'No NAV keyword, no progress regex, no lesson regex → low_confidence.',
  },
  {
    id: 'escalate-low-confidence-billing',
    prompt: 'What about billing disputes',
    expectedResolve: false,
    topic: 'escalation',
    expectedTool: 'escalateToDocs',
    expectedEscalationReason: 'low_confidence',
    rationale:
      'Out-of-domain prompt with no NAV/progress/lesson match → low_confidence.',
  },
  {
    id: 'escalate-low-confidence-gibberish',
    prompt: 'asdf qwerty',
    expectedResolve: false,
    topic: 'escalation',
    expectedTool: 'escalateToDocs',
    expectedEscalationReason: 'low_confidence',
    rationale: 'Gibberish — no signal at all → low_confidence floor.',
  },
];

/** Aggregate count for the eval header. */
export const HELP_BOT_FIXTURE_COUNT = helpBotFixtures.length;
