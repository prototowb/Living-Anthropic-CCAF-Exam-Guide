// LM Studio adapter — local server on localhost:1234 (PROJECT_PLAN.md §7a).
//
// Same OpenAI-compatible dispatch as ollamaAdapter; see that file for the
// capability rationale. One LM Studio-specific wrinkle: its local server has
// CORS OFF by default, so browser detection fails until the user enables
// CORS in the server settings (Developer tab) — the error message says so.

import type { CreateMessageOptions, CreateMessageResponse, SdkAdapter } from './types';
import { buildChatCompletionBody, mapChatCompletionResponse } from './openaiCompat';
import type { OpenAiChatResponse } from './openaiCompat';

export const LM_STUDIO_BASE_URL = 'http://localhost:1234';

export function createLmStudioAdapter(opts?: {
  baseUrl?: string;
  model?: string;
}): SdkAdapter {
  const baseUrl = opts?.baseUrl ?? LM_STUDIO_BASE_URL;
  const model = opts?.model ?? 'local-model';
  return {
    kind: 'lm-studio',
    label: `LM Studio (${model})`,
    capabilities: {
      nativeToolUse: false,
      parallelSubagents: false,
      schemaMode: true,
    },
    async createMessage<T = unknown>(
      callOpts: CreateMessageOptions<T>,
    ): Promise<CreateMessageResponse<T>> {
      let res: Response;
      try {
        res = await fetch(`${baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildChatCompletionBody(callOpts, model)),
        });
      } catch {
        throw new Error(
          `Could not reach LM Studio at ${baseUrl}. Start the local server in LM Studio's ` +
            'Developer tab and enable CORS in the server settings.',
        );
      }
      if (!res.ok) {
        throw new Error(
          `LM Studio returned HTTP ${res.status}. Check that a model is loaded and that ` +
            'your LM Studio version supports structured output (≥ 0.3).',
        );
      }
      const json = (await res.json()) as OpenAiChatResponse;
      return mapChatCompletionResponse<T>(json, callOpts);
    },
  };
}
