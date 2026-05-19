<script setup lang="ts">
defineProps<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
}>();
</script>

<template>
  <header class="mb-8">
    <div v-if="eyebrow" class="text-xs uppercase tracking-widest text-ink-400 mb-1">
      {{ eyebrow }}
    </div>
    <h1 class="text-3xl font-bold text-ink-50">{{ title }}</h1>
    <p v-if="subtitle" class="text-ink-300 mt-2 max-w-prose">{{ subtitle }}</p>
  </header>
</template>
