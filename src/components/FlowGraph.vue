<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { domains } from '@/data/domains';
import type { Domain } from '@/data/domain-content/types';
import { getFlow } from '@/data/flows';

const props = defineProps<{
  /** Highlight the steps of this flow id. When null, no highlight. */
  highlightFlow: string | null;
}>();

const router = useRouter();

// Layout constants.
const COL_W = 220;
const COL_PAD_X = 12;
const NODE_H = 44;
const NODE_GAP = 14;
const HEADER_H = 36;
const TOP_PAD = 56;
const NODE_W = COL_W - COL_PAD_X * 2;

interface PatternNode {
  patternId: string;
  title: string;
  taskRef: string;
  x: number;     // top-left
  y: number;
  cx: number;    // center
  cy: number;
  color: string; // hex
  domain: Domain;
}

const domainColor: Record<string, string> = {
  d1: '#e88c30',
  d2: '#1E728C',
  d3: '#7a3eae',
  d4: '#4d6ce5',
  d5: '#2f9d6a',
};

const nodes = computed<PatternNode[]>(() => {
  const out: PatternNode[] = [];
  domains.forEach((d, colIdx) => {
    d.patterns.forEach((p, rowIdx) => {
      const x = colIdx * COL_W + COL_PAD_X;
      const y = TOP_PAD + rowIdx * (NODE_H + NODE_GAP);
      out.push({
        patternId: p.id,
        title: p.title,
        taskRef: p.taskRef,
        x,
        y,
        cx: x + NODE_W / 2,
        cy: y + NODE_H / 2,
        color: domainColor[d.id] ?? '#888',
        domain: d,
      });
    });
  });
  return out;
});

const nodesById = computed(() => {
  const m = new Map<string, PatternNode>();
  for (const n of nodes.value) m.set(n.patternId, n);
  return m;
});

const totalRows = computed(() =>
  Math.max(...domains.map((d) => d.patterns.length)),
);

const svgHeight = computed(
  () => TOP_PAD + totalRows.value * (NODE_H + NODE_GAP) + 24,
);
const svgWidth = computed(() => domains.length * COL_W);

// Highlight set: which pattern ids are in the highlighted flow.
const highlightedSet = computed<Set<string>>(() => {
  const set = new Set<string>();
  if (!props.highlightFlow) return set;
  const flow = getFlow(props.highlightFlow);
  if (!flow) return set;
  for (const step of flow.steps) set.add(step.patternId);
  return set;
});

// Step-index lookup for nodes in the highlighted flow.
const highlightStepIndex = computed<Map<string, number>>(() => {
  const m = new Map<string, number>();
  if (!props.highlightFlow) return m;
  const flow = getFlow(props.highlightFlow);
  if (!flow) return m;
  flow.steps.forEach((s, i) => m.set(s.patternId, i + 1));
  return m;
});

interface Edge {
  d: string;        // SVG path
  fromId: string;
  toId: string;
}

const edges = computed<Edge[]>(() => {
  if (!props.highlightFlow) return [];
  const flow = getFlow(props.highlightFlow);
  if (!flow) return [];

  const out: Edge[] = [];
  for (let i = 0; i < flow.steps.length - 1; i++) {
    const from = nodesById.value.get(flow.steps[i].patternId);
    const to = nodesById.value.get(flow.steps[i + 1].patternId);
    if (!from || !to) continue;

    // Compute path: exit from right or left of `from` depending on column direction.
    const goingRight = to.cx >= from.cx;
    const startX = goingRight ? from.x + NODE_W : from.x;
    const endX = goingRight ? to.x - 8 : to.x + NODE_W + 8;
    const startY = from.cy;
    const endY = to.cy;

    // Bezier with horizontal handles for smooth flow between columns.
    const dx = Math.max(40, Math.abs(endX - startX) * 0.45);
    const c1x = startX + (goingRight ? dx : -dx);
    const c2x = endX + (goingRight ? -dx : dx);

    out.push({
      d: `M ${startX},${startY} C ${c1x},${startY} ${c2x},${endY} ${endX},${endY}`,
      fromId: from.patternId,
      toId: to.patternId,
    });
  }
  return out;
});

function isDimmed(patternId: string): boolean {
  if (!props.highlightFlow) return false;
  return !highlightedSet.value.has(patternId);
}

function openPattern(patternId: string) {
  router.push({ name: 'pattern', params: { id: patternId } });
}

function colorWithAlpha(hex: string, alpha: number): string {
  // assume #rrggbb
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
</script>

<template>
  <svg
    :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
    :width="svgWidth"
    :height="svgHeight"
    class="flow-graph"
    role="img"
    aria-label="Concept atlas — patterns by domain with flow connections"
  >
    <defs>
      <marker
        id="flow-graph-arrow"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#2f9d6a" />
      </marker>
    </defs>

    <!-- Column headers + dividers -->
    <g v-for="(d, i) in domains" :key="d.id">
      <text
        :x="i * COL_W + COL_W / 2"
        :y="20"
        text-anchor="middle"
        class="flow-graph__column-header"
      >
        Domain {{ d.number }}
      </text>
      <text
        :x="i * COL_W + COL_W / 2"
        :y="36"
        text-anchor="middle"
        :style="{ fill: domainColor[d.id], fontWeight: 700, fontSize: '12px' }"
      >
        {{ d.title.split(' & ')[0].split(' — ')[0] }}
      </text>
      <line
        v-if="i > 0"
        :x1="i * COL_W"
        :y1="44"
        :x2="i * COL_W"
        :y2="svgHeight - 12"
        class="flow-graph__column-divider"
      />
    </g>

    <!-- Edges (only when a flow is selected) -->
    <g>
      <path
        v-for="(e, i) in edges"
        :key="`e-${i}`"
        :d="e.d"
        class="flow-graph__edge flow-graph__edge--active"
      />
    </g>

    <!-- Nodes -->
    <g v-for="n in nodes" :key="n.patternId">
      <g class="flow-graph__node-link" @click="openPattern(n.patternId)">
        <title>{{ n.title }} (Task {{ n.taskRef }})</title>
        <rect
          :x="n.x"
          :y="n.y"
          :width="NODE_W"
          :height="NODE_H"
          rx="8"
          ry="8"
          class="flow-graph__node-rect"
          :class="{ 'flow-graph__node-rect--dimmed': isDimmed(n.patternId) }"
          :fill="colorWithAlpha(n.color, isDimmed(n.patternId) ? 0.04 : 0.12)"
          :stroke="n.color"
        />
        <text
          :x="n.x + 12"
          :y="n.y + 18"
          class="flow-graph__node-task"
          :class="{ 'flow-graph__node-task--dimmed': isDimmed(n.patternId) }"
        >
          Task {{ n.taskRef }}
        </text>
        <text
          :x="n.x + 12"
          :y="n.y + 34"
          class="flow-graph__node-label"
          :class="{ 'flow-graph__node-label--dimmed': isDimmed(n.patternId) }"
        >
          {{ n.title.length > 28 ? n.title.slice(0, 27) + '…' : n.title }}
        </text>

        <!-- Step number bubble when in the highlighted flow -->
        <g v-if="highlightStepIndex.get(n.patternId)">
          <circle
            :cx="n.x + NODE_W - 14"
            :cy="n.y + 14"
            r="11"
            :fill="n.color"
            stroke="#0e121b"
            stroke-width="2"
          />
          <text
            :x="n.x + NODE_W - 14"
            :y="n.y + 14"
            class="flow-graph__node-step"
          >
            {{ highlightStepIndex.get(n.patternId) }}
          </text>
        </g>
      </g>
    </g>
  </svg>
</template>
