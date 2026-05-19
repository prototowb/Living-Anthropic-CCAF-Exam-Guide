<script setup lang="ts">
import { computed, ref } from 'vue';
import { prune } from '@/agents/contextPruner';
import CodeBlock from '@/components/CodeBlock.vue';

const DEFAULT_PAYLOAD = `{
  "customerId": "cus_8412",
  "orderId": "ord_99231",
  "summary": "Customer reports a damaged item; replacement requested.",
  "verboseLog": "${'x'.repeat(800)}",
  "auditTrail!": "${'y'.repeat(800)}",
  "address": { "street": "1 Market St", "city": "SF" }
}`;

const payload = ref(DEFAULT_PAYLOAD);
const budget = ref(400);
const error = ref<string | null>(null);

const parsed = computed<Record<string, unknown> | null>(() => {
  try {
    error.value = null;
    return JSON.parse(payload.value);
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
    return null;
  }
});

const pruned = computed(() => {
  if (!parsed.value) return null;
  return prune(parsed.value, { budget: budget.value });
});

const inputSize = computed(() => payload.value.length);
const outputSize = computed(() => (pruned.value ? JSON.stringify(pruned.value, null, 2).length : 0));

const droppedFields = computed(() => {
  if (!parsed.value || !pruned.value) return [];
  const out: { field: string; before: number; after: number; kept: boolean }[] = [];
  for (const [k, v] of Object.entries(parsed.value)) {
    const after = (pruned.value as Record<string, unknown>)[k];
    const beforeLen = typeof v === 'string' ? v.length : JSON.stringify(v).length;
    const afterLen = typeof after === 'string' ? after.length : JSON.stringify(after).length;
    if (beforeLen !== afterLen) {
      out.push({ field: k, before: beforeLen, after: afterLen, kept: k.endsWith('!') });
    }
  }
  return out;
});

function reset() {
  payload.value = DEFAULT_PAYLOAD;
  budget.value = 400;
}
</script>

<template>
  <div class="sandbox">
    <div class="sandbox__header">
      <div>
        <div class="sandbox__eyebrow">Live · context-pruner</div>
        <h3 class="sandbox__title">Try it — paste a payload, watch fields get trimmed</h3>
      </div>
      <button class="btn btn--ghost btn--sm" @click="reset">Reset</button>
    </div>

    <p class="sandbox__hint">
      Paste any JSON. Fields with values longer than the budget get truncated.
      Keys ending in <code>!</code> are tagged "keep" and bypass pruning entirely.
    </p>

    <div class="sandbox__controls">
      <label class="sandbox__control">
        <span>Budget: <strong>{{ budget }}</strong> chars</span>
        <input
          v-model.number="budget"
          type="range"
          min="50"
          max="1200"
          step="50"
        />
      </label>
    </div>

    <div class="sandbox__panes">
      <div class="sandbox__pane">
        <div class="sandbox__pane-label">Input ({{ inputSize }} chars)</div>
        <textarea
          v-model="payload"
          class="sandbox__textarea"
          rows="14"
          spellcheck="false"
        />
        <div v-if="error" class="sandbox__error">JSON parse error: {{ error }}</div>
      </div>

      <div class="sandbox__pane">
        <div class="sandbox__pane-label">
          Pruned output ({{ outputSize }} chars · {{ Math.max(0, inputSize - outputSize) }} removed)
        </div>
        <CodeBlock
          v-if="pruned"
          :code="JSON.stringify(pruned, null, 2)"
          language="json"
        />
        <div v-else class="sandbox__error">— (no valid input)</div>
      </div>
    </div>

    <div v-if="droppedFields.length" class="sandbox__diff">
      <div class="sandbox__pane-label">Field-by-field diff</div>
      <table class="sandbox__diff-table">
        <thead>
          <tr><th>Field</th><th>Before</th><th>After</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr v-for="f in droppedFields" :key="f.field">
            <td><code>{{ f.field }}</code></td>
            <td>{{ f.before }}</td>
            <td>{{ f.after }}</td>
            <td>
              <span v-if="f.kept" class="badge badge--domain-ops">kept (keep-tag)</span>
              <span v-else class="badge badge--domain-ci">pruned</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
