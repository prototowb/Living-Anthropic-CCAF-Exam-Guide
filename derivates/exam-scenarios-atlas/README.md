# Exam Scenarios Atlas

A focused study companion for the **Claude Certified Architect — Foundations** exam.

Each of the six exam scenarios gets its own page with four pieces:

1. **Infographic** — the architecture, as a single SVG you can read in 10 seconds.
2. **Example** — a concrete real-world story to anchor the abstraction.
3. **Living flow** — a steppable walkthrough showing the loop, tool calls, and `stop_reason` transitions.
4. **Worked code** + **sample Q&A** — the questions from the public exam guide v0.1, answers revealed on demand.

## Scenarios

| # | Scenario | Primary domains |
|---|---|---|
| 1 | Customer Support Resolution Agent | Agentic · Tool/MCP · Context |
| 2 | Code Generation with Claude Code | Claude Code · Context |
| 3 | Multi-Agent Research System | Agentic · Tool/MCP · Context |
| 4 | Developer Productivity with Claude | Tool/MCP · Claude Code · Agentic |
| 5 | Claude Code for Continuous Integration | Claude Code · Prompt Eng. |
| 6 | Structured Data Extraction | Prompt Eng. · Context |

Beyond the six scenario pages:

- **`/drill`** — recognition drill: place a requirement fragment / log excerpt /
  stakeholder quote by scenario or domain; aggregate accuracy persists under
  `esa:drill:v1`. Adaptive: "Drill weak spots" weights the run toward
  low-accuracy (or unseen) scenarios/domains, the idle screen shows the
  per-scenario/per-domain breakdown, and `?scenario=n` (linked from each
  scenario page) focuses a run on one scenario's items.
- **`/matrix`** — scenario × domain matrix: every `TS x.y` a scenario cites, at
  its intersection with the owning domain, derived live from the scenario data.
- **Anti-pattern foils** — each scenario page shows the plausible wrong way
  beside the mandated way with a one-line "why this fails".
- **Study sheets** — `?print=1` on any scenario renders a condensed printable
  layout (flow expanded, answers marked).
- **Reverse links** — domain badges and `TS x.y` mandate tags deep-link into the
  parent playbook (`/domains/d{n}`, `/patterns/:id`). The parent's base URL
  defaults to `http://localhost:5173`; override with `VITE_PARENT_BASE_URL` at
  build time.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually <http://localhost:5180>).

```bash
npm run typecheck    # vue-tsc --noEmit
npm run build        # vue-tsc + vite build
npm run preview      # serve the built bundle
npm run check:drill  # offline checks of the adaptive-drill sampling
                     # (weak-spot bias statistics + corrupt-stats safety)
```

## Tech

- Vue 3 + TypeScript + Vite 5
- Tailwind CSS 3 (no UI library — the design lives in `tailwind.config.js` and
  `src/styles/main.css`)
- `vue-router` with hash history so the app works from a static host without
  server rewrites
- Zero network dependencies at runtime; everything is bundled

## Source of truth

Content is derived from the public *Claude Certified Architect — Foundations
Certification Exam Guide v0.1* (10 Feb 2025), including all twelve sample
questions from the guide. Three additional questions per scenario where the
guide did not provide samples (Scenarios 4 and 6) are written to match the
guide's task statements and difficulty.

## Sibling derivatives

This app is a sibling to the other derivatives under
`architect-interactive-playbook/derivates/`. It follows the same living-codebase
philosophy: every concept page can be read as documentation *and* runs as a
working interactive demo.
