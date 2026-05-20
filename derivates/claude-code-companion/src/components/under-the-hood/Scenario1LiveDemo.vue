<script setup lang="ts">
// Scenario 1 live demo (v0.4 task 10).
//
// Three canned prompts exercise the Help Bot coordinator end-to-end, inline
// on the /under-the-hood card. Each renders the prompt, reply text, recorded
// tool calls (with ok / errorCategory chips), and — when an escalation
// fires — the reason + resolved docs link.
//
// `UnderTheHoodView` is the documented exception to the
// `views NEVER import from src/agents/**` rule — this surface is precisely
// where engineers inspect agent internals. The Help Bot sidebar at the SPA
// surface still routes through `useHelpBotStore`. See `src/views/CLAUDE.md`
// rule 5 + the "recursion-seam" note in the v0.4 sprint spec.

import { ref, computed } from 'vue';
import { helpBot, type HelpBotReply } from '@/agents/helpBot/coordinator';
import HelpBotToolChip from '@/components/HelpBotToolChip.vue';

interface DemoPrompt {
  id: string;
  label: string;
  text: string;
  /** One-line rationale shown next to the prompt; tells readers why each
   *  example was picked — nav-only resolution, lesson business error,
   *  forced escalation. */
  why: string;
}

const PROMPTS: DemoPrompt[] = [
  {
    id: 'nav',
    label: 'Nav-only resolution',
    text: 'Where are the quizzes?',
    why: 'Matches the `quiz` NAV keyword — no tool call needed.',
  },
  {
    id: 'lesson',
    label: 'Lesson lookup (business error)',
    text: 'Lesson about plan mode',
    why:
      'getLesson is fired with query="plan mode"; no matching lesson → ' +
      'business error. The helpBot still replies with a substantive message, ' +
      'so it resolves on the first turn without escalating.',
  },
  {
    id: 'escalate',
    label: 'Forced escalation',
    text: 'Talk to a human about quantum cryptography',
    why:
      'Trips the `userAskedHuman` regex → escalate(user_request) → ' +
      'escalate_to_docs resolves a curated Claude Code docs URL.',
  },
];

interface DemoResult {
  status: 'idle' | 'running' | 'done' | 'error';
  reply?: HelpBotReply;
  error?: string;
}

const results = ref<Record<string, DemoResult>>({
  nav: { status: 'idle' },
  lesson: { status: 'idle' },
  escalate: { status: 'idle' },
});

const anyRunning = computed(() =>
  Object.values(results.value).some((r) => r.status === 'running'),
);

async function runOne(p: DemoPrompt) {
  results.value = { ...results.value, [p.id]: { status: 'running' } };
  try {
    const reply = await helpBot.handle(p.text);
    results.value = { ...results.value, [p.id]: { status: 'done', reply } };
  } catch (e) {
    results.value = {
      ...results.value,
      [p.id]: {
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
      },
    };
  }
}

async function runAll() {
  // Sequential — running three turns concurrently would interleave the
  // module-level `_consecutiveBusinessErrors` counter in the coordinator,
  // making the per-card escalation budget unreadable.
  for (const p of PROMPTS) {
    await runOne(p);
  }
}
</script>

<template>
  <div class="space-y-3 text-sm">
    <header class="flex items-baseline justify-between gap-2 flex-wrap">
      <div>
        <p class="text-ink-700">
          Three canned prompts run end-to-end through the Help Bot coordinator
          (<code class="mono text-xs">src/agents/helpBot/coordinator.ts</code>).
        </p>
        <p class="text-xs text-ink-500">
          Per-turn surface: reply text, tool-call chips with error-category
          colour, escalation reason + resolved docs link.
        </p>
      </div>
      <button
        type="button"
        class="px-3 py-1.5 text-xs rounded border border-ink-900 bg-ink-900 text-white disabled:opacity-50"
        :disabled="anyRunning"
        @click="runAll"
      >
        Run all demos
      </button>
    </header>

    <ul class="space-y-3">
      <li
        v-for="p in PROMPTS"
        :key="p.id"
        class="border border-ink-200 rounded-lg p-3 bg-white space-y-2"
      >
        <div class="flex items-baseline justify-between gap-2 flex-wrap">
          <div class="min-w-0">
            <div class="text-xs uppercase tracking-wide text-ink-400">
              {{ p.label }}
            </div>
            <div class="mono text-sm text-ink-900">{{ p.text }}</div>
            <div class="text-xs text-ink-500 mt-0.5">{{ p.why }}</div>
          </div>
          <button
            type="button"
            class="px-2.5 py-1 text-xs rounded border border-ink-300 hover:border-ink-900 disabled:opacity-50"
            :disabled="results[p.id].status === 'running'"
            @click="runOne(p)"
          >
            {{ results[p.id].status === 'running' ? 'running…' : 'Run' }}
          </button>
        </div>

        <div v-if="results[p.id].status === 'running'" class="text-xs text-ink-500 italic">
          calling helpBot.handle()…
        </div>

        <div
          v-else-if="results[p.id].status === 'error'"
          class="text-xs text-stage-s5"
        >
          Demo failed: {{ results[p.id].error }}
        </div>

        <div v-else-if="results[p.id].reply" class="space-y-2">
          <!-- Reply text (markdown left as plain text — the under-the-hood
               surface intentionally keeps this raw so the structure is legible). -->
          <div class="rounded bg-ink-50 border border-ink-200 px-2 py-1.5 text-xs text-ink-800 whitespace-pre-wrap">
            {{ results[p.id].reply!.text }}
          </div>

          <!-- Tool-call chips — same component as the live sidebar. -->
          <div
            v-if="results[p.id].reply!.toolCalls.length"
            class="flex flex-wrap gap-1"
          >
            <HelpBotToolChip
              v-for="(tc, idx) in results[p.id].reply!.toolCalls"
              :key="idx"
              :name="tc.name"
              :ok="tc.ok"
              :error-category="tc.errorCategory"
              :is-retryable="tc.isRetryable"
            />
          </div>

          <!-- Escalation row — only renders when the coordinator escalated. -->
          <div
            v-if="results[p.id].reply!.escalated"
            class="text-xs flex flex-wrap items-center gap-1.5"
          >
            <span
              class="mono px-1.5 py-0.5 rounded border border-stage-s5 bg-stage-s5/10 text-stage-s5"
            >
              escalate({{ results[p.id].reply!.escalated!.reason }})
            </span>
            <a
              v-if="results[p.id].reply!.escalated!.docUrl"
              :href="results[p.id].reply!.escalated!.docUrl"
              target="_blank"
              rel="noopener"
              class="underline text-stage-s2 hover:text-stage-s1"
            >
              {{ results[p.id].reply!.escalated!.docTitle }}
            </a>
          </div>

          <!-- Budget + dispatch-branch readout — surfaces the coordinator's
               telemetry the way the sidebar footer does. -->
          <div class="text-xs text-ink-500 mono flex flex-wrap gap-2">
            <span>
              budget: {{ results[p.id].reply!.consecutiveBusinessErrors }}/{{ helpBot.escalationBudgetMax }}
            </span>
            <span v-if="results[p.id].reply!.dispatchBranch">
              dispatch: {{ results[p.id].reply!.dispatchBranch }}
            </span>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
