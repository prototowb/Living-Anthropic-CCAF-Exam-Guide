// Ollama adapter stub.
//
// Placeholder for the v0.5 local-server adapter (PROJECT_PLAN.md §7a).
// In v0.5 this will ping `localhost:11434` on construction, capability-detect
// model + tool support, and dispatch via Ollama's OpenAI-compatible chat
// endpoint. Today it just throws on createMessage.
//
// Capabilities are all `false` so the Tutor / Help Bot honest-degrade if
// someone activates this — they still call createMessage, which throws.

import type { CreateMessageResponse, SdkAdapter } from './types';

export function createOllamaAdapter(_opts?: { baseUrl?: string }): SdkAdapter {
  return {
    kind: 'ollama',
    label: 'Ollama (stub — auto-detect arrives v0.5)',
    capabilities: {
      nativeToolUse: false,
      parallelSubagents: false,
      schemaMode: false,
    },
    async createMessage<T = unknown>(): Promise<CreateMessageResponse<T>> {
      throw new Error(
        'Ollama adapter is not yet wired. Switch to Mock or Real Claude in /settings, or wait for v0.5.',
      );
    },
  };
}
