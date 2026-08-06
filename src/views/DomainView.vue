<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { domains, getDomain } from '@/data/domains';
import { quizSections, type QuizQuestion, type QuizSection } from '@/data/quizData';
import PageHeader from '@/components/PageHeader.vue';
import CodeBlock from '@/components/CodeBlock.vue';

const props = defineProps<{ id: string }>();
const route = useRoute();
const router = useRouter();

const domain = computed(() => getDomain(props.id));
if (!domain.value) router.replace({ name: 'domains' });

const printMode = computed(() => route.query.print === '1');

function printPage() {
  window.print();
}

// Union of the domain-level relatedQuiz list and the per-pattern
// quizQuestionRefs — the two drift (patterns reference questions the domain
// list forgot), and both the related section and the study sheet should show
// everything the domain touches.
const linkedQuestions = computed(() => {
  if (!domain.value) return [];
  const refs = [
    ...domain.value.relatedQuiz.flatMap((r) =>
      r.questionIds.map((qid) => ({ sectionId: r.sectionId, questionId: qid })),
    ),
    ...domain.value.patterns.flatMap((p) => p.quizQuestionRefs ?? []),
  ];
  const seen = new Set<string>();
  const out: { section: QuizSection; q: QuizQuestion }[] = [];
  for (const ref of refs) {
    const key = `${ref.sectionId}:${ref.questionId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const section = quizSections.find((s) => s.id === ref.sectionId);
    const q = section?.questions.find((q) => q.id === ref.questionId);
    if (section && q) out.push({ section, q });
  }
  return out;
});
</script>

<template>
  <!-- ── Print study sheet (?print=1) ─────────────────────────────── -->
  <div v-if="domain && printMode" class="print-sheet bg-white text-ink-800 rounded-lg p-8">
    <div class="no-print flex items-center justify-between mb-6 pb-4 border-b border-ink-200">
      <RouterLink
        :to="{ name: 'domain', params: { id: domain.id } }"
        class="text-sm text-ink-500 hover:text-ink-800"
      >
        ← Back to interactive view
      </RouterLink>
      <button
        type="button"
        class="px-4 py-2 rounded-md bg-ink-800 text-ink-50 text-sm font-medium hover:bg-ink-700"
        @click="printPage"
      >
        Print
      </button>
    </div>

    <header class="mb-6">
      <div class="sheet-h mb-1">
        Architect Playbook · Study sheet · Domain {{ domain.number }} of {{ domains.length }}
      </div>
      <h1 class="text-2xl font-bold text-ink-900 leading-tight">{{ domain.title }}</h1>
      <p class="text-[13px] text-ink-500 mt-1">{{ domain.subtitle }}</p>
      <p class="text-[13px] text-ink-600 mt-2 leading-relaxed">{{ domain.description }}</p>
    </header>

    <section class="mb-6">
      <h2 class="sheet-h mb-2">Patterns ({{ domain.patterns.length }})</h2>
      <div v-for="p in domain.patterns" :key="p.id" class="mb-3 avoid-break">
        <div class="text-[13px] font-semibold text-ink-800">
          {{ p.title }}
          <span class="font-mono font-normal text-[11px] text-ink-400">
            · task {{ p.taskRef }} · {{ p.source }}</span
          >
        </div>
        <p class="text-[12.5px] text-ink-600 leading-relaxed">{{ p.summary }}</p>
        <p v-if="p.antiPattern" class="text-[12px] text-ink-500 leading-relaxed">
          ✗ {{ p.antiPattern.title }} — {{ p.antiPattern.failureMode }}
        </p>
      </div>
    </section>

    <section v-if="linkedQuestions.length" class="mb-6">
      <h2 class="sheet-h mb-2">Linked quiz questions (answers marked)</h2>
      <div v-for="(item, i) in linkedQuestions" :key="i" class="mb-4 avoid-break">
        <div class="font-mono text-[11px] text-ink-400 mb-0.5">
          {{ item.section.shortTitle }} · Q{{ item.q.id }}
        </div>
        <p class="text-[12.5px] text-ink-800 font-medium leading-relaxed whitespace-pre-line">
          {{ item.q.text }}
        </p>
        <ul class="text-[12px] text-ink-600 mt-1 space-y-0.5">
          <li
            v-for="o in item.q.options"
            :key="o.letter"
            :class="o.letter === item.q.correct ? 'font-medium text-ink-800' : ''"
          >
            <span class="font-mono">{{ o.letter === item.q.correct ? '✓' : '·' }} {{ o.letter }}.</span>
            {{ o.text }}
          </li>
        </ul>
        <p class="text-[11.5px] text-ink-500 mt-1 leading-relaxed">{{ item.q.explanation }}</p>
      </div>
    </section>
  </div>

  <!-- ── Interactive view ─────────────────────────────────────────── -->
  <template v-else-if="domain">
    <div class="flex items-center gap-3 text-xs text-ink-400 mb-2">
      <RouterLink :to="{ name: 'domains' }">← All domains</RouterLink>
      <span class="flex-1"></span>
      <RouterLink
        :to="{ name: 'domain', params: { id: domain.id }, query: { print: '1' } }"
        class="hover:text-ink-200"
      >
        Study sheet ⎙
      </RouterLink>
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

.sheet-h {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #7c8699; /* ink-400 */
}
</style>
