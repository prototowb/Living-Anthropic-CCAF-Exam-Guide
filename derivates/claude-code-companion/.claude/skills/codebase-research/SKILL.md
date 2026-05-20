---
name: codebase-research
description: Locate where a concept is implemented in THIS repo and return cited file paths. Use when the developer asks "where is X" or "how does this app implement Y" — symbol-first lookup, then content grep, then read for context, with structured citations.
allowed-tools: Read, Grep, Glob
argument-hint: <prompt>
---

# codebase-research

Mirrors the in-app **Codebase Researcher** subagent
(`src/agents/tutor/subagents/codebaseResearcher.ts`) so a Claude Code session
working on this repo gives the same answers as the in-browser Tutor.

## When to invoke

Trigger phrases (case-insensitive):

- "where is X" / "where does this app X" / "where is X defined"
- "how does this app implement Y" / "how does the companion handle Y"
- "show me the X" when X names a code-shaped identifier (camelCase / PascalCase
  / snake_case / a known type name)
- "find the Y" when Y is a predicate, schema, route, etc.

Skip for: explanatory "what is X" prompts (those want the Tutor's *explainer*,
not the researcher) and for prose-only requests with no code anchor.

## Routine — three steps, identifier-first

1. **Symbol-first** (Grep with `\b<name>\b` over `src/**/*.{ts,vue}`). If the
   prompt contains a camelCase / PascalCase / snake_case identifier, search
   for that exact symbol BEFORE any free-text grep. This is the in-app
   `search_symbol` tool's behaviour and avoids comment-noise false positives.

2. **Content grep** (Grep). Pull 2–5 keywords from the prompt (drop stopwords,
   `≥ 3` chars). Build a word-boundary alternation and grep — bounded to
   ~8 matches. If a regex returns more than 5× the limit, ask for narrower
   terms — don't bury the user in matches.

3. **Read for context** (Read). For each of the top 3 hits, Read ±3 lines
   above and +8 below the match line. That snippet is the citation preview.

## Citation format

Return one line per cited location:

```
- `<path>:<line>` — `<preview ≤ 100 chars>`
```

Plus a one-line summary: `Cited <path>:<line> via <symbol|grep>.` Keep the
verbose snippets inside the tool log; do NOT re-inject them into follow-up
turns (TS 5.4 — context isolation).

## Cross-references

- Tutor researcher: `src/agents/tutor/subagents/codebaseResearcher.ts`
- Lesson cross-link: `src/data/_generated/codeToLesson.ts` (cite a path
  covered there and the in-browser UI offers a "study this" jump).
- Source-index resource (planned): `.mcp.json` exposes `read_source_file`,
  `grep_source`, `glob_paths` to Claude Code sessions on this repo.
