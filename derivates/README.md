# derivates/

Sibling projects that re-use the **living-codebase teaching pattern** from `architect-interactive-playbook` but pivot the topic, audience, or surface area.

The parent project teaches the **Claude Certified Architect — Foundations** exam to engineers building agents. It treats its own source tree as the textbook: every directory mirrors an exam domain, every "mandate" has a runnable demonstration, and the codebase itself is the answer key.

Derivatives keep that philosophy and re-shape it for a different audience.

## Active derivatives

| Project | Surface (what is taught) | Source (engineering substrate) | Status |
|---|---|---|---|
| [`claude-code-companion/`](./claude-code-companion/PROJECT_PLAN.md) | **Claude Code** for beginner end users — first session, permissions, slash commands, CLAUDE.md, skills, subagents, hooks, MCP, headless, CI | All **6 Architect — Foundations** exam scenarios realised in the implementation (hub-and-spoke tutor, MCP-shaped help-bot tools, JSON-schema content pipeline, plan-mode workflow, Claude-Code-in-CI gate) | **Planning** |

## Principles inherited from the parent

1. **The code IS the lesson.** A mandate that the project demonstrates must be implemented in the code that runs the demonstration.
2. **No external network at rest.** Default to a mock SDK / mock transcripts so the app boots offline. Real-call mode is one factory swap away.
3. **One source of truth per concept.** Quiz items, lessons, sandboxes, and atlas nodes all reference the same canonical entity by id.
4. **Reverse links everywhere.** Every concept page lists which lessons / quizzes / flows / sandboxes reach it. Learners should never hit a dead end.
5. **Anti-pattern foils.** Each mandate shows the wrong way next to the right way, with a one-line "why this fails" caption.
