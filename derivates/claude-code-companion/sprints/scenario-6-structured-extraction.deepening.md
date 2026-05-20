# Scenario 6 — Deepening pass

> Addendum to scenario-6-structured-extraction.md. Reviewed against Task Statements 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.6.

## Architect mandates we are honouring

- **TS 4.2 — few-shot for ambiguity & varied document structures.** `src/agents/tutor/prompts/fewShot.ts` ships 4 worked examples (the mandated 2–4 range) that show *reasoning* for routing, not just I/O pairs. v0.2 task 3 generalises this: each schema bundle ships 2–4 examples for varied source shapes (TS 4.2's "varied document structures" skill).
- **TS 4.3 — JSON-schema-as-extraction-shape.** `intentClassification.ts` is a strict `additionalProperties: false` schema with a typed `IntentResult`; `CreateMessageOptions.jsonSchema + parser` is the per-call surface; `AdapterCapabilities.schemaMode` gates the strict path vs JSON-in-prose.
- **TS 4.4 — schema-syntax validation.** v0.2 task 4 (Ajv validator) eliminates the syntactic class of error TS 4.4 explicitly names.
- **TS 5.1 — structured data over verbose prose.** Generated `_generated/*.ts` modules are exactly the "extracted facts as a persistent block, outside summarised history" pattern.

## Architect mandates we are NOT yet honouring (gaps)

- **TS 4.3 — tool_use is the canonical mechanism, not text+parser.** The skill bullet is unambiguous: *"Defining extraction tools with JSON schemas as input parameters and extracting structured data from the tool_use response"*. Our `realAdapter.ts` ignores `opts.jsonSchema` entirely — it sends the schema nowhere, then parses free text. That's the *fallback* path TS 4.3 contrasts against, not the canonical one. **Gap-task A (v0.2): route `jsonSchema` through Anthropic's `tools` array as a single forced extraction tool.**
- **TS 4.3 — `tool_choice` is missing from `CreateMessageOptions`.** No way to express `auto` / `any` / `{type:'tool', name:'extract_metadata'}`. **Gap-task B (v0.2): add `toolChoice` to options and default to `{ type: 'tool', name: <derived> }` whenever `jsonSchema` is provided.**
- **TS 4.3 — nullable/optional fields & `"unclear"` / `"other"` enums prevent fabrication.** `intentSchema.subagents` is `required` + `minItems: 1`; no enum has an escape hatch. The skill bullet *"Adding enum values like 'unclear' for ambiguous cases and 'other' + detail fields"* is unmet. **Gap-task C (v0.3): nullable-fields & extensible-enum lint over every `src/agents/**/schemas/*.ts` and `scripts/extract/schemas/*.ts`.** Add an `"unclear"` rationale or a `low_confidence: boolean` flag to `intentSchema`.
- **TS 4.4 — retry-with-error-feedback.** v0.2 task 4 logs and exits 1. The mandate is the opposite: *"appending specific validation errors to the prompt on retry to guide the model toward correction"*. **Gap-task D (v0.3): bounded retry loop (max 2) that re-prompts with the failed extraction + Ajv error path + original document.**
- **TS 4.4 — semantic self-validation (`calculated_total` vs `stated_total`, `conflict_detected`).** Our schemas only validate syntax. **Gap-task E (v0.4): for `extractedStages.ts` add `calculated_rung` next to `rung`, flag mismatches.**
- **TS 4.5 — Message Batches API is unused.** Bulk extraction over the exam-guide PDF + 6 stage files is *exactly* the latency-tolerant, no-multi-turn-tools workload TS 4.5 prescribes (50 % cost saving). **Gap-task F (v0.4): `--batch` flag on `npm run extract` using `custom_id` per source.**
- **TS 5.6 — provenance.** `_generated/extractedStages.ts` records no `sourcePath`, no `sourceHash`, no line range. The mandate is *"requiring publication/collection dates and source URLs in structured outputs"*. **Gap-task G (v0.2): mandatory `_provenance: { sourcePath; sha256; extractedAt; schemaVersion; lineRange? }` field on every `_generated` record, baked into the validator.**
- **TS 4.1 — explicit categorical criteria, not "be conservative".** Schema descriptions are absent; the model has to infer. **Gap-task H (v0.3): every schema property gets a `description` string with a concrete positive + negative example.**

## Liftable patterns

The parent's `src/agents/schemas/intentClassification.ts` is shape-identical to ours — lift cleanly. The parent's `src/agents/schemas/gradeAnswer.ts` is the better exemplar for **TS 4.3 enum design + minLength rationale**: `verdict: enum['correct','incorrect']`, `rationale: minLength:20`. Adopt the `minLength` floor for our `rationale` fields (forces a real explanation, not "ok").

## Efficiency wins (shared with other scenarios)

- `extractFirstJsonObject` / `extractToolRequest` lives once at `src/agents/schemas/parse.ts`, imported by Scenarios 1 (helpBot tools), 3 (tutor intent fallback, v0.3 task 7), 4 (researcher tool-request parse, v0.3 task 8), and 6 (extraction fallback).
- Ajv compilation shared as `scripts/extract/lib/validator.ts`; Scenario 5's `reviewOutput.ts` validator imports the same compile helper (keeps schema files separate per S5's risk note).
- `AdapterCapabilities.schemaMode` honesty probe (existing v0.3 task 7) is the same harness Scenario 3's `MockUnreliableAdapter` exercises.
- Citation schema (`src/agents/schemas/citation.ts`) shared with Scenario 4 v0.2 task 4 — already in the plan, keep it.
- The `_provenance` block is shared with Scenario 4's citation chips (citation = provenance for a *quote*; `_provenance` = provenance for an *extracted record*).

