---
description: Run the codebase researcher against the currently focused file and report findings.
---

You are about to explain a single source file using the Scenario 4 codebase-researcher tooling. Follow this contract:

1. Identify the focused file (the one the user is currently editing or named in the prompt). If unclear, ask for an absolute path.
2. Use the project's `grep_source` tool (from `src/agents/tutor/tools/grepSource.ts`) to find references to the file's primary export across `src/**`. Cap at 20 matches.
3. Use `read_source_file` (`src/agents/tutor/tools/readSourceFile.ts`) to read the focused file — first 200 lines (the default truncation gate per `src/agents/tutor/tools/CLAUDE.md` rule 2).
4. Summarise in this order:
   - **What it does** — one sentence.
   - **Who calls it** — bulleted list of callers from step 2, with file path + line.
   - **What it depends on** — imports grouped by `src/`, `node_modules/`, type-only.
   - **Surface contract** — exported names and their shape.
5. Cite every claim with `path:line`. The researcher's mandate is "no claim without a citation" — honour it.
6. Beginner-voice rule does NOT apply here — this output is for engineers reading `/under-the-hood`.

See `src/agents/tutor/subagents/codebaseResearcher.ts` for the canonical implementation.
