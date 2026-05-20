<script setup lang="ts">
// Scenario 4 v0.4 task 9 — runnable demo for the Codebase Researcher subagent.
//
// THE RECURSION SEAM. Under-the-hood is the one place permitted to import the
// agent layer directly: it is the architect-substrate surface and its whole
// purpose is to expose how the in-app subagents work. Every OTHER view in this
// project must go through a coordinator (see `src/views/CLAUDE.md` rule 2).
// Bypassing the coordinator here is intentional — we want to drive the spoke
// in isolation, not as part of a Tutor turn.
//
// Three canned prompts exercise the researcher's three branches:
//   1. Symbol-first  — "hub-and-spoke coordinator" lands on the `coordinator`
//      identifier via `search_symbol`.
//   2. Type symbol  — "ToolResponse shape" hits the PascalCase symbol path.
//   3. Free-text grep — "escalation predicates" has no camel/snake identifier,
//      so it falls through to the keyword-grep branch.
//
// On click we render: the prompt, the researcher's `output`, its `summary`
// (the v0.3 context-isolation field), citation chips (path:line with truncated
// preview), and a chip per tool call. A "Run all" button fires them in order.

import { ref, reactive } from 'vue';
import { codebaseResearcher } from '@/agents/tutor/subagents/codebaseResearcher';
import type { SubagentInvocation } from '@/agents/tutor/subagents/types';

interface DemoSlot {
  prompt: string;
  /** Why we picked this prompt — surfaced as a subtitle. */
  hint: string;
  pending: boolean;
  result: SubagentInvocation | null;
  error: string | null;
}

const PROMPTS: Array<Pick<DemoSlot, 'prompt' | 'hint'>> = [
  {
    prompt: 'Where is the hub-and-spoke coordinator?',
    hint: 'Symbol-first path — the prompt names a camelCase identifier.',
  },
  {
    prompt: 'Show me the ToolResponse shape',
    hint: 'Type symbol path — `ToolResponse` is a PascalCase export.',
  },
  {
    prompt: 'Find the escalation predicates',
    hint: 'Free-text grep — no identifier-shaped token, falls through to keyword grep.',
  },
];

const slots = reactive<DemoSlot[]>(
  PROMPTS.map((p) => ({ ...p, pending: false, result: null, error: null })),
);

const runningAll = ref(false);

async function runOne(slot: DemoSlot) {
  if (slot.pending) return;
  slot.pending = true;
  slot.error = null;
  slot.result = null;
  try {
    slot.result = await codebaseResearcher(slot.prompt);
  } catch (e) {
    slot.error = e instanceof Error ? e.message : String(e);
  } finally {
    slot.pending = false;
  }
}

async function runAll() {
  if (runningAll.value) return;
  runningAll.value = true;
  // Serial: even though `Promise.all` would be fine here, sequencing keeps
  // the visible demo legible — the user sees one slot light up at a time.
  for (const slot of slots) {
    await runOne(slot);
  }
  runningAll.value = false;
}

/** Citation tool-calls are emitted by the researcher with `name: 'cite'`.
 *  Same runtime narrowing as `src/views/TutorView.vue` — keep the shape
 *  flexible since the under-the-hood surface is allowed to render either
 *  branch of the v0.3 source/document citation union. */
interface Citation {
  path: string;
  line: number;
  preview: string;
}
function citationsFrom(result: SubagentInvocation): Citation[] {
  const out: Citation[] = [];
  for (const tc of result.toolCalls) {
    if (tc.name !== 'cite') continue;
    const i = tc.input;
    if (
      i &&
      typeof i === 'object' &&
      typeof (i as Record<string, unknown>).path === 'string' &&
      typeof (i as Record<string, unknown>).line === 'number' &&
      typeof (i as Record<string, unknown>).preview === 'string'
    ) {
      const rec = i as Record<string, unknown>;
      out.push({
        path: rec.path as string,
        line: rec.line as number,
        preview: (rec.preview as string).split('\n')[0]?.slice(0, 100) ?? '',
      });
    }
  }
  return out;
}

/** Tool-call chips show only the four known names; everything else collapses
 *  to a single 'other' chip so a future tool addition doesn't break layout. */
function toolCallChips(result: SubagentInvocation): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();
  for (const tc of result.toolCalls) {
    const key = ['search_symbol', 'grep_source', 'read_source_file', 'cite'].includes(tc.name)
      ? tc.name
      : 'other';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, count]) => ({ name, count }));
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between gap-2">
      <p class="text-xs text-ink-600">
        Three canned prompts driven against the in-app
        <code class="mono">codebaseResearcher</code> subagent. Each call hits
        the live source-index — citations point at real files.
      </p>
      <button
        type="button"
        class="text-xs px-3 py-1 rounded border border-ink-300 hover:border-ink-900 disabled:opacity-50"
        :disabled="runningAll"
        @click="runAll"
      >
        {{ runningAll ? 'Running…' : 'Run all' }}
      </button>
    </div>

    <div
      v-for="slot in slots"
      :key="slot.prompt"
      class="rounded border border-ink-200 bg-white p-3 space-y-2"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="space-y-0.5">
          <p class="text-sm font-medium text-ink-900">{{ slot.prompt }}</p>
          <p class="text-xs text-ink-500 italic">{{ slot.hint }}</p>
        </div>
        <button
          type="button"
          class="text-xs px-2 py-1 rounded border border-ink-300 hover:border-ink-900 disabled:opacity-50 shrink-0"
          :disabled="slot.pending || runningAll"
          @click="runOne(slot)"
        >
          {{ slot.pending ? '…' : slot.result ? 'Re-run' : 'Run' }}
        </button>
      </div>

      <div v-if="slot.error" class="text-xs text-stage-s5 mono">
        Error: {{ slot.error }}
      </div>

      <div v-if="slot.result" class="space-y-2">
        <!-- Summary (highlighted — v0.3 TS 5.4 context-isolation field) -->
        <div
          class="rounded bg-stage-s4/10 border border-stage-s4/30 px-2 py-1 text-xs"
        >
          <span class="text-stage-s4 font-semibold mr-1">summary</span>
          <span class="text-ink-800">{{ slot.result.summary }}</span>
        </div>

        <!-- Full output -->
        <div class="text-xs text-ink-800 whitespace-pre-wrap mono">
          {{ slot.result.output }}
        </div>

        <!-- Citations -->
        <div
          v-if="citationsFrom(slot.result).length"
          class="space-y-1"
        >
          <p class="text-xs text-ink-500 uppercase tracking-wide">citations</p>
          <ul class="space-y-1">
            <li
              v-for="c in citationsFrom(slot.result)"
              :key="`${c.path}:${c.line}`"
              class="text-xs mono text-ink-700"
            >
              <span class="text-stage-s4">{{ c.path }}:{{ c.line }}</span>
              <span class="text-ink-500 ml-2">— {{ c.preview }}</span>
            </li>
          </ul>
        </div>

        <!-- Tool calls -->
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="chip in toolCallChips(slot.result)"
            :key="chip.name"
            class="text-xs mono px-2 py-0.5 rounded border border-ink-300 bg-ink-50 text-ink-700"
          >
            {{ chip.name }} × {{ chip.count }}
          </span>
          <span class="text-xs text-ink-500 mono ml-1">
            {{ slot.result.durationMs }}ms
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
