export type DomainId = 1 | 2 | 3 | 4 | 5

export interface Domain {
  id: DomainId
  title: string
  weight: number // percent of scored content
  oneLiner: string
}

export interface FlowStep {
  /** A short label shown on the rail. */
  label: string
  /** Markdown-light prose. Plain text + simple <code> already styled via CSS class. */
  body: string
  /** Tool calls fired during this step (purely illustrative). */
  toolCalls?: Array<{ name: string; input: string; result?: string; isError?: boolean }>
  /** What stop_reason / decision occurred at end of step. */
  stopReason?: 'tool_use' | 'end_turn' | 'pause_for_human' | 'error'
  /** Side-band note that flags the exam mandate this step demonstrates. */
  mandate?: string
}

export interface QnA {
  q: string
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string }[]
  correct: 'A' | 'B' | 'C' | 'D'
  explain: string
  /** Reference back to a task statement, e.g. "TS 1.4". */
  ref?: string
}

export interface CodeBlock {
  lang: 'ts' | 'py' | 'json' | 'jsonc' | 'bash' | 'md' | 'yaml'
  label: string
  body: string
}

export interface FoilSide {
  label: string
  /** Short code/config sketch; rendered monospace. */
  body: string
  lang: CodeBlock['lang']
}

/** Wrong way beside right way, with a one-line "why this fails" caption. */
export interface Foil {
  title: string
  wrong: FoilSide
  right: FoilSide
  /** One line: the failure mode the wrong way produces. */
  failure: string
  /** Mandate ref, e.g. "TS 1.5" — resolved to a parent-playbook pattern link. */
  ref?: string
}

export interface InfographicSpec {
  /** One of the named diagram archetypes the Infographic component knows how to render. */
  kind:
    | 'agentic-loop'
    | 'coordinator-subagents'
    | 'tool-zoo'
    | 'plan-vs-direct'
    | 'ci-pipeline'
    | 'extraction-pipeline'
  /** Optional caption. */
  caption?: string
}

export interface Scenario {
  id: string // url slug
  number: 1 | 2 | 3 | 4 | 5 | 6
  title: string
  /** Single sentence shown on the home card. */
  hook: string
  /** Full prose from the exam guide. */
  brief: string
  /** Domain ids that this scenario primarily exercises. */
  primaryDomains: DomainId[]
  /** Concrete worked example illustrating the scenario — a real-world story to anchor learning. */
  example: {
    title: string
    body: string
  }
  flow: FlowStep[]
  code: CodeBlock[]
  infographic: InfographicSpec
  qna: QnA[]
  /** Anti-pattern foils — the derivates family's principle 5, one section per scenario. */
  foils: Foil[]
  /** Two or three key takeaways. */
  takeaways: string[]
}
