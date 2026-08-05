import type { Scenario } from '../types'
import { scenario1 } from './s1-support'
import { scenario2 } from './s2-claude-code'
import { scenario3 } from './s3-multi-agent'
import { scenario4 } from './s4-developer'
import { scenario5 } from './s5-ci'
import { scenario6 } from './s6-extraction'

export const SCENARIOS: Scenario[] = [
  scenario1,
  scenario2,
  scenario3,
  scenario4,
  scenario5,
  scenario6,
]

export function scenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id)
}

export function scenarioByNumber(n: number): Scenario | undefined {
  return SCENARIOS.find((s) => s.number === n)
}
