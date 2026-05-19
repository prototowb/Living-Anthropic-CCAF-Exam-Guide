// Real Anthropic SDK adapter — wired up so the codebase truly *uses* the SDK,
// but NOT the default. Default is mockAdapter (no network, no key required).
//
// To enable: import { realAdapter } from './realAdapter' in src/sdk/index.ts
// and pass an apiKey. The browser-side use of dangerouslyAllowBrowser is for
// local development only — production would route through a backend proxy.

import Anthropic from '@anthropic-ai/sdk';
import type {
  CreateMessageOptions,
  CreateMessageResponse,
  SdkAdapter,
} from './types';

export function createRealAdapter(apiKey: string, model = 'claude-haiku-4-5-20251001'): SdkAdapter {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  return {
    kind: 'real',
    async createMessage<T = unknown>(
      opts: CreateMessageOptions<T>,
    ): Promise<CreateMessageResponse<T>> {
      const fewShot = (opts.fewShot ?? []).flatMap((ex) => [
        { role: 'user' as const, content: ex.user },
        { role: 'assistant' as const, content: ex.assistant },
      ]);

      const res = await client.messages.create({
        model,
        max_tokens: 1024,
        system: opts.system,
        messages: [
          ...fewShot,
          ...opts.messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        ],
      });

      const text = res.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n');

      let data: T | undefined;
      if (opts.jsonSchema && opts.parser) {
        try {
          data = opts.parser(text);
        } catch {
          // Caller will see undefined `data` and can fall back.
        }
      }

      return {
        text,
        data,
        stopReason: (res.stop_reason as CreateMessageResponse['stopReason']) ?? 'end_turn',
        usage: {
          inputTokens: res.usage.input_tokens,
          outputTokens: res.usage.output_tokens,
        },
      };
    },
  };
}
