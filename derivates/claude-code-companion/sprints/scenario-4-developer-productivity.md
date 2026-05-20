# Scenario 4 — Developer Productivity with Claude

> *Verbatim from the exam guide:* "You are building developer productivity tools using the Claude Agent SDK. The agent helps engineers explore unfamiliar codebases, understand legacy systems, generate boilerplate code, and automate repetitive tasks. It uses the built-in tools (Read, Write, Bash, Grep, Glob) and integrates with Model Context Protocol (MCP) servers."
>
> *Primary domains:* Tool Design & MCP Integration · Claude Code Configuration & Workflows · Agentic Architecture & Orchestration

## What this scenario teaches the engineer reading the source

The **Codebase Researcher** subagent is the *recursive* spoke that reads THIS project's own source to answer "show me where this app implements what you just explained." That recursion is what makes the companion a textbook in both directions — a beginner asking "what is plan mode?" gets an explainer answer; a curious engineer asking "where does this app demonstrate plan mode internally?" gets a cited file path. The implementation pattern engineers see: Read/Grep/Glob-shaped granular tools, MCP-style narrow inputs, structured citations, and a bundle strategy that lets in-browser source-grep stay under budget.

## v0.1 state (already shipped)

- `src/agents/tutor/subagents/codebaseResearcher.ts` — **stub only**. The interface is wired into the Tutor's registry and the intent classifier already routes "show me where this app implements X" prompts here, but the body returns a placeholder.

Everything else awaits v0.2 — this scenario is the headline sprint for the next milestone.

## v0.2 plan (main sprint)

1. **Source-index build step.** New file `scripts/build-source-index.ts` walks `src/**/*.{ts,vue}` (excluding `__fixtures__`, `_generated`, `.test.*`) and emits `src/data/_generated/sourceIndex.ts`: a typed `Record<string, { content: string; lines: number; lang: 'ts'|'vue' }>`. Hooked as `prebuild` in `package.json`. Acceptance: `npm run build` regenerates the index; the file is checked in for reproducibility.
2. **Three granular MCP-shaped tools** in `src/agents/tutor/tools/`:
   - `readSourceFile({ path: string; start?: number; end?: number })` → `ToolResponse<{ path; lang; lines: string[]; total: number }>`. `business` error on missing path; auto-truncates at 200 lines unless `start`/`end` provided.
   - `grepSource({ pattern: string; glob?: string; limit?: number })` → `ToolResponse<{ matches: Array<{ path; line; preview }> }>`. Compiled regex; `transient` error on a too-broad regex (cardinality > limit*5).
   - `globPaths({ glob: string })` → `ToolResponse<string[]>`. Returns paths only.
   Each returns the standard `ToolResponse<T>` (Scenario 1 pattern). Acceptance: `typecheck` clean; each tool covered by a manual debug harness at `/__debug/tools`.
3. **Real `codebaseResearcher.ts` body.** Three-step routine:
   1. `grepSource` on the user prompt keywords.
   2. `readSourceFile` on the top match with surrounding lines.
   3. Emit a short cited answer of the form *"This is implemented at `src/agents/tutor/coordinator.ts:62-78` — the parallel dispatch branches on `adapter.capabilities.parallelSubagents`."* with the snippet quoted.
   Acceptance: a Tutor turn for "show me the hub-and-spoke" yields a citation that resolves to a real path in this repo.
4. **Citation rendering in the TutorView.** Citations come back in `SubagentInvocation.toolCalls` as `{ name: 'cite', input: { path, line, preview } }`. The view turns them into clickable chips that open a snippet drawer with the matched line highlighted. Acceptance: clicking opens the drawer; the path matches `sourceIndex`.
5. **Bundle-size guardrail.** A `prebuild` check that `sourceIndex.ts` gzipped is ≤ 200 kB. Acceptance: deliberately bloating with a noisy file fails the check.

## v0.3 plan

6. **Capabilities-aware tool path.** When `adapter.capabilities.nativeToolUse === true`, the Tutor passes the three tools to the model and lets it sequence calls. When `false`, the researcher's hard-coded three-step routine (v0.2 task 3) stays as the fallback. New flag `researcher.useModelDispatch: boolean` derived from capabilities.
7. **`searchSymbol({ name })` tool.** Symbol-level lookup over the source index using a quick prefix-match against export declarations. Returns one or more `{ path; line; kind: 'function'|'class'|'const' }`. Acceptance: "where is the tutor coordinator defined?" resolves cleanly without a free-text grep.
8. **JSON-in-prose retry parser.** When `schemaMode === false` and the model emits tool requests in prose, parse with `extractToolRequest(text)` and retry once on a malformed shape. Capture failures as `low_confidence` for escalation.

## v0.4 plan

9. **`/under-the-hood` deep link.** Clicking the Scenario 4 card runs three live researcher queries against pre-baked prompts ("hub-and-spoke", "escalation predicates", "ToolResponse shape") and renders the citations inline. Acceptance: the page becomes a runnable demo, not a static description.
10. **Researcher-as-skill.** Add `.claude/skills/codebase-research/SKILL.md` (Scenario 2 cross-link). When a developer is in Claude Code working on this repo and asks a research question, Claude defers to this skill which mirrors the in-app routine. Acceptance: skill triggers on prompts containing "where is X" or "how does this app".
11. **Cross-link to lessons.** When a researcher citation hits a file that has an associated lesson (heuristic via path mapping in `src/data/_generated/codeToLesson.ts`), the citation chip gets a "study this" affordance jumping to `/lessons/:id`. Acceptance: the heuristic table is generated alongside the source index and stays in sync.

## Risks and open questions

- **Bundle weight.** The whole `src/**` source as a string map ships in the SPA. Mitigation in v0.2 task 5 (200 kB gzipped budget). If we ever exceed it, lazy-route-split the researcher and load the index only on `/tutor`.
- **`Write` and `Bash` aren't represented.** The exam-guide scenario names Read/Write/Bash/Grep/Glob; we ship Read/Grep/Glob only. That's intentional — the companion is in-browser; Write and Bash have no meaning client-side. The `/under-the-hood` page must say this explicitly.
- **False citations.** A grep that hits a comment can produce a misleading citation. Mitigation: down-weight matches inside `/* */` and `//` blocks; surface the surrounding 3 lines so the reader sees context.
- **Sequence dependency.** Scenario 3 v0.4 task 10 ("clicking Scenario 3 card runs live turns") relies on the researcher being real — i.e., on Scenario 4 v0.2 shipping. If v0.2 slips, Scenario 3 v0.4 partially slips with it.

## Cross-cutting notes

- **Scenario 1 (ToolResponse)** — all three tools (task 2) conform to the helpBot tool shape exactly. Test that with a shared `assertToolResponseShape` fixture.
- **Scenario 2 (skills)** — v0.4 task 10 adds a `codebase-research` skill. v0.2 introduces a `.claude/commands/explain-this.md` command (Scenario 2's v0.2 task 1) that drives this.
- **Scenario 3 (tutor)** — codebaseResearcher is one of the Tutor's spokes; the interface contract is owned by Scenario 3, the body by Scenario 4.
- **Scenario 6 (structured output)** — citations are structured output. v0.2 task 4's `{ name: 'cite', input: { path, line, preview } }` shape should be defined as a typed schema in `src/agents/schemas/citation.ts` so Scenario 6's pipeline can validate the same shape end-to-end.
