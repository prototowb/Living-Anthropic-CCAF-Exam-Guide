<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { getDomain } from '@/data/domains';
import { quizSections } from '@/data/quizData';
import PageHeader from '@/components/PageHeader.vue';
import CodeBlock from '@/components/CodeBlock.vue';

const props = defineProps<{ id: string }>();
const router = useRouter();

const domain = computed(() => getDomain(props.id));
if (!domain.value) router.replace({ name: 'domains' });

const linkedQuestions = computed(() => {
  if (!domain.value) return [];
  return domain.value.relatedQuiz.flatMap((r) => {
    const section = quizSections.find((s) => s.id === r.sectionId);
    if (!section) return [];
    return r.questionIds.map((qid) => {
      const q = section.questions.find((q) => q.id === qid);
      return q ? { section, q } : null;
    }).filter(Boolean) as { section: typeof section; q: NonNullable<ReturnType<typeof section.questions.find>> }[];
  });
});
</script>

<template>
  <template v-if="domain">
    <div class="flex items-center justify-between text-xs text-ink-400 mb-2">
      <RouterLink :to="{ name: 'domains' }">← All domains</RouterLink>
      <span class="badge" :class="`badge--${domain.badgeClass}`">Domain {{ domain.number }}</span>
    </div>

    <PageHeader :eyebrow="`Domain ${domain.number}`" :title="domain.title" :subtitle="domain.description" />

    <section class="space-y-6 mb-10">
      <article
        v-for="p in domain.patterns"
        :key="p.id"
        class="card"
      >
        <header class="card__header">
          <div>
            <div class="card__subtitle font-mono">{{ p.source }}</div>
            <h2 class="card__title mt-1">{{ p.title }}</h2>
          </div>
        </header>
        <p class="card__body">{{ p.summary }}</p>
        <div class="mt-4">
          <CodeBlock :code="p.codeSnippet" :language="p.language" />
        </div>
        <footer class="card__footer">
          <RouterLink :to="{ name: 'pattern', params: { id: p.id } }" class="btn btn--sm">
            Open in showcase →
          </RouterLink>
        </footer>
      </article>
    </section>

    <section v-if="linkedQuestions.length" class="mb-10">
      <h2 class="text-xl font-semibold mb-4">Related quiz questions</h2>
      <div class="grid md:grid-cols-2 gap-3">
        <RouterLink
          v-for="(item, i) in linkedQuestions"
          :key="i"
          :to="{ name: 'quiz-question', params: { section: item.section.id, qid: item.q.id } }"
          class="card card--clickable !p-4"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="card__subtitle" :style="{ color: item.section.color }">
              {{ item.section.shortTitle }} · Q{{ item.q.id }}
            </span>
          </div>
          <p class="text-sm leading-snug line-clamp-3">{{ item.q.text.split('\n')[0] }}</p>
        </RouterLink>
      </div>
    </section>
  </template>
</template>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
