// Curated Claude Code documentation links — used by the Help Bot's
// `escalateToDocs` tool (Architect Scenario 1 v0.3) when it gives up resolving
// a question in-app and falls through to the canonical docs.
//
// Architect Scenario 1 / TS 5.2 mandate: every escalation path must terminate
// at a *named* resource, not a generic "open the docs" gesture. This registry
// is the named-resource table.
//
// Pure data — no imports from stores or agents (data CLAUDE.md rule 1).

export interface DocLink {
  /** Lower-case canonical topic keyword. */
  topic: string;
  /** Public URL. Real Claude Code docs are served from code.claude.com/docs/en. */
  url: string;
  /** Human-readable title for the chip / button label. */
  title: string;
  /** Optional synonyms — alternative phrasings that map to the same doc. */
  aliases?: readonly string[];
}

const FALLBACK: DocLink = {
  topic: 'overview',
  url: 'https://code.claude.com/docs/en',
  title: 'Claude Code — Overview',
};

export const DOCS_REGISTRY: readonly DocLink[] = [
  {
    topic: 'permission',
    url: 'https://code.claude.com/docs/en/permissions',
    title: 'Permission modes & approval prompts',
    aliases: ['permissions', 'approve', 'allow', 'deny', 'permission mode'],
  },
  {
    topic: 'claude.md',
    url: 'https://code.claude.com/docs/en/memory',
    title: 'CLAUDE.md & project memory',
    aliases: ['memory', 'claude md', 'project rules', 'context file'],
  },
  {
    topic: 'slash commands',
    url: 'https://code.claude.com/docs/en/slash-commands',
    title: 'Slash commands',
    aliases: ['slash command', 'command', '/command', 'custom command'],
  },
  {
    topic: 'skills',
    url: 'https://code.claude.com/docs/en/skills',
    title: 'Skills',
    aliases: ['skill', 'agent skill'],
  },
  {
    topic: 'plan mode',
    url: 'https://code.claude.com/docs/en/plan-mode',
    title: 'Plan mode',
    aliases: ['planning', 'plan'],
  },
  {
    topic: 'subagents',
    url: 'https://code.claude.com/docs/en/subagents',
    title: 'Subagents & the Task tool',
    aliases: ['subagent', 'task tool', 'delegation', 'parallel agents'],
  },
  {
    topic: 'headless',
    url: 'https://code.claude.com/docs/en/headless',
    title: 'Headless mode & scripting',
    aliases: ['scripting', 'automate', '-p flag', 'one-shot', 'ci'],
  },
  {
    topic: 'mcp',
    url: 'https://code.claude.com/docs/en/mcp',
    title: 'Model Context Protocol (MCP)',
    aliases: ['mcp server', 'mcp servers', 'model context protocol'],
  },
  {
    topic: 'hooks',
    url: 'https://code.claude.com/docs/en/hooks',
    title: 'Hooks',
    aliases: ['hook', 'pre tool use', 'post tool use', 'stop hook'],
  },
  {
    topic: 'getting started',
    url: 'https://code.claude.com/docs/en/quickstart',
    title: 'Quickstart',
    aliases: ['start', 'begin', 'first session', 'install', 'setup'],
  },
  {
    topic: 'settings',
    url: 'https://code.claude.com/docs/en/settings',
    title: 'settings.json reference',
    aliases: ['settings.json', '.claude/settings', 'configuration'],
  },
];

/**
 * Resolve a free-text topic to a curated doc link. Lower-cases the query,
 * checks topic + aliases for substring containment. Falls back to the
 * generic overview link rather than failing — escalation must always resolve.
 */
export function resolveDocLink(topic: string): DocLink {
  const q = (topic ?? '').toLowerCase().trim();
  if (!q) return FALLBACK;
  for (const entry of DOCS_REGISTRY) {
    if (q.includes(entry.topic)) return entry;
    if (entry.aliases?.some((a) => q.includes(a))) return entry;
  }
  return FALLBACK;
}
