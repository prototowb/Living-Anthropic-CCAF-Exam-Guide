<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { domains } from '@/data/domains';
import type { DomainPattern } from '@/data/domain-content/types';
import PageHeader from '@/components/PageHeader.vue';
import CodeBlock from '@/components/CodeBlock.vue';
import InlineQuizDrill from '@/components/InlineQuizDrill.vue';
import { sandboxRegistry } from '@/components/sandboxes';
import {
  getFlowsForPattern,
  getFollowsFor,
  getPrecedesFor,
} from '@/data/flowHelpers';

const props = defineProps<{ id: string }>();
const router = useRouter();

const found = computed(() => {
  for (const d of domains) {
    const p = d.patterns.find((p) => p.id === props.id);
    if (p) return { domain: d, pattern: p };
  }
  return null;
});

if (!found.value) router.replace({ name: 'patterns' });

const relatedPatterns = computed(() => {
  if (!found.value?.pattern.related) return [];
  return found.value.pattern.related
    .map((id) => {
      for (const d of domains) {
        const p = d.patterns.find((p) => p.id === id);
        if (p) return { id, title: p.title, domain: d };
      }
      return null;
    })
    .filter((x): x is { id: string; title: string; domain: typeof domains[number] } => x !== null);
});

const SandboxComponent = computed(() => {
  if (!found.value?.pattern.sandbox) return null;
  return sandboxRegistry[found.value.pattern.sandbox] ?? null;
});

function patternTypeBadge(type: DomainPattern['type']): string {
  const map: Record<DomainPattern['type'], string> = {
    architectural: 'badge--domain-ci',
    tooling: 'badge--domain-support',
    prompt: 'badge--domain-codegen',
    reliability: 'badge--domain-ops',
    config: 'badge--domain-support',
  };
  return map[type];
}

const flowMemberships = computed(() => {
  if (!found.value) return [];
  return getFlowsForPattern(found.value.pattern.id);
});

const followsList = computed(() => {
  if (!found.value) return [];
  return getFollowsFor(found.value.pattern.id);
});

const precedesList = computed(() => {
  if (!found.value) return [];
  return getPrecedesFor(found.value.pattern.id);
});

const hasFlowInfo = computed(
  () => flowMemberships.value.length > 0 || followsList.value.length > 0 || precedesList.value.length > 0,
);
</script>

