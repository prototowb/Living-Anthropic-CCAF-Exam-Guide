# Tutor researcher tools — local rules

These rules **extend** the root `CLAUDE.md` and `src/agents/CLAUDE.md`. They apply only to `src/agents/tutor/tools/**`.

1. **No filesystem at runtime.** Everything goes through `sourceIndex.ts`, which is populated by Vite's `import.meta.glob` at build time. Don't add `node:fs` imports here.
2. **200-line truncation.** `readSourceFile` defaults to the first 200 lines unless explicit `start` / `end` are passed. Don't bypass this — it bounds the coordinator's context window (TS 5.4).
3. **Cardinality guard.** `grepSource` returns `errorCategory: 'validation'` when raw matches exceed `limit * 5`. Tune the constant only with a benchmark — too low blocks honest broad searches; too high lets bad queries paste 200 lines into context.
4. **Comment down-weighting.** `grepSource` pushes comment matches (lines starting with `//`, `/*`, `*`, `<!--`) to the bottom. Don't exclude them — JSDoc pointers are often the most useful.
5. **MCP-grade specs.** Every tool exports a sibling `*Spec` with snake_case `name`, a `description` that explicitly differentiates the tool from its siblings (≥ 60 chars), and a `required` array in `input_schema`. The descriptions are the only signal the model has for selection — keep them disjoint.
6. **Self-exclusion.** `sourceIndex.ts` excludes itself from the bundled index. Don't break this — recursion would silently double the bundle weight.
