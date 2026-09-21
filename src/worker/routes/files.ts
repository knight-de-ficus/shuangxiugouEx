import { Hono } from "hono";
import { ApiError } from "../services/errors";
import { validateObjectKey } from "../services/validation";
import type { AppEnv } from "../types/bindings";
import { requireAdmin } from "../services/security-controls";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

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

  await context.env.BUCKET.put(key, context.req.raw.body, {
    httpMetadata: { contentType },
  });

  return context.json({ key, size: declaredLength, contentType }, 201);
});

fileRoutes.get("/:key", async (context) => {
  const key = validateObjectKey(context.req.param("key"));
  const object = await context.env.BUCKET.get(key);
  if (!object) {
    throw new ApiError(404, "not_found", "File not found.");
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Content-Length", object.size.toString());
  return new Response(object.body, { headers });
});

fileRoutes.delete("/:key", async (context) => {
  const key = validateObjectKey(context.req.param("key"));
  if (!(await context.env.BUCKET.head(key))) {
    throw new ApiError(404, "not_found", "File not found.");
  }

  await context.env.BUCKET.delete(key);
  return context.body(null, 204);
});
