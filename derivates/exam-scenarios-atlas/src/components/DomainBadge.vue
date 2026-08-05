<script setup lang="ts">
import { computed } from 'vue'
import { domainById } from '../data/domains'

const props = defineProps<{ id: number; compact?: boolean }>()
const d = computed(() => domainById(props.id))

const ringColour: Record<number, string> = {
  1: 'border-domain-1 text-domain-1',
  2: 'border-domain-2 text-domain-2',
  3: 'border-domain-3 text-domain-3',
  4: 'border-domain-4 text-domain-4',
  5: 'border-domain-5 text-domain-5',
}
</script>

<template>
  <span
    v-if="d"
    class="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium bg-white"
    :class="ringColour[d.id]"
    :title="d.oneLiner"
  >
    <span class="font-mono">D{{ d.id }}</span>
    <span v-if="!compact" class="text-ink-700">{{ d.title }}</span>
    <span class="text-ink-400">· {{ d.weight }}%</span>
  </span>
</template>
