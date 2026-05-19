<script setup lang="ts">
import { ref } from 'vue';
import { lookupQuestion } from '@/agents/tools/lookupQuestion';
import { gradeAnswer } from '@/agents/tools/gradeAnswer';
import { lookupDomain } from '@/agents/tools/lookupDomain';
import { searchPatterns } from '@/agents/tools/searchPatterns';
import type { OptionLetter } from '@/data/quizData';
import type { ToolResponse } from '@/agents/tools/types';
import CodeBlock from '@/components/CodeBlock.vue';

type ToolName = 'lookup_question' | 'grade_answer' | 'lookup_domain' | 'search_patterns';

const tool = ref<ToolName>('grade_answer');

// Per-tool inputs (kept separate so switching tools doesn't blow away your values)
const lookupQuestionArgs = ref({ section: 's1', id: 99 }); // intentionally invalid → business error
const gradeAnswerArgs = ref<{ section: string; id: number; answer: OptionLetter }>({
  section: 's1', id: 4, answer: 'D',
});
const lookupDomainArgs = ref({ id: 'd9' }); // invalid → business error
const searchPatternsArgs = ref({ query: 'scratchpad', limit: 4 });

const response = ref<ToolResponse<unknown> | null>(null);
const callDurationMs = ref(0);

async function run() {
  const t0 = performance.now();
  let res: ToolResponse<unknown>;
  switch (tool.value) {
    case 'lookup_question':
      res = await lookupQuestion(lookupQuestionArgs.value);
      break;
    case 'grade_answer':
      res = await gradeAnswer(gradeAnswerArgs.value);
      break;
    case 'lookup_domain':
      res = await lookupDomain(lookupDomainArgs.value);
      break;
    case 'search_patterns':
      res = await searchPatterns(searchPatternsArgs.value);
      break;
  }
  callDurationMs.value = Math.round(performance.now() - t0);
  response.value = res;
}

const guidance: Record<string, { label: string; action: string; cls: string }> = {
  transient: {
    label: 'transient',
    action: 'Retry — likely a network blip or rate limit.',
    cls: 'badge--domain-ci',
  },
  validation: {
    label: 'validation',
    action: 'Fix the input shape and retry. The tool received malformed args.',
    cls: 'badge--domain-ci',
  },
  business: {
    label: 'business',
    action: 'Change strategy — the input was syntactically valid but the requested data does not exist or the operation is disallowed.',
    cls: 'badge--domain-ci',
  },
  permission: {
    label: 'permission',
    action: 'Escalate — caller lacks the right to perform this action.',
    cls: 'badge--domain-ci',
  },
};
</script>

<template>
  <div class="sandbox">
    <div class="sandbox__header">
      <div>
        <div class="sandbox__eyebrow">Live · structured-errors</div>
        <h3 class="sandbox__title">Call a tool, inspect <code>ToolResponse&lt;T&gt;</code></h3>
      </div>
    </div>

    <p class="sandbox__hint">
      Every tool returns either <code>{ isError: false, data }</code> or
      <code>{ isError: true, errorCategory, message }</code>.
      Pick a tool, set args (some defaults are intentionally invalid to demonstrate
      the <code>business</code> error path), and call it.
    </p>

    <div class="sandbox__controls">
      <label class="sandbox__control">
        <span>Tool</span>
        <select v-model="tool" class="sandbox__select">
          <option value="grade_answer">grade_answer</option>
          <option value="lookup_question">lookup_question</option>
          <option value="lookup_domain">lookup_domain</option>
          <option value="search_patterns">search_patterns</option>
        </select>
      </label>
    </div>

    <div class="sandbox__form">
      <template v-if="tool === 'grade_answer'">
        <label class="sandbox__control">
          <span>section</span>
          <input v-model="gradeAnswerArgs.section" class="sandbox__input" />
        </label>
        <label class="sandbox__control">
          <span>id</span>
          <input v-model.number="gradeAnswerArgs.id" type="number" class="sandbox__input" />
        </label>
        <label class="sandbox__control">
          <span>answer</span>
          <select v-model="gradeAnswerArgs.answer" class="sandbox__select">
            <option>A</option><option>B</option><option>C</option><option>D</option>
          </select>
        </label>
      </template>
      <template v-else-if="tool === 'lookup_question'">
        <label class="sandbox__control">
          <span>section</span>
          <input v-model="lookupQuestionArgs.section" class="sandbox__input" />
        </label>
        <label class="sandbox__control">
          <span>id (try 99 for business error)</span>
          <input v-model.number="lookupQuestionArgs.id" type="number" class="sandbox__input" />
        </label>
      </template>
      <template v-else-if="tool === 'lookup_domain'">
        <label class="sandbox__control">
          <span>id (try d9 for business error)</span>
          <input v-model="lookupDomainArgs.id" class="sandbox__input" />
        </label>
      </template>
      <template v-else>
        <label class="sandbox__control">
          <span>query</span>
          <input v-model="searchPatternsArgs.query" class="sandbox__input" />
        </label>
        <label class="sandbox__control">
          <span>limit</span>
          <input v-model.number="searchPatternsArgs.limit" type="number" class="sandbox__input" />
        </label>
      </template>
    </div>

    <button class="btn btn--primary" @click="run">Call tool</button>

    <div v-if="response" class="sandbox__result">
      <div class="sandbox__pane-label">
        Response · {{ callDurationMs }}ms
      </div>
      <CodeBlock :code="JSON.stringify(response, null, 2)" language="json" />

      <div class="sandbox__verdict">
        <template v-if="!response.isError">
          <span class="badge badge--domain-ops">isError: false</span>
          <span class="sandbox__verdict-text">Success — the tool returned <code>data</code>. Caller can use the value directly.</span>
        </template>
        <template v-else>
          <span class="badge" :class="guidance[response.errorCategory]?.cls ?? 'badge--domain-ci'">
            isError: true · errorCategory: {{ response.errorCategory }}
          </span>
          <span class="sandbox__verdict-text">
            {{ guidance[response.errorCategory]?.action ?? 'Unknown error category.' }}
          </span>
        </template>
      </div>
    </div>
  </div>
</template>
