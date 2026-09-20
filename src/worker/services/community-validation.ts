import { ApiError } from "./errors";

export type JsonRecord = Record<string, unknown>;

export function requireRecord(value: unknown): JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ApiError(400, "bad_request", "Request body must be a JSON object.");
  }
  return value as JsonRecord;
}

export function stringField(
  value: JsonRecord,
  field: string,
  minimum: number,
  maximum: number,
  optional = false,
): string {
  const raw = value[field];
  if (optional && (raw === undefined || raw === null || raw === "")) return "";
  if (typeof raw !== "string") {
    throw new ApiError(400, "bad_request", `${field} must be a string.`);
  }
  const normalized = raw.trim();
  if (normalized.length < minimum || normalized.length > maximum) {
    throw new ApiError(400, "bad_request", `${field} must contain ${minimum}-${maximum} characters.`);
  }
  return normalized;
}

export function enumField<T extends string>(
  value: JsonRecord,
  field: string,
  allowed: readonly T[],
): T {
  const raw = value[field];
  if (typeof raw !== "string" || !allowed.includes(raw as T)) {
    throw new ApiError(400, "bad_request", `${field} contains an unsupported value.`);
  }
  return raw as T;
}

export function integerField(value: JsonRecord, field: string, minimum: number, maximum: number): number {
  const raw = value[field];
  if (typeof raw !== "number" || !Number.isInteger(raw) || raw < minimum || raw > maximum) {
    throw new ApiError(400, "bad_request", `${field} must be an integer between ${minimum} and ${maximum}.`);
  }
  return raw;
}

export function booleanField(value: JsonRecord, field: string): boolean {
  if (typeof value[field] !== "boolean") {
    throw new ApiError(400, "bad_request", `${field} must be a boolean.`);
  }
  return value[field];
}

export function visitorId(value: JsonRecord): string {
  const id = stringField(value, "visitorId", 36, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new ApiError(400, "bad_request", "visitorId must be a valid UUID v4.");
  }
  return id.toLowerCase();
}

export async function hashVisitor(id: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(id));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function companyId(raw: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(raw)) {
    throw new ApiError(400, "bad_request", "Company id is invalid.");
  }
  return raw;
}
