<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { getLesson, lessons } from '@/data/lessons';
import { domains } from '@/data/domains';
import { useLessonStore } from '@/stores/lesson';
import PageHeader from '@/components/PageHeader.vue';
import ReorderLesson from '@/components/lessons/ReorderLesson.vue';
import BlanksLesson from '@/components/lessons/BlanksLesson.vue';
import McqLesson from '@/components/lessons/McqLesson.vue';
import FlowBuilderLesson from '@/components/lessons/FlowBuilderLesson.vue';

const props = defineProps<{ id: string }>();
const router = useRouter();
const store = useLessonStore();

const lesson = computed(() => getLesson(props.id));
const domain = computed(() =>
  lesson.value ? domains.find((d) => d.id === lesson.value!.domainId) : undefined,
);

if (!lesson.value) router.replace({ name: 'lessons' });

const lessonKey = ref(0);
watch(
  () => props.id,
  () => (lessonKey.value++),
);

function onComplete(success: boolean) {
  if (!lesson.value) return;
  store.recordAttempt(lesson.value.id, success);
}

function next() {
  const idx = lessons.findIndex((l) => l.id === props.id);
  const target = lessons[idx + 1];
  if (target) {
    router.push({ name: 'lesson', params: { id: target.id } });
  } else {
    router.push({ name: 'lessons' });
  }
}
</script>

<template>
  <template v-if="lesson && domain">
    <div class="flex items-center justify-between text-xs text-ink-400 mb-2">
      <RouterLink :to="{ name: 'lessons' }">← All lessons</RouterLink>
      <span class="badge" :class="`badge--${domain.badgeClass}`">
        Domain {{ domain.number }} — {{ domain.subtitle }}
      </span>
    </div>

    <PageHeader :eyebrow="`Lesson — ${lesson.format}`" :title="lesson.title" :subtitle="lesson.prompt" />

    <ReorderLesson
      v-if="lesson.format === 'reorder'"
      :key="lessonKey + ':r'"
      :lesson="lesson"
      @complete="onComplete"
      @next="next"
    />
    <BlanksLesson
      v-else-if="lesson.format === 'blanks'"
      :key="lessonKey + ':b'"
      :lesson="lesson"
      @complete="onComplete"
      @next="next"
    />
    <McqLesson
      v-else-if="lesson.format === 'mcq'"
      :key="lessonKey + ':m'"
      :lesson="lesson"
      @complete="onComplete"
      @next="next"
    />
    <FlowBuilderLesson
      v-else-if="lesson.format === 'flow'"
      :key="lessonKey + ':f'"
      :lesson="lesson"
      @complete="onComplete"
      @next="next"
    />
  </template>
</template>