<template>
  <template v-if="found">
    <div class="flex items-center justify-between text-xs text-ink-400 mb-2">
      <RouterLink :to="{ name: 'patterns' }">← All patterns</RouterLink>
      <RouterLink
        :to="{ name: 'domain', params: { id: found.domain.id } }"
        class="badge"
        :class="`badge--${found.domain.badgeClass}`"
      >
        Domain {{ found.domain.number }} →
      </RouterLink>
    </div>

    <PageHeader
      :eyebrow="found.domain.title"
      :title="found.pattern.title"
      :subtitle="found.pattern.summary"
    />

    <div class="flex flex-wrap items-center gap-2 mb-5">
      <span class="task-pill">Task <strong>{{ found.pattern.taskRef }}</strong></span>
      <span class="badge" :class="patternTypeBadge(found.pattern.type)">{{ found.pattern.type }}</span>
      <span v-for="t in found.pattern.tags" :key="t" class="tag-pill">#{{ t }}</span>
    </div>

    <div class="card mb-5">
      <div class="card__subtitle font-mono mb-3">Source: {{ found.pattern.source }}</div>
      <CodeBlock :code="found.pattern.codeSnippet" :language="found.pattern.language" />
    </div>

    <section v-if="hasFlowInfo" class="flow-strip">
      <div class="flow-strip__label">Flow context</div>
      <h3 class="flow-strip__title">How this pattern connects</h3>

      <div v-if="followsList.length" class="flow-strip__section">
        <div class="flow-strip__section-label">↑ Comes after</div>
        <div class="flow-strip__list">
          <div v-for="(n, i) in followsList" :key="`f-${i}`" class="flow-strip__row">
            <RouterLink :to="{ name: 'pattern', params: { id: n.patternId } }" class="flow-strip__chip">
              {{ n.patternTitle }}
            </RouterLink>
            <span class="flow-strip__arrow">→ in</span>
            <RouterLink :to="{ name: 'flow', params: { flowId: n.flowId } }" class="flow-strip__role">
              {{ n.flowTitle }}
            </RouterLink>
          </div>
        </div>
      </div>

      <div v-if="precedesList.length" class="flow-strip__section">
        <div class="flow-strip__section-label">↓ Followed by</div>
        <div class="flow-strip__list">
          <div v-for="(n, i) in precedesList" :key="`p-${i}`" class="flow-strip__row">
            <RouterLink :to="{ name: 'pattern', params: { id: n.patternId } }" class="flow-strip__chip">
              {{ n.patternTitle }}
            </RouterLink>
            <span class="flow-strip__arrow">→ in</span>
            <RouterLink :to="{ name: 'flow', params: { flowId: n.flowId } }" class="flow-strip__role">
              {{ n.flowTitle }}
            </RouterLink>
          </div>
        </div>
      </div>

      <div v-if="flowMemberships.length" class="flow-strip__section">
        <div class="flow-strip__section-label">Part of</div>
        <div class="flex flex-wrap gap-2">
          <RouterLink
            v-for="m in flowMemberships"
            :key="m.flow.id"
            :to="{ name: 'flow', params: { flowId: m.flow.id } }"
            class="flow-strip__flow-pill"
          >
            {{ m.flow.title }}
            <small>step {{ m.stepIndex + 1 }} / {{ m.flow.steps.length }}</small>
          </RouterLink>
        </div>
      </div>
    </section>

    <section v-if="found.pattern.antiPattern" class="anti-pattern">
      <div class="anti-pattern__header">
        <div class="anti-pattern__eyebrow">Anti-pattern · don't do this</div>
      </div>
      <h3 class="anti-pattern__title">{{ found.pattern.antiPattern.title }}</h3>
      <div class="mt-3">
        <CodeBlock
          :code="found.pattern.antiPattern.badCode"
          :language="found.pattern.antiPattern.language"
        />
      </div>
      <div class="anti-pattern__failure">
        <strong>Failure mode:</strong> {{ found.pattern.antiPattern.failureMode }}
      </div>
    </section>

    <component
      v-if="SandboxComponent"
      :is="SandboxComponent"
    />

    <div v-if="relatedPatterns.length" class="related-chips">
      <div class="related-chips__label">Related patterns</div>
      <div class="related-chips__list">
        <RouterLink
          v-for="r in relatedPatterns"
          :key="r.id"
          :to="{ name: 'pattern', params: { id: r.id } }"
          class="related-chips__chip"
        >
          <span :style="{ opacity: 0.7 }">D{{ r.domain.number }}</span>
          <span>·</span>
          <span>{{ r.title }}</span>
        </RouterLink>
      </div>
    </div>

    <InlineQuizDrill
      v-if="found.pattern.quizQuestionRefs && found.pattern.quizQuestionRefs.length"
      :refs="found.pattern.quizQuestionRefs"
    />

    <div v-if="found.domain.patterns.length > 1" class="card mt-6">
      <h2 class="card__title text-base mb-2">Other patterns in this domain</h2>
      <ul class="space-y-2">
        <li v-for="p in found.domain.patterns.filter((p) => p.id !== found!.pattern.id)" :key="p.id">
          <RouterLink :to="{ name: 'pattern', params: { id: p.id } }" class="text-ink-200 hover:text-domain-ci">
            <span class="task-pill mr-2">Task <strong>{{ p.taskRef }}</strong></span>
            → {{ p.title }}
          </RouterLink>
        </li>
      </ul>
    </div>
  </template>
</template>
