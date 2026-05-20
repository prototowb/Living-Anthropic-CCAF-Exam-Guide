# Scenario 4 — Deepening pass

> Addendum to scenario-4-developer-productivity.md. Reviewed against Task Statements 2.1, 2.3, 2.4, 2.5, 5.4.

## Architect mandates we are honouring

- **TS 2.5 — Selecting the right built-in tool per job.** v0.2 task 2 splits Read / Grep / Glob into three single-purpose tools rather than one `analyse_code`. `globPaths` returns paths only (skill: "Glob for file path pattern matching"); `grepSource` searches content (skill: "Grep for searching code content across a codebase"); `readSourceFile` loads full file contents with line ranges (skill: "Read to load full file contents"). v0.3 task 7's `searchSymbol` is the "identify all exported names, then search for each name" skill made concrete.
- **TS 2.5 — Incremental codebase understanding.** v0.2 task 3's three-step routine (grep → read top hit → cite) directly mirrors the mandate: "starting with Grep to find entry points, then using Read to follow imports and trace flows, rather than reading all files upfront."
- **TS 2.3 — Scoped roster.** Researcher gets three tools (Read/Grep/Glob), well inside the 4-5 ceiling. The Tutor's other spokes do not receive these tools — preventing cross-specialisation misuse (skill: "Restricting each subagent's tool set to those relevant to its role").
- **TS 2.1 (partial) — Purpose-specific tools.** v0.3 task 7 explicitly splits a would-be generic `findSymbol` from the free-text `grepSource`, demonstrating the "splitting a generic tool into purpose-specific tools" skill.

## Architect mandates we are NOT yet honouring (gaps)

