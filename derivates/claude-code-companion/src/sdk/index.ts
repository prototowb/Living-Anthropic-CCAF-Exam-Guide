// Composition root for the model adapter.
//
// Default: mockAdapter (no API key, no network).
// v0.2 — adapter stubs for webllm / ollama / lm-studio are interface-compliant
// but throw on `createMessage`. They exist so the /settings picker can offer
// all four sources and so the v0.5 wiring lands without refactoring callers.
// All adapters conform to `SdkAdapter` — see ./types.ts.

import { mockAdapter } from './mockAdapter';
import type { SdkAdapter } from './types';

let current: SdkAdapter = mockAdapter;

export function getAdapter(): SdkAdapter {
  return current;
}

export function setAdapter(next: SdkAdapter) {
  current = next;
}

export { mockAdapter };
export { createRealAdapter } from './realAdapter';
export { createWebLlmAdapter } from './webllmAdapter';
export { createOllamaAdapter } from './ollamaAdapter';
export { createLmStudioAdapter } from './lmStudioAdapter';
export type * from './types';
