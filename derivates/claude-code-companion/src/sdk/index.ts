// Composition root for the model adapter.
//
// Default: mockAdapter (no API key, no network).
// v0.5 — all five sources are wired: mock (scripted), real (Anthropic SDK),
// webllm (in-browser via WebGPU), ollama / lm-studio (localhost OpenAI-compat).
// All adapters conform to `SdkAdapter` — see ./types.ts.
//
// The active adapter lives in a shallowRef so Pinia getters that read
// `getAdapter().capabilities` (e.g. helpBot.adapterCapabilities) invalidate
// when the adapter is swapped. `@vue/reactivity` is runtime-agnostic, so the
// node-side scripts (tsx) that import this module keep working.

import { shallowRef } from 'vue';
import { mockAdapter } from './mockAdapter';
import type { SdkAdapter } from './types';

const current = shallowRef<SdkAdapter>(mockAdapter);

export function getAdapter(): SdkAdapter {
  return current.value;
}

export function setAdapter(next: SdkAdapter) {
  current.value = next;
}

export { mockAdapter };
export { createRealAdapter } from './realAdapter';
export {
  createWebLlmAdapter,
  prewarmWebLlm,
  webGpuAvailable,
  WEBLLM_DEFAULT_MODEL,
} from './webllmAdapter';
export type { WebLlmProgress } from './webllmAdapter';
export { createOllamaAdapter, OLLAMA_BASE_URL } from './ollamaAdapter';
export { createLmStudioAdapter, LM_STUDIO_BASE_URL } from './lmStudioAdapter';
export { pingOpenAiCompatServer, pickDefaultModel } from './openaiCompat';
export type { PingResult } from './openaiCompat';
export type * from './types';
