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

const S3_BODY = `# Steering Claude

Claude is happy to make sweeping changes. That's a problem when "rename this function" turns into "I noticed three other things while I was in there." **Plan mode** is how you slow Claude down — read first, edit later, and only the things you actually asked for.

## What plan mode is

Plan mode is a permission posture. While it's active, Claude can read your project (Read, Grep, Glob) but cannot edit, write, or run shell commands. You ask for the change; Claude produces a step-by-step plan with the files it would touch and the operations it would perform. **Nothing happens to your project until you exit plan mode.**

Three ways to enter:

- **Shift+Tab** cycles through the permission modes in the running REPL. Each press shows the new mode in the status line.
- **\`/plan\`** is a slash command that switches the current session into plan mode.
- **\`permissionMode: "plan"\`** in \`.claude/settings.json\` makes plan mode the default when you start \`claude\` in this project.

To leave plan mode, hit Shift+Tab again to cycle out.

## What Claude can — and can't — do

| Tool | In plan mode |
|---|---|
| Read | ✓ |
| Grep | ✓ |
| Glob | ✓ |
| Task | ✓ — the subagent inherits the mode |
| Edit | ✗ |
| Write | ✗ |
| Bash | ✗ |

WebFetch and WebSearch are read-only and remain available. The shape of Claude's answer is the same in plan mode — a step-by-step plan. The difference is whether the side effects happen.

## What a good plan looks like

A useful plan is **scoped**, **specific**, and **shippable in one pass**.

- **Scoped** — it touches files that map to the request, not "while I was looking."
- **Specific** — each step names a file and what changes.
- **Shippable** — at the end, you'd have a self-contained change you could commit.

A bad plan rambles. It branches into refactors you didn't ask for. It says things like "and also, I noticed…" — that's the signal to re-prompt and shrink.

## Re-prompting to shrink a plan

If the plan is too big, the fix is upstream — sharpen the prompt. Useful moves:

- **Constrain the scope explicitly.** "Only touch files under \`src/foo/\`."
- **Name the files.** "Edit \`lib/parser.ts\` and its tests, nothing else."
- **Defer the optional work.** "Don't refactor the helpers, just make this one call site correct."
- **Ask for the plan as a checklist.** "List the edits as 1, 2, 3 with file paths."

Re-prompt, accept the smaller plan, exit plan mode, let Claude apply it.

## When to stop and rescope

There's a moment in plan mode when you should stop:

- The plan touches files outside the area you described.
- The plan branches into independent work (a rename **and** a bug fix **and** a new test).
- The plan keeps saying "and also" or "while I'm here."
- The plan estimates more edits than you can review in one sitting.

When any of those happen, exit plan mode, write a sharper prompt, start again. The cost of a re-prompt is small. The cost of accepting a sprawling plan is hours of review — or worse, merged code you didn't intend.

## A note on slash commands

Once you're comfortable with plan mode, you can wrap a "plan-this" pattern into a custom slash command — that's stage 4. For now: Shift+Tab, look at the plan, ship the change.
`;

