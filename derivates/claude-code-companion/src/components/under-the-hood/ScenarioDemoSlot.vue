<script setup lang="ts">
// Lazy-loader dispatch for per-scenario live demos on /under-the-hood (v0.4).
//
// Each scenario contributes a `Scenario<N>LiveDemo.vue` under this directory.
// We `defineAsyncComponent` so the demo code only loads when the learner
// expands a card — `/under-the-hood` itself stays cheap on first paint, and
// the heavier scenarios (3, 4, 6 which touch the source-index chunk) are
// gated behind user intent.
//
// A scenario without a demo file shows a graceful "coming soon" stub.

import { computed, defineAsyncComponent, type Component } from 'vue';

const props = defineProps<{ scenarioNum: number }>();

// Eagerly bind the async resolvers (not the components themselves). Vite's
// dynamic-import gives each its own chunk, so untouched cards never load.
const COMPONENT_BY_SCENARIO: Record<number, () => Promise<{ default: Component }>> = {
  1: () => import('./Scenario1LiveDemo.vue'),
  2: () => import('./Scenario2LiveDemo.vue'),
  3: () => import('./Scenario3LiveDemo.vue'),
  4: () => import('./Scenario4LiveDemo.vue'),
  5: () => import('./Scenario5LiveDemo.vue'),
  6: () => import('./Scenario6LiveDemo.vue'),
};

const AsyncDemo = computed<Component | null>(() => {
  const resolver = COMPONENT_BY_SCENARIO[props.scenarioNum];
  if (!resolver) return null;
  return defineAsyncComponent({
    loader: resolver,
    delay: 100,
    loadingComponent: {
      template:
        '<p class="text-xs text-ink-500 italic">Loading scenario demo…</p>',
    },
    errorComponent: {
      template:
        '<p class="text-xs text-stage-s5">Demo failed to load. Open the browser console for details.</p>',
    },
    timeout: 5000,
  });
});
</script>

<template>
  <component v-if="AsyncDemo" :is="AsyncDemo" />
  <p v-else class="text-xs text-ink-500 italic">
    Live demo coming in a future release.
  </p>
</template>
