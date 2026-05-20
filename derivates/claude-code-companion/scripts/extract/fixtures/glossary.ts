// Glossary fixture — the canonical extraction the fixture adapter returns
// for `sourceId: "glossary"`. Mirrors `docs/extraction-sources/glossary.md`
// but as the typed structured output the pipeline expects (without _provenance
// — the adapter attaches that at extract time).

interface GlossaryFixtureEntry {
  term: string;
  definition: string;
  aliases?: string[];
  stageId?: string;
  rung: 'B' | 'I' | 'A';
}

export const glossaryFixture: GlossaryFixtureEntry[] = [
  {
    term: 'CLAUDE.md',
    definition:
      'A markdown file at the root of your project that tells Claude Code your conventions — your package manager, your test command, which files to leave alone. Claude reads it at session start. A `CLAUDE.md` inside a subdirectory overrides the root file for work in that area.',
    rung: 'B',
    stageId: 's4',
  },
  {
    term: 'Permission prompt',
    definition:
      'The dialog Claude Code shows the first time it wants to use a tool in your project. Read, Edit, Bash, Write — each is gated. Answer once and your choice persists for the session.',
    rung: 'B',
    stageId: 's2',
  },
  {
    term: 'Plan mode',
    definition:
      'A permission mode that lets Claude only read and search the codebase — no edits or shell. Toggle with Shift+Tab. Good for scoping a multi-file change before touching anything.',
    aliases: ['plan', 'plan-mode'],
    rung: 'I',
    stageId: 's3',
  },
  {
    term: 'Slash command',
    definition:
      'A reusable prompt you invoke with /<name> in the Claude Code REPL. Built-ins include /clear, /compact, /resume, /help. Drop a markdown file in .claude/commands/<name>.md and the filename becomes the command.',
    rung: 'B',
    stageId: 's4',
  },
  {
    term: 'Skill',
    definition:
      "A bundle of a prompt with files Claude reaches for in a specific situation. Lives in .claude/skills/<name>/SKILL.md with a description that tells Claude when to invoke it. Use skills when you want Claude to follow a workflow without you re-explaining it each time.",
    rung: 'I',
    stageId: 's4',
  },
  {
    term: 'Headless mode',
    definition:
      'Running Claude Code without the REPL — one prompt, one response. `claude -p "your prompt" --output-format json` returns a parseable structured result you can pipe through jq in a shell script or CI step.',
    rung: 'A',
    stageId: 's8',
  },
  {
    term: 'Subagent',
    definition:
      'A separate Claude session Claude itself spawns via the Task tool. Useful for parallel research ("explore three directories at once") or for keeping the main thread\'s context window clean. You see a "Running Task" indicator while a subagent works.',
    rung: 'I',
    stageId: 's6',
  },
];
