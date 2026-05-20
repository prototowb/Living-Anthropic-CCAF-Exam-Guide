import type { Stage } from './types';

// v0.1 ships S1 + S2 as fully authored. S3-S8 are stubs so the index renders.
// Stage bodies are markdown — the StageView renders them through a tiny
// markdown helper (no MD library needed for this scope).

const S1_BODY = `# Your first session

Claude Code is a CLI tool. You open a terminal in your project directory and run \`claude\`. From that prompt you can ask questions, request edits, or hand over a task — and Claude can read your files, run tests, search the codebase, and propose changes. Nothing happens to your files until you accept.

## What just happened?

When you type a prompt, Claude:
1. **Reads context** from your CLAUDE.md (if you have one) and any files mentioned in your prompt.
2. **Thinks** about what to do — sometimes proposing a plan first.
3. **Calls tools** (Read, Edit, Bash, Grep, …) one at a time. The first time it calls a tool in your project, you'll see a **permission prompt**.
4. **Returns** an answer or a proposed change.

You're the human in the loop. Claude does not edit silently.

## The minimum you need to know

- \`claude\` starts the REPL.
- \`/help\` lists the slash commands.
- \`/clear\` wipes the current conversation (useful when starting a fresh task).
- \`/exit\` (or Ctrl+D) ends the session.

## What's next

Stage 2 covers tools and permissions in depth — once you understand those, the rest of Claude Code is just composition.
`;

const S2_BODY = `# Tools & permissions

Claude doesn't have arbitrary access to your machine. It uses a fixed set of **named tools**, and each tool call is gated by your permission settings.

## The built-in tools

- **Read** — read a file's contents.
- **Edit** — change part of a file.
- **Write** — create or overwrite a file.
- **Bash** — run a shell command.
- **Grep** — search file contents.
- **Glob** — list files by pattern.
- **WebFetch** / **WebSearch** — pull from the web.
- **Task** — spawn a subagent (Claude calling Claude).

## The four permission modes

| Mode | What it does |
|---|---|
| \`default\` | Prompts you the first time Claude wants to use a tool in a directory. |
| \`acceptEdits\` | Auto-accepts file edits; still prompts for Bash. |
| \`plan\` | Claude can only Read/Grep/Glob — no edits or shell. Great for unfamiliar repos. |
| \`yolo\` | No prompts. Use only on disposable sandboxes. |

Switch modes with \`Shift+Tab\` while Claude is running, or set the default in \`.claude/settings.json\`.

## Settings

\`.claude/settings.json\` lives in your project. The most common keys:

\`\`\`json
{
  "permissions": {
    "allow": ["Read", "Edit", "Bash(git status)", "Bash(npm test)"],
    "deny": ["Bash(rm *)", "WebFetch"]
  }
}
\`\`\`

Entries can be a tool name (\`"Edit"\`) or a tool name with a specific argument pattern (\`"Bash(npm test)"\`). \`deny\` always wins over \`allow\`.

## The golden rule

When in doubt, use \`plan\` mode. Claude can read but can't break things.
`;

export const stages: Stage[] = [
  {
    id: 's1',
    number: 1,
    title: 'First prompt',
    pitch: 'Open `claude`, type a question, see what happens.',
    anchorQuestion: 'What is Claude Code and what just happened when I typed something?',
    rungs: ['B'],
    body: S1_BODY,
    lessonIds: ['l-s1-reorder-turn', 'l-s1-mcq-exit', 'l-s1-flow-first-session'],
    quizSectionId: 's1',
    sandboxId: 'first-session-repl',
  },
  {
    id: 's2',
    number: 2,
    title: 'Tools & permissions',
    pitch: 'Why Claude pauses to ask, and how to set the rules in `.claude/settings.json`.',
    anchorQuestion: 'Why did Claude ask me before running that command?',
    rungs: ['B', 'I'],
    body: S2_BODY,
    lessonIds: ['l-s2-blanks-headless', 'l-s2-mcq-modes', 'l-s2-reorder-add-cmd'],
    quizSectionId: 's2',
  },
  // Stubs — authored in v0.2+. Listed so the index, atlas, and progress
  // numerator/denominator are correct from v0.1.
  ...stageStub('s3', 3, 'Steering Claude', ['I'], 'How do I get Claude to think before it edits 12 files?'),
  ...stageStub('s4', 4, 'Customising Claude', ['B', 'I'], 'How do I teach Claude my project\'s conventions?'),
  ...stageStub('s5', 5, 'Memory & sessions', ['I'], 'How do I keep Claude on track over a long task?'),
  ...stageStub('s6', 6, 'Delegating', ['I', 'A'], 'When should I let Claude spawn other agents?'),
  ...stageStub('s7', 7, 'Extending', ['I', 'A'], 'How do I plug Claude into the rest of my world?'),
  ...stageStub('s8', 8, 'Beyond the REPL', ['A'], 'How do I use Claude Code without sitting at a terminal?'),
];

function stageStub(
  id: string,
  number: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
  title: string,
  rungs: Stage['rungs'],
  anchorQuestion: string,
): Stage[] {
  return [
    {
      id,
      number,
      title,
      pitch: `Coming in v0.2 — ${anchorQuestion}`,
      anchorQuestion,
      rungs,
      body: `# ${title}\n\n> **Coming in v0.2.** This stage answers: *${anchorQuestion}*`,
      lessonIds: [],
      quizSectionId: id,
    },
  ];
}

export function getStage(id: string): Stage | undefined {
  return stages.find((s) => s.id === id);
}
