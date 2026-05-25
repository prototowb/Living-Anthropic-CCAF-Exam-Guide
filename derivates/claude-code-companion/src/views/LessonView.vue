<script setup lang="ts">
const props = defineProps<{ id: string }>();

import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { getLessonById } from '@/data/lessons';
import { getStage } from '@/data/stages';
import { getSandbox } from '@/data/sandboxes';
import ReorderRunner from '@/components/lessons/ReorderRunner.vue';
import BlanksRunner from '@/components/lessons/BlanksRunner.vue';
import McqRunner from '@/components/lessons/McqRunner.vue';
import FlowBuilderRunner from '@/components/lessons/FlowBuilderRunner.vue';

const lesson = computed(() => getLessonById(props.id));
const stage = computed(() => (lesson.value ? getStage(lesson.value.stageId) : undefined));
const sandbox = computed(() =>
  stage.value?.sandboxId ? getSandbox(stage.value.sandboxId) : undefined,
);
</script>

<template>
  <section v-if="lesson" class="space-y-4 max-w-2xl">
    <header>
      <RouterLink to="/lessons" class="text-xs text-ink-500 hover:underline">← all lessons</RouterLink>
      <h1 class="text-2xl font-semibold tracking-tight mt-2">{{ lesson.title }}</h1>
      <p class="text-ink-600 mt-1">{{ lesson.summary }}</p>
    </header>

    <ReorderRunner v-if="lesson.format === 'reorder'" :lesson="lesson" />
    <BlanksRunner v-else-if="lesson.format === 'blanks'" :lesson="lesson" />
    <McqRunner v-else-if="lesson.format === 'mcq'" :lesson="lesson" />
    <FlowBuilderRunner v-else-if="lesson.format === 'flow-builder'" :lesson="lesson" />

    <!-- Reverse-link chips: back to the parent stage, plus its sandbox if any. -->
    <footer v-if="stage" class="flex flex-wrap gap-2 pt-3 border-t border-ink-100">
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
    <p>Lesson not found.</p>
  </section>
</template>
