<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { getFlow } from '@/data/flows';
import { domains } from '@/data/domains';
import PageHeader from '@/components/PageHeader.vue';
import CodeBlock from '@/components/CodeBlock.vue';
import ProgressBar from '@/components/ProgressBar.vue';

const props = defineProps<{ flowId: string }>();
const router = useRouter();

const flow = computed(() => getFlow(props.flowId));
if (!flow.value) router.replace({ name: 'atlas' });

const stepIdx = ref(0);
watch(() => props.flowId, () => (stepIdx.value = 0));

const currentStep = computed(() => flow.value?.steps[stepIdx.value]);

const currentPattern = computed(() => {
  const s = currentStep.value;
  if (!s) return null;
  for (const d of domains) {
    const p = d.patterns.find((p) => p.id === s.patternId);
    if (p) return { pattern: p, domain: d };
  }
  return null;
});

function next() {
  if (!flow.value) return;
  if (stepIdx.value < flow.value.steps.length - 1) stepIdx.value++;
}
function prev() {
  if (stepIdx.value > 0) stepIdx.value--;
}
function goto(idx: number) {
  if (!flow.value) return;
  if (idx < 0 || idx >= flow.value.steps.length) return;
  stepIdx.value = idx;
}
</script>

<template>
  <template v-if="flow && currentStep && currentPattern">
    <div class="flex items-center justify-between text-xs text-ink-400 mb-2">
      <RouterLink :to="{ name: 'atlas' }">← Concept Atlas</RouterLink>
      <span class="font-mono">Step {{ stepIdx + 1 }} / {{ flow.steps.length }}</span>
    </div>

    <PageHeader
      :eyebrow="`Walkthrough · ${flow.title}`"
      :title="`Step ${stepIdx + 1}: ${currentStep.role}`"
      :subtitle="flow.summary"
    />

    <div class="mb-4">
      <ProgressBar :value="stepIdx + 1" :max="flow.steps.length" large />
    </div>

    <div class="atlas__step-pane mb-5">
      <div class="atlas__step-counter">
        Domain {{ currentPattern.domain.number }} · Task {{ currentPattern.pattern.taskRef }}
      </div>
      <h2 class="text-xl font-semibold mt-1">{{ currentPattern.pattern.title }}</h2>
      <p class="text-ink-300 mt-2 text-sm">{{ currentPattern.pattern.summary }}</p>

      <div class="mt-4 p-4 rounded" style="background: rgba(47, 157, 106, 0.08); border-left: 3px solid #2f9d6a;">
        <div class="text-xs uppercase tracking-widest text-emerald-400 font-semibold mb-1">
          Why this step is here
        </div>
        <p class="text-sm leading-relaxed">{{ currentStep.why }}</p>
      </div>
    </div>

    <div class="card mb-5">
      <div class="card__subtitle font-mono mb-3">Source: {{ currentPattern.pattern.source }}</div>
      <CodeBlock
        :code="currentPattern.pattern.codeSnippet"
        :language="currentPattern.pattern.language"
      />
      <div class="card__footer">
        <RouterLink
          :to="{ name: 'pattern', params: { id: currentPattern.pattern.id } }"
          class="btn btn--sm"
        >Open pattern detail →</RouterLink>
      </div>
    </div>

    <div class="flex items-center justify-between gap-3 mb-6">
      <button class="btn" :disabled="stepIdx === 0" @click="prev">
        ← Previous step
      </button>
      <div class="flex gap-1">
        <button
          v-for="(s, i) in flow.steps"
          :key="i"
          class="btn btn--ghost btn--sm"
          :class="{ 'btn--primary': i === stepIdx }"
          :title="s.role"
          @click="goto(i)"
        >{{ i + 1 }}</button>
      </div>
      <button
        class="btn btn--primary"
        :disabled="stepIdx >= flow.steps.length - 1"
        @click="next"
      >Next step →</button>
    </div>

    <section v-if="stepIdx === flow.steps.length - 1" class="card card--accent">
      <h3 class="card__title text-base">You've walked through the whole flow.</h3>
      <p class="card__body mt-2">
        Try building it from scratch in the matching micro-lesson, or browse the patterns at your own pace.
      </p>
      <div class="card__footer">
        <RouterLink :to="{ name: 'lessons' }" class="btn btn--primary btn--sm">Find a flow-builder lesson →</RouterLink>
        <RouterLink :to="{ name: 'atlas' }" class="btn btn--sm">Back to atlas</RouterLink>
      </div>
    </section>
  </template>
</template>
