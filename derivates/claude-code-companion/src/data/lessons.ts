import type { Lesson } from './types';

// v0.1 shipped 6 lessons (S1 + S2). v0.2 appends S3 + S4 + S5 lessons —
// 6 per stage, mixing the four formats.

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

  // ---------- S3 — Steering Claude ----------
  {
    id: 'l-s3-mcq-plan-mode-tools',
    title: 'What plan mode lets Claude do',
    summary: 'Which built-in tool keeps working while plan mode is active?',
    stageId: 's3',
    rung: 'B',
    format: 'mcq',
    question: 'In plan mode, which built-in tool can Claude still call?',
    options: [
      { letter: 'A', text: 'Edit' },
      { letter: 'B', text: 'Read' },
      { letter: 'C', text: 'Bash' },
      { letter: 'D', text: 'Write' },
    ],
    correct: 'B',
    explanation:
      'Plan mode permits Read, Grep, Glob, and Task (subagents inherit the mode). It blocks every tool that writes — Edit, Write, Bash.',
  },
  {
    id: 'l-s3-blanks-enter-plan',
    title: 'Entering plan mode',
    summary: 'Complete the keystroke and the settings.json key.',
    stageId: 's3',
    rung: 'B',
    format: 'blanks',
    prompt:
      'Press {0} while Claude is running to cycle into plan mode. To make plan mode the default at session start, set `permissionMode: {1}` in `.claude/settings.json`.',
    blanks: [
      {
        options: ['Shift+Tab', 'Ctrl+C', 'Esc', 'Tab'],
        correctIndex: 0,
        explanation: 'Shift+Tab cycles through the permission modes in the running REPL.',
      },
      {
        options: [`'plan'`, `'default'`, `'yolo'`, `'safe'`],
        correctIndex: 0,
        explanation:
          'The string `\'plan\'` selects plan mode at session start. Other valid values: `\'default\'`, `\'acceptEdits\'`, `\'yolo\'`.',
      },
    ],
  },
  {
    id: 'l-s3-mcq-when-rescope',
    title: 'When to stop and rescope',
    summary: 'Claude proposes a plan that branches into unrelated work. What now?',
    stageId: 's3',
    rung: 'I',
    format: 'mcq',
    question:
      'Claude\'s plan covers the rename you asked for, **also** rewrites three unrelated helpers, **also** adds a new test file. What should you do?',
    options: [
      { letter: 'A', text: 'Accept the plan — Claude usually knows best' },
      { letter: 'B', text: 'Approve step 1, reject the rest' },
      { letter: 'C', text: 'Exit plan mode, sharpen the prompt, re-plan' },
      { letter: 'D', text: 'Ask Claude to elaborate the helper rewrites' },
    ],
    correct: 'C',
    explanation:
      'A sprawling plan is a signal the prompt was vague. The fix is upstream — narrow the scope ("only `lib/parser.ts`"). Re-prompting costs seconds; reviewing unrelated edits costs hours.',
  },
  {
    id: 'l-s3-flow-big-task',
    title: 'The big-task workflow',
    summary: 'Drag the cards into the order you\'d follow for a multi-file change.',
    stageId: 's3',
    rung: 'I',
    format: 'flow-builder',
    cards: [
      { id: 'write-prompt', label: 'Write a scoped prompt' },
      { id: 'plan-shown', label: 'Claude returns a plan' },
      { id: 'review-plan', label: 'Read each step' },
      { id: 'exit-plan-mode', label: 'Exit plan mode (Shift+Tab)' },
      { id: 'apply', label: 'Approve as Claude applies the plan' },
      { id: 'verify', label: 'Confirm with tests or a diff read' },
    ],
    canonical: [
      'write-prompt',
      'plan-shown',
      'review-plan',
      'exit-plan-mode',
      'apply',
      'verify',
    ],
    rationale:
      'You read before Claude writes. The plan is the contract — if it looks right, you exit plan mode and let Claude apply it. Verification closes the loop.',
  },
  {
    id: 'l-s3-reorder-shrink-plan',
    title: 'Shrink a sprawling plan',
    summary: 'Order the moves that turn a 14-file plan into a focused one.',
    stageId: 's3',
    rung: 'I',
    format: 'reorder',
    steps: [
      {
        id: 'see-bloat',
        label: 'Notice the plan branches into work you didn\'t ask for',
        rationale: 'Scope creep usually wears the words "and also" or "while I\'m here."',
      },
      {
        id: 'stop',
        label: 'Don\'t approve — exit plan mode',
        rationale: 'Re-prompting from inside a bloated plan is messier than starting clean.',
      },
      {
        id: 'narrow-prompt',
        label: 'Re-prompt with explicit file boundaries',
        rationale: 'Name the files: "Only touch `src/foo.ts` and its test. Leave everything else."',
      },
      {
        id: 'replan',
        label: 'Claude returns a tighter plan',
        rationale: 'A narrower prompt yields a narrower plan in one or two steps.',
      },
      {
        id: 'review-replan',
        label: 'Confirm the scope is back in line',
        rationale: 'If it still branches, narrow further. Two rounds is normal.',
      },
      {
        id: 'approve',
        label: 'Exit plan mode, apply the change',
        rationale: 'A scoped plan is a confident ship.',
      },
    ],
  },
  {
    id: 'l-s3-blanks-settings-default',
    title: 'Plan mode by default',
    summary: 'Set plan mode as the session default in settings.json.',
    stageId: 's3',
    rung: 'I',
    format: 'blanks',
    prompt:
      'Add `{0}: {1}` to your `.claude/settings.json` so plan mode is the default whenever you start `claude` in this project.',
    blanks: [
      {
        options: ['"permissionMode"', '"mode"', '"permission"', '"plan"'],
        correctIndex: 0,
        explanation:
          'The settings key is `permissionMode`. It accepts one of `"default"`, `"acceptEdits"`, `"plan"`, `"yolo"`.',
      },
      {
        options: [`"plan"`, `true`, `"on"`, `1`],
        correctIndex: 0,
        explanation:
          'The value is the string `"plan"` — the same name you see in the Shift+Tab cycle.',
      },
    ],
  },

  // ---------- S4 — Customising Claude ----------
  {
    id: 'l-s4-mcq-where-claude-md',
    title: 'Where Claude looks for CLAUDE.md',
    summary: 'Which location is **not** one Claude reads from?',
    stageId: 's4',
    rung: 'B',
    format: 'mcq',
    question: 'Which of these is NOT a place Claude looks for a CLAUDE.md file?',
    options: [
      { letter: 'A', text: '`~/.claude/CLAUDE.md`' },
      { letter: 'B', text: 'Project root `CLAUDE.md`' },
      { letter: 'C', text: 'A subdirectory `CLAUDE.md` (e.g. `src/agents/CLAUDE.md`)' },
      { letter: 'D', text: '`/etc/claude/CLAUDE.md`' },
    ],
    correct: 'D',
    explanation:
      'Three CLAUDE.md locations: user-wide (`~/.claude/`), project root, and any subtree. There is no `/etc/claude/` path — Claude does not read system-wide configuration files.',
  },
  {
    id: 'l-s4-reorder-config-load-order',
    title: 'How CLAUDE.md files load',
    summary: 'Order the CLAUDE.md sources from broadest to most specific.',
    stageId: 's4',
    rung: 'B',
    format: 'reorder',
    steps: [
      {
        id: 'user-claude-md',
        label: '`~/.claude/CLAUDE.md` — your personal preferences',
        rationale: 'User-level rules apply to every project on your machine.',
      },
      {
        id: 'root-claude-md',
        label: 'Project-root `CLAUDE.md` — this project, all subtrees',
        rationale: 'Project-wide conventions extend your personal preferences.',
      },
      {
        id: 'subdir-claude-md',
        label: 'Subdirectory `CLAUDE.md` — specific subtree',
        rationale: 'Closer files give more specific rules for that area of the code.',
      },
      {
        id: 'effective',
        label: 'Effective config Claude reads this turn',
        rationale: 'The merge is cumulative — all active files are visible to Claude.',
      },
    ],
  },
  {
    id: 'l-s4-blanks-slash-frontmatter',
    title: 'A slash command, end to end',
    summary: 'Where it lives, what its frontmatter holds, how to call it.',
    stageId: 's4',
    rung: 'I',
    format: 'blanks',
    prompt:
      'Save the file as `.claude/{0}/audit.md`. Its frontmatter declares `{1}: "Run a lint audit"`. To invoke it in the REPL, type `{2}`.',
    blanks: [
      {
        options: ['commands', 'skills', 'scripts', 'actions'],
        correctIndex: 0,
        explanation: 'Slash commands live in `.claude/commands/`. The filename becomes the command name.',
      },
      {
        options: ['description', 'name', 'trigger', 'purpose'],
        correctIndex: 0,
        explanation:
          'The `description` field appears next to the command in `/help`. The filename is the command name, so no `name` field is required.',
      },
      {
        options: ['/audit', '@audit', '//audit', '!audit'],
        correctIndex: 0,
        explanation:
          'Slash commands are invoked with the `/` prefix and the filename (no extension).',
      },
    ],
  },
  {
    id: 'l-s4-reorder-create-skill',
    title: 'Create your first skill',
    summary: 'Order the steps to ship a new skill and have it fire automatically.',
    stageId: 's4',
    rung: 'I',
    format: 'reorder',
    steps: [
      {
        id: 'create-dir',
        label: 'Create the directory `.claude/skills/my-skill/`',
        rationale: 'Each skill lives in its own subdirectory under `.claude/skills/`.',
      },
      {
        id: 'write-skill-md',
        label: 'Write `SKILL.md` with `name`, `description`, and `triggers` in frontmatter',
        rationale: 'Triggers are the phrases that make Claude load this skill on demand.',
      },
      {
        id: 'write-body',
        label: 'Add the prompt body — the instructions Claude runs when the skill fires',
        rationale: 'Markdown body below the frontmatter is the skill\'s prompt.',
      },
      {
        id: 'restart',
        label: 'Restart Claude so the skill is registered',
        rationale: 'New skills are discovered when Claude scans `.claude/skills/` on session start.',
      },
      {
        id: 'trigger',
        label: 'Use a phrasing that matches your triggers — the skill loads automatically',
        rationale: 'Triggers make skills feel ambient. No `/command` to remember.',
      },
    ],
  },
  {
    id: 'l-s4-mcq-skill-vs-command',
    title: 'Skill or slash command?',
    summary: 'Pick the right shape for a "review this PR" recipe.',
    stageId: 's4',
    rung: 'I',
    format: 'mcq',
    question:
      'Your team wants a recipe that fires whenever someone says "review this PR" or "look at this pull request". Which is the better fit?',
    options: [
      { letter: 'A', text: 'A skill with triggers `["review this PR", "look at this pull request"]`' },
      { letter: 'B', text: 'A slash command `/review-pr`' },
      { letter: 'C', text: 'A CLAUDE.md rule' },
      { letter: 'D', text: 'An output style' },
    ],
    correct: 'A',
    explanation:
      'When the trigger is phrasing, the right shape is a skill. Slash commands fit explicit shortcuts. CLAUDE.md is for project-wide conventions, not on-demand recipes.',
  },
  {
    id: 'l-s4-flow-effective-config',
    title: 'Compose precedence',
    summary: 'Drag the cards into the order Claude assembles the effective config.',
    stageId: 's4',
    rung: 'I',
    format: 'flow-builder',
    cards: [
      { id: 'user-prefs', label: '~/.claude/CLAUDE.md — every project on your machine' },
      { id: 'project-root', label: 'CLAUDE.md — this project, all subtrees' },
      { id: 'subdir', label: 'src/agents/CLAUDE.md — this subtree' },
      { id: 'effective', label: 'The merged config Claude reads this turn' },
    ],
    canonical: ['user-prefs', 'project-root', 'subdir', 'effective'],
    rationale:
      'Closer files extend broader ones. The merged config is what Claude actually sees — all active files, in load order.',
  },

  // ---------- S5 — Memory & sessions ----------
  {
    id: 'l-s5-mcq-context-bar',
    title: 'Context bar at 80%, mid-task',
    summary: 'What\'s the right move when the window is nearly full?',
    stageId: 's5',
    rung: 'B',
    format: 'mcq',
    question: 'The context bar is 80% full and you want to keep working on the same task. What do you do?',
    options: [
      { letter: 'A', text: '`/clear` and start over' },
      { letter: 'B', text: '`/compact` to free tokens while keeping the thread' },
      { letter: 'C', text: 'Ignore it and keep prompting' },
      { letter: 'D', text: '`/resume` from earlier in the day' },
    ],
    correct: 'B',
    explanation:
      '`/compact` is exactly this situation — same task, heavy context. Claude summarises prior turns and frees tokens. `/clear` would lose the thread; `/resume` adds context, not frees it.',
  },
  {
    id: 'l-s5-mcq-clear-vs-compact',
    title: '/clear vs /compact',
    summary: 'When is /clear the right move instead of /compact?',
    stageId: 's5',
    rung: 'I',
    format: 'mcq',
    question: 'Which of these calls for `/clear` (and not `/compact`)?',
    options: [
      { letter: 'A', text: 'You\'re mid-refactor and approaching the window edge' },
      { letter: 'B', text: 'You just finished feature A and want to start an unrelated feature B' },
      { letter: 'C', text: 'Claude misremembered a line number from earlier' },
      { letter: 'D', text: 'You typed a typo in your prompt' },
    ],
    correct: 'B',
    explanation:
      '`/clear` fits a clean break — switching to unrelated work. Mid-task, you want `/compact`. For a mis-remembered detail, re-share the detail explicitly. For a typo, just retype.',
  },
  {
    id: 'l-s5-blanks-memory-file',
    title: 'Memory commands',
    summary: 'Open and write to the memory file from the REPL.',
    stageId: 's5',
    rung: 'I',
    format: 'blanks',
    prompt:
      'To open the persistent project memory file from the REPL, type {0}. To ask Claude to append a note on your behalf, type {1} followed by the fact you want recorded.',
    blanks: [
      {
        options: ['/memory', '/notes', '/save', '/recall'],
        correctIndex: 0,
        explanation: '`/memory` opens the memory file in your editor.',
      },
      {
        options: ['/remember', '/note', '/write', '/save'],
        correctIndex: 0,
        explanation:
          '`/remember <fact>` appends the fact to the memory file. The file is plain markdown — you can hand-edit it too.',
      },
    ],
  },
  {
    id: 'l-s5-reorder-resume-flow',
    title: 'Resume a past session',
    summary: 'Order the steps to pick up yesterday\'s session the next morning.',
    stageId: 's5',
    rung: 'I',
    format: 'reorder',
    steps: [
      {
        id: 'exit-yesterday',
        label: 'At the end of yesterday\'s session, just exit (Ctrl+D or `/exit`)',
        rationale: 'Claude persists the session locally — no special "save" command needed.',
      },
      {
        id: 'open-claude',
        label: 'The next morning, run `claude` in the same project directory',
        rationale: 'Session history is per-project. You need to be in the right cwd.',
      },
      {
        id: 'invoke-resume',
        label: 'Type `/resume` in the REPL',
        rationale: '`/resume` lists prior sessions Claude has recorded for this project.',
      },
      {
        id: 'pick-session',
        label: 'Pick the session id from the list',
        rationale: 'Each session has a short id and a one-line summary; pick the one you want.',
      },
      {
        id: 'continue',
        label: 'Continue prompting with full prior context loaded',
        rationale: 'Reach for `/compact` immediately if the resumed session was already heavy.',
      },
    ],
  },
  {
    id: 'l-s5-reorder-memory-write',
    title: 'Record a fact mid-session',
    summary: 'Order the steps to capture a fact in memory without leaving the REPL.',
    stageId: 's5',
    rung: 'I',
    format: 'reorder',
    steps: [
      {
        id: 'note-fact',
        label: 'Notice a fact worth keeping: "the parser caches by URL, not by hash"',
        rationale: 'Mid-task you\'ll learn things you want next session. Catch them.',
      },
      {
        id: 'invoke-remember',
        label: 'Type `/remember the parser caches by URL, not by hash`',
        rationale: 'The fact after the slash command goes verbatim into the memory file.',
      },
      {
        id: 'claude-appends',
        label: 'Claude appends the line to the memory file',
        rationale: 'No prompt back from you — Claude does this silently.',
      },
      {
        id: 'verify',
        label: 'Optionally type `/memory` to see the file and confirm',
        rationale: 'Useful when you\'re first using the feature; later it\'s a trust thing.',
      },
      {
        id: 'continue-work',
        label: 'Continue the task — Claude reads memory automatically next session',
        rationale: 'Memory loads alongside CLAUDE.md on every new session start.',
      },
    ],
  },
  {
    id: 'l-s5-flow-long-task',
    title: 'A multi-hour task lifecycle',
    summary: 'Compose how /clear, /compact, /remember, and /resume sequence over a day.',
    stageId: 's5',
    rung: 'I',
    format: 'flow-builder',
    cards: [
      { id: 'start-clear', label: 'Start a fresh session with `/clear`' },
      { id: 'work', label: 'Several turns of focused work' },
      { id: 'compact-mid', label: '`/compact` when context starts to fill' },
      { id: 'remember', label: '`/remember` the key facts you\'ll want tomorrow' },
      { id: 'walk-away', label: 'Step away — exit cleanly' },
      { id: 'resume-next-day', label: '`/resume` the next morning, with memory intact' },
    ],
    canonical: [
      'start-clear',
      'work',
      'compact-mid',
      'remember',
      'walk-away',
      'resume-next-day',
    ],
    rationale:
      '`/compact` protects the thread. `/remember` protects facts across sessions. `/resume` lets you pick up the next day. Together they make multi-day tasks feel continuous.',
  },

  // ---------- S6 — Delegating ----------
  {
    id: 'l-s6-mcq-subagent-isolation',
    title: 'What a subagent gets',
    summary: 'What\'s separate between the main agent and a spawned subagent?',
    stageId: 's6',
    rung: 'B',
    format: 'mcq',
    question: 'When Claude spawns a subagent, what does the subagent get that\'s separate from the main session?',
    options: [
      { letter: 'A', text: 'A fresh, isolated context window' },
      { letter: 'B', text: 'The same shared context as the main session' },
      { letter: 'C', text: 'Read-only access to the main session\'s context' },
      { letter: 'D', text: 'Nothing — subagents are just function calls' },
    ],
    correct: 'A',
    explanation:
      'A subagent runs as a separate Claude process with its own context window, its own system prompt, and its own tool roster. Only the final reply lands back in the main session.',
  },
  {
    id: 'l-s6-blanks-task-tool',
    title: 'Spawning a subagent',
    summary: 'Complete the tool name and where project-specific subagents live.',
    stageId: 's6',
    rung: 'B',
    format: 'blanks',
    prompt:
      'Claude spawns a subagent by calling the {0} tool. Project-specific subagent definitions live in {1}.',
    blanks: [
      {
        options: ['Task', 'Subagent', 'Spawn', 'Delegate'],
        correctIndex: 0,
        explanation: 'The Task tool dispatches a subagent. The roster (Explore, Plan, general-purpose, plus any project-specific) is configured via `.claude/agents/`.',
      },
      {
        options: ['.claude/agents/', '.claude/subagents/', '.agents/', '.claude/tasks/'],
        correctIndex: 0,
        explanation: 'Project subagents are markdown files under `.claude/agents/` — same shape as skills, but for delegated work.',
      },
    ],
  },
  {
    id: 'l-s6-mcq-which-subagent',
    title: 'Pick the right subagent',
    summary: 'Choose the best built-in subagent for "where is X defined?"',
    stageId: 's6',
    rung: 'I',
    format: 'mcq',
    question:
      'You want to find where the `parseEvent` function is declared across a 300-file repo. Which built-in subagent is the best fit?',
    options: [
      { letter: 'A', text: '`Explore` — fast read-only search' },
      { letter: 'B', text: '`Plan` — architect-style planning' },
      { letter: 'C', text: '`general-purpose` — full toolset' },
      { letter: 'D', text: 'No subagent — just call Grep yourself' },
    ],
    correct: 'A',
    explanation:
      'Explore is purpose-built for symbol-and-string lookups. It returns a small reply (just the path:line refs), so it earns its keep on context isolation alone.',
  },
  {
    id: 'l-s6-reorder-parallel-research',
    title: 'Parallel research',
    summary: 'Order the steps for dispatching three subagents in parallel.',
    stageId: 's6',
    rung: 'I',
    format: 'reorder',
    steps: [
      {
        id: 'identify-questions',
        label: 'Identify three independent sub-questions you need answered',
        rationale: 'Parallelism only pays off if the questions don\'t depend on each other.',
      },
      {
        id: 'pick-roster',
        label: 'Pick a subagent type for each (Explore, Plan, general-purpose, or a project-specific one)',
        rationale: 'Match the role to the question — wrong tool wastes wall-clock either way.',
      },
      {
        id: 'dispatch-all',
        label: 'Dispatch all three Task calls in one turn',
        rationale: 'A single turn with multiple Tasks = parallel. Sequential turns = serial.',
      },
      {
        id: 'wait-settled',
        label: 'Wait for every spoke to settle (settled-style, not Promise.all)',
        rationale: 'Settled-style means one failure doesn\'t sink the whole turn.',
      },
      {
        id: 'merge',
        label: 'Merge the three replies into one synthesised result',
        rationale: 'The win of parallel work is the merged answer — make sure your reply does the merging.',
      },
    ],
  },
  {
    id: 'l-s6-flow-subagent-decision',
    title: 'Subagent decision flow',
    summary: 'Compose the decision sequence for whether to delegate.',
    stageId: 's6',
    rung: 'I',
    format: 'flow-builder',
    cards: [
      { id: 'task-arrives', label: 'A task arrives' },
      { id: 'check-isolation', label: 'Does main context benefit from isolation?' },
      { id: 'check-parallel', label: 'Are sub-questions independent enough to run in parallel?' },
      { id: 'check-overhead', label: 'Does the spawn overhead beat the savings?' },
      { id: 'spawn-or-not', label: 'Spawn subagent(s) — or just do it in the main session' },
    ],
    canonical: [
      'task-arrives',
      'check-isolation',
      'check-parallel',
      'check-overhead',
      'spawn-or-not',
    ],
    rationale:
      'Delegation isn\'t free. Isolation, parallelism, and overhead are the three filters. If none of them apply, the main session is the right place to do the work.',
  },
  {
    id: 'l-s6-mcq-not-a-subagent',
    title: 'When NOT to spawn',
    summary: 'Pick the case where delegation is the wrong move.',
    stageId: 's6',
    rung: 'I',
    format: 'mcq',
    question: 'Which of these is the **worst** candidate for spawning a subagent?',
    options: [
      { letter: 'A', text: 'Searching 200 files for a symbol' },
      { letter: 'B', text: 'Fixing a typo in `src/foo.ts:12`' },
      { letter: 'C', text: 'Auditing six modules in parallel' },
      { letter: 'D', text: 'Researching three independent design options' },
    ],
    correct: 'B',
    explanation:
      'A one-line typo fix fits the main session — the spawn overhead and reply-reading cost exceed any savings. Subagents earn their keep on isolation or parallelism, not on small targeted edits.',
  },

  // ---------- S7 — Extending ----------
  {
    id: 'l-s7-mcp-vs-bash',
    title: 'MCP server or Bash?',
    summary: 'Pick the right shape for accessing an external system.',
    stageId: 's7',
    rung: 'I',
    format: 'mcq',
    question:
      'Your team\'s deploy tool has a CLI Claude can already invoke via Bash. Should you add an MCP server for it?',
    options: [
      { letter: 'A', text: 'Yes — MCP is always cleaner' },
      { letter: 'B', text: 'No — Bash already gets you there; MCP would add tokens for no win' },
      { letter: 'C', text: 'Yes — MCP is the only way to bound permissions' },
      { letter: 'D', text: 'Only if the CLI returns JSON' },
    ],
    correct: 'B',
    explanation:
      'MCP earns its keep when a system has no other access path (or when a tighter, named API is worth the tokens). If the CLI works via Bash, adding MCP just bloats the tool roster on every prompt.',
  },
  {
    id: 'l-s7-blanks-hook-event',
    title: 'Hook event names',
    summary: 'Complete the four event names settings.json understands.',
    stageId: 's7',
    rung: 'B',
    format: 'blanks',
    prompt:
      'Hooks fire on four events: {0} (before any tool call), {1} (after a tool call), {2} (when the session exits), and `userPromptSubmit` (when you press Enter).',
    blanks: [
      {
        options: ['preToolUse', 'beforeTool', 'preTool', 'pre-tool-use'],
        correctIndex: 0,
        explanation: 'camelCase JSON key: `preToolUse`. Settings.json is conventional camelCase throughout.',
      },
      {
        options: ['postToolUse', 'afterTool', 'postTool', 'post-tool-use'],
        correctIndex: 0,
        explanation: '`postToolUse` mirrors `preToolUse`.',
      },
      {
        options: ['stop', 'exit', 'end', 'session-end'],
        correctIndex: 0,
        explanation: '`stop` fires once when the session ends (Ctrl+D, `/exit`, or session timeout).',
      },
    ],
  },
  {
    id: 'l-s7-mcq-when-not-mcp',
    title: 'When NOT to add an MCP server',
    summary: 'Pick the case where MCP is overkill.',
    stageId: 's7',
    rung: 'I',
    format: 'mcq',
    question: 'Which of these is the **weakest** justification for adding an MCP server?',
    options: [
      { letter: 'A', text: '"I look up the same Linear ticket field every day."' },
      { letter: 'B', text: '"Claude can\'t read our internal docs site at all."' },
      { letter: 'C', text: '"I need it once, for this one PR."' },
      { letter: 'D', text: '"We want narrow, named tools instead of a Bash escape hatch."' },
    ],
    correct: 'C',
    explanation:
      'One-off lookups don\'t justify the token overhead. Recurring use cases, missing access paths, and tighter permission shapes do.',
  },
  {
    id: 'l-s7-reorder-add-mcp',
    title: 'Add an MCP server',
    summary: 'Order the steps to register and use a new MCP server.',
    stageId: 's7',
    rung: 'I',
    format: 'reorder',
    steps: [
      {
        id: 'pick-server',
        label: 'Pick a server (`github`, `linear`, `postgres`, internal-docs, etc.)',
        rationale: 'Match the system Claude needs to reach.',
      },
      {
        id: 'choose-scope',
        label: 'Decide project (`.mcp.json`, committed) vs. user (your config, uncommitted)',
        rationale: 'Project scope is shared across teammates; user scope holds your credentials.',
      },
      {
        id: 'add-config',
        label: 'Add the server entry with its URL and any auth',
        rationale: 'Each entry is `{ "url": "...", "headers": {...} }` — see the docs for the exact shape.',
      },
      {
        id: 'restart',
        label: 'Restart Claude so the new tools register',
        rationale: 'New MCP tools are discovered on session start.',
      },
      {
        id: 'prompt',
        label: 'Prompt as usual — Claude will pick the new tools when relevant',
        rationale: 'No need to call the tools by name; the model selects them like any other.',
      },
    ],
  },
  {
    id: 'l-s7-flow-hook-firing-order',
    title: 'Hooks fire in order',
    summary: 'Compose the sequence of events around one Claude turn.',
    stageId: 's7',
    rung: 'I',
    format: 'flow-builder',
    cards: [
      { id: 'submit', label: '`userPromptSubmit` — you press Enter' },
      { id: 'pre-edit', label: '`preToolUse(Edit)` — about to apply a diff' },
      { id: 'edit-runs', label: 'Edit tool runs, file mutates' },
      { id: 'post-edit', label: '`postToolUse(Edit)` — auto-lint, post-fix' },
      { id: 'stop', label: '`stop` — you exit; tests run, summary generated' },
    ],
    canonical: ['submit', 'pre-edit', 'edit-runs', 'post-edit', 'stop'],
    rationale:
      'Each tool call sits between its pre- and post-hooks. The order is deterministic: hooks run before the action they precede, and after the action they follow.',
  },
  {
    id: 'l-s7-mcq-hook-vs-rule',
    title: 'Hook or CLAUDE.md rule?',
    summary: 'Pick the right shape for "never run `rm -rf` from a Claude session".',
    stageId: 's7',
    rung: 'I',
    format: 'mcq',
    question: 'You want to guarantee Claude never runs `rm -rf`. What\'s the right place to enforce it?',
    options: [
      { letter: 'A', text: 'A line in CLAUDE.md: "never use `rm -rf`"' },
      { letter: 'B', text: 'A `preToolUse(Bash)` hook that rejects commands matching `rm -rf`' },
      { letter: 'C', text: 'A skill called "no-rm-rf"' },
      { letter: 'D', text: 'A slash command `/no-rm-rf`' },
    ],
    correct: 'B',
    explanation:
      'CLAUDE.md asks Claude to follow a rule. A hook enforces it — even if the prompt asks for the destructive command, the hook can refuse. For absolute guarantees, hooks beat prose.',
  },

  // ---------- S8 — Beyond the REPL ----------
  {
    id: 'l-s8-mcq-print-flag',
    title: 'The headless flag',
    summary: 'Which flag turns a `claude` invocation into a one-shot script call?',
    stageId: 's8',
    rung: 'B',
    format: 'mcq',
    question: 'Which flag runs Claude headlessly — one prompt, one reply, exit?',
    options: [
      { letter: 'A', text: '`-p` (or `--print`)' },
      { letter: 'B', text: '`-r` (or `--run`)' },
      { letter: 'C', text: '`-x` (or `--exec`)' },
      { letter: 'D', text: '`-q` (or `--quiet`)' },
    ],
    correct: 'A',
    explanation:
      '`-p` (short for `--print`) is the headless flag. Combine with `--output-format json` for parseable output in scripts.',
  },
  {
    id: 'l-s8-blanks-jq-snippet',
    title: 'Parse JSON output with jq',
    summary: 'Complete the command + jq pipeline.',
    stageId: 's8',
    rung: 'I',
    format: 'blanks',
    prompt:
      'claude {0} "summarise this repo" --output-format json | jq -r {1}',
    blanks: [
      {
        options: ['-p', '-q', '-i', '--repl'],
        correctIndex: 0,
        explanation: '`-p` runs Claude with a single prompt and exits.',
      },
      {
        options: ['.result', '.text', '.content', '.body'],
        correctIndex: 0,
        explanation: 'The JSON envelope puts the answer on the `.result` field. Other fields hold metadata (cost, duration, session_id, is_error).',
      },
    ],
  },
  {
    id: 'l-s8-mcq-when-headless',
    title: 'When headless is the right shape',
    summary: 'Pick the case where headless beats the REPL.',
    stageId: 's8',
    rung: 'I',
    format: 'mcq',
    question: 'Which of these is the **best** candidate for headless mode?',
    options: [
      { letter: 'A', text: 'A scripted nightly summary of recent commits' },
      { letter: 'B', text: 'A debugging session where you go back and forth' },
      { letter: 'C', text: 'Exploring an unfamiliar codebase for the first time' },
      { letter: 'D', text: 'Pair-programming with someone over a screen-share' },
    ],
    correct: 'A',
    explanation:
      'Headless is batch — one prompt in, one answer out. The other three need back-and-forth, which is what the REPL is for. Match the shape of the tool to the shape of the work.',
  },
  {
    id: 'l-s8-reorder-ci-bound',
    title: 'Bounding a CI invocation',
    summary: 'Order the layers that keep a CI run safe.',
    stageId: 's8',
    rung: 'I',
    format: 'reorder',
    steps: [
      {
        id: 'print-flag',
        label: 'Use `-p "your prompt"` so the run is one-shot, not interactive',
        rationale: 'CI can\'t answer permission prompts — headless is the only sensible mode.',
      },
      {
        id: 'output-json',
        label: 'Add `--output-format json` so downstream steps can parse the reply',
        rationale: 'Without JSON the next step has to grep prose. With it, `jq` extracts whatever you need.',
      },
      {
        id: 'allowed-tools',
        label: 'Restrict with `--allowed-tools Read,Grep,Glob`',
        rationale: 'A reviewer doesn\'t need Edit, Write, or Bash. Removing them removes the foot-gun.',
      },
      {
        id: 'plan-mode',
        label: 'Belt-and-braces: `--permission-mode plan`',
        rationale: 'Even with allow-list in place, plan mode is a hard "no writes" cap.',
      },
      {
        id: 'denylist',
        label: 'Layer with `.claude/settings.json` denylist + hooks',
        rationale: 'Multiple layers — flags, settings, hooks — give defence in depth.',
      },
    ],
  },
  {
    id: 'l-s8-flow-headless-pipeline',
    title: 'A headless pipeline',
    summary: 'Compose the parts of a script that uses Claude headlessly.',
    stageId: 's8',
    rung: 'I',
    format: 'flow-builder',
    cards: [
      { id: 'gather-input', label: 'Gather input — git diff, file contents, recent commits' },
      { id: 'invoke-claude', label: 'Invoke `claude -p "..." --output-format json` with the input' },
      { id: 'parse-json', label: 'Pipe through `jq` to extract the field you want' },
      { id: 'act-on-result', label: 'Use the parsed result — post a PR comment, file a ticket, write a report' },
      { id: 'exit-status', label: 'Exit the script with the right status code for CI' },
    ],
    canonical: [
      'gather-input',
      'invoke-claude',
      'parse-json',
      'act-on-result',
      'exit-status',
    ],
    rationale:
      'A headless pipeline reads like any other script: gather, invoke, parse, act, exit. Claude is just one stage in a longer flow.',
  },
  {
    id: 'l-s8-mcq-headless-vs-repl',
    title: 'Headless vs REPL',
    summary: 'When does each shape earn its keep?',
    stageId: 's8',
    rung: 'A',
    format: 'mcq',
    question: 'Which framing best captures the headless ↔ REPL choice?',
    options: [
      { letter: 'A', text: 'Headless is for power users; REPL is for beginners' },
      { letter: 'B', text: 'Headless is batch (one-shot); REPL is interactive (back-and-forth)' },
      { letter: 'C', text: 'Headless is cheaper; REPL is more expensive' },
      { letter: 'D', text: 'Headless works on any model; REPL only works on Sonnet' },
    ],
    correct: 'B',
    explanation:
      'The shape of the work decides. A nightly summary is one-shot. An exploration is back-and-forth. Picking the right mode is the whole skill.',
  },

  // ---------- S1 (additional v0.4 lessons) ----------
  {
    id: 'l-s1-mcq-claude-md',
    title: 'What Claude reads at session start',
    summary: 'When you launch a session, which file does Claude read automatically?',
    stageId: 's1',
    rung: 'B',
    format: 'mcq',
    question: 'You run `claude` in a project directory. Which file does Claude read before your first prompt?',
    options: [
      { letter: 'A', text: '`CLAUDE.md` at the project root (if present)' },
      { letter: 'B', text: 'Every file in the repo' },
      { letter: 'C', text: '`.claude/config.json`' },
      { letter: 'D', text: 'Your shell history' },
    ],
    correct: 'A',
    explanation:
      'CLAUDE.md is loaded automatically — the canonical place for your project\'s conventions. Other files only enter context when Claude calls Read on them.',
  },
  {
    id: 'l-s1-blanks-launch-exit',
    title: 'Launch and exit',
    summary: 'Complete the two commands that start and end a session.',
    stageId: 's1',
    rung: 'B',
    format: 'blanks',
    prompt:
      'Open a terminal in your project and run {0} to start a session. When you\'re done, type {1} or press Ctrl+D.',
    blanks: [
      {
        options: ['claude', 'anthropic', 'cc', 'claude-code'],
        correctIndex: 0,
        explanation:
          'The CLI binary is `claude`. The package name (`@anthropic-ai/claude-code`) and the executable name differ.',
      },
      {
        options: ['/exit', '/quit', '/end', 'q'],
        correctIndex: 0,
        explanation:
          '`/exit` ends the session cleanly. Ctrl+D also works. Ctrl+C interrupts the current tool call but does not exit.',
      },
    ],
  },
  {
    id: 'l-s1-reorder-turn-tools',
    title: 'Tools in a first turn',
    summary: 'Order the typical tool calls during a first edit task.',
    stageId: 's1',
    rung: 'B',
    format: 'reorder',
    steps: [
      {
        id: 'glob',
        label: 'Claude calls **Glob** to find candidate files',
        rationale: 'Glob lists files by pattern (e.g., `src/**/*.ts`). Cheap way to scope the task.',
      },
      {
        id: 'read',
        label: 'Claude calls **Read** on the most likely file',
        rationale: 'Read returns the file\'s contents so Claude can reason about the actual code.',
      },
      {
        id: 'grep',
        label: 'Claude calls **Grep** to find specific usages',
        rationale: 'Grep is the content-search workhorse — cheaper than reading whole files.',
      },
      {
        id: 'edit',
        label: 'Claude calls **Edit** to propose the change',
        rationale: 'Edit is when the diff is proposed — you see it before it lands.',
      },
      {
        id: 'permission',
        label: 'You approve the **permission prompt**',
        rationale: 'First-touch permission gates every tool used in a project.',
      },
    ],
  },

  // ---------- S2 (additional v0.4 lessons) ----------
  {
    id: 'l-s2-mcq-deny-wins',
    title: 'When allow and deny both match',
    summary: 'Which one wins?',
    stageId: 's2',
    rung: 'I',
    format: 'mcq',
    question:
      'Your `.claude/settings.json` has both `allow: ["Bash(npm test)"]` and `deny: ["Bash(*)"]`. Claude wants to run `Bash(npm test)`. What happens?',
    options: [
      { letter: 'A', text: 'Denied — `deny` always wins over `allow`' },
      { letter: 'B', text: 'Allowed silently — more specific patterns win' },
      { letter: 'C', text: 'Prompts you — ambiguous case' },
      { letter: 'D', text: 'Claude refuses to start — invalid config' },
    ],
    correct: 'A',
    explanation:
      '`deny` always wins, regardless of pattern specificity. This is by design — a deny entry should be safe even when allow rules drift over time.',
  },
  {
    id: 'l-s2-flow-permission-prompt',
    title: 'A first-touch permission prompt',
    summary: 'Compose what happens when Claude wants a tool for the first time.',
    stageId: 's2',
    rung: 'B',
    format: 'flow-builder',
    cards: [
      { id: 'claude-needs-tool', label: 'Claude needs a tool (e.g. Edit)' },
      { id: 'check-settings', label: 'Settings.json is checked for allow / deny match' },
      { id: 'no-match', label: 'No matching rule → permission prompt appears' },
      { id: 'choose', label: 'You choose: once, this session, always, or no' },
      { id: 'remember', label: 'Your "always" answer gets written to settings.json' },
    ],
    canonical: [
      'claude-needs-tool',
      'check-settings',
      'no-match',
      'choose',
      'remember',
    ],
    rationale:
      'The flow is: need → check → prompt → answer → persist. The "always" answer is the one that adds an entry to your settings file — a one-time prompt becomes a permanent allow.',
  },
  {
    id: 'l-s2-reorder-tighten-bash',
    title: 'Tighten an over-broad Bash rule',
    summary: 'Order the moves to fix a `Bash(*)` allow that lets `rm -rf` through.',
    stageId: 's2',
    rung: 'I',
    format: 'reorder',
    steps: [
      {
        id: 'spot-bug',
        label: 'Notice you have `allow: ["Bash(*)"]` — over-broad',
        rationale: 'Wildcard allows let destructive commands pass silently.',
      },
      {
        id: 'remove-broad',
        label: 'Remove the `Bash(*)` line',
        rationale: 'Step zero: stop trusting every shell command by default.',
      },
      {
        id: 'list-needs',
        label: 'List the specific Bash commands you actually run',
        rationale: 'Inventory before you add — be honest about what you need.',
      },
      {
        id: 'add-narrow',
        label: 'Add narrow allow entries: `Bash(npm test)`, `Bash(git status)`, etc.',
        rationale: 'One entry per command keeps the gate informative.',
      },
      {
        id: 'add-deny',
        label: 'Add deny entries for destructive shapes: `Bash(rm *)`, `Bash(rm -rf *)`',
        rationale: 'Belt and braces — even if a future allow drifts, deny still wins.',
      },
    ],
  },

  // ---------- S3 (additional v0.4 lessons) ----------
  {
    id: 'l-s3-blanks-exit-plan',
    title: 'Leaving plan mode',
    summary: 'Complete the two ways to exit plan mode mid-session.',
    stageId: 's3',
    rung: 'B',
    format: 'blanks',
    prompt:
      'To leave plan mode, you can press {0} to cycle to the next permission mode, or type {1} to switch directly to default.',
    blanks: [
      {
        options: ['Shift+Tab', 'Ctrl+P', 'Escape', 'Ctrl+C'],
        correctIndex: 0,
        explanation:
          'Shift+Tab cycles through `default → acceptEdits → plan → yolo`. From plan, the next press takes you to yolo, then back to default.',
      },
      {
        options: [`/permission-mode default`, `/exit`, `/cancel`, `/done`],
        correctIndex: 0,
        explanation:
          'The `/permission-mode <mode>` slash command jumps directly to any mode without cycling.',
      },
    ],
  },
  {
    id: 'l-s3-mcq-shrink-prompts',
    title: 'Sharpest scope-shrinking prompt',
    summary: 'Which re-prompt cuts a sprawling plan the most?',
    stageId: 's3',
    rung: 'I',
    format: 'mcq',
    question:
      'Claude\'s plan touched 12 files. You want to shrink it to one module. Which re-prompt is sharpest?',
    options: [
      { letter: 'A', text: '"Be more focused"' },
      { letter: 'B', text: '"Make it shorter"' },
      { letter: 'C', text: '"Only edit `src/parser/`. Don\'t touch anything outside that directory."' },
      { letter: 'D', text: '"Skip the helpers"' },
    ],
    correct: 'C',
    explanation:
      'Naming the scope explicitly is the move that actually works. Adjective re-prompts ("be focused", "be shorter") tend to produce the same shape with slightly less verbose prose.',
  },

  // ---------- S4 (additional v0.4 lessons) ----------
  {
    id: 'l-s4-blanks-status-line',
    title: 'Status-line configuration',
    summary: 'Complete the settings.json key and a variable name.',
    stageId: 's4',
    rung: 'I',
    format: 'blanks',
    prompt:
      'The status line is configured under the {0} key in `.claude/settings.json`. Inside, you can interpolate variables like `{1}` to show the current working directory.',
    blanks: [
      {
        options: ['"statusLine"', '"status_line"', '"prompt"', '"footer"'],
        correctIndex: 0,
        explanation:
          'camelCase per the settings.json convention. The value is a string template with interpolated variables.',
      },
      {
        options: ['{{cwd}}', '$cwd', '%cwd%', '<cwd>'],
        correctIndex: 0,
        explanation:
          'Mustache-style `{{cwd}}` interpolation. Other variables: `{{branch}}`, `{{model}}`, `{{mode}}`.',
      },
    ],
  },
  {
    id: 'l-s4-flow-add-starter-pack',
    title: 'A minimum starter pack',
    summary: 'Compose the three artifacts a project should ship with.',
    stageId: 's4',
    rung: 'I',
    format: 'flow-builder',
    cards: [
      { id: 'claude-md', label: '`CLAUDE.md` at root — 3-4 lines on project shape' },
      { id: 'slash-cmd', label: 'One slash command in `.claude/commands/` — the prompt you type weekly' },
      { id: 'skill', label: 'One skill in `.claude/skills/` — the team workflow you wish everyone followed' },
      { id: 'commit', label: 'Commit the lot — these are project state, not personal config' },
    ],
    canonical: ['claude-md', 'slash-cmd', 'skill', 'commit'],
    rationale:
      'CLAUDE.md is always-on context. A slash command saves keystrokes. A skill enforces a recipe. All three live under version control because they apply to everyone working in the repo.',
  },

  // ---------- S5 (additional v0.4 lessons) ----------
  {
    id: 'l-s5-mcq-memory-vs-claudemd-purpose',
    title: 'CLAUDE.md or memory — pick the right home',
    summary: 'For each fact, which file is the right place?',
    stageId: 's5',
    rung: 'I',
    format: 'mcq',
    question:
      'You discover mid-task that the parser caches by URL, not by hash. The fact will matter again tomorrow but isn\'t a project convention. Where should it live?',
    options: [
      { letter: 'A', text: 'In `CLAUDE.md` so every contributor sees it' },
      { letter: 'B', text: 'In memory via `/remember` — personal scratch that survives sessions' },
      { letter: 'C', text: 'In a code comment' },
      { letter: 'D', text: 'In `.claude/settings.json`' },
    ],
    correct: 'B',
    explanation:
      'Memory is for facts you\'ll want next session but aren\'t project conventions. CLAUDE.md is for things every contributor needs. Code comments are for things tied to a specific line of code.',
  },
  {
    id: 'l-s5-reorder-fill-up',
    title: 'When the bar fills up',
    summary: 'Order the actions as the context bar climbs through 60%, 80%, 95%.',
    stageId: 's5',
    rung: 'B',
    format: 'reorder',
    steps: [
      {
        id: 'sixty',
        label: '60% — keep working; plenty of room',
        rationale: 'Below 70% there is no reason to act.',
      },
      {
        id: 'eighty-keep',
        label: '80% — if you\'re mid-task, `/compact` to free room',
        rationale: 'Compaction protects the thread.',
      },
      {
        id: 'eighty-switch',
        label: '80% — if you\'re switching tasks, `/clear` instead',
        rationale: 'Clear when the old work is done. Compact when it\'s ongoing.',
      },
      {
        id: 'ninety-five',
        label: '95% — `/remember` any key fact, then `/compact`',
        rationale: 'Specifics get lossy in compaction. Save them first.',
      },
      {
        id: 'walk-away',
        label: 'Tomorrow — `/resume` from where you left off',
        rationale: 'Session history persists across exits.',
      },
    ],
  },

  // ---------- S6 (additional v0.4 lessons) ----------
  {
    id: 'l-s6-mcq-subagent-tools',
    title: 'Explore\'s tool roster',
    summary: 'Which tools does the Explore subagent get?',
    stageId: 's6',
    rung: 'I',
    format: 'mcq',
    question: 'Which set of tools is Explore restricted to?',
    options: [
      { letter: 'A', text: 'Read, Grep, Glob' },
      { letter: 'B', text: 'Read, Grep, Glob, Edit' },
      { letter: 'C', text: 'All built-in tools' },
      { letter: 'D', text: 'Only Grep' },
    ],
    correct: 'A',
    explanation:
      'Explore is read-only by design. It returns references (path:line) and small excerpts — no edits, no shell. Use it for "where is X" type questions.',
  },
  {
    id: 'l-s6-blanks-background-task',
    title: 'A background task',
    summary: 'Complete the way you launch a long-running subagent without blocking the REPL.',
    stageId: 's6',
    rung: 'I',
    format: 'blanks',
    prompt:
      'A {0} subagent finishes minutes later; the result lands when {1}. Useful for heavy lint passes or scheduled audits that would otherwise tie up the REPL.',
    blanks: [
      {
        options: ['background', 'foreground', 'detached', 'async'],
        correctIndex: 0,
        explanation:
          'A background subagent runs without blocking. The main session continues; the result arrives later.',
      },
      {
        options: [
          'you next prompt',
          'you press Enter',
          'the subagent calls back',
          'you `/resume`',
        ],
        correctIndex: 0,
        explanation:
          'The result is collected at your next prompt — it lands as a system message alongside your new turn.',
      },
    ],
  },

  // ---------- S7 (additional v0.4 lessons) ----------
  {
    id: 'l-s7-mcq-deny-hooks',
    title: 'Why deny via hooks beats deny via CLAUDE.md',
    summary: 'For absolute "must not" rules, which mechanism wins?',
    stageId: 's7',
    rung: 'I',
    format: 'mcq',
    question:
      'Your team has a hard rule: "Never run `git push --force`." Which mechanism gives you the strongest guarantee?',
    options: [
      { letter: 'A', text: 'A line in `CLAUDE.md` asking Claude not to' },
      { letter: 'B', text: 'A `preToolUse(Bash)` hook that rejects commands matching `git push --force`' },
      { letter: 'C', text: 'A polite reminder in your team\'s docs' },
      { letter: 'D', text: 'A skill called "no-force-push"' },
    ],
    correct: 'B',
    explanation:
      'Hooks are deterministic — the runtime executes them and they can reject the call before it runs. CLAUDE.md is prose Claude can re-interpret. For "must not" rules, hooks are the only mechanism with guarantees.',
  },
  {
    id: 'l-s7-reorder-add-hook',
    title: 'Add a hook to settings.json',
    summary: 'Order the steps to register a postToolUse hook on Edit.',
    stageId: 's7',
    rung: 'I',
    format: 'reorder',
    steps: [
      {
        id: 'write-script',
        label: 'Write the hook script — `.claude/hooks/lint-on-edit.sh`',
        rationale: 'The script does the actual work — running lint, posting a message, etc.',
      },
      {
        id: 'chmod',
        label: 'Make it executable: `chmod +x .claude/hooks/lint-on-edit.sh`',
        rationale: 'Hooks are shell commands; they need the execute bit set.',
      },
      {
        id: 'register',
        label: 'Add a `postToolUse` entry in `.claude/settings.json` pointing at the script',
        rationale: 'Hooks live in settings.json under `hooks.postToolUse`. Add a `matcher: { tool: "Edit" }` to scope it.',
      },
      {
        id: 'restart',
        label: 'Restart Claude so the new hook registers',
        rationale: 'Settings are loaded at session start — restart to pick up changes.',
      },
      {
        id: 'verify',
        label: 'Trigger the matcher (ask Claude to Edit) and verify the hook fires',
        rationale: 'Test the hook before relying on it — a silent failure is worse than no hook at all.',
      },
    ],
  },

  // ---------- S8 (additional v0.4 lessons) ----------
  {
    id: 'l-s8-mcq-allowed-tools-ci',
    title: 'Why --allowed-tools belongs in CI',
    summary: 'What\'s the strongest reason to whitelist tools in a CI invocation?',
    stageId: 's8',
    rung: 'I',
    format: 'mcq',
    question:
      'You\'re writing a GitHub Action that asks Claude to review a PR. Why add `--allowed-tools Read,Grep,Glob`?',
    options: [
      { letter: 'A', text: 'Performance — fewer tools is faster' },
      { letter: 'B', text: 'Safety — Claude can\'t Edit, Write, or Bash even if a prompt asks it to' },
      { letter: 'C', text: 'Cost — locked-down tools cost less per token' },
      { letter: 'D', text: 'Documentation — it shows up in the action\'s output' },
    ],
    correct: 'B',
    explanation:
      'CI runs unattended — there\'s no human to answer a permission prompt. Restricting the tool roster removes the foot-gun entirely. Belt and braces with `--permission-mode plan` for extra safety.',
  },
  {
    id: 'l-s8-blanks-action-yaml',
    title: 'GitHub Action YAML',
    summary: 'Complete the action invocation.',
    stageId: 's8',
    rung: 'I',
    format: 'blanks',
    prompt:
      '- uses: {0}\\n  with:\\n    prompt: "Review this PR"\\n    output-format: {1}',
    blanks: [
      {
        options: [
          'anthropics/claude-code-action@v1',
          'claude/action@v1',
          'actions/claude@v1',
          'github/claude@v1',
        ],
        correctIndex: 0,
        explanation:
          'The official action is `anthropics/claude-code-action`. Pin to a major version (`@v1`) so minor releases don\'t change behaviour mid-flight.',
      },
      {
        options: ['json', 'text', 'markdown', 'yaml'],
        correctIndex: 0,
        explanation:
          'Use `json` for parseable output your script can act on. Use `text` only when a human reads the action log directly.',
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
