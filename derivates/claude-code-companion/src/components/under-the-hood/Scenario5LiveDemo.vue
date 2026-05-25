<script setup lang="ts">
// Scenario 5 live demo — populated by Scenario 5 v0.4 task 9.
//
// Four cards shown on /under-the-hood when the Scenario 5 entry is expanded:
//   0. "Latest CI review" — fetches `/last-review.json` published from the
//      `.github/workflows/claude-review.yml` workflow. Falls back to a
//      "no artefact found" state if the file isn't there. v0.4 task 8.
//   1. "View the CI prompt" — renders the first ~30 lines of
//      docs/CI_REVIEW_PROMPT.md (imported as a TS module) plus a link to the
//      full annotated /prompt-dissection view.
//   2. "Sample PR review (sample-1-typo)" — renders the hand-mirrored
//      expected.json as a structured review.
//   3. "Sample PR review (sample-2-clean)" — same for the clean fixture.
//
// Static samples live in src/data/_generated/sampleReviews.ts (typed,
// bundle-loaded). The live card fetches at runtime so the demo can show
// whatever the most recent CI workflow ran.

import { computed, onMounted, ref } from 'vue';
import { ciReviewPromptBody, PROMPT_VERSION } from '@/data/_generated/ciReviewPrompt';
import { findSampleReview } from '@/data/_generated/sampleReviews';
import type { ReviewSummary } from '@/agents/schemas/reviewOutput';

interface LiveReviewMeta {
  pr?: number;
  title?: string;
  head?: string;
  ranAt?: string;
  source?: string;
  note?: string;
}

interface LiveReviewArtefact {
  _meta?: LiveReviewMeta;
  summary: ReviewSummary;
}

type LiveState =
  | { status: 'loading' }
  | { status: 'live'; data: LiveReviewArtefact }
  | { status: 'missing' }
  | { status: 'error'; message: string };

const liveState = ref<LiveState>({ status: 'loading' });

onMounted(async () => {
  try {
    const res = await fetch('/last-review.json', { cache: 'no-cache' });
    if (res.status === 404) {
      liveState.value = { status: 'missing' };
      return;
    }
    if (!res.ok) {
      liveState.value = {
        status: 'error',
        message: `HTTP ${res.status} ${res.statusText}`,
      };
      return;
    }
    const data = (await res.json()) as LiveReviewArtefact;
    if (!data || !data.summary || !Array.isArray(data.summary.comments)) {
      liveState.value = {
        status: 'error',
        message: 'last-review.json did not match the expected shape.',
      };
      return;
    }
    liveState.value = { status: 'live', data };
  } catch (err) {
    liveState.value = {
      status: 'error',
      message: err instanceof Error ? err.message : 'fetch failed',
    };
  }
});

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
  live: true,
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

    <!-- Card 0: latest CI review (live fetch). v0.4 task 8. -->
    <article class="rounded-md border border-ink-200 bg-white">
      <button
        type="button"
        class="w-full flex items-center justify-between px-3 py-2 text-left text-sm font-medium hover:bg-ink-50"
        @click="toggle('live')"
      >
        <span>Latest CI review</span>
        <span class="mono text-xs text-ink-500">
          {{ expanded.live ? 'hide' : 'show' }} ·
          <template v-if="liveState.status === 'loading'">loading…</template>
          <template v-else-if="liveState.status === 'live'">
            <span :class="verdictColor(liveState.data.summary.verdict)">
              {{ liveState.data.summary.verdict }}
            </span>
          </template>
          <template v-else-if="liveState.status === 'missing'">no artefact</template>
          <template v-else>error</template>
        </span>
      </button>
      <div v-if="expanded.live" class="px-3 pb-3 border-t border-ink-100">
        <p v-if="liveState.status === 'loading'" class="text-xs text-ink-500 mt-2">
          Fetching <code class="mono">/last-review.json</code>…
        </p>

        <p
          v-else-if="liveState.status === 'missing'"
          class="text-xs italic text-ink-500 mt-2"
        >
          No <code class="mono">last-review.json</code> found at the site root.
          In production CI, the workflow at
          <code class="mono">.github/workflows/claude-review.yml</code>
          publishes one. The static samples below show the canonical reviews
          the false-positive corpus expects.
        </p>

        <p
          v-else-if="liveState.status === 'error'"
          class="text-xs italic text-rose-700 mt-2"
        >
          Couldn't read the artefact: {{ liveState.message }}. Falling back to
          the static samples below.
        </p>

        <template v-else>
          <p
            v-if="liveState.data._meta"
            class="text-xs text-ink-600 mt-2 space-x-2"
          >
            <span v-if="liveState.data._meta.pr" class="mono">
              PR #{{ liveState.data._meta.pr }}
            </span>
            <span v-if="liveState.data._meta.title">
              — {{ liveState.data._meta.title }}
            </span>
            <span
              v-if="liveState.data._meta.head"
              class="mono text-ink-500"
            >
              ({{ liveState.data._meta.head.slice(0, 7) }})
            </span>
            <span
              v-if="liveState.data._meta.ranAt"
              class="text-ink-500"
            >
              · ran {{ liveState.data._meta.ranAt }}
            </span>
          </p>

          <p
            v-if="liveState.data._meta?.source === 'bundled-fixture'"
            class="mt-2 text-xs italic text-amber-700"
          >
            This is the bundled dev fixture, not a live CI artefact. The
            workflow at <code class="mono">.github/workflows/claude-review.yml</code>
            replaces it on every successful PR review.
          </p>

          <dl class="mt-3 text-xs text-ink-700 space-y-1">
            <div class="flex gap-2">
              <dt class="text-ink-500 w-24 shrink-0">verdict</dt>
              <dd
                class="mono"
                :class="verdictColor(liveState.data.summary.verdict)"
              >{{ liveState.data.summary.verdict }}</dd>
            </div>
            <div class="flex gap-2">
              <dt class="text-ink-500 w-24 shrink-0">confidence</dt>
              <dd class="mono">{{ liveState.data.summary.confidence }}</dd>
            </div>
            <div class="flex gap-2">
              <dt class="text-ink-500 w-24 shrink-0">promptVersion</dt>
              <dd class="mono">{{ liveState.data.summary.promptVersion }}</dd>
            </div>
          </dl>

          <p
            v-if="liveState.data.summary.comments.length === 0"
            class="text-xs italic text-ink-500 mt-3"
          >No comments — clean review.</p>
          <ul v-else class="mt-3 space-y-2">
            <li
              v-for="(c, i) in liveState.data.summary.comments"
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
        </template>
      </div>
    </article>

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
