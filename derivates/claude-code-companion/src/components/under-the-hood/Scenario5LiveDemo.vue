<script setup lang="ts">
// Scenario 5 live demo — populated by Scenario 5 v0.4 task 9.
//
// Three cards shown on /under-the-hood when the Scenario 5 entry is expanded:
//   1. "View the CI prompt" — renders the first ~30 lines of
//      docs/CI_REVIEW_PROMPT.md (imported as a TS module) plus a link to the
//      full annotated /prompt-dissection view.
//   2. "Sample PR review (sample-1-typo)" — renders the hand-mirrored
//      expected.json as a structured review.
//   3. "Sample PR review (sample-2-clean)" — same for the clean fixture.
//
// All data is embedded as TS modules under src/data/_generated/ so the demo
// runs without a fetch and the build typechecks the shapes.

import { computed, ref } from 'vue';
import { ciReviewPromptBody, PROMPT_VERSION } from '@/data/_generated/ciReviewPrompt';
import { findSampleReview } from '@/data/_generated/sampleReviews';

const PREVIEW_LINES = 30;

const previewBody = computed(() => {
  const lines = ciReviewPromptBody.split('\n').slice(0, PREVIEW_LINES);
  return lines.join('\n');
});

const sample1 = findSampleReview('sample-1-typo');
const sample2 = findSampleReview('sample-2-clean');

// Each card collapses by default. The Scenario 5 entry on /under-the-hood is
// already inside a card; nested expand/collapse keeps the page scannable.
const expanded = ref<Record<string, boolean>>({
  prompt: false,
  'sample-1-typo': false,
  'sample-2-clean': false,
});

function toggle(key: string) {
  expanded.value[key] = !expanded.value[key];
}

function verdictColor(verdict: string): string {
  switch (verdict) {
    case 'request_changes':
      return 'text-stage-s5';
    case 'approve':
      return 'text-emerald-700';
    case 'comment_only':
      return 'text-amber-700';
    default:
      return 'text-ink-700';
  }
}

function severityBadge(sev: string): string {
  switch (sev) {
    case 'blocker':
      return 'bg-rose-100 text-rose-800';
    case 'suggestion':
      return 'bg-amber-100 text-amber-800';
    case 'nit':
      return 'bg-ink-100 text-ink-700';
    default:
      return 'bg-ink-100 text-ink-700';
  }
}
</script>

