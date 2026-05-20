<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { getStage } from '@/data/stages';
import { getLessonsForStage } from '@/data/lessons';
import { getQuizSection } from '@/data/quizData';
import { getSandbox } from '@/data/sandboxes';
import { useProgressStore } from '@/stores/progress';
import MarkdownBlock from '@/components/MarkdownBlock.vue';

const props = defineProps<{ id: string }>();
const stage = computed(() => getStage(props.id));
const lessons = computed(() => (stage.value ? getLessonsForStage(stage.value.id) : []));
const section = computed(() => (stage.value ? getQuizSection(stage.value.quizSectionId) : undefined));
const sandbox = computed(() => (stage.value?.sandboxId ? getSandbox(stage.value.sandboxId) : undefined));

const progress = useProgressStore();
onMounted(() => {
  if (stage.value) progress.visitStage(stage.value.id);
});

function complete() {
  if (stage.value) progress.completeStage(stage.value.id);
}
</script>

<template>
  <section v-if="stage" class="space-y-6">
    <header>
      <RouterLink to="/learn" class="text-xs text-ink-500 hover:underline">← all stages</RouterLink>
      <h1 class="text-2xl font-semibold tracking-tight mt-2">
        Stage {{ stage.number }} — {{ stage.title }}
      </h1>
      <p class="text-ink-600 italic mt-1">{{ stage.anchorQuestion }}</p>
    </header>

    <MarkdownBlock :source="stage.body" />

    <div v-if="sandbox" class="p-4 rounded-lg border border-ink-200 bg-white">
      <div class="text-xs uppercase text-ink-500">Sandbox</div>
      <RouterLink :to="`/sandboxes/${sandbox.id}`" class="font-medium hover:underline">
        {{ sandbox.title }}
      </RouterLink>
      <p class="text-sm text-ink-600 mt-1">{{ sandbox.description }}</p>
    </div>

    <div v-if="lessons.length" class="space-y-2">
      <h2 class="text-lg font-medium">Lessons</h2>
      <ul class="space-y-1">
        <li v-for="l in lessons" :key="l.id">
          <RouterLink
            :to="`/lessons/${l.id}`"
            class="block p-3 rounded border border-ink-200 bg-white hover:border-ink-400"
          >
            <div class="flex items-baseline gap-2">
              <span class="mono text-xs text-ink-500">{{ l.format }}</span>
              <span class="font-medium">{{ l.title }}</span>
              <span
                class="ml-auto text-xs px-1.5 py-0.5 rounded mono"
                :class="{
                  'bg-rung-B/10 text-rung-B': l.rung === 'B',
                  'bg-rung-I/10 text-rung-I': l.rung === 'I',
                  'bg-rung-A/10 text-rung-A': l.rung === 'A',
                }"
                >{{ l.rung }}</span
              >
            </div>
            <p class="text-sm text-ink-600 mt-1">{{ l.summary }}</p>
          </RouterLink>
        </li>
      </ul>
    </div>

    <div v-if="section && section.questions.length" class="space-y-2">
      <h2 class="text-lg font-medium">Quiz — {{ section.title }}</h2>
      <RouterLink
        :to="`/quiz/${section.id}`"
        class="inline-block px-3 py-1.5 bg-ink-900 text-white text-sm rounded hover:bg-ink-700"
      >
        Open {{ section.questions.length }} questions →
      </RouterLink>
    </div>

    <div class="pt-4 border-t border-ink-200">
      <button
        @click="complete"
        class="px-3 py-1.5 text-sm rounded border border-ink-300 hover:border-ink-900"
      >
        Mark this stage complete
      </button>
    </div>
  </section>

  <section v-else>
    <p>Stage not found.</p>
  </section>
</template>