## Re-prioritised tasks

- **Gap-task A (tool_use wiring) jumps to v0.2 alongside existing task 1.** Without it, "schema-mode" is a fiction on the real adapter and the v0.2 acceptance ("schema branch defers to the model") is misleading.
- **Gap-task G (provenance) jumps to v0.2 alongside existing task 2.** Retrofitting provenance after `_generated/` is consumed by the UI is costly; bake it in at first emit.

## New tasks to add

1. **Tool_use extraction path (v0.2, Gap A+B).** Files: `src/sdk/types.ts` (+`toolChoice`), `src/sdk/realAdapter.ts` (build `tools:[{name:'extract',input_schema:opts.jsonSchema}]`, read `content[0].input` when `stop_reason === 'tool_use'`). Acceptance: real adapter against a sample source returns parsed data without any text-parser fallback; `toolChoice` defaults to forced-named when `jsonSchema` is set.
2. **Provenance baked into every emit (v0.2, Gap G).** Files: `scripts/extract/lib/provenance.ts`, every `scripts/extract/schemas/*.ts`. Acceptance: `validate.ts` rejects any record missing `_provenance.sourcePath` + `sha256`; re-running with an unchanged source produces an identical `sha256`.
3. **Nullable + extensible-enum lint (v0.3, Gap C).** File: `scripts/extract/lint-schemas.ts`. Rule: every `enum` of length ≥ 3 must include `"unclear"` *or* an `"other"` + `detail` sibling; every leaf string property that could be absent in source must be `nullable: true`. Acceptance: deliberately adding a fabrication-prone enum trips the lint.
4. **Retry-with-validator-feedback loop (v0.3, Gap D).** Files: `scripts/extract/retry.ts`, called from `extract.ts`. On Ajv failure, re-prompt with `{ originalSource, failedOutput, ajvErrors }`; max 2 retries; tag final-failure records with `_extractionStatus: 'unrecoverable'` rather than dropping silently. Acceptance: a fixture that fails once-then-passes succeeds; a fixture missing required information is marked unrecoverable, not retried infinitely (TS 4.4's "retries ineffective when info absent" caveat).
5. **Semantic self-validation fields (v0.4, Gap E).** Files: `scripts/extract/schemas/stages.ts`. Add `calculated_rung` alongside `rung`, `conflict_detected: boolean`. Validator flags mismatches as warnings, not blockers. Acceptance: a stage whose body contradicts its declared rung surfaces a `conflict_detected: true` row in `_generated/extractionWarnings.ts`.
6. **Schema-property `description` audit (v0.3, Gap H).** Every schema property gains a `description` with a positive + a negative example, mirroring TS 4.1's "explicit criteria over vague instructions". Acceptance: a script walks every `*.schema.ts` and fails if any property lacks `description`.
7. **Message Batches API path (v0.4, Gap F).** Files: `scripts/extract/batch.ts`. Add `--batch` flag; submit one batch with `custom_id = sourceId@schemaVersion`; poll the 24-hour endpoint; on completion write `_generated/` as usual; failed `custom_id`s are resubmitted singly via the synchronous path. Acceptance: `npm run extract -- --batch` against the mock adapter returns synchronously (mock stub) and demonstrates the wire shape; against the real adapter it produces a Batches request body that matches the documented format.
