// Mandated Structured Error Response shape (Domain 2).
//
//   transient → retry is appropriate (network blip, rate limit)
//   business  → caller must change strategy (not found, invalid input)
//
// Tools never throw. They always return one of the two shapes below.

export type ErrorCategory = 'transient' | 'business';

export type ToolResponse<T> =
  | { isError: false; data: T }
  | { isError: true; errorCategory: ErrorCategory; message: string };

export function ok<T>(data: T): ToolResponse<T> {
  return { isError: false, data };
}

export function fail<T = never>(
  errorCategory: ErrorCategory,
  message: string,
): ToolResponse<T> {
  return { isError: true, errorCategory, message };
}
