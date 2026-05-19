// Explicit escalation criteria (Domain 5 mandate).
//
// Hard-coded predicates — not soft prompt phrases. Few-shot examples below
// teach the model what each trigger looks like in practice.

export interface TurnState {
  userAsked: boolean;
  consecutiveBusinessErrors: number;
  confidence: number;
}

export interface EscalationDecision {
  escalate: boolean;
  reason?: 'user_request' | 'repeated_business_errors' | 'low_confidence';
}

export function shouldEscalate(state: TurnState): EscalationDecision {
  if (state.userAsked) return { escalate: true, reason: 'user_request' };
  if (state.consecutiveBusinessErrors >= 2)
    return { escalate: true, reason: 'repeated_business_errors' };
  if (state.confidence < 0.4) return { escalate: true, reason: 'low_confidence' };
  return { escalate: false };
}

export const ESCALATION_FEWSHOT = [
  {
    situation: 'User: "Can a human take this from here?"',
    decision: { escalate: true, reason: 'user_request' },
  },
  {
    situation: 'Two consecutive business-category errors from gradeAnswer',
    decision: { escalate: true, reason: 'repeated_business_errors' },
  },
  {
    situation: 'Coordinator confidence 0.32 for a one-off classification',
    decision: { escalate: true, reason: 'low_confidence' },
  },
  {
    situation: 'A single transient timeout from search_patterns',
    decision: { escalate: false },
  },
] as const;
