// Domain 1 — Agentic Architecture & Orchestration.
// Covers exam tasks 1.1 through 1.7.

import type { DomainPattern } from './types';

export const d1Patterns: DomainPattern[] = [
  // -----------------------------------------------------------------------
  // Task 1.1 — Agentic loop
  // -----------------------------------------------------------------------
  {
    id: 'agentic-loop',
    title: 'Agentic loop — stop_reason controls termination',
    summary:
      'After each Claude response, the host application inspects `stop_reason`. ' +
      '`tool_use` → execute the requested tools, append results to the conversation, ' +
      'call Claude again. `end_turn` → present the final response. This is the ' +
      'architect-mandated way to drive an agent loop; everything else (natural-language ' +
      'sniffing, hard iteration caps as primary stop) is an anti-pattern.',
    source: 'src/agents/loop.ts',
    language: 'ts',
    codeSnippet: `// src/agents/loop.ts
export async function runAgentLoop(initialPrompt: string, ctx: Ctx) {
  let messages = [{ role: 'user', content: initialPrompt }];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const res = await sdk.createMessage({ messages, tools });

    // Mandate: drive the loop by stop_reason, NOT by parsing text.
    if (res.stopReason === 'end_turn') return res;

    if (res.stopReason === 'tool_use') {
      const toolResults = await executeTools(res.toolUses, ctx);
      // Append tool results so the model can reason about the next action.
      messages = [...messages, { role: 'assistant', content: res.toolUses },
                              { role: 'user',     content: toolResults }];
      continue;
    }

    // max_tokens, pause_turn, etc. — surface to the caller.
    return res;
  }
  throw new Error('Iteration cap hit — investigate, do not retry blindly.');
}`,
    taskRef: '1.1',
    type: 'architectural',
    tags: ['stop_reason', 'agent-loop', 'tool-use', 'end-turn'],
    related: ['task-allowed-tools', 'hub-and-spoke', 'parallel-subagents'],
    antiPattern: {
      title: 'Parsing assistant text to decide when to stop',
      language: 'ts',
      badCode: `// Anti-pattern: natural-language sniffing.
if (res.text.includes("I've completed") ||
    res.text.toLowerCase().includes('is there anything else')) {
  return res; // terminate
}

// Anti-pattern: arbitrary iteration cap as the primary stop signal.
if (turn++ > 10) return res;`,
      failureMode:
        'Loops terminate early on polite phrasing, or run forever when the cap is high. ' +
        '`stop_reason` is Claude\'s explicit, structured signal — the only correct trigger.',
    },
  },

  // -----------------------------------------------------------------------
  // Task 1.2 — Multi-agent orchestration (hub-and-spoke)
  // -----------------------------------------------------------------------
  {
    id: 'hub-and-spoke',
    title: 'Hub-and-Spoke coordinator',
    summary:
      'A single coordinator (hub) owns the conversation and decides which specialized ' +
      'subagents (spokes) to invoke. Subagents NEVER call each other directly — all ' +
      'communication routes through the hub for observability, consistent error ' +
      'handling, and controlled information flow.',
    source: 'src/agents/coordinator.ts',
    language: 'ts',
    codeSnippet: `// src/agents/coordinator.ts
export const coordinator = {
  // Mandate: 'Task' MUST appear in allowedTools so the coordinator can spawn subagents.
  allowedTools: ['Task', 'Read', 'Grep'] as const,

  async handle(prompt: string, ctx: TutorContext) {
    const plan = await classifyIntent(prompt);          // few-shot prompting
    const jobs = plan.subagents.map((s) => dispatch(s, prompt, ctx));
    const results = await Promise.all(jobs);            // parallel spokes
    return mergeAndPrune(results, ctx);                 // context pruning
  },
};`,
    taskRef: '1.2',
    type: 'architectural',
    tags: ['coordinator', 'subagent', 'orchestration', 'hub'],
    related: ['task-allowed-tools', 'parallel-subagents', 'task-decomposition', 'multi-agent-error-propagation'],
    antiPattern: {
      title: 'Direct spoke-to-spoke communication',
      language: 'ts',
      badCode: `// Anti-pattern: doc-analysis hands off straight to synthesis.
const docs = await documentAnalysis.run(prompt);
const report = await synthesis.run(docs); // BYPASSES the coordinator

// Coordinator can't observe failures, can't deduplicate, can't partition.`,
      failureMode:
        'Loses centralized error handling, observability, and information control. ' +
        'The coordinator can no longer decide what each spoke sees or recover from ' +
        'an upstream failure.',
    },
    sandbox: 'hub-and-spoke-timeline',
    quizQuestionRefs: [
      { sectionId: 's4', questionId: 13 },
      { sectionId: 's4', questionId: 14 },
    ],
  },

  // -----------------------------------------------------------------------
  // Task 1.3 — Subagent invocation, context, spawning
  // -----------------------------------------------------------------------
  {
    id: 'task-allowed-tools',
    title: '`Task` in allowedTools — the spawning primitive',
    summary:
      'The `Task` tool is the mechanism by which a coordinator spawns a subagent. If ' +
      '`Task` is missing from the coordinator\'s `allowedTools`, dispatch silently ' +
      'breaks. Assert it at startup so the failure is fast and loud.',
    source: 'src/agents/coordinator.ts',
    language: 'ts',
    codeSnippet: `export const ALLOWED_TOOLS = ['Task', 'Read', 'Grep'] as const;

if (!ALLOWED_TOOLS.includes('Task')) {
  throw new Error(
    "Coordinator misconfiguration: allowedTools MUST include 'Task' " +
    'so it can spawn subagents.',
  );
}

// Subagents do NOT inherit the coordinator's context. Always pass what they
// need in the prompt — prior findings, source URLs, attribution metadata.
async function dispatch(name: SubagentName, prompt: string, ctx: Ctx) {
  return Task({
    name,
    prompt: buildSubagentPrompt(name, prompt, ctx.priorFindings),
  });
}`,
    taskRef: '1.3',
    type: 'architectural',
    tags: ['Task', 'allowedTools', 'spawn', 'context-passing'],
    related: ['hub-and-spoke', 'parallel-subagents', 'session-resume-fork'],
    antiPattern: {
      title: 'Assuming subagents inherit parent context',
      language: 'ts',
      badCode: `// Anti-pattern: spawning a subagent without passing context.
await Task({ name: 'synthesis', prompt: 'Summarize findings' });
// The synthesis subagent has NO access to web-search or doc-analysis output —
// it sees only "Summarize findings" and hallucinates the rest.`,
      failureMode:
        'Subagents operate with isolated context. Without explicit context in the ' +
        'prompt, the spawned subagent has no prior findings, no attribution, no ' +
        'shared memory — and produces low-quality or fabricated output.',
    },
  },

  // -----------------------------------------------------------------------
  // Task 1.3 + 1.2 + 1.6 — parallel dispatch (spans multiple skills)
  // -----------------------------------------------------------------------
  {
    id: 'parallel-subagents',
    title: 'Parallel subagent execution',
    summary:
      'Independent subagents must be dispatched in parallel — emit multiple `Task` ' +
      'tool calls in a single coordinator response, then await them with ' +
      '`Promise.all`. Latency becomes bounded by the slowest spoke, not the sum of all.',
    source: 'src/agents/coordinator.ts',
    language: 'ts',
    codeSnippet: `// Parallel: bounded by the slowest spoke
const [explainer, quizmaster] = await Promise.all([
  dispatch('explainer', prompt, ctx),
  dispatch('quizmaster', prompt, ctx),
]);

// Parallel can amplify duplicate work — partition the research space up-front
// (assign distinct subtopics / source types) before dispatch.
const partitions = partitionResearchSpace(topic);
const findings = await Promise.all(
  partitions.map((p) => dispatch('researcher', p.subtopic, ctx)),
);`,
    taskRef: '1.3',
    type: 'architectural',
    tags: ['parallel', 'Promise.all', 'partitioning', 'latency'],
    related: ['hub-and-spoke', 'task-allowed-tools', 'task-decomposition'],
    antiPattern: {
      title: 'Sequential dispatch of independent spokes',
      language: 'ts',
      badCode: `// Anti-pattern: each independent subagent awaited in series.
const explainer = await dispatch('explainer', prompt, ctx);
const quizmaster = await dispatch('quizmaster', prompt, ctx);
// Total latency = sum of all subagents, even though they don't depend on each other.`,
      failureMode:
        'Total latency = sum of all subagent latencies. The coordinator pays for the ' +
        'longest chain instead of the longest single subagent.',
    },
    quizQuestionRefs: [{ sectionId: 's2', questionId: 4 }],
  },

  // -----------------------------------------------------------------------
  // Task 1.4 — Programmatic prerequisites + structured handoff
  // -----------------------------------------------------------------------
  {
    id: 'programmatic-prerequisites',
    title: 'Programmatic prerequisites — deterministic ordering',
    summary:
      'When deterministic compliance is required (verify identity before any financial ' +
      'operation), prompt instructions alone have a non-zero failure rate. Enforce in ' +
      'code: a prerequisite gate blocks downstream tools until the prereq has actually ' +
      'completed. Pair with structured handoff summaries when escalating mid-process.',
    source: 'src/agents/prerequisites.ts',
    language: 'ts',
    codeSnippet: `// src/agents/prerequisites.ts
const verifiedCustomers = new Set<string>();

export async function processRefund(args: { customerId: string; amount: number }) {
  // Deterministic prerequisite — no prompt instruction can override this.
  if (!verifiedCustomers.has(args.customerId)) {
    return {
      isError: true,
      errorCategory: 'business',
      message:
        'process_refund blocked: get_customer must complete with a verified ' +
        \`customer ID first. (got: \${args.customerId})\`,
    };
  }
  return executeRefund(args);
}

export async function getCustomer(args: { id: string }) {
  const customer = await db.customers.find(args.id);
  if (customer) verifiedCustomers.add(customer.id); // unlocks downstream tools
  return { isError: false, data: customer };
}

// Handoff: when escalating, compile a structured summary the human can act on.
export interface HandoffSummary {
  customerId: string;
  rootCause: string;
  recommendedAction: string;
  refundAmount?: number;
  attemptedTools: string[];
}`,
    taskRef: '1.4',
    type: 'reliability',
    tags: ['prerequisite-gate', 'enforcement', 'handoff', 'deterministic'],
    related: ['structured-errors', 'posttool-hooks', 'escalation'],
    antiPattern: {
      title: 'Prompt-only enforcement of critical ordering',
      language: 'md',
      badCode: `# CLAUDE.md
You MUST call get_customer before process_refund. NEVER skip verification.
NEVER process a refund without first verifying the customer's identity.

# Reality: 12% of production cases skipped verification anyway.`,
      failureMode:
        'Prompt instructions have a non-zero failure rate. In production, 12% of cases ' +
        'still skipped verification — leading to misidentified accounts and incorrect ' +
        'refunds. For compliance-critical sequences, enforce in code.',
    },
    quizQuestionRefs: [
      { sectionId: 's2', questionId: 2 },
      { sectionId: 's2', questionId: 4 },
    ],
  },

  // -----------------------------------------------------------------------
  // Task 1.5 — Agent SDK hooks (PostToolUse, PreToolUse)
  // -----------------------------------------------------------------------
  {
    id: 'posttool-hooks',
    title: 'PostToolUse hooks — intercept tool results',
    summary:
      'Hooks intercept tool results BEFORE the model sees them — the right home for ' +
      'data normalization (Unix → ISO 8601, numeric → human-readable) and policy ' +
      'enforcement (block refunds over $500). Choose hooks over prompts when business ' +
      'rules require guaranteed compliance — even for third-party MCP tools you cannot modify.',
    source: 'src/agents/hooks.ts',
    language: 'ts',
    codeSnippet: `// src/agents/hooks.ts
//
// PostToolUse: normalize heterogeneous data from different MCP tools.
export const postToolUse = (toolName: string, result: unknown) => {
  if (toolName === 'get_customer') return normalizeCustomer(result);
  if (toolName === 'lookup_order')  return normalizeOrder(result);
  return result;
};

function normalizeCustomer(raw: any) {
  return {
    ...raw,
    // Unix timestamp → ISO 8601 (consistent across all tools)
    createdAt: new Date(raw.created_at * 1000).toISOString(),
    // 1=pending, 2=shipped → human-readable
    status: STATUS_MAP[raw.status_code] ?? 'unknown',
  };
}

// PreToolUse: block policy-violating actions before they execute.
export const preToolUse = (toolName: string, input: any) => {
  if (toolName === 'process_refund' && input.amount > 500) {
    return {
      block: true,
      redirectTo: 'escalate_to_human',
      reason: 'Refunds over $500 require human approval (policy POL-7).',
    };
  }
  return { block: false };
};`,
    taskRef: '1.5',
    type: 'tooling',
    tags: ['hooks', 'PostToolUse', 'PreToolUse', 'normalization', 'policy'],
    related: ['structured-errors', 'programmatic-prerequisites', 'tool-distribution'],
    antiPattern: {
      title: 'Prompt-side data format documentation',
      language: 'md',
      badCode: `# In the system prompt:
- get_customer returns Unix timestamps in created_at
- lookup_order returns ISO 8601 in placed_at
- status_code is numeric: 1=pending, 2=shipped, 3=delivered
Please convert these formats when communicating with the customer.

# Reality: the model misinterprets 30%+ of the time, especially under load.`,
      failureMode:
        'Relies on LLM interpretation of format conventions every turn. Inconsistent at ' +
        'scale, can\'t cover third-party MCP tools you don\'t own, and adds prompt tokens ' +
        'on every call. A hook does it once, deterministically.',
    },
    quizQuestionRefs: [{ sectionId: 's2', questionId: 9 }],
  },

  // -----------------------------------------------------------------------
  // Task 1.6 — Task decomposition strategies
  // -----------------------------------------------------------------------
  {
    id: 'task-decomposition',
    title: 'Task decomposition — chaining vs adaptive',
    summary:
      'Prompt chaining (fixed sequential pipeline) for predictable multi-aspect work like ' +
      'reviews — analyze each file individually, then run a cross-file integration pass. ' +
      'Dynamic adaptive decomposition for open-ended investigations where subtasks ' +
      'depend on what is discovered. Picking the wrong shape causes attention dilution ' +
      'or wasted parallel work.',
    source: 'src/agents/decomposition.ts',
    language: 'ts',
    codeSnippet: `// src/agents/decomposition.ts

// Prompt chaining: fixed sequential pipeline, good for code review.
export async function reviewLargePR(files: File[]) {
  // Phase A: per-file local analysis (avoids attention dilution).
  const local = await Promise.all(files.map((f) => dispatch('local-review', f)));
  // Phase B: cross-file integration pass that sees only Phase-A summaries.
  return dispatch('integration-review', {
    fileSummaries: local.map((r) => r.summary),
  });
}

// Adaptive decomposition: subtasks emerge from intermediate findings.
export async function investigate(question: string) {
  const map     = await dispatch('mapper', question);          // step 1
  const plan    = await dispatch('planner', { question, map }); // step 2 — uses step 1
  // Step 3 — partition by what step 2 actually surfaced (not pre-fixed).
  return Promise.all(plan.subtopics.map((s) => dispatch('researcher', s)));
}`,
    taskRef: '1.6',
    type: 'architectural',
    tags: ['decomposition', 'prompt-chaining', 'adaptive', 'integration-pass'],
    related: ['hub-and-spoke', 'parallel-subagents', 'multi-instance-review', 'context-pruning'],
    antiPattern: {
      title: 'Narrow decomposition that drops whole subtopic categories',
      language: 'ts',
      badCode: `// User: "Report on AI's impact on creative industries"
const subtopics = [
  'AI in digital art',
  'AI in graphic design',
  'AI in photography',
];
// Music, writing, and film production were never assigned to any subagent.`,
      failureMode:
        'The synthesis output is coherent but misses entire domains the user expected. ' +
        'Each subagent did its job correctly — the decomposition itself was the bug.',
    },
    quizQuestionRefs: [
      { sectionId: 's1', questionId: 15 },
      { sectionId: 's4', questionId: 14 },
      { sectionId: 's4', questionId: 8 },
    ],
  },

  // -----------------------------------------------------------------------
  // Task 1.7 — Session resume + fork
  // -----------------------------------------------------------------------
  {
    id: 'session-resume-fork',
    title: 'Session resumption and fork_session',
    summary:
      '`--resume <name>` continues a named investigation across work sessions. ' +
      '`fork_session` creates independent branches from a shared analysis baseline ' +
      'for exploring divergent approaches. If files changed since the prior session, ' +
      'inject a structured summary on resume instead of trusting stale tool results.',
    source: 'src/agents/sessions.ts',
    language: 'ts',
    codeSnippet: `// Resume the same investigation across days.
claude --resume "refund-system-audit"

// Fork from a shared baseline to compare two refactoring strategies.
const baseline = await analyzeCodebase();
const optionA = await forkSession(baseline.sessionId, { plan: 'extract-service' });
const optionB = await forkSession(baseline.sessionId, { plan: 'inline-module' });

// If files changed between sessions, inject a summary instead of resuming.
function shouldResume(session: Session, changedFiles: string[]) {
  const stale = changedFiles.some((f) => session.analyzedFiles.has(f));
  return !stale; // when stale, start fresh with a structured summary.
}`,
    taskRef: '1.7',
    type: 'config',
    tags: ['--resume', 'fork_session', 'session-state', 'crash-recovery'],
    related: ['scratchpad', 'task-allowed-tools', 'provenance-and-uncertainty'],
    antiPattern: {
      title: 'Blindly resuming a stale session after code changed',
      language: 'bash',
      badCode: `# Yesterday: session analyzed src/billing/ and reasoned about refund flow.
# Overnight: a colleague refactored src/billing/refund.ts.
$ claude --resume "billing-audit"
> Continue investigating the refund flow…
# Claude references methods and call sites that no longer exist.`,
      failureMode:
        'Resumed sessions trust their prior tool results. When the underlying files ' +
        'have changed, the agent confidently reasons about ghost code. A structured ' +
        'summary + fresh exploration is more reliable.',
    },
  },
];
