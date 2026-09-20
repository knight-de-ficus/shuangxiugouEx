import { Hono } from "hono";
import type { AppEnv } from "../types/bindings";

export const healthRoutes = new Hono<AppEnv>();

healthRoutes.get("/", async (context) => {
  await context.env.DB.prepare("SELECT 1 AS healthy").first<{ healthy: number }>();
  return context.json({ status: "ok", database: "ok" });
});

