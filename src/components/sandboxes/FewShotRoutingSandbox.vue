<script setup lang="ts">
import { ref } from 'vue';
import { getAdapter } from '@/sdk';
import { intentSchema } from '@/agents/schemas/intentClassification';
import { ROUTE_INTENT_FEWSHOT, SYSTEM_PROMPT, type SubagentName } from '@/agents/prompts/fewShot';
import CodeBlock from '@/components/CodeBlock.vue';

interface RoutingResult {
  subagents: SubagentName[];
  rationale: string;
  durationMs: number;
}

const prompt = ref('Explain context pruning and quiz me on it');
const pending = ref(false);
const result = ref<RoutingResult | null>(null);

const presets = [
  'Explain hub-and-spoke',
  'Quiz me on tools',
  'Explain few-shot prompting and quiz me on it',
  'answer s1 q4: B',
];

async function classify() {
  if (pending.value) return;
  pending.value = true;
  const t0 = performance.now();
  try {
    const adapter = getAdapter();
    const res = await adapter.createMessage<{ subagents: SubagentName[]; rationale: string }>({
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt.value }],
      jsonSchema: intentSchema as unknown as Record<string, unknown>,
      fewShot: ROUTE_INTENT_FEWSHOT.map((ex) => ({
        user: ex.user,
        assistant: JSON.stringify({ subagents: ex.subagents, rationale: ex.rationale }),
      })),
    });
    if (res.data) {
      result.value = {
        subagents: res.data.subagents,
        rationale: res.data.rationale,
        durationMs: Math.round(performance.now() - t0),
      };
    } else {
      result.value = {
        subagents: ['explainer'],
        rationale: 'No structured response — defaulting to explainer.',
        durationMs: Math.round(performance.now() - t0),
      };
    }
  } finally {
    pending.value = false;
  }
}
</script>

<template>
  <div class="sandbox">
    <div class="sandbox__header">
      <div>
        <div class="sandbox__eyebrow">Live · few-shot routing</div>
        <h3 class="sandbox__title">Type a prompt — see which subagents the classifier picks</h3>
      </div>
    </div>

    <p class="sandbox__hint">
      This calls the real coordinator's classifier with the 4 worked few-shot examples
      and the <code>intentSchema</code> JSON schema. The same code path the tutor uses.
    </p>

    <div class="sandbox__composer">
      <textarea
        v-model="prompt"
        class="sandbox__textarea"
        rows="2"
        spellcheck="false"
      />
      <button class="btn btn--primary" :disabled="pending || !prompt.trim()" @click="classify">
        {{ pending ? 'Routing…' : 'Classify' }}
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

    <div v-if="result" class="sandbox__result">
      <div class="sandbox__pane-label">Classifier output · {{ result.durationMs }}ms</div>

      <div class="sandbox__pills">
        <span class="badge" :class="result.subagents.length > 1 ? 'badge--domain-ops' : 'badge--domain-support'">
          {{ result.subagents.length > 1 ? 'parallel dispatch' : 'single subagent' }}
        </span>
        <span v-for="s in result.subagents" :key="s" class="badge badge--domain-codegen">{{ s }}</span>
      </div>

      <p class="sandbox__rationale">
        <strong>Rationale:</strong> {{ result.rationale }}
      </p>

      <CodeBlock :code="JSON.stringify({ subagents: result.subagents, rationale: result.rationale }, null, 2)" language="json" />
    </div>

    <details class="sandbox__details">
      <summary>Show the few-shot examples used</summary>
      <ol class="sandbox__fewshot-list">
        <li v-for="ex in ROUTE_INTENT_FEWSHOT" :key="ex.user">
          <div><strong>user:</strong> {{ ex.user }}</div>
          <div><strong>routes to:</strong> [{{ ex.subagents.join(', ') }}]</div>
          <div class="sandbox__fewshot-rationale">— {{ ex.rationale }}</div>
        </li>
      </ol>
    </details>
  </div>
</template>
