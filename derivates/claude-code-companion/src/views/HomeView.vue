<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { useProgressStore } from '@/stores/progress';
import { stages } from '@/data/stages';
import { lessons } from '@/data/lessons';
import { getAllQuestions } from '@/data/quizData';

const progress = useProgressStore();
const totalStages = stages.length;
const totalLessons = lessons.length;
const totalQuestions = getAllQuestions().length;
</script>

<template>
  <section class="space-y-6">
    <header>
      <h1 class="text-3xl font-semibold tracking-tight">Claude Code Companion</h1>
      <p class="text-ink-600 mt-2 max-w-2xl">
        An interactive study companion for <strong>Claude Code</strong> (the CLI tool),
        for beginner users. Eight stages, climb at your pace. The mock SDK is the
        default — no API key required.
      </p>
    </header>

    <div class="grid grid-cols-3 gap-4">
      <div class="p-4 rounded-lg border border-ink-200 bg-white">
        <div class="text-xs uppercase text-ink-500">Stages</div>
        <div class="text-2xl font-semibold">
          {{ progress.stagesCompleted }}<span class="text-ink-400 text-base"> / {{ totalStages }}</span>
        </div>
      </div>
      <div class="p-4 rounded-lg border border-ink-200 bg-white">
        <div class="text-xs uppercase text-ink-500">Lessons</div>
        <div class="text-2xl font-semibold">
          {{ progress.lessonsCompleted }}<span class="text-ink-400 text-base"> / {{ totalLessons }}</span>
        </div>
      </div>
      <div class="p-4 rounded-lg border border-ink-200 bg-white">
        <div class="text-xs uppercase text-ink-500">Quiz answered</div>
        <div class="text-2xl font-semibold">
          {{ progress.quizAnswered }}<span class="text-ink-400 text-base"> / {{ totalQuestions }}</span>
        </div>
      </div>
    </div>

    <section>
      <h2 class="text-lg font-medium mb-3">Start here</h2>
      <div class="grid grid-cols-2 gap-3">
        <RouterLink
          v-for="s in stages.slice(0, 2)"
          :key="s.id"
          :to="`/learn/${s.id}`"
          class="block p-4 rounded-lg border border-ink-200 bg-white hover:border-ink-400 transition"
        >
          <div class="text-xs uppercase text-ink-500">Stage {{ s.number }}</div>
          <div class="font-medium mt-1">{{ s.title }}</div>
          <p class="text-sm text-ink-600 mt-1">{{ s.pitch }}</p>
        </RouterLink>
      </div>
    </section>

    <section>
      <h2 class="text-lg font-medium mb-3">All stages</h2>
      <ol class="space-y-2">
        <li v-for="s in stages" :key="s.id" class="flex items-center gap-3">
          <span class="mono text-xs text-ink-500 w-6">S{{ s.number }}</span>
          <RouterLink :to="`/learn/${s.id}`" class="text-ink-900 hover:underline">
            {{ s.title }}
          </RouterLink>
          <span
            v-for="r in s.rungs"
            :key="r"
            class="text-xs px-1.5 py-0.5 rounded mono"
            :class="{
              'bg-rung-B/10 text-rung-B': r === 'B',
              'bg-rung-I/10 text-rung-I': r === 'I',
              'bg-rung-A/10 text-rung-A': r === 'A',
            }"
            >{{ r }}</span
          >
          <span v-if="progress.stages[s.id]?.completed" class="text-xs text-stage-s4">✓</span>
        </li>
      </ol>
    </section>
  </section>
</template>
