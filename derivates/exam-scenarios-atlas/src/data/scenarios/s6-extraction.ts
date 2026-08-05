import type { Scenario } from '../types'

const foils: Scenario['foils'] = [
  {
    title: 'Asking nicely for JSON',
    ref: 'TS 4.3',
    wrong: {
      label: 'Format-by-request',
      lang: 'md',
      body: `Please respond with valid JSON only, in exactly
this format: { "vendor": …, "line_items": […] }
# "Sure! Here's the JSON you asked for:\\n\\\`\\\`\\\`json …"`,
    },
    right: {
      label: 'Schema-constrained tool use',
      lang: 'ts',
      body: `tools: [{ name: "record_invoice",
  input_schema: INVOICE_SCHEMA }],   // checked into the repo
tool_choice: { type: "tool", name: "record_invoice" }
// The API guarantees shape; the validator guards semantics.`,
    },
    failure:
      'Prose-wrapped JSON, trailing commentary, and drifting field names break the parser on item 800 of 10,000 — format must be constrained, not requested.',
  },
  {
    title: 'Unbounded retry on validation failure',
    ref: 'TS 4.4',
    wrong: {
      label: 'while (!valid) retry',
      lang: 'ts',
      body: `while (!validate(out)) {
  out = await extract(doc); // same prompt, same doc,
}                           // token bill: unbounded`,
    },
    right: {
      label: 'Bounded retry, error fed back, then flag',
      lang: 'ts',
      body: `for (let i = 0; i < 2; i++) {
  out = await extract(doc, lastError); // validator msg appended
  if (validate(out)) return out;
  lastError = validate.errors;
}
return flagForHuman(doc, lastError); // business, not transient`,
    },
    failure:
      'Some inputs are genuinely unextractable; retrying identically forever turns one bad scan into an unbounded spend with no signal to a human.',
  },
]

