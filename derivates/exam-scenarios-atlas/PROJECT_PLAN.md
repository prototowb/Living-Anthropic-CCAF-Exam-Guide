# Exam Scenarios Atlas — Project Plan

> A focused study companion whose **surface** teaches the six **Claude Certified Architect — Foundations** exam scenarios as first-class, navigable objects.
>
> The family gap this fills:
> - The **parent** (`architect-interactive-playbook`) teaches the five exam **domains** directly — domain-first navigation, pattern-by-pattern.
> - The **sibling** (`claude-code-companion`) teaches Claude Code to beginners and uses the six scenarios as invisible engineering **substrate**.
> - **This derivative** pivots to **scenario-first**: the reading order a candidate actually faces in the exam room. You are handed a scenario, and the skill under test is recognising which domains, mandates, and architecture moves apply — and why the plausible-sounding alternatives fail.
>
> **Audience:** an exam candidate in the final prep phase. They have (or could get) the domain content from the parent; what they drill here is *scenario recognition* — reading a brief and naming the moves.
>
> **Zero network at runtime.** Pure static content — no SDK, no adapters, no API key. Everything is bundled.

---

## 1. The idea, in one paragraph

Each of the six exam scenarios gets one page with a fixed four-piece anatomy: an **infographic** (the architecture as a single SVG readable in ten seconds), a **worked example** (a concrete real-world story that anchors the abstraction), a **living flow** (a steppable walkthrough of the loop showing tool calls and `stop_reason` transitions, each step tagged with the exam mandate it demonstrates), and **worked code + sample Q&A** (runnable-shaped sketches plus the exam guide's own sample questions, answers revealed on demand with why-the-foils-fail explanations). The home page is the atlas: six cards, each badged with its primary domains, so the scenario ↔ domain mapping is the first thing a visitor internalises.

## 2. Surface areas (routes)

| Route | Page | What it does |
|---|---|---|
| `/` | Atlas home | Six scenario cards with hooks + primary-domain badges |
| `/scenario/:id` | Scenario page | The four-piece anatomy: brief → infographic → example → living flow → worked code → sample Q&A → takeaways. Prev/next ring navigation. |
| `/domains` | Domain legend | The five domains with weights and one-liners; which scenarios exercise each |
| `/about` | About | What this app is, sources, relationship to the parent |

Hash routing (`createWebHashHistory`) — works from any static host without rewrites, same as the parent and sibling.

## 3. The four-piece anatomy (per scenario)

1. **Infographic** — `Infographic.vue` renders one of six named SVG archetypes (`agentic-loop`, `coordinator-subagents`, `tool-zoo`, `plan-vs-direct`, `ci-pipeline`, `extraction-pipeline`). No diagram library; the archetypes are hand-built and shared across scenarios that express the same shape.
2. **Example** — one titled real-world story per scenario ("A customer wants two things at once") that a reader can hold while the abstraction lands.
3. **Living flow** — `LivingFlow.vue` steps through `FlowStep[]`: label, prose, illustrative tool calls with inputs/results, the `stop_reason` at step end, and a **mandate tag** (`TS x.y`) linking the step to the exam's task statements. This is the atlas's version of the family's "the code IS the lesson" principle: the loop mechanics are shown as they execute, not described.
4. **Worked code + Q&A** — `CodeExample.vue` shows 2–3 labelled code blocks per scenario (agentic loop sketch, hook gate, tool definition with structured-error envelope, …). `QandA.vue` presents MCQ items with reveal-on-demand answers and foil-by-foil explanations.

## 4. Content inventory (v0.1)

- **All 6 scenarios authored** (`src/data/scenarios/s1…s6.ts`, ~180–230 lines each), briefs verbatim from the exam guide.
- **All 12 sample questions from the exam guide v0.1** placed with their home scenarios (Q1–Q3 → S1, Q4–Q6 → S2, Q7–Q9 → S3, Q10–Q12 → S5), each with per-option explanations. S4 and S6 carry 3 authored questions each in the same format — **18 MCQ items total**.
- **Domain legend** (`src/data/domains.ts`) — the five domains with exam weights.
- **Mandate tags** — flow steps reference task statements (`TS 1.4`, `TS 5.2`, …) matching the parent's vocabulary.

## 5. Data model

One source of truth: `src/data/types.ts` defines `Scenario` (id, number, title, hook, brief, primaryDomains, example, flow, code, infographic, qna, takeaways) with `FlowStep`, `QnA`, `CodeBlock`, `InfographicSpec`. Views are pure projections of `SCENARIOS` — no view owns content. This is the family's "one source of truth per concept" principle; the graph is small enough that no store is needed yet.

## 6. Tech stack

- **Vue 3** Composition API + `<script setup lang="ts">` on **Vite 5**
- **TypeScript** strict
- **vue-router** with hash history
- **Tailwind 3** — no UI library; the visual identity (serif display, ink palette) lives in `tailwind.config.js` + `src/styles/main.css`
- **No Pinia, no SDK, no persistence** in v0.1 — deliberately. There is no mutable state yet. Each is added only when a roadmap item needs it (see §8 open decisions).

Dev server port: 5180 (parent uses 5173, companion 5174 — keep them co-runnable).

## 7. Relationship to the derivates principles

| Principle | How it lands here |
|---|---|
| The code IS the lesson | Adapted: this is a **content-first** derivative. The lesson artifacts are the worked-code blocks and the living flows — honest sketches of exam-correct architecture, not a running agent platform. The app makes no claim its own runtime demonstrates the scenarios (the sibling already does that). |
| No external network at rest | Trivially exceeded — no network, ever. |
| One source of truth per concept | `SCENARIOS` + `DOMAINS`; every view is a projection. |
| Reverse links everywhere | v0.1 has domain badges + prev/next ring; deep reverse links into the parent's `/domains/:id` are the first v0.2 item. |
| Anti-pattern foils | Present inside Q&A explanations (why each wrong option fails) and escalation-foil flow steps; a dedicated per-scenario foils section is roadmapped. |

## 8. Quality bars

| Version | Bar | Status |
|---|---|---|
| **v0.1.0 — Skeleton walks** | `typecheck` + `build` clean. All 6 scenario pages with the four-piece anatomy. All 12 exam-guide sample questions placed. 4 routes. Zero runtime network. | ✅ This PR (salvaged from the parked worktree scaffold and verified). |
| **v0.2.0 — Cross-linked** | Reverse-link chips from every scenario page into the parent playbook's `/domains/:id` (and per-mandate anchors where the parent exposes them). A **drill mode** (`/drill`): show a requirement fragment or log excerpt, learner picks which scenario/domain it belongs to — the recognition skill itself. localStorage progress under versioned keys (`esa:*:v1`). | ✅ Shipped. Mandate tags resolve to the parent's `/patterns/:id` via the checked-in `taskRef` map in `src/data/parentLinks.ts` (better than anchors — the parent routes every task statement); domain badges deep-link to `/domains/d{n}`; parent base URL overridable via `VITE_PARENT_BASE_URL` (no public deploy exists yet). Drill: 18 authored fragments (12 scenario-asks, 6 domain-asks), Pinia store, aggregate-only persistence under `esa:drill:v1` — runs reset by design (§9.2 decided: Q&A reveal state stays session-only). |
| **v0.3.0 — Atlas deepens** | Scenario × domain **matrix view** (`/matrix`) with mandate chips at the intersections. Dedicated anti-pattern-foils section per scenario (wrong way beside right way, one-line "why this fails"). Print-friendly per-scenario study sheet (`?print=1`). | Planned |

## 9. Open decisions

1. **Pinia** — add only when drill mode / progress tracking creates real mutable state (v0.2). Until then, no store.
2. **localStorage namespace** — `esa:*:v1` proposed; decide whether Q&A reveal-state persists at all or stays session-only (a study app may *want* questions to reset).
3. **Parent linkage** — deep links from mandate tags (`TS 1.4`) into the parent app require the parent to expose stable anchors; check before v0.2, don't guess URLs.
4. **Where the app is hosted** — standalone static bundle vs linked from the parent's footer as a family map. Affects nothing technical (hash routing), purely navigational.

## 10. References

- Local: `../../docs/sources/Claude_Certified_Architect_–_Foundations_Certification_Exam_Guide.pdf` — scenario briefs, twelve sample questions, task statements (v0.1, 10 Feb 2025).
- Parent: `../../src/data/domain-content/` (domain vocabulary), `../../PROJECT_SPECIFICATIONS.md`.
- Sibling: `../claude-code-companion/PROJECT_PLAN.md` — the plan pattern this file follows.
