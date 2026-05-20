// Mandated Structured Error Response shape
// (Architect Scenarios 1 + 4 — Tool Design & MCP Integration; TS 2.2).
//
// Widened in v0.2 per sprints/SYNTHESIS.md S-1. The two-valued ErrorCategory
// was insufficient: validation errors (regex too broad, multi-match clarification)
// were being mis-classified as `business`, and permission denials had no home.
//
//   transient   → retry is appropriate (network blip, rate limit). isRetryable: true.
//   validation  → input shape / arguments wrong (regex too broad, multi-match).
//                 Caller can adjust the input and retry. isRetryable: true.
//   business    → semantic miss (not found, ambiguous source, partial extraction).
//                 Caller must change strategy. isRetryable: false.
//   permission  → tool denied (settings.json deny list, scope guard).
//                 Surface to the user. isRetryable: false.
//
// Tools never throw. They always return one of the two shapes below.

export type ErrorCategory = 'transient' | 'validation' | 'business' | 'permission';

export type ToolResponse<T> =
  | { isError: false; data: T }
  | {
      isError: true;
      errorCategory: ErrorCategory;
      /** Whether the caller can profitably retry the SAME call. Validation +
       *  transient errors are retryable (after adjusting input or waiting);
       *  business + permission errors are not — the strategy must change. */
      isRetryable: boolean;
      message: string;
    };

export function ok<T>(data: T): ToolResponse<T> {
  return { isError: false, data };
}

const RETRYABLE: Record<ErrorCategory, boolean> = {
  transient: true,
  validation: true,
  business: false,
  permission: false,
};

export function fail<T = never>(
  errorCategory: ErrorCategory,
  message: string,
  override?: { isRetryable?: boolean },
): ToolResponse<T> {
  return {
    isError: true,
    errorCategory,
    isRetryable: override?.isRetryable ?? RETRYABLE[errorCategory],
    message,
  };
}
