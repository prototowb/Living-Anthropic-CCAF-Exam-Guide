<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useWeakSpotsStore } from '@/stores/weakSpots';

const weakSpots = useWeakSpotsStore();

onMounted(() => weakSpots.refresh());

function relativeTime(epochMs: number): string {
  const diff = Date.now() - epochMs;
  if (diff < 0) return 'just now';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Quiz qids are stored as `<section>:<qid>` (see QuizQuestionView). Split for
 *  routing back to the question. Returns null if the qid doesn't match the
 *  expected shape — weak spots can be recorded without a qid. */
function quizRoute(qid: string | undefined): string | null {
  if (!qid) return null;
  const parts = qid.split(':');
  if (parts.length === 2 && /^\d+$/.test(parts[1])) {
    return `/quiz/${parts[0]}/${parts[1]}`;
  }
  return null;
}
</script>

<template>
  <section class="space-y-4 max-w-3xl">
    <header>
      <h1 class="text-3xl font-semibold tracking-tight">Weak spots</h1>
      <p class="text-ink-600 mt-2 max-w-2xl">
        Topics you've struggled with. Recorded by the Help Bot when you ask for
        more practice or get a question wrong. The Tutor's quizmaster reads
        from this list to surface drills.
      </p>
    </header>

    <div
      v-if="weakSpots.entries.length === 0"
      class="rounded-lg border border-dashed border-ink-200 bg-ink-50 p-6 text-center text-sm text-ink-500"
    >
      <p>No weak spots recorded yet.</p>
      <p class="mt-2 text-xs">
        Ask the Help Bot to record a topic, get a quiz answer wrong, or
        request more practice on something — entries appear here.
      </p>
    </div>

    <template v-else>
      <div class="flex items-baseline gap-3 text-sm text-ink-600">
        <span>
          <strong class="text-ink-900">{{ weakSpots.entries.length }}</strong>
          {{ weakSpots.entries.length === 1 ? 'topic' : 'topics' }}
        </span>
        <span>·</span>
        <span>
          <strong class="text-ink-900">{{ weakSpots.totalMisses }}</strong>
          total misses
        </span>
        <button
          @click="weakSpots.clear()"
          class="ml-auto text-xs text-rose-700 hover:text-rose-900 underline"
        >
          Clear all
        </button>
      </div>

      <ul class="space-y-2">
        <li
          v-for="(w, i) in weakSpots.byCount"
          :key="`${w.topic}::${w.qid ?? '-'}::${i}`"
          class="rounded-md border border-ink-200 bg-white p-3 flex items-baseline gap-3"
        >
          <span
            class="inline-flex items-center justify-center min-w-[2.25rem] h-7 px-2 rounded-full bg-stage-s5/10 text-stage-s5 font-mono text-sm font-semibold"
          >
            ×{{ w.count }}
          </span>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-ink-900">{{ w.topic }}</p>
            <p v-if="w.qid" class="text-xs text-ink-500 mt-0.5 font-mono">
              {{ w.qid }}
            </p>
          </div>
          <span class="text-xs text-ink-500 whitespace-nowrap">{{ relativeTime(w.at) }}</span>
          <RouterLink
            v-if="quizRoute(w.qid)"
            :to="quizRoute(w.qid)!"
            class="text-xs px-2 py-1 rounded border border-ink-200 bg-canvas text-ink-700 hover:border-ink-400 transition whitespace-nowrap"
          >
            Re-try →
          </RouterLink>
        </li>
      </ul>
    </template>
  </section>
</template>
