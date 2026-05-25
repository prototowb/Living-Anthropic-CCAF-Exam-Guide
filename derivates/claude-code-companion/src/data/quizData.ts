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
  {
    id: 's3',
    title: 'S3 — Steering Claude',
    stageId: 's3',
    questions: [
      {
        id: 1,
        text: 'What does Shift+Tab do in a running Claude Code session?',
        options: [
          { letter: 'A', text: 'Cycles through the permission modes' },
          { letter: 'B', text: 'Cancels the current tool call' },
          { letter: 'C', text: 'Switches between projects' },
          { letter: 'D', text: 'Auto-completes the prompt' },
        ],
        correct: 'A',
        explanation:
          'Shift+Tab walks through `default → acceptEdits → plan → yolo` and back. The current mode shows in the status line.',
        stageId: 's3',
        rung: 'B',
      },
      {
        id: 2,
        text: 'While plan mode is active, which tool is **still** available?',
        options: [
          { letter: 'A', text: 'Edit' },
          { letter: 'B', text: 'Write' },
          { letter: 'C', text: 'Grep' },
          { letter: 'D', text: 'Bash' },
        ],
        correct: 'C',
        explanation:
          'Plan mode allows read-only tools: Read, Grep, Glob, and Task (subagents inherit the mode). Edit, Write, and Bash are blocked.',
        stageId: 's3',
        rung: 'B',
      },
      {
        id: 3,
        text: 'In plan mode, Claude proposes a 3-step plan that touches one file. Can it apply the plan without you leaving plan mode?',
        options: [
          { letter: 'A', text: 'Yes — short plans skip the gate' },
          { letter: 'B', text: 'Yes — the plan auto-approves on Enter' },
          { letter: 'C', text: 'No — you must exit plan mode first' },
          { letter: 'D', text: 'Only if `acceptEdits` is also set' },
        ],
        correct: 'C',
        explanation:
          'Plan mode is a read-only posture. Claude can\'t touch your files until you exit the mode (Shift+Tab) and re-approve the edit calls.',
        stageId: 's3',
        rung: 'B',
      },
      {
        id: 4,
        text: 'Where do you set plan mode as the default for a project?',
        options: [
          { letter: 'A', text: '`.claude/settings.json`' },
          { letter: 'B', text: '`CLAUDE.md`' },
          { letter: 'C', text: '`package.json`' },
          { letter: 'D', text: 'In the shell environment' },
        ],
        correct: 'A',
        explanation:
          'Set `"permissionMode": "plan"` in `.claude/settings.json`. CLAUDE.md is for prose conventions — not behavioural settings.',
        stageId: 's3',
        rung: 'I',
      },
      {
        id: 5,
        text: 'Claude\'s plan touches 14 files across four directories you never mentioned. The best move is:',
        options: [
          { letter: 'A', text: 'Accept the plan — it knows the codebase' },
          { letter: 'B', text: 'Exit plan mode and re-prompt with a narrower scope' },
          { letter: 'C', text: 'Approve one step at a time' },
          { letter: 'D', text: 'Ask Claude to estimate effort' },
        ],
        correct: 'B',
        explanation:
          'A sprawling plan reflects a vague prompt. Re-prompt with explicit file boundaries ("Only touch `src/parser/`"). Cost: seconds. Cost of approving instead: hours of review.',
        stageId: 's3',
        rung: 'I',
      },
      {
        id: 6,
        text: 'Which of these is NOT a useful constraint to add when shrinking a plan?',
        options: [
          { letter: 'A', text: '"Name only the files you would edit before doing anything."' },
          { letter: 'B', text: '"Only touch `src/lib/`. Leave tests alone."' },
          { letter: 'C', text: '"Be helpful and thorough."' },
          { letter: 'D', text: '"Defer optional refactors — call them out and stop."' },
        ],
        correct: 'C',
        explanation:
          'Vague guidance ("be helpful", "be thorough") widens scope. Useful constraints name paths, list operations, or defer optional work.',
        stageId: 's3',
        rung: 'I',
      },
      {
        id: 7,
        text: 'Claude\'s plan reads "…and also, I noticed the navbar could use a logout button — I\'ll add that too." What does this signal?',
        options: [
          { letter: 'A', text: 'A bug in plan mode' },
          { letter: 'B', text: 'A signal to stop and re-prompt with a tighter scope' },
          { letter: 'C', text: 'Claude is following best practices' },
          { letter: 'D', text: 'The plan is shippable as-is' },
        ],
        correct: 'B',
        explanation:
          'Phrases like "while I\'m here" and "and also" mean scope is leaking. Exit plan mode, narrow the prompt, replan.',
        stageId: 's3',
        rung: 'I',
      },
      {
        id: 8,
        text: 'Plan mode is best suited for:',
        options: [
          { letter: 'A', text: 'One-line typo fixes' },
          { letter: 'B', text: 'Tasks where you want to read the plan before any edits land' },
          { letter: 'C', text: 'Throwaway prototypes' },
          { letter: 'D', text: 'CI runs' },
        ],
        correct: 'B',
        explanation:
          'Plan mode adds a review step. For typos and prototypes the overhead isn\'t worth it. For multi-file changes in unfamiliar code, it pays for itself in one re-prompt.',
        stageId: 's3',
        rung: 'B',
      },
      {
        id: 9,
        text: 'Which of these is **not** a way to enter plan mode?',
        options: [
          { letter: 'A', text: 'Press Shift+Tab in the REPL' },
          { letter: 'B', text: 'Run `/plan` as a slash command' },
          { letter: 'C', text: 'Set `permissionMode: "plan"` in `.claude/settings.json`' },
          { letter: 'D', text: 'Pass `--mode plan` to the `claude` binary' },
        ],
        correct: 'D',
        explanation:
          'There is no `--mode plan` flag. Plan mode is entered via Shift+Tab, the `/plan` slash command, or the `permissionMode` settings key.',
        stageId: 's3',
        rung: 'I',
      },
      {
        id: 10,
        text: 'While in plan mode, can Claude spawn a subagent?',
        options: [
          { letter: 'A', text: 'No — Task is blocked alongside Edit/Write/Bash' },
          { letter: 'B', text: 'Yes — Task is allowed; the subagent also runs in plan mode' },
          { letter: 'C', text: 'Yes — the subagent runs in default mode regardless' },
          { letter: 'D', text: 'Only if `acceptEdits` is on at the same time' },
        ],
        correct: 'B',
        explanation:
          'Task is allowed in plan mode and the spawned subagent inherits the mode — it can read and plan, but not edit.',
        stageId: 's3',
        rung: 'I',
      },
    ],
  },
  {
    id: 's4',
    title: 'S4 — Customising Claude',
    stageId: 's4',
    questions: [
      {
        id: 1,
        text: 'Where do you put project-wide conventions you want Claude to read every turn?',
        options: [
          { letter: 'A', text: 'A `CLAUDE.md` file in the project root' },
          { letter: 'B', text: 'A comment at the top of `package.json`' },
          { letter: 'C', text: 'Your shell `.zshrc`' },
          { letter: 'D', text: 'An environment variable' },
        ],
        correct: 'A',
        explanation:
          'CLAUDE.md is the canonical place. Claude reads it before every turn. Other locations are not visible to Claude.',
        stageId: 's4',
        rung: 'B',
      },
      {
        id: 2,
        text: 'If you have both `~/.claude/CLAUDE.md` and a project `CLAUDE.md`, which does Claude read?',
        options: [
          { letter: 'A', text: 'Only the project one — it overrides' },
          { letter: 'B', text: 'Only the user one — it has priority' },
          { letter: 'C', text: 'Both, in load order' },
          { letter: 'D', text: 'Whichever was created first' },
        ],
        correct: 'C',
        explanation:
          'CLAUDE.md files extend, they don\'t replace. Both load; the project file adds to the user file.',
        stageId: 's4',
        rung: 'B',
      },
      {
        id: 3,
        text: 'Where do slash command files live?',
        options: [
          { letter: 'A', text: '`.claude/commands/<name>.md`' },
          { letter: 'B', text: '`~/.claude/scripts/<name>.sh`' },
          { letter: 'C', text: 'Inline in `CLAUDE.md`' },
          { letter: 'D', text: '`./commands/<name>.json`' },
        ],
        correct: 'A',
        explanation:
          'Slash commands are markdown files under `.claude/commands/`. The filename becomes the command name (no extension).',
        stageId: 's4',
        rung: 'B',
      },
      {
        id: 4,
        text: 'You save `.claude/commands/lint-fix.md`. How do you invoke it?',
        options: [
          { letter: 'A', text: 'Type `/lint-fix` in the REPL' },
          { letter: 'B', text: 'Type `@lint-fix` in the REPL' },
          { letter: 'C', text: 'Run `claude lint-fix` from your shell' },
          { letter: 'D', text: 'It runs automatically on every turn' },
        ],
        correct: 'A',
        explanation:
          'Slash commands are invoked with the `/` prefix and the filename. Newly added commands may need a session restart to register.',
        stageId: 's4',
        rung: 'B',
      },
      {
        id: 5,
        text: 'What does the status line at the bottom of the terminal usually show?',
        options: [
          { letter: 'A', text: 'Working directory, model, branch, permission mode' },
          { letter: 'B', text: 'The full conversation history' },
          { letter: 'C', text: 'A scrolling log of every tool call' },
          { letter: 'D', text: 'Your shell aliases' },
        ],
        correct: 'A',
        explanation:
          'The status line is a compact reference. Configurable via `.claude/settings.json` under the `statusLine` key.',
        stageId: 's4',
        rung: 'B',
      },
      {
        id: 6,
        text: 'What is the key behavioural difference between a skill and a slash command?',
        options: [
          { letter: 'A', text: 'Skills are read-only; slash commands can edit files' },
          { letter: 'B', text: 'Skills fire on phrasing (triggers); slash commands fire on explicit invocation' },
          { letter: 'C', text: 'Skills run remotely; slash commands run locally' },
          { letter: 'D', text: 'Skills are versioned; slash commands aren\'t' },
        ],
        correct: 'B',
        explanation:
          'Skills load when the user\'s prose matches their triggers — no `/command` to remember. Slash commands require the user to type the name.',
        stageId: 's4',
        rung: 'I',
      },
      {
        id: 7,
        text: 'What must a skill\'s `SKILL.md` frontmatter include at minimum?',
        options: [
          { letter: 'A', text: '`name`, `description`, `triggers`' },
          { letter: 'B', text: 'Just `name`' },
          { letter: 'C', text: '`version`, `author`, `license`' },
          { letter: 'D', text: '`model`, `temperature`' },
        ],
        correct: 'A',
        explanation:
          '`name`, `description`, and `triggers` are the load-bearing fields. Without triggers, the skill can\'t fire on phrasing.',
        stageId: 's4',
        rung: 'I',
      },
      {
        id: 8,
        text: 'A subdirectory `CLAUDE.md` is in conflict with the project-root `CLAUDE.md`. What happens?',
        options: [
          { letter: 'A', text: 'The subdir file replaces the root file for that subtree' },
          { letter: 'B', text: 'The root file silently wins' },
          { letter: 'C', text: 'Both files load — the subdir rules are additional context Claude balances against the root' },
          { letter: 'D', text: 'Claude errors out and refuses to start' },
        ],
        correct: 'C',
        explanation:
          'CLAUDE.md files extend, they don\'t replace. Conflicts are part of the prose Claude reads; phrase your subtree rules so they make sense alongside the root.',
        stageId: 's4',
        rung: 'I',
      },
      {
        id: 9,
        text: 'Your team wants a recipe that runs whenever a PR description includes a database migration. The right shape is:',
        options: [
          { letter: 'A', text: 'A slash command `/migration-review`' },
          { letter: 'B', text: 'A skill with appropriate triggers' },
          { letter: 'C', text: 'A rule in `CLAUDE.md`' },
          { letter: 'D', text: 'An output style' },
        ],
        correct: 'B',
        explanation:
          'Triggered behaviour ≈ skill. The user shouldn\'t need to remember a command name when the situation itself signals what to do.',
        stageId: 's4',
        rung: 'I',
      },
      {
        id: 10,
        text: 'When does a custom output style earn its keep?',
        options: [
          { letter: 'A', text: 'Never — they\'re cosmetic' },
          { letter: 'B', text: 'When a recurring context calls for a different conversational posture (e.g. structured code review vs. terse refactor)' },
          { letter: 'C', text: 'On every new project' },
          { letter: 'D', text: 'Only in CI' },
        ],
        correct: 'B',
        explanation:
          'Output styles let you pre-load a posture — verbose for design discussions, terse for code edits, structured for reviews. Switch with `/style`.',
        stageId: 's4',
        rung: 'I',
      },
    ],
  },
  {
    id: 's5',
    title: 'S5 — Memory & sessions',
    stageId: 's5',
    questions: [
      {
        id: 1,
        text: 'What\'s the simplest way to reset a Claude Code session to a blank state?',
        options: [
          { letter: 'A', text: '`/clear`' },
          { letter: 'B', text: '`/compact`' },
          { letter: 'C', text: '`/restart`' },
          { letter: 'D', text: '`/reset`' },
        ],
        correct: 'A',
        explanation:
          '`/clear` drops the current session. CLAUDE.md still loads on the next turn, so project conventions survive.',
        stageId: 's5',
        rung: 'B',
      },
      {
        id: 2,
        text: 'What does `/compact` do?',
        options: [
          { letter: 'A', text: 'Compresses the project on disk' },
          { letter: 'B', text: 'Summarises prior turns into a short paragraph and frees tokens' },
          { letter: 'C', text: 'Closes the session and starts a new one' },
          { letter: 'D', text: 'Reduces the model temperature' },
        ],
        correct: 'B',
        explanation:
          '`/compact` is the in-place summary command. You keep the thread of the work; you free tokens for the next leg.',
        stageId: 's5',
        rung: 'B',
      },
      {
        id: 3,
        text: 'True or false: After `/clear`, CLAUDE.md still loads on the next turn.',
        options: [
          { letter: 'A', text: 'True — CLAUDE.md is project state, not session state' },
          { letter: 'B', text: 'False — `/clear` drops everything' },
          { letter: 'C', text: 'Only if you set a flag' },
          { letter: 'D', text: 'Only the root CLAUDE.md reloads; subdir files don\'t' },
        ],
        correct: 'A',
        explanation:
          'CLAUDE.md is loaded fresh on every session. `/clear` resets conversation history, not project configuration.',
        stageId: 's5',
        rung: 'B',
      },
      {
        id: 4,
        text: 'Is `/compact` lossless?',
        options: [
          { letter: 'A', text: 'Yes — the summary is byte-perfect' },
          { letter: 'B', text: 'No — specific details (line numbers, exact strings) can drop' },
          { letter: 'C', text: 'Only for short sessions' },
          { letter: 'D', text: 'Only when Claude is in plan mode' },
        ],
        correct: 'B',
        explanation:
          'Compaction is lossy. Verify any specific value you want to rely on after compacting — or write it to memory before you compact.',
        stageId: 's5',
        rung: 'I',
      },
      {
        id: 5,
        text: 'You want a note to survive across sessions. Where should it go?',
        options: [
          { letter: 'A', text: 'In the current chat — just say it out loud' },
          { letter: 'B', text: 'In the project memory file (`/memory` or `/remember`)' },
          { letter: 'C', text: 'In your shell history' },
          { letter: 'D', text: 'In a comment in your code' },
        ],
        correct: 'B',
        explanation:
          'Memory is the persistent file for cross-session facts. CLAUDE.md is also persistent but is for *project* conventions, not personal mid-task notes.',
        stageId: 's5',
        rung: 'I',
      },
      {
        id: 6,
        text: 'You walked away from work yesterday and want to continue today. The right command is:',
        options: [
          { letter: 'A', text: '`/restore`' },
          { letter: 'B', text: '`/load`' },
          { letter: 'C', text: '`/resume`' },
          { letter: 'D', text: '`/replay`' },
        ],
        correct: 'C',
        explanation:
          '`/resume` lists prior sessions for the current project. Pick one to load the context back in.',
        stageId: 's5',
        rung: 'I',
      },
      {
        id: 7,
        text: 'Which split between `CLAUDE.md` and `/memory` is correct?',
        options: [
          { letter: 'A', text: '`CLAUDE.md` = personal scratch; `/memory` = team conventions' },
          { letter: 'B', text: '`CLAUDE.md` = project conventions everyone needs; `/memory` = personal mid-task notes' },
          { letter: 'C', text: 'Both are interchangeable' },
          { letter: 'D', text: '`CLAUDE.md` lives in `.claude/`; `/memory` lives at the project root' },
        ],
        correct: 'B',
        explanation:
          'CLAUDE.md is read by Claude on every turn for every contributor. Memory is read on every session but is personal in spirit — scratch you don\'t want to lose.',
        stageId: 's5',
        rung: 'I',
      },
      {
        id: 8,
        text: 'A common anti-pattern is:',
        options: [
          { letter: 'A', text: 'Using `/compact` after every turn' },
          { letter: 'B', text: 'Reflexive `/clear` mid-task — loses the thread' },
          { letter: 'C', text: 'Writing project conventions in `CLAUDE.md`' },
          { letter: 'D', text: 'Exiting at the end of the day' },
        ],
        correct: 'B',
        explanation:
          '`/clear` mid-task means you\'ll re-explain everything next turn. That\'s `/compact` you wanted.',
        stageId: 's5',
        rung: 'I',
      },
      {
        id: 9,
        text: 'Can `/resume` reduce the context tokens of the current session?',
        options: [
          { letter: 'A', text: 'Yes — it replaces the current session with a smaller one' },
          { letter: 'B', text: 'No — `/resume` *adds* context by loading a prior session' },
          { letter: 'C', text: 'Yes, but only if the prior session was compacted' },
          { letter: 'D', text: 'Only if you pass `--lite`' },
        ],
        correct: 'B',
        explanation:
          '`/resume` reloads a prior session. Use `/compact` immediately after if you\'re near the edge.',
        stageId: 's5',
        rung: 'I',
      },
      {
        id: 10,
        text: 'You\'re refactoring all afternoon. The bar fills up. You hit `/compact`. Now you need a specific line number from earlier. What\'s the most reliable move?',
        options: [
          { letter: 'A', text: 'Trust the compacted summary — Claude remembers it' },
          { letter: 'B', text: 'Verify by re-running the search yourself; if the line number was important, ideally you\'d have `/remember`-ed it before compacting' },
          { letter: 'C', text: 'Run `/uncompact`' },
          { letter: 'D', text: '`/resume` the pre-compact session' },
        ],
        correct: 'B',
        explanation:
          'Compaction is lossy — specifics may drop. Verify, or write important facts to memory before compacting. There is no `/uncompact`.',
        stageId: 's5',
        rung: 'I',
      },
    ],
  },
  {
    id: 's6',
    title: 'S6 — Delegating',
    stageId: 's6',
    questions: [
      {
        id: 1,
        text: 'What tool does Claude use to spawn a subagent?',
        options: [
          { letter: 'A', text: '`Task`' },
          { letter: 'B', text: '`Spawn`' },
          { letter: 'C', text: '`Delegate`' },
          { letter: 'D', text: '`Subagent`' },
        ],
        correct: 'A',
        explanation:
          'The `Task` tool dispatches a subagent. Calling it spins up a new Claude process with its own context.',
        stageId: 's6',
        rung: 'B',
      },
      {
        id: 2,
        text: 'A subagent\'s context window is:',
        options: [
          { letter: 'A', text: 'Shared with the main session' },
          { letter: 'B', text: 'Fresh and isolated — only the reply returns to the main session' },
          { letter: 'C', text: 'A read-only view of the main session' },
          { letter: 'D', text: 'The same window resized smaller' },
        ],
        correct: 'B',
        explanation:
          'Isolation is the point. The subagent reads, thinks, and acts in its own context; only the final reply lands back in the main session.',
        stageId: 's6',
        rung: 'B',
      },
      {
        id: 3,
        text: 'Which built-in subagent is best for "find every component that imports `useAuth`"?',
        options: [
          { letter: 'A', text: '`Explore`' },
          { letter: 'B', text: '`Plan`' },
          { letter: 'C', text: '`general-purpose`' },
          { letter: 'D', text: 'No subagent — call Grep yourself' },
        ],
        correct: 'A',
        explanation:
          'Explore is the read-only search specialist. It returns a small reply (just the references), so it wins on isolation alone.',
        stageId: 's6',
        rung: 'B',
      },
      {
        id: 4,
        text: 'You dispatch three subagents in parallel. They take 8s, 14s, and 22s. What\'s the wall-clock time?',
        options: [
          { letter: 'A', text: '44s — sum of all' },
          { letter: 'B', text: '14s — the median' },
          { letter: 'C', text: '22s — the slowest spoke' },
          { letter: 'D', text: '8s — the fastest spoke' },
        ],
        correct: 'C',
        explanation:
          'Parallel dispatch waits for every spoke; the slowest one bounds the wall-clock. Same three spokes serial would be 44s.',
        stageId: 's6',
        rung: 'I',
      },
      {
        id: 5,
        text: 'What\'s the canonical parallel-dispatch anti-pattern?',
        options: [
          { letter: 'A', text: '`Promise.all` that rejects if any spoke fails' },
          { letter: 'B', text: 'Spawning more than three subagents in one turn' },
          { letter: 'C', text: 'Mixing built-in and project-specific subagents' },
          { letter: 'D', text: 'Letting subagents call other subagents' },
        ],
        correct: 'A',
        explanation:
          '`Promise.all` rejects on first failure — one bad spoke sinks the turn. Use settled-style dispatch so other spokes\' results still come back.',
        stageId: 's6',
        rung: 'I',
      },
      {
        id: 6,
        text: 'Where do project-specific subagent definitions live?',
        options: [
          { letter: 'A', text: '`.claude/agents/<name>/AGENT.md`' },
          { letter: 'B', text: '`.claude/skills/<name>/SKILL.md`' },
          { letter: 'C', text: '`.claude/commands/<name>.md`' },
          { letter: 'D', text: 'In `CLAUDE.md` under an `agents:` key' },
        ],
        correct: 'A',
        explanation:
          'Project subagents are markdown files under `.claude/agents/`. Same shape as skills, but they spawn separate Claude processes.',
        stageId: 's6',
        rung: 'I',
      },
      {
        id: 7,
        text: 'A subagent finishes. What lives on in the main session?',
        options: [
          { letter: 'A', text: 'Its entire context and tool calls' },
          { letter: 'B', text: 'Only the final reply text' },
          { letter: 'C', text: 'A summary written by the system' },
          { letter: 'D', text: 'Nothing — the subagent is fire-and-forget' },
        ],
        correct: 'B',
        explanation:
          'The subagent\'s intermediate work vanishes — that\'s the win. The main session sees only the final reply, which it treats as one more turn of conversation.',
        stageId: 's6',
        rung: 'I',
      },
      {
        id: 8,
        text: 'Worst candidate for spawning a subagent:',
        options: [
          { letter: 'A', text: 'Audit 100 files for a security pattern' },
          { letter: 'B', text: 'Fix a typo on `src/foo.ts:42`' },
          { letter: 'C', text: 'Research three independent design options in parallel' },
          { letter: 'D', text: 'Find every call site of `parseEvent`' },
        ],
        correct: 'B',
        explanation:
          'A one-line typo fix wants the main session. The other three benefit from isolation or parallelism — a subagent earns its keep on them.',
        stageId: 's6',
        rung: 'I',
      },
      {
        id: 9,
        text: 'Subagent vs skill — which framing is right?',
        options: [
          { letter: 'A', text: 'They\'re the same thing with different names' },
          { letter: 'B', text: 'Subagent = a new Claude process with its own context; skill = a prompt + files loaded into the main agent on demand' },
          { letter: 'C', text: 'Subagent runs on the API; skill runs locally' },
          { letter: 'D', text: 'Subagent costs more; skill is free' },
        ],
        correct: 'B',
        explanation:
          'Skills shape the main agent. Subagents are new agents. Same `.claude/` directory, very different runtime shape.',
        stageId: 's6',
        rung: 'A',
      },
      {
        id: 10,
        text: 'A "background task" in Claude Code is:',
        options: [
          { letter: 'A', text: 'A subagent that runs without blocking the REPL — its result lands later' },
          { letter: 'B', text: 'A cron-style scheduled job' },
          { letter: 'C', text: 'A daemon process Claude leaves running' },
          { letter: 'D', text: 'A long-running tool call' },
        ],
        correct: 'A',
        explanation:
          'Background tasks are long-running subagents the main session dispatches without waiting on. The result is collected when you next prompt.',
        stageId: 's6',
        rung: 'A',
      },
    ],
  },
  {
    id: 's7',
    title: 'S7 — Extending',
    stageId: 's7',
    questions: [
      {
        id: 1,
        text: 'What does an MCP server add to Claude Code?',
        options: [
          { letter: 'A', text: 'New tools Claude can call (e.g. `github.get_pr`, `linear.update_status`)' },
          { letter: 'B', text: 'More tokens in the context window' },
          { letter: 'C', text: 'A different model under the hood' },
          { letter: 'D', text: 'Hooks that fire on events' },
        ],
        correct: 'A',
        explanation:
          'MCP servers expose remote tools to Claude. They become part of the roster the model can call, alongside Read/Edit/Bash.',
        stageId: 's7',
        rung: 'B',
      },
      {
        id: 2,
        text: 'Which file holds project-scoped MCP server configuration?',
        options: [
          { letter: 'A', text: '`.mcp.json` (committed)' },
          { letter: 'B', text: '`CLAUDE.md`' },
          { letter: 'C', text: '`.claude/mcp.json`' },
          { letter: 'D', text: '`package.json`' },
        ],
        correct: 'A',
        explanation:
          'Project servers live in `.mcp.json` at the repo root, committed alongside the code. Personal servers (with credentials) go in your user config.',
        stageId: 's7',
        rung: 'B',
      },
      {
        id: 3,
        text: 'Hook events fire at four moments. Which of these is NOT one of them?',
        options: [
          { letter: 'A', text: '`preToolUse`' },
          { letter: 'B', text: '`postToolUse`' },
          { letter: 'C', text: '`onTokenLimit`' },
          { letter: 'D', text: '`stop`' },
        ],
        correct: 'C',
        explanation:
          'The four event names are `preToolUse`, `postToolUse`, `stop`, and `userPromptSubmit`. There is no token-limit event.',
        stageId: 's7',
        rung: 'B',
      },
      {
        id: 4,
        text: 'Hooks live in:',
        options: [
          { letter: 'A', text: '`.claude/settings.json`' },
          { letter: 'B', text: '`.mcp.json`' },
          { letter: 'C', text: '`.claude/hooks.json`' },
          { letter: 'D', text: 'A `hooks:` key inside `CLAUDE.md`' },
        ],
        correct: 'A',
        explanation:
          'Hooks are part of `.claude/settings.json` under the `hooks` key. They live alongside permission allow/deny lists.',
        stageId: 's7',
        rung: 'B',
      },
      {
        id: 5,
        text: 'When is MCP probably overkill?',
        options: [
          { letter: 'A', text: 'You need a one-off lookup for this PR only' },
          { letter: 'B', text: 'The system has no other access path' },
          { letter: 'C', text: 'The lookup is recurring' },
          { letter: 'D', text: 'You need narrower tools than a Bash escape hatch' },
        ],
        correct: 'A',
        explanation:
          'MCP tokens cost every prompt; one-off lookups should use Bash or the web. Recurring use + no-other-path + narrower-permissions are the cases that pay for MCP.',
        stageId: 's7',
        rung: 'I',
      },
      {
        id: 6,
        text: 'The difference between a CLAUDE.md rule and a hook is:',
        options: [
          { letter: 'A', text: 'CLAUDE.md is prose Claude reads; a hook is a script the runtime enforces' },
          { letter: 'B', text: 'CLAUDE.md is faster; hooks are slower' },
          { letter: 'C', text: 'They\'re the same — both end up as system-prompt text' },
          { letter: 'D', text: 'Hooks run on the API; CLAUDE.md runs locally' },
        ],
        correct: 'A',
        explanation:
          'CLAUDE.md is guidance Claude can ignore or reinterpret. A hook is a deterministic gate the runtime executes — for "must" and "must-not" rules, hooks beat prose.',
        stageId: 's7',
        rung: 'I',
      },
      {
        id: 7,
        text: 'A common `preToolUse(Bash)` hook is:',
        options: [
          { letter: 'A', text: 'A script that rejects destructive shell commands (`rm -rf`, `git push --force`)' },
          { letter: 'B', text: 'A script that runs the linter' },
          { letter: 'C', text: 'A script that opens an editor' },
          { letter: 'D', text: 'A script that prints the prompt history' },
        ],
        correct: 'A',
        explanation:
          'A pre-hook on Bash inspects the command and can refuse it. Useful as a guardrail in shared or CI contexts.',
        stageId: 's7',
        rung: 'I',
      },
      {
        id: 8,
        text: 'A common `postToolUse(Edit)` hook is:',
        options: [
          { letter: 'A', text: 'Auto-run lint / format on the edited file' },
          { letter: 'B', text: 'Reject the edit if it touches more than 10 lines' },
          { letter: 'C', text: 'Send a Slack message' },
          { letter: 'D', text: 'Open the file in your editor' },
        ],
        correct: 'A',
        explanation:
          'Post-hooks run after the action lands. Auto-lint after each Edit keeps the working tree healthy without a prompt asking for it.',
        stageId: 's7',
        rung: 'I',
      },
      {
        id: 9,
        text: 'Project-scoped MCP servers vs user-scoped — what\'s the right split?',
        options: [
          { letter: 'A', text: 'Project: committed, shared with teammates. User: uncommitted, your credentials.' },
          { letter: 'B', text: 'Project: read-only servers. User: read/write servers.' },
          { letter: 'C', text: 'Project: free. User: paid.' },
          { letter: 'D', text: 'There\'s no real difference; pick whichever' },
        ],
        correct: 'A',
        explanation:
          'Project scope is for shared, reproducible setups. User scope holds anything personal — your auth tokens, your CLI shortcuts.',
        stageId: 's7',
        rung: 'A',
      },
      {
        id: 10,
        text: 'IDE integrations (VS Code, JetBrains) are:',
        options: [
          { letter: 'A', text: 'Wrappers around the CLI — the REPL with an editor pane' },
          { letter: 'B', text: 'A separate product with its own model' },
          { letter: 'C', text: 'Faster than the CLI' },
          { letter: 'D', text: 'Required for skills to work' },
        ],
        correct: 'A',
        explanation:
          'The CLI is the canonical surface; the IDE extensions wrap it and add editor-friendly affordances. Skills, slash commands, MCP, and hooks all work the same in both.',
        stageId: 's7',
        rung: 'A',
      },
    ],
  },
  {
    id: 's8',
    title: 'S8 — Beyond the REPL',
    stageId: 's8',
    questions: [
      {
        id: 1,
        text: 'Which flag turns `claude` into a one-shot, non-interactive call?',
        options: [
          { letter: 'A', text: '`-p` (or `--print`)' },
          { letter: 'B', text: '`-x`' },
          { letter: 'C', text: '`--script`' },
          { letter: 'D', text: '`--once`' },
        ],
        correct: 'A',
        explanation:
          '`-p` is the headless flag. The prompt comes after, the reply prints, the process exits.',
        stageId: 's8',
        rung: 'B',
      },
      {
        id: 2,
        text: 'Which flag returns structured JSON instead of human-readable text?',
        options: [
          { letter: 'A', text: '`--output-format json`' },
          { letter: 'B', text: '`--json`' },
          { letter: 'C', text: '`--format=json`' },
          { letter: 'D', text: '`--structured`' },
        ],
        correct: 'A',
        explanation:
          '`--output-format json` wraps the reply in a parseable envelope (`session_id`, `result`, `duration_ms`, `is_error`).',
        stageId: 's8',
        rung: 'B',
      },
      {
        id: 3,
        text: 'In the JSON output envelope, which field holds the actual answer text?',
        options: [
          { letter: 'A', text: '`.result`' },
          { letter: 'B', text: '`.text`' },
          { letter: 'C', text: '`.content`' },
          { letter: 'D', text: '`.body`' },
        ],
        correct: 'A',
        explanation:
          'The answer lives on `.result`. Other fields hold metadata: `session_id`, `total_cost_usd`, `duration_ms`, `is_error`.',
        stageId: 's8',
        rung: 'B',
      },
      {
        id: 4,
        text: 'The official GitHub Action for headless Claude is:',
        options: [
          { letter: 'A', text: '`anthropics/claude-code-action`' },
          { letter: 'B', text: '`claude/github-action`' },
          { letter: 'C', text: '`actions/claude`' },
          { letter: 'D', text: 'You write your own; no official one exists' },
        ],
        correct: 'A',
        explanation:
          '`anthropics/claude-code-action` wraps headless mode for PR reviews and triage. It honours `.claude/settings.json` from your repo.',
        stageId: 's8',
        rung: 'B',
      },
      {
        id: 5,
        text: 'Which jq snippet extracts the answer text from the JSON envelope?',
        options: [
          { letter: 'A', text: '`jq -r .result`' },
          { letter: 'B', text: '`jq .text`' },
          { letter: 'C', text: '`jq .[0]`' },
          { letter: 'D', text: '`jq -c .answer`' },
        ],
        correct: 'A',
        explanation:
          '`jq -r .result` extracts the answer as raw string (no surrounding quotes). Perfect for piping into a bash variable.',
        stageId: 's8',
        rung: 'I',
      },
      {
        id: 6,
        text: '`--allowed-tools Read,Grep,Glob` does what?',
        options: [
          { letter: 'A', text: 'Restricts which tools Claude may call for this run' },
          { letter: 'B', text: 'Forces Claude to call all three at least once' },
          { letter: 'C', text: 'Documents the tools for the JSON output' },
          { letter: 'D', text: 'Loads aliases for those three tools' },
        ],
        correct: 'A',
        explanation:
          '`--allowed-tools` is a per-invocation whitelist. Use it in CI to keep Edit, Write, and Bash off the table even if the prompt asks for them.',
        stageId: 's8',
        rung: 'I',
      },
      {
        id: 7,
        text: 'Combining `--allowed-tools Read,Grep,Glob` and `--permission-mode plan` in a CI run is:',
        options: [
          { letter: 'A', text: 'Defence in depth — two layers blocking writes' },
          { letter: 'B', text: 'Redundant — they\'re the same thing' },
          { letter: 'C', text: 'A conflict — Claude will refuse to start' },
          { letter: 'D', text: 'Only valid with `--output-format json`' },
        ],
        correct: 'A',
        explanation:
          'Allow-list is "these tools only"; plan mode is "no edits regardless". Belt and braces — both have to fail before something bad happens.',
        stageId: 's8',
        rung: 'I',
      },
      {
        id: 8,
        text: 'Which task is BEST suited to headless mode?',
        options: [
          { letter: 'A', text: 'A nightly job that summarises new commits' },
          { letter: 'B', text: 'A debugging session with back-and-forth' },
          { letter: 'C', text: 'First-day exploration of an unfamiliar repo' },
          { letter: 'D', text: 'Pair programming over screen share' },
        ],
        correct: 'A',
        explanation:
          'Headless is batch — one prompt, one reply. Nightly summaries, CI reviews, scheduled audits all fit. Interactive shapes belong in the REPL.',
        stageId: 's8',
        rung: 'I',
      },
      {
        id: 9,
        text: 'In a CI pipeline, what does `.claude/settings.json` get you that flags don\'t?',
        options: [
          { letter: 'A', text: 'Per-event hooks (preToolUse, postToolUse, stop) — flags don\'t cover these' },
          { letter: 'B', text: 'Nothing — flags and settings are equivalent' },
          { letter: 'C', text: 'A pretty UI' },
          { letter: 'D', text: 'API key storage' },
        ],
        correct: 'A',
        explanation:
          'Flags are run-shaped (allow-list, output format). Hooks live in settings and run on events — that\'s the layer that catches `rm -rf` even if the prompt insists.',
        stageId: 's8',
        rung: 'A',
      },
      {
        id: 10,
        text: 'The clearest framing for headless vs REPL is:',
        options: [
          { letter: 'A', text: 'Headless is batch (one-shot); REPL is interactive (back-and-forth). Pick by the shape of the work.' },
          { letter: 'B', text: 'Headless is for advanced users; REPL is for beginners' },
          { letter: 'C', text: 'Headless is cheaper per token' },
          { letter: 'D', text: 'They\'re identical; pick by preference' },
        ],
        correct: 'A',
        explanation:
          'The right mode depends on whether the task is one-shot or conversational. Nightly summary → headless. Debugging session → REPL.',
        stageId: 's8',
        rung: 'A',
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
