// WebLLM adapter — browser-native local model via WebGPU (PROJECT_PLAN.md §7a).
//
// The model (default: Llama 3.2 3B Instruct, ~2 GB quantised) downloads into
// the browser cache on first use and runs in-tab. No separate process.
//
// Bundle discipline: `@mlc-ai/web-llm` is imported ONLY via a lazy
// `await import(...)` inside ensureEngine(), so Vite splits it into its own
// async chunk and the 200 KB gzip budget on the main chunk
// (scripts/check-bundle-size.js) is unaffected. Only `import type` at the
// top level — erased at compile time.
//
// Capabilities:
//  - nativeToolUse: false — 3B models emit unreliable tool_use.
//  - parallelSubagents: false — one in-tab engine (~3 GB memory), never
//    dispatch spokes in parallel against it.
//  - schemaMode: true — WebLLM's `response_format` with a schema string is
//    grammar-constrained (XGrammar), a genuine strong suit even at 3B.

import type { MLCEngine } from '@mlc-ai/web-llm';
import type { CreateMessageOptions, CreateMessageResponse, SdkAdapter } from './types';
import { buildOpenAiMessages, mapChatCompletionResponse } from './openaiCompat';
import type { OpenAiChatResponse } from './openaiCompat';

export const WEBLLM_DEFAULT_MODEL = 'Llama-3.2-3B-Instruct-q4f16_1-MLC';

export interface WebLlmProgress {
  /** 0..1 */
  progress: number;
  /** Human-readable stage, e.g. "Fetching param shard 12/48". */
  text: string;
}

export function webGpuAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

// Module-level so the ~2 GB download + engine init happens once per tab,
// no matter how many times the adapter is constructed.
let enginePromise: Promise<MLCEngine> | null = null;

function ensureEngine(
  model: string,
  onProgress?: (p: WebLlmProgress) => void,
): Promise<MLCEngine> {
  if (!webGpuAvailable()) {
    return Promise.reject(
      new Error(
        'WebLLM needs WebGPU, which this browser does not expose. ' +
          'Use Chrome, Edge, or a recent Safari — or pick another adapter in /settings.',
      ),
    );
  }
  if (!enginePromise) {
    enginePromise = (async () => {
      const webllm = await import('@mlc-ai/web-llm');
      return webllm.CreateMLCEngine(model, {
        initProgressCallback: (report) =>
          onProgress?.({ progress: report.progress, text: report.text }),
      });
    })();
    // A failed init (offline mid-download, quota) must not poison the tab.
    enginePromise.catch(() => {
      enginePromise = null;
    });
  }
  return enginePromise;
}

export function createWebLlmAdapter(opts?: {
  model?: string;
  onProgress?: (p: WebLlmProgress) => void;
}): SdkAdapter {
  const model = opts?.model ?? WEBLLM_DEFAULT_MODEL;
  return {
    kind: 'webllm',
    label: `WebLLM (${model})`,
    capabilities: {
      nativeToolUse: false,
      parallelSubagents: false,
      schemaMode: true,
    },
    async createMessage<T = unknown>(
      callOpts: CreateMessageOptions<T>,
    ): Promise<CreateMessageResponse<T>> {
      const engine = await ensureEngine(model, opts?.onProgress);
      const completion = await engine.chat.completions.create({
        messages: buildOpenAiMessages(callOpts),
        response_format: callOpts.jsonSchema
          ? { type: 'json_object', schema: JSON.stringify(callOpts.jsonSchema) }
          : undefined,
      });
      return mapChatCompletionResponse<T>(
        completion as unknown as OpenAiChatResponse,
        callOpts,
      );
    },
  };
}

/**
 * Pre-warm the engine (download + init) without sending a message.
 * SettingsView's "Download now" button calls this so the ~2 GB fetch is an
 * explicit user action, never a side effect of page load.
 */
export function prewarmWebLlm(opts?: {
  model?: string;
  onProgress?: (p: WebLlmProgress) => void;
}): Promise<void> {
  return ensureEngine(opts?.model ?? WEBLLM_DEFAULT_MODEL, opts?.onProgress).then(
    () => undefined,
  );
}