const S4_BODY = `# Customising Claude

Claude is good out of the box. It gets *yours* when you teach it your project's conventions. The teaching surface has four parts: **CLAUDE.md** (prose conventions), **slash commands** (prompt shortcuts), **skills** (loaded on demand), and **output styles / status line** (how Claude responds and what it shows).

## CLAUDE.md — the canonical place

\`CLAUDE.md\` is a markdown file in your project root. Claude reads it before every turn. Use it for:

- The shape of your codebase ("controllers are in \`src/api/\`, types in \`src/types/\`").
- Rules and conventions ("never commit directly to main", "use 2-space indent").
- Reminders that would otherwise need a re-prompt every session.

Three locations, in load order:

| Location | Scope | When it loads |
|---|---|---|
| \`~/.claude/CLAUDE.md\` | User-wide | Every Claude Code session, every project |
| \`CLAUDE.md\` (project root) | Project-wide | Sessions started in this project |
| \`<subdir>/CLAUDE.md\` | Subtree | When work touches this subtree |

**Files extend, they don't replace.** A subdirectory CLAUDE.md adds to the root's rules; it doesn't shadow them. Closer files give *more specific* guidance.

## Slash commands — quick prompt shortcuts

A slash command is a markdown file in \`.claude/commands/\`. The filename becomes the command name. The body becomes the prompt.

\`\`\`markdown
---
description: Run lint and fix what's safe to fix.
---

Run \`npm run lint\`. For each issue, if it's auto-fixable, apply the fix. For each that isn't, list the file and line for the user.
\`\`\`

Save this as \`.claude/commands/lint-fix.md\` and type \`/lint-fix\` in the REPL — Claude runs the body as your prompt.

Use slash commands for **anything you'd otherwise type the same way twice**.

## Skills — loaded on demand

A skill is a directory in \`.claude/skills/<name>/\` with a \`SKILL.md\` and optional supporting files. Like a slash command, but with **triggers** — Claude loads the skill automatically when the user's prose matches.

\`\`\`markdown
---
name: sql-review
description: Review SQL migrations for safety
triggers: ["migration", "schema change", "ALTER TABLE"]
---

When the user asks about a SQL change, check for: locking risk on large tables, backfill plans, …
\`\`\`

Skills are how teams ship reusable, conditional behaviour. The trigger keywords mean the user doesn't have to remember a slash command name — they just describe the situation.

**Skill vs. slash command:** if a routine fires on phrasing ("review this SQL"), it's a skill. If it fires on an explicit shortcut (\`/lint-fix\`), it's a slash command. Skills are the better default for team conventions.

## Output styles — how Claude talks

An output style is a \`.claude/output-styles/*.md\` file. Each one is a different conversational posture — terse, verbose, code-only, code-review-mode. Switch styles when context changes (deep refactor → terse; code review → structured).

Set one as default in \`.claude/settings.json\`; switch mid-session with the \`/style\` command.

## The status line — quick reference

The status line at the bottom of your terminal shows the current working directory, model, branch, and permission mode. It's configurable via \`.claude/settings.json\`'s \`statusLine\` key. Worth knowing about; rarely worth customising on day one.

## A minimum starter pack

If you want to set up a new project today:

1. **\`CLAUDE.md\`** at the root — three or four lines describing the project shape and one or two strict conventions.
2. **One slash command** — pick the prompt you find yourself typing weekly.
3. **One skill** — the routine you wish your team would always follow.

That's enough to feel the win. Add more as the patterns surface.
`;

const S5_BODY = `# Memory & sessions

Long tasks span multiple turns. Each turn adds to the context — the model's running view of the conversation. Eventually you hit the context window's edge. Knowing what to do at that moment is the difference between a productive day and an exasperating one.

## The mental model

Think of context as a sliding window of recent conversation. Every prompt, every tool call, every diff lives in there. When the window fills, Claude either summarises earlier turns or refuses to add more.

Claude Code gives you four levers to manage this:

| Command | What it does | When to reach for it |
|---|---|---|
| \`/clear\` | Drops everything. Start a fresh session. | Switching tasks. Nothing prior is relevant. |
| \`/compact\` | Summarises prior turns. Keeps continuity, frees tokens. | Same task, context is heavy, you still need the thread. |
| \`/resume\` | Loads a past session by id. | You walked away and came back. |
| \`/memory\` | Opens the persistent project memory file. | The fact survives sessions — write it once, read forever. |

## /clear

Hard reset. Everything in the current session is gone. Use it when you genuinely want a blank slate — when "and now do this unrelated thing" would only be confusing carrying the prior context.

After \`/clear\`, CLAUDE.md still loads on the next turn. Your project conventions don't depend on session state.

## /compact

The under-used hero. Claude takes the prior turns, summarises them into a short paragraph, and replaces the verbose log with that summary. You keep the thread of the work; you free tokens for the next leg.

Compaction is **lossy**. Specific values can disappear ("the bug was on line 47" might become "a bug was found"). Verify before relying on a remembered detail.

## /resume

If you started a session yesterday and want to continue it today, \`/resume\` lists past sessions for the current project. Pick one and Claude loads the prior context back in.

\`/resume\` is the only command that *adds* context — it doesn't free anything. If you're resuming into a session that was already near the edge, reach for \`/compact\` immediately after.

## /memory

A persistent file Claude reads on every session in this project. Use it for facts that should survive across sessions but don't belong in CLAUDE.md.

A good split:

| Goes in CLAUDE.md | Goes in memory |
|---|---|
| Project conventions (style, structure) | Things you've learned this week |
| Things every contributor needs to know | Things only you need to remember |
| Stable knowledge | Mid-task notes |

\`/memory\` opens the memory file in your editor. You can write to it yourself; Claude can write to it via \`/remember <fact>\`.

## A decision tree

Claude shows you the context bar is 80% full. You should:

1. **Same task, will keep going?** → \`/compact\`.
2. **New unrelated task?** → \`/clear\`.
3. **Walking away?** → just exit. Your session persists; \`/resume\` brings it back.

If you ever find yourself hitting \`/clear\` mid-task and re-explaining context, that's \`/compact\` you wanted.

## Anti-patterns

- **Reflexive \`/clear\` mid-task** — loses the thread you actually need.
- **Compacting too early** — pointless if you've only had two turns.
- **Putting mid-task notes in CLAUDE.md** — it gets read by everyone, every turn. Use memory for personal scratch.
- **Treating /memory like a journal** — it's a memory, not a log. Write the *fact* you want to recall, not the story of finding it.

## A note ahead

Stage 6 covers **subagents** — when Claude spawns helper agents with their own context windows. The lifecycle commands here apply to your main session; subagent contexts get cleaned up automatically when each subagent returns.
`;

