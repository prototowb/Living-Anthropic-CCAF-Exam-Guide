<script setup lang="ts">
// "Limited mode" affordance — shared between the Tutor, Help Bot, and any
// future adapter-aware view. SYNTHESIS.md S-7.
//
// Renders nothing when all capabilities are present (default mock + real
// Claude). When ANY of {nativeToolUse, parallelSubagents, schemaMode} is
// false, shows a chip with hover-tooltip listing what's degraded.
//
// Per views CLAUDE.md rule 2 (no agent imports), this component takes the
// capability flags as props rather than reading the adapter directly. The
// caller decides how to source them.

import { computed } from 'vue';

interface Props {
  nativeToolUse: boolean;
  parallelSubagents: boolean;
  schemaMode: boolean;
  /** Optional human label for the adapter — appears in the tooltip. */
  adapterLabel?: string;
  /** Optional size — `xs` for inline meta, `sm` for header chip. */
  size?: 'xs' | 'sm';
}

const props = withDefaults(defineProps<Props>(), { size: 'xs' });

const degradations = computed(() => {
  const out: { key: string; explanation: string }[] = [];
  if (!props.nativeToolUse)
    out.push({
      key: 'tool calling',
      explanation:
        'Tool calls fall back to JSON-in-prose with a parser + one retry. Help-bot tool dispatch is slower and lossier than Claude native tool_use.',
    });
  if (!props.parallelSubagents)
    out.push({
      key: 'parallel subagents',
      explanation:
        "The Tutor's spokes run serially. Multi-step research turns take longer but produce the same final answer.",
    });
  if (!props.schemaMode)
    out.push({
      key: 'schema mode',
      explanation:
        'Structured-output requests use JSON-in-prose with validator retry instead of constrained generation. Lower reliability on small local models.',
    });
  return out;
});

const tooltip = computed(() => {
  const lines = [
    `Adapter: ${props.adapterLabel ?? 'limited'}`,
    '',
    'Degraded capabilities:',
    ...degradations.value.map((d) => `• ${d.key} — ${d.explanation}`),
  ];
  return lines.join('\n');
});

const visible = computed(() => degradations.value.length > 0);
</script>

<template>
  <span
    v-if="visible"
    class="inline-flex items-center gap-1 mono border rounded transition cursor-help"
    :class="size === 'sm' ? 'text-xs px-2 py-1 border-stage-s2 bg-stage-s2/10 text-stage-s2' : 'text-[0.7rem] px-1.5 py-0.5 border-stage-s2/60 bg-stage-s2/5 text-stage-s2'"
    :title="tooltip"
  >
    <span aria-hidden="true">⚠</span>
    <span>limited</span>
    <span class="opacity-60">×{{ degradations.length }}</span>
  </span>
</template>
