<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useTutorStore } from '@/stores/tutor';
import { getAdapter } from '@/sdk';
import { ALLOWED_TOOLS } from '@/agents/coordinator';
import PageHeader from '@/components/PageHeader.vue';

const store = useTutorStore();
const input = ref('');
const threadEl = ref<HTMLElement | null>(null);

const adapterKind = computed(() => getAdapter().kind);

async function scrollToBottom() {
  await nextTick();
  if (threadEl.value) threadEl.value.scrollTop = threadEl.value.scrollHeight;
}

onMounted(scrollToBottom);
watch(() => store.thread.length, scrollToBottom);

async function submit() {
  const value = input.value.trim();
  if (!value) return;
  input.value = '';
  await store.send(value);
}

function suggest(prompt: string) {
  input.value = prompt;
}

const suggestions = [
  'Explain hub-and-spoke',
  'Explain few-shot prompting and quiz me on it',
  'What is the scratchpad pattern?',
  'Quiz me on Domain 2',
  'answer s1 q4: B',
];
</script>

<template>
  <PageHeader
    eyebrow="Claude Tutor"
    title="Hub-and-spoke chat"
    subtitle="The coordinator routes your prompt to specialized subagents (explainer · quizmaster · code-reviewer) and runs independent ones in parallel. Look at the per-message metadata — you can see which subagents fired, in how many ms, and what tool calls they used."
  />

  <div class="flex flex-wrap items-center gap-2 mb-4">
    <span class="badge">SDK: {{ adapterKind }}</span>
    <span class="badge">allowedTools: {{ ALLOWED_TOOLS.join(', ') }}</span>
    <button class="btn btn--ghost btn--sm ml-auto" @click="store.clear()">Clear thread</button>
  </div>

  <div class="chat">
    <div ref="threadEl" class="chat__thread">
      <div v-if="store.thread.length === 0" class="chat__msg chat__msg--system">
        Try one of the suggestions below, or ask any architect-exam question.
      </div>

      <template v-for="m in store.thread" :key="m.id">
        <div class="chat__msg" :class="`chat__msg--${m.role}`">
          <div style="white-space: pre-wrap">{{ m.content }}</div>
          <div v-if="m.role === 'assistant' && m.turn" class="chat__meta">
            <span class="chat__subagent-pill">
              {{ m.turn.parallel ? 'parallel' : 'single' }} ·
              {{ m.turn.subagents.map((s) => s.name).join(' + ') }}
            </span>
            <span>{{ m.turn.totalMs }}ms</span>
            <span v-if="m.turn.escalated" class="text-rose-400">
              escalated ({{ m.turn.escalated.reason }})
            </span>
          </div>

          <details v-if="m.role === 'assistant' && m.turn" class="mt-2 text-xs text-ink-400">
            <summary class="cursor-pointer">subagent breakdown · rationale: {{ m.turn.rationale }}</summary>
            <ul class="mt-2 space-y-1">
              <li v-for="inv in m.turn.subagents" :key="inv.name">
                <span class="font-mono">{{ inv.name }}</span>
                — {{ inv.durationMs }}ms
                <span v-if="inv.toolCalls.length" class="text-ink-300">
                  · tools: {{ inv.toolCalls.map((tc) => tc.name).join(', ') }}
                </span>
              </li>
            </ul>
          </details>
        </div>
      </template>

      <div v-if="store.pending" class="chat__msg chat__msg--system">
        Coordinator dispatching subagents…
      </div>
      <div v-if="store.lastError" class="chat__msg chat__msg--system text-rose-400">
        Error: {{ store.lastError }}
      </div>
    </div>

    <form class="chat__composer" @submit.prevent="submit">
      <textarea
        v-model="input"
        class="chat__input"
        rows="2"
        placeholder='Ask the tutor — e.g. "Explain hub-and-spoke and quiz me on it"'
        @keydown.enter.exact.prevent="submit"
      />
      <button type="submit" class="btn btn--primary" :disabled="store.pending || !input.trim()">
        Send
      </button>
    </form>
  </div>

  <section class="mt-6">
    <div class="text-xs uppercase tracking-widest text-ink-400 mb-2">Try one</div>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="s in suggestions"
        :key="s"
        class="btn btn--ghost btn--sm"
        @click="suggest(s)"
      >
        {{ s }}
      </button>
    </div>
  </section>

  <section v-if="store.scratchpad.length" class="mt-8">
    <h2 class="text-lg font-semibold mb-3">Scratchpad <span class="text-ink-400 text-sm">(Domain 5 pattern)</span></h2>
    <div class="card !p-4 text-sm">
      <ul class="space-y-2">
        <li v-for="(line, i) in store.scratchpad.slice(-10)" :key="i" class="font-mono text-xs text-ink-300">
          • {{ line.text }}
        </li>
      </ul>
    </div>
  </section>
</template>
