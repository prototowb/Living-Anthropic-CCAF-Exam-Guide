# PROJECT STATUS — Architect Interactive Playbook

> **Single Source of Truth** for project state. This is the file every new session reads first.

## 🤝 Hand-off — start here

**What this is.** An interactive study companion for the **Claude Certified Architect — Foundations** exam. Vue 3 + TypeScript SPA, runs entirely in the browser. The codebase is intentionally a **living study guide**: every directory mirrors one of the 5 exam domains, and every architect mandate has a real, runnable demonstration on the pattern showcase page.

**Where we are.** Parent app: v0.5.1 shipped 2026-06-01, typecheck + build green. The `derivates/claude-code-companion` sibling shipped v0.5.0 → v0.7.0 on 2026-08-04 (live adapters; hardened, split, calibrated CI review — now hosted at the repo root and running on every PR). See Active Tickets below.

**Read in this order:**

1. This file → know the current state and any open caveats.
2. `PROJECT_ARCHITECTURE.md` → authoritative architecture (refreshed for v0.4.0 on 2026-05-20).
3. `PROJECT_SPECIFICATIONS.md` → product vision + per-version quality bars met.
4. `AGENTS.md` → orchestration / pre-flight checklist (Proto Gear).
5. `CLAUDE.md` → auto-generated agent context (see caveat below).
6. `BRANCHING.md` / `TESTING.md` → conventions if/when you touch git or tests.

**To run.**

```bash
npm install
npm run dev        # http://localhost:5173/
# or
npm run build && npm run preview   # http://localhost:4173/
```

Mock SDK is the default — no API key needed. To switch on real Anthropic SDK calls, see `src/sdk/index.ts` (`setAdapter(createRealAdapter(apiKey))`); `realAdapter.ts` is marked dev-only because it uses `dangerouslyAllowBrowser`.

**Where to look first when the brief is unclear.**
- For exam coverage: cross-reference `src/data/flows.ts`, `src/data/domain-content/d{1..5}.ts`, and the 30 official task statements (extracted from `docs/sources/Claude_Certified_Architect_–_Foundations_Certification_Exam_Guide.pdf`).
- For routes: `src/router/index.ts`. For navigation: `src/components/AppShell.vue`.
- For state: `src/stores/{quiz,mockExam,tutor,lesson}.ts`. Persistence keys are versioned (`aip:*:v1`); see `PROJECT_ARCHITECTURE.md` §13.
- For "what does this pattern look like live": every pattern detail page (`/patterns/:id`) shows source path + code + anti-pattern + (sometimes) a live sandbox + related chips + inline quiz drill.

---

## ⚠ Known caveats / stale items at hand-off

