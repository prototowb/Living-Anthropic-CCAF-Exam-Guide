// Domain 5 — Context Management & Reliability.
// Covers exam tasks 5.1 through 5.6.

import type { DomainPattern } from './types';

export const d5Patterns: DomainPattern[] = [
  // -----------------------------------------------------------------------
  // Task 5.1 — Conversation context preservation
  // -----------------------------------------------------------------------
  {
    id: 'context-pruning',
    title: 'Context pruning — trim verbose tool outputs',
    summary:
      'Tool results accumulate in context and consume tokens disproportionately to their ' +
      'relevance — 40+ fields per order lookup when only 5 are relevant. Pass results ' +
      'through a pruner before they enter the model\'s window: drop any field longer than ' +
      'a budget unless tagged keep. Place key-findings summaries at the BEGINNING of ' +
      'aggregated inputs and use explicit section headers to combat the ' +
      '"lost in the middle" effect.',
    source: 'src/agents/contextPruner.ts',
    language: 'ts',
    codeSnippet: `// src/agents/contextPruner.ts
export function prune<T extends Record<string, unknown>>(
  obj: T,
  options: { budget?: number; alwaysKeep?: string[] } = {},
): Partial<T> {
  const { budget = 400, alwaysKeep = [] } = options;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const keep = k.endsWith('!') || alwaysKeep.includes(k);
    if (typeof v === 'string' && v.length > budget && !keep) {
      out[k] = \`\${v.slice(0, budget)}… [pruned \${v.length - budget} chars]\`;
    } else {
      out[k] = v;
    }
  }
  return out as Partial<T>;
}

// Aggregating multi-subagent output? Put the summary FIRST.
function aggregate(parts: Part[]) {
  return [
    '# Key findings\\n' + parts.map(summarizeOne).join('\\n'),
    ...parts.map((p, i) => \`# Section \${i + 1}: \${p.subagent}\\n\${prune(p.output)}\`),
  ].join('\\n\\n');
}`,
    taskRef: '5.1',
    type: 'reliability',
    tags: ['context', 'pruning', 'lost-in-the-middle', 'token-budget'],
    related: ['scratchpad', 'multi-agent-error-propagation', 'task-decomposition'],
    antiPattern: {
      title: 'Concatenating raw tool outputs verbatim',
      language: 'ts',
      badCode: `// Anti-pattern: dump every field, every char.
const context = [
  await search.run(q),     // 85K tokens, full page bodies
  await docs.run(q),       // 70K tokens, full reasoning chains
].map(JSON.stringify).join('\\n');

// Synthesis agent sees 155K tokens; optimal performance is below 50K.
// Findings in the middle 50K get silently omitted from the synthesis.`,
      failureMode:
        'Models reliably attend to information at the BEGINNING and END of long inputs ' +
        'but omit findings from the MIDDLE. Verbose tool dumps push critical content ' +
        'into the lost zone.',
    },
    sandbox: 'context-pruner',
    quizQuestionRefs: [
      { sectionId: 's4', questionId: 2 },
      { sectionId: 's4', questionId: 11 },
    ],
  },

  // -----------------------------------------------------------------------
  // Task 5.1 (cont.) — Case-facts block / persistent structured layer
  // -----------------------------------------------------------------------
  {
    id: 'case-facts-block',
    title: 'Case-facts block — preserve transactional data verbatim',
    summary:
      'Progressive summarization is lossy for precise details — amounts, dates, order ' +
      'numbers, customer-stated expectations all get condensed into vague summaries ' +
      'like "discussed promotional pricing". Extract transactional facts into a ' +
      'persistent structured "case facts" block that gets injected into EVERY prompt, ' +
      'OUTSIDE the summarized history, so the data stays exact regardless of how many ' +
      'turns are summarized.',
    source: 'src/agents/caseFacts.ts',
    language: 'ts',
    codeSnippet: `// src/agents/caseFacts.ts
export interface CaseFacts {
  customerId?: string;
  orderIds: string[];
  amounts: { label: string; value: number; currency: string }[];
  dates: { label: string; iso: string }[];
  expectations: string[];   // "the 15% discount I was promised"
}

const facts: CaseFacts = { orderIds: [], amounts: [], dates: [], expectations: [] };

export function recordFact(kind: keyof CaseFacts, value: unknown) {
  // ...append to the right bucket, persist outside the summarized history.
}

// Every API call prepends this block — it never gets summarized away.
export function buildPrompt(thread: Message[]) {
  return [
    { role: 'system', content: \`# Case facts (verbatim, do not paraphrase)\\n\${JSON.stringify(facts, null, 2)}\` },
    ...maybeSummarize(thread),
  ];
}`,
    taskRef: '5.1',
    type: 'reliability',
    tags: ['case-facts', 'summarization', 'transactional-data', 'persistent-state'],
    related: ['context-pruning', 'scratchpad', 'provenance-and-uncertainty'],
    antiPattern: {
      title: 'Trusting progressive summarization to preserve numbers',
      language: 'ts',
      badCode: `// Anti-pattern: summarize older turns when context hits 70%.
const compressed = await summarize(olderTurns);
// Turn 12: "the 15% discount you mentioned earlier"
// Turn 32: compressed says "discussed promotional pricing"
// Agent now replies with the wrong percentage — or invents one.`,
      failureMode:
        'Summarization is INHERENTLY lossy for precise data. Amounts, percentages, ' +
        'dates, and stated expectations get rounded into "discussed promotional pricing", ' +
        'then the agent later reasons with the wrong values.',
    },
    quizQuestionRefs: [{ sectionId: 's2', questionId: 10 }],
  },

  // -----------------------------------------------------------------------
  // Task 5.2 — Escalation and ambiguity resolution
  // -----------------------------------------------------------------------
  {
    id: 'escalation',
    title: 'Escalation criteria — hard predicates, not vibes',
    summary:
      'Real escalation triggers: explicit customer request for a human, policy gaps ' +
      '(not just complex cases), inability to make meaningful progress. Self-reported ' +
      'confidence and sentiment analysis are unreliable proxies. Honor an explicit ' +
      'human request immediately — don\'t make the customer ask twice. When a tool ' +
      'returns multiple matches, ask for an additional identifier instead of guessing.',
    source: 'src/agents/escalation.ts',
    language: 'ts',
    codeSnippet: `// src/agents/escalation.ts
export function shouldEscalate(state: TurnState): EscalationDecision {
  // Honor explicit request immediately — never make the user ask twice.
  if (state.userAsked) return { escalate: true, reason: 'user_request' };

  // Policy GAP — the company has no rule for this case.
  if (state.policyGap) return { escalate: true, reason: 'policy_gap' };

  // Repeated unrecoverable business errors → human intervention.
  if (state.consecutiveBusinessErrors >= 2)
    return { escalate: true, reason: 'repeated_business_errors' };

  // Inability to make meaningful progress (not just "complex case").
  if (state.noProgressTurns >= 3)
    return { escalate: true, reason: 'no_progress' };

  return { escalate: false };
}

// Ambiguity resolution — multiple matches → ask, don't guess.
export function disambiguate(matches: Customer[]) {
  if (matches.length <= 1) return matches[0];
  return {
    needsClarification: true,
    question: 'I found multiple accounts under that name. Could you share your ' +
              'email, phone number, or an order ID so I can pull the right one?',
  };
}`,
    taskRef: '5.2',
    type: 'reliability',
    tags: ['escalation', 'policy-gap', 'ambiguity', 'identifier-disambiguation'],
    related: ['programmatic-prerequisites', 'human-review-confidence', 'multi-agent-error-propagation'],
    antiPattern: {
      title: 'Sentiment-based escalation',
      language: 'ts',
      badCode: `// Anti-pattern: "if the customer sounds frustrated, escalate."
if (sentimentScore(message) < -0.5) {
  escalate({ reason: 'negative_sentiment' });
}
// Production: customers sound frustrated about easy problems (and stay calm
// about hard ones). Sentiment is not correlated with case complexity.`,
      failureMode:
        'Sentiment and self-reported confidence both correlate poorly with whether a ' +
        'human is actually needed. Escalate on concrete triggers — explicit request, ' +
        'policy gap, repeated unrecoverable error, no progress.',
    },
    quizQuestionRefs: [
      { sectionId: 's2', questionId: 11 },
      { sectionId: 's2', questionId: 14 },
      { sectionId: 's2', questionId: 15 },
    ],
  },

  // -----------------------------------------------------------------------
  // Task 5.3 — Multi-agent error propagation
  // -----------------------------------------------------------------------
  {
    id: 'multi-agent-error-propagation',
    title: 'Error propagation across multi-agent systems',
    summary:
      'When a subagent fails, the coordinator needs enough context to decide recovery — ' +
      'failure type, attempted query, partial results, alternatives. Generic statuses ' +
      'like "search unavailable" hide that context. Silently swallowing errors (return ' +
      'empty as success) and terminating the whole workflow on a single failure are ' +
      'both anti-patterns. Distinguish access failures (timeout — retry?) from valid ' +
      'empty results (the query worked, the answer is zero).',
    source: 'src/agents/subagentErrors.ts',
    language: 'ts',
    codeSnippet: `// src/agents/subagentErrors.ts

export interface SubagentError {
  failureType: 'timeout' | 'parse' | 'rate_limit' | 'policy' | 'corrupt_source';
  attempted: { tool: string; input: unknown };
  partialResults: unknown[];       // anything we DID get
  alternatives: string[];          // ideas the coordinator can try
  // CRITICAL distinction:
  isEmptySuccess?: boolean;        // query worked, result was zero matches
}

// Subagent: implement LOCAL recovery for transient issues; only propagate
// errors that cannot be resolved locally.
async function searchWithLocalRecovery(query: string): Promise<Result | SubagentError> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetchWithTimeout(query, 5_000);
    if (!r.isError) return r;                     // success path
    if (r.errorCategory !== 'transient') break;   // not retryable here
    await sleep(2 ** attempt * 100);
  }
  return {
    failureType: 'timeout',
    attempted: { tool: 'search_engine', input: { query } },
    partialResults: [],
    alternatives: ['try the cached snapshot', 'broaden the query'],
  };
}

// Coordinator: distinguish access failure from valid empty.
function handleSearchResult(r: Result | SubagentError) {
  if ('failureType' in r) return r.failureType === 'timeout' ? retry(r) : escalate(r);
  if (r.results.length === 0) return { status: 'empty_success', note: 'no matches — valid finding' };
  return { status: 'ok', results: r.results };
}`,
    taskRef: '5.3',
    type: 'reliability',
    tags: ['error-propagation', 'partial-results', 'local-recovery', 'graceful-degradation'],
    related: ['structured-errors', 'hub-and-spoke', 'escalation', 'provenance-and-uncertainty'],
    antiPattern: {
      title: 'Silently treating failure as empty success',
      language: 'ts',
      badCode: `// Anti-pattern: swallow the error, return [].
async function searchSafe(query: string) {
  try { return await search.run(query); }
  catch { return []; }
}
// Synthesis: "no industry reports were found about X" — but the catch
// just swallowed a timeout from THAT specific database. The fact that
// the query never actually ran is gone.`,
      failureMode:
        'The synthesis agent cannot distinguish "queries ran, found nothing" from ' +
        '"queries failed, we have no information". It confidently reports gaps as ' +
        'findings.',
    },
    quizQuestionRefs: [
      { sectionId: 's4', questionId: 1 },
      { sectionId: 's4', questionId: 5 },
      { sectionId: 's4', questionId: 7 },
      { sectionId: 's4', questionId: 12 },
    ],
  },

  // -----------------------------------------------------------------------
  // Task 5.4 — Context in large codebase exploration / scratchpad
  // -----------------------------------------------------------------------
  {
    id: 'scratchpad',
    title: 'Scratchpad — persist key findings across context boundaries',
    summary:
      'Extended sessions decay — the model starts referencing "typical patterns" instead ' +
      'of the specific classes it discovered earlier. A scratchpad file persists key ' +
      'findings across context boundaries; the agent appends after each phase and ' +
      'reads before reasoning. For verbose exploration, spawn the Explore subagent to ' +
      'isolate output and `/compact` when the main session itself accumulates clutter.',
    source: 'src/agents/scratchpad.ts',
    language: 'ts',
    codeSnippet: `// src/agents/scratchpad.ts
export class Scratchpad {
  private entries: { at: number; text: string; tag?: string }[] = [];

  append(text: string, tag?: string) {
    this.entries.push({ at: Date.now(), text, tag });
  }

  summarize(maxLines = 12): string {
    const recent = this.entries.slice(-maxLines);
    return ['Key findings so far:', ...recent.map((e) => \`• \${e.text}\`)].join('\\n');
  }
}

// After every coordinator turn:
scratchpad.append(\`q: "\${prompt.slice(0,60)}…" → dispatched [\${plan.subagents.join(',')}]\`);

// Before every new turn, prepend the scratchpad summary so the agent reads
// it before reasoning. Counteracts context decay over long sessions.
const prompt = [scratchpad.summarize(), userInput].join('\\n\\n');

// For verbose discovery, use the Explore subagent (isolates output):
await Task({ name: 'Explore', prompt: 'Map every call site of fetch() and classify retry behavior' });

// When the main session is bloated, /compact reclaims space.
// /compact`,
    taskRef: '5.4',
    type: 'reliability',
    tags: ['scratchpad', 'context-decay', 'Explore', '/compact', 'crash-recovery'],
    related: ['context-pruning', 'case-facts-block', 'session-resume-fork', 'plan-vs-direct'],
    antiPattern: {
      title: 'Trusting long context to remember earlier findings',
      language: 'ts',
      badCode: `// 80 turns later, you ask:
"Earlier you said RefundProcessor had a bug at line 142 — is it the same?"

// Agent: "Typically, refund processors have race conditions when the…"
// It generalized away from the SPECIFIC finding to a "typical pattern".`,
      failureMode:
        'Long sessions cause the model to drift toward "typical patterns" and away from ' +
        'specific findings it discovered earlier. The scratchpad makes those findings ' +
        'addressable across the entire session.',
    },
    quizQuestionRefs: [
      { sectionId: 's3', questionId: 15 },
    ],
  },

  // -----------------------------------------------------------------------
  // Task 5.5 — Human review workflows and confidence calibration
  // -----------------------------------------------------------------------
  {
    id: 'human-review-confidence',
    title: 'Human review workflows & confidence calibration',
    summary:
      'Aggregate accuracy (e.g. 97% overall) can mask poor performance on specific ' +
      'document types or fields. Use stratified random sampling of high-confidence ' +
      'extractions to detect novel error patterns. Output FIELD-LEVEL confidence ' +
      'scores, calibrate the thresholds against a labeled validation set, then route ' +
      'extractions with low confidence or ambiguous source documents to human review.',
    source: 'src/agents/humanReview.ts',
    language: 'ts',
    codeSnippet: `// src/agents/humanReview.ts
//
// Field-level confidence enables targeted human review.
export interface InvoiceExtraction {
  vendorName: { value: string; confidence: number; sourceSpan: string };
  totalAmount: { value: number;  confidence: number; sourceSpan: string };
  lineItems:   { value: Item[];  confidence: number; sourceSpan: string };
}

// Calibrate thresholds against a LABELED validation set per document type
// (not one global threshold — different doc types have different precision).
const THRESHOLDS_BY_DOC_TYPE: Record<DocType, number> = {
  'standard-invoice':   0.92,
  'foreign-vendor':     0.97,   // higher bar — historical errors here
  'handwritten-receipt':0.85,
};

export function routeForReview(extraction: InvoiceExtraction, docType: DocType) {
  const threshold = THRESHOLDS_BY_DOC_TYPE[docType];
  const lowFields = Object.entries(extraction).filter(([_, f]) => f.confidence < threshold);
  if (lowFields.length > 0) return { needsHuman: true, fields: lowFields.map(([k]) => k) };
  return { needsHuman: false };
}

// Stratified random sampling — even on high-confidence batches.
export function sampleForOngoingValidation(batch: InvoiceExtraction[]) {
  return stratifyByDocType(batch).map((stratum) => randomSample(stratum, 0.05));
}`,
    taskRef: '5.5',
    type: 'reliability',
    tags: ['human-review', 'confidence', 'stratified-sampling', 'calibration'],
    related: ['multi-instance-review', 'validation-retry-loops', 'escalation', 'explicit-criteria'],
    antiPattern: {
      title: 'One global confidence threshold for all document types',
      language: 'ts',
      badCode: `// Anti-pattern: 0.9 confidence is "good enough" for everything.
if (extraction.confidence > 0.9) skipHumanReview();

// Production: standard invoices accurate at 0.9, foreign-vendor invoices
// have 12% errors at the same confidence band. Now the auto-approved
// foreign invoices are wrong — and no one is sampling.`,
      failureMode:
        'A single global threshold masks per-segment failures. Calibrate per ' +
        'document type AND keep a stratified sampling stream even on high-confidence ' +
        'batches so novel error patterns surface before they accumulate.',
    },
  },

  // -----------------------------------------------------------------------
  // Task 5.6 — Provenance and uncertainty in multi-source synthesis
  // -----------------------------------------------------------------------
  {
    id: 'provenance-and-uncertainty',
    title: 'Provenance, conflicts, temporal data',
    summary:
      'When findings get summarized without preserving claim-source mappings, ' +
      'provenance is lost — the synthesis agent can no longer attribute claims. ' +
      'Require subagents to emit structured claim-source mappings that downstream ' +
      'agents preserve and merge. When two credible sources conflict, ANNOTATE the ' +
      'conflict with source attribution — do not arbitrarily pick one. Always require ' +
      'publication or collection DATES so temporal differences aren\'t mistaken for ' +
      'contradictions.',
    source: 'src/agents/provenance.ts',
    language: 'ts',
    codeSnippet: `// src/agents/provenance.ts
export interface Claim<T = unknown> {
  value: T;
  source: { url: string; documentName: string; excerpt: string };
  collectedAt: string;     // ISO date — temporal context, ALWAYS required
}

export interface ConflictAnnotation<T> {
  field: string;
  candidates: Claim<T>[];   // every source's value kept verbatim
  rationale?: string;       // why this conflicts (different scope? different year?)
}

// Synthesis OUTPUT structure — well-established vs contested findings.
export interface SynthesisReport {
  wellEstablished: Claim[];
  contested: ConflictAnnotation<unknown>[];
  coverageGaps: { topic: string; reason: string }[];
}

function reconcile(claims: Claim<number>[]): ConflictAnnotation<number> | Claim<number> {
  if (new Set(claims.map((c) => c.value)).size === 1) return claims[0];
  return {
    field: claims[0].source.documentName,
    candidates: claims, // KEEP every source's value with attribution
    rationale: 'Two credible sources disagree — preserve and surface, do not pick.',
  };
}`,
    taskRef: '5.6',
    type: 'reliability',
    tags: ['provenance', 'conflict-annotation', 'temporal-data', 'claim-source'],
    related: ['multi-agent-error-propagation', 'context-pruning', 'human-review-confidence', 'case-facts-block'],
    antiPattern: {
      title: 'Picking one value when sources conflict',
      language: 'ts',
      badCode: `// Two sources: government report says 40% growth, industry report says 12%.
function pickMostCredible(claims) {
  return claims.find((c) => c.source.kind === 'government') ?? claims[0];
}
// Footnote: "Sources varied slightly." (no, they don't slightly differ —
// the discrepancy is 28 percentage points, possibly different scopes.)`,
      failureMode:
        'Heuristic source selection hides material disagreement. Preserve every value ' +
        'with attribution and surface the conflict — let the coordinator (or the human ' +
        'consumer of the report) decide.',
    },
    quizQuestionRefs: [{ sectionId: 's4', questionId: 10 }],
  },
];
