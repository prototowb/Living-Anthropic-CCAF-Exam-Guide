// Domain 2 — Tool Design & MCP Integration.
// Covers exam tasks 2.1 through 2.5.

import type { DomainPattern } from './types';

export const d2Patterns: DomainPattern[] = [
  // -----------------------------------------------------------------------
  // Task 2.1 — Tool interfaces
  // -----------------------------------------------------------------------
  {
    id: 'granular-tools',
    title: 'Granular tools (Architect\'s Pattern)',
    summary:
      'Tool descriptions are the primary signal the model uses for selection. Many ' +
      'small, single-purpose tools — each with a clear name, input format, example ' +
      'queries, and a "use this versus those alternatives" boundary — beat one ' +
      'monolithic `analyze_anything` every time.',
    source: 'src/agents/tools/*.ts',
    language: 'ts',
    codeSnippet: `// src/agents/tools/lookupQuestion.ts
export const lookupQuestionSpec = {
  name: 'lookup_question',
  description:
    'Retrieve a single quiz question by its section id ("s1" | "s2" | "s3" | "s4") ' +
    'and 1-based question id (e.g. 4). Use when the user asks about a specific quiz ' +
    'item. Do NOT use to search across questions — use search_patterns for that.',
  input_schema: {
    type: 'object',
    required: ['section', 'id'],
    properties: {
      section: { type: 'string', description: 'Section id like s1, s2, s3, s4' },
      id:      { type: 'integer', minimum: 1 },
    },
  },
};

// Split a generic analyze_document into purpose-specific tools:
//   extract_data_points        — pull numeric facts
//   summarize_content          — narrative summary
//   verify_claim_against_source — fact-check a single assertion`,
    taskRef: '2.1',
    type: 'tooling',
    tags: ['tool-description', 'selection-reliability', 'split-monolith'],
    related: ['tool-distribution', 'structured-errors', 'few-shot'],
    antiPattern: {
      title: 'Overlapping tool names + minimal descriptions',
      language: 'ts',
      badCode: `// Two tools, near-identical descriptions:
{ name: 'analyze_content',  description: 'analyzes content and extracts key information' }
{ name: 'analyze_document', description: 'analyzes documents and extracts key information' }

// Production: "analyze the quarterly report I uploaded" routes to analyze_content
// (web search) 45% of the time instead of analyze_document.`,
      failureMode:
        'Semantically overlapping names + thin descriptions force the model to guess. ' +
        'Rename to remove overlap (e.g. `extract_web_results` vs `analyze_uploaded_document`) ' +
        'and pack each description with input formats, example queries, and an explicit ' +
        '"use this versus that" line.',
    },
    quizQuestionRefs: [
      { sectionId: 's2', questionId: 1 },
      { sectionId: 's2', questionId: 12 },
      { sectionId: 's4', questionId: 9 },
    ],
  },

  // -----------------------------------------------------------------------
  // Task 2.2 — Structured error responses
  // -----------------------------------------------------------------------
  {
    id: 'structured-errors',
    title: 'Structured Error Responses (`isError` + `errorCategory`)',
    summary:
      'Every tool returns either `{ isError: false, data }` or ' +
      '`{ isError: true, errorCategory, isRetryable, message }`. The categories — ' +
      '`transient`, `validation`, `business`, `permission` — let the caller decide ' +
      'recovery without parsing strings. `isRetryable: false` saves wasted retries on ' +
      'permanent failures.',
    source: 'src/agents/tools/types.ts',
    language: 'ts',
    codeSnippet: `// src/agents/tools/types.ts
export type ErrorCategory =
  | 'transient'   // network blip, rate limit            → retry
  | 'validation'  // bad input shape                     → fix args, retry
  | 'business'    // policy violation, not found        → change strategy
  | 'permission'; // caller lacks the right to do this  → escalate

export type ToolResponse<T> =
  | { isError: false; data: T }
  | { isError: true;
      errorCategory: ErrorCategory;
      isRetryable: boolean;
      message: string;       // human-readable, customer-safe
    };

// Subagents implement local recovery for transient failures; only propagate
// errors they cannot resolve, along with what was attempted and any partial
// results obtained.
async function loadWithRetry(url: string): Promise<ToolResponse<Document>> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await load(url);
    if (!r.isError) return r;
    if (r.errorCategory !== 'transient' || !r.isRetryable) return r;
    await sleep(2 ** attempt * 100);
  }
  return { isError: true, errorCategory: 'transient', isRetryable: false,
           message: 'load_document: exhausted 3 transient retries' };
}`,
    taskRef: '2.2',
    type: 'tooling',
    tags: ['isError', 'errorCategory', 'isRetryable', 'recovery'],
    related: ['multi-agent-error-propagation', 'granular-tools', 'posttool-hooks', 'tool-distribution'],
    antiPattern: {
      title: 'Uniform error responses',
      language: 'ts',
      badCode: `// Anti-pattern: every failure looks the same.
return { isError: true, message: 'Operation failed' };

// Or worse — silent success:
catch (e) { return { isError: false, data: [] }; }`,
      failureMode:
        'The agent has no way to tell a timeout (retry!) from a policy violation ' +
        '(escalate!) from a "no results found" (valid result!). It either retries ' +
        'infinitely, escalates everything, or worse — silently returns empty success ' +
        'and the synthesis subagent draws conclusions from missing data.',
    },
    sandbox: 'structured-errors',
    quizQuestionRefs: [
      { sectionId: 's4', questionId: 4 },
      { sectionId: 's4', questionId: 5 },
      { sectionId: 's4', questionId: 7 },
    ],
  },

  // -----------------------------------------------------------------------
  // Task 2.3 — Tool distribution + tool_choice
  // -----------------------------------------------------------------------
  {
    id: 'tool-distribution',
    title: 'Tool distribution + `tool_choice`',
    summary:
      'Give an agent 18 tools and selection reliability collapses. Give a synthesis ' +
      'agent web-search tools and it starts ad-hoc-searching. The principle is least ' +
      'privilege: scope each subagent to the tools it needs, then provide narrow ' +
      'cross-role tools (e.g. `verify_fact`) for high-frequency edge cases. ' +
      '`tool_choice` ("auto" | "any" | forced) controls whether and which tool fires.',
    source: 'src/agents/distribution.ts',
    language: 'ts',
    codeSnippet: `// src/agents/distribution.ts
// Each subagent gets ONLY the tools its role needs.
export const SUBAGENT_TOOLS = {
  'web-search':     ['search_engine', 'fetch_url'],
  'doc-analysis':   ['load_document', 'extract_data_points', 'verify_claim'],
  'synthesis':      ['verify_fact'],          // narrow cross-role escape hatch
  'code-reviewer':  ['grade_answer'],
} as const;

// tool_choice options:
//   "auto"               — model may return text instead of calling a tool
//   "any"                — model MUST call SOME tool (use when text output is wrong)
//   { type: 'tool', name } — forced selection: model MUST call THIS tool first
await sdk.createMessage({
  messages,
  tools: extractionSchemas,
  tool_choice: { type: 'tool', name: 'extract_metadata' }, // run this first, always
});`,
    taskRef: '2.3',
    type: 'tooling',
    tags: ['least-privilege', 'tool_choice', 'scoping', 'role-based'],
    related: ['granular-tools', 'hub-and-spoke', 'structured-errors'],
    antiPattern: {
      title: 'Giving every subagent every tool',
      language: 'ts',
      badCode: `// All 18 tools available to every subagent.
const ALL_TOOLS = [...webTools, ...docTools, ...billingTools, ...verifyTools];
const synthesis = createAgent({ tools: ALL_TOOLS });

// Production: synthesis subagent fetches search engine URLs to do ad-hoc
// research, bypassing the web-search subagent. Findings are inconsistent
// because two different agents are now searching with different prompts.`,
      failureMode:
        'Decision complexity grows quadratically — accurate selection drops. Agents ' +
        'with tools outside their specialization misuse them and bypass the coordinator, ' +
        'causing duplicate work and inconsistent results.',
    },
    quizQuestionRefs: [
      { sectionId: 's4', questionId: 3 },
      { sectionId: 's4', questionId: 6 },
    ],
  },

  // -----------------------------------------------------------------------
  // Task 2.4 — MCP integration & scoping
  // -----------------------------------------------------------------------
  {
    id: 'mcp-scoping',
    title: 'MCP scoping — `.mcp.json` vs `~/.claude.json`',
    summary:
      'Team tools belong in project-scoped `.mcp.json` (committed). Personal credentials ' +
      'never go to git — they belong in `~/.claude.json`. Use ' +
      '`${ENV_VAR}` expansion inside `.mcp.json` so each developer supplies their own ' +
      'token via their environment. Expose content catalogues as MCP resources to reduce ' +
      'exploratory tool calls.',
    source: '.mcp.json, src/showcase/mcp-scoping.example.json',
    language: 'json',
    codeSnippet: `// .mcp.json (project scope — committed to git)
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "\${GITHUB_TOKEN}" }   // env-var expansion
    },
    "issues": {
      "command": "node",
      "args": ["./mcp-servers/issues.js"],
      // Expose a content catalogue as an MCP resource so the agent can
      // discover what's available without exploratory tool calls.
      "resources": ["issue-summaries", "documentation-tree"]
    }
  }
}

// ~/.claude.json (user scope — NEVER committed; personal experimental servers)
{ "mcpServers": { "local-experiment": { ... } } }`,
    taskRef: '2.4',
    type: 'config',
    tags: ['.mcp.json', 'env-var', 'scoping', 'mcp-resources', 'credentials'],
    related: ['claude-md-hierarchy', 'granular-tools', 'slash-commands-and-skills'],
    antiPattern: {
      title: 'Committing a placeholder token in `.mcp.json`',
      language: 'json',
      badCode: `// Anti-pattern: placeholder credential in the project config.
{
  "github": {
    "env": { "GITHUB_TOKEN": "ghp_REPLACE_ME_LOCALLY" }
  }
}
// Devs are supposed to override locally, but some forget, and the placeholder
// gets mistaken for a real credential during reviews.`,
      failureMode:
        'Placeholders look like real credentials, leak into screenshots and code review ' +
        'comments, and rely on a fragile override mechanism. `${ENV_VAR}` expansion is ' +
        'the idiomatic, version-controlled, secret-free shape.',
    },
    quizQuestionRefs: [{ sectionId: 's3', questionId: 4 }],
  },

  // -----------------------------------------------------------------------
  // Task 2.5 — Built-in tools
  // -----------------------------------------------------------------------
  {
    id: 'builtin-tools',
    title: 'Built-in tools — Read / Write / Edit / Bash / Grep / Glob',
    summary:
      'Grep searches file CONTENT (function names, error messages, import statements). ' +
      'Glob matches file PATHS by pattern. Edit makes targeted modifications using ' +
      'unique-text anchoring — when the anchor isn\'t unique, fall back to Read + Write. ' +
      'Building codebase understanding incrementally (Grep → Read → trace) beats reading ' +
      'every file up front.',
    source: '(built-in)',
    language: 'ts',
    codeSnippet: `// Selection rules of thumb:

//   Grep   → content search across many files
Grep({ pattern: 'export function processRefund', glob: 'src/**/*.ts' });

//   Glob   → name/path pattern matching, no content
Glob({ pattern: '**/*.test.tsx' });

//   Read   → load full file contents
Read({ file_path: '/abs/path/file.ts' });

//   Edit   → targeted change anchored on UNIQUE text
Edit({
  file_path: '/abs/path/auth.ts',
  old_string: 'const TIMEOUT = 5_000;',
  new_string: 'const TIMEOUT = 10_000;',
});
// If old_string is not unique → Edit fails. Fall back to Read + Write.

// Incremental understanding:
//   1. Grep for the entry point or symbol of interest.
//   2. Read the file the entry point lives in.
//   3. Follow imports — repeat 1-2 only for files actually referenced.
// Beats reading 50 files speculatively.`,
    taskRef: '2.5',
    type: 'tooling',
    tags: ['Grep', 'Glob', 'Read', 'Write', 'Edit', 'codebase-traversal'],
    related: ['granular-tools', 'tool-distribution', 'task-decomposition'],
    antiPattern: {
      title: 'Reading the whole codebase before exploring',
      language: 'ts',
      badCode: `// Anti-pattern: speculative breadth-first read of every file.
const all = await Glob({ pattern: 'src/**/*.ts' });
for (const f of all.files) await Read({ file_path: f });
// Burns the context window on files that turn out to be irrelevant.`,
      failureMode:
        'Fills the context window with files that may be unrelated to the actual task. ' +
        'Grep + Read on the referenced subset is more reliable and far cheaper.',
    },
  },
];
