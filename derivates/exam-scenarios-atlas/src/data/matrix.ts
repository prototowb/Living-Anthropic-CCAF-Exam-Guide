import type { DomainId, Scenario } from './types'

/**
 * The matrix is a pure projection of SCENARIOS: every `TS x.y` a scenario
 * cites — in flow-step mandates, Q&A refs, or foil refs — lands in the cell
 * (scenario, domain x). No separate matrix data is authored.
 */
export function scenarioTaskRefs(s: Scenario): string[] {
  const texts = [
    ...s.flow.map((f) => f.mandate ?? ''),
    ...s.qna.map((q) => q.ref ?? ''),
    ...s.foils.map((f) => f.ref ?? ''),
  ]
  const refs = new Set<string>()
  for (const t of texts) {
    for (const m of t.matchAll(/TS (\d\.\d)/g)) refs.add(m[1])
  }
  return [...refs].sort()
}

export function refsForDomain(refs: string[], domain: DomainId): string[] {
  return refs.filter((r) => r.startsWith(`${domain}.`))
}
