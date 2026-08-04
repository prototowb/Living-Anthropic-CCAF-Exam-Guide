# Claude Code Companion — Project Plan

> A living study codebase whose **surface** teaches **Claude Code to beginner users**, and whose **source code** is implemented using all six **Anthropic Claude Certified Architect — Foundations** exam scenarios.
>
> Two audiences, one artifact:
> - **Learner audience (surface):** A first-week Claude Code user who wants to understand the tool, its permission model, slash commands, CLAUDE.md, skills, plan mode, and the rest of the day-to-day surface.
> - **Engineer audience (source):** A developer reading the repo who wants to see all six architect scenarios in production-shaped code — hub-and-spoke coordinators, MCP tools, structured errors, JSON-schema responses, plan-vs-direct routing, CI safety gates.
>
> The parent project (`architect-interactive-playbook`) already teaches the architect content directly. This derivative inverts the framing: the architect patterns become the **engineering substrate**, invisible to the learner but legible to any developer who opens the source.
>
> **Runs without an API key.** Default is a mock SDK (instant boot, scripted). For real inference the app supports a **browser-native local model** (download-on-first-use via WebLLM, no separate service to launch), an **auto-detected local Ollama / LM Studio** if the learner already has one, or **real Claude** with an API key — all behind a single adapter factory. See §7a.

---

## 1. The corrected idea, in one paragraph

A beginner opens `claude-code-companion` in their browser and is taught Claude Code from zero: their first session, what tools Claude has, the permission prompt, slash commands, CLAUDE.md, skills, subagents, plan mode, headless mode. Everything they see is beginner-shaped. Behind it, the app is implemented as a small Claude-Agent-SDK reference platform: a hub-and-spoke tutor with specialized subagents (Scenario 3), an in-app help agent shaped like a support resolution agent (Scenario 1), structured-data extraction pipelines that materialise lesson content from authored sources (Scenario 6), a developer-productivity "research the codebase" agent for the tutor's deep questions (Scenario 4), a CI configuration that has Claude review every PR with safety gates (Scenario 5), and a Claude Code workflow (CLAUDE.md hierarchy, slash commands, plan mode) governing how the project is built (Scenario 2). The codebase is the answer key for the architect exam; the running app is a Claude Code tutorial for absolute beginners.

## 2. The six architect scenarios → where each one lives inside this codebase

For each scenario, primary domains come straight from the exam guide. "Realised as" is how it manifests inside this project.

### Scenario 1 — Customer Support Resolution Agent
> *Primary domains: Agentic Architecture & Orchestration; Tool Design & MCP Integration; Context Management & Reliability.*

**Realised as:** the in-app **Help Bot** (a sidebar agent the learner can call from any page). It uses MCP-shaped granular tools to look things up: `get_lesson`, `lookup_quiz_attempts`, `check_progress`, `escalate_to_docs`. Tools return `ToolResponse<T>` with `isError` and `errorCategory: 'transient' | 'business'`. The bot follows explicit escalation criteria (fall through to "open the docs at X" when confidence drops). Target: 80%+ first-answer resolution on common beginner questions, measured against a fixture set.

**Code anchors (planned):** `src/agents/helpBot/{coordinator,tools,escalation}.ts`, `src/agents/mcpTools/*.ts`, `src/agents/types.ts`.

### Scenario 2 — Code Generation with Claude Code
> *Primary domains: Claude Code Configuration & Workflows; Context Management & Reliability.*

**Realised as:** this project's own **developer workflow**. The repo ships a real `CLAUDE.md` hierarchy (root + per-area files), real slash commands in `.claude/commands/`, real skills in `.claude/skills/`, and the standards for plan-mode vs. direct-execution are documented and exemplified. A learner who pokes at the source sees how a small team configures Claude Code in practice. Bonus: a `LIVING_WORKFLOW.md` walks a reader through "here is how I actually used Claude Code to build this file."

**Code anchors (planned):** `CLAUDE.md` (root), `src/{agents,views,stores}/CLAUDE.md`, `.claude/commands/*.md`, `.claude/skills/*/SKILL.md`, `docs/LIVING_WORKFLOW.md`.

### Scenario 3 — Multi-Agent Research System
> *Primary domains: Agentic Architecture & Orchestration; Tool Design & MCP Integration; Context Management & Reliability.*

