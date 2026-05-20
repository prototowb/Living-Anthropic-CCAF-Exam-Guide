<script setup lang="ts">
// Help Bot sidebar (Architect Scenario 1 — Customer Support Resolution Agent).
//
// v0.2 additions:
//   - Collapsible "recent findings" panel (helpBotScratchpad.summarize(6))
//   - Colour-coded tool-call timeline via <HelpBotToolChip>
// v0.3 additions:
//   - CapabilitiesBadge in the header (sources capabilities via the store)
//   - Escalation budget chip in the footer (consecutiveBusinessErrors / 2)
//   - Clickable docs link when an escalation has resolved a URL

import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useHelpBotStore, type HelpBotMessage } from '@/stores/helpBot';
import HelpBotToolChip from '@/components/HelpBotToolChip.vue';
import CapabilitiesBadge from '@/components/CapabilitiesBadge.vue';

const helpBot = useHelpBotStore();
const router = useRouter();
const input = ref('');

const caps = computed(() => helpBot.adapterCapabilities);
const budgetUsed = computed(() => helpBot.escalationBudgetUsed);
const budgetMax = computed(() => helpBot.escalationBudgetMax);
const scratchpadText = computed(() => helpBot.scratchpadSummary);

async function submit() {
  if (!input.value.trim()) return;
  const q = input.value;
  input.value = '';
  await helpBot.ask(q);
}

/** v0.4 task 11 — "Ask the Tutor" handoff. When the helpBot couldn't resolve a
 *  question and the escalation reason is `low_confidence`, we offer to hand
 *  the same prompt to the Tutor (Scenario 3). The Tutor's intent classifier
 *  often picks up open-ended prompts the helpBot's regex routing misses. */
function originalPromptFor(assistant: HelpBotMessage): string {
  const idx = helpBot.messages.findIndex((m) => m.id === assistant.id);
  for (let i = idx - 1; i >= 0; i--) {
    if (helpBot.messages[i].role === 'user') return helpBot.messages[i].text;
  }
  return '';
}

async function askTheTutor(assistant: HelpBotMessage) {
  const original = originalPromptFor(assistant);
  if (!original) return;
  // Close the sidebar before navigating so the Tutor view isn't half-hidden.
  if (helpBot.open) helpBot.toggle();
  await router.push({
    name: 'tutor',
    query: { prompt: encodeURIComponent(original) },
  });
}
</script>

