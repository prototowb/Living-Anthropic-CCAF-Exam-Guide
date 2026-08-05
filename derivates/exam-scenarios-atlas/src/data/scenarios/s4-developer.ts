import type { Scenario } from '../types'

export const scenario4: Scenario = {
  id: 'developer-productivity',
  number: 4,
  title: 'Developer Productivity with Claude',
  hook: 'Use built-in tools (Read, Write, Bash, Grep, Glob) + MCP servers to explore unfamiliar code without drowning in context.',
  brief:
    'You are building developer productivity tools using the Claude Agent SDK. The agent helps engineers explore unfamiliar codebases, understand legacy systems, generate boilerplate code, and automate repetitive tasks. It uses the built-in tools (Read, Write, Bash, Grep, Glob) and integrates with Model Context Protocol (MCP) servers.',
  primaryDomains: [2, 3, 1],
  example: {
    title: 'A new hire opens a 4-year-old codebase',
    body:
      'New engineer asks "where is rate-limiting enforced?" The naïve approach reads every file under src/. The good approach starts with Grep for "rate limit" / "rateLimit" / "throttle" patterns, follows imports via Read, and ignores the dozens of unrelated files. Less context, sharper answer. MCP servers for Jira and the internal docs add product context without leaving the editor.',
  },
  infographic: {
    kind: 'tool-zoo',
    caption:
      'Built-ins each have a sweet spot. Grep narrows; Glob enumerates; Read loads; Edit modifies; Write replaces; Bash escapes. Add MCP for system-of-record context (Jira, internal docs).',
  },
  flow: [
    {
      label: 'Grep for entry points',
      body: 'Search for the concept across the codebase: "rate.?limit|throttle" via Grep. Cheap, surgical, no token waste.',
      toolCalls: [
        { name: 'Grep', input: '{ "pattern": "rate.?limit|throttle", "type": "ts" }', result: '12 matches in 4 files' },
      ],
      stopReason: 'tool_use',
      mandate: 'TS 2.5 · Grep is the entry point for content discovery.',
    },
    {
      label: 'Read the suspects',
      body: 'Read only the candidate files to follow the call graph — not the entire src/ tree.',
      toolCalls: [
        { name: 'Read', input: '{ "file_path": "src/middleware/rateLimit.ts" }', result: '(file contents)' },
      ],
      stopReason: 'tool_use',
      mandate: 'TS 2.5 · Read follows imports, doesn\'t replace exploration.',
    },
    {
      label: 'Glob to enumerate when names matter',
      body: 'Find all migrations: Glob "**/migrations/*.sql". Used when path patterns matter more than content.',
      toolCalls: [
        { name: 'Glob', input: '{ "pattern": "**/migrations/*.sql" }', result: '47 files' },
      ],
      stopReason: 'tool_use',
    },
    {
      label: 'MCP server adds context',
      body: 'Project-scoped .mcp.json declares the Jira and internal-docs MCP servers. Tools become available alongside built-ins. ${JIRA_TOKEN} is expanded at startup — no secrets in the repo.',
      toolCalls: [
        { name: 'mcp__jira__get_issue', input: '{ "key": "PLAT-2241" }', result: '(linked ticket context)' },
      ],
      stopReason: 'tool_use',
      mandate: 'TS 2.4 · Project-scoped .mcp.json with env-var expansion.',
    },
    {
      label: 'Edit failed? Fall back to Read + Write',
      body: 'Edit relies on unique-text anchors. When two locations match, Edit refuses. Fall back to Read full file, modify in memory, Write it back.',
      mandate: 'TS 2.5 · Read + Write as Edit fallback.',
    },
    {
      label: 'Synthesise: 1-page map of rate-limiting',
      body: 'Final reply names the middleware, where it\'s mounted, the per-route exceptions, the testing fixtures. 5-minute answer instead of an afternoon.',
      stopReason: 'end_turn',
    },
  ],
  code: [
    {
      lang: 'jsonc',
      label: '.mcp.json (project-scoped, env-var expansion)',
      body: `{
  "mcpServers": {
    "jira": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-jira"],
      "env": {
        "JIRA_BASE_URL": "https://acme.atlassian.net",
        "JIRA_EMAIL":    "\${JIRA_EMAIL}",
        "JIRA_TOKEN":    "\${JIRA_TOKEN}"
      }
    },
    "internal-docs": {
      "command": "node",
      "args": ["./tools/mcp-internal-docs/server.js"]
    }
  }
}`,
    },
    {
      lang: 'ts',
      label: 'Targeted exploration script',
      body: `// Anti-pattern: read every file under src/
// for (const f of await fs.readdir("src", { recursive: true })) await read(f);

// Good: narrow with Grep, follow with Read.
const hits = await grep({ pattern: /rate.?limit|throttle/i, type: "ts" });
const filesToRead = unique(hits.map((h) => h.path)).slice(0, 8);
for (const f of filesToRead) await read({ file_path: f });

// When you need every file by name pattern (not content), Glob:
const migrations = await glob({ pattern: "**/migrations/*.sql" });`,
    },
    {
      lang: 'md',
      label: 'MCP tool description (good)',
      body: `<!-- This goes in the MCP server's tool registration -->
{
  "name": "search_docs",
  "description":
    "Searches the internal engineering wiki. Use for product or process questions (e.g., 'what's our rollback policy?', 'how do we onboard a new service?'). Returns top 5 matches with title, URL, and 200-char snippet. Prefer this over web search for ACME-specific topics.",
  "inputSchema": { "type": "object", "properties": { "query": { "type": "string" } }, "required": ["query"] }
}`,
    },
  ],
  qna: [
    {
      q: 'An engineer asks the agent "where is rate-limiting enforced in this codebase?". Which built-in-tool strategy gives the fastest, most context-efficient answer?',
      options: [
        { key: 'A', text: 'Use Read on every file under src/ to build a complete mental model of the codebase before answering.' },
        { key: 'B', text: 'Use Grep to find call sites of rate-limit-related patterns (e.g., /rate.?limit|throttle/i), then Read only the candidate files.' },
        { key: 'C', text: 'Use Glob to enumerate every .ts file, then ask the engineer to narrow the scope themselves.' },
        { key: 'D', text: 'Use Bash with grep -r and pipe through head to keep the output small.' },
      ],
      correct: 'B',
      explain:
        'Grep is the right entry point for content discovery — it narrows the candidate set, then Read follows imports and call sites. A floods context unnecessarily. C just punts back to the user. D works but uses an external shell tool when the built-in Grep is purpose-built and already integrated with Claude Code\'s permission and output-size handling.',
      ref: 'TS 2.5',
    },
    {
      q: 'Your team uses a custom MCP server for an internal documentation system, plus the standard Jira MCP server. The Jira server needs an API token. Where should you configure these so every team member gets both, with credentials not committed to the repo?',
      options: [
        { key: 'A', text: 'Put both servers in ~/.claude.json on each developer\'s machine and hard-code the token.' },
        { key: 'B', text: 'Put both servers in a project-scoped .mcp.json with env-var expansion (e.g., ${JIRA_TOKEN}) for credentials.' },
        { key: 'C', text: 'Put the docs server in .mcp.json and the Jira server in each user\'s ~/.claude.json.' },
        { key: 'D', text: 'Put both in .mcp.json and check the Jira token into the repo as an encrypted string.' },
      ],
      correct: 'B',
      explain:
        'Project-scoped .mcp.json shares the server configuration with the team via version control; environment-variable expansion (${JIRA_TOKEN}) keeps the secret out of the repo, with each developer providing the value via their shell env. A scatters configuration and leaks secrets. C unnecessarily splits servers across scopes. D encrypts a secret into the repo, adding key-management complexity for no benefit.',
      ref: 'TS 2.4',
    },
    {
      q: 'An engineer adds a new MCP tool called search_docs to your team\'s server. The tool works in isolation but the agent rarely uses it, preferring built-in Grep across the local repo instead. Inspection shows the tool description reads: "Search documentation." What is the most effective fix?',
      options: [
        { key: 'A', text: 'Set tool_choice: "any" so the model is forced to call a tool rather than think out loud.' },
        { key: 'B', text: 'Restrict the built-in Grep tool from the agent so it has no alternative.' },
        { key: 'C', text: 'Expand the MCP tool description to explain what it searches, when to prefer it over built-ins, example queries, and output shape.' },
        { key: 'D', text: 'Add an alias for the tool with a more descriptive name and keep the description as is.' },
      ],
      correct: 'C',
      explain:
        'Tool descriptions are how the model decides what to call. A vague one ("Search documentation") loses to a built-in with a clear purpose. Expanding the description with scope, comparison-to-built-ins, examples, and output shape is the high-leverage fix. A and B coerce a tool call without addressing the underlying selection problem. D treats a symptom (name) while the cause (description) remains.',
      ref: 'TS 2.4',
    },
  ],
  takeaways: [
    'Grep for content, Glob for filenames, Read for context, Edit/Write for modification, Bash for everything else.',
    'MCP tool quality lives in the description — make it specific enough that the model picks it over built-ins.',
    'Project .mcp.json shares servers with the team; env-var expansion keeps secrets out of the repo.',
  ],
}