export const scenario6: Scenario = {
  id: 'structured-extraction',
  number: 6,
  title: 'Structured Data Extraction',
  hook: 'tool_use with JSON schemas eliminates syntax errors; validation-retry handles semantics; confidence scores route human review.',
  brief:
    'You are building a structured data extraction system using Claude. The system extracts information from unstructured documents, validates the output using JSON schemas, and maintains high accuracy. It must handle edge cases gracefully and integrate with downstream systems.',
  primaryDomains: [4, 5],
  example: {
    title: 'Invoices from 40 vendors, none formatted alike',
    body:
      'You\'re extracting line items + totals from invoices in PDF, email, scan-OCR, and Word formats. tool_use with a strict schema kills JSON syntax errors. But "line items sum to total" is a semantic check — the schema can\'t enforce it. Add a calculated_total field alongside stated_total and let the model surface the discrepancy.',
  },
  infographic: {
    kind: 'extraction-pipeline',
    caption:
      'tool_use → schema validation → retry-with-error-feedback → confidence routing. Stratified sampling validates high-confidence extractions before reducing human review.',
  },
  flow: [
    {
      label: 'Force structured output with tool_use',
      body: 'Define an extract_invoice tool with the schema as its input_schema. Set tool_choice: { type: "tool", name: "extract_invoice" } so the model MUST call it — no chance of returning plain text.',
      mandate: 'TS 4.3 · tool_use + schema beats "return JSON in your reply".',
    },
    {
      label: 'Schema design',
      body: 'Required vs optional fields. Nullable for fields that may not exist in source. enum with "other" + detail string for extensible categorisation. Forces the model to admit "I don\'t know" rather than fabricate.',
      mandate: 'TS 4.3 · nullable optional fields prevent hallucinated values.',
    },
    {
      label: 'Few-shot for varied formats',
      body: '2–4 worked examples covering inline vs tabular invoices, narrative vs bulleted line items. Few-shot teaches generalisation, not memorisation.',
      mandate: 'TS 4.2 · Few-shot examples for output-format consistency.',
    },
    {
      label: 'Validate → retry on schema failure',
      body: 'Pydantic validates. On failure: feed back the document + the failed extraction + the specific error. Format errors retry well; absent-source errors don\'t.',
      stopReason: 'tool_use',
      mandate: 'TS 4.4 · Retries fix structural errors; they cannot conjure missing facts.',
    },
    {
      label: 'Semantic validation',
      body: 'Model emits calculated_total alongside stated_total. A separate validator flags discrepancies. Adds conflict_detected boolean for source-data inconsistencies.',
      mandate: 'TS 4.4 · Semantic validators catch what tool_use schemas cannot.',
    },
    {
      label: 'Confidence routing',
      body: 'Each field carries a confidence score, calibrated on a labelled validation set. Low-confidence extractions route to a human reviewer. Accuracy is measured per document-type per field — never aggregate alone.',
      mandate: 'TS 5.5 · Per-doc-type per-field accuracy hides aggregate blind spots.',
    },
    {
      label: 'Batch for non-blocking, sync for blocking',
      body: '10k overnight invoices → Message Batches API (50% cheaper). Failed extractions identified by custom_id and resubmitted with chunking.',
      stopReason: 'end_turn',
      mandate: 'TS 4.5 · Batch API for latency-tolerant workloads.',
    },
  ],
  code: [
    {
      lang: 'py',
      label: 'Extraction tool with schema',
      body: `from anthropic import Anthropic
import json

client = Anthropic()

EXTRACT_TOOL = {
    "name": "extract_invoice",
    "description": "Extract structured fields from an invoice document.",
    "input_schema": {
        "type": "object",
        "required": ["vendor", "line_items", "stated_total", "calculated_total", "currency"],
        "properties": {
            "vendor": {"type": "string"},
            "invoice_number": {"type": ["string", "null"]},
            "invoice_date": {"type": ["string", "null"], "format": "date"},
            "currency": {"enum": ["USD", "EUR", "GBP", "JPY", "other"]},
            "currency_other": {"type": ["string", "null"]},
            "line_items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": ["description", "amount"],
                    "properties": {
                        "description": {"type": "string"},
                        "amount": {"type": "number"},
                        "confidence": {"type": "number", "minimum": 0, "maximum": 1},
                    },
                },
            },
            "stated_total": {"type": "number"},
            # Model also computes the sum from line_items — surfaces discrepancies.
            "calculated_total": {"type": "number"},
            "conflict_detected": {"type": "boolean"},
        },
    },
}

resp = client.messages.create(
    model="claude-opus-4-7",
    max_tokens=2048,
    tools=[EXTRACT_TOOL],
    tool_choice={"type": "tool", "name": "extract_invoice"},   # FORCE the call
    messages=[{"role": "user", "content": [{"type": "document", "source": invoice}]}],
)
tool_use = next(b for b in resp.content if b.type == "tool_use")
extraction = tool_use.input`,
    },
    {
      lang: 'py',
      label: 'Validate → retry with feedback',
      body: `from pydantic import BaseModel, ValidationError

class Invoice(BaseModel):
    vendor: str
    stated_total: float
    calculated_total: float
    # ... full model

def extract_with_retry(document, max_retries=2):
    messages = [{"role": "user", "content": [doc_block(document)]}]
    last_err = None

    for attempt in range(max_retries + 1):
        resp = call_claude(messages, EXTRACT_TOOL)
        try:
            invoice = Invoice.model_validate(resp.tool_use.input)
            return invoice
        except ValidationError as e:
            last_err = e
            # Retries help with FORMAT issues. They don't help when info is absent.
            if not is_format_error(e):
                raise IrrecoverableExtractionError(e)
            messages.append({"role": "assistant", "content": resp.content})
            messages.append({
                "role": "user",
                "content": [{
                    "type": "text",
                    "text": f"Validation failed: {e}. Re-extract correcting these fields only.",
                }],
            })

    raise last_err`,
    },
    {
      lang: 'py',
      label: 'Confidence routing + stratified sampling',
      body: `def route_for_review(invoice, doc_type):
    # Per-doc-type thresholds calibrated on labelled validation set.
    threshold = THRESHOLDS[doc_type]
    if invoice.conflict_detected or min(li.confidence for li in invoice.line_items) < threshold:
        return "human_review"
    return "auto_approve"

# Even high-confidence extractions get sampled for ongoing error-rate measurement.
def stratified_sample(high_conf_extractions, n_per_stratum=20):
    by_type = group_by(high_conf_extractions, key=lambda x: x.doc_type)
    sampled = []
    for doc_type, items in by_type.items():
        sampled.extend(random.sample(items, min(n_per_stratum, len(items))))
    return sampled  # → reviewer queue, novel error pattern detection`,
    },
    {
      lang: 'py',
      label: 'Batch 10k invoices overnight',
      body: `requests = [
    {
        "custom_id": f"inv-{inv.id}",
        "params": {
            "model": "claude-opus-4-7",
            "max_tokens": 2048,
            "tools": [EXTRACT_TOOL],
            "tool_choice": {"type": "tool", "name": "extract_invoice"},
            "messages": [{"role": "user", "content": [doc_block(inv)]}],
        },
    }
    for inv in invoices
]

batch = client.messages.batches.create(requests=requests)
# Poll status until completed; correlate responses back to invoice id via custom_id.
# Failed items? Resubmit only those (e.g., chunk if context overflow).`,
    },
  ],
  qna: [
    {
      q: 'You want to extract structured data from invoices and guarantee the output is schema-conformant JSON. Which approach gives the strongest guarantee?',
      options: [
        { key: 'A', text: 'Ask in the prompt: "Return only valid JSON, no other text." Rely on the model\'s instruction-following.' },
        { key: 'B', text: 'Define a tool with the schema as its input_schema and set tool_choice: { type: "tool", name: "extract_invoice" } so the model MUST call that tool.' },
        { key: 'C', text: 'Parse the raw text output and use a JSON repair library to fix any errors.' },
        { key: 'D', text: 'Provide 10 few-shot examples of properly formatted output and trust the model to generalise.' },
      ],
      correct: 'B',
      explain:
        'tool_use with a JSON schema is the strongest guarantee — the SDK rejects malformed structures and the model is forced to call the tool when tool_choice is set. A is probabilistic. C reacts after the fact and can\'t fix semantic errors. D improves quality but doesn\'t guarantee structural validity.',
      ref: 'TS 4.3',
    },
    {
      q: 'A validation-retry loop catches a schema failure: the model returned a stated_total of 1240 but the line items only sum to 1115. Will retry-with-feedback fix this?',
      options: [
        { key: 'A', text: 'Yes — sending the validation error back to the model always corrects discrepancies.' },
        { key: 'B', text: 'Maybe — retries help when the format is wrong, but if the source document is the ambiguity (mistyped total, missing line item), the model cannot conjure the missing fact.' },
        { key: 'C', text: 'No — schema-only retries cannot detect arithmetic discrepancies at all.' },
        { key: 'D', text: 'Yes — but only if the schema marks stated_total as nullable.' },
      ],
      correct: 'B',
      explain:
        'Retries fix structural/format errors. They cannot fix semantic problems whose root cause is the source document — if the invoice itself is inconsistent, the right move is to flag conflict_detected and route to human review, not to keep retrying. C is wrong because we can detect the discrepancy via calculated_total vs stated_total. D doesn\'t address the cause.',
      ref: 'TS 4.4',
    },
    {
      q: 'Your extraction pipeline reports 97% aggregate accuracy across all document types and fields. The product team wants to auto-approve all high-confidence extractions without human review. What is the safest next step?',
      options: [
        { key: 'A', text: 'Auto-approve — 97% is well above the agreed accuracy bar.' },
        { key: 'B', text: 'Break the aggregate down by document type and by field, calibrate per-segment thresholds against labelled data, and stratified-sample high-confidence outputs for ongoing error-rate measurement.' },
        { key: 'C', text: 'Add an extra LLM-as-judge pass on every extraction before auto-approving.' },
        { key: 'D', text: 'Set tool_choice to "any" to encourage richer output, then auto-approve.' },
      ],
      correct: 'B',
      explain:
        'Aggregate accuracy hides poor performance on specific document types or fields. The right move is to slice accuracy per-doc-type per-field, calibrate confidence thresholds against labelled data, and use stratified random sampling to catch novel error patterns even in high-confidence extractions. A is dangerous. C adds cost without addressing the measurement gap. D conflates output enforcement with quality measurement.',
      ref: 'TS 5.5',
    },
  ],
  foils,
  takeaways: [
    'tool_use + JSON schema + forced tool_choice = guaranteed structural validity.',
    'Schemas catch syntax; calculated-vs-stated fields and conflict_detected catch semantics.',
    'Per-doc-type per-field accuracy + stratified sampling > aggregate accuracy.',
  ],
}
