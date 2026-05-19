# Agent layer — local rules

These rules **extend** the root `CLAUDE.md`. Closer files win — the rules here apply only to `src/agents/**`.

1. The coordinator's `allowedTools` MUST include `'Task'`. Spawning subagents is the whole point.
2. Views NEVER call `@anthropic-ai/sdk` directly. They MUST go through `src/agents/coordinator.ts`.
3. Every tool in `src/agents/tools/` returns `ToolResponse<T>` — no unwrapped throws.
4. Independent subagents run with `Promise.all`. Sequential dispatch is a bug unless ordering is required.
5. After every coordinator turn, write a one-line finding to the scratchpad.
6. The mock SDK adapter is the default. The real `@anthropic-ai/sdk` adapter is wired but unused.
