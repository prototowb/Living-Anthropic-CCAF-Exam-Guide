import type { Scenario } from '../types'

const foils: Scenario['foils'] = [
  {
    title: 'Refund ceiling as a prompt instruction',
    ref: 'TS 1.5',
    wrong: {
      label: 'System prompt (hope)',
      lang: 'md',
      body: `IMPORTANT: Never process refunds above $500.
Always verify the customer before any account action.
(…the model complies ~98% of the time…)`,
    },
    right: {
      label: 'PreToolUse hook (guarantee)',
      lang: 'ts',
      body: `if (name === "process_refund" && input.amount_usd > 500) {
  return { allow: false, reason: "above_threshold",
           redirectTo: "escalate_to_human" };
}`,
    },
    failure:
      'Prompt compliance is probabilistic; at financial consequence, 2% non-compliance is an incident review, not a rounding error.',
  },
  {
    title: 'One mega-tool for everything',
    ref: 'TS 2.1',
    wrong: {
      label: 'handle_customer(action, …)',
      lang: 'jsonc',
      body: `{
  "name": "handle_customer",
  "description": "Handles customer operations.",
  "input_schema": { "properties": {
    "action": { "enum": ["lookup","refund","cancel","escalate"] },
    "payload": { "type": "object" } // anything goes
  } }
}`,
    },
    right: {
      label: 'Granular tools, sharp boundaries',
      lang: 'jsonc',
      body: `// get_customer · lookup_order · process_refund · escalate_to_human
// Each: narrow schema, rich description, structured
// error envelope { isError, errorCategory, isRetryable }`,
    },
    failure:
      'A grab-bag schema gives the model nothing to select on and collapses validation into one untyped payload — misroutes surface as production incidents instead of schema errors.',
  },
]

