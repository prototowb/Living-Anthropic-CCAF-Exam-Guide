// Composition root for the SDK adapter.
//
// Default: mockAdapter (no API key, no network).
// To swap in a real adapter, call setAdapter(createRealAdapter(apiKey)).
//
// Session-only API-key holder (v0.5.0):
// connectRealSdk(key) / disconnectRealSdk() let the Tutor view opt-in to the
// real Anthropic SDK *for the current session only*. The key lives in a Vue
// `shallowRef` — page refresh wipes it. NOT persisted (no localStorage, no
// sessionStorage). Not logged.

import { shallowRef, readonly, type Ref, type DeepReadonly } from 'vue';
import { mockAdapter } from './mockAdapter';
import { createRealAdapter } from './realAdapter';
import type { SdkAdapter } from './types';

const currentRef = shallowRef<SdkAdapter>(mockAdapter);

export function getAdapter(): SdkAdapter {
  return currentRef.value;
}

export function setAdapter(next: SdkAdapter) {
  currentRef.value = next;
}

/** Reactive readonly accessor for components that want to render on adapter changes. */
export function useAdapterRef(): DeepReadonly<Ref<SdkAdapter>> {
  return readonly(currentRef);
}

// ---------------------------------------------------------------------------
// Session-only API key holder. In memory only; never persisted.
// ---------------------------------------------------------------------------
const sessionKey = shallowRef<string | null>(null);
const realConnected = shallowRef(false);

export function useRealSdkStatus(): DeepReadonly<Ref<boolean>> {
  return readonly(realConnected);
}

/** Last-4 mask for UI display. Returns null when not connected. */
export function getSessionKeyMasked(): string | null {
  const k = sessionKey.value;
  if (!k) return null;
  return k.length > 8 ? `sk-ant-…${k.slice(-4)}` : 'sk-ant-…';
}

export function connectRealSdk(
  apiKey: string,
): { ok: true } | { ok: false; error: string } {
  const trimmed = apiKey.trim();
  if (!trimmed) return { ok: false, error: 'API key is required.' };
  if (!trimmed.startsWith('sk-ant-')) {
    return { ok: false, error: 'Anthropic API keys start with sk-ant-.' };
  }
  sessionKey.value = trimmed;
  setAdapter(createRealAdapter(trimmed));
  realConnected.value = true;
  return { ok: true };
}

export function disconnectRealSdk() {
  sessionKey.value = null;
  setAdapter(mockAdapter);
  realConnected.value = false;
}

export { mockAdapter };
export { createRealAdapter };
export type * from './types';