<template>
  <button
    class="fixed bottom-4 right-4 px-3 py-2 rounded-full bg-ink-900 text-white text-sm shadow-lg hover:bg-ink-700"
    @click="helpBot.toggle()"
  >
    {{ helpBot.open ? 'Close help' : 'Need help?' }}
  </button>

  <aside
    v-if="helpBot.open"
    class="fixed bottom-20 right-4 w-80 max-h-[32rem] flex flex-col bg-white border border-ink-200 rounded-lg shadow-xl"
  >
    <header class="px-3 py-2 border-b border-ink-100 text-sm font-medium flex items-center gap-2">
      <span>Help Bot</span>
      <span class="text-xs text-ink-500 mono">Scenario 1</span>
      <span class="ml-auto">
        <CapabilitiesBadge
          :native-tool-use="caps.nativeToolUse"
          :parallel-subagents="caps.parallelSubagents"
          :schema-mode="caps.schemaMode"
          :adapter-label="caps.adapterLabel"
          size="xs"
        />
      </span>
    </header>

    <!-- Collapsible scratchpad — v0.2 task 5. Pure read of helpBotScratchpad. -->
    <details
      class="border-b border-ink-100 text-xs"
      :open="helpBot.scratchpadOpen"
      @toggle="(e) => { helpBot.scratchpadOpen = (e.target as HTMLDetailsElement).open; }"
    >
      <summary class="cursor-pointer px-3 py-1.5 text-ink-500 hover:bg-ink-50 select-none">
        recent findings
        <span class="opacity-60 mono">(scratchpad)</span>
      </summary>
      <pre
        v-if="scratchpadText"
        class="px-3 py-1.5 bg-ink-50 text-ink-600 whitespace-pre-wrap mono text-[0.7rem] leading-snug"
      >{{ scratchpadText }}</pre>
      <p v-else class="px-3 py-1.5 italic text-ink-400">
        No findings yet — ask a question to populate.
      </p>
    </details>

    <div class="flex-1 overflow-auto px-3 py-2 space-y-2 text-sm">
      <p v-if="helpBot.messages.length === 0" class="text-ink-500 italic">
        Ask "where are the quizzes?" or "what's my progress?"
      </p>
      <div
        v-for="m in helpBot.messages"
        :key="m.id"
        class="rounded px-2 py-1"
        :class="m.role === 'user' ? 'bg-ink-100 text-ink-900' : 'bg-white text-ink-800'"
      >
        <div class="text-xs uppercase tracking-wide text-ink-400 mb-0.5">
          {{ m.role === 'user' ? 'you' : 'help-bot' }}
        </div>
        <div class="whitespace-pre-wrap">{{ m.text }}</div>

        <!-- Tool-call timeline (v0.2 task 6) — colour-coded chips. -->
        <div
          v-if="m.role === 'assistant' && m.meta && m.meta.toolCalls.length"
          class="mt-1.5 flex flex-wrap gap-1"
        >
          <HelpBotToolChip
            v-for="(tc, idx) in m.meta.toolCalls"
            :key="idx"
            :name="tc.name"
            :ok="tc.ok"
            :error-category="tc.errorCategory"
            :is-retryable="tc.isRetryable"
          />
        </div>

        <!-- Escalation footer with docs link, if resolved. -->
        <div
          v-if="m.role === 'assistant' && m.meta && m.meta.escalated && m.meta.escalated.docUrl"
          class="mt-1.5 text-xs"
        >
          <a
            :href="m.meta.escalated.docUrl"
            target="_blank"
            rel="noopener"
            class="underline text-stage-s2 hover:text-stage-s1"
          >
            Open docs: {{ m.meta.escalated.docTitle }}
          </a>
        </div>

        <!-- Cross-link to the Tutor (Scenario 3) — only on low_confidence
             escalations. The Tutor's intent classifier handles open-ended
             "explain X" or "quiz me on Y" prompts that the helpBot's regex
             routing isn't shaped for. v0.4 task 11. -->
        <div
          v-if="m.role === 'assistant' && m.meta && m.meta.escalated && m.meta.escalated.reason === 'low_confidence'"
          class="mt-1.5 text-xs"
        >
          <button
            type="button"
            class="px-2 py-1 rounded border border-stage-s3 bg-stage-s3/10 text-stage-s3 hover:bg-stage-s3/20"
            @click="askTheTutor(m)"
          >
            Ask the Tutor instead →
          </button>
        </div>
      </div>
    </div>

    <!-- Footer — escalation-budget indicator (v0.3 task 9). -->
    <div
      class="px-3 py-1 border-t border-ink-100 text-[0.7rem] text-ink-500 mono flex items-center gap-2"
      :title="'Two consecutive business errors trigger a forced escalation to the Claude Code docs.'"
    >
      <span>escalation budget:</span>
      <span
        class="px-1.5 py-0.5 rounded border"
        :class="budgetUsed >= budgetMax
          ? 'border-stage-s5 bg-stage-s5/10 text-stage-s5'
          : budgetUsed > 0
            ? 'border-amber-500 bg-amber-500/10 text-amber-700'
            : 'border-ink-200 bg-ink-50 text-ink-500'"
      >
        {{ budgetUsed }}/{{ budgetMax }}
      </span>
    </div>

    <form class="border-t border-ink-100 p-2 flex gap-1" @submit.prevent="submit">
      <input
        v-model="input"
        type="text"
        placeholder="Ask the help bot…"
        class="flex-1 px-2 py-1 border border-ink-200 rounded text-sm"
        :disabled="helpBot.pending"
      />
      <button
        type="submit"
        class="px-2 py-1 bg-ink-900 text-white text-sm rounded disabled:opacity-50"
        :disabled="helpBot.pending"
      >
        Ask
      </button>
    </form>
  </aside>
</template>
