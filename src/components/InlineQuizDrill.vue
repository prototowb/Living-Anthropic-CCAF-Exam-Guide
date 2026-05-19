<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { getQuestion, getQuizSection, type OptionLetter, type QuizQuestion, type QuizSection } from '@/data/quizData';
import { useQuizStore } from '@/stores/quiz';
import type { QuizQuestionRef } from '@/data/domain-content/types';

const props = defineProps<{ refs: QuizQuestionRef[] }>();
const store = useQuizStore();

interface Item {
  section: QuizSection;
  question: QuizQuestion;
}

const items = computed<Item[]>(() =>
  props.refs
    .map((r) => {
      const section = getQuizSection(r.sectionId);
      const question = getQuestion(r.sectionId, r.questionId);
      if (!section || !question) return null;
      return { section, question };
    })
    .filter((x): x is Item => x !== null),
);

const idx = ref(0);
const selected = ref<OptionLetter | null>(null);
const revealed = ref(false);

watch(
  () => props.refs.map((r) => `${r.sectionId}:${r.questionId}`).join(','),
  () => {
    idx.value = 0;
    selected.value = null;
    revealed.value = false;
    syncFromStore();
  },
  { immediate: true },
);

watch(idx, () => {
  selected.value = null;
  revealed.value = false;
  syncFromStore();
});

function syncFromStore() {
  const item = items.value[idx.value];
  if (!item) return;
  const existing = store.getAnswer(item.section.id, item.question.id);
  if (existing) {
    selected.value = existing.picked;
    revealed.value = true;
  }
}

function pick(letter: OptionLetter) {
  if (revealed.value) return;
  selected.value = letter;
}

function reveal() {
  const item = items.value[idx.value];
  if (!selected.value || !item) return;
  revealed.value = true;
  store.recordAnswer(
    item.section.id,
    item.question.id,
    selected.value,
    item.question.correct === selected.value,
  );
}

const current = computed(() => items.value[idx.value]);
</script>

<template>
  <div v-if="current" class="card mt-6">
    <div class="card__header">
      <div>
        <div class="card__subtitle">
          Practice ({{ idx + 1 }} / {{ items.length }}) ·
          <span :style="{ color: current.section.color }">{{ current.section.shortTitle }}</span> ·
          Q{{ current.question.id }}
        </div>
      </div>
      <div class="flex gap-1">
        <button class="btn btn--ghost btn--sm" :disabled="idx === 0" @click="idx--">←</button>
        <button class="btn btn--ghost btn--sm" :disabled="idx === items.length - 1" @click="idx++">→</button>
      </div>
    </div>

    <div class="quiz-question">
      <p class="quiz-question__prompt">{{ current.question.text }}</p>

      <div class="quiz-question__options">
        <button
          v-for="opt in current.question.options"
          :key="opt.letter"
          class="quiz-question__option"
          :class="{
            'quiz-question__option--selected': selected === opt.letter && !revealed,
            'quiz-question__option--correct': revealed && current.question.correct === opt.letter,
            'quiz-question__option--incorrect': revealed && selected === opt.letter && current.question.correct !== opt.letter,
          }"
          :disabled="revealed"
          @click="pick(opt.letter)"
        >
          <span class="quiz-question__option-letter">{{ opt.letter }}</span>
          <span>{{ opt.text }}</span>
        </button>
      </div>

      <div v-if="revealed" class="quiz-question__explanation">
        <div
          class="font-semibold mb-1"
          :class="selected === current.question.correct ? 'text-emerald-400' : 'text-rose-400'"
        >
          {{ selected === current.question.correct ? '✓ Correct' : `✗ Expected ${current.question.correct}` }}
        </div>
        <p>{{ current.question.explanation }}</p>
      </div>

      <div class="quiz-question__footer">
        <button v-if="!revealed" class="btn btn--primary" :disabled="!selected" @click="reveal">
          Reveal answer
        </button>
        <button
          v-else-if="idx < items.length - 1"
          class="btn btn--primary"
          @click="idx++"
        >
          Next question →
        </button>
      </div>
    </div>
  </div>
</template>
