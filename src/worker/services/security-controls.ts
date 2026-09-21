import type { Context } from "hono";
import { ApiError } from "./errors";
import type { AppEnv } from "../types/bindings";

const encoder = new TextEncoder();

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function requiredSecret(value: string | undefined, name: string): string {
  if (!value || value.length < 32) {
    throw new ApiError(503, "service_unavailable", `${name} is not configured.`);
  }
  return value;
}

function requestIp(context: Context<AppEnv>): string {
  const cloudflareIp = context.req.header("cf-connecting-ip");
  if (cloudflareIp) return cloudflareIp;

  const hostname = new URL(context.req.url).hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return "local-development";
  }
  throw new ApiError(503, "service_unavailable", "Trusted client network identity is unavailable.");
}

export async function networkVisitorHash(context: Context<AppEnv>): Promise<string> {
  const salt = requiredSecret(context.env.ABUSE_HASH_SALT, "ABUSE_HASH_SALT");
  return sha256(`${salt}\n${requestIp(context)}`);
}

export async function enforceRateLimit(
  context: Context<AppEnv>,
  action: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const rateKey = await networkVisitorHash(context);
  const windowStart = Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds;
  const [_, __, countResult] = await context.env.DB.batch([
    context.env.DB.prepare(
      "DELETE FROM api_rate_limits WHERE action = ? AND rate_key = ? AND window_start < ?",
    ).bind(action, rateKey, windowStart),
    context.env.DB.prepare(
      "INSERT INTO api_rate_limits (action, rate_key, window_start, request_count) VALUES (?, ?, ?, 1) ON CONFLICT (action, rate_key, window_start) DO UPDATE SET request_count = request_count + 1",
    ).bind(action, rateKey, windowStart),
    context.env.DB.prepare(
      "SELECT request_count FROM api_rate_limits WHERE action = ? AND rate_key = ? AND window_start = ?",
    ).bind(action, rateKey, windowStart),
  ]);
  const count = Number((countResult.results[0] as { request_count?: number } | undefined)?.request_count ?? limit + 1);
  context.header("RateLimit-Limit", String(limit));
  context.header("RateLimit-Remaining", String(Math.max(0, limit - count)));
  if (count > limit) {
    context.header("Retry-After", String(windowSeconds));
    throw new ApiError(429, "rate_limited", "Too many requests. Please try again later.");
  }
}

export async function requireAdmin(context: Context<AppEnv>): Promise<void> {
  const expected = requiredSecret(context.env.ADMIN_API_TOKEN, "ADMIN_API_TOKEN");
  const authorization = context.req.header("authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!supplied) {
    context.header("WWW-Authenticate", 'Bearer realm="shuangxiugou-admin"');
    throw new ApiError(401, "unauthorized", "Administrator authorization is required.");
  }
  const [expectedHash, suppliedHash] = await Promise.all([sha256(expected), sha256(supplied)]);
  if (expectedHash !== suppliedHash) {
    throw new ApiError(403, "forbidden", "Administrator authorization was rejected.");
  }
}

export async function ensureCompanyExists(db: D1Database, id: string): Promise<void> {
  const company = await db.prepare("SELECT id FROM catalog_companies WHERE id = ?").bind(id).first();
  if (!company) {
    throw new ApiError(404, "not_found", "Company was not found in the published catalog.");
  }
}
