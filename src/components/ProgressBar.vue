<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  value: number;
  max: number;
  large?: boolean;
}>();

const pct = computed(() => {
  if (props.max <= 0) return 0;
  return Math.max(0, Math.min(100, (props.value / props.max) * 100));
});
</script>

<template>
  <div class="progress-bar" :class="{ 'progress-bar--lg': large }">
    <div class="progress-bar__fill" :style="{ width: pct + '%' }" />
  </div>
</template>
