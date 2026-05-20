<script setup lang="ts">
// Tool-call chip for the Help Bot sidebar timeline (Architect Scenario 1 v0.2).
// Colour code:
//   ok           → green
//   validation   → amber  (caller can re-ask with a clarification)
//   business     → red    (semantic miss — counts against escalation budget)
//   permission   → grey   (denied)
//   transient    → grey   (retryable; same colour as permission to keep the
//                          palette small — the errorCategory tag disambiguates)
//
// Renders the tool name in mono and, when an error is present, the
// errorCategory tag for triage at a glance (v0.2 task 6).

import { computed } from 'vue';
import type { ErrorCategory } from '@/agents/tools/types';

interface Props {
  name: string;
  ok: boolean;
  errorCategory?: ErrorCategory;
  isRetryable?: boolean;
}

const props = defineProps<Props>();

const palette = computed(() => {
  if (props.ok) {
    return 'border-stage-s4 bg-stage-s4/10 text-stage-s4';
  }
  switch (props.errorCategory) {
    case 'validation':
      return 'border-amber-500 bg-amber-500/10 text-amber-700';
    case 'business':
      return 'border-stage-s5 bg-stage-s5/10 text-stage-s5';
    case 'permission':
    case 'transient':
    default:
      return 'border-ink-300 bg-ink-100 text-ink-600';
  }
});

const tagLabel = computed(() => {
  if (props.ok) return 'ok';
  return props.errorCategory ?? 'err';
});

const title = computed(() => {
  if (props.ok) return `${props.name} — ok`;
  const retry = props.isRetryable ? ' (retryable)' : '';
  return `${props.name} — ${props.errorCategory ?? 'error'}${retry}`;
});
</script>

<template>
  <span
    class="inline-flex items-center gap-1 px-1.5 py-0.5 mono text-[0.7rem] border rounded"
    :class="palette"
    :title="title"
  >
    <code>{{ name }}</code>
    <span class="opacity-70">·</span>
    <span class="uppercase tracking-wide">{{ tagLabel }}</span>
  </span>
</template>
