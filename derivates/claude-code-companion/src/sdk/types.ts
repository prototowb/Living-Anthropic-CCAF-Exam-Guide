// Adapter contract used by the agent layer. Mock, real Anthropic SDK, browser-native
// (WebLLM, v0.3), and auto-detected local server (Ollama / LM Studio, v0.3) all conform
// to this surface — swap at the composition root.
//
// The `capabilities` flag lets Tutor and Help Bot branch up front instead of
// feature-detecting per call. This is what keeps Scenarios 1 (MCP-shaped tools)
// and 3 (hub-and-spoke with parallel subagents) honest when a small local model
// is active (tool calling unreliable → degrade to JSON-in-prose + single subagent).

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Tool-choice configuration. Mirrors the Anthropic Messages API.
 * Added v0.2 per SYNTHESIS.md S-4 (covers TS 2.3 + TS 4.3).
 *
 *  - `auto` — model may return text instead of calling a tool. Default.
 *  - `any`  — model MUST call a tool but can pick which. Guarantees structured
 *             output when multiple extraction schemas exist and the document
 *             type is unknown.
 *  - `{ type: 'tool', name }` — force a specific named tool. Use to ensure a
 *             particular extraction runs before enrichment steps.
 */
export type ToolChoice =
  | 'auto'
  | 'any'
  | { type: 'tool'; name: string };

export interface CreateMessageOptions<T = unknown> {
  system?: string;
  messages: Message[];
  /**
   * When provided, the adapter SHALL return a value matching this JSON Schema.
   * Scenario 6 — structured-data extraction. Small local models do this well too
   * (JSON-mode / grammar-constrained generation).
   */
  jsonSchema?: Record<string, unknown>;
  /**
   * Tool roster the model may call. Each tool's `input_schema` should be a
   * sibling `*Spec` export (see SYNTHESIS.md S-2 + src/agents/tools/registry.ts).
   */
  tools?: Array<{ name: string; description: string; input_schema: unknown }>;
  /**
   * How aggressively the model should select a tool. See `ToolChoice` above.
   */
  toolChoice?: ToolChoice;
  /**
   * Few-shot examples injected into the prompt. 2–4 examples for ambiguous
   * classification (architect mandate).
   */
  fewShot?: { user: string; assistant: string }[];
  /**
   * Optional structured-extraction parser. The mock returns `T` directly.
   */
  parser?: (raw: string) => T;
}

export interface CreateMessageResponse<T = string> {
  text: string;
  data?: T;
  toolUses?: { name: string; input: Record<string, unknown> }[];
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens';
  usage: { inputTokens: number; outputTokens: number };
}

/**
 * What an adapter can do reliably. The Tutor and Help Bot read this and pick
 * code paths accordingly — they do NOT feature-detect at each call site.
 *
 * - `nativeToolUse`: the model emits well-formed tool_use blocks. Real Claude
 *   yes; small local models no (we fall back to JSON-in-prose + parser).
 * - `parallelSubagents`: safe to dispatch multiple subagents with Promise.all.
 *   Real Claude yes; small local models no (we serialise to one subagent).
 * - `schemaMode`: the adapter honours `jsonSchema` strictly (constrained gen).
 *   Real Claude + Ollama-with-JSON-mode + WebLLM-with-grammar yes; permissive
 *   adapters fall back to prompt-shaped JSON with a parser.
 */
export interface AdapterCapabilities {
  nativeToolUse: boolean;
  parallelSubagents: boolean;
  schemaMode: boolean;
}

export type AdapterKind = 'mock' | 'real' | 'webllm' | 'ollama' | 'lm-studio';

export interface SdkAdapter {
  readonly kind: AdapterKind;
  readonly capabilities: AdapterCapabilities;
  /** Human-readable label for the status bar. */
  readonly label: string;
  createMessage<T = unknown>(
    opts: CreateMessageOptions<T>,
  ): Promise<CreateMessageResponse<T>>;
}