const S6_BODY = `# Delegating

A **subagent** is Claude spawning another Claude. The new instance gets its own task, its own context window, its own tool roster — and it returns a result to the main session. It's the difference between "Claude does it" and "Claude delegates and reports back."

## What a subagent actually is

When Claude calls the **Task** tool, it kicks off a separate Claude process with its own:

- System prompt (a specialised role).
- Context window (clean, fresh).
- Tool roster (often a subset of the parent's).
- Independent reasoning.

The main session passes a prompt and waits. The subagent does its work, returns a final reply, then exits. Its context vanishes — only the reply lives on.

## Why this matters

Two wins:

1. **Context isolation.** A subagent's reads, greps, and intermediate thoughts don't leak into the main session. Useful for exploration ("look across 30 files") without dragging all that into your main thread.
2. **Parallel work.** Multiple subagents dispatched in one turn run concurrently. Three searches finish in roughly the time of one.

Costs: each subagent is a new model call, so it costs real tokens. And every subagent reply lands as text the main session has to read — so you trade upfront context cost for ongoing context savings.

## The built-in subagent types

Claude Code ships with specialised subagent roles:

| Subagent | Role | Tool roster |
|---|---|---|
| \`Explore\` | Fast read-only search — "where is X" / "which files reference Y" | Read, Grep, Glob |
| \`Plan\` | Software-architect-style planning for a feature | Read, Grep, Glob |
| \`general-purpose\` | Open-ended research + multi-step work | Full toolset |

You can also author project-specific subagents under \`.claude/agents/\` — same shape as skills: a markdown file with frontmatter and a body.

## When to spawn one

Use a subagent when:

- You'd otherwise read 20 files just to find the right one — give it to Explore.
- A task has independent sub-questions — three subagents, three answers, one merged result.
- You want to keep main session context lean — push verbose work to a subagent.
- The work is long-running and the subagent reply will be a short summary.

Don't use a subagent when:

- The work needs the main session's context anyway.
- Three sub-tasks are sequential — no win from running them in parallel.
- The task is small enough that the overhead exceeds the savings.

## Parallel dispatch

Sending multiple subagents in one turn = parallel. They run concurrently; the main session waits for all to return. The wall-clock cost is the slowest spoke, not the sum.

**Anti-pattern:** a single \`Promise.all\` that rejects if any spoke fails. Use settled-style dispatch (each subagent's success/failure handled independently) so one bad spoke doesn't sink the whole turn.

## Background tasks

For very long work — a heavy lint pass, a deploy — the main session can dispatch a subagent in the background. The main session continues; the subagent finishes minutes later and its result lands when you next prompt. Useful when you don't want the REPL blocked.

## Subagent ≠ skill

Don't confuse subagents (real Claude → Claude delegation, separate context) with skills (a prompt + files loaded into the main agent on demand). Skills shape the main agent. Subagents are *new* agents.

## A note ahead

Stage 7 covers **MCP and hooks** — how to plug Claude into the rest of your world (your bug tracker, your docs, your CI) and how to bound what runs when.
`;

