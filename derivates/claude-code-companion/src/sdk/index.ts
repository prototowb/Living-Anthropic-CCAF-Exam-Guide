// Composition root for the model adapter.
//
// Default: mockAdapter (no API key, no network).
// v0.3 will add WebLLM (browser-native) and Ollama / LM Studio auto-detect.
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
export type * from './types';
