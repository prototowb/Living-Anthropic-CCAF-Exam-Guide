# Beginner glossary

> Authored source for `npm run extract` → `src/data/_generated/glossary.ts`.
> Beginner voice. No architect-exam vocabulary on this surface.

## CLAUDE.md

A markdown file at the root of your project that tells Claude Code your conventions — your package manager, your test command, which files to leave alone. Claude reads it at session start. You can also drop a `CLAUDE.md` inside a subdirectory and it overrides the root file for work in that area.

## Permission prompt

The dialog Claude Code shows the first time it wants to use a tool in your project. Read, Edit, Bash, Write — each one is gated. Answer once and your choice persists for the session.

## Plan mode

A permission mode that lets Claude only read and search the codebase — no edits or shell. Toggle with `Shift+Tab`. Good for scoping a multi-file change before touching anything.

Aliases: plan, plan-mode

## Slash command

A reusable prompt you invoke with `/<name>` in the Claude Code REPL. Built-ins include `/clear`, `/compact`, `/resume`, `/help`. Drop a markdown file in `.claude/commands/<name>.md` and the filename becomes the command.

## Skill

A bundle of a prompt with files Claude reaches for in a specific situation. Lives in `.claude/skills/<name>/SKILL.md` with a description that tells Claude when to invoke it. Use skills when you want Claude to follow a workflow without you re-explaining it each time.

## Headless mode

Running Claude Code without the REPL — one prompt, one response. `claude -p "your prompt" --output-format json` returns a parseable structured result you can pipe through `jq` in a shell script or CI step.

## Subagent

A separate Claude session Claude itself spawns via the Task tool. Useful for parallel research ("explore three directories at once") or for keeping the main thread's context window clean. You see a "Running Task" indicator while a subagent works.
