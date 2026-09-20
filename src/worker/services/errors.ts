export type ErrorCode =
  | "bad_request"
  | "not_found"
  | "payload_too_large"
  | "unsupported_media_type"
  | "conflict"
  | "internal_error";

export class ApiError extends Error {
  constructor(
    public readonly status: 400 | 404 | 409 | 413 | 415,
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
