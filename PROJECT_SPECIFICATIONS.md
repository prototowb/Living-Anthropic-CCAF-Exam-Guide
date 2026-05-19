# Architect Interactive Playbook — Project Specifications

> An interactive study companion for the **Claude Certified Architect – Foundations Certification**, built as a Vue 3 / TypeScript boilerplate that uses the Anthropic SDK.
>
> The codebase is a **living study guide**: every directory, file, and convention is wired to demonstrate one of the five exam domains.

---

## 1. Product Definition

**Mission.** Help candidates prepare for the Claude Certified Architect exam by combining (a) recall-style multiple-choice questions across 4 scenario sections, (b) a timed full **mock exam** with weak-spot drill mode and a reverse-link walkthrough review, (c) applied **micro-lessons** in four formats — reorder code blocks, fill-in-the-blank, multiple-choice flashcard, and "build the flow" composition lessons, (d) **five domain study pages** indexing every mandated pattern, (e) a **pattern showcase** that surfaces each architect mandate with live source, anti-pattern foils, and runnable sandboxes, (f) a **Concept Atlas** that visualizes named flows across the whole architecture with step-by-step walkthroughs, and (g) a hub-and-spoke "**Claude Tutor**" agent powered by the Anthropic SDK (mock by default; real-SDK swap behind a one-line factory).

**Primary users.** Engineers and architects preparing for the Claude Architect Foundations exam.

**Non-goals.** This is not a general-purpose LMS. It is intentionally narrow to one certification and its five domains.

---

## 2. Five Exam Domains — Architectural Mandates

The product is structured around the five exam domains. Each domain maps to concrete, enforced patterns in the codebase.

### Domain 1 — Agentic Architecture & Orchestration

| Mandate | Where it lives |
|---|---|
| **Hub-and-Spoke architecture** — central coordinator manages specialized subagents | `src/agents/coordinator.ts` dispatches to `src/agents/subagents/*` |
| Coordinator `allowedTools` must include **`Task`** (subagent spawning) | `src/agents/coordinator.ts` — `allowedTools: ['Task', 'Read', 'Grep']` |
| **Parallel subagent execution** for independent tasks | `src/agents/coordinator.ts#runParallel` dispatches with `Promise.all` |

### Domain 2 — Tool Design & MCP Integration

