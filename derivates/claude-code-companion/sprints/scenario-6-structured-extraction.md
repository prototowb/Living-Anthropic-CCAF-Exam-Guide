# Scenario 6 — Structured Data Extraction

> *Verbatim from the exam guide:* "You are building a structured data extraction system using Claude. The system extracts information from unstructured documents, validates the output using JavaScript Object Notation (JSON) schemas, and maintains high accuracy. It must handle edge cases gracefully and integrate with downstream systems."
>
> *Primary domains:* Prompt Engineering & Structured Output · Context Management & Reliability

## What this scenario teaches the engineer reading the source

Two artefacts demonstrate the scenario at different scales. The **Tutor's intent classifier** (v0.1) shows the *small* shape: a JSON schema + 4 few-shot examples that turn an ambiguous prompt into a typed `IntentResult`, with a typed parser path on the adapter. The **content extraction pipeline** (v0.2+) shows the *large* shape: authored markdown and the local exam-guide PDF flow through a schema-constrained extraction script that emits the typed `src/data/_generated/*` modules the UI consumes. Both expose the same architect-mandated patterns: JSON-Schema-with-Messages-API, 2–4 few-shot examples for ambiguity, structured business-error cases for edge handling, and downstream consumers that read typed data and never re-parse free-form prose.

## v0.1 state (already shipped)

- `src/agents/tutor/schemas/intentClassification.ts` — JSON schema + `IntentResult` type
- `src/agents/tutor/prompts/fewShot.ts` — 4 worked examples + system prompt
- `src/sdk/types.ts` — `CreateMessageOptions.jsonSchema` + `.parser` + `AdapterCapabilities.schemaMode`
- `src/sdk/mockAdapter.ts` — schema branch returns deterministic intent JSON
- `src/sdk/realAdapter.ts` — schema branch defers to the model with the caller-supplied parser

## v0.2 plan (main sprint — full content pipeline)

1. **Pipeline scaffolding.** New directory `scripts/extract/` containing:
   - `extract.ts` — orchestrator. Loads source, picks a schema + few-shot bundle, calls `getAdapter().createMessage({ jsonSchema, fewShot, parser })`, writes typed output.
   - `sources.ts` — registry of `{ id; path; schema; fewShot; outputPath; postProcess? }`.
   - `package.json` script: `"extract": "tsx scripts/extract/extract.ts"`.
   Acceptance: `npm run extract` runs against the mock adapter and produces the expected files deterministically.
2. **Three concrete extractions** (start small):
   - `stages.md → src/data/_generated/extractedStages.ts` — schema mirrors the existing `Stage` shape minus `body` (body stays hand-authored for v0.2).
   - `glossary.md → src/data/_generated/glossary.ts` — `{ term; definition; aliases?; stageId?; rung }[]`.
   - The local exam-guide PDF excerpt (already in `docs/sources/`) → `src/data/_generated/architectScenarios.ts` — the canonical six scenarios as a typed array; used by `/under-the-hood`. Acceptance: re-running the pipeline reproduces the same output byte-for-byte against a frozen adapter seed.
3. **Few-shot bundles per schema.** Each schema gets 2–4 worked examples in `scripts/extract/fewShot/<schemaName>.ts`. Acceptance: examples are exported, typed against the schema, and unit-checked (a tiny runtime assertion on the canonical example).
4. **Schema validator.** Add `scripts/extract/validate.ts` using a small dependency (Ajv or hand-rolled — Ajv is the safer pick) that validates parser output before write. On invalid output, log a `business` error, write nothing, exit 1. Acceptance: a deliberately-broken adapter reply fails the pipeline visibly rather than corrupting `_generated/`.

## v0.3 plan (local-model end-to-end)

