import { describe, it, expect } from 'vitest';
import { nextTick } from 'vue';
import { mount, RouterLinkStub } from '@vue/test-utils';
import FlowBuilderLesson from '@/components/lessons/FlowBuilderLesson.vue';
import { lessons, type FlowLesson } from '@/data/lessons';
import { getFlow } from '@/data/flows';
import { domains } from '@/data/domains';

// Real data: the first authored flow-builder lesson and its backing flow.
const lesson = lessons.find((l): l is FlowLesson => l.format === 'flow')!;
const flow = getFlow(lesson.flowId)!;

function patternTitle(patternId: string): string {
  for (const d of domains) {
    const p = d.patterns.find((p) => p.id === patternId);
    if (p) return p.title;
  }
  throw new Error(`pattern not found: ${patternId}`);
}

// The component builds its pool/slots in onMounted — wait a tick for the DOM.
async function mountLesson() {
  const wrapper = mount(FlowBuilderLesson, {
    props: { lesson },
    global: { stubs: { RouterLink: RouterLinkStub } },
  });
  await nextTick();
  return wrapper;
}

function cardByTitle(wrapper: Awaited<ReturnType<typeof mountLesson>>, title: string) {
  return wrapper
    .findAll('.flow-builder__card')
    .find((c) => c.find('.flow-builder__card-title').text() === title)!;
}

function checkButton(wrapper: Awaited<ReturnType<typeof mountLesson>>) {
  return wrapper.findAll('button').find((b) => b.text() === 'Check flow')!;
}

async function fillCanonically(wrapper: Awaited<ReturnType<typeof mountLesson>>) {
  for (const step of flow.steps) {
    await cardByTitle(wrapper, patternTitle(step.patternId)).trigger('click');
  }
}

describe('FlowBuilderLesson', () => {
  it('renders one slot per flow step and a pool of steps + distractors', async () => {
    const wrapper = await mountLesson();
    expect(wrapper.findAll('.flow-builder__slot')).toHaveLength(flow.steps.length);
    expect(wrapper.findAll('.flow-builder__card')).toHaveLength(
      flow.steps.length + lesson.distractorPatternIds.length,
    );
  });

  it('check stays disabled until every slot is filled', async () => {
    const wrapper = await mountLesson();
    expect(checkButton(wrapper).attributes('disabled')).toBeDefined();
    await fillCanonically(wrapper);
    expect(checkButton(wrapper).attributes('disabled')).toBeUndefined();
  });

  it('a used card is disabled; clearing its slot frees it', async () => {
    const wrapper = await mountLesson();
    const firstTitle = patternTitle(flow.steps[0].patternId);
    await cardByTitle(wrapper, firstTitle).trigger('click');
    expect(cardByTitle(wrapper, firstTitle).attributes('disabled')).toBeDefined();

    await wrapper.find('.flow-builder__slot-clear').trigger('click');
    expect(cardByTitle(wrapper, firstTitle).attributes('disabled')).toBeUndefined();
  });

  it('the canonical order emits complete(true)', async () => {
    const wrapper = await mountLesson();
    await fillCanonically(wrapper);
    await checkButton(wrapper).trigger('click');
    expect(wrapper.emitted('complete')).toEqual([[true]]);
    expect(wrapper.find('.flow-builder__summary--correct').exists()).toBe(true);
  });

  it('a wrong order emits complete(false) and marks the wrong slots', async () => {
    const wrapper = await mountLesson();
    // Reverse canonical order — with ≥2 distinct steps at least the ends are wrong.
    for (const step of [...flow.steps].reverse()) {
      await cardByTitle(wrapper, patternTitle(step.patternId)).trigger('click');
    }
    await checkButton(wrapper).trigger('click');
    expect(wrapper.emitted('complete')).toEqual([[false]]);
    expect(wrapper.findAll('.flow-builder__slot--wrong').length).toBeGreaterThan(0);
    expect(wrapper.find('.flow-builder__summary--partial').exists()).toBe(true);
  });
});