**Realised as:** the **Tutor** — a hub-and-spoke agent powered by the Anthropic SDK (mock by default, real-SDK swap behind a one-line factory, exactly like the parent). The coordinator delegates to specialised subagents: an **Explainer** (long-form prose), a **Quizmaster** (drills the learner on weak spots), a **Codebase Researcher** (answers "how is this implemented in the app?" by reading the project's own source — recursive teaching), and a **Doc Synthesiser** (combines findings into a cited mini-report). Parallel dispatch with `Promise.all`. `allowedTools` includes `Task`, asserted at load time.

**Code anchors (planned):** `src/agents/tutor/coordinator.ts`, `subagents/{explainer,quizmaster,codebaseResearcher,docSynthesiser}.ts`, `prompts/fewShot.ts`, `scratchpad.ts`, `contextPruner.ts`.

### Scenario 4 — Developer Productivity with Claude
> *Primary domains: Tool Design & MCP Integration; Claude Code Configuration & Workflows; Agentic Architecture & Orchestration.*

**Realised as:** the **Codebase Researcher** subagent (called from the Tutor when a learner asks "how does this app implement what I just learned?"). It uses Claude's built-in tools idioms — `Read`, `Grep`, `Glob` — over the project's own source, plus an MCP-shaped tool for fetching authored lesson content. The subagent shows the answer **with file paths**, so a reader can jump to the source and *see* the architect pattern the lesson was just teaching about. This is the recursion that makes the codebase a living textbook.

**Code anchors (planned):** `src/agents/tutor/subagents/codebaseResearcher.ts`, `src/agents/mcpTools/fetchContent.ts`, `src/agents/tools/{readFile,grepSource,globPaths}.ts`.

### Scenario 5 — Claude Code for Continuous Integration
> *Primary domains: Claude Code Configuration & Workflows; Prompt Engineering & Structured Output.*

**Realised as:** the project's **CI** — a real GitHub Actions workflow that runs Claude Code over each PR for automated review, with explicit prompts that bound the review (touched files only, named criteria, hard "do not approve" gates). Hooks are configured in `.claude/settings.json` so destructive actions are denied in CI even if a prompt asked for them. False-positive minimisation is treated as a first-class concern; the prompt template is itself a lesson surface inside the app.

**Code anchors (planned):** `.github/workflows/claude-review.yml`, `.claude/settings.json` (hooks + permissions), `docs/CI_REVIEW_PROMPT.md`, `src/views/PromptDissectionView.vue` (turns the CI prompt into a teaching artefact).

### Scenario 6 — Structured Data Extraction
> *Primary domains: Prompt Engineering & Structured Output; Context Management & Reliability.*

**Realised as:** the **content pipeline**. Authored sources (Markdown lessons, transcript JSON, the exam-guide PDF in `docs/sources/`) are run through Claude with **JSON-schema-constrained extraction** to produce the typed content modules the UI consumes (`src/data/lessons.ts`, `quizData.ts`, `flows.ts`). The schemas are checked in. The extractor runs offline with a mock SDK by default, and the real-SDK extractor is a CLI script. Few-shot examples are stored next to each schema. Edge cases (ambiguous source, partial extraction) surface as `ToolErrorResponse` with `errorCategory: 'business'`.

**Code anchors (planned):** `scripts/extract/*.ts`, `src/agents/schemas/*.ts`, `src/agents/prompts/fewShot/*.ts`, `src/data/_generated/*` (deterministic output of the pipeline).

## 3. The beginner-user curriculum (what the learner actually sees)

Independent of the scenarios above. This is the surface content authored against beginner anchor questions, structured into a single climb from "first prompt" to "feels at home."

| Stage | Anchor question the learner can finally answer | Topics |
|---|---|---|
| **S1 — First prompt** | "What is Claude Code and what just happened when I typed something?" | Install, launch, the REPL, what `claude` *is*, accepting/declining an edit, exit |
| **S2 — Tools & permissions** | "Why did Claude ask me before running that command?" | Read / Edit / Write / Bash / Grep / Glob, permission modes (default / acceptEdits / plan / yolo), allow/deny lists in settings |
| **S3 — Steering Claude** | "How do I get Claude to think before it edits 12 files?" | Plan mode, `/plan`, prompting style for big tasks, when to stop and re-scope |
| **S4 — Customising Claude** | "How do I teach Claude my project's conventions?" | CLAUDE.md, hierarchy, slash commands, **skills**, output styles, status line |
| **S5 — Memory & sessions** | "How do I keep Claude on track over a long task?" | `/memory`, `/resume`, `/clear`, `/compact`, when to use each |
| **S6 — Delegating** | "When should I let Claude spawn other agents?" | Subagents (the Task tool), Explore / Plan / general-purpose agents, parallel dispatch, background tasks |
| **S7 — Extending** | "How do I plug Claude into the rest of my world?" | MCP servers (overview, scoping, when *not* to add one), hooks (pre/post/stop), IDE integrations |
| **S8 — Beyond the REPL** | "How do I use Claude Code without sitting at a terminal?" | Headless mode (`-p`, `--output-format json`), background tasks, GitHub Action, in CI |

Each stage carries: a transcript walkthrough, a sandbox, 4–8 quiz items, 2–4 micro-lessons. None of the stage content mentions architects, mandates, or exam scenarios — that vocabulary belongs to the source, not the surface.

## 4. Audience ladder (surface)

Three rungs tag every artifact on the surface:

| Rung | What they can already do | What this app moves them to |
|---|---|---|
| **B — Beginner** | First-week user | End of S5 (Memory & sessions) — comfortable, intentional Claude Code usage |
| **I — Intermediate** | Comfortable daily user | End of S7 — can extend Claude with skills, MCP, hooks |
| **A — Advanced** | Power user / platform owner | End of S8 — runs Claude Code headlessly and in CI |

A learner can sweep across all eight stages at one rung before climbing — every stage carries items at multiple rungs so an advanced user has something to chew on even in S1.

## 5. Surface areas (routes)

| Route | Page | What it does |
|---|---|---|
| `/` | Home | Pick a rung, see next stage, jump in. Progress at-a-glance. |
| `/learn` | Stage index | 8 stage cards |
| `/learn/:stageId` | Stage page | Transcript walkthrough + sandbox + linked quizzes/lessons |
| `/quiz` | Quiz index | Grouped by stage |
| `/quiz/:section/:qid` | Question view | MCQ + reveal + reverse-link chips back to the stage + linked sandbox |
| `/practice` | Practice run start | Timed practice across stages; weak-spots + rung filter |
| `/practice/run` | Runner | One Q, timer, flag, auto-submit (same shape as parent's mock exam) |
| `/practice/result/:id` | Result | Per-stage + per-rung bars |
| `/lessons` | Lessons index | reorder / blanks / mcq / flow-builder, grouped by stage |
| `/lessons/:id` | Lesson runner | Same four formats as parent |
| `/sandboxes` | Sandbox index | 8 sandboxes (one per stage) + deep-dives |
| `/sandboxes/:id` | Sandbox detail | Interactive demo + transcript + reverse-link chips |
| `/atlas` | Concept Atlas | SVG map: 8 stage columns × ~40 concept nodes |
| `/tutor` | Claude Tutor | Hub-and-spoke chat; can quiz the learner; sources cite stages |
| `/help` | Help Bot | The Scenario-1 support agent; resolves common "where do I go for X" questions |
| **`/under-the-hood`** | **Engineer view** | *Hidden from the learner-facing navigation by default.* Lists how each of the 6 architect scenarios is realised in the source, with file links. The recursion seam — the only place the surface explicitly references the substrate. |

## 6. Sandboxes (one per surface stage)

1. **S1 — First-session REPL** — fake `claude` REPL. Learner types a prompt; the app shows which tools fire, which files Claude reads, the diff. *Knob:* permission mode toggle.
2. **S2 — Permission gate** — pre-built tool call queue. Learner edits a mock `settings.json` allow/deny list; the queue shows which calls land silently, prompt, or get denied. *Anti-pattern foil:* over-broad `Bash(*)`.
3. **S3 — Plan-mode workshop** — prompt on the left, plan output on the right; learner re-prompts to shrink scope; the diff plan re-renders.
4. **S4 — CLAUDE.md hierarchy** — split view: project tree + a prompt + the *effective* configuration Claude would assemble. Learner edits root vs. subdir files and sees precedence land.
5. **S5 — Session lifecycle** — animated timeline of `/clear`, `/compact`, `/resume`, with a fake context bar shrinking and growing.
6. **S6 — Subagent dispatcher** — task description + a fleet of agent types; learner picks which to spawn and whether to parallelise; the timeline shows wall-clock savings or a serial waterfall.
7. **S7 — MCP/hooks composer** — visual `settings.json` editor; learner drops MCP servers and hooks in; a synthetic event stream shows which hooks fire on which tool calls.
8. **S8 — Headless command composer** — learner assembles `claude --output-format json -p "..."` piecewise; the app shows parsed output and a tiny `jq` snippet.

## 7. Tech stack (inherits the parent so concepts transfer 1:1)

- **Vue 3** Composition API + `<script setup lang="ts">` on **Vite**
- **TypeScript** strict
- **Pinia** for state
- **vue-router**
- **Tailwind** for layout + **SCSS / BEM** for component sheets
- **`@anthropic-ai/sdk`** — wired and demonstrated; defaults to a **mock adapter**, real-SDK behind one factory
- **`@mlc-ai/web-llm`** — optional browser-native local model (see §7a)
- **xterm.js** for terminal sandboxes (lightweight, scripted output — no PTY needed)
- **localStorage** persistence; versioned keys `ccc:*:v1`

## 7a. Local-model option (no separate service to launch)

The app supports **four model sources**, all behind a single `setAdapter()` factory (same shape as the parent's `src/sdk/index.ts`). The active adapter is shown in the status bar.

| Adapter | What it is | Network | Setup cost |
|---|---|---|---|
| **Mock** (default) | Scripted transcripts. Boots instantly. | None | None |
| **Browser-native** (WebLLM) | A small instruction-tuned model (default: Llama 3.2 3B Instruct, ~2 GB quantised) downloads into the browser cache on first use and runs in-tab via WebGPU. **No separate process to launch.** | One-time CDN download for the weights | WebGPU-capable browser (Chrome / Edge / recent Safari); ~2 GB cache space |
| **Local server (auto-detect)** | App pings `localhost:11434` (Ollama) and `localhost:1234` (LM Studio) on launch. If found, connect via an OpenAI-compatible adapter. If not found, show a one-paragraph install hint — no nag. | localhost only | The user must have one of these installed; the app does **not** spawn it |
| **Real Claude** | `@anthropic-ai/sdk` behind the same factory; user pastes an API key into settings. | Anthropic API | API key |

### Honest caveats (surfaced in the UI, not hidden in docs)

When a local adapter is active, the status bar shows a **"limited"** badge with a one-click "what's limited?" explainer:

- **Tool calling is unreliable on small local models.** The Tutor's hub-and-spoke with parallel subagents (Scenario 3) and the Help Bot's MCP-shaped tools (Scenario 1) **degrade gracefully**:
  - Tutor falls back to a single-subagent path with explicit prompts (no parallel `Promise.all`).
  - Help Bot tool calls are issued as JSON-in-prose with a parser + retry, instead of native tool use.
- **The content-extraction pipeline (Scenario 6) is actually a *win* on local.** JSON-schema-constrained generation is a strong suit even at 3B (via JSON-mode or llama.cpp grammars). This is the one place the surface explicitly says "you don't need Claude for this."
- **The CI scenario (Scenario 5) is intentionally not local.** Actions runs on GitHub's infra; forcing local there is silly. The Mock or Real-Claude adapter is the only sensible choice in CI.
- **Mock stays the default.** No download nag on first boot. Switching adapters is one click in settings.

### Adapter contract

`src/sdk/types.ts` defines the `SdkAdapter` interface: `createMessage(opts)` with `{ system?, messages, jsonSchema?, tools?, toolChoice?, fewShot?, parser? }`. Each adapter implements the *same* interface; the Tutor and Help Bot ask the active adapter for capabilities (`adapter.capabilities = { nativeToolUse, parallelSubagents, schemaMode }`) and **branch accordingly** rather than feature-detecting at the call site. This keeps the architect substrate (Scenarios 1 & 3) honest even when running locally.

### Where this lands on the roadmap

Adding it to v0.3 (after curriculum is half-authored and the Tutor architecture has settled) — so it doesn't drag v0.1 shipping. See updated §9.

## 8. Reuse from the parent (do not re-implement)

These should be **lifted verbatim** (or imported as a small vendored package):
- `src/sdk/*` — mock adapter, real adapter, types
- `src/agents/coordinator.ts`, `subagents/*` shape, `tools/*` shape, `scratchpad.ts`, `escalation.ts`, `contextPruner.ts` — re-specialise contents, keep shape
- `src/components/{CodeBlock,FlowGraph,InlineQuizDrill,ProgressBar}.vue`
- `src/components/lessons/*` — all four lesson formats
- `src/stores/persist.ts` — versioned localStorage helper
- Lesson and quiz data **types** (not data) from `src/data/types.ts`

Re-author from scratch (content, not code):
- All stage content, sandbox transcripts, quiz items, lessons, atlas nodes

## 9. Quality bars

| Version | Bar | Status |
|---|---|---|
| **v0.1.0 — Skeleton walks** | `typecheck` + `build` clean. Stages S1–S2 authored. 1 sandbox (First-session REPL). 20 quiz items. 6 lessons. Tutor answers via hub-and-spoke with one subagent. Help Bot stubbed with 2 MCP tools. Mock SDK default. No external network needed to run. | ✅ Shipped. |
| **v0.2.0 — Half-coverage** | Stages S1–S5. 4 sandboxes. 40 quiz items. 12 lessons. Tutor with 3 subagents (Explainer, Quizmaster, Codebase Researcher). Content pipeline (Scenario 6) runs in mock mode and produces `_generated/`. `ModelAdapter` interface stub + capabilities flags wired into Tutor and Help Bot. | ✅ Shipped — exceeded (see §9a). |
| **v0.3.0 — Practice → reflection + local model** | All 8 stages. 6 sandboxes. Weak-spots + rung filter. Reverse-link chips. Atlas full. Tutor with scratchpad + escalation. Help Bot with all 4 MCP tools and structured errors. **WebLLM browser-native adapter** wired (Llama 3.2 3B Instruct by default, one-click download). **Ollama / LM Studio auto-detect** adapter wired. "Limited" badge + explainer when a local adapter is active. Content pipeline (Scenario 6) demonstrated running end-to-end against the local model. | ⚠ Surface ✅; local-model adapters land as honest stubs (interface-compliant, `createMessage` throws). Real wiring deferred to v0.5. |
| **v0.4.0 — Flow of concepts** | 8 sandboxes. 60 lessons. 80 quiz items. `/under-the-hood` page fully cross-linked to source. CI workflow (Scenario 5) reviewing every PR with hooks configured. Real-SDK content-extraction script documented and runnable end-to-end. Adapter picker in settings has all four options. | ✅ Shipped — every bar hit exactly. |
| **v0.5.0 — Adapters real** | **WebLLM real wiring** (lazy `await import('@mlc-ai/web-llm')` inside `createMessage`; WebGPU detection + download-progress UI; default Llama 3.2 3B Instruct, ~2 GB cached). **Ollama** auto-detect on `localhost:11434` + OpenAI-compatible chat dispatch. **LM Studio** auto-detect on `localhost:1234`. **In-app API key entry** for the Real adapter (localStorage with clear "stored on this device" warning + forget button). Scenario 6 LiveDemo drops the regex workaround once a real `schemaMode: true` adapter is active. CI workflow follow-ups (commented in `.github/workflows/claude-review.yml`): real budget accumulator (persisted month-stamped counter), fork-PR safety hardening (`pull_request_target` + scoped tokens), independent-reviewer pass, incremental-review continuity. | ⚠ Adapters ✅ (shipped 2026-08-04, see §9b); CI follow-ups rolled into v0.6. |
| **v0.7.0 — Review depth & calibration** | The two deepening tasks left open after v0.6: **Task B — per-file vs cross-file split** (pass 1 = one scoped `claude -p` per touched file for local defects + one integration pass for imports/exports/data-flow; splitter `scripts/ci/split-diff.ts`; dry mirror `review:dry --split`; acceptance fixture `sample-6-cross-file` — a caller/callee signature mismatch invisible to both per-file passes, caught only in integration, enforced by `scripts/ci/eval-split.ts`). **Task F — confidence-threshold calibration** (`scripts/calibrate-threshold.ts` sweeps 0.00–1.00 in 0.05 steps over raw post-pass-2 predictions vs `expected.json`, stratified by severity and file extension; chosen 0.60 published as `CONFIDENCE_THRESHOLD` and in `docs/CI_REVIEW_PROMPT.md`; `--check` drift-guards constant vs corpus; the gate is applied at FINAL emission only — pass 2 must see the full draft; a planted confident-sounding false blocker in `sample-5`'s draft survives the rule filter and is exactly what the gate catches). Prompt bumped to `v1.1-2026-08-04` (pass-scope + threshold sections). | ✅ Shipped 2026-08-04, see §9d. |
| **v0.6.0 — CI hardened** | The four deferred CI follow-ups plus the two workflow markers: **budget accumulator** (`scripts/ci/budget.ts`, month-stamped ledger on the `_runs` branch via Contents API; `=0` off-switch preserved). **Fork-PR hardening** (`pull_request_target`, base-repo checkout only, diff + touched files fetched as data via API, `persist-credentials: false`, no `git push` anywhere). **Independent-reviewer pass** (deepening task A: second fresh `claude -p` with `docs/CI_REVIEW_OF_REVIEW_PROMPT.md`; deterministic dry-run mirror `scripts/review-filter.ts`; acceptance corpus `sample-5-planted-fp` — ≥ 80 % planted-FP strip, ≤ 5 % true-blocker drop, enforced by `npm run review:eval`). **Incremental continuity** (deepening task D: prior summary embedded in the bot comment behind `<!-- claude-review:summary v1 -->`, deduped by `(path, line, rationale-hash)` via `scripts/ci/dedupe-findings.ts`; no-op push posts nothing; fixed blockers report "✓ resolved"). **CLI policy** keyed on the ANTHROPIC_API_KEY secret (hard-require on install failure, labelled dry-run over the real PR diff otherwise). | ✅ Shipped 2026-08-04, see §9c. |

### 9a. Status as of `0.3.0-pre`

What this `package.json` version reflects: **the entire surface promised through v0.4 is shipped**. The `-pre` suffix exists because v0.3 in §9 also required real local-model wiring (deferred to v0.5).

**Shipped this session (v0.2 → v0.4):**

- **All eight stages authored.** S1–S8 each carry a full markdown body, 6 lessons, 10 quiz items, and a dedicated sandbox.
- **Surface counts.** 60 lessons across the four formats (reorder, blanks, mcq, flow-builder). 80 quiz items. 8 sandboxes — REPL, permission gate, plan-mode workshop, CLAUDE.md hierarchy, session lifecycle, subagent dispatcher, MCP & hooks composer, headless composer.
- **Atlas.** 57 concept nodes + 12 cross-stage bridges at `/atlas`. Each node deep-links to a stage / lesson / quiz question.
- **New routes.** `/atlas`, `/settings`, `/weak-spots`. Footer + nav updated.
- **Reverse-link chips.** TutorView (citation-driven), LessonView (back to parent stage + sandbox), QuizQuestionView (post-reveal, same shape).
- **Adapter picker.** All five options (Mock + Real + WebLLM/Ollama/LM-Studio stubs) visible at `/settings`. Non-mock adapters intentionally not persisted across refreshes — see the SettingsView footer note for why.
- **Substrate (unchanged this session, but worth naming).** Tutor with 4 subagents (Explainer, Quizmaster, Codebase Researcher, Doc Synthesiser) + scratchpad + escalation. Help Bot with 5 MCP-shaped tools + 4-value `ErrorCategory`. Shared `dispatchAllSettled`, `parse.ts`, capability-aware fallback paths.
- **CI.** `.github/workflows/claude-review.yml` posts structured PR reviews via `gh pr review`; `.claude/settings.json` hooks enforce a scope-guard preToolUse on Edit/Write; honest-stub cost ceiling.
- **Content pipeline.** `scripts/extract/` runs end-to-end against a fixture adapter by default; `EXTRACT_ADAPTER=api ANTHROPIC_API_KEY=…` activates the real adapter with retry-on-validation-failure.

**Deferred to v0.5:** WebLLM/Ollama/LM-Studio real `createMessage` dispatch; in-app API-key entry for the Real adapter; Scenario 6 demo's regex-workaround drop; CI follow-ups (budget accumulator, fork-PR safety, independent-reviewer pass, incremental-review continuity). *(All but the CI follow-ups landed in v0.5.0 — see §9b.)*

### 9b. Status as of `0.5.0` (shipped 2026-08-04)

The adapters-only half of the v0.5 row is live; `package.json` went `0.3.0-pre` → `0.5.0` (the v0.3 local-model bar is finally met, plus the v0.5 adapter scope).

- **Composition root is reactive.** `src/sdk/index.ts` holds the active adapter in a `shallowRef`, so capability getters (e.g. `helpBot.adapterCapabilities`) invalidate on adapter swap — this fixed a frozen-badge bug in `HelpBotSidebar`.
- **Shared OpenAI-compat plumbing** at `src/sdk/openaiCompat.ts` (pure builders/mappers + ping helper), regression-tested from `/debug`.
- **Ollama / LM Studio** dispatch via `/v1/chat/completions` with `response_format: json_schema` (constrained decoding → honest `schemaMode: true`; `nativeToolUse`/`parallelSubagents` stay false). Detection pings run when `/settings` mounts — never at app boot.
- **WebLLM** wired with the lazy-import strategy; WebGPU pre-check, download-progress UI + explicit "Download now" button in `/settings` (never downloads on page load). `prewarmWebLlm()` exposed for the button.
- **In-app API key entry** (`src/components/settings/ApiKeyPanel.vue`): localStorage under `ccc:anthropic-api-key:v1`, "stored on this device" warning, forget button. Adapter *choice* still resets to Mock on refresh (no network at rest); the key persisting makes re-enabling Real one click.
- **Scenario 6 regex workaround dropped.** The mock adapter gained a scripted glossary branch keyed on the `GlossaryDocument` schema title (`src/sdk/mockGlossary.ts`), making its `schemaMode: true` claim honest; the LiveDemo now consumes `res.data` uniformly and its manual validator gates real model output.
- **AppShell status bar** now mounts the `⚠ limited` `CapabilitiesBadge` next to the adapter label (§7a's promised affordance).
- **Honesty probe** (`npm run extract:probe`) gained `ollama` / `lm-studio` targets — probed only when the local server answers a ping; absent servers print SKIP and never fail CI.

**Deferred to v0.6:** the four CI follow-ups (real budget accumulator, `pull_request_target` fork hardening, independent-reviewer pass, incremental-review continuity), plus hard-requiring the real `claude` CLI in the review workflow and per-touched-file dry-run invocation. *(All landed in v0.6.0 — see §9c.)*

### 9c. Status as of `0.6.0` (shipped 2026-08-04)

The CI half of the original v0.5 row is live. All testable logic lives in `scripts/ci/` + `scripts/review-filter.ts` (node-side, offline, fixture-driven) with `.github/workflows/claude-review.yml` as pure orchestration — the workflow is a **teaching artifact** (it sits in a subdirectory, so GitHub never executes it), which is exactly why its logic is factored into scripts a reader can run:

- `npm run ci:budget` — month-stamped spend ledger check/record (fail-open on corrupt ledger, `0` = hard off-switch, per-month reset).
- `npm run ci:dedupe` — splits current findings vs the prior run's into new / still-open / resolved by `(path, line, rationale-hash)` with whitespace/case-normalised rationales; recomputes the verdict so a fixed blocker stops requesting changes.
- `npm run review:filter` — pass-2 independent filter; the deterministic mirror of `docs/CI_REVIEW_OF_REVIEW_PROMPT.md`'s hard rules (scope, preference, hedge, duplicate; blocker-bias keeps hedged blockers).
- `npm run review:eval` — acceptance harness: on `docs/sample-prs/sample-5-planted-fp` (2 real blockers + 5 planted FPs) the filter strips 5/5 FPs and drops 0 blockers; ground-truth findings on the four plain fixtures all survive.
- Workflow: `pull_request_target` + base-repo-only checkout + API-fetched diff (fork code never executes), Contents-API ledger writes (no `git push`, `persist-credentials: false`), two fresh `claude -p` processes (generator isolation), marker-comment continuity, and comment sections New / Still unaddressed / ✓ Resolved.

**Still open beyond v0.6:** per-file vs cross-file review split (deepening task B) and the confidence-threshold calibration sweep (task F). *(Both landed in v0.7.0 — see §9d.)*

### 9d. Status as of `0.7.0` (shipped 2026-08-04)

Scenario 5's deepening backlog is now fully closed (tasks A–F all landed).

- **Split review (task B).** `runSplitReview` in `scripts/review-pr.ts` models the two prompt scopes with separate synthetic registries: per-file passes see only their file's diff; the integration pass owns cross-file defects. `sample-6-cross-file` proves the seam — its signature mismatch produces **zero** per-file findings and exactly one integration blocker. In real mode the workflow runs one fresh `claude -p` per touched file plus one integration process, merging drafts with jq.
- **Calibration (task F).** The sweep tells the story the corpus was built to tell: macro-F1 is 0.909 for every threshold below 0.60 (the planted confident-sounding false blocker — kept by pass 2's blocker bias — is still alive), 1.000 across [0.60, 0.90], and collapses at 0.95 when true findings start dying. `CONFIDENCE_THRESHOLD = 0.6` is applied at the final emission stage only (`review-filter.ts` default; `applyConfidenceThreshold` in real mode); `--raw` preserves unthresholded output for pass-2 input and for the sweep itself. `review:calibrate --check` fails if the corpus and the constant drift apart; no stratum sits below F1 0.7.
- **`npm run review:eval`** now chains all three acceptance harnesses: filter (task A), split (task B), calibration (task F).
- Prompt `v1.1-2026-08-04`: added §Confidence threshold and §Pass scopes; all fixture `promptVersion` strings updated.

**Still open beyond v0.7:** nothing on the Scenario 5 deepening list. The review workflow is now hosted at the repo root (`.github/workflows/claude-review.yml`, working-directory pinned back to this subproject) so it actually executes on the repo's PRs — this copy remains the annotated teaching artifact. Candidate next direction: the parent playbook's test suite.

## 10. Open decisions for the first session

Before scaffolding code, lock these:

1. **Project name.** Working title: *Claude Code Companion*. Alternatives: *Claude Code Playbook*, *cc-onboard*.
2. **Single project vs. monorepo with the parent.** Default to a separate Vite project here. Share lifted modules via a small vendored copy until shared code stabilises; only then extract to a package.
3. **Terminal sim library.** xterm.js is the obvious pick; confirm bundle-size impact before committing.
4. **Live shell-out to `claude`.** Off by default; spec the opt-in switch in settings now so it isn't a retrofit.
5. **Visibility of `/under-the-hood`.** Default: link only from the footer + via a `?dev=1` query param. Keep it off the primary nav so beginners aren't confused.
6. **Real-SDK content pipeline (Scenario 6).** Runs as a `npm run extract` script, not in-browser. Output checked in. Decide: do we ship a small example source so the script is runnable end-to-end on first clone?
7. **CI cost ceiling (Scenario 5).** What's the monthly budget for Claude review on this repo's PRs? Affects model choice + scope of the prompt.
8. **Default browser-native model.** Llama 3.2 3B Instruct (~2 GB) is the proposed default for the WebLLM adapter. Alternatives: Phi-3 mini (smaller, slightly weaker), Qwen2.5 3B (better non-English, larger). Pick before v0.3.
9. **WebGPU fallback policy.** When the browser has no WebGPU (older Safari, locked-down enterprise), the browser-native adapter card is shown as **disabled** with a one-line reason. Confirm we are *not* falling back to a CPU/wasm runtime — too slow to be useful.
10. **Tool-use compatibility shim for local models.** JSON-in-prose with a parser + one retry is the v0.3 plan. Decide later (v0.4+) whether to invest in `outlines`/llama.cpp grammar bindings via a small Node sidecar — adds setup complexity and breaks the "no separate service" promise, so defer.

## 11. References

- Local: `../../docs/sources/Claude_Certified_Architect_–_Foundations_Certification_Exam_Guide.pdf` — the canonical six-scenario source. Verbatim names and primary domains in §2 come from this PDF.
- Parent: `../../PROJECT_SPECIFICATIONS.md`, `../../PROJECT_ARCHITECTURE.md`, `../../src/data/flows.ts`
- Claude Code docs — https://code.claude.com/docs/en
- Claude Code GitHub Action — https://github.com/anthropics/claude-code-action
- Claude API overview — https://platform.claude.com/docs/en/api/overview