1. ~~**`CLAUDE.md` lists `PROJECT_ARCHITECTURE.md` as "not present".**~~ Resolved 2026-08-05 via `pg sync-context`. Standing rule remains: do not hand-edit CLAUDE.md between the `<!-- begin -->` / `<!-- end -->` markers.
2. **Some `src/agents/*.ts` files are referenced by patterns but exist only conceptually** (no `.ts` on disk): `hooks.ts`, `prerequisites.ts`, `decomposition.ts`. They appear in pattern code snippets and are illustrative — the wiring is sound (the `coordinator.ts` and the wired tools/subagents are real). If you ever decide to add them as real modules, the code in the relevant pattern snippets is intended to be drop-in.
3. **`docs/sources/quizData.js`** is the original source for the typed `src/data/quizData.ts`. The typed module is the source of truth now; the `.js` file is kept for provenance.
4. ~~**No git repo yet.**~~ Resolved: the repo lives at `github.com/prototowb/Living-Anthropic-CCAF-Exam-Guide` (remote `origin`, default branch `main`, PRs #1–#6 merged as of 2026-08-05). Note `pg ticket create/list` currently writes nothing to this file — tickets are maintained by hand in the Active Tickets section below.
5. **Sass deprecation warning at build time** (`legacy-js-api`) is a Vite-side issue, not from our SCSS. Harmless; will go away when Vite bumps its Sass plugin.

---

## 📊 Current State

```yaml
project_phase: "v0.5.2 — SR scheduler tunables (Leitner presets in /practice)"
protogear_enabled: true
framework: "Vue 3 + Vite + TypeScript"
project_type: "Single-page application (browser-only)"
initialization_date: "2026-05-15"
current_sprint: null
last_release: "v0.5.2 — 2026-08-05"
exam_coverage: |
  32 patterns × 30 official task statements
  · 59-question timed mock exam (configurable budget, weak-spots scope, reverse-link walkthrough)
  · 9 named flows (6 canonical + 3 variants: failure-recovery, cache-aware, cost-budget)
  · 4 live sandboxes
  · 27 micro-lessons (11 reorder + 2 blanks + 5 mcq + 9 flow-builder)
  · Leitner-box spaced repetition (auto-enrolls wrong quiz answers)
  · 40-entry glossary keyed to pattern tags
  · Tutor: opt-in real Anthropic SDK with session-only API key
build:    "typecheck ✓ · vite build ✓"
bundle:   "≈ 105 kB JS gzipped, ≈ 40 kB CSS gzipped (route-level lazy chunks)"
```

## 🗺 Surface inventory (at v0.5.0)

| Route | Component | What it does |
|---|---|---|
| `/` | `HomeView.vue` | Pitch · progress tiles · jump-ins (mock exam, atlas) |
| `/quiz` | `QuizIndexView.vue` | 4 section cards with per-section progress |
| `/quiz/:section` | `QuizSectionView.vue` | Section context + question grid |
| `/quiz/:section/:qid` | `QuizQuestionView.vue` | Reveal with explanation + **reverse-link chips** |
| `/mock-exam` | `MockExamStartView.vue` | Start screen (budget · scope · shuffle · history) |
| `/mock-exam/run` | `MockExamRunView.vue` | Timed runner, nav grid, flag, auto-submit |
| `/mock-exam/result/:id` | `MockExamResultView.vue` | Score ring · per-section bars · review-item list |
| `/mock-exam/review/:id` | `MockExamReviewView.vue` | Step-through review with reverse-links |
| `/domains` | `DomainsIndexView.vue` | 5 domain cards |
| `/domains/:id` | `DomainView.vue` | Patterns for a domain + linked quiz items |
| `/atlas` | `AtlasView.vue` + `FlowGraph.vue` | SVG concept map · flow-highlight overlay |
| `/atlas/:flowId` | `FlowWalkthroughView.vue` | Step-by-step walkthrough of a named flow |
| `/tutor` | `TutorView.vue` | Hub-and-spoke chat · subagent breakdown · scratchpad |
| `/patterns` | `PatternsIndexView.vue` | Filters (D1-5, type), search, match snippets |
| `/patterns/:id` | `PatternView.vue` | Code + flow strip + anti-pattern + sandbox + drill |
| `/lessons` | `LessonsIndexView.vue` | 27 micro-lessons across 4 formats |
| `/lessons/:id` | `LessonView.vue` | Reorder / Blanks / Mcq / FlowBuilder runner |
| `/practice` | `WeakSpotsView.vue` | Leitner SR runner over wrong-answered questions |
| `/glossary` | `GlossaryView.vue` | 40-entry term index, filterable by category |

## 🎫 Active Tickets

- **AIP-052** — **Parent: print-friendly per-domain study sheet** (promoted from the backlog hints; **planned as the first item of the next session**). `/domains/:id?print=1` renders a condensed printable layout, mirroring the pattern shipped in the atlas's v0.3 (`derivates/exam-scenarios-atlas/src/views/ScenarioView.vue` print branch + its `@media print` block in `src/styles/main.css`): domain title/subtitle, each pattern with its `taskRef`, summary and one-line anti-pattern failure mode, linked quiz-question references with answers marked, `no-print` chrome (the parent's sidebar/app shell), an `avoid-break` class on repeating blocks, and a "Study sheet ⎙" entry link on the interactive `DomainView`. Verify per the CDP recipe (hash routing: `/#/domains/d1?print=1` — note the parent puts query *inside* the hash). *IN REVIEW — PR #13.*

## 🪜 Suggested next moves (backlog hints)

These are not commitments — they're directions the architecture is set up to accept cheaply.

- ~~Print-friendly per-domain study sheet~~ — promoted to ticket **AIP-052**.
- **Tests.** No test suite yet — **explicitly on hold per project owner (2026-08-05)**. If/when resumed: Vitest + Vue Test Utils for stores + lesson components first; the views are mostly composition and probably aren't where bugs hide.
- **Real-mode CI review** — the repo-root claude-review workflow runs in dry-run mode; adding the `ANTHROPIC_API_KEY` secret (+ optional `CLAUDE_REVIEW_MONTHLY_BUDGET_USD` variable) switches it to live two-pass Claude reviews.
- **Companion manual verification** — WebLLM ~2 GB download + first message; a live Ollama/LM Studio turn.

