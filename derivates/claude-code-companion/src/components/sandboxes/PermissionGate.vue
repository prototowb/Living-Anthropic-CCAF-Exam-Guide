<script setup lang="ts">
import { computed, ref } from 'vue';
import type {
  PermissionGateSandbox,
  PermissionPreset,
  PermissionRule,
  PermissionToolCall,
} from '@/data/types';

const props = defineProps<{ sandbox: PermissionGateSandbox }>();

const activePresetId = ref<string>(props.sandbox.presets[0]?.id ?? '');

const activePreset = computed<PermissionPreset | undefined>(() =>
  props.sandbox.presets.find((p) => p.id === activePresetId.value),
);

const activeRules = computed<PermissionRule[]>(() => activePreset.value?.rules ?? []);

type Outcome = 'allowed-silent' | 'prompt' | 'denied';

/** Match a rule pattern against a tool call.
 *  - `Tool` matches any Tool call regardless of args.
 *  - `Tool(*)` matches any Tool call (wildcard).
 *  - `Tool(specific arg)` matches Tool with that specific arg, or `arg *` wildcard
 *    if the pattern ends with ` *`.
 */
function ruleMatches(rule: PermissionRule, call: PermissionToolCall): boolean {
  const pattern = rule.pattern;
  // No-arg rule: `Read`, `Bash`, etc.
  if (!pattern.includes('(')) {
    return pattern === call.tool;
  }
  const m = pattern.match(/^([^(]+)\((.*)\)$/);
  if (!m) return false;
  const [, tool, argPattern] = m;
  if (tool !== call.tool) return false;
  if (argPattern === '*') return true; // wildcard
  // Trailing wildcard: `rm *` should match `rm -rf .`
  if (argPattern.endsWith(' *')) {
    const prefix = argPattern.slice(0, -2);
    return (call.args ?? '').startsWith(prefix);
  }
  // Embedded wildcard somewhere — translate to a simple glob.
  if (argPattern.includes('*')) {
    const re = new RegExp(
      '^' +
        argPattern
          .split('*')
          .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
          .join('.*') +
        '$',
    );
    return re.test(call.args ?? '');
  }
  return argPattern === (call.args ?? '');
}

function outcomeFor(call: PermissionToolCall): {
  outcome: Outcome;
  matchedRule: PermissionRule | null;
} {
  let allowMatch: PermissionRule | null = null;
  let denyMatch: PermissionRule | null = null;
  for (const r of activeRules.value) {
    if (!ruleMatches(r, call)) continue;
    if (r.type === 'deny') denyMatch = r;
    else if (!allowMatch) allowMatch = r;
  }
  if (denyMatch) return { outcome: 'denied', matchedRule: denyMatch };
  if (allowMatch) return { outcome: 'allowed-silent', matchedRule: allowMatch };
  return { outcome: 'prompt', matchedRule: null };
}

function outcomeBadge(outcome: Outcome) {
  if (outcome === 'allowed-silent')
    return {
      label: 'silent',
      cls: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
  if (outcome === 'prompt')
    return {
      label: 'prompts you',
      cls: 'bg-amber-100 text-amber-800 border-amber-300',
    };
  return {
    label: 'denied',
    cls: 'bg-rose-100 text-rose-800 border-rose-300',
  };
}

function pick(id: string) {
  activePresetId.value = id;
}

const settingsJson = computed(() => {
  if (activeRules.value.length === 0) return '{}';
  const allow = activeRules.value.filter((r) => r.type === 'allow').map((r) => r.pattern);
  const deny = activeRules.value.filter((r) => r.type === 'deny').map((r) => r.pattern);
  const obj: { permissions: { allow?: string[]; deny?: string[] } } = { permissions: {} };
  if (allow.length) obj.permissions.allow = allow;
  if (deny.length) obj.permissions.deny = deny;
  return JSON.stringify(obj, null, 2);
});

const queueWithOutcomes = computed(() =>
  props.sandbox.queue.map((call) => ({ call, ...outcomeFor(call) })),
);

const denyForRmRf = computed(() => {
  const rmCall = props.sandbox.queue.find((c) => c.id === 'bash-rm-rf');
  if (!rmCall) return null;
  return outcomeFor(rmCall);
});
</script>

<template>
  <div class="space-y-4">
    <section class="rounded-lg border border-ink-200 bg-white p-4">
      <header class="mb-3">
        <span class="text-xs uppercase tracking-wide text-ink-500">Rule preset</span>
        <p class="mt-1 text-xs text-ink-600">
          Pick a `.claude/settings.json` shape. The queue on the right updates
          with each call's outcome.
        </p>
      </header>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="p in sandbox.presets"
          :key="p.id"
          @click="pick(p.id)"
          :class="[
            'rounded-md border px-3 py-1.5 text-xs transition',
            activePresetId === p.id
              ? p.isAntiPattern
                ? 'bg-rose-700 text-white border-rose-700'
                : 'bg-ink-900 text-white border-ink-900'
              : p.isAntiPattern
              ? 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
              : 'bg-white text-ink-700 border-ink-200 hover:bg-ink-50',
          ]"
        >
          {{ p.label }}
        </button>
      </div>
      <p v-if="activePreset" class="mt-3 text-sm text-ink-700">
        {{ activePreset.description }}
      </p>
    </section>

    <div class="grid grid-cols-2 gap-4">
      <section class="rounded-lg border border-ink-200 bg-white p-4">
        <header class="mb-3">
          <span class="text-xs uppercase tracking-wide text-ink-500">.claude/settings.json</span>
        </header>
        <pre class="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-ink-800">{{ settingsJson }}</pre>
      </section>

      <section class="rounded-lg border border-ink-200 bg-white p-4">
        <header class="mb-3">
          <span class="text-xs uppercase tracking-wide text-ink-500">Tool-call queue</span>
        </header>
        <ul class="space-y-2">
          <li
            v-for="item in queueWithOutcomes"
            :key="item.call.id"
            :class="[
              'rounded-md border p-2 text-xs',
              item.outcome === 'denied' && item.call.id === 'bash-rm-rf'
                ? 'border-rose-300 bg-rose-50'
                : 'border-ink-200',
            ]"
          >
            <div class="flex items-baseline gap-2">
              <code class="font-mono text-[11px] text-ink-900 flex-1">
                {{ item.call.tool }}<span v-if="item.call.args">({{ item.call.args }})</span>
              </code>
              <span
                :class="[
                  'rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide whitespace-nowrap',
                  outcomeBadge(item.outcome).cls,
                ]"
              >
                {{ outcomeBadge(item.outcome).label }}
              </span>
            </div>
            <p class="mt-1 text-ink-600">{{ item.call.description }}</p>
            <p v-if="item.matchedRule" class="mt-1 font-mono text-[10px] text-ink-500">
              matched: {{ item.matchedRule.type }} <code>"{{ item.matchedRule.pattern }}"</code>
            </p>
          </li>
        </ul>
      </section>
    </div>

    <aside
      v-if="activePreset?.isAntiPattern && denyForRmRf?.outcome !== 'denied'"
      class="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900"
    >
      <strong class="font-semibold">⚠ Look at the `rm -rf` line.</strong>
      <p class="mt-1">
        Under <code class="font-mono">Bash(*)</code> it ran silently — no
        prompt, no chance to stop it. This is why over-broad rules are the
        recipe for "Claude deleted my repo." Either deny destructive patterns
        explicitly, or keep the allow-list narrow.
      </p>
    </aside>
  </div>
</template>
