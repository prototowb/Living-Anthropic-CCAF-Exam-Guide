---
name: sandbox-author
description: Scaffold a new interactive sandbox. Use when the user asks to add a sandbox, build a REPL demo, or create a hands-on widget for a stage — writes the transcript JSON, the component shell, and the index registration in one pass.
allowed-tools: Read, Edit, Write, Bash(npm run typecheck)
argument-hint: <sandbox-slug> <stage-id>
---

# sandbox-author

Scaffolds the three files a sandbox needs and registers it, so a new sandbox is one prompt away from runnable.

## When to invoke

- "Add a sandbox for stage S4."
- "Build a REPL demo of `/compact`."
- "Scaffold a sandbox called `first-tool-use`."

## Contract

1. Read `src/data/sandboxes.ts` to learn the existing transcript shape — do not infer it.
2. Ask the user for: a slug (`kebab-case`), the stage id (`s1`…`s8`), a one-sentence purpose, and which interaction kind (`transcript-replay`, `interactive-repl`, `flow-builder`).
3. Append the new sandbox object to `src/data/sandboxes.ts`, near other sandboxes of the same stage. Id format: `sb-<stageId>-<slug>`.
4. Scaffold the component at `src/components/sandboxes/<PascalCaseSlug>.vue`. Use `FirstSessionRepl.vue` as the structural template. Props must be typed against the matching `Sandbox*` type from `src/data/types.ts`.
5. Register the component in the sandbox router (`src/views/SandboxView.vue`) so `/sandboxes/<id>` resolves. Do not invent a new dispatch mechanism — follow the existing `switch (kind)` pattern.
6. **Beginner voice.** The transcript copy stays in beginner voice. No "Scenario", "mandate", or other architect vocabulary on the surface.
7. Run `npm run typecheck`. Report the slug, the three file paths touched, and the typecheck result.