## ✅ Completed Tickets (all sprints)

- **AIP-051** — exam-scenarios-atlas v0.4.0 adaptive drill (PR #11, merged 2026-08-06): weak-spot-weighted runs, accuracy breakdown + chips at points of action, focused runs (`/drill?scenario=n`), quit + forget-history controls. Hardened against corrupt localStorage in a pre-merge edge-case pass (2 real bugs fixed); sampling behaviour guarded offline by `npm run check:drill`.
- **AIP-050** — `derivates/exam-scenarios-atlas` built out v0.1 → v0.3 (PRs #8–#10, all merged 2026-08-05): scenario-first atlas with all 6 scenarios + 12 exam-guide sample questions, `/drill` recognition mode, parent reverse-links, `/matrix`, 12 anti-pattern foil pairs, print study sheets. PROJECT_PLAN §8 roadmap fully shipped.
- **INIT-001** — Proto Gear Agent Framework integrated
- **AIP-001** — Vite + Vue 3 + TS scaffold (Pinia, vue-router, Tailwind, SCSS+BEM)
- **AIP-002** — Spec expanded; architecture extracted
- **AIP-003** — `docs/sources/quizData.js` → typed `src/data/quizData.ts` (4 sections, 59 questions)
- **AIP-004** — Mock SDK adapter + hub-and-spoke coordinator + 3 subagents + 5 granular tools
- **AIP-005** — Pinia stores: quiz, tutor, lesson (localStorage persistence)
- **AIP-006** — Router + app shell (sidebar themed by section color)
- **AIP-007** — Quiz runner with explanations + wrong-answer rationales
- **AIP-008** — 5 domain study pages with pattern cards and linked quiz questions
- **AIP-009** — Claude tutor chat (hub-and-spoke, subagent breakdown, scratchpad panel)
- **AIP-010** — Pattern showcase: searchable index + per-pattern source viewer
- **AIP-011** — 10 micro-lessons (reorder / blanks / mcq)
- **AIP-012** — v0.1.0 verify: typecheck ✓ · build ✓ · dev + preview servers boot ✓
- **AIP-013** — `DomainPattern` type extended + 15 existing patterns backfilled
- **AIP-014** — 16 new patterns authored from missing tasks
- **AIP-015** — 4 live sandbox components
- **AIP-016** — `PatternView` extended (anti-pattern foil + sandbox slot + related chips + inline drill)
- **AIP-017** — `PatternsIndexView` extended (filter chips + tag system + search snippets)
- **AIP-018** — SCSS for new BEM components (anti-pattern, sandbox, related-chips)
- **AIP-019** — v0.2.0 verify
- **AIP-020** — Reverse-link index (`question → patterns`)
- **AIP-021** — Mock-exam Pinia store
- **AIP-022** — SCSS for mock-exam UI (timer, nav grid)
- **AIP-023** — `MockExamStartView`
- **AIP-024** — `MockExamRunView`
- **AIP-025** — `MockExamResultView`
- **AIP-026** — `MockExamReviewView`
- **AIP-027** — Router + sidebar + home tile + reveal-panel chips wired
- **AIP-028** — v0.3.0 verify
- **AIP-029** — `flows.ts` — 6 named flows
- **AIP-030** — Flow derivation helpers
- **AIP-031** — `PatternView` flow strip
- **AIP-032** — `AtlasView` + `FlowGraph` SVG component
- **AIP-033** — `FlowWalkthroughView`
- **AIP-034** — 8 new reorder lessons
- **AIP-035** — Flow-builder lesson format + 5 lessons
- **AIP-036** — Router + sidebar + home wired for atlas
- **AIP-037** — v0.4.0 verify
- **AIP-038** — Leitner-box `weakSpots` Pinia store; `quizStore.recordAnswer` syncs the SR schedule on every answer
- **AIP-039** — `/practice` (`WeakSpotsView.vue`) runner + Home tile (renders only when `totalEnrolled > 0`)
- **AIP-040** — `/glossary` (`GlossaryView.vue`) with 40 entries; pattern matches auto-derived from each entry's term/aliases against pattern `tags`
- **AIP-041** — Session-only real-SDK opt-in in `/tutor`: `connectRealSdk(key)` / `disconnectRealSdk()` route through `setAdapter`; key held in a `shallowRef` (no `localStorage`, no `sessionStorage`, no `console.log`)
- **AIP-042** — 3 new variant flows in `src/data/flows.ts` (`multi-agent-research-recovery`, `coordinator-turn-cached`, `extraction-pipeline-batched`)
- **AIP-043** — 4 new flow-builder lessons (`l24`..`l27`): covers the previously-uncovered tool-call-lifecycle flow + the three variants
- **AIP-044** — v0.5.0 verify
- **AIP-045** — Atlas variant toggle: `variant` field on `Flow`; canonical six default on `/atlas`, variants hidden behind "Show variant flows" checkbox with count badge
- **AIP-046** — Glossary deep-link from pattern tags: `PatternView` tag pills → `<RouterLink to="/glossary?q=tag">`; `GlossaryView` seeds search from `?q=` and watches for nav between tag-chip links
- **AIP-047** — Tutor chat composer layout fix: `.chat` uses `min-height`/`max-height` bounds instead of fixed `height`; thread gets `min-height: 0` so composer stays in view on tall empty viewports
- **AIP-048** — `HomeView` dynamic flow count: replaced hard-coded `"6 named flows"` with `{{ flows.length }}`
- **AIP-049** — SR scheduler tunables (v0.5.2): three Leitner presets (`intense` / `standard` / `relaxed`) in `src/stores/weakSpots.ts` (`SCHEDULES`, `setSchedule` reschedules enrolled entries from `lastReviewedAt`); collapsible picker panel in `/practice`; schedule-aware page subtitle; `scheduleId` persisted additively in `aip:weak-spots:v1`

## 📈 Build / quality

| Check | Status | Notes |
|---|---|---|
| `vue-tsc --noEmit` | ✓ | strict-mode passes |
| `vue-tsc -b && vite build` | ✓ | builds cleanly |
| Preview HTTP 200 | ✓ | all new chunks (atlas, flow walkthrough, mock-exam, sandboxes) serve OK |
| Lint | n/a | no linter configured |
| Tests | n/a | no test suite yet |

## 🗒 Chronological log

- 2026-05-15: Sprint 1 — v0.1.0. Scaffold + agent layer + quiz + tutor + showcase + 10 lessons.
- 2026-05-17: Sprint 2 — v0.2.0. PDF audit (30 tasks). 17 new patterns. 4 live sandboxes. PatternView extended. Index filters + match snippets.
- 2026-05-18: Sprint 3 — v0.3.0. Reverse-link index. Mock-exam store + 4 routes. Reveal-panel chips. Home tile.
- 2026-05-18: Sprint 4 — v0.4.0. 6 named flows + flow helpers. Pattern flow strip. Concept Atlas (SVG) + flow walkthroughs. 8 new reorder lessons + new `flow` format + 5 flow-builder lessons. Atlas in sidebar + home tile.
- 2026-05-20: Docs refreshed for hand-off (`PROJECT_ARCHITECTURE.md`, `PROJECT_SPECIFICATIONS.md`, this file).
- 2026-05-26: Sprint 5 — v0.5.0. Spaced repetition (Leitner + `/practice` + Home tile). `/glossary` with 40 entries auto-linked to pattern tags. Session-only real-SDK opt-in in `/tutor`. 3 new variant flows + 4 new flow-builder lessons (covers the previously-uncovered tool-call-lifecycle).
- 2026-06-01: v0.5.1 polish. Atlas variant toggle (canonical 6 default, +3 variants opt-in). Glossary deep-link from pattern tag chips (`/glossary?q=`). Tutor composer visible on tall empty viewports. HomeView flow count dynamic.
- 2026-08-04: `derivates/claude-code-companion` shipped v0.5.0 (live adapters), v0.6.0 (hardened two-pass CI review), v0.7.0 (split review + calibrated confidence gate — Scenario 5 deepening backlog closed). The companion's Claude-review workflow is now hosted at the repo root (`.github/workflows/claude-review.yml`) and runs on this repo's PRs: dry-run mode without secrets; set `ANTHROPIC_API_KEY` (secret) and optionally `CLAUDE_REVIEW_MONTHLY_BUDGET_USD` (variable) for real reviews.
- 2026-08-05: v0.5.2 — AIP-049 SR scheduler tunables in `/practice`. Housekeeping: CLAUDE.md index regenerated (`pg sync-context`), stale caveats closed, merged branches pruned, AIP-050 (exam-scenarios-atlas build-out) queued for next session. Parent test suite explicitly on hold.
- 2026-08-05: AIP-050 — `derivates/exam-scenarios-atlas` v0.1.0. The parked worktree held a complete untracked scaffold (contrary to its "no unique work" label): all 6 scenario pages (infographic + example + living flow + worked code + Q&A), all 12 exam-guide sample questions + 6 authored ones, hash routing, zero runtime network. Salvaged, verified (typecheck + build + CDP smoke test over 4 routes), PROJECT_PLAN.md added; stale worktree/branch removed.
- 2026-08-05: exam-scenarios-atlas v0.2.0 (stacked on the v0.1 PR): `/drill` scenario-recognition mode — 18 authored fragments (12 scenario-asks, 6 domain-asks), Pinia store, aggregate-only localStorage (`esa:drill:v1`, runs reset by design) — and reverse-link chips from domain badges (→ parent `/domains/dN`) and `TS x.y` mandate tags in flow steps + Q&A reveals (→ parent `/patterns/:id` via the checked-in taskRef map; every task statement the atlas cites has a parent pattern route). Verified via 8-check CDP smoke test incl. drill click-through and persistence assertion.
- 2026-08-05: exam-scenarios-atlas v0.1 + v0.2 merged (PRs #8, #9 ff-merged, branches pruned). v0.3.0: `/matrix` scenario × domain matrix (derived live — flow mandates + Q&A refs + foil refs; primary-domain cells shaded; chips open parent patterns), anti-pattern foils section on every scenario page (12 authored wrong-vs-right pairs, `foils` now required on `Scenario`), print-friendly study sheets (`?print=1`, flow expanded, answers marked, `@media print` styles). Tailwind safelist added for dynamic `bg-domain-*` classes. Verified via 5-check CDP smoke test.
- 2026-08-05: exam-scenarios-atlas v0.3 merged (PR #10); AIP-050 closed (roadmap v0.1–v0.3 fully shipped). AIP-051 opened and built: v0.4.0 adaptive drill — weak-spot-weighted runs, accuracy breakdown, `?scenario=n` focused runs, mid-run quit. Weighting verified statistically node-side (5k orderings: weak items avg position 3.7 vs 9.1; flat weights uniform) + 5-check CDP browser test.
- 2026-08-06: v0.4 edge-case hardening (pre-merge review of PR #11). Two real bugs found and fixed: (1) valid-JSON-wrong-shape localStorage (e.g. missing `byScenario`) blanked the whole drill page — stats are now rebuilt field-by-field via `normalizeStats()` on load; (2) poisoned buckets (correct > attempts, non-numeric) produced negative/NaN sampling weights — `itemWeight` now clamps to [1, 4] and treats unparseable buckets as unseen. Checks made durable as `npm run check:drill` (statistical bias + corruption safety, offline). Verified: 11 node checks, 10 browser edge checks (partial/poisoned stats, invalid `?scenario=` values, option spam, quit/restart, focused-run completion), 5-check regression — all green. Also caught during testing: a stale preview server was serving the parent app on the atlas port — invalidated one test round before detection.
- 2026-08-06: v0.4 stats-loop closure (third commit on PR #11): breakdown scenario rows link to focused runs, "forget my drill history" (two-step confirm → `clearStats()`), run-complete screen offers "Drill weak spots" directly, accuracy chips on scenario-page drill links + home tile (`accuracyFor` getter). 6 new browser checks + full regression (10 edge + 5 smoke + 11 node) green.
- 2026-08-06: PR #11 ff-merged (atlas v0.4.0 complete, 3 commits: adaptive drill → corruption hardening → stats-loop closure); AIP-051 closed, branch pruned. AIP-052 opened for next session: parent print-friendly per-domain study sheet (`/domains/:id?print=1`), transferring the atlas v0.3 print pattern. Session finalized.
- 2026-08-06: AIP-052 built (PR #13): parent `/domains/:id?print=1` study sheet — white paper sheet (parent is dark-themed) with domain header, all patterns (taskRef + source + summary + one-line ✗ anti-pattern failure mode), linked quiz questions with ✓-marked answers + explanations; `no-print` control bar, `avoid-break` blocks, `@media print` block in `main.scss` (hides app-shell sidebar, flattens layout, white body); 'Study sheet ⎙' entry link on interactive `DomainView`. Verified: vue-tsc + build clean; headless Chrome dumps of `/#/domains/d1?print=1` (header, 8 patterns, marked answers, 15 avoid-breaks) and `/#/domains/d3` (entry link, query inside hash); print rules present in built CSS. Note: headless Chrome now writes `--dump-dom` output but no longer exits on its own — run detached and read the file.

---
*Maintained by ProtoGear Agent Framework*
