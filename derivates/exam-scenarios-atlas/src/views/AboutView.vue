<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="max-w-3xl mx-auto px-6 py-10 space-y-6">
    <header class="space-y-2">
      <p class="chip">About</p>
      <h1 class="font-serif text-3xl text-ink-800">Exam Scenarios Atlas</h1>
    </header>

    <section class="prose-tight text-ink-700 leading-relaxed space-y-4 max-w-prose">
      <p>
        A focused study companion for the
        <strong>Claude Certified Architect — Foundations</strong> exam. Each of the six exam
        scenarios gets its own page with four pieces:
      </p>
      <ol class="space-y-1 list-decimal pl-5 text-sm">
        <li><strong>Infographic</strong> — the architecture, as a single SVG you can read in 10 seconds.</li>
        <li><strong>Example</strong> — a concrete real-world story to anchor the abstraction.</li>
        <li><strong>Living flow</strong> — a steppable walkthrough that shows the loop, the tool calls, and the stop_reason transitions.</li>
        <li><strong>Worked code</strong> + <strong>sample Q&amp;A</strong> — the same questions from the public exam guide v0.1, with answers revealed on demand.</li>
      </ol>
      <p class="text-sm text-ink-500">
        Local-first. No network calls. Content is sourced from the public
        <em>Claude Certified Architect — Foundations Certification Exam Guide v0.1</em>
        (10 Feb 2025).
      </p>
      <p class="text-sm">
        <RouterLink to="/">← Back to the atlas</RouterLink>
      </p>
    </section>
  </div>
</template>
