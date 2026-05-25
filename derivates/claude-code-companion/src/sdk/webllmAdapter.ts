// WebLLM adapter stub.
//
// Placeholder for the v0.5 browser-native local model (PROJECT_PLAN.md §7a).
// Interface-compliant and selectable in /settings; createMessage throws.
//
// All capability flags are `false` — when the Tutor or Help Bot branches on
// capabilities at construction time, they pick the degradation path. They
// will still call createMessage, which throws — that's the honest signal
// "you picked an unwired adapter; pick another."
//
// v0.5 implementation: lazy `await import('@mlc-ai/web-llm')` inside this
// createMessage (keeps the WebLLM bundle out of the default Vite chunk).

import type { CreateMessageResponse, SdkAdapter } from './types';

export function createWebLlmAdapter(): SdkAdapter {
  return {
    kind: 'webllm',
    label: 'WebLLM (stub — v0.5)',
    capabilities: {
      nativeToolUse: false,
      parallelSubagents: false,
      schemaMode: false,
    },
    async createMessage<T = unknown>(): Promise<CreateMessageResponse<T>> {
      throw new Error(
        'WebLLM adapter is not yet wired. Switch to Mock or Real Claude in /settings, or wait for v0.5.',
      );
    },
  };
}
