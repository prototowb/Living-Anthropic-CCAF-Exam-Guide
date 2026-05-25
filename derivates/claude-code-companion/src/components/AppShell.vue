<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';
import { computed } from 'vue';
import { useSettingsStore } from '@/stores/settings';
import HelpBotSidebar from './HelpBotSidebar.vue';

const route = useRoute();
const settings = useSettingsStore();

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/learn', label: 'Learn' },
  { to: '/quiz', label: 'Quiz' },
  { to: '/lessons', label: 'Lessons' },
  { to: '/sandboxes', label: 'Sandboxes' },
  { to: '/atlas', label: 'Atlas' },
  { to: '/tutor', label: 'Tutor' },
];

const isActive = (to: string) =>
  to === '/' ? route.path === '/' : route.path.startsWith(to);

const adapterLabel = computed(() => settings.adapterLabel);
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="border-b border-ink-200 bg-white">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
        <RouterLink to="/" class="font-semibold tracking-tight text-ink-900">
          Claude Code Companion
        </RouterLink>
        <nav class="flex gap-1 text-sm">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="px-3 py-1.5 rounded transition"
            :class="
              isActive(item.to)
                ? 'bg-ink-900 text-white'
                : 'text-ink-700 hover:bg-ink-100'
            "
          >
            {{ item.label }}
          </RouterLink>
        </nav>
        <div class="ml-auto text-xs text-ink-500 mono">
          model: {{ adapterLabel }}
        </div>
      </div>
    </header>

    <main class="flex-1">
      <div class="max-w-6xl mx-auto px-4 py-6">
        <slot />
      </div>
    </main>

    <footer class="border-t border-ink-200 bg-white text-xs text-ink-500">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <span>v0.3.0-pre — beginner curriculum, all 8 stages authored</span>
        <RouterLink to="/under-the-hood" class="hover:text-ink-900 underline">
          /under-the-hood
        </RouterLink>
        <RouterLink to="/settings" class="hover:text-ink-900 underline">
          /settings
        </RouterLink>
        <RouterLink to="/weak-spots" class="hover:text-ink-900 underline">
          /weak-spots
        </RouterLink>
        <span class="ml-auto">Mock SDK default · no API key required</span>
      </div>
    </footer>

    <HelpBotSidebar />
  </div>
</template>
