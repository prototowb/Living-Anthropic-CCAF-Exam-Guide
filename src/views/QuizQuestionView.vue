<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { getQuestion, getQuizSection, type OptionLetter } from '@/data/quizData';
import { useQuizStore } from '@/stores/quiz';
import { getPatternsForQuestion } from '@/data/reverseLinks';
import PageHeader from '@/components/PageHeader.vue';
import ProgressBar from '@/components/ProgressBar.vue';

const props = defineProps<{ section: string; qid: string }>();
const router = useRouter();
const store = useQuizStore();

const section = computed(() => getQuizSection(props.section));
const qid = computed(() => Number(props.qid));
const question = computed(() => getQuestion(props.section, qid.value));

const selected = ref<OptionLetter | null>(null);
const revealed = ref(false);

watch(
  () => `${props.section}:${props.qid}`,
  () => {
    selected.value = null;
    revealed.value = false;
    const existing = store.getAnswer(props.section, qid.value);
    if (existing) {
      selected.value = existing.picked;
      revealed.value = true;
    }
  },
  { immediate: true },
);

const isCorrect = computed(() =>
  selected.value && question.value ? question.value.correct === selected.value : false,
);

function pick(letter: OptionLetter) {
  if (revealed.value) return;
  selected.value = letter;
}

function reveal() {
  if (!selected.value || !question.value) return;
  revealed.value = true;
  store.recordAnswer(
    props.section,
    qid.value,
    selected.value,
    question.value.correct === selected.value,
  );
}

function goRelative(delta: 1 | -1) {
  if (!section.value || !question.value) return;
  const idx = section.value.questions.findIndex((q) => q.id === question.value!.id);
  const next = section.value.questions[idx + delta];
  if (next) {
    router.push({ name: 'quiz-question', params: { section: section.value.id, qid: next.id } });
  } else if (delta === 1) {
    router.push({ name: 'quiz-section', params: { section: section.value.id } });
  }
}

const wrongExplanationOptions = computed(() => {
  if (!revealed.value || !question.value?.wrongExplanations) return [];
  return Object.entries(question.value.wrongExplanations);
});

const linkedPatterns = computed(() => {
  if (!question.value) return [];
  return getPatternsForQuestion(props.section, qid.value);
});
</script>

<template>
  <template v-if="section && question">
    <div class="flex items-center justify-between text-xs text-ink-400 mb-2">
      <RouterLink :to="{ name: 'quiz-section', params: { section: section.id } }">
        ← {{ section.shortTitle }}
      </RouterLink>
      <span class="font-mono">{{ section.id }} · Q{{ question.id }} / {{ section.questions.length }}</span>
    </div>

    <PageHeader :eyebrow="section.shortTitle" :title="`Question ${question.id}`" />

    <div class="quiz-question">
      <div class="quiz-question__context" v-if="section.context">
        {{ section.context }}
      </div>

      <p class="quiz-question__prompt">{{ question.text }}</p>

      <div class="quiz-question__options">
        <button
          v-for="opt in question.options"
          :key="opt.letter"
          class="quiz-question__option"
          :class="{
            'quiz-question__option--selected': selected === opt.letter && !revealed,
            'quiz-question__option--correct': revealed && question.correct === opt.letter,
            'quiz-question__option--incorrect': revealed && selected === opt.letter && question.correct !== opt.letter,
          }"
          :disabled="revealed"
          @click="pick(opt.letter)"
        >
          <span class="quiz-question__option-letter">{{ opt.letter }}</span>
          <span>{{ opt.text }}</span>
        </button>
      </div>

      <div v-if="revealed" class="quiz-question__explanation">
        <div class="font-semibold mb-1" :class="isCorrect ? 'text-emerald-400' : 'text-rose-400'">
          {{ isCorrect ? '✓ Correct' : `✗ Expected ${question.correct}` }}
        </div>
        <p>{{ question.explanation }}</p>

        <dl v-if="wrongExplanationOptions.length" class="quiz-question__wrong-explanations">
          <template v-for="[letter, expl] in wrongExplanationOptions" :key="letter">
            <dt>Why {{ letter }} is incorrect</dt>
            <dd>{{ expl }}</dd>
          </template>
        </dl>

        <p v-if="question.studyArea" class="mt-3 text-xs text-ink-400">
          📚 {{ question.studyArea }}
        </p>

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
      </div>

      <div class="quiz-question__footer">
        <button class="btn" :disabled="!section.questions.find((q) => q.id < question!.id)" @click="goRelative(-1)">← Prev</button>

        <button v-if="!revealed" class="btn btn--primary" :disabled="!selected" @click="reveal">
          Reveal answer
        </button>
        <button v-else class="btn btn--primary" @click="goRelative(1)">
          Next →
        </button>
      </div>

      <ProgressBar :value="question.id" :max="section.questions.length" />
    </div>
  </template>
</template>
