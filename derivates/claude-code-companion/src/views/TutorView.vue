<script setup lang="ts">
import { ref, nextTick, watch, computed, onMounted } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { useTutorStore } from '@/stores/tutor';
import CapabilitiesBadge from '@/components/CapabilitiesBadge.vue';
// Scenario 4 v0.4 task 11 — code-to-lesson cross-link. `codeToLesson.ts` lives
// in `src/data/_generated/` (data layer), so the views→data import is allowed
// under `src/views/CLAUDE.md` rule 2 ("no agent imports"). The view stays
// pure data + store consumer.
import { findRelatedLessons } from '@/data/_generated/codeToLesson';

const tutor = useTutorStore();
const input = ref('');
const scrollEl = ref<HTMLElement | null>(null);
const route = useRoute();
const router = useRouter();

/** Scenario 1 v0.4 task 11 — Help Bot → Tutor handoff. When the helpBot
 *  escalates with `low_confidence`, it pushes `/tutor?prompt=<encoded>`.
 *  Pre-fill the input so the learner can review and approve. Do NOT
 *  auto-submit — the learner stays in control. The query param is cleared
 *  after consumption so a manual reload doesn't re-trigger. */
onMounted(() => {
  const raw = route.query.prompt;
  if (typeof raw === 'string' && raw.length > 0) {
    try {
      input.value = decodeURIComponent(raw);
    } catch {
      // Malformed encoding — fall back to the raw value rather than crashing.
      input.value = raw;
    }
    // Strip the query param so subsequent reloads don't re-populate the box.
    void router.replace({ name: 'tutor', query: {} });
  }
});

/** Per-message id → open citation key, so each turn's drawer is independent. */
const openCite = ref<Record<number, string | null>>({});

/** v0.2 task 4 — collapsible scratchpad / "memory" panel. Defaults collapsed
 *  so it doesn't crowd the chat surface. The panel reads through the store's
 *  `getTutorScratchpad()` accessor to keep the views→agents wall intact. */
const scratchpadOpen = ref(false);
const scratchpadText = computed(() => tutor.getTutorScratchpad(8));

async function submit() {
  if (!input.value.trim()) return;
  const q = input.value;
  input.value = '';
  await tutor.send(q);
  await nextTick();
  scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight });
}

watch(
  () => tutor.messages.length,
  async () => {
    await nextTick();
    scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight });
  },
);

interface Citation {
  path: string;
  line: number;
  preview: string;
}

/** Pull all citation tool-calls out of a tutor turn. Citations are emitted by
 *  the codebase-researcher subagent with `name: 'cite'` (Scenario 4 v0.2).
 *  Inputs are untyped here — the runtime narrowing keeps `src/views/` honest
 *  vs its CLAUDE.md "no agent imports" rule. */
function citationsFromMeta(
  meta:
    | { subagents?: Array<{ toolCalls: Array<{ name: string; input: unknown }> }> }
    | undefined,
): Citation[] {
  if (!meta?.subagents) return [];
  const out: Citation[] = [];
  for (const sub of meta.subagents) {
    for (const tc of sub.toolCalls) {
      if (tc.name !== 'cite') continue;
      const i = tc.input;
      if (
        i &&
        typeof i === 'object' &&
        'path' in i &&
        typeof (i as Record<string, unknown>).path === 'string' &&
        'line' in i &&
        typeof (i as Record<string, unknown>).line === 'number' &&
        'preview' in i &&
        typeof (i as Record<string, unknown>).preview === 'string'
      ) {
        const rec = i as Record<string, unknown>;
        out.push({
          path: rec.path as string,
          line: rec.line as number,
          preview: rec.preview as string,
        });
      }
    }
  }
  return out;
}

function citeKey(c: Citation) {
  return `${c.path}:${c.line}`;
}

function toggleCite(messageId: number, key: string) {
  const current = openCite.value[messageId];
  openCite.value = {
    ...openCite.value,
    [messageId]: current === key ? null : key,
  };
}

