// LM Studio adapter stub.
//
// Placeholder for the v0.5 local-server adapter (PROJECT_PLAN.md §7a).
// In v0.5 this will ping `localhost:1234` and dispatch via LM Studio's
// OpenAI-compatible API. Today it just throws on createMessage.

import type { CreateMessageResponse, SdkAdapter } from './types';

export function createLmStudioAdapter(_opts?: { baseUrl?: string }): SdkAdapter {
  return {
    kind: 'lm-studio',
    label: 'LM Studio (stub — auto-detect arrives v0.5)',
    capabilities: {
      nativeToolUse: false,
      parallelSubagents: false,
      schemaMode: false,
    },
    async createMessage<T = unknown>(): Promise<CreateMessageResponse<T>> {
      throw new Error(
        'LM Studio adapter is not yet wired. Switch to Mock or Real Claude in /settings, or wait for v0.5.',
      );
    },
  };
}
