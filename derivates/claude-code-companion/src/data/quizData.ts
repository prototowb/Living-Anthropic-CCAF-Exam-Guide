import type { QuizSection } from './types';

export const quizSections: QuizSection[] = [
  {
    id: 's1',
    title: 'S1 — First prompt',
    stageId: 's1',
    questions: [
      {
        id: 1,
        text: 'What command launches Claude Code in your terminal?',
        options: [
          { letter: 'A', text: 'anthropic' },
          { letter: 'B', text: 'claude' },
          { letter: 'C', text: 'cc' },
          { letter: 'D', text: 'claude-code' },
        ],
        correct: 'B',
        explanation:
          'The CLI is invoked as `claude`. The package is published under `@anthropic-ai/claude-code` but the executable name is just `claude`.',
        stageId: 's1',
        rung: 'B',
      },
      {
        id: 2,
        text: 'On the first turn of a session, what does Claude read before responding?',
        options: [
          { letter: 'A', text: 'Every file in your repo' },
          { letter: 'B', text: 'Your CLAUDE.md (if present) and any files you mention' },
          { letter: 'C', text: 'Just your prompt — nothing else' },
          { letter: 'D', text: 'Your shell history' },
        ],
        correct: 'B',
        explanation:
          'CLAUDE.md is loaded automatically. Other files enter context only if Claude calls Read on them.',
        stageId: 's1',
        rung: 'B',
      },
      {
        id: 3,
        text: 'How do you exit a Claude Code session cleanly?',
        options: [
          { letter: 'A', text: 'Ctrl+C twice' },
          { letter: 'B', text: 'kill -9 the process' },
          { letter: 'C', text: '/exit or Ctrl+D' },
          { letter: 'D', text: 'There is no exit — close the terminal' },
        ],
        correct: 'C',
        explanation: 'Both work. Ctrl+C interrupts a running tool but does not exit.',
        stageId: 's1',
        rung: 'B',
      },
      {
        id: 4,
        text: 'What happens the first time Claude wants to edit a file in your project?',
        options: [
          { letter: 'A', text: 'It edits silently' },
          { letter: 'B', text: 'You see a permission prompt and must approve' },
          { letter: 'C', text: 'Claude refuses and asks you to do it' },
          { letter: 'D', text: 'A backup is created automatically and the edit lands' },
        ],
        correct: 'B',
        explanation:
          'Each new tool use requires explicit approval the first time. You can choose "always allow" to skip future prompts.',
        stageId: 's1',
        rung: 'B',
      },
      {
        id: 5,
        text: 'What does `/clear` do?',
        options: [
          { letter: 'A', text: 'Deletes your CLAUDE.md' },
          { letter: 'B', text: 'Clears the terminal screen only' },
          { letter: 'C', text: 'Wipes the current conversation context' },
          { letter: 'D', text: 'Resets your settings.json' },
        ],
        correct: 'C',
        explanation:
          '`/clear` resets the in-memory conversation. It does not touch any files. Use it when switching tasks within one session.',
        stageId: 's1',
        rung: 'B',
      },
      {
        id: 6,
        text: 'Where do you put repo-wide instructions for Claude?',
        options: [
          { letter: 'A', text: '.claude/instructions' },
          { letter: 'B', text: 'CLAUDE.md at the repo root' },
          { letter: 'C', text: 'README.md' },
          { letter: 'D', text: 'package.json under a `claude` key' },
        ],
        correct: 'B',
        explanation:
          'Root CLAUDE.md is the canonical place. Subdirectory CLAUDE.md files extend or override for that area.',
        stageId: 's1',
        rung: 'B',
      },
      {
        id: 7,
        text: 'You launch Claude in `~/projects/foo`. Which directory does Claude treat as the working directory?',
        options: [
          { letter: 'A', text: '`~/projects` (parent)' },
          { letter: 'B', text: 'Your home directory `~`' },
          { letter: 'C', text: 'The directory you ran `claude` in (`~/projects/foo`)' },
          { letter: 'D', text: 'Wherever your CLAUDE.md lives' },
        ],
        correct: 'C',
        explanation:
          'Claude inherits the cwd from your shell. All Read/Edit/Bash calls resolve relative to it.',
        stageId: 's1',
        rung: 'B',
      },
      {
        id: 8,
        text: 'Which slash command lists the others?',
        options: [
          { letter: 'A', text: '/list' },
          { letter: 'B', text: '/help' },
          { letter: 'C', text: '/commands' },
          { letter: 'D', text: 'Just press Tab' },
        ],
        correct: 'B',
        explanation: '`/help` lists the built-ins. Typing `/` also opens an autocomplete menu.',
        stageId: 's1',
        rung: 'B',
      },
      {
        id: 9,
        text: 'You want Claude to research a refactor across 12 files before touching anything. The best first move is:',
        options: [
          { letter: 'A', text: 'Switch permission mode to `yolo`' },
          { letter: 'B', text: 'Enter plan mode (Shift+Tab)' },
          { letter: 'C', text: 'Run `/clear` first' },
          { letter: 'D', text: 'Open a new session in each file' },
        ],
        correct: 'B',
        explanation:
          'Plan mode lets Claude Read/Grep/Glob freely while preventing edits. Perfect for scoping a multi-file change.',
        stageId: 's1',
        rung: 'I',
      },
      {
        id: 10,
        text: 'After accepting an edit, what is the safest immediate next step?',
        options: [
          { letter: 'A', text: 'Ask Claude to git push' },
          { letter: 'B', text: 'Read the diff, run the relevant tests' },
          { letter: 'C', text: 'Run `/clear` to free up context' },
          { letter: 'D', text: 'Trust it — the model usually gets it right' },
        ],
        correct: 'B',
        explanation:
          'Inspect the change and verify behaviour. Claude is good but not infallible, and the cost of catching a regression now beats catching it after a push.',
        stageId: 's1',
        rung: 'B',
      },
    ],
  },
  {
    id: 's2',
    title: 'S2 — Tools & permissions',
    stageId: 's2',
    questions: [
      {
        id: 11,
        text: 'Which of the following is **not** a Claude Code permission mode?',
        options: [
          { letter: 'A', text: 'default' },
          { letter: 'B', text: 'acceptEdits' },
          { letter: 'C', text: 'plan' },
          { letter: 'D', text: 'autoMerge' },
        ],
        correct: 'D',
        explanation:
          'The four modes are `default`, `acceptEdits`, `plan`, and `yolo`. `autoMerge` is a distractor.',
        stageId: 's2',
        rung: 'B',
      },
      {
        id: 12,
        text: 'Where do per-project permissions live?',
        options: [
          { letter: 'A', text: '`~/.claude.json`' },
          { letter: 'B', text: '`.claude/settings.json` at the repo root' },
          { letter: 'C', text: 'Environment variables' },
          { letter: 'D', text: 'They cannot be persisted — every session asks again' },
        ],
        correct: 'B',
        explanation:
          '`.claude/settings.json` is committed and shared with the team. `~/.claude.json` is for personal credentials only.',
        stageId: 's2',
        rung: 'I',
      },
      {
        id: 13,
        text: 'Which tool reads a file?',
        options: [
          { letter: 'A', text: 'Read' },
          { letter: 'B', text: 'Bash(cat)' },
          { letter: 'C', text: 'Both — but Claude should prefer Read' },
          { letter: 'D', text: 'Fetch' },
        ],
        correct: 'C',
        explanation:
          '`Bash(cat …)` technically works but is slower and noisier. `Read` is the right tool — Claude is steered to prefer it.',
        stageId: 's2',
        rung: 'B',
      },
      {
        id: 14,
        text: 'Which tool runs a shell command?',
        options: [
          { letter: 'A', text: 'Run' },
          { letter: 'B', text: 'Exec' },
          { letter: 'C', text: 'Bash' },
          { letter: 'D', text: 'Shell' },
        ],
        correct: 'C',
        explanation: 'Bash is the canonical name in Claude Code.',
        stageId: 's2',
        rung: 'B',
      },
      {
        id: 15,
        text: 'You add `"Bash(rm *)": "deny"` to your settings. What happens when Claude tries `rm temp.log`?',
        options: [
          { letter: 'A', text: 'It runs — the wildcard does not match a specific file' },
          { letter: 'B', text: 'It is denied — the pattern matches and deny always wins' },
          { letter: 'C', text: 'It prompts you to override' },
          { letter: 'D', text: 'Claude switches to plan mode automatically' },
        ],
        correct: 'B',
        explanation:
          'Pattern matching is lexical on the full command. `deny` overrides any `allow`, so the call is blocked.',
        stageId: 's2',
        rung: 'I',
      },
      {
        id: 16,
        text: 'Which tool fetches a URL?',
        options: [
          { letter: 'A', text: 'Curl' },
          { letter: 'B', text: 'WebFetch' },
          { letter: 'C', text: 'HttpGet' },
          { letter: 'D', text: 'Bash(curl)' },
        ],
        correct: 'B',
        explanation:
          '`WebFetch` is the built-in. Claude can also use `Bash(curl …)` if WebFetch is denied, but WebFetch is the right tool.',
        stageId: 's2',
        rung: 'B',
      },
      {
        id: 17,
        text: 'What is the practical difference between Edit and Write?',
        options: [
          { letter: 'A', text: 'No difference; they are aliases' },
          { letter: 'B', text: 'Edit changes part of an existing file; Write creates or overwrites the whole thing' },
          { letter: 'C', text: 'Edit needs the file to exist; Write needs the directory to exist' },
          { letter: 'D', text: 'Both B and C' },
        ],
        correct: 'D',
        explanation:
          'Both characterisations are true. Edit is targeted; Write replaces.',
        stageId: 's2',
        rung: 'I',
      },
      {
        id: 18,
        text: 'Which permission mode disables every permission prompt?',
        options: [
          { letter: 'A', text: 'default' },
          { letter: 'B', text: 'plan' },
          { letter: 'C', text: 'acceptEdits' },
          { letter: 'D', text: 'yolo' },
        ],
        correct: 'D',
        explanation:
          '`yolo` accepts every tool call without asking. Use only on disposable sandboxes.',
        stageId: 's2',
        rung: 'I',
      },
      {
        id: 19,
        text: 'Plan mode allows which of these?',
        options: [
          { letter: 'A', text: 'Read, Grep, Glob' },
          { letter: 'B', text: 'Read and Edit' },
          { letter: 'C', text: 'Everything except Bash' },
          { letter: 'D', text: 'Nothing — it just talks' },
        ],
        correct: 'A',
        explanation:
          'Plan mode permits reading and searching but no edits or shell. Claude proposes a plan you can then approve.',
        stageId: 's2',
        rung: 'I',
      },
      {
        id: 20,
        text: 'What does Glob do?',
        options: [
          { letter: 'A', text: 'Searches file contents' },
          { letter: 'B', text: 'Lists files matching a pattern' },
          { letter: 'C', text: 'Fetches a URL' },
          { letter: 'D', text: 'Joins multiple files into one' },
        ],
        correct: 'B',
        explanation:
          'Glob is filename pattern matching (e.g., `src/**/*.ts`). For content search, use Grep.',
        stageId: 's2',
        rung: 'B',
      },
    ],
  },
];

export function getQuizSection(id: string) {
  return quizSections.find((s) => s.id === id);
}

export function getAllQuestions() {
  return quizSections.flatMap((s) => s.questions);
}
