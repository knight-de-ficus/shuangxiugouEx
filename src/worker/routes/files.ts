import { Hono } from "hono";
import { ApiError } from "../services/errors";
import { validateObjectKey } from "../services/validation";
import type { AppEnv } from "../types/bindings";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export const fileRoutes = new Hono<AppEnv>();

fileRoutes.put("/:key", async (context) => {
  const key = validateObjectKey(context.req.param("key"));
  const declaredLength = Number(context.req.header("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_FILE_BYTES) {
    throw new ApiError(413, "payload_too_large", "File exceeds the 5 MiB example limit.");
  }

  const contentType = context.req.header("content-type") ?? "application/octet-stream";
  if (contentType.length > 128 || /[\r\n]/.test(contentType)) {
    throw new ApiError(400, "bad_request", "Content-Type is invalid.");
  }

  const body = await context.req.arrayBuffer();
  if (body.byteLength > MAX_FILE_BYTES) {
    throw new ApiError(413, "payload_too_large", "File exceeds the 5 MiB example limit.");
  }

  await context.env.BUCKET.put(key, body, {
    httpMetadata: { contentType },
  });

  return context.json({ key, size: body.byteLength, contentType }, 201);
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

