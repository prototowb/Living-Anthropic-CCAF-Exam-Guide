<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ReorderLesson } from '@/data/types';
import { useProgressStore } from '@/stores/progress';

const props = defineProps<{ lesson: ReorderLesson }>();
const progress = useProgressStore();

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const order = ref<string[]>(shuffle(props.lesson.steps.map((s) => s.id)));
const submitted = ref(false);

const stepsById = computed(() => {
  const m = new Map<string, (typeof props.lesson.steps)[number]>();
  for (const s of props.lesson.steps) m.set(s.id, s);
  return m;
});

const canonicalIds = computed(() => props.lesson.steps.map((s) => s.id));

const allCorrect = computed(() =>
  order.value.every((id, idx) => canonicalIds.value[idx] === id),
);

function move(idx: number, delta: -1 | 1) {
  if (submitted.value) return;
  const j = idx + delta;
  if (j < 0 || j >= order.value.length) return;
  const arr = order.value.slice();
  [arr[idx], arr[j]] = [arr[j], arr[idx]];
  order.value = arr;
}

function submit() {
  submitted.value = true;
  progress.recordLessonAttempt(props.lesson.id, allCorrect.value);
}

function reset() {
  order.value = shuffle(props.lesson.steps.map((s) => s.id));
  submitted.value = false;
}
</script>

<template>
  <div class="space-y-3">
    <p class="text-sm text-ink-500">Use ↑ / ↓ to reorder the steps.</p>
    <ol class="space-y-2">
      <li
        v-for="(id, idx) in order"
        :key="id"
        class="flex items-center gap-2 p-3 rounded border bg-white"
        :class="{
          'border-stage-s4 bg-stage-s4/5':
            submitted && canonicalIds[idx] === id,
          'border-stage-s5 bg-stage-s5/5':
            submitted && canonicalIds[idx] !== id,
          'border-ink-200': !submitted,
        }"
      >
        <div class="flex flex-col gap-1">
          <button
            class="text-xs px-1.5 rounded border border-ink-200 disabled:opacity-40"
            :disabled="idx === 0 || submitted"
            @click="move(idx, -1)"
          >
            ↑
          </button>
          <button
            class="text-xs px-1.5 rounded border border-ink-200 disabled:opacity-40"
            :disabled="idx === order.length - 1 || submitted"
            @click="move(idx, 1)"
          >
            ↓
          </button>
        </div>
        <div class="flex-1">
          <div class="text-sm">{{ stepsById.get(id)!.label }}</div>
          <p v-if="submitted" class="text-xs text-ink-600 mt-1 italic">
            {{ stepsById.get(id)!.rationale }}
          </p>
        </div>
      </li>
    </ol>

    <div class="flex gap-2">
      <button
        v-if="!submitted"
        class="px-4 py-2 bg-ink-900 text-white rounded text-sm"
        @click="submit"
      >
        Submit
      </button>
      <button
        v-else
        class="px-4 py-2 bg-ink-900 text-white rounded text-sm"
        @click="reset"
      >
        Try again
      </button>
    </div>

    <div
      v-if="submitted"
      class="p-3 rounded border text-sm"
      :class="allCorrect ? 'border-stage-s4 bg-stage-s4/5' : 'border-stage-s5 bg-stage-s5/5'"
    >
      {{ allCorrect ? '✓ All in the right order.' : 'Some are out of order — read the rationales above and try again.' }}
    </div>
  </div>
</template>
