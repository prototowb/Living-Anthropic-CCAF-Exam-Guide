import type { Lesson } from './types';

// v0.1 ships 6 lessons: 2 reorder, 1 blanks, 2 mcq, 1 flow-builder. Mix of S1 + S2.

export const lessons: Lesson[] = [
  {
    id: 'l-s1-reorder-turn',
    title: 'A single Claude Code turn, in order',
    summary: 'Put the steps of one Claude Code turn back in the right order.',
    stageId: 's1',
    rung: 'B',
    format: 'reorder',
    steps: [
      {
        id: 'read-claude-md',
        label: 'Claude reads CLAUDE.md',
        rationale: 'CLAUDE.md is loaded before the model sees your prompt.',
      },
      {
        id: 'receive-prompt',
        label: 'Claude receives your prompt',
        rationale: 'The text you typed enters the conversation as a user message.',
      },
      {
        id: 'think',
        label: 'Claude reasons about what to do',
        rationale: 'Sometimes visibly (plan mode); always implicitly.',
      },
      {
        id: 'tool-call',
        label: 'Claude calls a tool (e.g., Read or Edit)',
        rationale: 'Tools are how Claude observes and changes your project.',
      },
      {
        id: 'permission-prompt',
        label: 'You see a permission prompt the first time',
        rationale: 'Each new tool invocation is gated until you approve it.',
      },
      {
        id: 'return-answer',
        label: 'Claude returns an answer or a proposed change',
        rationale: 'Nothing has happened to your files unless you accepted an edit.',
      },
    ],
  },
  {
    id: 'l-s1-mcq-exit',
    title: 'Exiting a Claude Code session',
    summary: 'Which keypress ends the session cleanly?',
    stageId: 's1',
    rung: 'B',
    format: 'mcq',
    question: 'Which of these ends a Claude Code session cleanly?',
    options: [
      { letter: 'A', text: 'Ctrl+C' },
      { letter: 'B', text: '/exit (or Ctrl+D)' },
      { letter: 'C', text: 'Close the terminal window' },
      { letter: 'D', text: 'Type "bye"' },
    ],
    correct: 'B',
    explanation:
      'Ctrl+D and /exit both end the REPL cleanly. Ctrl+C interrupts a running tool call but does not end the session. Closing the terminal works but is abrupt.',
  },
  {
    id: 'l-s1-flow-first-session',
    title: 'Compose a first session',
    summary: 'Drag the cards into the order a first session would run in.',
    stageId: 's1',
    rung: 'B',
    format: 'flow-builder',
    cards: [
      { id: 'open-terminal', label: 'Open a terminal in your project' },
      { id: 'run-claude', label: 'Run `claude`' },
      { id: 'first-prompt', label: 'Type your first question' },
      { id: 'approve-tool', label: 'Approve the first permission prompt' },
      { id: 'accept-edit', label: 'Accept the proposed edit (or not)' },
      { id: 'exit', label: 'Type `/exit` when done' },
    ],
    canonical: [
      'open-terminal',
      'run-claude',
      'first-prompt',
      'approve-tool',
      'accept-edit',
      'exit',
    ],
    rationale:
      'Every Claude Code session follows this skeleton. Once it feels routine, all of the harder concepts (plan mode, slash commands, skills) slot into the middle of this flow.',
  },
  {
    id: 'l-s2-blanks-headless',
    title: 'Headless command — fill in the blanks',
    summary: 'Complete the command that gets one-shot JSON output.',
    stageId: 's2',
    rung: 'I',
    format: 'blanks',
    prompt: 'claude {0} "summarise this repo" --output-format {1}',
    blanks: [
      {
        options: ['-p', '--print', '--quiet', '--prompt'],
        correctIndex: 0,
        explanation: '`-p` (short for `--print`) is the one-shot prompt flag.',
      },
      {
        options: ['text', 'json', 'yaml', 'tsv'],
        correctIndex: 1,
        explanation:
          '`json` returns a parseable structured result you can pipe through `jq`.',
      },
    ],
  },
  {
    id: 'l-s2-mcq-modes',
    title: 'Permission modes',
    summary: 'Which mode is not a real Claude Code permission mode?',
    stageId: 's2',
    rung: 'B',
    format: 'mcq',
    question: 'Which of these is **not** a real Claude Code permission mode?',
    options: [
      { letter: 'A', text: 'default' },
      { letter: 'B', text: 'acceptEdits' },
      { letter: 'C', text: 'plan' },
      { letter: 'D', text: 'autoMerge' },
    ],
    correct: 'D',
    explanation:
      '`autoMerge` is not a Claude Code permission mode. The four real ones are `default`, `acceptEdits`, `plan`, and `yolo`.',
  },
  {
    id: 'l-s2-reorder-add-cmd',
    title: 'Add a custom slash command',
    summary: 'Reorder the steps to add and use a custom slash command.',
    stageId: 's2',
    rung: 'I',
    format: 'reorder',
    steps: [
      {
        id: 'create-dir',
        label: 'Create `.claude/commands/` in your project',
        rationale: 'This is the canonical location Claude Code scans.',
      },
      {
        id: 'write-file',
        label: 'Write `.claude/commands/refactor.md` with your prompt body',
        rationale: 'The filename becomes the slash command name.',
      },
      {
        id: 'restart',
        label: 'Restart Claude (or the command shows on next session)',
        rationale: 'New commands are registered when Claude scans the directory.',
      },
      {
        id: 'invoke',
        label: 'Type `/refactor` in the REPL',
        rationale: 'Claude expands the file body as your prompt.',
      },
    ],
  },
];

export function getLessonById(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}

export function getLessonsForStage(stageId: string): Lesson[] {
  return lessons.filter((l) => l.stageId === stageId);
}

// Re-exported so the helpBot getLesson tool can type its return.
export type { Lesson };
