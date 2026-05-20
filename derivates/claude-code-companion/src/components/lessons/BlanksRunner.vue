<script setup lang="ts">
import { computed, ref } from 'vue';
import type { BlanksLesson } from '@/data/types';
import { useProgressStore } from '@/stores/progress';

const props = defineProps<{ lesson: BlanksLesson }>();
const progress = useProgressStore();

const picks = ref<(number | null)[]>(props.lesson.blanks.map(() => null));
const submitted = ref(false);

const segments = computed(() => props.lesson.prompt.split(/\{(\d+)\}/));

const allCorrect = computed(() =>
  picks.value.every((p, i) => p === props.lesson.blanks[i].correctIndex),
);

function submit() {
  if (picks.value.some((p) => p === null)) return;
  submitted.value = true;
  progress.recordLessonAttempt(props.lesson.id, allCorrect.value);
}

function reset() {
  picks.value = props.lesson.blanks.map(() => null);
  submitted.value = false;
}
</script>

<template>
  <div class="space-y-3">
    <p class="text-sm mono p-3 rounded bg-ink-900 text-ink-100">
      <template v-for="(seg, i) in segments" :key="i">
        <template v-if="i % 2 === 0">{{ seg }}</template>
        <template v-else>
          <span
            class="inline-block px-2 py-0.5 mx-0.5 rounded border"
            :class="{
              'bg-ink-100 text-ink-900 border-ink-300':
                picks[Number(seg)] !== null && !submitted,
              'bg-stage-s4/20 text-stage-s4 border-stage-s4':
                submitted && picks[Number(seg)] === lesson.blanks[Number(seg)].correctIndex,
              'bg-stage-s5/20 text-stage-s5 border-stage-s5':
                submitted && picks[Number(seg)] !== lesson.blanks[Number(seg)].correctIndex,
              'bg-ink-800 text-ink-400 border-ink-700':
                picks[Number(seg)] === null && !submitted,
            }"
          >
            {{
              picks[Number(seg)] !== null
                ? lesson.blanks[Number(seg)].options[picks[Number(seg)]!]
                : '____'
            }}
          </span>
        </template>
      </template>
    </p>

    <div v-for="(blank, idx) in lesson.blanks" :key="idx" class="space-y-1">
      <div class="text-xs text-ink-500">Blank {{ idx + 1 }}</div>
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="(opt, oi) in blank.options"
          :key="opt"
          @click="!submitted && (picks[idx] = oi)"
          class="px-3 py-1 text-sm rounded border"
          :class="{
            'border-ink-900 bg-ink-100': picks[idx] === oi && !submitted,
            'border-ink-200 bg-white': picks[idx] !== oi && !submitted,
            'border-stage-s4 bg-stage-s4/5': submitted && oi === blank.correctIndex,
            'border-stage-s5 bg-stage-s5/5':
              submitted && picks[idx] === oi && oi !== blank.correctIndex,
            'border-ink-100': submitted && oi !== blank.correctIndex && picks[idx] !== oi,
          }"
          :disabled="submitted"
        >
          {{ opt }}
        </button>
      </div>
      <p v-if="submitted" class="text-xs text-ink-600 italic">
        {{ blank.explanation }}
      </p>
    </div>

    <div class="flex gap-2">
      <button
        v-if="!submitted"
        class="px-4 py-2 bg-ink-900 text-white rounded text-sm disabled:opacity-50"
        :disabled="picks.some((p) => p === null)"
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
  </div>
</template>
