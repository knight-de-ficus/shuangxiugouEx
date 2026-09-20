import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types/bindings";

export const securityHeaders: MiddlewareHandler<AppEnv> = async (context, next) => {
  await next();

  context.header("X-Content-Type-Options", "nosniff");
  context.header("X-Frame-Options", "DENY");
  context.header("Referrer-Policy", "no-referrer");
  context.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  context.header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  context.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  context.header("Cache-Control", "no-store");
};

