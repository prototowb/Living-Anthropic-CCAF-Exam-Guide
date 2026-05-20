<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { getLessonById } from '@/data/lessons';
import ReorderRunner from '@/components/lessons/ReorderRunner.vue';
import BlanksRunner from '@/components/lessons/BlanksRunner.vue';
import McqRunner from '@/components/lessons/McqRunner.vue';
import FlowBuilderRunner from '@/components/lessons/FlowBuilderRunner.vue';

const props = defineProps<{ id: string }>();
const lesson = computed(() => getLessonById(props.id));
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
  </section>

  <section v-else>
    <p>Lesson not found.</p>
  </section>
</template>