<template>
  <div class="space-y-3">
    <p class="text-xs text-ink-500">
      Scenario 5 in motion: the CI review prompt and the canonical reviews two
      of the false-positive-corpus fixtures expect Claude to emit.
    </p>

    <!-- Card 1: prompt preview + link to dissection view. -->
    <article class="rounded-md border border-ink-200 bg-white">
      <button
        type="button"
        class="w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium hover:bg-ink-50"
        @click="toggle('prompt')"
      >
        <span>View the CI prompt</span>
        <span class="mono text-xs text-ink-500">
          {{ expanded.prompt ? 'hide' : 'show' }} · {{ PROMPT_VERSION }}
        </span>
      </button>
      <div v-if="expanded.prompt" class="px-3 pb-3 border-t border-ink-100">
        <pre class="mono text-xs bg-ink-50 text-ink-800 rounded p-3 overflow-auto max-h-72 mt-2">{{ previewBody }}</pre>
        <p class="text-xs text-ink-500 mt-2">
          First {{ PREVIEW_LINES }} lines. For the full clause-by-clause
          dissection, open
          <router-link
            to="/prompt-dissection"
            class="underline text-stage-s5 hover:opacity-80"
          >/prompt-dissection</router-link>.
        </p>
      </div>
    </article>

    <!-- Card 2: sample-1-typo. -->
    <article
      v-if="sample1"
      class="rounded-md border border-ink-200 bg-white"
    >
      <button
        type="button"
        class="w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium hover:bg-ink-50"
        @click="toggle(sample1.id)"
      >
        <span>Sample PR review — {{ sample1.label }}</span>
        <span
          class="mono text-xs"
          :class="verdictColor(sample1.summary.verdict)"
        >
          {{ expanded[sample1.id] ? 'hide' : 'show' }} ·
          {{ sample1.summary.verdict }}
        </span>
      </button>
      <div v-if="expanded[sample1.id]" class="px-3 pb-3 border-t border-ink-100">
        <p class="text-xs text-ink-600 mt-2">{{ sample1.description }}</p>
        <dl class="mt-2 text-xs text-ink-700 space-y-1">
          <div class="flex gap-2">
            <dt class="text-ink-500 w-24 shrink-0">verdict</dt>
            <dd
              class="mono"
              :class="verdictColor(sample1.summary.verdict)"
            >{{ sample1.summary.verdict }}</dd>
          </div>
          <div class="flex gap-2">
            <dt class="text-ink-500 w-24 shrink-0">confidence</dt>
            <dd class="mono">{{ sample1.summary.confidence }}</dd>
          </div>
          <div class="flex gap-2">
            <dt class="text-ink-500 w-24 shrink-0">promptVersion</dt>
            <dd class="mono">{{ sample1.summary.promptVersion }}</dd>
          </div>
        </dl>
        <p
          v-if="sample1.summary.comments.length === 0"
          class="text-xs italic text-ink-500 mt-3"
        >No comments — clean review.</p>
        <ul v-else class="mt-3 space-y-2">
          <li
            v-for="(c, i) in sample1.summary.comments"
            :key="i"
            class="rounded border border-ink-100 p-2 text-xs"
          >
            <div class="flex items-baseline gap-2">
              <span
                class="px-1.5 py-0.5 rounded mono text-[0.7rem] uppercase"
                :class="severityBadge(c.severity)"
              >{{ c.severity }}</span>
              <code class="mono text-ink-800">{{ c.path }}:{{ c.line }}</code>
              <span class="text-ink-500 mono">conf {{ c.confidence }}</span>
            </div>
            <p class="text-ink-700 mt-1">{{ c.rationale }}</p>
          </li>
        </ul>
      </div>
    </article>

    <!-- Card 3: sample-2-clean. -->
    <article
      v-if="sample2"
      class="rounded-md border border-ink-200 bg-white"
    >
      <button
        type="button"
        class="w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium hover:bg-ink-50"
        @click="toggle(sample2.id)"
      >
        <span>Sample PR review — {{ sample2.label }}</span>
        <span
          class="mono text-xs"
          :class="verdictColor(sample2.summary.verdict)"
        >
          {{ expanded[sample2.id] ? 'hide' : 'show' }} ·
          {{ sample2.summary.verdict }}
        </span>
      </button>
      <div v-if="expanded[sample2.id]" class="px-3 pb-3 border-t border-ink-100">
        <p class="text-xs text-ink-600 mt-2">{{ sample2.description }}</p>
        <dl class="mt-2 text-xs text-ink-700 space-y-1">
          <div class="flex gap-2">
            <dt class="text-ink-500 w-24 shrink-0">verdict</dt>
            <dd
              class="mono"
              :class="verdictColor(sample2.summary.verdict)"
            >{{ sample2.summary.verdict }}</dd>
          </div>
          <div class="flex gap-2">
            <dt class="text-ink-500 w-24 shrink-0">confidence</dt>
            <dd class="mono">{{ sample2.summary.confidence }}</dd>
          </div>
          <div class="flex gap-2">
            <dt class="text-ink-500 w-24 shrink-0">promptVersion</dt>
            <dd class="mono">{{ sample2.summary.promptVersion }}</dd>
          </div>
        </dl>
        <p
          v-if="sample2.summary.comments.length === 0"
          class="text-xs italic text-ink-500 mt-3"
        >No comments — clean review.</p>
        <ul v-else class="mt-3 space-y-2">
          <li
            v-for="(c, i) in sample2.summary.comments"
            :key="i"
            class="rounded border border-ink-100 p-2 text-xs"
          >
            <div class="flex items-baseline gap-2">
              <span
                class="px-1.5 py-0.5 rounded mono text-[0.7rem] uppercase"
                :class="severityBadge(c.severity)"
              >{{ c.severity }}</span>
              <code class="mono text-ink-800">{{ c.path }}:{{ c.line }}</code>
              <span class="text-ink-500 mono">conf {{ c.confidence }}</span>
            </div>
            <p class="text-ink-700 mt-1">{{ c.rationale }}</p>
          </li>
        </ul>
      </div>
    </article>
  </div>
</template>
