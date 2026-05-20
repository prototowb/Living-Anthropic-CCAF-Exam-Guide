// MockUnreliableAdapter — a synthetic adapter that advertises *no* native
// tool_use, no parallel subagents, and no schema mode. Used to regression-
// test the capabilities-aware fallback paths in Scenarios 1, 3, 4, 6 without
// actually loading a 3 GB WebLLM weight or spinning up Ollama.
//
// SYNTHESIS.md S-3 (dispatchAllSettled regression coverage), S-6 (parse.ts
// retry path), Scenario 3 v0.3 task 6, Scenario 6 v0.3 task 7.
//
// Behaviour:
//   - jsonSchema requested → returns JSON-in-prose (not native tool_use).
//     The caller is expected to use `extractFirstJsonObject` from parse.ts.
//   - Free-form requests → returns a deterministic flat reply.
//   - Optional throw mode for spoke-failure regression (Scenario 3 v0.3).
//
// File path uses double-underscores so Vite's source-index filter excludes it
// from the codebase-researcher bundle (test fixtures don't belong in /tutor).

import type {
  AdapterCapabilities,
  CreateMessageOptions,
  CreateMessageResponse,
  SdkAdapter,
} from '../types';

export interface UnreliableAdapterOptions {
  /** When true, every `createMessage` call throws — for spoke-failure tests. */
  alwaysThrow?: boolean;
  /** When set, requests whose user prompt contains this substring throw. */
  throwOnMatch?: string;
  /** Override the default capabilities. */
  capabilities?: Partial<AdapterCapabilities>;
  /** Latency stub. Default 50ms. */
  latencyMs?: number;
}

const DEFAULT_CAPS: AdapterCapabilities = {
  nativeToolUse: false,
  parallelSubagents: false,
  schemaMode: false,
};

export function createUnreliableAdapter(
  options: UnreliableAdapterOptions = {},
): SdkAdapter {
  const caps: AdapterCapabilities = { ...DEFAULT_CAPS, ...options.capabilities };
  const latency = options.latencyMs ?? 50;

  return {
    kind: 'webllm', // pretend we're a browser-native local adapter (v0.3 story)
    label: `Unreliable mock (caps: nt=${caps.nativeToolUse} ps=${caps.parallelSubagents} sm=${caps.schemaMode})`,
    capabilities: caps,

    async createMessage<T = unknown>(
      opts: CreateMessageOptions<T>,
    ): Promise<CreateMessageResponse<T>> {
      await new Promise((r) => setTimeout(r, latency));

      const userMsg = [...opts.messages].reverse().find((m) => m.role === 'user');
      const prompt = userMsg?.content ?? '';

      if (options.alwaysThrow) {
        throw new Error('UnreliableAdapter: alwaysThrow=true');
      }
      if (options.throwOnMatch && prompt.includes(options.throwOnMatch)) {
        throw new Error(`UnreliableAdapter: prompt matched throwOnMatch="${options.throwOnMatch}"`);
      }

      // Schema branch — fabricate JSON-in-prose so the caller's parser path
      // gets exercised. We pick an arbitrary minimal payload that satisfies
      // the most common tutor / extraction schemas at runtime.
      if (opts.jsonSchema) {
        const fauxPayload = guessSchemaPayload(opts.jsonSchema, prompt);
        const text = `Here is the result:\n\n\`\`\`json\n${JSON.stringify(fauxPayload, null, 2)}\n\`\`\`\n\nLet me know if you need anything else.`;
        return {
          text,
          // Notably: NO `data` field. The caller must parse `text` via
          // parse.ts's `extractFirstJsonObject`. That's the unreliable-
          // adapter regression.
          stopReason: 'end_turn',
          usage: rough(prompt, text),
        };
      }

      // Free-form branch — fixed flat reply.
      const text = `[unreliable-mock] echo: ${prompt.slice(0, 80)}`;
      return {
        text,
        stopReason: 'end_turn',
        usage: rough(prompt, text),
      };
    },
  };
}

function rough(promptText: string, replyText: string) {
  return {
    inputTokens: Math.ceil(promptText.length / 4),
    outputTokens: Math.ceil(replyText.length / 4),
  };
}

/** Best-effort payload generator for a JSON schema. Recognises the small set
 *  of shapes the companion ships; returns a plausible object so the calling
 *  validator (Ajv etc.) actually has something to chew on. */
function guessSchemaPayload(
  schema: Record<string, unknown>,
  _prompt: string,
): unknown {
  const props = (schema.properties ?? {}) as Record<string, unknown>;
  // Tutor intent classifier — { subagents, rationale }
  if ('subagents' in props && 'rationale' in props) {
    return { subagents: ['explainer'], rationale: 'unreliable-mock default route' };
  }
  // Glossary / extraction documents.
  if ('entries' in props) {
    return { entries: [] };
  }
  if ('scenarios' in props) {
    return { scenarios: [] };
  }
  return {};
}
