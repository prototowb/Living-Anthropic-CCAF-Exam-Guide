<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';
import { computed } from 'vue';
import { quizSections } from '@/data/quizData';
import { domains } from '@/data/domains';

const route = useRoute();

const navLinks = [
  { to: { name: 'home' }, label: 'Home' },
  { to: { name: 'quiz' }, label: 'Quiz' },
  { to: { name: 'mock-exam' }, label: 'Mock Exam' },
  { to: { name: 'domains' }, label: 'Domains' },
  { to: { name: 'atlas' }, label: 'Concept Atlas' },
  { to: { name: 'tutor' }, label: 'Claude Tutor' },
  { to: { name: 'patterns' }, label: 'Pattern Showcase' },
  { to: { name: 'lessons' }, label: 'Micro-Lessons' },
];

const sectionLinks = quizSections.map((s) => ({
  to: { name: 'quiz-section', params: { section: s.id } },
  label: s.shortTitle,
  color: s.color,
}));

const domainLinks = domains.map((d) => ({
  to: { name: 'domain', params: { id: d.id } },
  label: `D${d.number} — ${d.title.split(' & ')[0].split(' — ')[0]}`,
}));

function isActive(name: string) {
  return computed(() => route.name === name).value;
}
</script>

<template>
  <div class="app-shell">
    <aside class="app-shell__sidebar">
      <RouterLink :to="{ name: 'home' }" class="app-shell__brand">
        <span class="app-shell__brand-mark">A</span>
        <span>Architect Playbook</span>
      </RouterLink>

      <nav class="app-shell__nav">
        <div class="app-shell__nav-section">Surface</div>
        <RouterLink
          v-for="link in navLinks"
          :key="link.label"
          :to="link.to"
          class="app-shell__nav-link"
          :class="{ 'app-shell__nav-link--active': route.name === link.to.name }"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <nav class="app-shell__nav">
        <div class="app-shell__nav-section">Quiz sections</div>
        <RouterLink
          v-for="link in sectionLinks"
          :key="link.label"
          :to="link.to"
          class="app-shell__nav-link"
        >
          <span :style="{ color: link.color }">●</span>&nbsp;
          {{ link.label }}
        </RouterLink>
      </nav>

      <nav class="app-shell__nav">
        <div class="app-shell__nav-section">Exam domains</div>
        <RouterLink
          v-for="link in domainLinks"
          :key="link.label"
          :to="link.to"
          class="app-shell__nav-link"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="app-shell__footer">
        Claude Certified Architect — Foundations.
        <br />
        Mock SDK by default · no network needed.
      </div>
    </aside>

    <main class="app-shell__main">
      <slot />
    </main>
  </div>
</template>
