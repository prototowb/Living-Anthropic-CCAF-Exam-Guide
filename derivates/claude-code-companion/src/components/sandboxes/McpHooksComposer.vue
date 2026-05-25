<script setup lang="ts">
import { computed, ref } from 'vue';
import type { HookEntry, McpHooksSandbox, McpServerEntry } from '@/data/types';

const props = defineProps<{ sandbox: McpHooksSandbox }>();

const serversOn = ref<Record<string, boolean>>({});
const hooksOn = ref<Record<string, boolean>>({});

const activeServers = computed<McpServerEntry[]>(() =>
  props.sandbox.servers.filter((s) => serversOn.value[s.id]),
);
const activeHooks = computed<HookEntry[]>(() =>
  props.sandbox.hooks.filter((h) => hooksOn.value[h.id]),
);

function toggleServer(id: string) {
  serversOn.value[id] = !serversOn.value[id];
}
function toggleHook(id: string) {
  hooksOn.value[id] = !hooksOn.value[id];
}

function hooksForEvent(eventTool: string): HookEntry[] {
  return activeHooks.value.filter((h) => {
    if (h.event === 'userPromptSubmit') return eventTool === 'userPromptSubmit';
    if (h.event === 'stop') return eventTool === 'stop';
    // pre/post tool use — match by tool name
    return !h.toolMatcher || h.toolMatcher === eventTool;
  });
}

const settingsPreview = computed(() => {
  const out: Record<string, unknown> = {};
  if (activeServers.value.length > 0) {
    out.mcpServers = Object.fromEntries(
      activeServers.value.map((s) => [s.name, { exposes: s.exposes }]),
    );
  }
  if (activeHooks.value.length > 0) {
    const byEvent: Record<string, unknown[]> = {};
    for (const h of activeHooks.value) {
      const entry: Record<string, unknown> = { command: h.command };
      if (h.toolMatcher) entry.matcher = { tool: h.toolMatcher };
      (byEvent[h.event] ??= []).push(entry);
    }
    out.hooks = byEvent;
  }
  return JSON.stringify(out, null, 2);
});

function eventIcon(tool: string): string {
  if (tool === 'userPromptSubmit') return '⌨';
  if (tool === 'stop') return '⏹';
  if (tool === 'Edit' || tool === 'Write') return '✎';
  if (tool === 'Read' || tool === 'Grep' || tool === 'Glob') return '👁';
  if (tool === 'Bash') return '⚡';
  return '•';
}
</script>

<template>
  <div class="space-y-4">
    <div class="grid grid-cols-3 gap-4">
      <section class="rounded-lg border border-ink-200 bg-white p-4">
        <header class="mb-3">
          <div class="text-xs uppercase tracking-wide text-ink-500">MCP servers</div>
          <p class="mt-1 text-[11px] text-ink-500">
            Toggle on to expose extra tools to Claude.
          </p>
        </header>
        <ul class="space-y-2">
          <li
            v-for="s in sandbox.servers"
            :key="s.id"
            class="rounded-md border border-ink-200 p-2"
          >
            <label class="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                :checked="serversOn[s.id] ?? false"
                @change="toggleServer(s.id)"
                class="mt-1 accent-ink-900"
              />
              <div class="flex-1">
                <code class="font-mono text-xs font-semibold">{{ s.name }}</code>
                <p class="mt-0.5 text-[11px] text-ink-600">{{ s.purpose }}</p>
              </div>
            </label>
          </li>
        </ul>
      </section>

      <section class="rounded-lg border border-ink-200 bg-white p-4">
        <header class="mb-3">
          <div class="text-xs uppercase tracking-wide text-ink-500">Hooks</div>
          <p class="mt-1 text-[11px] text-ink-500">
            Scripts that run on Claude Code events.
          </p>
        </header>
        <ul class="space-y-2">
          <li
            v-for="h in sandbox.hooks"
            :key="h.id"
            class="rounded-md border border-ink-200 p-2"
          >
            <label class="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                :checked="hooksOn[h.id] ?? false"
                @change="toggleHook(h.id)"
                class="mt-1 accent-ink-900"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <code class="font-mono text-[11px] bg-ink-100 px-1 rounded">{{ h.event }}</code>
                  <code v-if="h.toolMatcher" class="font-mono text-[11px] text-ink-500">
                    matcher: {{ h.toolMatcher }}
                  </code>
                </div>
                <p class="mt-0.5 text-[11px] text-ink-600">{{ h.effect }}</p>
              </div>
            </label>
          </li>
        </ul>
      </section>

      <section class="rounded-lg border border-ink-200 bg-white p-4">
        <header class="mb-3">
          <div class="text-xs uppercase tracking-wide text-ink-500">Event stream</div>
          <p class="mt-1 text-[11px] text-ink-500">
            What runs when Claude is mid-task.
          </p>
        </header>
        <ul class="space-y-2">
          <li
            v-for="e in sandbox.eventStream"
            :key="e.id"
            class="rounded-md border border-ink-100 p-2 text-xs"
          >
            <div class="flex items-baseline gap-2">
              <span class="text-base leading-none">{{ eventIcon(e.tool) }}</span>
              <code class="font-mono text-[11px] text-ink-700">{{ e.tool }}</code>
            </div>
            <p class="mt-1 text-ink-700">{{ e.description }}</p>
            <ul v-if="hooksForEvent(e.tool).length" class="mt-2 space-y-1">
              <li
                v-for="h in hooksForEvent(e.tool)"
                :key="h.id"
                class="rounded bg-stage-s3/10 px-2 py-1 text-[10px] font-mono text-stage-s3"
              >
                ↪ fires: {{ h.command }}
              </li>
            </ul>
          </li>
        </ul>
      </section>
    </div>

    <section class="rounded-lg border border-ink-200 bg-white p-4">
      <header class="mb-2 flex items-baseline justify-between">
        <span class="text-xs uppercase tracking-wide text-ink-500">
          Effective .claude/settings.json
        </span>
        <span class="text-[11px] text-ink-500">
          {{ activeServers.length }} server(s) · {{ activeHooks.length }} hook(s) active
        </span>
      </header>
      <pre class="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-ink-800">{{ settingsPreview || '// Toggle a server or hook to see it land here.' }}</pre>
    </section>
  </div>
</template>
