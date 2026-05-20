// Real Anthropic SDK adapter. Lifted from the parent, then materially extended in
// v0.2 (SYNTHESIS.md S-4 + Scenario 6 deepening promotion) so that `tools`,
// `toolChoice`, and `jsonSchema` actually flow through to the Messages API as
// tool_use. The pre-v0.2 implementation honoured none of these — a TS 4.3
// ("Enforce structured output using tool use and JSON schemas") violation.
//
// Default remains the mock; this adapter is only active when the user opts in
// via `setAdapter(createRealAdapter(apiKey))`.

import Anthropic from '@anthropic-ai/sdk';
import type {
  CreateMessageOptions,
  CreateMessageResponse,
  SdkAdapter,
  ToolChoice,
} from './types';

export function createRealAdapter(
  apiKey: string,
  model = 'claude-haiku-4-5-20251001',
): SdkAdapter {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  return {
    kind: 'real',
    label: `Anthropic SDK (${model})`,
    capabilities: {
      nativeToolUse: true,
      parallelSubagents: true,
      schemaMode: true,
    },

    async createMessage<T = unknown>(
      opts: CreateMessageOptions<T>,
    ): Promise<CreateMessageResponse<T>> {
      const fewShot = (opts.fewShot ?? []).flatMap((ex) => [
        { role: 'user' as const, content: ex.user },
        { role: 'assistant' as const, content: ex.assistant },
      ]);

      // Tool roster — explicit tools win; otherwise synthesize one from
      // `jsonSchema` so structured-output requests route through tool_use too.
      const tools = buildTools(opts);
      const toolChoice = buildToolChoice(opts, tools);

      // The SDK's `Tool.input_schema` is stricter than our generic adapter
      // contract — cast at this boundary rather than leaking SDK types into
      // the public CreateMessageOptions surface.
      const res = await client.messages.create({
        model,
        max_tokens: 1024,
        system: opts.system,
        messages: [
          ...fewShot,
          ...opts.messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        ],
        ...(tools ? { tools: tools as unknown as Anthropic.Tool[] } : {}),
        ...(toolChoice ? { tool_choice: toolChoice } : {}),
      });

      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n');

      // Capture every tool_use block — callers can act on them.
      const toolUses = res.content
        .filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
        .map((b) => ({ name: b.name, input: b.input as Record<string, unknown> }));

      // Structured-output resolution:
      //  1) If a tool_use named `extract` (or matching the forced tool name)
      //     came back, its input IS the validated data — no parser needed.
      //  2) Otherwise fall back to the caller's free-text parser if supplied.
      let data: T | undefined;
      const forcedToolName =
        opts.toolChoice && typeof opts.toolChoice === 'object'
          ? opts.toolChoice.name
          : 'extract';
      const structured = toolUses.find((t) => t.name === forcedToolName);
      if (structured) {
        data = structured.input as unknown as T;
      } else if (opts.jsonSchema && opts.parser && text) {
        try {
          data = opts.parser(text);
        } catch {
          // Caller sees undefined `data` and can fall back.
        }
      }

      return {
        text,
        data,
        toolUses: toolUses.length ? toolUses : undefined,
        stopReason:
          (res.stop_reason as CreateMessageResponse['stopReason']) ?? 'end_turn',
        usage: {
          inputTokens: res.usage.input_tokens,
          outputTokens: res.usage.output_tokens,
        },
      };
    },
  };
}

function buildTools<T>(opts: CreateMessageOptions<T>):
  | Array<{ name: string; description: string; input_schema: unknown }>
  | undefined {
  if (opts.tools && opts.tools.length) return opts.tools;
  if (opts.jsonSchema) {
    return [
      {
        name: 'extract',
        description:
          'Return structured output matching the supplied schema. Use this for any data extraction the caller requested.',
        input_schema: opts.jsonSchema,
      },
    ];
  }
  return undefined;
}

function buildToolChoice<T>(
  opts: CreateMessageOptions<T>,
  tools: ReturnType<typeof buildTools>,
): { type: 'auto' } | { type: 'any' } | { type: 'tool'; name: string } | undefined {
  if (!tools) return undefined;
  const choice: ToolChoice =
    opts.toolChoice ?? (opts.jsonSchema ? { type: 'tool', name: 'extract' } : 'auto');
  if (choice === 'auto') return { type: 'auto' };
  if (choice === 'any') return { type: 'any' };
  return choice;
}
