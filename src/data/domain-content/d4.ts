// Domain 4 — Prompt Engineering & Structured Output.
// Covers exam tasks 4.1 through 4.6.

import type { DomainPattern } from './types';

export const d4Patterns: DomainPattern[] = [
  // -----------------------------------------------------------------------
  // Task 4.1 — Explicit criteria
  // -----------------------------------------------------------------------
  {
    id: 'explicit-criteria',
    title: 'Explicit criteria — replace vagueness with definitions',
    summary:
      '"Check that comments are accurate" is vague; "flag a comment only when its ' +
      'claimed behavior contradicts the actual code behavior" is a definition. ' +
      'Replace abstract directives ("be conservative") with categorical criteria and ' +
      'concrete code examples for each severity level. High false-positive categories ' +
      'erode developer trust in the GOOD categories — temporarily disable them while ' +
      'improving prompts.',
    source: 'src/showcase/explicit-criteria.example.md',
    language: 'md',
    codeSnippet: `# BEFORE — vague directive, 48% false-positive rate on documentation findings.
"Check that comments and docstrings are accurate and up-to-date."

# AFTER — explicit criteria with one definition per severity.
Flag a comment ONLY when its claimed behavior contradicts the actual code behavior.
Acceptable (do NOT flag): TODO/FIXME markers, brief descriptions, stale-but-accurate
explanations.

# Severity criteria — concrete code examples for each level:
- CRITICAL: comment claims "validates input" but no validation exists
- HIGH:     comment describes the WRONG return type
- MEDIUM:   comment describes a code path that was deleted
- LOW:      comment is correct but no longer adds value
- (DO NOT FLAG): TODO, FIXME, narrative descriptions of what the code does`,
    taskRef: '4.1',
    type: 'prompt',
    tags: ['false-positive', 'criteria', 'severity', 'precision'],
    related: ['few-shot', 'iterative-refinement', 'multi-instance-review'],
    antiPattern: {
      title: '"Be more careful" and "only report high confidence"',
      language: 'md',
      badCode: `# Anti-pattern: adding vague meta-rules.
"Be conservative and only report high-confidence findings."
"Only flag issues when you're very sure."
# False positive rate barely moves — the model's notion of "high confidence"
# is exactly the prompt itself.`,
      failureMode:
        'General directives like "be conservative" or "only high confidence" produce no ' +
        'measurable improvement. The model needs categorical criteria — what to flag, ' +
        'what to skip — with examples.',
    },
    quizQuestionRefs: [
      { sectionId: 's1', questionId: 2 },
      { sectionId: 's1', questionId: 3 },
      { sectionId: 's1', questionId: 11 },
      { sectionId: 's1', questionId: 12 },
    ],
  },

  // -----------------------------------------------------------------------
  // Task 4.2 — Few-shot prompting
  // -----------------------------------------------------------------------
  {
    id: 'few-shot',
    title: 'Few-shot prompting (2–4 worked examples)',
    summary:
      'When detailed instructions alone produce inconsistent output, 2–4 worked ' +
      'examples are the most effective remedy. Target the AMBIGUOUS scenarios where ' +
      'errors actually occur, and show the REASONING for why one action was chosen ' +
      'over plausible alternatives. The model generalizes from worked examples to ' +
      'novel patterns; declarative rules don\'t generalize the same way.',
    source: 'src/agents/prompts/fewShot.ts',
    language: 'ts',
    codeSnippet: `// src/agents/prompts/fewShot.ts
//
// Architect mandate: 2–4 examples — not 15. Target the ambiguous edge cases.
// Show the REASONING, not just the answer.

export const ROUTE_INTENT_FEWSHOT = [
  { user: 'Explain hub-and-spoke',
    subagents: ['explainer'],
    rationale: 'Pure concept explanation — single explainer suffices.' },
  { user: 'Quiz me on tools',
    subagents: ['quizmaster'],
    rationale: 'User wants to be tested — quizmaster only.' },
  { user: 'Explain few-shot prompting AND quiz me on it',
    subagents: ['explainer', 'quizmaster'],
    rationale:
      'Two independent jobs (explain, then test). Dispatch in parallel — they do ' +
      'not depend on each other.' },
  { user: 'Is my answer "B" for s1 q4 correct, and why?',
    subagents: ['code-reviewer'],
    rationale: 'Answer submitted for grading — code-reviewer is the right spoke.' },
];`,
    taskRef: '4.2',
    type: 'prompt',
    tags: ['few-shot', 'ambiguity', 'reasoning', 'classification'],
    related: ['explicit-criteria', 'iterative-refinement', 'json-schema'],
    antiPattern: {
      title: '15 unambiguous examples instead of 4 ambiguous ones',
      language: 'ts',
      badCode: `// Anti-pattern: large bank of OBVIOUS examples; ambiguous edge cases absent.
const examples = [
  { user: 'refund order #1234', tool: 'process_refund' },
  { user: 'check order status for #5678', tool: 'lookup_order' },
  { user: 'show me my orders', tool: 'lookup_order' },
  // … 12 more obvious cases …
];
// The model already handled obvious cases. The failures happen on
// "I need help with my recent purchase" — and there's no example for that.`,
      failureMode:
        'Long banks of obvious examples teach nothing new. Target the AMBIGUOUS cases ' +
        'where errors occur — and show the reasoning the model should reproduce.',
    },
    sandbox: 'few-shot-routing',
    quizQuestionRefs: [
      { sectionId: 's1', questionId: 9 },
      { sectionId: 's2', questionId: 8 },
    ],
  },

  // -----------------------------------------------------------------------
  // Task 4.3 — Structured output via tool use + JSON schemas
  // -----------------------------------------------------------------------
  {
    id: 'json-schema',
    title: 'Structured output via tool use + JSON schemas',
    summary:
      'Tool use with a JSON schema is the most reliable shape for guaranteed ' +
      'schema-compliant output — schema syntax errors are eliminated. ' +
      '`tool_choice: "any"` forces the model to call SOME tool (no free-form text). ' +
      '`tool_choice: { type: "tool", name }` forces a SPECIFIC tool. Mark fields ' +
      'optional/nullable when source data may not contain them; add `"unclear"` enum ' +
      'values for ambiguous cases and `"other"` + detail pairs for extensible categories.',
    source: 'src/agents/schemas/gradeAnswer.ts',
    language: 'ts',
    codeSnippet: `// src/agents/schemas/gradeAnswer.ts
export const gradeAnswerSchema = {
  type: 'object',
  required: ['correct', 'verdict', 'rationale'],
  properties: {
    correct:    { type: 'boolean' },
    verdict:    { type: 'string',
                  enum: ['correct', 'incorrect', 'unclear'] }, // "unclear" for ambiguity
    rationale:  { type: 'string', minLength: 20 },
    // nullable optional fields — model won't fabricate to satisfy required.
    sourceCitation: { type: ['string', 'null'] },
    confidence:     { type: ['number', 'null'], minimum: 0, maximum: 1 },
  },
  additionalProperties: false,
} as const;

// tool_choice options:
//   "auto"               — model MAY return text instead of calling the tool
//   "any"                — model MUST call SOME tool
//   { type: 'tool', name } — model MUST call this exact tool
await sdk.createMessage({
  messages,
  tools: [gradeAnswerSchema],
  tool_choice: { type: 'tool', name: 'grade_answer' }, // force structured output
});`,
    taskRef: '4.3',
    type: 'prompt',
    tags: ['json-schema', 'tool-use', 'tool_choice', 'structured-output', 'nullable'],
    related: ['few-shot', 'validation-retry-loops', 'ci-cd-integration', 'message-batches'],
    antiPattern: {
      title: 'Asking for JSON in the prompt and regex-parsing the reply',
      language: 'ts',
      badCode: `// Anti-pattern: "Return your answer as JSON."
const res = await sdk.createMessage({
  messages: [{ role: 'user', content: 'Grade this answer; return JSON.' }],
});
const m = res.text.match(/\\{[\\s\\S]*\\}/);
const data = m ? JSON.parse(m[0]) : null; // sometimes null, sometimes invalid JSON.`,
      failureMode:
        'The model wraps JSON in prose, mismatches quotes, or omits commas. Regex/JSON.parse ' +
        'fails intermittently. Tool use with a JSON schema makes the output schema-compliant ' +
        'by construction.',
    },
    quizQuestionRefs: [{ sectionId: 's1', questionId: 6 }],
  },

  // -----------------------------------------------------------------------
  // Task 4.4 — Validation, retry, feedback loops
  // -----------------------------------------------------------------------
  {
    id: 'validation-retry-loops',
    title: 'Validation, retry, and feedback loops',
    summary:
      'Schema syntax errors are eliminated by tool use, but SEMANTIC errors aren\'t ' +
      '(values that don\'t sum, wrong-field placement). On semantic failure, retry — ' +
      'but append the SPECIFIC validation error so the model can self-correct. Know ' +
      'the limit: retries are useless when the info is simply absent from the source. ' +
      'Add `detected_pattern` to findings to enable downstream analysis of dismissals.',
    source: 'src/agents/validation.ts',
    language: 'ts',
    codeSnippet: `// src/agents/validation.ts
export async function extractWithRetry(doc: string, max = 3) {
  let lastErrors: string[] = [];

  for (let attempt = 0; attempt < max; attempt++) {
    const res = await sdk.createMessage({
      messages: [
        { role: 'user', content: doc },
        ...(lastErrors.length
          ? [{ role: 'user',
               content: \`Your prior response failed validation:\\n- \${lastErrors.join('\\n- ')}\\n\` +
                        'Please correct ONLY these issues and re-emit the full structured response.' }]
          : []),
      ],
      tools: [extractInvoiceSchema],
      tool_choice: { type: 'tool', name: 'extract_invoice' },
    });

    const errors = semanticValidate(res.data, doc);
    if (errors.length === 0) return res.data;
    lastErrors = errors;

    // Don't retry forever — info that isn't in the source won't appear on retry.
    if (errors.every((e) => e.includes('missing from source'))) {
      return { ...res.data, _coverageGap: lastErrors };
    }
  }
  throw new Error('extract_invoice: exhausted retries with: ' + lastErrors.join('; '));
}

// Semantic checks the schema can't catch:
function semanticValidate(data: Invoice, sourceDoc: string): string[] {
  const errs: string[] = [];
  const sum = data.lineItems.reduce((a, l) => a + l.total, 0);
  if (sum !== data.statedTotal)
    errs.push(\`line items sum to \${sum} but statedTotal is \${data.statedTotal}\`);
  return errs;
}`,
    taskRef: '4.4',
    type: 'prompt',
    tags: ['retry', 'validation', 'feedback-loop', 'self-correction', 'detected_pattern'],
    related: ['json-schema', 'structured-errors', 'multi-instance-review'],
    antiPattern: {
      title: 'Retry without including the specific error',
      language: 'ts',
      badCode: `// Anti-pattern: "Please try again." with no context.
for (let i = 0; i < 3; i++) {
  const r = await sdk.createMessage({ messages });
  if (validate(r)) return r;
  messages.push({ role: 'user', content: 'Please try again.' });
}
// The model has no idea what was wrong — it produces a similar wrong answer.`,
      failureMode:
        'Without the specific validation error, the model regenerates a similarly-broken ' +
        'response. Retry value comes from FEEDBACK — the exact diff between observed and ' +
        'expected.',
    },
  },

  // -----------------------------------------------------------------------
  // Task 4.5 — Message Batches
  // -----------------------------------------------------------------------
  {
    id: 'message-batches',
    title: 'Message Batches API — 50% off, up to 24h',
    summary:
      '50% cost savings, up to 24-hour processing window, no guaranteed latency SLA. ' +
      'Right shape for non-blocking, latency-tolerant workloads (overnight reports, ' +
      'weekly audits). Wrong shape for blocking workflows (PR pre-merge checks) and ' +
      'for tool-calling loops — there is no mid-request callback to return tool results. ' +
      'Use `custom_id` to correlate request/response pairs; on failure, resubmit only ' +
      'the failed `custom_id`s (with adjustments like chunking).',
    source: 'src/agents/batches.ts',
    language: 'ts',
    codeSnippet: `// src/agents/batches.ts
//
// Use Batches API for: scheduled reports, weekly audits, nightly test generation.
// Do NOT use for: PR pre-merge checks (blocking), or anything that needs tool-calling.

export async function submitOvernightAudit(repos: Repo[]) {
  const requests = repos.map((repo) => ({
    custom_id: \`audit-\${repo.id}\`,                 // correlate request → response
    params: {
      model: 'claude-haiku-4-5-20251001',
      messages: [{ role: 'user', content: buildAuditPrompt(repo) }],
    },
  }));
  return batches.create({ requests });
}

// On failure: resubmit only the failed custom_ids with appropriate fixes.
export async function resubmitFailed(batch: BatchResult) {
  const failed = batch.results.filter((r) => r.error);
  return batches.create({
    requests: failed.map((r) => ({
      custom_id: r.custom_id,
      params: chunkDocumentIfTooLong(r.original_params), // adjust the fix
    })),
  });
}`,
    taskRef: '4.5',
    type: 'prompt',
    tags: ['batches', 'cost', 'latency', 'custom_id', 'async'],
    related: ['ci-cd-integration', 'json-schema'],
    antiPattern: {
      title: 'Batches API for tool-calling workflows',
      language: 'ts',
      badCode: `// Anti-pattern: code review that needs to fetch related files via tool calls.
const batch = await batches.create({
  requests: prs.map((pr) => ({
    custom_id: \`review-\${pr.id}\`,
    params: { messages, tools: [fetchFile] },  // tool use defined
  })),
});
// Claude returns "need to call fetchFile" — but there is no mid-batch callback.
// The tool never runs. The model never gets the file. Reviews are useless.`,
      failureMode:
        'Batches is asynchronous fire-and-forget — there is no mechanism to execute a ' +
        'tool mid-request and feed results back. Tool-calling loops require the ' +
        'synchronous Messages API.',
    },
    quizQuestionRefs: [
      { sectionId: 's1', questionId: 1 },
      { sectionId: 's1', questionId: 4 },
      { sectionId: 's1', questionId: 5 },
      { sectionId: 's1', questionId: 14 },
    ],
  },

  // -----------------------------------------------------------------------
  // Task 4.6 — Multi-instance review
  // -----------------------------------------------------------------------
  {
    id: 'multi-instance-review',
    title: 'Multi-instance & multi-pass review',
    summary:
      'A model that generated code retains its reasoning context and is less likely to ' +
      'question its own decisions — self-review catches less than independent review. ' +
      'Use a SECOND Claude instance with NO access to the generator\'s reasoning. For ' +
      'large reviews, split into per-file local passes plus a separate cross-file ' +
      'integration pass to avoid attention dilution.',
    source: 'src/agents/multiInstanceReview.ts',
    language: 'ts',
    codeSnippet: `// src/agents/multiInstanceReview.ts
//
// Generator and reviewer are separate sessions. The reviewer has no access
// to the generator's chain-of-thought — only to the resulting code.

export async function generateAndReview(spec: string, ctx: Ctx) {
  const generated = await generatorAgent.handle(spec, ctx);

  const reviewed = await reviewerAgent.handle(
    \`Review this code for correctness and edge-case bugs. \` +
    \`You have NOT seen the generator's reasoning. Focus on the diff alone.\\n\\n\` +
    \`---DIFF START---\\n\${generated.diff}\\n---DIFF END---\`,
    { ...ctx, isolated: true }, // explicitly no shared scratchpad
  );
  return { generated, reviewed };
}

// Multi-pass review for large PRs (mitigates attention dilution).
export async function reviewLargePR(files: File[]) {
  const localReviews = await Promise.all(
    files.map((f) => reviewerAgent.handle(\`Review the local issues in: \${f.path}\`)),
  );
  return reviewerAgent.handle(
    \`Now review cross-file data flow. Summaries:\\n\${
       localReviews.map((r) => r.summary).join('\\n---\\n')}\`,
  );
}`,
    taskRef: '4.6',
    type: 'prompt',
    tags: ['multi-instance', 'multi-pass', 'independent-review', 'attention-dilution'],
    related: ['task-decomposition', 'explicit-criteria', 'validation-retry-loops', 'context-pruning'],
    antiPattern: {
      title: '"Critique your own response before finalizing"',
      language: 'md',
      badCode: `# In the generation prompt:
"After producing your suggestion, critique it for edge cases and revise."

# Reality: the same confirmation bias that produced the original answer
# justifies it in the self-critique. Subtle bugs survive.`,
      failureMode:
        'Self-review in the same session retains the original reasoning. The model ' +
        'rationalizes its decisions instead of questioning them. Only an independent ' +
        'instance without the prior chain-of-thought catches the kinds of subtle issues ' +
        'a different reviewer would.',
    },
    quizQuestionRefs: [
      { sectionId: 's1', questionId: 10 },
      { sectionId: 's2', questionId: 13 },
    ],
  },
];