const S7_BODY = `# Extending

Two ways to plug Claude into the rest of your world: **MCP servers** add new tools Claude can call; **hooks** run scripts on Claude Code events. Plus a small note on **IDE integrations**.

## MCP servers — new tools, on demand

MCP (Model Context Protocol) servers expose remote tools to Claude as if they were built in. Add an MCP server and Claude gets a roster of new tool names it can call — \`github.get_pr\`, \`linear.update_status\`, \`postgres.query\`, your team's internal docs search.

Project-scoped servers live in \`.mcp.json\` (committed). Personal servers go in your user config (uncommitted, with your credentials).

\`\`\`json
{
  "mcpServers": {
    "github": { "url": "https://mcp.github.com/v1" },
    "linear": { "url": "https://mcp.linear.app/v1" }
  }
}
\`\`\`

### When not to add an MCP server

The temptation is "add one for everything." Resist. Every MCP server adds tools to the roster, which adds tokens to every prompt. Add an MCP server when:

- The same lookup is recurring ("which PR introduced this regression?").
- The answer lives in a system Claude has no other way to read.
- You can scope its tools narrowly (deny dangerous ones).

Don't add one for a single one-off lookup, or for a system that has a CLI Claude can already use via Bash.

## Hooks — scripts on events

Hooks are commands Claude Code runs when something happens. They live in \`.claude/settings.json\`. Four events:

| Event | Fires when | Common use |
|---|---|---|
| \`preToolUse\` | Before a tool call | Block dangerous commands (\`rm -rf\`, \`git push --force\`) |
| \`postToolUse\` | After a tool call | Auto-run lint after every Edit |
| \`stop\` | When the session exits | Run tests, generate a summary |
| \`userPromptSubmit\` | When you press Enter | Log prompts for review |

A typical hook entry:

\`\`\`json
{
  "hooks": {
    "preToolUse": [
      { "matcher": { "tool": "Bash" }, "command": ".claude/hooks/scope-guard.sh" }
    ],
    "postToolUse": [
      { "matcher": { "tool": "Edit" }, "command": "npm run lint -- --fix \\$TARGET_FILE" }
    ]
  }
}
\`\`\`

### Hooks vs prompt rules

Hooks **enforce**. A CLAUDE.md rule "never run \`rm -rf\`" is a request. A \`preToolUse\` hook that rejects \`rm -rf\` is a guarantee. Use hooks for things that absolutely must happen (or absolutely must not).

## IDE integrations

Claude Code ships extensions for VS Code and JetBrains. They surface the same REPL inside the editor, plus inline diffs and a "send selection to Claude" command. The CLI is the canonical surface; the IDE is a wrapper.

## A starter set

If you're adding to your project today:

1. One MCP server for the thing you look up weekly (Linear, internal docs, the bug tracker).
2. One \`preToolUse\` hook on \`Bash\` to bound destructive commands.
3. One \`postToolUse\` hook on \`Edit\` to auto-lint.

Stop there until the patterns surface. MCP and hooks both add tokens and surface area — they earn their keep when they save you typing the same thing twice.

## A note ahead

Stage 8 covers **headless mode** — running Claude Code without sitting at a terminal. CI, scripts, scheduled jobs.
`;

