// Help Bot tool registry.
//
// v0.1 — two granular tools (getLesson, checkProgress).
// v0.2 — adds `*Spec` exports per SYNTHESIS.md S-2 (snake_case MCP-grade specs)
//        and two new tools: `lookupQuizAttempts`, `recordWeakSpot`.
// v0.3 — adds `escalateToDocs` so every escalation path resolves to a curated
//        Claude Code docs URL (Architect Scenario 1 TS 5.2).
//
// `helpBotToolSpecs` is the convenience aggregate consumed by
// `src/agents/tools/registry.ts` and by the v0.3 native-tool-use dispatch path.

export { getLesson, getLessonSpec, type GetLessonInput } from './getLesson';
export {
  checkProgress,
  checkProgressSpec,
  type ProgressSummary,
} from './checkProgress';
export {
  lookupQuizAttempts,
  lookupQuizAttemptsSpec,
  type LookupQuizAttemptsInput,
  type QuizAttempt,
} from './lookupQuizAttempts';
export {
  recordWeakSpot,
  recordWeakSpotSpec,
  type RecordWeakSpotInput,
  type WeakSpot,
} from './recordWeakSpot';
export {
  escalateToDocs,
  escalateToDocsSpec,
  type EscalateToDocsInput,
  type EscalateToDocsResult,
} from './escalateToDocs';

// Convenience aggregate — kept alongside the individual exports so the
// registry imports a single symbol.
import { getLessonSpec } from './getLesson';
import { checkProgressSpec } from './checkProgress';
import { lookupQuizAttemptsSpec } from './lookupQuizAttempts';
import { recordWeakSpotSpec } from './recordWeakSpot';
import { escalateToDocsSpec } from './escalateToDocs';

export const helpBotToolSpecs = [
  getLessonSpec,
  checkProgressSpec,
  lookupQuizAttemptsSpec,
  recordWeakSpotSpec,
  escalateToDocsSpec,
] as const;
