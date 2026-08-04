// Shared OpenAI-compatible chat-completions plumbing for the local adapters
// (ollamaAdapter, lmStudioAdapter) and message-shaping for webllmAdapter.
//
// Everything except the ping is pure (no fetch, no globals) so the /debug
// regression spec can exercise it without a server. Deliberately does NOT
// import from src/agents/** — the dependency direction is agents → sdk.
//
// Tools/toolChoice are intentionally ignored here: all three local adapters
// declare `nativeToolUse: false`, so the Tutor / Help Bot never hand them a
// tool roster (they take the JSON-in-prose path instead). `jsonSchema` IS
// honoured, via constrained decoding (`response_format: json_schema`) —
// supported by Ollama ≥ 0.5 and LM Studio ≥ 0.3.

import type {
  CreateMessageOptions,
  CreateMessageResponse,
  Message,
} from './types';

export interface OpenAiChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAiChatBody {
  model: string;
  messages: OpenAiChatMessage[];
  response_format?: {
    type: 'json_schema';
    json_schema: { name: string; schema: Record<string, unknown>; strict: boolean };
  };
}

/** system → few-shot pairs → conversation, in that order. */
export function buildOpenAiMessages(
  opts: Pick<CreateMessageOptions, 'system' | 'messages' | 'fewShot'>,
): OpenAiChatMessage[] {
  const out: OpenAiChatMessage[] = [];
  if (opts.system) out.push({ role: 'system', content: opts.system });
  for (const shot of opts.fewShot ?? []) {
    out.push({ role: 'user', content: shot.user });
    out.push({ role: 'assistant', content: shot.assistant });
  }
  for (const m of opts.messages as Message[]) {
    out.push({ role: m.role, content: m.content });
  }
  return out;
}

export function buildChatCompletionBody(
  opts: CreateMessageOptions,
  model: string,
): OpenAiChatBody {
  const body: OpenAiChatBody = { model, messages: buildOpenAiMessages(opts) };
  if (opts.jsonSchema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: { name: 'extract', schema: opts.jsonSchema, strict: true },
    };
  }
  return body;
}

function safeJsonParse(text: string): unknown | undefined {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Minimal slice of an OpenAI-compatible /v1/chat/completions response. */
export interface OpenAiChatResponse {
  choices?: Array<{
    message?: { content?: string | null };
    finish_reason?: string;
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

const STOP_REASON_MAP: Record<string, CreateMessageResponse['stopReason']> = {
  stop: 'end_turn',
  length: 'max_tokens',
  tool_calls: 'tool_use',
};

export function mapChatCompletionResponse<T = unknown>(
  json: OpenAiChatResponse,
  opts: CreateMessageOptions<T>,
): CreateMessageResponse<T> {
  const choice = json.choices?.[0];
  const text = choice?.message?.content ?? '';

  let data: T | undefined;
  if (opts.jsonSchema) {
    data = safeJsonParse(text) as T | undefined;
  } else if (opts.parser) {
    try {
      data = opts.parser(text);
    } catch {
      data = undefined;
    }
  }

  return {
    text,
    data,
    stopReason: STOP_REASON_MAP[choice?.finish_reason ?? ''] ?? 'end_turn',
    usage: {
      inputTokens: json.usage?.prompt_tokens ?? 0,
      outputTokens: json.usage?.completion_tokens ?? 0,
    },
  };
}

export interface PingResult {
  ok: boolean;
  models: string[];
}

/**
 * Probe an OpenAI-compatible server via GET {baseUrl}/v1/models.
 * Never throws — "not running" is an expected state, not an error.
 */
export async function pingOpenAiCompatServer(
  baseUrl: string,
  timeoutMs = 1500,
): Promise<PingResult> {
  try {
    const res = await fetch(`${baseUrl}/v1/models`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return { ok: false, models: [] };
    const json = (await res.json()) as { data?: Array<{ id?: string }> };
    const models = (json.data ?? [])
      .map((m) => m.id ?? '')
      .filter((id) => id.length > 0);
    return { ok: true, models };
  } catch {
    return { ok: false, models: [] };
  }
}

/** First model matching `preferred`, else the first available, else undefined. */
export function pickDefaultModel(
  models: string[],
  preferred: RegExp,
): string | undefined {
  return models.find((m) => preferred.test(m)) ?? models[0];
}
