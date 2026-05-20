# Agent layer — local rules

These rules **extend** the root `CLAUDE.md`. Closer files win — these apply only to `src/agents/**`.

1. The Tutor coordinator's `allowedTools` MUST include `'Task'`. Spawning subagents is the whole point of Scenario 3.
2. Views NEVER call `@anthropic-ai/sdk` directly. They MUST go through a coordinator (`tutor` or `helpBot`).
3. Every tool in `*/tools/` returns `ToolResponse<T>` — no unwrapped throws.
4. Independent subagents run with `Promise.all` IF `adapter.capabilities.parallelSubagents` is true. Serial fallback is for small local models (v0.3).
5. After every coordinator turn, append a one-line finding to the appropriate scratchpad (`tutorScratchpad` or `helpBotScratchpad`).
6. Help Bot tools are MCP-shaped (single purpose, narrow input schema, structured error categories). They are not architect-grade MCP servers — but they could be if extracted.
7. The Tutor's intent classifier uses `jsonSchema` + few-shot. Never re-parse free-form prose for the same shape.

## Local-model conventions

Cross-reference: `sprints/SYNTHESIS.md` §S-6 (JSON-in-prose parser, `retryWithFeedback`). These rules apply to every prompt authored under `src/agents/**`.

1. **Never author a prompt that assumes `nativeToolUse === true`.** Real Anthropic adapters honour `tool_use`; WebLLM and Ollama adapters cannot. Every coordinator's tool-handling path must have a `nativeToolUse === false` fallback that parses tool requests out of prose via `src/agents/schemas/parse.ts` (S-6).
2. **Branch on capabilities, not on adapter kind.** Read `adapter.capabilities.nativeToolUse`, `.parallelSubagents`, `.schemaMode` — never `adapter.kind === 'real'`. The capability flags are the contract; the kind is implementation detail.
3. **Few-shot first, schema second.** Few-shot exemplars work on every adapter. `jsonSchema` mode (`schemaMode === true`) is an extra constraint on top, not a replacement. Authoring a prompt that only works under schema mode silently fails on local adapters.
4. **`retryWithFeedback` over fail-exit.** When a structured response fails validation, call `retryWithFeedback` (S-6) with the validator's error message as the feedback string. Hard fail only after the configured retry budget is exhausted.
5. **`tool_choice` must be valid on every adapter.** Per SYNTHESIS.md §S-4, the mock adapter ignores `toolChoice`; the real adapter passes through; WebLLM / Ollama best-effort. Authoring `toolChoice: { type: 'tool', name: 'X' }` is fine — just don't depend on it being honoured by every adapter.
6. **Surface limited mode in the UI.** When any of the three capabilities is false, the `<CapabilitiesBadge>` (S-7) must render. Coordinators expose the failing capability via the turn's metadata; views render the badge — they do not infer capability state.
