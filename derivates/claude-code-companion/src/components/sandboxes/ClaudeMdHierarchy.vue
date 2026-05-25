<script setup lang="ts">
import { computed, ref } from 'vue';
import type { HierarchyFile, HierarchySandbox } from '@/data/types';

const props = defineProps<{ sandbox: HierarchySandbox }>();

const onState = ref<Record<string, boolean>>(
  Object.fromEntries(props.sandbox.files.map((f) => [f.path, f.defaultOn])),
);

function toggle(path: string) {
  onState.value[path] = !onState.value[path];
}

const activeFiles = computed<HierarchyFile[]>(() =>
  props.sandbox.files.filter((f) => onState.value[f.path]),
);

function levelBadge(level: HierarchyFile['level']) {
  if (level === 'user') return { label: 'user', cls: 'bg-violet-100 text-violet-800 border-violet-300' };
  if (level === 'root') return { label: 'root', cls: 'bg-sky-100 text-sky-800 border-sky-300' };
  return { label: 'subdir', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
}
</script>

<template>
  <div class="space-y-4">
    <section class="rounded-lg border border-ink-200 bg-ink-50 p-3 text-sm text-ink-800">
      <span class="text-xs uppercase tracking-wide text-ink-500">Prompt:</span>
      <p class="mt-1">{{ sandbox.prompt }}</p>
    </section>

    <div class="grid grid-cols-2 gap-4">
      <section class="rounded-lg border border-ink-200 bg-white p-4">
        <header class="mb-3">
          <div class="text-xs uppercase tracking-wide text-ink-500">Files in play</div>
          <p class="mt-1 text-xs text-ink-600">
            Toggle each file. Broader files load first; closer files extend them.
          </p>
        </header>

        <ul class="space-y-2">
          <li
            v-for="f in sandbox.files"
            :key="f.path"
            class="rounded-md border border-ink-200 p-2"
          >
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                :checked="onState[f.path]"
                @change="toggle(f.path)"
                class="accent-ink-900"
              />
              <span
                :class="['rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide', levelBadge(f.level).cls]"
              >
                {{ levelBadge(f.level).label }}
              </span>
              <code class="font-mono text-xs text-ink-700">{{ f.path }}</code>
            </label>
          </li>
        </ul>
      </section>

      <section class="rounded-lg border border-ink-200 bg-white p-4">
        <header class="mb-3">
          <div class="text-xs uppercase tracking-wide text-ink-500">
            Effective config Claude sees
          </div>
          <p class="mt-1 text-xs text-ink-600">
            Concatenation of every active file, in load order. The merge is
            cumulative — Claude reads all of them.
          </p>
        </header>

        <div v-if="activeFiles.length === 0" class="text-xs italic text-ink-400">
          No CLAUDE.md files active. Claude would read nothing project-specific
          for this turn.
        </div>

        <div v-else class="space-y-3">
          <article
            v-for="f in activeFiles"
            :key="f.path"
            class="rounded border border-ink-100 bg-canvas p-3"
          >
            <header class="mb-2 flex items-center gap-2">
              <span
                :class="['rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide', levelBadge(f.level).cls]"
              >
                {{ levelBadge(f.level).label }}
              </span>
              <code class="font-mono text-xs text-ink-700">{{ f.path }}</code>
            </header>
            <pre class="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-ink-800">{{ f.body }}</pre>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>