- **TS 2.1 — Tool *descriptions* and `*Spec` exports are missing.** The plan never specifies `name`, `description`, `input_schema` for the three tools. v0.3 task 6 promises model dispatch but gives the model nothing to read. **New task (v0.2):** export `readSourceFileSpec` / `grepSourceSpec` / `globPathsSpec` with snake_case MCP names, ≥ 60-char descriptions that differentiate (`grep_source` "search file *contents*" vs `glob_paths` "search file *paths*" — exam guide's analyze_content / analyze_document overlap warning).
- **TS 2.3 — `tool_choice` configuration is absent.** v0.3 task 6 talks about "passing tools and letting it sequence" but never names `tool_choice: "any" | "auto" | { type: "tool", name }`. Forcing `globPaths` first when the prompt names a file pattern is the textbook use. **New task (v0.3):** thread `toolChoice` through the adapter (joint with Scenario 1).
- **TS 2.4 — MCP server scoping is entirely absent.** The plan ships three in-process tools, never demonstrates `.mcp.json` vs `~/.claude.json`. The companion is browser-only, but Claude Code working *on this repo* could consume the same tools via a real MCP server. **New task (v0.3):** add `.mcp.json` at repo root exposing a stdio MCP server in `scripts/mcp/source-index-server.ts` that wraps the same source-index lookups, with `${SOURCE_INDEX_PATH}` env expansion. Document the personal/project scope split in `LIVING_WORKFLOW.md` (Scenario 2 cross-link).
- **TS 2.4 — MCP resources for content catalogs.** The source index is exactly the "content catalog" the skill names. Currently the model has to grep blind. **New task (v0.4):** expose `sourceIndex` as an MCP *resource* (not a tool) so a connected Claude Code session sees the directory tree without exploratory `globPaths` calls.
- **TS 5.4 — Subagent isolation of verbose discovery.** v0.2 task 3 has the researcher returning *the snippet* plus the cited path. The exam-guide skill is the opposite: subagent absorbs the verbose grep/read output and *summarises* it back to the coordinator. We leak the full snippet into the Tutor's context. **New task (v0.3):** researcher emits a `{ citation; oneLineSummary }` shape; full snippet stays inside the subagent invocation log, surfaced in the UI drawer but not re-injected into subsequent coordinator turns.
- **TS 5.4 — Scratchpad for cross-turn findings.** Cross-cutting note line 5 says scratchpad is shared, but the researcher specifically should write `cited at <path>:<line>` to `tutorScratchpad` after each turn so a follow-up "show me another place this happens" can avoid re-grepping. **New task (v0.2):** append researcher citations to `tutorScratchpad` (one line per citation) per `src/agents/CLAUDE.md` rule 5.
- **TS 5.4 — Context degradation in extended sessions.** No `/compact` analogue or summary-rollup when many research turns accumulate. **New task (v0.4):** when the researcher fires for the Nth time in a session, prepend prior citations' one-line summaries to its prompt instead of the full transcript.

## Liftable patterns from the parent project

- **`*Spec` export pattern** (`searchPatterns.ts:45-57`, `lookupQuestion.ts:19-31`). The exact shape Scenario 4 needs for TS 2.1: function + sibling spec with `name` (snake_case), `description`, `input_schema` (JSON Schema with `required`). Adopt verbatim for `readSourceFile`, `grepSource`, `globPaths`, `searchSymbol`. The parent's `searchPatterns` is the closest analog to `grepSource` — same shape of "free-text query → ranked hits with `{ path; score }`."
- **Async signatures even when sync.** Parent's `searchPatterns` is `async` despite a sync body. Source-index lookups are sync today but will become async when an MCP transport lands (TS 2.4 gap). Make all three researcher tools `async` on v0.2 first touch.
- **Ranked-hit shape.** Parent's `SearchHit { score; ... }` is the right model for `grepSource` matches; v0.2 task 2 currently lists `{ path; line; preview }` only. Add `score` so the comment-down-weighting in Risks-line 49 has somewhere to live.

Not worth lifting: parent's `summarizeProgress` / `gradeAnswer` shapes are domain-specific.

## Efficiency wins (shared with other scenarios)

- **Source-index build step (v0.2 task 1) reuse for Scenario 6?** Honestly, no. Scenario 6 ingests authored markdown/PDF for downstream extraction; Scenario 4 ingests `src/**/*.{ts,vue}` for in-browser source-grep. The schemas differ, the file sets are disjoint, and `build-source-index.ts` produces a `Record<path, content>` map sized for SPA shipping while `scripts/extract/` produces typed `_generated/` modules. Documented here so we don't pretend they share infrastructure.
- **ToolResponse unification (joint with Scenario 1's deepening).** Scenario 1's deepening adds `validation` + `permission` categories, `isRetryable`, and a `context: { attempted; partial; alternatives }` field. Researcher tools must adopt the widened shape on the same PR. Specifically: `grepSource`'s "too-broad regex" case (original v0.2 task 2) is a `validation` error (input fault), not `transient` as the original plan says — fix on landing.
- **Citation schema unification with Scenario 6 (v0.4 task 9).** Confirmed: `src/agents/schemas/citation.ts` is the joint landing point. The shape must accommodate both the researcher's `{ path; line; preview; lang }` and Scenario 6's `{ sourceId; span; quote }`. Define a discriminated union `Citation = SourceCitation | DocumentCitation` rather than one bloated shape.
- **Tool-spec registry (joint with Scenario 1).** The `ToolSpec` type and `toolSpecs` aggregation pattern Scenario 1's deepening introduces is consumed here too. Don't define it twice.
- **Per-area CLAUDE.md (Scenario 2 v0.3 task 7).** Scenario 2's task lists `helpBot/`, `tutor/`, `scripts/extract/` but NOT `src/agents/tutor/tools/`. The researcher's three tools introduce non-trivial local rules (200-line auto-truncation default, regex-cardinality guard, comment down-weighting). **Flag:** add `src/agents/tutor/tools/CLAUDE.md` to Scenario 2's v0.3 task 7 list.

## Re-prioritised tasks

- **v0.2 task 5 (bundle-size guardrail) moves earlier inside v0.2.** Run the gzip check on the *first* index build, not after the researcher body is wired. If the index busts 200 kB the whole sprint pivots to lazy-route splitting — better to know on day 1.
- **v0.3 task 6 (capabilities-aware model dispatch) is blocked on the new `*Spec` task below.** Sequence: v0.2 ships specs → v0.3 task 6 hands them to the model. Without specs the model has no tool documentation to read (TS 2.1 mandate).
- **v0.4 task 11 (cross-link to lessons) is lower priority than the TS 5.4 context-isolation work.** Suggest swapping task 11 down and pulling context-isolation up into v0.3.

## New tasks to add

1. **Export `*Spec` for every researcher tool.** Sprint: **v0.2**. Files: `src/agents/tutor/tools/readSourceFile.ts`, `grepSource.ts`, `globPaths.ts`, `src/agents/tutor/tools/index.ts` (aggregated `toolSpecs`). Acceptance: each spec has snake_case MCP `name`, `description` ≥ 60 chars that explicitly differentiates from the sibling tool (cite-resistant against the analyze_content / analyze_document overlap warning), JSON `input_schema` with `required`; `toolSpecs` typechecks.

2. **Researcher writes citations to `tutorScratchpad`.** Sprint: **v0.2**. Files: `src/agents/tutor/subagents/codebaseResearcher.ts`, `src/agents/scratchpad.ts`. Acceptance: after each researcher turn, one line `cited <path>:<line> for "<prompt>"` lands in `tutorScratchpad`; the "memory" panel (Scenario 3 v0.2 task 5) shows it.

3. **Subagent isolation: summary not snippet.** Sprint: **v0.3**. Files: `src/agents/tutor/subagents/codebaseResearcher.ts`, `src/agents/tutor/subagents/types.ts` (extend `SubagentInvocation.output` with `summary: string`). Acceptance: a 10-turn research session keeps coordinator context flat — verified by logging `messages` token count before/after a regression-mode session that fires the researcher 5×.

4. **MCP server wrapper for Read/Grep/Glob.** Sprint: **v0.3**. Files: `scripts/mcp/source-index-server.ts` (stdio MCP server), `.mcp.json` at repo root with `${SOURCE_INDEX_PATH}` env expansion, `docs/MCP_SETUP.md`. Acceptance: a `claude` session in this repo discovers `read_source_file` / `grep_source` / `glob_paths` via MCP and the descriptions match the in-app specs (single source of truth).

5. **`tool_choice` plumbing for researcher dispatch.** Sprint: **v0.3** (joint with Scenario 1 deepening task 4). Files: `src/sdk/types.ts` (`CreateMessageOptions.toolChoice`), `src/agents/tutor/subagents/codebaseResearcher.ts`. Acceptance: when the prompt names a file pattern (heuristic: contains `*.` or `.vue`), `globPaths` is forced first via `{ type: "tool", name: "glob_paths" }`.

6. **`grepSource` validation-category correction.** Sprint: **v0.2** (small fix; lands with the widened `ToolResponse` shape). Files: `src/agents/tutor/tools/grepSource.ts`. Acceptance: too-broad regex returns `errorCategory: 'validation'` (not `'transient'`) — caller knows not to retry.

7. **MCP resource exposure of the source index.** Sprint: **v0.4**. Files: `scripts/mcp/source-index-server.ts` (extend with a `resources` capability listing the `src/**` tree), `docs/MCP_SETUP.md`. Acceptance: a connected session lists the source index as an MCP resource and the architect can demo the "reduce exploratory tool calls" skill verbatim.

8. **Researcher context-rollup on Nth invocation.** Sprint: **v0.4**. Files: `src/agents/tutor/subagents/codebaseResearcher.ts`, `src/agents/contextPruner.ts` (small extension to read scratchpad citations). Acceptance: from the 4th researcher turn in a session onward, its prompt includes a `## Prior findings` block sourced from `tutorScratchpad` instead of the full prior transcript; token count plateaus.

9. **Add `src/agents/tutor/tools/CLAUDE.md`.** Sprint: **v0.3** (rolled into Scenario 2 v0.3 task 7's list). Files: `src/agents/tutor/tools/CLAUDE.md` (~15 lines: 200-line truncation rule, cardinality guard threshold, comment down-weighting). Acceptance: file exists and Scenario 2's hygiene check (v0.4 task 11) passes.
