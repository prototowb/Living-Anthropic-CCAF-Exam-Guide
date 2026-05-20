<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { sandboxes } from '@/data/sandboxes';
</script>

<template>
  <section class="space-y-4">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight">Sandboxes</h1>
      <p class="text-ink-600 mt-1">
        Interactive demos that let you poke at Claude Code concepts without a terminal.
        v0.1 ships one — the rest arrive in v0.2-v0.4.
      </p>
    </header>

    <ul class="grid grid-cols-2 gap-3">
      <li v-for="s in sandboxes" :key="s.id">
        <RouterLink
          :to="`/sandboxes/${s.id}`"
          class="block p-4 rounded-lg border border-ink-200 bg-white hover:border-ink-400"
        >
          <div class="font-medium">{{ s.title }}</div>
          <p class="text-sm text-ink-600 mt-1">{{ s.description }}</p>
        </RouterLink>
      </li>
    </ul>
  </section>
</template>
