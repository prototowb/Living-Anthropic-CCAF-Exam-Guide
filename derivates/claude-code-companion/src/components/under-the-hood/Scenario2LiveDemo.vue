<script setup lang="ts">
// Scenario 2 live "demo" — the `.claude/**` inspector (v0.4 task 10).
//
// Scenario 2's artefacts aren't model invocations — they're .md/.json files
// that Claude Code itself consumes when working on this repo. The "live demo"
// here is therefore a structured listing of every `.claude/**` file: kind
// chip, repo-relative path, one-line purpose, and an expandable body preview.
//
// Why not `import.meta.glob`: Vite's glob only walks paths under /src/**.
// `.claude/` lives at the repo root, outside the glob's reach. The manifest
// at `src/data/claudeManifest.ts` is hand-authored — one entry per file. If
// you add a `.claude/**` file, append an entry there.

import { computed, ref } from 'vue';
import {
  claudeManifest,
  type ClaudeManifestEntry,
  type ClaudeManifestKind,
} from '@/data/claudeManifest';

type SortKey = 'kind' | 'path';
const sortKey = ref<SortKey>('kind');

// Stable rank for the kind sort so groups appear in a curated order, not
// alphabetical (which would put `command` before `settings` for no reason).
const KIND_ORDER: Record<ClaudeManifestKind, number> = {
  settings: 0,
  hook: 1,
  'output-style': 2,
  command: 3,
  skill: 4,
  rule: 5,
};

const sorted = computed<ClaudeManifestEntry[]>(() => {
  const copy = [...claudeManifest];
  if (sortKey.value === 'kind') {
    copy.sort((a, b) => {
      const k = KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
      return k !== 0 ? k : a.path.localeCompare(b.path);
    });
  } else {
    copy.sort((a, b) => a.path.localeCompare(b.path));
  }
  return copy;
});

const expanded = ref<Set<string>>(new Set());
function toggle(path: string) {
  const next = new Set(expanded.value);
  if (next.has(path)) next.delete(path);
  else next.add(path);
  expanded.value = next;
}

// Chip palette — leans on the existing `stage-*` colours so the inspector
// reads as part of the under-the-hood vocabulary, not a one-off theme.
const KIND_CHIP_CLASSES: Record<ClaudeManifestKind, string> = {
  settings: 'bg-stage-s1/10 text-stage-s1 border-stage-s1/40',
  hook: 'bg-stage-s5/10 text-stage-s5 border-stage-s5/40',
  'output-style': 'bg-stage-s7/10 text-stage-s7 border-stage-s7/40',
  command: 'bg-stage-s2/10 text-stage-s2 border-stage-s2/40',
  skill: 'bg-stage-s4/10 text-stage-s4 border-stage-s4/40',
  rule: 'bg-stage-s6/10 text-stage-s6 border-stage-s6/40',
};

// Per-kind counts for the header. Useful for spotting "we have six commands
// but zero output-styles" gaps at a glance.
const counts = computed(() => {
  const map: Partial<Record<ClaudeManifestKind, number>> = {};
  for (const entry of claudeManifest) {
    map[entry.kind] = (map[entry.kind] ?? 0) + 1;
  }
  return map as Record<ClaudeManifestKind, number>;
});

const kindOrder = computed(() =>
  (Object.keys(KIND_ORDER) as ClaudeManifestKind[]).sort(
    (a, b) => KIND_ORDER[a] - KIND_ORDER[b],
  ),
);
</script>

<template>
  <div class="border border-ink-200 rounded bg-ink-50/40">
    <header class="flex items-baseline justify-between gap-3 px-3 py-2 border-b border-ink-200">
      <div class="text-sm font-medium text-ink-800">
        .claude/ inspector
        <span class="ml-1 text-xs text-ink-500 font-normal">
          {{ claudeManifest.length }} files
        </span>
      </div>
      <div class="flex items-center gap-2 text-xs">
        <label class="text-ink-500">sort:</label>
        <button
          type="button"
          class="px-2 py-0.5 border border-ink-300 rounded mono"
          :class="sortKey === 'kind' ? 'bg-ink-100 text-ink-900' : 'text-ink-600'"
          @click="sortKey = 'kind'"
        >
          kind
        </button>
        <button
          type="button"
          class="px-2 py-0.5 border border-ink-300 rounded mono"
          :class="sortKey === 'path' ? 'bg-ink-100 text-ink-900' : 'text-ink-600'"
          @click="sortKey = 'path'"
        >
          path
        </button>
      </div>
    </header>

    <div class="px-3 py-2 border-b border-ink-200 flex flex-wrap gap-2 text-[0.7rem]">
      <span
        v-for="k in kindOrder"
        :key="k"
        class="inline-flex items-center gap-1 px-1.5 py-0.5 border rounded mono"
        :class="KIND_CHIP_CLASSES[k]"
      >
        {{ k }}
        <span class="opacity-60">×{{ counts[k] ?? 0 }}</span>
      </span>
    </div>

    <ul class="divide-y divide-ink-200 max-h-[28rem] overflow-y-auto">
      <li
        v-for="entry in sorted"
        :key="entry.path"
        class="px-3 py-2"
      >
        <div class="flex items-start gap-2">
          <span
            class="inline-flex items-center px-1.5 py-0.5 border rounded mono text-[0.7rem] shrink-0"
            :class="KIND_CHIP_CLASSES[entry.kind]"
          >
            {{ entry.kind }}
          </span>
          <div class="min-w-0 flex-1">
            <div class="mono text-xs text-ink-800 break-all">
              {{ entry.path }}
            </div>
            <div class="text-xs text-ink-600 mt-0.5">
              {{ entry.purpose }}
            </div>
          </div>
          <button
            v-if="entry.bodyPreview"
            type="button"
            class="text-[0.7rem] mono px-1.5 py-0.5 border border-ink-300 rounded text-ink-600 hover:bg-ink-100 shrink-0"
            @click="toggle(entry.path)"
          >
            {{ expanded.has(entry.path) ? 'hide' : 'preview' }}
          </button>
        </div>
        <pre
          v-if="entry.bodyPreview && expanded.has(entry.path)"
          class="mt-2 bg-ink-900 text-ink-100 rounded p-2 overflow-x-auto text-[0.75rem] leading-snug mono"
        ><code>{{ entry.bodyPreview }}</code></pre>
      </li>
    </ul>

    <footer class="px-3 py-2 border-t border-ink-200 text-[0.7rem] text-ink-500 leading-snug">
      Manifest is hand-authored at <span class="mono">src/data/claudeManifest.ts</span>.
      The <span class="mono">.claude/</span> directory lives outside Vite's
      <span class="mono">import.meta.glob</span> reach, so additions there require
      a one-line manifest entry. The CLAUDE.md hygiene check
      (<span class="mono">npm run check:claude-md</span>) audits drift across
      the four CLAUDE.md files but does not touch this inspector.
    </footer>
  </div>
</template>
