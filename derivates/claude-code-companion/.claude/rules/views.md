---
description: Path-specific rules for Vue views. Glob-scoped per TS 3.3.
paths:
  - "src/views/**"
---

# Views rules (glob-scoped)

These rules are activated by path glob `src/views/**`. They overlap with `src/views/CLAUDE.md` — same content, different binding mechanism (path-glob vs working-directory).

1. **One concept per view.** Quiz section, quiz question, lesson, stage, sandbox — each is its own file. Don't conditionally render unrelated layouts in one view.
2. **No agent imports.** Views talk to stores; stores talk to agents. Importing `src/agents/*` from a view bypasses the only mutation gateway and breaks the SDK adapter swap.
3. **Stores only via composition API helpers** (`useTutorStore`, `useProgressStore`, …). Never construct a store directly.
4. **Markdown bodies flow through `MarkdownBlock.vue`.** Don't write hand-rolled HTML for stage bodies.
5. **The `/under-the-hood` view is the only place** that references the architect substrate by name (Scenario N, "mandate", etc.). All other views stay in beginner voice.
6. **`defineProps` is the first statement in `<script setup>`.** Reading the component's contract should not require scrolling. Reactive locals come after props.
7. **No direct `localStorage`.** Persistence goes through `src/stores/persist.ts` so the `:v1` shape-bump convention is honoured.
