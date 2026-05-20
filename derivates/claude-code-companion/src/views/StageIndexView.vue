<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { stages } from '@/data/stages';
import { useProgressStore } from '@/stores/progress';

const progress = useProgressStore();
</script>

<template>
  <section class="space-y-4">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight">Stages</h1>
      <p class="text-ink-600 mt-1">
        Eight stages from first prompt to running Claude Code in CI. v0.1 ships S1 + S2 fully authored.
      </p>
    </header>

    <ol class="grid grid-cols-2 gap-3">
      <li
        v-for="s in stages"
        :key="s.id"
        :class="{
          'opacity-60': s.lessonIds.length === 0,
        }"
      >
        <RouterLink
          :to="`/learn/${s.id}`"
          class="block p-4 rounded-lg border border-ink-200 bg-white hover:border-ink-400 transition"
        >
          <div class="flex items-baseline gap-2">
            <span class="mono text-xs text-ink-500">S{{ s.number }}</span>
            <span class="font-medium">{{ s.title }}</span>
            <span
              v-for="r in s.rungs"
              :key="r"
              class="ml-auto text-xs px-1.5 py-0.5 rounded mono"
              :class="{
                'bg-rung-B/10 text-rung-B': r === 'B',
                'bg-rung-I/10 text-rung-I': r === 'I',
                'bg-rung-A/10 text-rung-A': r === 'A',
              }"
              >{{ r }}</span
            >
          </div>
          <p class="text-sm text-ink-600 mt-2">{{ s.pitch }}</p>
          <p class="text-xs text-ink-500 mt-2 italic">{{ s.anchorQuestion }}</p>
          <div class="mt-3 text-xs text-ink-400 flex gap-3">
            <span>{{ s.lessonIds.length }} lessons</span>
            <span v-if="s.sandboxId">1 sandbox</span>
            <span v-if="progress.stages[s.id]?.completed" class="text-stage-s4">completed ✓</span>
            <span v-else-if="progress.stages[s.id]?.visited">in progress…</span>
          </div>
        </RouterLink>
      </li>
    </ol>
  </section>
</template>
