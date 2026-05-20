---
description: Path-specific rules for test files. Glob-scoped per TS 3.3.
paths:
  - "**/*.test.ts"
  - "**/*.spec.ts"
---

# Test rules (glob-scoped)

These rules are activated by path glob `**/*.test.ts` and `**/*.spec.ts`. They cross directory boundaries — a test file lives next to its subject — which is exactly the case path-specific rules exist to handle.

Placeholder: no tests in the repo yet. Tracked in the open `TESTING.md` ticket. When the first test lands, these rules become binding:

1. **`vi.mock` for SDK adapters.** Tests must mock `src/sdk/index.ts`, never the real `@anthropic-ai/sdk` import. The mock adapter is the default per root `CLAUDE.md` rule 1.
2. **`ToolResponse` shape is asserted, not coerced.** Branch on `isError`. Do not `as` your way past a `ToolResponse<T>` discriminated union — that defeats the point of the type.
3. **One subject per file.** `<subject>.test.ts` mirrors `<subject>.ts`. No bundled cross-module test files.
4. **Capabilities cases use explicit fixtures.** Tests for capabilities-aware code paths must include at least one fixture per relevant capability flag combination. `MockUnreliableAdapter` is the canonical "limited" fixture.
5. **No network, no filesystem at runtime.** `node:fs` is fine for fixture setup in a `beforeAll`. It is not fine inside the system under test — matches `src/agents/tutor/tools/CLAUDE.md` rule 1.
6. **Snapshot tests only for stable shapes.** Generated content (`src/data/_generated/*`) is byte-stable under `EXTRACT_FROZEN_TIME` — snapshot it. Coordinator outputs are not byte-stable — assert on shape, not string.
