export type ErrorCode =
  | "bad_request"
  | "not_found"
  | "length_required"
  | "payload_too_large"
  | "unsupported_media_type"
  | "unauthorized"
  | "forbidden"
  | "conflict"
  | "rate_limited"
  | "service_unavailable"
  | "internal_error";

export class ApiError extends Error {
  constructor(
    public readonly status: 400 | 401 | 403 | 404 | 409 | 411 | 413 | 415 | 429 | 503,
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorBody(code: ErrorCode, message: string) {
  return { error: { code, message } };
}
