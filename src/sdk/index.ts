// Composition root for the SDK adapter.
//
// Default: mockAdapter (no API key, no network).
// To swap in a real adapter, call setAdapter(createRealAdapter(apiKey)).

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
