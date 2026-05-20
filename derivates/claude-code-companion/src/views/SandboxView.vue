<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { getSandbox } from '@/data/sandboxes';
import FirstSessionRepl from '@/components/sandboxes/FirstSessionRepl.vue';

const props = defineProps<{ id: string }>();
const sandbox = computed(() => getSandbox(props.id));
</script>

<template>
  <section v-if="sandbox" class="space-y-4">
    <header>
      <RouterLink to="/sandboxes" class="text-xs text-ink-500 hover:underline">← all sandboxes</RouterLink>
      <h1 class="text-2xl font-semibold tracking-tight mt-2">{{ sandbox.title }}</h1>
      <p class="text-ink-600 mt-1">{{ sandbox.description }}</p>
    </header>

    <FirstSessionRepl v-if="sandbox.id === 'first-session-repl'" :transcript="sandbox" />
  </section>

  <section v-else>
    <p>Sandbox not found.</p>
  </section>
</template>
