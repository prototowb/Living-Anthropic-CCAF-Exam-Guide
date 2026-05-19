<script setup lang="ts">
import { ref, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { flows } from '@/data/flows';
import { domains } from '@/data/domains';
import PageHeader from '@/components/PageHeader.vue';
import FlowGraph from '@/components/FlowGraph.vue';

const selectedFlowId = ref<string | null>(null);

const selectedFlow = computed(() =>
  selectedFlowId.value ? flows.find((f) => f.id === selectedFlowId.value) ?? null : null,
);

const totalPatterns = computed(() => domains.reduce((a, d) => a + d.patterns.length, 0));
</script>

<template>
  <PageHeader
    eyebrow="Concept Atlas"
    title="The whole architecture, on one page"
    :subtitle="`All ${totalPatterns} patterns across the 5 exam domains. Pick a flow below to see how patterns chain together to build something real. Click any node to open the pattern.`"
  />

  <div class="atlas">
    <div class="atlas__controls">
      <div class="atlas__legend-label">Highlight a flow</div>
      <div class="atlas__flow-chips">
        <button
          class="atlas__flow-chip"
          :class="{ 'atlas__flow-chip--active': selectedFlowId === null }"
          @click="selectedFlowId = null"
        >No flow (all patterns)</button>
        <button
          v-for="f in flows"
          :key="f.id"
          class="atlas__flow-chip"
          :class="{ 'atlas__flow-chip--active': selectedFlowId === f.id }"
          @click="selectedFlowId = selectedFlowId === f.id ? null : f.id"
        >{{ f.title }}</button>
      </div>
    </div>

    <div v-if="selectedFlow" class="atlas__step-pane">
      <div class="atlas__step-counter">
        Flow · {{ selectedFlow.steps.length }} steps · domains
        {{ selectedFlow.domainsCovered.map((d) => d.toUpperCase()).join(' · ') }}
      </div>
      <h2 class="text-xl font-semibold mt-1">{{ selectedFlow.title }}</h2>
      <p class="text-ink-300 mt-2 text-sm">{{ selectedFlow.summary }}</p>
      <div class="mt-3 flex gap-2">
        <RouterLink
          :to="{ name: 'flow', params: { flowId: selectedFlow.id } }"
          class="btn btn--primary btn--sm"
        >Walk through this flow →</RouterLink>
      </div>
    </div>

    <div class="atlas__graph">
      <FlowGraph :highlight-flow="selectedFlowId" />
    </div>
  </div>
</template>
