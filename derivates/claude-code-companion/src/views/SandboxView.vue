<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { getSandbox } from '@/data/sandboxes';
import FirstSessionRepl from '@/components/sandboxes/FirstSessionRepl.vue';
import PlanModeWorkshop from '@/components/sandboxes/PlanModeWorkshop.vue';
import ClaudeMdHierarchy from '@/components/sandboxes/ClaudeMdHierarchy.vue';
import SessionLifecycle from '@/components/sandboxes/SessionLifecycle.vue';
import SubagentDispatcher from '@/components/sandboxes/SubagentDispatcher.vue';
import McpHooksComposer from '@/components/sandboxes/McpHooksComposer.vue';
import HeadlessComposer from '@/components/sandboxes/HeadlessComposer.vue';
import PermissionGate from '@/components/sandboxes/PermissionGate.vue';

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

    <FirstSessionRepl
      v-if="sandbox.kind === 'repl'"
      :transcript="sandbox"
    />
    <PlanModeWorkshop
      v-else-if="sandbox.kind === 'plan-workshop'"
      :sandbox="sandbox"
    />
    <ClaudeMdHierarchy
      v-else-if="sandbox.kind === 'hierarchy'"
      :sandbox="sandbox"
    />
    <SessionLifecycle
      v-else-if="sandbox.kind === 'session-lifecycle'"
      :sandbox="sandbox"
    />
    <SubagentDispatcher
      v-else-if="sandbox.kind === 'subagent-dispatcher'"
      :sandbox="sandbox"
    />
    <McpHooksComposer
      v-else-if="sandbox.kind === 'mcp-hooks-composer'"
      :sandbox="sandbox"
    />
    <HeadlessComposer
      v-else-if="sandbox.kind === 'headless-composer'"
      :sandbox="sandbox"
    />
    <PermissionGate
      v-else-if="sandbox.kind === 'permission-gate'"
      :sandbox="sandbox"
    />
  </section>

  <section v-else>
    <p>Sandbox not found.</p>
  </section>
</template>