const S8_BODY = `# Beyond the REPL

Claude Code lives in the terminal by default. But once you're comfortable, the same engine runs in scripts, in CI, and on a schedule — no REPL required. That's **headless mode**, and it's how Claude moves from a tool you talk to into a tool that talks to your systems.

## The shape of a headless call

The flag is \`-p\` (or \`--print\`):

\`\`\`bash
claude -p "summarise this repo"
\`\`\`

Claude runs the prompt, prints the answer, exits. No REPL, no session, no waiting on the next turn. Good for one-shot use, scripts, and CI.

## Structured output with --output-format json

Free-form text is fine for humans, awkward for scripts. Add \`--output-format json\` and the response becomes parseable:

\`\`\`bash
claude -p "summarise this repo" --output-format json
\`\`\`

returns something like:

\`\`\`json
{
  "type": "result",
  "subtype": "summary",
  "session_id": "s_a1b2c3",
  "total_cost_usd": 0.0042,
  "duration_ms": 3187,
  "result": "This repo is a Vue 3 + TypeScript + Vite app …",
  "is_error": false
}
\`\`\`

Pipe through \`jq\` to extract the field you want:

\`\`\`bash
claude -p "summarise" --output-format json | jq -r .result
\`\`\`

## Bounding what runs in CI

CI is the dangerous-context use case for headless mode — you don't want a stray \`rm -rf\` or a force push from a misbehaved prompt. Two levers:

- **\`--allowed-tools\`** — explicit whitelist for this run. \`--allowed-tools Read,Grep,Glob\` runs with a read-only roster.
- **\`--permission-mode plan\`** — research-and-propose. No edits, no Bash, no Writes regardless of allow-list.

Combine them for paranoid CI:

\`\`\`bash
claude -p "review this PR" \\
  --output-format json \\
  --allowed-tools Read,Grep,Glob \\
  --permission-mode plan
\`\`\`

## GitHub Actions

The official action wraps headless mode for PR reviews and issue triage:

\`\`\`yaml
- uses: anthropics/claude-code-action@v1
  with:
    prompt: "Review this PR for accessibility issues. List blockers and suggestions."
    output-format: json
\`\`\`

It runs in your repo's CI, posts results as PR comments, and respects the same \`.claude/settings.json\` (deny lists, hooks) as your local sessions.

## Background tasks

Headless calls can also be backgrounded — kick off a long run, do other work, collect the result later. Useful for nightly summaries, scheduled audits, anything you'd otherwise watch a spinner for.

## When headless is the wrong move

Headless is one-shot. If the task needs back-and-forth ("now do X, now do Y, now reconsider") you're better off in the REPL. Headless is **batch**; the REPL is **interactive**. Match the tool to the shape of the work.

## Where to go from here

You've now seen every shape Claude Code takes: REPL, plan mode, custom commands and skills, memory, subagents, MCP, hooks, headless, CI. The eight stages climb from "type \`claude\`" to "Claude reviews every PR my team opens." Pick the rungs you don't use yet and add them one at a time — every step compounds.
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
    lessonIds: [
      'l-s1-reorder-turn',
      'l-s1-mcq-exit',
      'l-s1-flow-first-session',
      'l-s1-mcq-claude-md',
      'l-s1-blanks-launch-exit',
      'l-s1-reorder-turn-tools',
    ],
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
    lessonIds: [
      'l-s2-blanks-headless',
      'l-s2-mcq-modes',
      'l-s2-reorder-add-cmd',
      'l-s2-mcq-deny-wins',
      'l-s2-flow-permission-prompt',
      'l-s2-reorder-tighten-bash',
    ],
    quizSectionId: 's2',
    sandboxId: 'permission-gate',
  },
  {
    id: 's3',
    number: 3,
    title: 'Steering Claude',
    pitch: 'Plan mode is how you slow Claude down — read first, edit later, only the things you asked for.',
    anchorQuestion: 'How do I get Claude to think before it edits 12 files?',
    rungs: ['I'],
    body: S3_BODY,
    lessonIds: [
      'l-s3-mcq-plan-mode-tools',
      'l-s3-blanks-enter-plan',
      'l-s3-mcq-when-rescope',
      'l-s3-flow-big-task',
      'l-s3-reorder-shrink-plan',
      'l-s3-blanks-settings-default',
      'l-s3-blanks-exit-plan',
      'l-s3-mcq-shrink-prompts',
    ],
    quizSectionId: 's3',
    sandboxId: 'plan-mode-workshop',
  },
  {
    id: 's4',
    number: 4,
    title: 'Customising Claude',
    pitch: 'CLAUDE.md, slash commands, skills, output styles — how you teach Claude your conventions.',
    anchorQuestion: 'How do I teach Claude my project\'s conventions?',
    rungs: ['B', 'I'],
    body: S4_BODY,
    lessonIds: [
      'l-s4-mcq-where-claude-md',
      'l-s4-reorder-config-load-order',
      'l-s4-blanks-slash-frontmatter',
      'l-s4-reorder-create-skill',
      'l-s4-mcq-skill-vs-command',
      'l-s4-flow-effective-config',
      'l-s4-blanks-status-line',
      'l-s4-flow-add-starter-pack',
    ],
    quizSectionId: 's4',
    sandboxId: 'claude-md-hierarchy',
  },
  {
    id: 's5',
    number: 5,
    title: 'Memory & sessions',
    pitch: '/clear, /compact, /resume, /memory — the four levers for keeping Claude on track over a long task.',
    anchorQuestion: 'How do I keep Claude on track over a long task?',
    rungs: ['I'],
    body: S5_BODY,
    lessonIds: [
      'l-s5-mcq-context-bar',
      'l-s5-mcq-clear-vs-compact',
      'l-s5-blanks-memory-file',
      'l-s5-reorder-resume-flow',
      'l-s5-reorder-memory-write',
      'l-s5-flow-long-task',
      'l-s5-mcq-memory-vs-claudemd-purpose',
      'l-s5-reorder-fill-up',
    ],
    quizSectionId: 's5',
    sandboxId: 'session-lifecycle',
  },
  {
    id: 's6',
    number: 6,
    title: 'Delegating',
    pitch: 'Claude spawning Claude. Subagents, parallel dispatch, background tasks.',
    anchorQuestion: 'When should I let Claude spawn other agents?',
    rungs: ['I', 'A'],
    body: S6_BODY,
    lessonIds: [
      'l-s6-mcq-subagent-isolation',
      'l-s6-blanks-task-tool',
      'l-s6-mcq-which-subagent',
      'l-s6-reorder-parallel-research',
      'l-s6-flow-subagent-decision',
      'l-s6-mcq-not-a-subagent',
      'l-s6-mcq-subagent-tools',
      'l-s6-blanks-background-task',
    ],
    quizSectionId: 's6',
    sandboxId: 'subagent-dispatcher',
  },
  {
    id: 's7',
    number: 7,
    title: 'Extending',
    pitch: 'MCP servers add tools; hooks enforce rules. Plug Claude into the rest of your stack.',
    anchorQuestion: 'How do I plug Claude into the rest of my world?',
    rungs: ['I', 'A'],
    body: S7_BODY,
    lessonIds: [
      'l-s7-mcp-vs-bash',
      'l-s7-blanks-hook-event',
      'l-s7-mcq-when-not-mcp',
      'l-s7-reorder-add-mcp',
      'l-s7-flow-hook-firing-order',
      'l-s7-mcq-hook-vs-rule',
      'l-s7-mcq-deny-hooks',
      'l-s7-reorder-add-hook',
    ],
    quizSectionId: 's7',
    sandboxId: 'mcp-hooks-composer',
  },
  {
    id: 's8',
    number: 8,
    title: 'Beyond the REPL',
    pitch: 'Headless mode, JSON output, CI, GitHub Actions. Claude without a terminal.',
    anchorQuestion: 'How do I use Claude Code without sitting at a terminal?',
    rungs: ['A'],
    body: S8_BODY,
    lessonIds: [
      'l-s8-mcq-print-flag',
      'l-s8-blanks-jq-snippet',
      'l-s8-mcq-when-headless',
      'l-s8-reorder-ci-bound',
      'l-s8-flow-headless-pipeline',
      'l-s8-mcq-headless-vs-repl',
      'l-s8-mcq-allowed-tools-ci',
      'l-s8-blanks-action-yaml',
    ],
    quizSectionId: 's8',
    sandboxId: 'headless-composer',
  },
];

export function getStage(id: string): Stage | undefined {
  return stages.find((s) => s.id === id);
}
