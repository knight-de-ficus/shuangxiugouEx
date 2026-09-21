import { Hono } from "hono";
import { ApiError } from "../services/errors";
import { validateObjectKey } from "../services/validation";
import type { AppEnv } from "../types/bindings";
import { requireAdmin } from "../services/security-controls";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const FILE_KEY_PREFIX = "files:";

interface StoredFileMetadata {
  contentType: string;
  size: number;
  etag: string;
}

function storageKey(key: string): string {
  return `${FILE_KEY_PREFIX}${key}`;
}

async function sha256Hex(value: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", value);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const fileRoutes = new Hono<AppEnv>();

fileRoutes.use("/*", async (context, next) => {
  await requireAdmin(context);
  await next();
});

fileRoutes.put("/:key", async (context) => {
  const key = validateObjectKey(context.req.param("key"));
  const contentLength = context.req.header("content-length");
  const declaredLength = Number(contentLength);
  if (!contentLength || !Number.isSafeInteger(declaredLength) || declaredLength < 0) {
    throw new ApiError(411, "length_required", "A valid Content-Length header is required.");
  }
  if (declaredLength > MAX_FILE_BYTES) {
    throw new ApiError(413, "payload_too_large", "File exceeds the 5 MiB example limit.");
  }

  const contentType = context.req.header("content-type") ?? "application/octet-stream";
  if (contentType.length > 128 || /[\r\n]/.test(contentType)) {
    throw new ApiError(400, "bad_request", "Content-Type is invalid.");
  }

  if (!context.req.raw.body) throw new ApiError(400, "bad_request", "File body is required.");

  const body = await context.req.arrayBuffer();
  if (body.byteLength > MAX_FILE_BYTES) {
    throw new ApiError(413, "payload_too_large", "File exceeds the 5 MiB example limit.");
  }
  if (body.byteLength !== declaredLength) {
    throw new ApiError(400, "bad_request", "Content-Length does not match the received file size.");
  }

  const etag = await sha256Hex(body);

  await context.env.FILES.put(storageKey(key), body, {
    metadata: { contentType, size: body.byteLength, etag } satisfies StoredFileMetadata,
  });

  return context.json({ key, size: body.byteLength, contentType, etag }, 201);
});

fileRoutes.get("/:key", async (context) => {
  const key = validateObjectKey(context.req.param("key"));
  const object = await context.env.FILES.getWithMetadata<StoredFileMetadata>(storageKey(key), "arrayBuffer");
  if (!object.value || !object.metadata) {
    throw new ApiError(404, "not_found", "File not found.");
  }

  const headers = new Headers({
    "Content-Type": object.metadata.contentType,
    "Content-Length": object.metadata.size.toString(),
    ETag: `"${object.metadata.etag}"`,
  });
  return new Response(object.value, { headers });
});

fileRoutes.delete("/:key", async (context) => {
  const key = validateObjectKey(context.req.param("key"));
  if ((await context.env.FILES.get(storageKey(key), "arrayBuffer")) === null) {
    throw new ApiError(404, "not_found", "File not found.");
  }

  await context.env.FILES.delete(storageKey(key));
  return context.body(null, 204);
});
