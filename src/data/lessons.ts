// Micro-lessons — Duolingo/SoloLearn-style bite-size formats.
// Four formats: reorder, blanks, mcq, flow.

export type LessonFormat = 'reorder' | 'blanks' | 'mcq' | 'flow';

interface BaseLesson {
  id: string;
  title: string;
  domainId: 'd1' | 'd2' | 'd3' | 'd4' | 'd5';
  format: LessonFormat;
  prompt: string;
  hint?: string;
}

export interface ReorderLesson extends BaseLesson {
  format: 'reorder';
  language: string;
  // Authored order is the CORRECT order. The UI shuffles before showing.
  steps: { text: string; explanation?: string }[];
}

export interface BlanksLesson extends BaseLesson {
  format: 'blanks';
  language: string;
  // Template with {{1}}, {{2}}, ... placeholders.
  template: string;
  // Index-aligned correct answers (e.g. answers[0] fills {{1}}).
  answers: string[];
  // Choice bank shown to the user (includes correct answers + distractors).
  choices: string[];
}

export interface McqLesson extends BaseLesson {
  format: 'mcq';
  options: { letter: 'A' | 'B' | 'C' | 'D'; text: string }[];
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

/**
 * Flow-builder lesson: a macro-level lesson where the learner composes a
 * complete recipe by placing pattern-cards into ordered slots. Backed by a
 * named Flow id from `src/data/flows.ts` — slot count and canonical order are
 * derived from `flow.steps`. Distractor cards extend the pool with patterns
 * that DO NOT belong in this flow.
 */
export interface FlowLesson extends BaseLesson {
  format: 'flow';
  flowId: string;
  distractorPatternIds: string[];
}

export type Lesson = ReorderLesson | BlanksLesson | McqLesson | FlowLesson;

export const lessons: Lesson[] = [
  {
    id: 'l1-hub-spoke-order',
    title: 'Hub-and-Spoke turn — in the right order',
    domainId: 'd1',
    format: 'reorder',
    language: 'ts',
    prompt:
      'Arrange the coordinator\'s steps in execution order. Independent subagents should run in parallel.',
    hint: 'Classify → dispatch (in parallel) → prune → escalation check → reply.',
    steps: [
      { text: '// 1. Classify the user\'s intent (which subagents?)' },
      { text: "const plan = await classifyIntent(prompt); // few-shot prompting" },
      { text: '// 2. Dispatch independent spokes in parallel' },
      { text: "const results = await Promise.all(plan.subagents.map(dispatch));" },
      { text: '// 3. Prune verbose tool outputs before they accumulate' },
      { text: 'const pruned = results.map((r) => ({ ...r, toolCalls: r.toolCalls.map(prune) }));' },
      { text: '// 4. Check escalation predicates' },
      { text: 'const escalation = shouldEscalate({ ...state, confidence: plan.confidence });' },
      { text: '// 5. Merge replies, append a scratchpad finding, return' },
      { text: 'scratchpad.append(`q: "${prompt.slice(0,60)}…" → ${plan.subagents.join(",")}`);' },
    ],
  },
  {
    id: 'l2-tool-response-blanks',
    title: 'Structured Error Response',
    domainId: 'd2',
    format: 'blanks',
    language: 'ts',
    prompt:
      'Fill in the blanks so this tool result matches the architect\'s mandated Structured Error Response shape.',
    hint: 'Two error categories: one means "retry is appropriate", the other means "change strategy".',
    template: `export type ToolResponse<T> =
  | { {{1}}: false; data: T }
  | { {{1}}: true; {{2}}: '{{3}}' | '{{4}}'; message: string };`,
    answers: ['isError', 'errorCategory', 'transient', 'business'],
    choices: ['isError', 'errorCategory', 'transient', 'business', 'failed', 'category', 'permanent', 'retry'],
  },
  {
    id: 'l3-plan-vs-direct',
    title: 'Plan Mode or Direct Execution?',
    domainId: 'd3',
    format: 'mcq',
    prompt:
      'You\'re asked to add Slack support. The codebase has clear patterns for email/SMS/push, but Slack offers three integration paths (webhooks, bot tokens, full apps) with different trade-offs. The ticket doesn\'t specify which to use. Which mode?',
    options: [
      { letter: 'A', text: 'Direct Execution — copy the email channel and swap the transport.' },
      { letter: 'B', text: 'Plan Mode — explore options and present a recommendation before coding.' },
      { letter: 'C', text: 'Direct Execution — pick webhooks (simplest) and refactor later if needed.' },
      { letter: 'D', text: 'Direct Execution — pick bot tokens (most capable) so we never have to revisit.' },
    ],
    correct: 'B',
    explanation:
      'The spec is ambiguous and the integration choice has significant architectural implications. Plan Mode lets you explore the trade-offs and align with the team before committing.',
  },
  {
    id: 'l4-few-shot-builder',
    title: 'Few-shot routing — assemble the prompt',
    domainId: 'd4',
    format: 'reorder',
    language: 'ts',
    prompt:
      'Order the lines of this few-shot routing prompt. Examples should follow the system instruction; the actual user query comes last.',
    hint: 'System / few-shot examples / user query.',
    steps: [
      { text: 'system: "You route requests to one of: explainer, quizmaster, code-reviewer."' },
      { text: 'example 1 — user: "Explain hub-and-spoke" → ["explainer"]' },
      { text: 'example 2 — user: "Quiz me on D2"        → ["quizmaster"]' },
      { text: 'example 3 — user: "Explain X and quiz me" → ["explainer","quizmaster"] // parallel' },
      { text: 'example 4 — user: "answer s1 q4: B"      → ["code-reviewer"]' },
      { text: 'user: <the actual incoming prompt>' },
    ],
  },
  {
    id: 'l5-json-schema-blanks',
    title: 'JSON Schema for grade_answer',
    domainId: 'd4',
    format: 'blanks',
    language: 'ts',
    prompt:
      'Complete the JSON Schema so the model is constrained to return only schema-conformant grading output.',
    hint: 'Verdict is an enum; rationale is a string with a minimum length so the model can\'t produce a one-word answer.',
    template: `export const gradeAnswerSchema = {
  type: '{{1}}',
  required: ['correct', 'verdict', 'rationale'],
  properties: {
    correct: { type: 'boolean' },
    verdict: { type: 'string', {{2}}: ['correct', 'incorrect'] },
    rationale: { type: 'string', {{3}}: 20 },
  },
  {{4}}: false,
} as const;`,
    answers: ['object', 'enum', 'minLength', 'additionalProperties'],
    choices: ['object', 'enum', 'minLength', 'additionalProperties', 'array', 'oneOf', 'maxLength', 'strict'],
  },
  {
    id: 'l6-scratchpad-mcq',
    title: 'When does the scratchpad save you?',
    domainId: 'd5',
    format: 'mcq',
    prompt:
      'A long-running tutor session has been answering follow-ups for 40 turns. The user asks "what was the issue with using batches for the PR pre-merge check we discussed?" Your coordinator must respond accurately even though the original analysis was 30 turns ago. Which mechanism most reliably preserves that detail?',
    options: [
      { letter: 'A', text: 'Increase max_tokens so the full thread fits.' },
      { letter: 'B', text: 'Use the scratchpad — append a one-line finding after each turn and prepend the summary on every new turn.' },
      { letter: 'C', text: 'Switch to a larger context window model when the thread crosses 20 turns.' },
      { letter: 'D', text: 'Cache the previous responses in the SDK\'s response cache.' },
    ],
    correct: 'B',
    explanation:
      'The scratchpad pattern explicitly persists key findings across turns. The other options either bloat context (A, C) or do nothing for retrieval (D).',
  },
  {
    id: 'l7-context-pruning',
    title: 'Context pruning in action',
    domainId: 'd5',
    format: 'reorder',
    language: 'ts',
    prompt:
      'Order the steps the coordinator takes when a tool returns a verbose payload.',
    hint: 'Return → prune → attach → continue. Pruning happens before merge.',
    steps: [
      { text: '// 1. Subagent invokes a granular tool (e.g. search_patterns)' },
      { text: 'const raw = await searchPatterns({ query });' },
      { text: '// 2. Run the result through the pruner — drop fields > budget unless tagged keep' },
      { text: 'const trimmed = prune(raw, { budget: 400 });' },
      { text: '// 3. Attach the trimmed payload to the subagent invocation record' },
      { text: 'invocation.toolCalls.push({ name: "search_patterns", input: query, output: trimmed });' },
      { text: '// 4. Continue the turn — context window contains only what is necessary' },
      { text: 'return invocation;' },
    ],
  },
  {
    id: 'l8-mcp-scoping-mcq',
    title: 'MCP scoping — where do credentials go?',
    domainId: 'd2',
    format: 'mcq',
    prompt:
      'Six developers want to share a GitHub MCP server, but each has their own personal access token. No credentials may be committed. What\'s the right configuration?',
    options: [
      { letter: 'A', text: 'Commit a placeholder token in .mcp.json and tell devs to override it locally.' },
      { letter: 'B', text: 'Add the server to project-scoped .mcp.json with ${GITHUB_TOKEN} env-var expansion; document the env var in the README.' },
      { letter: 'C', text: 'Have each developer run `claude mcp add --scope user` and skip the project file.' },
      { letter: 'D', text: 'Build a wrapper service that reads tokens from a .env and proxies GitHub.' },
    ],
    correct: 'B',
    explanation:
      'Project-scoped .mcp.json with env-var expansion is the idiomatic split: team config in git, personal credentials in the user\'s shell environment.',
  },
  {
    id: 'l9-escalation-rules',
    title: 'Escalation predicate',
    domainId: 'd5',
    format: 'blanks',
    language: 'ts',
    prompt: 'Fill in the escalation predicate. Three hard-coded triggers.',
    hint: 'Direct user ask, repeated business errors, or low confidence.',
    template: `export function shouldEscalate(state: TurnState) {
  if (state.userAsked) return { escalate: true, reason: '{{1}}' };
  if (state.consecutiveBusinessErrors >= 2)
    return { escalate: true, reason: '{{2}}' };
  if (state.confidence < {{3}}) return { escalate: true, reason: '{{4}}' };
  return { escalate: false };
}`,
    answers: ['user_request', 'repeated_business_errors', '0.4', 'low_confidence'],
    choices: [
      'user_request',
      'repeated_business_errors',
      '0.4',
      'low_confidence',
      'human_request',
      'two_errors',
      '0.5',
      'no_confidence',
    ],
  },
  {
    id: 'l10-task-tool',
    title: 'Why must Task be in allowedTools?',
    domainId: 'd1',
    format: 'mcq',
    prompt:
      'Your coordinator class declares `allowedTools = [\'Read\', \'Grep\']`. The first time it tries to dispatch a subagent, it silently does nothing. Why?',
    options: [
      { letter: 'A', text: 'Subagents are an SDK-side feature and don\'t need a tool.' },
      { letter: 'B', text: 'The Task tool spawns subagents; without it, the coordinator can\'t hand off work.' },
      { letter: 'C', text: 'Subagents are spawned by the SubAgent tool, not Task.' },
      { letter: 'D', text: 'allowedTools is advisory — Claude can always spawn subagents.' },
    ],
    correct: 'B',
    explanation:
      'Task is the tool the coordinator uses to spawn a subagent. allowedTools is enforced — if Task is missing, dispatch is impossible.',
  },

  // ---------------------------------------------------------------------
  // Reorder lessons added in v0.4.0 (micro-flow drills)
  // ---------------------------------------------------------------------
  {
    id: 'l11-agentic-loop-order',
    title: 'Agentic loop — drive by stop_reason',
    domainId: 'd1',
    format: 'reorder',
    language: 'ts',
    prompt: 'Arrange one iteration of the agentic loop. The host application owns the control flow.',
    hint: 'Inspect stop_reason → execute tools if "tool_use" → append results → call again. Terminate on "end_turn".',
    steps: [
      { text: '// 1. Send messages + tool specs to Claude.' },
      { text: 'const res = await sdk.createMessage({ messages, tools });' },
      { text: '// 2. Inspect stop_reason — the architect-mandated control signal.' },
      { text: 'if (res.stopReason === "end_turn") return res; // terminate' },
      { text: '// 3. On "tool_use", execute the requested tools.' },
      { text: 'const toolResults = await executeTools(res.toolUses, ctx);' },
      { text: '// 4. Append tool results to the conversation history.' },
      { text: 'messages = [...messages, { role: "assistant", content: res.toolUses }, { role: "user", content: toolResults }];' },
      { text: '// 5. Loop — call Claude again with the new context.' },
      { text: 'continue;' },
    ],
  },
  {
    id: 'l12-tool-call-lifecycle',
    title: 'Tool call lifecycle — gate, call, normalize, prune',
    domainId: 'd2',
    format: 'reorder',
    language: 'ts',
    prompt: 'Order one full tool call from the model\'s decision back into the model\'s context.',
    hint: 'Granular tool description → prerequisite gate → tool runs → PostToolUse hook → structured wrap → prune.',
    steps: [
      { text: '// 1. The model picks a tool based on its description (granular tools).' },
      { text: 'const toolName = res.toolUses[0].name;' },
      { text: '// 2. Prerequisite gate runs FIRST — deterministic, code-enforced.' },
      { text: 'if (!prerequisites.satisfied(toolName, ctx)) return { isError: true, errorCategory: "business" };' },
      { text: '// 3. The tool itself runs.' },
      { text: 'const raw = await tools[toolName](input);' },
      { text: '// 4. PostToolUse hook normalizes the result (works for third-party MCP too).' },
      { text: 'const normalized = postToolUse(toolName, raw);' },
      { text: '// 5. Wrap in ToolResponse<T> so caller can branch on isError + errorCategory.' },
      { text: 'const wrapped = ok(normalized);' },
      { text: '// 6. Prune verbose fields before the result enters the model\'s context.' },
      { text: 'const trimmed = prune(wrapped.data, { budget: 400 });' },
    ],
  },
  {
    id: 'l13-multi-agent-error-recovery',
    title: 'Multi-agent error recovery flow',
    domainId: 'd1',
    format: 'reorder',
    language: 'ts',
    prompt: 'Order the steps when a subagent hits a transient failure mid-flow.',
    hint: 'Subagent retries locally → if still failing, propagates structured context → coordinator decides retry/skip/escalate.',
    steps: [
      { text: '// 1. Subagent attempts the operation.' },
      { text: 'const r = await fetchWithTimeout(query, 5_000);' },
      { text: '// 2. On transient failure, retry locally with backoff (don\'t bother the coordinator).' },
      { text: 'if (r.isError && r.errorCategory === "transient" && r.isRetryable) { await sleep(backoff); continue; }' },
      { text: '// 3. After exhausting local recovery, propagate STRUCTURED error context.' },
      { text: 'return { failureType: "timeout", attempted: { tool, input }, partialResults: [...], alternatives: ["broaden query", "fallback to cache"] };' },
      { text: '// 4. Coordinator distinguishes access failure (retry-worthy) from valid empty result.' },
      { text: 'if (subagentError.failureType === "timeout") return retryWithModifiedQuery(subagentError.attempted);' },
      { text: '// 5. If still unrecoverable, escalate with a structured handoff summary.' },
      { text: 'return escalateToHuman({ summary: buildHandoff(subagentError) });' },
    ],
  },
  {
    id: 'l14-batch-lifecycle',
    title: 'Message Batches lifecycle',
    domainId: 'd4',
    format: 'reorder',
    language: 'ts',
    prompt: 'Order the steps for an overnight audit run using the Message Batches API.',
    hint: 'Submit with custom_id per request → poll → on completion, separate successes from failures → resubmit only failures with adjustments.',
    steps: [
      { text: '// 1. Build the request list with a stable custom_id per item.' },
      { text: 'const requests = repos.map((r) => ({ custom_id: `audit-${r.id}`, params: buildAuditPrompt(r) }));' },
      { text: '// 2. Submit the batch (fire-and-forget — no mid-request callbacks).' },
      { text: 'const batch = await batches.create({ requests });' },
      { text: '// 3. Poll periodically — batches can take up to 24h.' },
      { text: 'while (true) { const s = await batches.retrieve(batch.id); if (s.status === "ended") break; await sleep(60_000); }' },
      { text: '// 4. Pull results and partition by custom_id.' },
      { text: 'const results = await batches.results(batch.id);' },
      { text: '// 5. Resubmit ONLY the failed custom_ids, with adjustments (e.g. chunk oversize docs).' },
      { text: 'const failed = results.filter((r) => r.error).map((r) => ({ custom_id: r.custom_id, params: adjust(r) }));' },
    ],
  },
  {
    id: 'l15-validation-retry-loop',
    title: 'Validation-retry with specific feedback',
    domainId: 'd4',
    format: 'reorder',
    language: 'ts',
    prompt: 'Order the extract-validate-retry loop. Specific error feedback is what makes retry actually help.',
    hint: 'Tool-use extract → semantic validate → on error, append SPECIFIC errors and retry → cap retries → flag coverage gaps when info is absent.',
    steps: [
      { text: '// 1. Extract via tool-use with a JSON schema — schema syntax errors are eliminated by construction.' },
      { text: 'const res = await sdk.createMessage({ messages, tools: [extractInvoice], tool_choice: { type: "tool", name: "extract_invoice" } });' },
      { text: '// 2. SEMANTIC validation — what the schema can\'t catch (sums, cross-field constraints).' },
      { text: 'const errors = semanticValidate(res.data, sourceDoc);' },
      { text: '// 3. If clean, return.' },
      { text: 'if (errors.length === 0) return res.data;' },
      { text: '// 4. Append the SPECIFIC errors to the next message (not "try again").' },
      { text: 'messages.push({ role: "user", content: `Your prior response failed validation:\\n- ${errors.join("\\n- ")}` });' },
      { text: '// 5. Retry — but cap, and flag coverage gaps if info is missing from source.' },
      { text: 'if (allErrorsIndicateMissingFromSource(errors)) return { ...res.data, _coverageGap: errors };' },
    ],
  },
  {
    id: 'l16-iterative-refinement',
    title: 'Iterative refinement progression',
    domainId: 'd3',
    format: 'reorder',
    language: 'md',
    prompt: 'When prose alone produces drift, escalate techniques in this order.',
    hint: 'Prose first → concrete I/O examples (the biggest leap) → tests + failures → interview pattern for unfamiliar domains.',
    steps: [
      { text: '# 1. Start with prose (what most prompts begin as).' },
      { text: '"Transform the API response into our normalized format."' },
      { text: '# 2. If drift persists, replace prose with 2–3 CONCRETE I/O examples.' },
      { text: 'INPUT { ... } → OUTPUT { ... }  (×2–3 representative cases)' },
      { text: '# 3. For correctness-critical work, write the test suite first, then iterate by sharing failures.' },
      { text: 'Write Jest tests covering happy path + edge cases. Run. Share the diff of failures.' },
      { text: '# 4. In unfamiliar domains, INTERVIEW: have Claude surface considerations YOU haven\'t thought of.' },
      { text: '"Before implementing, ask me about cache invalidation, failure modes, idempotency, and how missing fields should surface."' },
    ],
  },
  {
    id: 'l17-ci-pipeline',
    title: 'CI/CD PR review pipeline',
    domainId: 'd3',
    format: 'reorder',
    language: 'yaml',
    prompt: 'Order the CI steps that turn a Claude review into inline GitHub comments.',
    hint: 'CLAUDE.md provides context → -p for headless → --output-format json --json-schema for parseable findings → script posts → repeat on each push, including prior findings.',
    steps: [
      { text: '# 1. Project CLAUDE.md sits in the repo — every CI invocation reads it for context.' },
      { text: 'committed: /CLAUDE.md  (testing standards, fixtures, review criteria)' },
      { text: '# 2. Run Claude in non-interactive mode (the -p / --print flag).' },
      { text: 'claude -p "Review the diff for style violations"' },
      { text: '# 3. Force structured output with --output-format json + --json-schema.' },
      { text: '  --output-format json --json-schema review-findings.schema.json > findings.json' },
      { text: '# 4. Pipeline script parses findings.json deterministically.' },
      { text: 'node scripts/parse-findings.js findings.json' },
      { text: '# 5. Post each finding as an inline GitHub PR comment.' },
      { text: 'gh api repos/:owner/:repo/pulls/:n/comments -X POST -f ...' },
      { text: '# 6. On re-run for new commits, pass PRIOR findings so Claude reports only NEW or still-unaddressed issues.' },
      { text: 'claude -p --context-file prior-findings.json "Only NEW or still-unaddressed issues"' },
    ],
  },
  {
    id: 'l18-long-session-defense',
    title: 'Long-session context defense',
    domainId: 'd5',
    format: 'reorder',
    language: 'ts',
    prompt: 'Order the three defenses against long-session context decay.',
    hint: 'Case-facts block protects exact values · pruning keeps tool results small · scratchpad preserves findings across turns.',
    steps: [
      { text: '// 1. Case-facts block — transactional details kept VERBATIM (amounts, dates, IDs).' },
      { text: 'const caseFacts = { customerId, orderIds, amounts, dates, expectations };' },
      { text: '// 2. Prepend case-facts to EVERY prompt so summarization never erases the exact values.' },
      { text: 'const prompt = [systemMessage(caseFactsBlock(caseFacts)), ...maybeSummarize(olderTurns), ...recentTurns];' },
      { text: '// 3. Prune verbose tool outputs BEFORE they accumulate.' },
      { text: 'const trimmed = prune(toolResult, { budget: 400 });' },
      { text: '// 4. After each turn, append a one-line scratchpad finding.' },
      { text: 'scratchpad.append(`q: "${prompt.slice(0,60)}…" → key finding: ${insight}`);' },
      { text: '// 5. Before the NEXT turn, prepend the scratchpad summary — agent reads it before reasoning.' },
      { text: 'const nextPrompt = [scratchpad.summarize(), userInput].join("\\n\\n");' },
    ],
  },

  // ---------------------------------------------------------------------
  // Flow-builder lessons (macro-flow drills, v0.4.0)
  // ---------------------------------------------------------------------
  {
    id: 'l19-flow-coordinator-turn',
    title: 'Build a hub-and-spoke coordinator turn',
    domainId: 'd1',
    format: 'flow',
    flowId: 'coordinator-turn',
    prompt: 'Place the patterns in the right order to compose one full coordinator turn.',
    hint: 'Classify intent → spawn → dispatch (parallel) → handle errors → prune → escalation check → scratchpad.',
    // Distractors: plausible patterns from other flows that don\'t belong here.
    distractorPatternIds: ['posttool-hooks', 'ci-cd-integration', 'human-review-confidence'],
  },
  {
    id: 'l20-flow-support-resolution',
    title: 'Build a customer-support resolution turn',
    domainId: 'd1',
    format: 'flow',
    flowId: 'support-resolution',
    prompt: 'Compose a support turn that verifies identity before any refund and escalates on policy gaps.',
    hint: 'Case facts first → tool selection → prereq gate → normalize → escalate on gap.',
    distractorPatternIds: ['few-shot', 'message-batches', 'json-schema'],
  },
  {
    id: 'l21-flow-multi-agent-research',
    title: 'Build a multi-agent research run',
    domainId: 'd1',
    format: 'flow',
    flowId: 'multi-agent-research',
    prompt: 'Compose the research flow — decomposition first, then parallel investigation, then synthesis with provenance.',
    hint: 'Partition the space BEFORE dispatch. Conflict annotation, not arbitrary picking.',
    distractorPatternIds: ['plan-vs-direct', 'agentic-loop', 'mcp-scoping'],
  },
  {
    id: 'l22-flow-extraction-pipeline',
    title: 'Build a structured-extraction pipeline',
    domainId: 'd4',
    format: 'flow',
    flowId: 'extraction-pipeline',
    prompt: 'Compose the extraction pipeline — criteria + schema + retry-with-feedback + human routing.',
    hint: 'Explicit criteria before the schema. Specific retry feedback. Field-level confidence routes to humans.',
    distractorPatternIds: ['scratchpad', 'parallel-subagents', 'session-resume-fork'],
  },
  {
    id: 'l23-flow-ci-pr-review',
    title: 'Build a CI/CD PR review pipeline',
    domainId: 'd3',
    format: 'flow',
    flowId: 'ci-pr-review',
    prompt: 'Compose the CI pipeline — context, headless mode, structured findings, independent review, overnight batches.',
    hint: 'CLAUDE.md before path-rules. JSON schema sits between the CLI flags and the parser. Batches for overnight only.',
    distractorPatternIds: ['programmatic-prerequisites', 'case-facts-block', 'task-decomposition'],
  },
];

export function getLesson(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}
