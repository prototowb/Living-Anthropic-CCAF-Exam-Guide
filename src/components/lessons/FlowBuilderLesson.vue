<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import type { FlowLesson } from '@/data/lessons';
import { getFlow } from '@/data/flows';
import { domains } from '@/data/domains';
import type { DomainPattern } from '@/data/domain-content/types';

const props = defineProps<{ lesson: FlowLesson }>();
const emit = defineEmits<{
  (e: 'complete', success: boolean): void;
  (e: 'next'): void;
}>();

interface PatternCard {
  patternId: string;
  title: string;
  taskRef: string;
  isDistractor: boolean;
}

const flow = computed(() => getFlow(props.lesson.flowId));

function findPattern(id: string): DomainPattern | undefined {
  for (const d of domains) {
    const p = d.patterns.find((p) => p.id === id);
    if (p) return p;
  }
  return undefined;
}

const slotCount = computed(() => flow.value?.steps.length ?? 0);

// Pool: canonical pattern cards + distractors, shuffled.
const pool = ref<PatternCard[]>([]);
// One entry per slot — null if empty, patternId if filled.
const filled = ref<(string | null)[]>([]);
const submitted = ref(false);

function buildCard(patternId: string, isDistractor: boolean): PatternCard | null {
  const p = findPattern(patternId);
  if (!p) return null;
  return { patternId, title: p.title, taskRef: p.taskRef, isDistractor };
}

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function reset() {
  if (!flow.value) {
    pool.value = [];
    filled.value = [];
    return;
  }
  const canonical = flow.value.steps
    .map((s) => buildCard(s.patternId, false))
    .filter((c): c is PatternCard => c !== null);
  const distractors = props.lesson.distractorPatternIds
    .map((id) => buildCard(id, true))
    .filter((c): c is PatternCard => c !== null);

  pool.value = fisherYates([...canonical, ...distractors]);
  filled.value = flow.value.steps.map(() => null);
  submitted.value = false;
}

onMounted(reset);
watch(() => props.lesson.id, reset);

const usedSet = computed(() => new Set(filled.value.filter((x): x is string => !!x)));

function pickCard(card: PatternCard) {
  if (submitted.value) return;
  if (usedSet.value.has(card.patternId)) return;
  const slotIdx = filled.value.findIndex((s) => s === null);
  if (slotIdx === -1) return;
  const updated = [...filled.value];
  updated[slotIdx] = card.patternId;
  filled.value = updated;
}

function clearSlot(slotIdx: number) {
  if (submitted.value) return;
  const updated = [...filled.value];
  updated[slotIdx] = null;
  filled.value = updated;
}

function isCardUsed(card: PatternCard): boolean {
  return usedSet.value.has(card.patternId);
}

interface SlotEval {
  expected: string;
  actual: string | null;
  ok: boolean;
  why: string;
}

const evaluation = computed<SlotEval[]>(() => {
  if (!flow.value) return [];
  return flow.value.steps.map((step, i) => ({
    expected: step.patternId,
    actual: filled.value[i],
    ok: filled.value[i] === step.patternId,
    why: step.why,
  }));
});

const allFilled = computed(() => filled.value.every((x) => x !== null));

function check() {
  if (!allFilled.value) return;
  submitted.value = true;
  const allOk = evaluation.value.every((e) => e.ok);
  emit('complete', allOk);
}

function tryAgain() {
  reset();
}

const isPerfect = computed(() => submitted.value && evaluation.value.every((e) => e.ok));

function getCardTitle(patternId: string): string {
  return findPattern(patternId)?.title ?? patternId;
}
function getCardTask(patternId: string): string {
  return findPattern(patternId)?.taskRef ?? '?';
}
</script>

<template>
  <div v-if="flow" class="flow-builder">
    <p v-if="lesson.hint" class="lesson__hint">💡 {{ lesson.hint }}</p>

    <div class="flow-builder__pool">
      <div class="flow-builder__pool-label">
        Pattern pool · {{ slotCount }} of these belong in the flow,
        {{ lesson.distractorPatternIds.length }} are distractors
      </div>
      <div class="flow-builder__cards">
        <button
          v-for="card in pool"
          :key="card.patternId"
          class="flow-builder__card"
          :class="{
            'flow-builder__card--used': isCardUsed(card),
            'flow-builder__card--distractor-revealed': submitted && card.isDistractor && !isCardUsed(card),
          }"
          :disabled="isCardUsed(card) || submitted"
          @click="pickCard(card)"
        >
          <span class="flow-builder__card-task">Task {{ card.taskRef }}</span>
          <span class="flow-builder__card-title">{{ card.title }}</span>
        </button>
      </div>
    </div>

    <div class="flow-builder__slots">
      <template v-for="(slot, idx) in filled" :key="idx">
        <div
          class="flow-builder__slot"
          :class="{
            'flow-builder__slot--filled': slot !== null,
            'flow-builder__slot--correct': submitted && evaluation[idx]?.ok,
            'flow-builder__slot--wrong': submitted && !evaluation[idx]?.ok,
          }"
        >
          <span class="flow-builder__slot-num">{{ idx + 1 }}</span>
          <div class="flow-builder__slot-content">
            <template v-if="slot">
              <span class="flow-builder__card-task">Task {{ getCardTask(slot) }}</span>
              <span class="flow-builder__card-title">{{ getCardTitle(slot) }}</span>
            </template>
            <span v-else class="flow-builder__slot-empty">
              ← Click a card to place it here.
            </span>
          </div>
          <button
            v-if="slot && !submitted"
            class="flow-builder__slot-clear"
            :title="`Clear slot ${idx + 1}`"
            @click="clearSlot(idx)"
          >×</button>

          <div v-if="submitted" class="flow-builder__slot-feedback">
            <template v-if="evaluation[idx]?.ok">
              ✓ <strong>Correct.</strong> {{ evaluation[idx].why }}
            </template>
            <template v-else>
              ✗ <strong>Expected: {{ getCardTitle(evaluation[idx].expected) }}.</strong>
              {{ evaluation[idx].why }}
            </template>
          </div>
        </div>
      </template>
    </div>

    <div v-if="submitted" class="flow-builder__summary" :class="isPerfect ? 'flow-builder__summary--correct' : 'flow-builder__summary--partial'">
      <template v-if="isPerfect">
        ✅ Perfect — that's exactly the canonical flow.
        <RouterLink
          :to="{ name: 'flow', params: { flowId: lesson.flowId } }"
          class="underline ml-2"
        >Open the walkthrough →</RouterLink>
      </template>
      <template v-else>
        ✗ {{ evaluation.filter((e) => !e.ok).length }} slot(s) off.
        Reset and try again, or open the walkthrough to read the full rationale.
        <RouterLink
          :to="{ name: 'flow', params: { flowId: lesson.flowId } }"
          class="underline ml-2"
        >Walkthrough →</RouterLink>
      </template>
    </div>

    <div class="flex gap-3">
      <button v-if="!submitted" class="btn btn--primary" :disabled="!allFilled" @click="check">
        Check flow
      </button>
      <template v-else>
        <button v-if="!isPerfect" class="btn" @click="tryAgain">Try again</button>
        <button class="btn btn--primary" @click="emit('next')">Next lesson →</button>
      </template>
    </div>
  </div>
</template>
