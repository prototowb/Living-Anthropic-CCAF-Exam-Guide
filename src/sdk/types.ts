// Adapter contract used by the agent layer. The mock and the real Anthropic
// SDK both conform to this surface — swap at the composition root.

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CreateMessageOptions<T = unknown> {
  system?: string;
  messages: Message[];
  /**
   * When provided, the adapter SHALL return a value matching this JSON Schema.
   * This is the mandated mechanism for structured extraction (Domain 4).
   */
  jsonSchema?: Record<string, unknown>;
  /**
   * Few-shot examples injected into the prompt. Architect mandate: 2–4 examples
   * for ambiguous classification.
   */
  fewShot?: { user: string; assistant: string }[];
  /**
   * Optional structured-extraction parser. The mock returns `T`.
   */
  parser?: (raw: string) => T;
}

export interface CreateMessageResponse<T = string> {
  /** Free-form assistant text (always present). */
  text: string;
  /** Parsed structured response when `jsonSchema` was supplied. */
  data?: T;
  /** Tool calls Claude wants to make. The mock can emit these too. */
  toolUses?: { name: string; input: Record<string, unknown> }[];
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens';
  // Visible only for the showcase — real SDK responses include usage stats.
  usage: { inputTokens: number; outputTokens: number };
}

export interface SdkAdapter {
  readonly kind: 'mock' | 'real';
  createMessage<T = unknown>(
    opts: CreateMessageOptions<T>,
  ): Promise<CreateMessageResponse<T>>;
}
