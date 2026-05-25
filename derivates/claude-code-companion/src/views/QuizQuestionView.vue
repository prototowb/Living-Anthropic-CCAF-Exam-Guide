<script setup lang="ts">
const props = defineProps<{ section: string; qid: string }>();

import { computed, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { getQuizSection } from '@/data/quizData';
import { getStage } from '@/data/stages';
import { getSandbox } from '@/data/sandboxes';
import { useProgressStore } from '@/stores/progress';

const section = computed(() => getQuizSection(props.section));
const question = computed(() =>
  section.value?.questions.find((q) => q.id === Number(props.qid)),
);
const stage = computed(() => (question.value ? getStage(question.value.stageId) : undefined));
const sandbox = computed(() =>
  stage.value?.sandboxId ? getSandbox(stage.value.sandboxId) : undefined,
);

const router = useRouter();
const progress = useProgressStore();

const picked = ref<'A' | 'B' | 'C' | 'D' | null>(null);
const revealed = ref(false);

watch(
  () => question.value?.id,
  () => {
    picked.value = null;
    revealed.value = false;
  },
);

function choose(letter: 'A' | 'B' | 'C' | 'D') {
  picked.value = letter;
}

function reveal() {
  if (!picked.value || !question.value) return;
  revealed.value = true;
  const correct = picked.value === question.value.correct;
  progress.recordQuizAnswer(`${props.section}:${question.value.id}`, picked.value, correct);
}

function next() {
  if (!section.value || !question.value) return;
  const idx = section.value.questions.findIndex((q) => q.id === question.value!.id);
  const nextQ = section.value.questions[idx + 1];
  if (nextQ) {
    router.push(`/quiz/${section.value.id}/${nextQ.id}`);
  } else {
    router.push(`/quiz/${section.value.id}`);
  }
}
</script>

<template>
  <section v-if="section && question" class="space-y-4 max-w-2xl">
    <header>
      <RouterLink :to="`/quiz/${section.id}`" class="text-xs text-ink-500 hover:underline">
        ← {{ section.title }}
      </RouterLink>
      <h1 class="text-xl font-medium mt-2">Q{{ question.id }}</h1>
    </header>

    <p class="text-ink-900">{{ question.text }}</p>

    <ol class="space-y-2">
      <li v-for="o in question.options" :key="o.letter">
        <button
          @click="choose(o.letter)"
          :disabled="revealed"
          class="w-full text-left p-3 rounded border transition flex items-baseline gap-3"
          :class="{
            'border-ink-200 bg-white hover:border-ink-400': !revealed && picked !== o.letter,
            'border-ink-900 bg-ink-50': !revealed && picked === o.letter,
            'border-stage-s4 bg-stage-s4/5': revealed && o.letter === question.correct,
            'border-stage-s5 bg-stage-s5/5': revealed && picked === o.letter && o.letter !== question.correct,
            'border-ink-100': revealed && o.letter !== question.correct && picked !== o.letter,
          }"
        >
          <span class="mono text-sm w-6">{{ o.letter }}.</span>
          <span class="flex-1">{{ o.text }}</span>
        </button>
      </li>
    </ol>

    <div class="flex gap-2">
      <button
        v-if="!revealed"
        @click="reveal"
        :disabled="!picked"
        class="px-4 py-2 bg-ink-900 text-white rounded text-sm disabled:opacity-50"
      >
        Reveal
      </button>
      <button
        v-else
        @click="next"
        class="px-4 py-2 bg-ink-900 text-white rounded text-sm"
      >
        Next question →
      </button>
    </div>

    <div
      v-if="revealed"
      class="p-3 rounded border"
      :class="picked === question.correct ? 'border-stage-s4 bg-stage-s4/5' : 'border-stage-s5 bg-stage-s5/5'"
    >
      <div class="font-medium text-sm mb-1">
        {{ picked === question.correct ? '✓ Correct' : `✗ The expected answer is ${question.correct}` }}
      </div>
      <p class="text-sm text-ink-700">{{ question.explanation }}</p>
    </div>

    <!-- Reverse-link chips — shown after reveal so they don't spoil the answer.
         PROJECT_PLAN.md §5: "MCQ + reveal + reverse-link chips back to the stage + linked sandbox". -->
    <footer
      v-if="revealed && stage"
      class="flex flex-wrap gap-2 pt-3 border-t border-ink-100"
    >
      <RouterLink
        :to="`/learn/${stage.id}`"
        class="text-xs px-2 py-1 rounded border border-ink-200 bg-canvas text-ink-700 hover:border-ink-400 hover:bg-ink-50 transition"
      >
        ← Stage {{ stage.number }}: {{ stage.title }}
      </RouterLink>
      <RouterLink
        v-if="sandbox"
        :to="`/sandboxes/${sandbox.id}`"
        class="text-xs px-2 py-1 rounded border border-stage-s2/40 bg-stage-s2/5 text-stage-s2 hover:border-stage-s2 hover:bg-stage-s2/10 transition"
      >
        🧪 Sandbox: {{ sandbox.title }}
      </RouterLink>
    </footer>
  </section>

  <section v-else>
    <p>Question not found.</p>
  </section>
</template>