| Mandate | Where it lives |
|---|---|
| **Granular Tools** (Architect's Pattern) over monolithic ones | `src/agents/tools/*.ts` — each tool does one thing |
| **Structured Error Responses**: `isError: true`, `errorCategory: 'transient' \| 'business'` | `src/agents/tools/types.ts` `ToolErrorResponse` |
| **MCP scoping**: `.mcp.json` for team tools, `~/.claude.json` for personal credentials | Examples in `src/showcase/mcp-scoping.example.json` |

### Domain 3 — Claude Code Configuration & Workflows

| Mandate | Where it lives |
|---|---|
| **CLAUDE.md hierarchy** — root for repo-wide standards, subdirectory files for area-specific rules | Root `CLAUDE.md` + `src/agents/CLAUDE.md` + `src/quiz/CLAUDE.md` |
| **Path-scoped rules** in `.claude/rules/` using glob patterns | `.claude/rules/tests.md` (glob `**/*.test.ts`) |
| **Plan Mode** for architectural changes, **Direct Execution** for narrow bug fixes | `src/agents/modes.ts` exports the routing predicate |

### Domain 4 — Prompt Engineering & Structured Output

| Mandate | Where it lives |
|---|---|
| **JSON Schemas** with the Messages API for guaranteed schema-compliant extraction | `src/agents/schemas/*.ts` |
| **Few-Shot Prompting** (2–4 examples) for ambiguous extraction/classification | `src/agents/prompts/fewShot.ts` |
| **Message Batches API** for latency-tolerant workloads | `src/agents/batches.ts` (illustrative — mocked) |

### Domain 5 — Context Management & Reliability

| Mandate | Where it lives |
|---|---|
| **Scratchpad pattern** — a `.md` file persists key findings across long sessions | `src/agents/scratchpad.ts` writes to in-memory + localStorage |
| **Explicit escalation criteria** with few-shot examples | `src/agents/escalation.ts` |
| **Context Pruning** — trim verbose tool outputs to relevant fields | `src/agents/contextPruner.ts` |

---

## 3. Surface Areas (Routes — current as of v0.4.0)

| Route | Page | What it does |
|---|---|---|
| `/` | Home | Pitch, progress at-a-glance, mock-exam + atlas jump-in tiles |
| `/quiz` | Section index | Lists 4 quiz sections with progress |
| `/quiz/:section` | Section overview | Section context + question list with state badges |
| `/quiz/:section/:qid` | Question view | One question, four options, reveal, explanations, **reverse-link chips** to the patterns each question tests |
| `/mock-exam` | Mock-exam start | 60 / 90 / 120-min time budget · all / weak-spots scope · shuffle · resume / history |
| `/mock-exam/run` | Runner | One Q at a time, no reveal, sticky timer, jump-to-Q nav grid, flag, auto-submit on timeout |
| `/mock-exam/result/:id` | Result | Score ring, per-section bars, list of wrong + unanswered + flagged |
| `/mock-exam/review/:id` | Walkthrough | Step through review items with reverse-link chips |
| `/domains` | Domain index | Lists the 5 exam domains |
| `/domains/:id` | Domain study page | Patterns, code snippets, linked quiz items |
| `/atlas` | Concept Atlas | Pure-SVG map of all 32 patterns × 6 flows; flow chips highlight pattern paths |
| `/atlas/:flowId` | Flow walkthrough | Step-by-step tour of a named flow with "why this step is here" rationale |
| `/tutor` | Claude Tutor | Hub-and-spoke chat (mock SDK by default; real SDK behind one factory) |
| `/patterns` | Pattern showcase index | Domain + type filter chips, search across summary+code+tags+taskRef with match snippets |
| `/patterns/:id` | Pattern detail | Source + code, **flow strip**, **anti-pattern foil**, **live sandbox** (4 patterns), related chips, inline quiz drill |
| `/lessons` | Lessons index | 23 micro-lessons with progress + format labels |
| `/lessons/:id` | Lesson runner | Reorder · Fill-in-blanks · Flashcard · **Build-the-flow** (4 formats) |

---

## 4. Technology Choices

- **Vue 3** (Composition API, `<script setup lang="ts">`) on **Vite**
- **TypeScript** strict mode
- **Pinia** for state (quiz progress, tutor thread, lesson progress)
- **vue-router** for routing
- **Tailwind CSS** for utility-first layout + **SCSS with BEM** for component-level styling
- **Anthropic SDK** (`@anthropic-ai/sdk`) — wired and demonstrated; defaults to a **mock adapter** so the app runs offline. The real SDK can be swapped in by changing one factory.
- **localStorage** persistence for quiz/lesson progress and the tutor scratchpad

---

## 5. Quality Bars

### v0.1.0 — First complete version (met)

- All **59 quiz questions** rendered correctly, with explanations and wrong-answer rationales when present.
- All **5 domain study pages** present with at least 3 mandated patterns each.
- The **tutor** answers via a coordinator that dispatches to ≥3 specialized subagents and demonstrates **parallel execution**, **JSON-schema responses**, **structured errors**, **few-shot prompting**, **context pruning**, and the **scratchpad**.
- ≥ **8 micro-lessons** spanning the 5 domains, in at least 2 formats.
- `npm run typecheck` passes; `npm run build` produces a clean production bundle.
- No external network calls required to run the app — the mock SDK is the default.

### v0.2.0 — Exam-ready pattern coverage (met)

- **32 patterns** authored, mapping 1:1 against the **30 official task statements** extracted from the exam guide PDF.
- Each pattern carries: `taskRef`, `type`, `tags`, `related`, anti-pattern foil (where the guide names one), optional sandbox, and `quizQuestionRefs`.
- **4 live sandboxes** wired and runnable in the browser: `context-pruner`, `structured-errors`, `few-shot-routing`, `hub-and-spoke-timeline`.
- Pattern showcase index supports domain + type filtering and snippet-highlighted search.

### v0.3.0 — Practice → reflection loop (met)

- **Timed mock exam** with configurable time budgets (60 / 90 / 120 min), shuffle, weak-spots scope, flag-for-review, auto-submit on timeout, resumable mid-session.
- **Reverse-link index** (`question → patterns it tests`) surfaced on every quiz reveal panel and on the mock-exam review walkthrough.
- Per-domain scoring + score ring + per-Q time stats + step-through review of wrong / unanswered / flagged items.

### v0.4.0 — Flow of concepts (met)

- **6 named flows** authored, each step carrying a "why this step is here" rationale.
- **Concept Atlas** (`/atlas`) — pure-SVG map (no graph library) of all 32 patterns across 5 domain columns, with flow-highlight overlay showing arrows through the selected flow.
- **Flow walkthroughs** (`/atlas/:flowId`) — guided step-by-step tour per flow.
- **Pattern flow strip** — every pattern detail exposes which flows it belongs to and what comes immediately before/after across each flow.
- **Build-the-flow lesson format** — 5 macro-level lessons; canonical pattern cards + plausible distractors; click-to-place into ordered slots; canonical rationale revealed per slot on submit.
- **23 total micro-lessons** across the 5 domains (11 reorder · 2 blanks · 5 mcq · 5 flow-builder).

---

## 6. References

- Daron Yöndem — [Claude Architect Exam Guide](https://github.com/daronyondem/claude-architect-exam-guide/blob/main/exam-preparation-guide.md)
- Govinda Paliwal — [Anthropic Claude Certified Architect Guide](https://github.com/GovindaPaliwal/Anthropic-Claude-Certified-Architect-Guide)
- [Claude Agent SDK docs](https://code.claude.com/docs/en/agent-sdk/overview)
- [Claude Code MCP servers](https://code.claude.com/docs/en/mcp-servers)
- [Claude Code agents](https://code.claude.com/docs/en/agents)
- [Anthropic API overview](https://platform.claude.com/docs/en/api/overview)
- Local: `docs/sources/Claude_Certified_Architect_–_Foundations_Certification_Exam_Guide.pdf`
- Local: `docs/sources/quizData.js` (source for the typed `src/data/quizData.ts`)

- Anthropic - [Claude Courses](https://anthropic.skilljar.com)
- Anthropic - [Building with the Claude API](https://anthropic.skilljar.com/claude-with-the-anthropic-api)