5. **Local-model extraction path.** With WebLLM / Ollama adapters live (PROJECT_PLAN.md §7a), demonstrate the pipeline running end-to-end against the *local* adapter. JSON-mode (Ollama) or grammar-constrained generation (WebLLM via llama.cpp grammars) shines here. Acceptance: `MODEL=local npm run extract` reproduces (within a tolerance) the output of `MODEL=mock`.
6. **Edge-case fixtures.** `scripts/extract/__fixtures__/edges/`: ambiguous source, partial source, near-empty source, source with conflicting structure. Pipeline must classify each as a typed `ExtractionError = { kind: 'ambiguous'|'partial'|'empty'|'conflict'; reason }` and write to `_generated/extractionErrors.ts` for surface display. Acceptance: each fixture produces the expected error kind; no spurious extraction lands in `_generated/`.
7. **`AdapterCapabilities.schemaMode` honesty check.** A tiny harness `scripts/extract/probe.ts` asks the active adapter for a known-shape extraction and verifies the response is strictly parseable. Adapters that lie about `schemaMode` (advertise true, return malformed JSON) get a console warning at pipeline start. Acceptance: a deliberately misconfigured `MockUnreliableAdapter` trips the warning.
8. **`/extracted` surface page** *(optional polish)*. A new view at `/extracted` that lists what was extracted in the last `npm run extract`, with source-to-output diffing. Useful for content authors. Acceptance: the page renders the contents of `_generated/`.

## v0.4 plan

9. **Citation-and-snippet schema** (cross-Scenario-4 alignment). Move `src/agents/schemas/citation.ts` (introduced by Scenario 4 v0.2 task 4) under a shared `src/agents/schemas/` namespace. The codebase-researcher's citations and the content pipeline's source-spans share this shape. Acceptance: both producers and the schema validator share one type definition.
10. **End-to-end demo on `/under-the-hood`.** Clicking the Scenario 6 card triggers a *live* in-browser extraction against a tiny sample source via the active adapter (defaulting to mock), shows the JSON schema, the few-shot examples, the model output, and the validated typed result side-by-side. Acceptance: the page demonstrates the full loop without leaving the browser.
11. **Versioned schemas.** Each schema file exports `version: number`. The `_generated/` outputs embed the version. A migration script `scripts/extract/migrate.ts` re-runs extraction when schemas bump. Acceptance: bumping `glossarySchema.version` and running migrate regenerates `glossary.ts`.
12. **Quality bar.** Per-schema extraction accuracy fixture: hand-author `expected.json` for each `__fixtures__/sample.md`. CI step runs the pipeline against fixtures and diffs against expected; > 1 % divergence fails. Acceptance: a 50-fixture suite scores ≥ 99 % on the mock adapter.

## Risks and open questions

- **Pipeline non-determinism.** Even with `temperature: 0`, real-model output drifts. The v0.2 acceptance "byte-for-byte reproducibility" works against the mock adapter; for real adapters we relax to "structurally equivalent" and add a normaliser before diff.
- **Ajv vs no-deps.** Ajv adds ~30 kB and a build-time dep. Acceptable for a scripts-only path but never imported into the SPA bundle. Lint guard: `scripts/**` may import Ajv, `src/**` may not.
- **Generated-file drift.** `_generated/*` is checked in for deterministic builds, but stale generated files diverging from sources is a silent failure mode. Mitigation: CI step that re-runs `npm run extract` and fails if `git diff src/data/_generated/` is non-empty.
- **PDF parsing.** The exam-guide PDF is the canonical source for `architectScenarios.ts`. We rely on `pdftotext` (system dep). Document the prerequisite in `scripts/extract/CLAUDE.md` (Scenario 2 cross-link).

## Cross-cutting notes

- **Scenario 1** — extraction error shapes mirror `ToolResponse<T>`'s `business` category. Use the same `ErrorCategory` type from `src/agents/tools/types.ts` rather than inventing a parallel one.
- **Scenario 3** — the Tutor's intent classifier (v0.1) and the content pipeline (v0.2) are the two ends of the same architecture. Keep their schema-mode fallback logic in lockstep — both should consult `adapter.capabilities.schemaMode` and fall back to JSON-in-prose with the same `extractFirstJsonObject` helper (factored to `src/agents/schemas/parse.ts`).
- **Scenario 4** — citation schema shared (v0.4 task 9).
- **Scenario 5** — review-output schema (Scenario 5 v0.2 task 2) is structurally similar; keep separate files but borrow validation utilities.
