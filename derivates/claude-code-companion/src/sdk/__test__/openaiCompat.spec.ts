// Regression harness for the OpenAI-compat plumbing shared by the ollama /
// lm-studio / webllm adapters (v0.5). Like dispatch.spec.ts this is NOT a
// Vitest spec — no test runner is installed — it exports
// `runOpenAiCompatRegression()` for the /debug view.
//
// Everything under test is pure (no fetch), so the harness runs instantly
// and offline: message ordering, response_format inclusion, finish_reason
// mapping, usage defaults, and safe-parse behaviour on malformed JSON.

import {
  buildChatCompletionBody,
  buildOpenAiMessages,
  mapChatCompletionResponse,
  pickDefaultModel,
} from '../openaiCompat';

export interface CompatRegressionResult {
  pass: boolean;
  reasons: string[];
  checksRun: number;
}

export async function runOpenAiCompatRegression(): Promise<CompatRegressionResult> {
  const reasons: string[] = [];
  let checksRun = 0;
  const check = (cond: boolean, label: string) => {
    checksRun++;
    if (!cond) reasons.push(label);
  };

  // 1. Message ordering: system → few-shot pairs → conversation.
  const msgs = buildOpenAiMessages({
    system: 'SYS',
    fewShot: [{ user: 'FU', assistant: 'FA' }],
    messages: [
      { role: 'user', content: 'U1' },
      { role: 'assistant', content: 'A1' },
      { role: 'user', content: 'U2' },
    ],
  });
  check(
    msgs.map((m) => `${m.role}:${m.content}`).join('|') ===
      'system:SYS|user:FU|assistant:FA|user:U1|assistant:A1|user:U2',
    `message ordering wrong: got ${JSON.stringify(msgs)}`,
  );

  // 2. No system / no few-shot → conversation only.
  const bare = buildOpenAiMessages({ messages: [{ role: 'user', content: 'U' }] });
  check(
    bare.length === 1 && bare[0].role === 'user',
    'bare options should produce exactly the conversation messages',
  );

  // 3. response_format present iff jsonSchema is passed.
  const schema = { title: 'T', type: 'object' };
  const withSchema = buildChatCompletionBody(
    { messages: [{ role: 'user', content: 'U' }], jsonSchema: schema },
    'm1',
  );
  check(
    withSchema.response_format?.type === 'json_schema' &&
      withSchema.response_format.json_schema.schema === schema &&
      withSchema.response_format.json_schema.strict === true,
    'jsonSchema should produce a strict json_schema response_format',
  );
  const withoutSchema = buildChatCompletionBody(
    { messages: [{ role: 'user', content: 'U' }] },
    'm1',
  );
  check(
    withoutSchema.response_format === undefined,
    'response_format must be absent without jsonSchema',
  );
  check(withSchema.model === 'm1', 'model must be threaded into the body');

  // 4. finish_reason mapping + usage passthrough.
  const mapped = mapChatCompletionResponse(
    {
      choices: [{ message: { content: 'hello' }, finish_reason: 'length' }],
      usage: { prompt_tokens: 7, completion_tokens: 3 },
    },
    { messages: [] },
  );
  check(mapped.stopReason === 'max_tokens', 'finish_reason length → max_tokens');
  check(
    mapped.usage.inputTokens === 7 && mapped.usage.outputTokens === 3,
    'usage tokens must pass through',
  );
  check(mapped.text === 'hello', 'text must come from choices[0].message.content');

  const stopMapped = mapChatCompletionResponse(
    { choices: [{ message: { content: '' }, finish_reason: 'stop' }] },
    { messages: [] },
  );
  check(stopMapped.stopReason === 'end_turn', 'finish_reason stop → end_turn');
  check(
    stopMapped.usage.inputTokens === 0 && stopMapped.usage.outputTokens === 0,
    'missing usage must default to zeros',
  );

  const toolMapped = mapChatCompletionResponse(
    { choices: [{ message: { content: '' }, finish_reason: 'tool_calls' }] },
    { messages: [] },
  );
  check(toolMapped.stopReason === 'tool_use', 'finish_reason tool_calls → tool_use');

  // 5. Structured parse: valid JSON lands in data; malformed JSON must not throw.
  const goodData = mapChatCompletionResponse<{ a: number }>(
    { choices: [{ message: { content: '{"a":1}' }, finish_reason: 'stop' }] },
    { messages: [], jsonSchema: schema },
  );
  check(goodData.data?.a === 1, 'valid JSON text should populate data under jsonSchema');

  const badData = mapChatCompletionResponse(
    { choices: [{ message: { content: 'not json {' }, finish_reason: 'stop' }] },
    { messages: [], jsonSchema: schema },
  );
  check(
    badData.data === undefined && badData.text === 'not json {',
    'malformed JSON must yield data=undefined without throwing',
  );

  // 6. parser fallback (no jsonSchema): applied, and its throws are swallowed.
  const parsed = mapChatCompletionResponse<string>(
    { choices: [{ message: { content: 'xy' }, finish_reason: 'stop' }] },
    { messages: [], parser: (raw) => raw.toUpperCase() },
  );
  check(parsed.data === 'XY', 'parser should populate data when no jsonSchema');
  const throwingParser = mapChatCompletionResponse(
    { choices: [{ message: { content: 'xy' }, finish_reason: 'stop' }] },
    {
      messages: [],
      parser: () => {
        throw new Error('boom');
      },
    },
  );
  check(throwingParser.data === undefined, 'a throwing parser must not reject the call');

  // 7. Empty / null content defaults to ''.
  const nullContent = mapChatCompletionResponse(
    { choices: [{ message: { content: null }, finish_reason: 'stop' }] },
    { messages: [] },
  );
  check(nullContent.text === '', 'null content must map to empty text');

  // 8. pickDefaultModel: preferred match wins, else first, else undefined.
  check(
    pickDefaultModel(['qwen', 'llama3.2', 'phi'], /llama-?3\.2/i) === 'llama3.2',
    'pickDefaultModel should prefer the regex match',
  );
  check(
    pickDefaultModel(['qwen', 'phi'], /llama-?3\.2/i) === 'qwen',
    'pickDefaultModel should fall back to the first model',
  );
  check(
    pickDefaultModel([], /llama/i) === undefined,
    'pickDefaultModel on an empty list is undefined',
  );

  return { pass: reasons.length === 0, reasons, checksRun };
}
