import type { DomainId } from './types'

/**
 * Reverse links into the parent playbook (`architect-interactive-playbook`).
 *
 * The parent is not deployed anywhere public; both apps are run locally
 * (parent on 5173, this app on 5180). Override at build time with
 * VITE_PARENT_BASE_URL when the parent gets a stable host.
 * The parent uses hash routing, so links are `<base>/#/<route>`.
 */
export const PARENT_BASE: string =
  (import.meta.env.VITE_PARENT_BASE_URL as string | undefined) ?? 'http://localhost:5173'

export function parentDomainUrl(id: DomainId): string {
  return `${PARENT_BASE}/#/domains/d${id}`
}

export function parentPatternUrl(patternId: string): string {
  return `${PARENT_BASE}/#/patterns/${patternId}`
}

/**
 * Task statement → parent pattern id(s), extracted from the parent's
 * `src/data/domain-content/d*.ts` (each DomainPattern carries a `taskRef`).
 * First entry is the primary pattern for the mandate.
 */
export const TASKREF_TO_PATTERNS: Record<string, string[]> = {
  '1.1': ['agentic-loop'],
  '1.2': ['hub-and-spoke'],
  '1.3': ['parallel-subagents', 'task-allowed-tools'],
  '1.4': ['programmatic-prerequisites'],
  '1.5': ['posttool-hooks'],
  '1.6': ['task-decomposition'],
  '1.7': ['session-resume-fork'],
  '2.1': ['granular-tools'],
  '2.2': ['structured-errors'],
  '2.3': ['tool-distribution'],
  '2.4': ['mcp-scoping'],
  '2.5': ['builtin-tools'],
  '3.1': ['claude-md-hierarchy'],
  '3.2': ['slash-commands-and-skills'],
  '3.3': ['path-scoped-rules'],
  '3.4': ['plan-vs-direct'],
  '3.5': ['iterative-refinement'],
  '3.6': ['ci-cd-integration'],
  '4.1': ['explicit-criteria'],
  '4.2': ['few-shot'],
  '4.3': ['json-schema'],
  '4.4': ['validation-retry-loops'],
  '4.5': ['message-batches'],
  '4.6': ['multi-instance-review'],
  '5.1': ['case-facts-block', 'context-pruning'],
  '5.2': ['escalation'],
  '5.3': ['multi-agent-error-propagation'],
  '5.4': ['scratchpad'],
  '5.5': ['human-review-confidence'],
  '5.6': ['provenance-and-uncertainty'],
}

export interface MandateRef {
  /** e.g. "TS 1.4" */
  ts: string
  patternId: string
  url: string
}

/** Extract every "TS x.y" in a mandate/ref string and resolve it to a parent pattern link. */
export function mandateRefs(text: string): MandateRef[] {
  const out: MandateRef[] = []
  for (const m of text.matchAll(/TS (\d\.\d)/g)) {
    const patterns = TASKREF_TO_PATTERNS[m[1]]
    if (!patterns) continue
    const patternId = patterns[0]
    const ts = `TS ${m[1]}`
    if (out.some((r) => r.ts === ts)) continue
    out.push({ ts, patternId, url: parentPatternUrl(patternId) })
  }
  return out
}
