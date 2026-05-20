<script setup lang="ts">
import { ref } from 'vue';
import type { McqLesson } from '@/data/types';
import { useProgressStore } from '@/stores/progress';

const props = defineProps<{ lesson: McqLesson }>();
const progress = useProgressStore();

const picked = ref<'A' | 'B' | 'C' | 'D' | null>(null);
const submitted = ref(false);

function submit() {
  if (!picked.value) return;
  submitted.value = true;
  progress.recordLessonAttempt(props.lesson.id, picked.value === props.lesson.correct);
}

function reset() {
  picked.value = null;
  submitted.value = false;
}
</script>

<template>
  <div class="space-y-3">
    <p>{{ lesson.question }}</p>

    <ol class="space-y-2">
      <li v-for="o in lesson.options" :key="o.letter">
        <button
          @click="picked = o.letter"
          :disabled="submitted"
          class="w-full text-left p-3 rounded border flex items-baseline gap-3"
          :class="{
            'border-ink-200 bg-white hover:border-ink-400': !submitted && picked !== o.letter,
            'border-ink-900 bg-ink-50': !submitted && picked === o.letter,
            'border-stage-s4 bg-stage-s4/5': submitted && o.letter === lesson.correct,
            'border-stage-s5 bg-stage-s5/5':
              submitted && picked === o.letter && o.letter !== lesson.correct,
            'border-ink-100': submitted && o.letter !== lesson.correct && picked !== o.letter,
          }"
        >
          <span class="mono text-sm w-6">{{ o.letter }}.</span>
          <span class="flex-1">{{ o.text }}</span>
        </button>
      </li>
    </ol>

    <div class="flex gap-2">
      <button
        v-if="!submitted"
        @click="submit"
        :disabled="!picked"
        class="px-4 py-2 bg-ink-900 text-white rounded text-sm disabled:opacity-50"
      >
        Submit
      </button>
      <button
        v-else
        @click="reset"
        class="px-4 py-2 bg-ink-900 text-white rounded text-sm"
      >
        Try again
      </button>
    </div>

    <div
      v-if="submitted"
      class="p-3 rounded border text-sm"
      :class="picked === lesson.correct ? 'border-stage-s4 bg-stage-s4/5' : 'border-stage-s5 bg-stage-s5/5'"
    >
      <strong>{{ picked === lesson.correct ? '✓ Correct' : `✗ Expected ${lesson.correct}` }}</strong>
      <p class="mt-1 text-ink-700">{{ lesson.explanation }}</p>
    </div>
  </div>
</template>
