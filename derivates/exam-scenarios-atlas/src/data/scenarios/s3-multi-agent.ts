import type { Scenario } from '../types'

export const scenario3: Scenario = {
  id: 'multi-agent-research',
  number: 3,
  title: 'Multi-Agent Research System',
  hook: 'A coordinator fans tasks out to specialised subagents — search, analyse, synthesise, report — and stitches the results.',
  brief:
    'You are building a multi-agent research system using the Claude Agent SDK. A coordinator agent delegates to specialised subagents: one searches the web, one analyses documents, one synthesises findings, and one generates reports. The system researches topics and produces comprehensive, cited reports.',
  primaryDomains: [1, 2, 5],
  example: {
    title: 'A topic that splits wider than it looks',
    body:
      '"Impact of AI on creative industries" sounds bounded but spans music, film, writing, visual arts, design. A narrow coordinator decomposes it into "AI in digital art, graphic design, photography" — three subagents finish their assignments brilliantly and the final report omits music, writing, and film. The bug is decomposition, not the workers.',
  },
  infographic: {
    kind: 'coordinator-subagents',
    caption:
      'Hub-and-spoke. Subagents do NOT inherit the coordinator\'s context — findings are explicitly passed in each prompt. Errors propagate as structured envelopes, never silent empties.',
  },
  flow: [
    {
      label: 'Coordinator decomposes',
      body: 'Coordinator analyses the query. Wide topic → multiple subtopics covering full domain breadth. Quality criterion stated: "name each major sub-sector explicitly to avoid coverage gaps".',
      stopReason: 'tool_use',
      mandate: 'TS 1.2 · Decomposition that covers the full topic, not the coordinator\'s first hunch.',
    },
    {
      label: 'Parallel spawn (single response)',
      body: 'The coordinator emits multiple Task tool calls in one assistant turn — search, document analysis run in parallel. allowedTools includes "Task" or no subagent can be spawned at all.',
      toolCalls: [
        { name: 'Task', input: '{ "agent": "web_search", "prompt": "AI in music production…" }' },
        { name: 'Task', input: '{ "agent": "web_search", "prompt": "AI in film/animation…" }' },
        { name: 'Task', input: '{ "agent": "doc_analysis", "prompt": "Recent papers — generative writing tools…" }' },
      ],
      stopReason: 'tool_use',
      mandate: 'TS 1.3 · Parallel Task calls in one response, not across turns.',
    },
    {
      label: 'Subagents return structured findings',
      body: 'Each finding is a claim + evidence + source URL + publication date. Synthesis-friendly format separates content from metadata so attribution survives compression.',
      mandate: 'TS 5.6 · Structured claim-source mappings preserved through synthesis.',
    },
    {
      label: 'Transient subagent failure',
      body: 'Web search times out. Subagent returns structured error: { failure_type, attempted_query, partial_results, suggested_alternatives } — never a generic "search unavailable".',
      toolCalls: [
        {
          name: 'Task',
          input: '{ "agent": "web_search", … }',
          result: '{ "isError": true, "errorCategory": "transient", "isRetryable": true, "partial_results": […] }',
          isError: true,
        },
      ],
      stopReason: 'tool_use',
      mandate: 'TS 5.3 · Structured errors with partial results, not silent empties.',
    },
    {
      label: 'Coordinator recovers',
      body: 'Sees retryable + partial results. Re-delegates the failed query with a narrower scope; proceeds.',
      stopReason: 'tool_use',
    },
    {
      label: 'Synthesis with scoped tool',
      body: 'Synthesis agent has a scoped verify_fact tool — cheap fact-checks happen without round-tripping the coordinator. Complex verification still routes through the coordinator.',
      mandate: 'TS 2.3 · Scoped cross-role tools for high-frequency needs only.',
    },
    {
      label: 'Final report with coverage annotations',
      body: 'Report flags well-supported findings vs contested ones; conflicting numbers preserved with source attribution rather than arbitrarily picked. Topic areas with thin coverage are explicitly labelled.',
      stopReason: 'end_turn',
      mandate: 'TS 5.6 · Conflict annotation, coverage gaps surfaced.',
    },
  ],
  code: [
    {
      lang: 'ts',
      label: 'Coordinator definition',
      body: `import { AgentDefinition } from "@anthropic-ai/sdk/agents";

export const coordinator: AgentDefinition = {
  name: "research_coordinator",
  description:
    "Decomposes a research topic into parallel subtasks that COLLECTIVELY COVER the topic " +
    "without overlap. Re-delegates on coverage gaps or transient failures.",
  allowedTools: ["Task"], // ← MUST include Task to spawn subagents
  systemPrompt: \`
You research broad topics. Decompose into sub-sectors that together cover the full topic.
If the topic is "creative industries," that means at minimum music, film, writing,
visual arts, design — NOT only visual arts.

Quality criterion: name every major sub-sector explicitly in your decomposition before
spawning. Spawn subagents in parallel (multiple Task calls in ONE response).
\`,
};`,
    },
    {
      lang: 'ts',
      label: 'Web-search subagent (scoped, structured errors)',
      body: `export const webSearch: AgentDefinition = {
  name: "web_search",
  description: "Searches the web for a specific scoped query. Returns structured findings.",
  allowedTools: ["web_search"], // no Task — leaf agent
  systemPrompt: \`
Return one structured object:

{
  "findings": [
    { "claim": "...", "evidence": "verbatim quote", "source_url": "...", "published": "YYYY-MM-DD" }
  ],
  "coverage_notes": "what you tried, what you couldn't find and why"
}

If a search fails, return:
{ "isError": true, "errorCategory": "transient" | "permission",
  "isRetryable": true | false, "partial_results": [...], "attempted_query": "..." }

Never return an empty findings array as success. Empty-as-success masks errors.
\`,
};`,
    },
    {
      lang: 'ts',
      label: 'Synthesis with a SCOPED verify_fact tool',
      body: `export const synthesis: AgentDefinition = {
  name: "synthesis",
  description: "Combines findings from search and document agents into a unified report.",
  // 85% of verifications are simple — give a scoped local tool.
  // Complex ones still go through the coordinator (see TS 2.3).
  allowedTools: ["verify_fact"],
  systemPrompt: \`
Preserve each claim's source attribution end-to-end. If two credible sources disagree,
keep BOTH values with attribution rather than choosing.
\`,
};`,
    },
  ],
  qna: [
    {
      q: 'After running the system on the topic "impact of AI on creative industries," you observe that each subagent completes successfully: the web search agent finds relevant articles, the document analysis agent summarises papers correctly, and the synthesis agent produces coherent output. However, the final reports cover only visual arts, completely missing music, writing, and film production. When you examine the coordinator\'s logs, you see it decomposed the topic into three subtasks: "AI in digital art creation," "AI in graphic design," and "AI in photography." What is the most likely root cause?',
      options: [
        { key: 'A', text: 'The synthesis agent lacks instructions for identifying coverage gaps in the findings it receives from other agents.' },
        { key: 'B', text: 'The coordinator agent\'s task decomposition is too narrow, resulting in subagent assignments that don\'t cover all relevant domains of the topic.' },
        { key: 'C', text: 'The web search agent\'s queries are not comprehensive enough and need to be expanded to cover more creative industry sectors.' },
        { key: 'D', text: 'The document analysis agent is filtering out sources related to non-visual creative industries due to overly restrictive relevance criteria.' },
      ],
      correct: 'B',
      explain:
        'The coordinator\'s logs reveal the root cause directly: it decomposed "creative industries" into only visual arts subtasks (digital art, graphic design, photography), completely omitting music, writing, and film. The subagents executed their assigned tasks correctly — the problem is what they were assigned. Options A, C, and D incorrectly blame downstream agents that are working correctly within their assigned scope.',
      ref: 'Sample Q7 · TS 1.2',
    },
    {
      q: 'The web search subagent times out while researching a complex topic. You need to design how this failure information flows back to the coordinator agent. Which error propagation approach best enables intelligent recovery?',
      options: [
        { key: 'A', text: 'Return structured error context to the coordinator including the failure type, the attempted query, any partial results, and potential alternative approaches.' },
        { key: 'B', text: 'Implement automatic retry logic with exponential backoff within the subagent, returning a generic "search unavailable" status only after all retries are exhausted.' },
        { key: 'C', text: 'Catch the timeout within the subagent and return an empty result set marked as successful.' },
        { key: 'D', text: 'Propagate the timeout exception directly to a top-level handler that terminates the entire research workflow.' },
      ],
      correct: 'A',
      explain:
        'Structured error context gives the coordinator the information it needs to make intelligent recovery decisions — whether to retry with a modified query, try an alternative approach, or proceed with partial results. B\'s generic status hides valuable context from the coordinator, preventing informed decisions. C suppresses the error by marking failure as success, which prevents any recovery and risks incomplete research outputs. D terminates the entire workflow unnecessarily when recovery strategies could succeed.',
      ref: 'Sample Q8 · TS 5.3',
    },
    {
      q: 'During testing, you observe that the synthesis agent frequently needs to verify specific claims while combining findings. Currently, when verification is needed, the synthesis agent returns control to the coordinator, which invokes the web search agent, then re-invokes synthesis with results. This adds 2-3 round trips per task and increases latency by 40%. Your evaluation shows that 85% of these verifications are simple fact-checks (dates, names, statistics) while 15% require deeper investigation. What is the most effective approach to reduce overhead while maintaining system reliability?',
      options: [
        { key: 'A', text: 'Give the synthesis agent a scoped verify_fact tool for simple lookups, while complex verifications continue delegating to the web search agent through the coordinator.' },
        { key: 'B', text: 'Have the synthesis agent accumulate all verification needs and return them as a batch to the coordinator at the end of its pass, which then sends them all to the web search agent at once.' },
        { key: 'C', text: 'Give the synthesis agent access to all web search tools so it can handle any verification need directly without round-trips through the coordinator.' },
        { key: 'D', text: 'Have the web search agent proactively cache extra context around each source during initial research, anticipating what the synthesis agent might need to verify.' },
      ],
      correct: 'A',
      explain:
        'Option A applies the principle of least privilege by giving the synthesis agent only what it needs for the 85% common case (simple fact verification) while preserving the existing coordination pattern for complex cases. Option B\'s batching approach creates blocking dependencies since synthesis steps may depend on earlier verified facts. Option C over-provisions the synthesis agent, violating separation of concerns. Option D relies on speculative caching that cannot reliably predict what the synthesis agent will need to verify.',
      ref: 'Sample Q9 · TS 2.3',
    },
  ],
  takeaways: [
    'Subagents inherit nothing — pass complete findings into each subagent\'s prompt.',
    'Parallel spawn = multiple Task calls in ONE assistant response, not across turns.',
    'Errors propagate as structured envelopes with partial results; empty-as-success silently kills recovery.',
  ],
}
