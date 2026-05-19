<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { McqLesson } from '@/data/lessons';

const props = defineProps<{ lesson: McqLesson }>();
const emit = defineEmits<{
  (e: 'complete', success: boolean): void;
  (e: 'next'): void;
}>();

const picked = ref<'A' | 'B' | 'C' | 'D' | null>(null);
const submitted = ref(false);

watch(
  () => props.lesson.id,
  () => {
    picked.value = null;
    submitted.value = false;
  },
);

const isCorrect = computed(() => submitted.value && picked.value === props.lesson.correct);

function check() {
  if (!picked.value) return;
  submitted.value = true;
  emit('complete', picked.value === props.lesson.correct);
}

function tryAgain() {
  picked.value = null;
  submitted.value = false;
}
</script>

<template>
  <div class="quiz-question">
    <div class="quiz-question__options">
      <button
        v-for="opt in lesson.options"
        :key="opt.letter"
        class="quiz-question__option"
        :class="{
          'quiz-question__option--selected': picked === opt.letter && !submitted,
          'quiz-question__option--correct': submitted && lesson.correct === opt.letter,
          'quiz-question__option--incorrect': submitted && picked === opt.letter && lesson.correct !== opt.letter,
        }"
        :disabled="submitted"
        @click="picked = opt.letter"
      >
        <span class="quiz-question__option-letter">{{ opt.letter }}</span>
        <span>{{ opt.text }}</span>
      </button>
    </div>

    <div v-if="submitted" class="quiz-question__explanation">
      <div class="font-semibold mb-1" :class="isCorrect ? 'text-emerald-400' : 'text-rose-400'">
        {{ isCorrect ? '✓ Correct' : `✗ Expected ${lesson.correct}` }}
      </div>
      <p>{{ lesson.explanation }}</p>
    </div>

    <div class="flex gap-3">
      <button v-if="!submitted" class="btn btn--primary" :disabled="!picked" @click="check">Check answer</button>
      <template v-else>
        <button v-if="!isCorrect" class="btn" @click="tryAgain">Try again</button>
        <button class="btn btn--primary" @click="emit('next')">Next lesson →</button>
      </template>
    </div>
  </div>
</template>