export const scenario1: Scenario = {
  id: 'customer-support',
  number: 1,
  title: 'Customer Support Resolution Agent',
  hook: 'Agent SDK + MCP tools target 80%+ first-contact resolution, while knowing when to escalate.',
  brief:
    'You are building a customer support resolution agent using the Claude Agent SDK. The agent handles high-ambiguity requests like returns, billing disputes, and account issues. It has access to your backend systems through custom MCP tools (get_customer, lookup_order, process_refund, escalate_to_human). Your target is 80%+ first-contact resolution while knowing when to escalate.',
  primaryDomains: [1, 2, 5],
  example: {
    title: 'A customer wants two things at once',
    body:
      '"Hi — my order #A-441 arrived broken, and please cancel my subscription too." A naïve agent might call lookup_order with the stated name, then guess. A well-built one identifies two concerns, verifies the customer first, addresses both, and produces a single coherent reply — escalating only if a policy gap is hit (e.g., a refund above the programmatic $500 ceiling).',
  },
  infographic: {
    kind: 'agentic-loop',
    caption:
      'The loop continues while stop_reason === "tool_use". A PreToolUse hook gates process_refund on a verified customer. PostToolUse normalises timestamps from heterogenous MCP tools.',
  },
  flow: [
    {
      label: 'Receive turn',
      body: 'Customer message arrives. The system prompt declares escalation criteria with few-shot examples and the four tools available.',
      stopReason: 'tool_use',
      mandate: 'TS 1.1 · Inspect stop_reason. TS 5.2 · Explicit escalation criteria via few-shot.',
    },
    {
      label: 'Verify identity',
      body: 'Model decides to call get_customer first — a programmatic prerequisite blocks every downstream tool until a verified customer_id is returned.',
      toolCalls: [
        {
          name: 'get_customer',
          input: '{ "email": "rae@…" }',
          result: '{ "customer_id": "C-77821", "verified": true }',
        },
      ],
      stopReason: 'tool_use',
      mandate: 'TS 1.4 · Programmatic prerequisite, not prompt-based guidance.',
    },
    {
      label: 'Decompose & investigate',
      body: 'The agent splits the multi-concern request: "broken order" and "cancel subscription" become two parallel investigations sharing the verified customer context.',
      toolCalls: [
        {
          name: 'lookup_order',
          input: '{ "order_id": "A-441", "customer_id": "C-77821" }',
          result: '{ "items": […], "status": "delivered", "total_usd": 89.00 }',
        },
      ],
      stopReason: 'tool_use',
      mandate: 'TS 1.4 · Decompose multi-concern messages; share context across investigations.',
    },
    {
      label: 'Compliance hook',
      body: 'PreToolUse hook inspects the planned process_refund call: amount under threshold, customer verified → allowed. Above $500 the hook would redirect to escalate_to_human.',
      toolCalls: [
        {
          name: 'process_refund',
          input: '{ "customer_id": "C-77821", "amount_usd": 89.00, "reason": "damaged_in_transit" }',
          result: '{ "refund_id": "R-1023", "status": "completed" }',
        },
      ],
      stopReason: 'tool_use',
      mandate: 'TS 1.5 · Hooks for deterministic compliance, not prompt instructions.',
    },
    {
      label: 'Cancel subscription',
      body: 'Second branch resolves: cancellation processed via a separate scoped tool. Tool returns structured success; agent will compose the unified reply next.',
      stopReason: 'tool_use',
    },
    {
      label: 'Synthesise reply',
      body: 'Single response addresses both concerns, references the refund_id, confirms the cancellation effective date.',
      stopReason: 'end_turn',
      mandate: 'TS 5.1 · Persistent case-facts block keeps amounts/IDs out of summarised history.',
    },
    {
      label: 'Escalation foil',
      body: 'If the customer had asked for a $1,200 refund, the PreToolUse hook blocks process_refund and produces a structured handoff: customer_id, root cause, recommended action — for a human reviewer who never saw the transcript.',
      stopReason: 'pause_for_human',
      mandate: 'TS 1.4 · Structured handoff protocol on escalation.',
    },
  ],
  code: [
    {
      lang: 'ts',
      label: 'Agentic loop (sketch)',
      body: `import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const tools = [
  GET_CUSTOMER, LOOKUP_ORDER, PROCESS_REFUND, ESCALATE_TO_HUMAN,
];

const messages: Anthropic.MessageParam[] = [
  { role: "user", content: userTurn },
];

while (true) {
  const res = await client.messages.create({
    model: "claude-opus-4-7",
    system: SYSTEM_PROMPT_WITH_ESCALATION_CRITERIA,
    tools, messages, max_tokens: 1024,
  });

  messages.push({ role: "assistant", content: res.content });

  if (res.stop_reason === "end_turn") return res; // ← terminate

  if (res.stop_reason !== "tool_use") {
    throw new Error("unexpected stop_reason: " + res.stop_reason);
  }

  const toolUses = res.content.filter((b) => b.type === "tool_use");
  const results = await Promise.all(toolUses.map(invokeWithHook));
  messages.push({ role: "user", content: results });
}`,
    },
    {
      lang: 'ts',
      label: 'PreToolUse hook (compliance gate)',
      body: `// Returning { allow: false, … } redirects the model to the escalation tool.
export const preToolUse: PreToolUseHook = async ({ name, input, ctx }) => {
  if (name === "process_refund") {
    if (!ctx.verifiedCustomerId) {
      return { allow: false, reason: "no_verified_customer", redirectTo: "get_customer" };
    }
    if (input.amount_usd > 500) {
      return { allow: false, reason: "above_threshold", redirectTo: "escalate_to_human" };
    }
  }
  return { allow: true };
};`,
    },
    {
      lang: 'jsonc',
      label: 'Tool definition (structured errors)',
      body: `{
  "name": "lookup_order",
  "description": "Retrieves a single order by order_id for a verified customer. Use when the customer references an order number or asks about order status, shipping, or contents. Returns line items, totals, status, and tracking. DO NOT use to find a customer record — call get_customer first.",
  "input_schema": {
    "type": "object",
    "properties": {
      "order_id":    { "type": "string", "pattern": "^[A-Z]-\\\\d{3,6}$" },
      "customer_id": { "type": "string" }
    },
    "required": ["order_id", "customer_id"]
  },
  // Structured error envelope returned on failure:
  // { isError: true, errorCategory: "transient" | "validation" | "business" | "permission",
  //   isRetryable: boolean, message: "human-readable" }
}`,
    },
  ],
  qna: [
    {
      q: 'Production data shows that in 12% of cases, your agent skips get_customer entirely and calls lookup_order using only the customer\'s stated name, occasionally leading to misidentified accounts and incorrect refunds. What change would most effectively address this reliability issue?',
      options: [
        { key: 'A', text: 'Add a programmatic prerequisite that blocks lookup_order and process_refund calls until get_customer has returned a verified customer ID.' },
        { key: 'B', text: 'Enhance the system prompt to state that customer verification via get_customer is mandatory before any order operations.' },
        { key: 'C', text: 'Add few-shot examples showing the agent always calling get_customer first, even when customers volunteer order details.' },
        { key: 'D', text: 'Implement a routing classifier that analyses each request and enables only the subset of tools appropriate for that request type.' },
      ],
      correct: 'A',
      explain:
        'When a specific tool sequence is required for critical business logic (verifying customer identity before processing refunds), programmatic enforcement provides deterministic guarantees that prompt-based approaches cannot. B and C rely on probabilistic LLM compliance, which is insufficient when errors have financial consequences. D addresses tool availability rather than tool ordering, which is not the actual problem.',
      ref: 'Sample Q1 · TS 1.4',
    },
    {
      q: 'Production logs show the agent frequently calls get_customer when users ask about orders (e.g., "check my order #12345"), instead of calling lookup_order. Both tools have minimal descriptions ("Retrieves customer information" / "Retrieves order details") and accept similar identifier formats. What is the most effective first step to improve tool selection reliability?',
      options: [
        { key: 'A', text: 'Add few-shot examples to the system prompt demonstrating correct tool selection patterns, with 5-8 examples showing order-related queries routing to lookup_order.' },
        { key: 'B', text: 'Expand each tool\'s description to include input formats it handles, example queries, edge cases, and boundaries explaining when to use it versus similar tools.' },
        { key: 'C', text: 'Implement a routing layer that parses user input before each turn and pre-selects the appropriate tool based on detected keywords and identifier patterns.' },
        { key: 'D', text: 'Consolidate both tools into a single lookup_entity tool that accepts any identifier and internally determines which backend to query.' },
      ],
      correct: 'B',
      explain:
        'Tool descriptions are the primary mechanism LLMs use for tool selection. When descriptions are minimal, models lack the context to differentiate between similar tools. B addresses this root cause with a low-effort, high-leverage fix. Few-shot (A) adds token overhead without fixing the underlying issue. A routing layer (C) is over-engineered and bypasses the LLM\'s natural language understanding. Consolidating (D) is valid but heavier than warranted when the immediate problem is inadequate descriptions.',
      ref: 'Sample Q2 · TS 2.1',
    },
    {
      q: 'Your agent achieves 55% first-contact resolution, below the 80% target. Logs show it escalates straightforward cases (standard damage replacements with photo evidence) while attempting to autonomously handle complex situations requiring policy exceptions. What is the most effective way to improve escalation calibration?',
      options: [
        { key: 'A', text: 'Add explicit escalation criteria to your system prompt with few-shot examples demonstrating when to escalate versus resolve autonomously.' },
        { key: 'B', text: 'Have the agent self-report a confidence score (1-10) before each response and automatically route to humans when confidence falls below a threshold.' },
        { key: 'C', text: 'Deploy a separate classifier model trained on historical tickets to predict which requests need escalation before the main agent begins processing.' },
        { key: 'D', text: 'Implement sentiment analysis to detect customer frustration levels and automatically escalate when negative sentiment exceeds a threshold.' },
      ],
      correct: 'A',
      explain:
        'Adding explicit escalation criteria with few-shot examples directly addresses the root cause: unclear decision boundaries. This is the proportionate first response before adding infrastructure. B fails because LLM self-reported confidence is poorly calibrated — the agent is already incorrectly confident on hard cases. C is over-engineered, requiring labeled data and ML infrastructure when prompt optimisation has not been tried. D solves a different problem entirely; sentiment does not correlate with case complexity.',
      ref: 'Sample Q3 · TS 5.2',
    },
  ],
  foils,
  takeaways: [
    'Programmatic hooks beat prompt instructions whenever compliance is non-negotiable (refund ceilings, identity verification).',
    'Tool descriptions are the LLM\'s tool-selection contract — invest in them before adding routing layers.',
    'Explicit, few-shot escalation criteria outperform LLM self-confidence or sentiment heuristics.',
  ],
}
