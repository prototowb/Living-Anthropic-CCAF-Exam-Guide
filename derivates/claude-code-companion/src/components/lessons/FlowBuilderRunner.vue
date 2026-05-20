<script setup lang="ts">
import { computed, ref } from 'vue';
import type { FlowBuilderLesson } from '@/data/types';
import { useProgressStore } from '@/stores/progress';

const props = defineProps<{ lesson: FlowBuilderLesson }>();
const progress = useProgressStore();

const slots = ref<(string | null)[]>(props.lesson.canonical.map(() => null));
const submitted = ref(false);

const placedIds = computed(() => new Set(slots.value.filter((s): s is string => s !== null)));
const pool = computed(() => props.lesson.cards.filter((c) => !placedIds.value.has(c.id)));

const allCorrect = computed(() =>
  slots.value.every((id, idx) => id === props.lesson.canonical[idx]),
);

function place(cardId: string, slotIdx: number) {
  if (submitted.value) return;
  const arr = slots.value.slice();
  arr[slotIdx] = cardId;
  slots.value = arr;
}

function clearSlot(slotIdx: number) {
  if (submitted.value) return;
  const arr = slots.value.slice();
  arr[slotIdx] = null;
  slots.value = arr;
}

function submit() {
  if (slots.value.some((s) => s === null)) return;
  submitted.value = true;
  progress.recordLessonAttempt(props.lesson.id, allCorrect.value);
}

function reset() {
  slots.value = props.lesson.canonical.map(() => null);
  submitted.value = false;
}

const cardLabel = (id: string) => props.lesson.cards.find((c) => c.id === id)?.label ?? id;
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-ink-500">Pick a card, then click the slot it belongs in.</p>

    <div class="space-y-2">
      <div
        v-for="(slot, idx) in slots"
        :key="idx"
        class="flex items-center gap-2 p-3 rounded border-2 border-dashed"
        :class="{
          'border-ink-200': !submitted && slot === null,
          'border-ink-400 bg-white': !submitted && slot !== null,
          'border-stage-s4 bg-stage-s4/5':
            submitted && lesson.canonical[idx] === slot,
          'border-stage-s5 bg-stage-s5/5':
            submitted && lesson.canonical[idx] !== slot,
        }"
      >
        <span class="mono text-xs text-ink-500 w-6">{{ idx + 1 }}.</span>
        <span class="flex-1 text-sm">
          <template v-if="slot">{{ cardLabel(slot) }}</template>
          <span v-else class="text-ink-400 italic">empty</span>
        </span>
        <button
          v-if="slot && !submitted"
          @click="clearSlot(idx)"
          class="text-xs text-ink-500 hover:text-ink-900"
        >
          clear
        </button>
      </div>
    </div>

    <div v-if="pool.length && !submitted" class="space-y-2">
      <div class="text-xs text-ink-500">Cards</div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="card in pool"
          :key="card.id"
          @click="
            () => {
              const idx = slots.findIndex((s) => s === null);
              if (idx >= 0) place(card.id, idx);
            }
          "
          class="px-3 py-1.5 text-sm rounded border border-ink-300 bg-white hover:border-ink-900"
        >
          {{ card.label }}
        </button>
      </div>
    </div>

    <div class="flex gap-2">
      <button
        v-if="!submitted"
        @click="submit"
        :disabled="slots.some((s) => s === null)"
        class="px-4 py-2 bg-ink-900 text-white rounded text-sm disabled:opacity-50"
      >
        Submit
      </button>
      <button
        v-else
        @click="reset"
        class="px-4 py-2 bg-ink-900 text-white rounded text-sm"
      >
        Try again
      </button>
    </div>

    <div
      v-if="submitted"
      class="p-3 rounded border text-sm"
      :class="allCorrect ? 'border-stage-s4 bg-stage-s4/5' : 'border-stage-s5 bg-stage-s5/5'"
    >
      <div class="font-medium mb-1">
        {{ allCorrect ? '✓ Flow correct.' : 'Some slots are out of place.' }}
      </div>
      <p class="text-ink-700">{{ lesson.rationale }}</p>
    </div>
  </div>
</template>
