<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useMockExamStore } from '@/stores/mockExam';
import { getQuestion, getQuizSection, type OptionLetter } from '@/data/quizData';
import { getPatternsForQuestion } from '@/data/reverseLinks';
import PageHeader from '@/components/PageHeader.vue';

const props = defineProps<{ id: string }>();
const store = useMockExamStore();
const router = useRouter();

const exam = computed(() => store.getCompletedExam(props.id));

if (!exam.value) router.replace({ name: 'mock-exam' });

interface ReviewItem {
  ref: { sectionId: string; questionId: number };
  picked: OptionLetter | null;
  isFlagged: boolean;
}

const items = computed<ReviewItem[]>(() => {
  if (!exam.value) return [];
  const rows: ReviewItem[] = [];
  for (const ref of exam.value.questionRefs) {
    const key = `${ref.sectionId}:${ref.questionId}`;
    const picked = exam.value.answers[key] ?? null;
    const q = getQuestion(ref.sectionId, ref.questionId);
    if (!q) continue;
    const isUnanswered = !picked;
    const isWrong = !!picked && picked !== q.correct;
    const isFlagged = !!exam.value.flags[key];
    if (isUnanswered || isWrong || isFlagged) {
      rows.push({ ref, picked, isFlagged });
    }
  }
  return rows;
});

const idx = ref(0);

watch(() => props.id, () => (idx.value = 0));

const current = computed(() => items.value[idx.value]);
const currentQuestion = computed(() =>
  current.value ? getQuestion(current.value.ref.sectionId, current.value.ref.questionId) : null,
);
const currentSection = computed(() =>
  current.value ? getQuizSection(current.value.ref.sectionId) : null,
);
const linkedPatterns = computed(() => {
  if (!current.value) return [];
  return getPatternsForQuestion(current.value.ref.sectionId, current.value.ref.questionId);
});

const wrongLetterExplanation = computed(() => {
  if (!current.value || !currentQuestion.value || !current.value.picked) return null;
  return currentQuestion.value.wrongExplanations?.[current.value.picked] ?? null;
});

function next() {
  if (idx.value < items.value.length - 1) idx.value++;
}
function prev() {
  if (idx.value > 0) idx.value--;
}

function isWrongPick(letter: OptionLetter): boolean {
  return !!current.value && current.value.picked === letter && letter !== currentQuestion.value!.correct;
}
</script>

<template>
  <template v-if="exam && items.length === 0">
    <PageHeader eyebrow="Mock exam · Review" title="Nothing to walk through" subtitle="No wrong, unanswered, or flagged items in this attempt." />
    <RouterLink :to="{ name: 'mock-exam-result', params: { id: exam.id } }" class="btn">← Back to result</RouterLink>
  </template>

  <template v-else-if="exam && current && currentQuestion && currentSection">
    <div class="flex items-center justify-between text-xs text-ink-400 mb-2">
      <RouterLink :to="{ name: 'mock-exam-result', params: { id: exam.id } }">← Back to result</RouterLink>
      <span class="font-mono">
        {{ currentSection.id.toUpperCase() }} · Q{{ current.ref.questionId }}
      </span>
    </div>

    <PageHeader
      :eyebrow="`Review ${idx + 1} / ${items.length}`"
      :title="currentSection.title"
    />

    <div class="mock-exam__review-progress mb-4">
      <div class="progress-bar" style="flex: 1">
        <div class="progress-bar__fill" :style="{ width: ((idx + 1) / items.length * 100) + '%' }" />
      </div>
      <span>{{ idx + 1 }} / {{ items.length }}</span>
    </div>

    <div class="quiz-question">
      <div class="quiz-question__context">{{ currentSection.context }}</div>

      <p class="quiz-question__prompt">{{ currentQuestion.text }}</p>

      <div class="quiz-question__options">
        <button
          v-for="opt in currentQuestion.options"
          :key="opt.letter"
          class="quiz-question__option"
          :class="{
            'quiz-question__option--correct': currentQuestion.correct === opt.letter,
            'quiz-question__option--incorrect': isWrongPick(opt.letter),
          }"
          disabled
        >
          <span class="quiz-question__option-letter">{{ opt.letter }}</span>
          <span>{{ opt.text }}</span>
        </button>
      </div>

      <div class="quiz-question__explanation">
        <div class="font-semibold mb-1" :class="current.picked === currentQuestion.correct ? 'text-emerald-400' : 'text-rose-400'">
          <template v-if="!current.picked">
            ✗ You left this blank. Correct: {{ currentQuestion.correct }}
          </template>
          <template v-else-if="current.picked === currentQuestion.correct">
            ✓ Correct (flagged for review)
          </template>
          <template v-else>
            ✗ You picked {{ current.picked }} · Correct: {{ currentQuestion.correct }}
          </template>
        </div>
        <p>{{ currentQuestion.explanation }}</p>

        <div v-if="wrongLetterExplanation" class="quiz-question__wrong-explanations">
          <dt>Why {{ current.picked }} is incorrect</dt>
          <dd>{{ wrongLetterExplanation }}</dd>
        </div>
      </div>

      <section v-if="linkedPatterns.length" class="reverse-links">
        <div class="reverse-links__label">This question tests</div>
        <div class="reverse-links__list">
          <RouterLink
            v-for="p in linkedPatterns"
            :key="p.patternId"
            :to="{ name: 'pattern', params: { id: p.patternId } }"
            class="reverse-links__chip"
          >
            <strong>D{{ p.domainNumber }}·{{ p.taskRef }}</strong>
            <span>{{ p.patternTitle }}</span>
          </RouterLink>
        </div>
      </section>

      <div class="quiz-question__footer mt-4">
        <button class="btn" :disabled="idx === 0" @click="prev">← Previous review item</button>
        <button
          class="btn btn--primary"
          :disabled="idx >= items.length - 1"
          @click="next"
        >
          Next review item →
        </button>
      </div>
    </div>

    <RouterLink :to="{ name: 'mock-exam-result', params: { id: exam.id } }" class="btn btn--ghost mt-4">
      ← Back to full result
    </RouterLink>
  </template>
</template>
