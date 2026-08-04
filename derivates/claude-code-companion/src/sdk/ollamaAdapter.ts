// Ollama adapter — local server on localhost:11434 (PROJECT_PLAN.md §7a).
//
// Dispatches via Ollama's OpenAI-compatible /v1/chat/completions endpoint.
// Detection (ping + model listing) is the caller's job — SettingsView pings
// via `pingOpenAiCompatServer` before offering this factory, and passes the
// detected model in. The factory itself stays synchronous and network-free.
//
// Capabilities:
//  - nativeToolUse: false — small local models emit unreliable tool_use;
//    the Help Bot falls back to JSON-in-prose + parser.
//  - parallelSubagents: false — one local engine, serial spokes.
//  - schemaMode: true — `response_format: json_schema` is constrained
//    decoding (Ollama ≥ 0.5 structured outputs), not prompt-hoping.

import type { CreateMessageOptions, CreateMessageResponse, SdkAdapter } from './types';
import { buildChatCompletionBody, mapChatCompletionResponse } from './openaiCompat';
import type { OpenAiChatResponse } from './openaiCompat';

export const OLLAMA_BASE_URL = 'http://localhost:11434';

export function createOllamaAdapter(opts?: {
  baseUrl?: string;
  model?: string;
}): SdkAdapter {
  const baseUrl = opts?.baseUrl ?? OLLAMA_BASE_URL;
  const model = opts?.model ?? 'llama3.2';
  return {
    kind: 'ollama',
    label: `Ollama (${model})`,
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
          `Could not reach Ollama at ${baseUrl}. Is it running? Start it with \`ollama serve\`. ` +
            'If this app is not served from localhost, set OLLAMA_ORIGINS to allow it.',
        );
      }
      if (!res.ok) {
        throw new Error(
          `Ollama returned HTTP ${res.status}. Check that the model "${model}" is pulled ` +
            `(\`ollama pull ${model}\`) and that your Ollama version supports structured outputs (≥ 0.5).`,
        );
      }
      const json = (await res.json()) as OpenAiChatResponse;
      return mapChatCompletionResponse<T>(json, callOpts);
    },
  };
}
