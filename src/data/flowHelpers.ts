// Derive per-pattern flow membership and neighbor relationships from flows.ts.
// `partOf`, `precedes`, and `follows` aren't authored on patterns — they're
// computed once at module load from the authoritative `flows` list.

import { flows, type Flow, type FlowStep } from './flows';
import { domains } from './domains';

export interface PatternNeighbor {
  patternId: string;
  patternTitle: string;
  flowId: string;
  flowTitle: string;
  role: string;
}

export interface FlowMembership {
  flow: Flow;
  stepIndex: number;
  step: FlowStep;
}

const titleByPatternId = new Map<string, string>();
for (const d of domains) {
  for (const p of d.patterns) titleByPatternId.set(p.id, p.title);
}

const membershipByPattern = new Map<string, FlowMembership[]>();
const followsByPattern = new Map<string, PatternNeighbor[]>();
const precedesByPattern = new Map<string, PatternNeighbor[]>();

for (const flow of flows) {
  flow.steps.forEach((step, idx) => {
    const memberships = membershipByPattern.get(step.patternId) ?? [];
    memberships.push({ flow, stepIndex: idx, step });
    membershipByPattern.set(step.patternId, memberships);

    if (idx > 0) {
      const prev = flow.steps[idx - 1];
      const followsList = followsByPattern.get(step.patternId) ?? [];
      followsList.push({
        patternId: prev.patternId,
        patternTitle: titleByPatternId.get(prev.patternId) ?? prev.patternId,
        flowId: flow.id,
        flowTitle: flow.title,
        role: prev.role,
      });
      followsByPattern.set(step.patternId, followsList);
    }

    if (idx < flow.steps.length - 1) {
      const nxt = flow.steps[idx + 1];
      const precedesList = precedesByPattern.get(step.patternId) ?? [];
      precedesList.push({
        patternId: nxt.patternId,
        patternTitle: titleByPatternId.get(nxt.patternId) ?? nxt.patternId,
        flowId: flow.id,
        flowTitle: flow.title,
        role: nxt.role,
      });
      precedesByPattern.set(step.patternId, precedesList);
    }
  });
}

export function getFlowsForPattern(patternId: string): FlowMembership[] {
  return membershipByPattern.get(patternId) ?? [];
}

export function getFollowsFor(patternId: string): PatternNeighbor[] {
  return followsByPattern.get(patternId) ?? [];
}

export function getPrecedesFor(patternId: string): PatternNeighbor[] {
  return precedesByPattern.get(patternId) ?? [];
}
