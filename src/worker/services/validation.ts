import { ApiError } from "./errors";
import type { ItemInput } from "../types/item";

const MAX_JSON_BYTES = 16 * 1024;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseItemId(rawId: string): number {
  if (!/^[1-9]\d{0,15}$/.test(rawId)) {
    throw new ApiError(400, "bad_request", "Item id must be a positive integer.");
  }

  const id = Number(rawId);
  if (!Number.isSafeInteger(id)) {
    throw new ApiError(400, "bad_request", "Item id is outside the supported range.");
  }
  return id;
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    throw new ApiError(415, "unsupported_media_type", "Content-Type must be application/json.");
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_JSON_BYTES) {
    throw new ApiError(413, "payload_too_large", "JSON body is too large.");
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_JSON_BYTES) {
    throw new ApiError(413, "payload_too_large", "JSON body is too large.");
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(400, "bad_request", "Request body contains invalid JSON.");
  }
}

export function validateItemInput(value: unknown): ItemInput {
  if (!isRecord(value)) {
    throw new ApiError(400, "bad_request", "Request body must be a JSON object.");
  }

  const allowedKeys = new Set(["name", "description"]);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
    throw new ApiError(400, "bad_request", "Request body contains unsupported fields.");
  }

  if (typeof value.name !== "string") {
    throw new ApiError(400, "bad_request", "name must be a string.");
  }
  const name = value.name.trim();
  if (name.length < 1 || name.length > 100) {
    throw new ApiError(400, "bad_request", "name must contain 1 to 100 characters.");
  }

  const description = value.description ?? "";
  if (typeof description !== "string" || description.length > 1000) {
    throw new ApiError(400, "bad_request", "description must be a string of at most 1000 characters.");
  }

  return { name, description };
}

export function validateObjectKey(key: string): string {
  if (
    key.length < 1 ||
    key.length > 128 ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(key) ||
    key.includes("..")
  ) {
    throw new ApiError(
      400,
      "bad_request",
      "File key must be 1-128 safe characters and may only use letters, numbers, dot, underscore, or hyphen.",
    );
  }
  return key;
}

