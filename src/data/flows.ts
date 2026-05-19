// Named flows — the architect's recipes.
//
// Each flow is an ordered sequence of patterns that compose together to build
// something real. Flows are the source of truth for "what comes after what",
// "which patterns belong together", and the basis for the Concept Atlas, the
// flow walkthroughs, and the flow-builder micro-lessons.

export interface FlowStep {
  patternId: string;
  /** One-line label for this step's role in the flow. */
  role: string;
  /** Paragraph explaining WHY this pattern sits at this position in this flow. */
  why: string;
}

export interface Flow {
  id: string;
  title: string;
  /** One-sentence pitch — what this flow builds and why you'd use it. */
  summary: string;
  /** Domain ids the flow touches (d1..d5). Used for atlas grouping. */
  domainsCovered: ('d1' | 'd2' | 'd3' | 'd4' | 'd5')[];
  /** Scenario it maps to in the exam guide (informal). */
  scenarioHint?: string;
  steps: FlowStep[];
}

export const flows: Flow[] = [
  // -----------------------------------------------------------------------
  {
    id: 'coordinator-turn',
    title: 'Hub-and-Spoke coordinator turn',
    summary:
      'One full turn of a multi-agent coordinator: from a user prompt to a merged reply, ' +
      'with parallel dispatch, structured tool responses, context pruning, scratchpad, and ' +
      'an escalation check at the end.',
    domainsCovered: ['d1', 'd2', 'd4', 'd5'],
    scenarioHint: 'Multi-agent research / customer support',
    steps: [
      {
        patternId: 'few-shot',
        role: 'Classify intent',
        why:
          'Routing decides which subagents to dispatch. 2–4 worked examples on the ambiguous ' +
          'cases beat a long declarative prompt. The output is shape-constrained by a JSON ' +
          'schema so the next step can rely on a typed plan.',
      },
      {
        patternId: 'task-allowed-tools',
        role: 'Spawn subagents',
        why:
          'The coordinator can only dispatch because `Task` is in its allowedTools. Assert ' +
          "this at module load — if it's missing, the architecture silently fails to work.",
      },
      {
        patternId: 'parallel-subagents',
        role: 'Dispatch in parallel',
        why:
          'Independent subagents go in one Promise.all batch. Total latency is bounded by ' +
          'the slowest spoke, not the sum. If two subagents have a real dependency, the ' +
          'second waits — but only then.',
      },
      {
        patternId: 'structured-errors',
        role: 'Handle tool failures',
        why:
          'Each tool inside each subagent returns `ToolResponse<T>`. The coordinator sees ' +
          "`isError + errorCategory` per call and decides retry vs change-strategy vs escalate — without parsing strings.",
      },
      {
        patternId: 'context-pruning',
        role: 'Prune verbose outputs',
        why:
          'Web search and document analysis return 80K+ tokens of raw content. Prune fields ' +
          'over the budget before merging into the synthesis context — otherwise the ' +
          '"lost in the middle" effect erases your most relevant findings.',
      },
      {
        patternId: 'escalation',
        role: 'Check escalation predicates',
        why:
          'Hard predicates only: explicit human request, repeated business errors, policy gap, ' +
          'or no-progress. Not sentiment, not self-reported confidence. Run this BEFORE the ' +
          'reply so a flagged turn hands off cleanly.',
      },
      {
        patternId: 'scratchpad',
        role: 'Persist key findings',
        why:
          'After every turn, append a one-line finding. Next turn reads the scratchpad first ' +
          'and stays grounded in the specifics it already discovered — counteracting long-' +
          'session drift toward "typical patterns".',
      },
    ],
  },

  // -----------------------------------------------------------------------
  {
    id: 'tool-call-lifecycle',
    title: 'Tool call lifecycle',
    summary:
      'A single tool call from the model\'s decision through the deterministic guards, the ' +
      'tool itself, the normalization hook, the structured response, and back into context.',
    domainsCovered: ['d1', 'd2', 'd5'],
    steps: [
      {
        patternId: 'granular-tools',
        role: 'Model selects a tool',
        why:
          "Tool descriptions are the only signal the model has for selection. The granular " +
          'shape (one job per tool, with input formats + boundaries) is what makes the next ' +
          'step land on the right tool 95+% of the time.',
      },
      {
        patternId: 'programmatic-prerequisites',
        role: 'Prerequisite gate runs FIRST',
        why:
          "Before the tool executes, a deterministic guard checks the required prior step has " +
          "completed (e.g. customer verified). This is enforced in code — prompt instructions " +
          'alone fail at non-zero rate, which is unacceptable for compliance-critical sequences.',
      },
      {
        patternId: 'posttool-hooks',
        role: 'PostToolUse normalizes the result',
        why:
          'After execution but before the model sees it, the PostToolUse hook normalizes data ' +
          "(Unix → ISO 8601, numeric status → human-readable). This works even for third-party " +
          "MCP tools you don't own.",
      },
      {
        patternId: 'structured-errors',
        role: 'Wrap the result',
        why:
          'Whether success or failure, the result conforms to `ToolResponse<T>`. The caller ' +
          'switches on `isError` + `errorCategory` to decide what to do next.',
      },
      {
        patternId: 'context-pruning',
        role: 'Prune before context insertion',
        why:
          'Field-level pruning drops verbose payloads before they accumulate in the model\'s ' +
          'window. Otherwise the 40+ irrelevant fields per order lookup push the relevant ' +
          'ones into the "lost in the middle" zone.',
      },
    ],
  },

  // -----------------------------------------------------------------------
  {
    id: 'support-resolution',
    title: 'Customer-support resolution turn',
    summary:
      'A single support turn: identify the customer, look up the order, decide between ' +
      'self-service refund and human escalation — with the case facts kept verbatim throughout.',
    domainsCovered: ['d1', 'd2', 'd5'],
    scenarioHint: 'Customer Support Resolution Agent',
    steps: [
      {
        patternId: 'case-facts-block',
        role: 'Read the case-facts block',
        why:
          'Before reasoning, the agent reads the persistent case-facts block — amounts, dates, ' +
          'order IDs the customer stated earlier. These never get summarized away, so the ' +
          'agent uses exact values, not a paraphrase.',
      },
      {
        patternId: 'granular-tools',
        role: 'Pick the right lookup',
        why:
          'Clear tool boundaries (`get_customer` vs `lookup_order`) prevent the agent from ' +
          'guessing the wrong tool when the customer says "check my account for the order I placed".',
      },
      {
        patternId: 'programmatic-prerequisites',
        role: 'Verify identity before any refund',
        why:
          "Refund tools are blocked by a code-level gate until `get_customer` returns a " +
          'verified ID. Prompt instructions alone failed 12% of the time in production.',
      },
      {
        patternId: 'posttool-hooks',
        role: 'Normalize MCP results',
        why:
          'Third-party order systems return Unix timestamps and numeric status codes. The ' +
          "PostToolUse hook normalizes them centrally so the model doesn't reinterpret them " +
          'inconsistently per turn.',
      },
      {
        patternId: 'escalation',
        role: 'Check policy gap → escalate',
        why:
          'When the customer\'s request hits a policy gap (e.g. competitor price matching ' +
          'when policy only addresses own-site adjustments), do not invent policy — escalate ' +
          'with a structured handoff summary.',
      },
    ],
  },

  // -----------------------------------------------------------------------
  {
    id: 'multi-agent-research',
    title: 'Multi-agent research run',
    summary:
      'Decompose a topic into partitioned subtopics, dispatch web-search and document-analysis ' +
      'in parallel, propagate structured errors, then synthesize with provenance.',
    domainsCovered: ['d1', 'd2', 'd5'],
    scenarioHint: 'Multi-Agent Research System',
    steps: [
      {
        patternId: 'task-decomposition',
        role: 'Partition the research space',
        why:
          'A coordinator that decomposes "AI in creative industries" into only digital-art ' +
          'subtopics will miss music + writing + film. Partition explicitly into named ' +
          'subtopics before any subagent fires — narrow decomposition is the most common ' +
          'failure mode in this scenario.',
      },
      {
        patternId: 'parallel-subagents',
        role: 'Run independent subagents concurrently',
        why:
          'Web search and document analysis are independent for a given subtopic. ' +
          'Promise.all bounds latency at the slowest spoke — sequential would multiply it.',
      },
      {
        patternId: 'multi-agent-error-propagation',
        role: 'Propagate structured errors',
        why:
          'When a search subagent times out, return structured context (failureType, attempted ' +
          'query, partialResults, alternatives) so the coordinator can retry intelligently. ' +
          'Distinguish "timeout" from "0 valid results" — they require opposite responses.',
      },
      {
        patternId: 'context-pruning',
        role: 'Reduce verbose outputs',
        why:
          'Modify upstream subagents to return STRUCTURED data (key facts + citations + ' +
          'relevance scores) instead of raw page content. The synthesis agent operates ' +
          'optimally under 50K tokens, not 155K.',
      },
      {
        patternId: 'provenance-and-uncertainty',
        role: 'Synthesize with conflict annotation',
        why:
          'Two credible sources disagreeing is data, not noise. Preserve every claim with ' +
          'attribution; report well-established vs contested findings separately. Always ' +
          'include collection/publication dates so temporal differences are not mistaken for ' +
          'contradictions.',
      },
    ],
  },

  // -----------------------------------------------------------------------
  {
    id: 'extraction-pipeline',
    title: 'Structured-data extraction pipeline',
    summary:
      'Per-document extraction: tool-use + schema → semantic validation → retry with specific ' +
      'errors → human review on low confidence or contested fields.',
    domainsCovered: ['d4', 'd5'],
    scenarioHint: 'Structured Data Extraction',
    steps: [
      {
        patternId: 'explicit-criteria',
        role: 'Define what counts as valid',
        why:
          'Vague directives ("be accurate") produce drift. Explicit criteria — "flag X only ' +
          'when condition Y" — collapse the ambiguity that drives the model\'s false-positive ' +
          'and false-negative rates apart.',
      },
      {
        patternId: 'json-schema',
        role: 'Tool-use with a JSON schema',
        why:
          'Schema compliance is enforced by the model API — no regex parsing, no `JSON.parse` ' +
          'failures. Use `tool_choice: { type: "tool", name }` to force a specific extraction ' +
          'to run first.',
      },
      {
        patternId: 'validation-retry-loops',
        role: 'Validate + retry with feedback',
        why:
          'Schema syntax is solved by tool-use; SEMANTIC errors (line items not summing) are ' +
          'not. Retry only with the SPECIFIC validation error appended — generic "try again" ' +
          'produces a similarly-broken response.',
      },
      {
        patternId: 'human-review-confidence',
        role: 'Route low-confidence to humans',
        why:
          'Field-level confidence scores calibrated PER document type. A single global ' +
          'threshold hides per-segment failures. Stratify sampling of high-confidence ' +
          'batches to catch novel error patterns before they accumulate.',
      },
      {
        patternId: 'provenance-and-uncertainty',
        role: 'Preserve provenance',
        why:
          'Every extracted claim carries `{ value, source, collectedAt }`. Downstream agents ' +
          'must preserve these through any summarization — losing provenance kills auditability.',
      },
    ],
  },

  // -----------------------------------------------------------------------
  {
    id: 'ci-pr-review',
    title: 'CI/CD pull-request review pipeline',
    summary:
      'Blocking pre-merge style checks (synchronous) + overnight deep analysis (batches). ' +
      'CLAUDE.md provides context; `-p` + `--json-schema` give parseable findings to post ' +
      'as inline comments. Multi-instance review catches what self-review misses.',
    domainsCovered: ['d2', 'd3', 'd4'],
    scenarioHint: 'Claude Code for Continuous Integration',
    steps: [
      {
        patternId: 'claude-md-hierarchy',
        role: 'Project-scoped context',
        why:
          'Project `CLAUDE.md` provides every CI invocation with the team\'s testing ' +
          'standards, review criteria, and fixture conventions. User-level config would not ' +
          'reach CI runners or new teammates.',
      },
      {
        patternId: 'path-scoped-rules',
        role: 'Per-file-type conventions',
        why:
          '`.claude/rules/tests.md` with a `**/*.test.ts` glob applies test conventions ' +
          'wherever test files live — without duplicating per-directory CLAUDE.md files that ' +
          'drift apart over time.',
      },
      {
        patternId: 'ci-cd-integration',
        role: 'Run Claude headless',
        why:
          '`-p` (or `--print`) processes the prompt and exits without waiting for stdin. ' +
          '`--output-format json --json-schema` gives you structured findings the pipeline ' +
          'can parse and post as inline PR comments.',
      },
      {
        patternId: 'json-schema',
        role: 'Schema-bound findings',
        why:
          'Define a `review-findings.schema.json` with required fields (file, line, severity, ' +
          'suggestion). Tool-use guarantees the model returns conforming JSON — the pipeline ' +
          'parses it deterministically.',
      },
      {
        patternId: 'multi-instance-review',
        role: 'Independent reviewer for nightly deep analysis',
        why:
          'The generator and reviewer are separate instances. The reviewer never sees the ' +
          "generator's reasoning, so it catches the subtle bugs that self-review " +
          'rationalizes away.',
      },
      {
        patternId: 'message-batches',
        role: 'Overnight = batches',
        why:
          'Synchronous for blocking pre-merge checks (developers are waiting). Batches API ' +
          'for the overnight deep-analysis pass — 50% cost, up to 24h latency, ' +
          '`custom_id` to correlate request/response pairs.',
      },
    ],
  },
];

export function getFlow(id: string): Flow | undefined {
  return flows.find((f) => f.id === id);
}
