# Help Bot — local rules (Scenario 1 area)

These rules **extend** the root `CLAUDE.md` and `src/agents/CLAUDE.md`. They apply only to `src/agents/helpBot/**`.

1. **MCP-shaped tools.** Each tool in `tools/` has a single purpose, a narrow input schema, and returns `ToolResponse<T>` (`src/agents/tools/types.ts`). No multi-purpose helpers. Adding a tool means adding a new file under `tools/`, not extending an existing one.
2. **The ToolResponse contract is the only error surface.** Tools never throw. The coordinator branches on `isError`, then on `errorCategory`. The four categories (`transient`, `validation`, `business`, `permission`) are exhaustive per SYNTHESIS.md §S-1.
3. **Escalation predicates live in `src/agents/escalation.ts`.** Hard-coded — not soft prompt phrases. Three reasons: `user_request`, `repeated_business_errors`, `low_confidence`. Adding a fourth means editing the `EscalationReason` union and updating the `ESCALATION_FEWSHOT` exemplars in the same change.
4. **Only `business` errors count against the escalation budget.** `validation` errors are clarification requests; `transient` errors retry; `permission` errors surface immediately. See `coordinator.ts` for the canonical accounting.
5. **Mock adapter stays default.** The Help Bot must work end-to-end against `src/sdk/mockAdapter.ts`. No real-network assumption on first paint of the sidebar.
6. **Surface tool calls in the UI.** `HelpBotReply.toolCalls` is rendered by `src/components/HelpBotSidebar.vue` — every call (success or failure) appears. Hiding failed calls breaks the Scenario 1 demonstration.
