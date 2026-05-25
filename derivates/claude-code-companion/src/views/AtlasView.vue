<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { RouterLink } from 'vue-router';
import { stages } from '@/data/stages';
import { atlasEdges, atlasNodes, getNodesForStage } from '@/data/atlasNodes';
import type { AtlasNode } from '@/data/types';

const gridRef = useTemplateRef<HTMLElement>('grid');
const nodeEls = new Map<string, HTMLElement>();

type EdgeCoord = { id: string; x1: number; y1: number; x2: number; y2: number };
const edgeCoords = ref<EdgeCoord[]>([]);

function setNodeEl(id: string, el: Element | null) {
  if (el instanceof HTMLElement) nodeEls.set(id, el);
  else nodeEls.delete(id);
}

function nodeRoute(n: AtlasNode): string {
  const l = n.primaryLink;
  if (l.kind === 'stage') return `/learn/${l.stageId}`;
  if (l.kind === 'lesson') return `/lessons/${l.lessonId}`;
  return l.questionId != null
    ? `/quiz/${l.sectionId}/${l.questionId}`
    : `/quiz/${l.sectionId}`;
}

function recomputeEdges() {
  const grid = gridRef.value;
  if (!grid) return;
  const gridRect = grid.getBoundingClientRect();
  const next: EdgeCoord[] = [];
  for (const e of atlasEdges) {
    const from = nodeEls.get(e.from);
    const to = nodeEls.get(e.to);
    if (!from || !to) continue;
    const fr = from.getBoundingClientRect();
    const tr = to.getBoundingClientRect();
    next.push({
      id: `${e.from}->${e.to}`,
      x1: fr.right - gridRect.left,
      y1: fr.top + fr.height / 2 - gridRect.top,
      x2: tr.left - gridRect.left,
      y2: tr.top + tr.height / 2 - gridRect.top,
    });
  }
  edgeCoords.value = next;
}

let observer: ResizeObserver | null = null;

onMounted(() => {
  // Wait one frame so refs resolve and the grid has its final layout.
  requestAnimationFrame(recomputeEdges);
  if (gridRef.value && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => recomputeEdges());
    observer.observe(gridRef.value);
  }
  window.addEventListener('resize', recomputeEdges);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  window.removeEventListener('resize', recomputeEdges);
});

const totalNodes = atlasNodes.length;
</script>

<template>
  <section class="space-y-6">
    <header>
      <h1 class="text-3xl font-semibold tracking-tight">Concept atlas</h1>
      <p class="text-ink-600 mt-2 max-w-3xl">
        The eight stages laid out side by side. Each card is a concept you can
        click into — opens the stage, lesson, or quiz that introduces it.
        Dashed lines show where a concept resurfaces in a later stage.
      </p>
      <p class="text-xs text-ink-500 mt-2">
        Showing {{ totalNodes }} concept nodes across {{ stages.length }} stages.
        Stages with a dashed border are stubs — they will fill in as their
        curriculum lands.
      </p>
    </header>

    <div ref="grid" class="relative grid grid-cols-8 gap-2">
      <section
        v-for="stage in stages"
        :key="stage.id"
        :class="[
          'rounded-lg border bg-white p-3 min-h-[320px]',
          stage.lessonIds.length === 0
            ? 'border-dashed border-ink-200 opacity-60'
            : 'border-ink-200',
        ]"
      >
        <header class="mb-3">
          <div class="text-[10px] uppercase tracking-wide text-ink-500">
            Stage {{ stage.number }}
          </div>
          <RouterLink
            :to="`/learn/${stage.id}`"
            class="font-semibold text-sm leading-tight hover:underline"
          >
            {{ stage.title }}
          </RouterLink>
        </header>

        <div
          v-if="stage.lessonIds.length === 0"
          class="text-xs italic text-ink-400"
        >
          Coming soon
        </div>

        <ul v-else class="space-y-1.5">
          <li
            v-for="node in getNodesForStage(stage.id)"
            :key="node.id"
            :ref="(el) => setNodeEl(node.id, el as Element | null)"
          >
            <RouterLink
              :to="nodeRoute(node)"
              class="block rounded-md border border-ink-200 bg-canvas px-2 py-1.5 text-xs hover:border-accent-500 hover:bg-accent-50"
            >
              {{ node.label }}
            </RouterLink>
          </li>
        </ul>
      </section>

      <svg
        class="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <line
          v-for="e in edgeCoords"
          :key="e.id"
          :x1="e.x1"
          :y1="e.y1"
          :x2="e.x2"
          :y2="e.y2"
          stroke="rgb(99 102 241 / 0.55)"
          stroke-width="1.5"
          stroke-dasharray="4 4"
        />
      </svg>
    </div>
  </section>
</template>
