// Explicit escalation criteria (Architect Scenario 1 — Customer Support Resolution Agent).
//
// Hard-coded predicates, not soft prompt phrases. Used by the helpBot when it
// can't resolve a learner's question — falls through to "open the docs at X"
// and surfaces that decision in the UI.

export interface TurnState {
  userAsked: boolean;
  consecutiveBusinessErrors: number;
  confidence: number;
}

export type EscalationReason =
  | 'user_request'
  | 'repeated_business_errors'
  | 'low_confidence';

export interface EscalationDecision {
  escalate: boolean;
  reason?: EscalationReason;
}

export function shouldEscalate(state: TurnState): EscalationDecision {
  if (state.userAsked) return { escalate: true, reason: 'user_request' };
  if (state.consecutiveBusinessErrors >= 2)
    return { escalate: true, reason: 'repeated_business_errors' };
  if (state.confidence < 0.4) return { escalate: true, reason: 'low_confidence' };
  return { escalate: false };
}

// Few-shot exemplars used in the helpBot system prompt. The architect mandate is
// to show 2–4 concrete examples rather than rules — the model learns the shape.
export const ESCALATION_FEWSHOT = [
  {
    situation: 'Learner: "can you connect me to a person who actually knows this?"',
    decision: { escalate: true, reason: 'user_request' },
  },
  {
    situation:
      'Two consecutive "not_found" responses from getLesson for the same query',
    decision: { escalate: true, reason: 'repeated_business_errors' },
  },
  {
    situation: 'Coordinator confidence 0.31 on a vague "what should I do next?" question',
    decision: { escalate: true, reason: 'low_confidence' },
  },
  {
    situation: 'A single transient timeout from checkProgress',
    decision: { escalate: false },
  },
] as const;
