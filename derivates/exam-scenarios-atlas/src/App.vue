<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b border-ink-200 bg-white/80 backdrop-blur sticky top-0 z-10">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <RouterLink to="/" class="no-underline flex items-center gap-3">
          <span class="inline-block h-7 w-7 rounded-md bg-ink-800 text-ink-50 grid place-items-center font-mono text-sm">6</span>
          <div class="leading-tight">
            <div class="font-serif text-lg text-ink-800">Exam Scenarios Atlas</div>
            <div class="text-xs text-ink-400">Claude Certified Architect — Foundations</div>
          </div>
        </RouterLink>
        <nav class="text-sm text-ink-500 flex items-center gap-5">
          <RouterLink to="/" class="hover:text-ink-800 no-underline">Scenarios</RouterLink>
          <RouterLink to="/domains" class="hover:text-ink-800 no-underline">Domains</RouterLink>
          <RouterLink to="/about" class="hover:text-ink-800 no-underline">About</RouterLink>
        </nav>
      </div>
    </header>

    <main class="flex-1">
      <RouterView />
    </main>

    <footer class="border-t border-ink-200 bg-white">
      <div class="max-w-6xl mx-auto px-6 py-6 text-xs text-ink-400 flex items-center justify-between">
        <div>
          Sibling derivative of
          <span class="code-inline">architect-interactive-playbook</span>. Content sourced from the
          public exam guide v0.1.
        </div>
        <div>Local-first · offline-by-default</div>
      </div>
    </footer>
  </div>
</template>
