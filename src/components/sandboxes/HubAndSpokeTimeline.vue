<script setup lang="ts">
import { computed, ref } from 'vue';
import { coordinator, type CoordinatorTurn } from '@/agents/coordinator';

const prompt = ref('Explain hub-and-spoke and quiz me on it');
const pending = ref(false);
const turn = ref<CoordinatorTurn | null>(null);

const presets = [
  'Explain hub-and-spoke and quiz me on it',
  'Explain few-shot prompting',
  'Quiz me on Domain 2',
  'answer s1 q4: B',
];

async function run() {
  if (pending.value || !prompt.value.trim()) return;
  pending.value = true;
  try {
    turn.value = await coordinator.handle(prompt.value);
  } finally {
    pending.value = false;
  }
}

const maxMs = computed(() => {
  if (!turn.value) return 0;
  return Math.max(turn.value.totalMs, ...turn.value.subagents.map((s) => s.durationMs));
});

function widthPct(ms: number): string {
  if (maxMs.value === 0) return '0%';
  return `${Math.max(2, Math.round((ms / maxMs.value) * 100))}%`;
}
</script>

<template>
  <div class="sandbox">
    <div class="sandbox__header">
      <div>
        <div class="sandbox__eyebrow">Live · hub-and-spoke timeline</div>
        <h3 class="sandbox__title">Run the coordinator — see parallel vs sequential timing</h3>
      </div>
    </div>

    <p class="sandbox__hint">
      Runs the real coordinator on the prompt below. Independent subagents are dispatched
      with <code>Promise.all</code> — the timeline visualizes their actual durations.
      "Explain X and quiz me on it" fires two subagents in parallel; "Explain X" fires one.
    </p>

    <div class="sandbox__composer">
      <textarea
        v-model="prompt"
        class="sandbox__textarea"
        rows="2"
        spellcheck="false"
      />
      <button class="btn btn--primary" :disabled="pending || !prompt.trim()" @click="run">
        {{ pending ? 'Running…' : 'Run coordinator' }}
      </button>
    </div>

    <div class="sandbox__presets">
      <span class="text-xs text-ink-400 mr-1">try:</span>
      <button
        v-for="p in presets"
        :key="p"
        class="btn btn--ghost btn--sm"
        @click="prompt = p"
      >{{ p }}</button>
    </div>

    <div v-if="turn" class="sandbox__result">
      <div class="sandbox__pane-label">
        Coordinator total: {{ turn.totalMs }}ms ·
        {{ turn.parallel ? 'parallel dispatch' : 'single subagent' }} ·
        rationale: <em>{{ turn.rationale }}</em>
      </div>

      <div class="timeline">
        <div class="timeline__row timeline__row--coordinator">
          <div class="timeline__name">coordinator</div>
          <div class="timeline__bar-track">
            <div class="timeline__bar timeline__bar--coordinator" :style="{ width: widthPct(turn.totalMs) }">
              {{ turn.totalMs }}ms
            </div>
          </div>
        </div>

        <div
          v-for="inv in turn.subagents"
          :key="inv.name"
          class="timeline__row"
        >
          <div class="timeline__name">↳ {{ inv.name }}</div>
          <div class="timeline__bar-track">
            <div class="timeline__bar timeline__bar--spoke" :style="{ width: widthPct(inv.durationMs) }">
              {{ inv.durationMs }}ms
              <span v-if="inv.toolCalls.length" class="timeline__tools">
                · tools: {{ inv.toolCalls.map((tc) => tc.name).join(', ') }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="turn.parallel" class="sandbox__verdict">
        <span class="badge badge--domain-ops">parallel speedup</span>
        <span class="sandbox__verdict-text">
          Coordinator total ≈ slowest spoke ({{ Math.max(...turn.subagents.map((s) => s.durationMs)) }}ms), not the sum
          ({{ turn.subagents.reduce((a, s) => a + s.durationMs, 0) }}ms). That is the parallel-subagents pattern paying off.
        </span>
      </div>

      <details class="sandbox__details">
        <summary>Show coordinator reply</summary>
        <pre class="sandbox__reply">{{ turn.reply }}</pre>
      </details>
    </div>
  </div>
</template>