/**
 * v0.4 task 10 — reverse-link chips. Scan a tutor reply for path-like strings
 * that map to in-app routes:
 *   - `/learn/<stageId>`     (e.g. /learn/s2)
 *   - `/lessons/<lessonId>`  (e.g. /lessons/l-s1-mcq-exit)
 *   - `/sandboxes/<sandboxId>` (e.g. /sandboxes/first-session-repl)
 *
 * Returns deduplicated paths in first-seen order. The TutorView renders each
 * as a `<RouterLink>` chip below the existing citation chips. The regex is
 * deliberately permissive on the id segment (kebab-case, alphanumerics) but
 * anchors the route segment to one of the three known prefixes — anything
 * else (e.g. `/quiz/...`) is intentionally ignored at this layer.
 */
function extractReverseLinks(text: string): string[] {
  const re = /\/(learn|lessons|sandboxes)\/[a-z0-9][a-z0-9-]*/gi;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const match of text.matchAll(re)) {
    const path = match[0];
    if (!seen.has(path)) {
      seen.add(path);
      out.push(path);
    }
  }
  return out;
}
</script>

<template>
  <section class="space-y-3 max-w-3xl">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight">Claude Tutor</h1>
      <p class="text-ink-600 mt-1">
        Hub-and-spoke chat. Ask <em>"explain plan mode"</em>,
        <em>"quiz me on permissions"</em>, or
        <em>"where is the help bot implemented?"</em>. Mock SDK is the default.
      </p>
    </header>

    <!-- v0.2 task 4 — collapsible scratchpad / "memory" panel. -->
    <details
      class="rounded-lg border border-ink-200 bg-white"
      :open="scratchpadOpen"
      @toggle="scratchpadOpen = ($event.target as HTMLDetailsElement).open"
    >
      <summary class="px-4 py-2 cursor-pointer text-sm text-ink-700 select-none hover:text-ink-900">
        <span class="font-medium">Tutor memory</span>
        <span class="text-ink-500 ml-2">— recent findings carried across turns</span>
      </summary>
      <div class="px-4 pb-3 pt-1">
        <pre v-if="scratchpadText" class="mono text-xs text-ink-700 whitespace-pre-wrap">{{ scratchpadText }}</pre>
        <p v-else class="text-xs text-ink-500 italic">No findings yet — ask the tutor something.</p>
      </div>
    </details>

    <div
      ref="scrollEl"
      class="border border-ink-200 bg-white rounded-lg p-4 h-[28rem] overflow-auto space-y-3"
    >
      <p v-if="tutor.messages.length === 0" class="text-ink-500 text-sm italic">
        Try: "explain plan mode" · "what is CLAUDE.md?" · "quiz me on permissions" ·
        "where is the help bot escalation defined?"
      </p>

      <div v-for="m in tutor.messages" :key="m.id" class="space-y-1">
        <div class="text-xs uppercase tracking-wide text-ink-400">
          {{ m.role === 'user' ? 'you' : 'tutor' }}
        </div>
        <div
          class="rounded p-3 whitespace-pre-wrap text-sm"
          :class="
            m.role === 'user'
              ? 'bg-ink-100 text-ink-900'
              : 'bg-stage-s3/5 border border-stage-s3/20'
          "
        >
          {{ m.text }}
        </div>

        <!-- Citation chips (Scenario 4 v0.2). Each chip toggles a snippet drawer.
             v0.4 task 11 — when `findRelatedLessons(c.path)` returns a non-empty
             list, an extra "📚 study this" RouterLink chip appears next to the
             citation, jumping to the first matched lesson. -->
        <template v-if="m.role === 'assistant' && m.meta">
          <div v-if="citationsFromMeta(m.meta).length" class="flex flex-wrap gap-1.5">
            <template v-for="c in citationsFromMeta(m.meta)" :key="citeKey(c)">
              <button
                @click="toggleCite(m.id, citeKey(c))"
                class="text-xs mono px-2 py-1 rounded border transition"
                :class="
                  openCite[m.id] === citeKey(c)
                    ? 'border-stage-s4 bg-stage-s4/10 text-stage-s4'
                    : 'border-ink-300 bg-white text-ink-700 hover:border-ink-900'
                "
              >
                {{ c.path }}:{{ c.line }}
              </button>
              <RouterLink
                v-if="findRelatedLessons(c.path).length"
                :to="`/lessons/${findRelatedLessons(c.path)[0]}`"
                class="text-xs px-2 py-1 rounded border border-stage-s2/40 bg-stage-s2/5 text-stage-s2 hover:border-stage-s2 hover:bg-stage-s2/10 transition"
                :title="`Linked lesson: ${findRelatedLessons(c.path)[0]}`"
              >
                📚 study this
              </RouterLink>
            </template>
          </div>
          <div
            v-for="c in citationsFromMeta(m.meta).filter((c) => citeKey(c) === openCite[m.id])"
            :key="`drawer-${citeKey(c)}`"
            class="rounded border border-stage-s4/30 bg-ink-900 text-ink-100 mono text-xs p-3 whitespace-pre overflow-auto"
          >{{ c.preview }}</div>

          <!-- v0.4 task 10 — reverse-link chips. Path-like strings mentioned in
               the reply body get a clickable RouterLink chip below the citation
               chips. Helps the learner jump from a tutor recommendation
               straight into the relevant stage / lesson / sandbox. -->
          <div v-if="extractReverseLinks(m.text).length" class="flex flex-wrap gap-1.5">
            <RouterLink
              v-for="path in extractReverseLinks(m.text)"
              :key="`rev-${path}`"
              :to="path"
              class="text-xs mono px-2 py-1 rounded border border-stage-s3/40 bg-stage-s3/5 text-stage-s3 hover:border-stage-s3 hover:bg-stage-s3/10 transition"
            >
              {{ path }}
            </RouterLink>
          </div>
        </template>

        <div
          v-if="m.role === 'assistant' && m.meta"
          class="text-xs text-ink-500 mono flex gap-2 flex-wrap items-center"
        >
          <span>{{ m.meta.totalMs }}ms</span>
          <span>{{ m.meta.parallel ? 'parallel' : 'serial' }}</span>
          <span>subagents: {{ m.meta.subagents.map((s) => s.name).join(', ') }}</span>
          <span>adapter: {{ m.meta.adapterKind }}</span>
          <!-- v0.3 task 6 — capabilities badge. Renders only when at least one
               capability is false on the adapter that handled THIS turn. -->
          <CapabilitiesBadge
            :native-tool-use="m.meta.capabilities?.nativeToolUse ?? true"
            :parallel-subagents="m.meta.capabilities?.parallelSubagents ?? true"
            :schema-mode="m.meta.capabilities?.schemaMode ?? true"
            :adapter-label="m.meta.adapterLabel ?? ''"
          />
          <span
            v-if="m.meta.errors && m.meta.errors.length"
            class="text-stage-s5"
            :title="m.meta.errors.map((e) => `${e.name}: ${e.message}`).join('\n')"
          >
            ⚠ {{ m.meta.errors.length }} spoke error{{ m.meta.errors.length > 1 ? 's' : '' }}
          </span>
        </div>
      </div>

      <div v-if="tutor.pending" class="text-sm text-ink-500 italic">tutor thinking…</div>
    </div>

    <form class="flex gap-2" @submit.prevent="submit">
      <input
        v-model="input"
        type="text"
        placeholder="Ask the tutor…"
        class="flex-1 px-3 py-2 border border-ink-300 rounded text-sm"
        :disabled="tutor.pending"
      />
      <button
        type="submit"
        class="px-4 py-2 bg-ink-900 text-white rounded text-sm disabled:opacity-50"
        :disabled="tutor.pending"
      >
        Ask
      </button>
      <button
        type="button"
        class="px-3 py-2 text-sm rounded border border-ink-300 hover:border-ink-900"
        @click="tutor.reset()"
      >
        Reset
      </button>
    </form>
  </section>
</template>
