import { Hono } from "hono";
import { securityHeaders } from "./middleware/security";
import { errorBody, ApiError } from "./services/errors";
import { fileRoutes } from "./routes/files";
import { healthRoutes } from "./routes/health";
import { itemRoutes } from "./routes/items";
import { communityRoutes } from "./routes/community";
import { engagementRoutes } from "./routes/engagement";
import { statsRoutes } from "./routes/stats";
import { submissionRoutes } from "./routes/submissions";
import { adminRoutes } from "./routes/admin";
import type { AppEnv } from "./types/bindings";

const app = new Hono<AppEnv>();

app.use("/api/*", securityHeaders);
app.route("/api/health", healthRoutes);
app.route("/api/items", itemRoutes);
app.route("/api/files", fileRoutes);
app.route("/api/ops", adminRoutes);
app.all("/api/community/*", (context) => {
  return context.json(errorBody("not_found", "API route not found."), 404);
});
app.route("/api/community", communityRoutes);
app.route("/api", engagementRoutes);
app.route("/api/stats", statsRoutes);
app.route("/api/submissions", submissionRoutes);

app.all("/api/*", (context) => {
  return context.json(errorBody("not_found", "API route not found."), 404);
});

app.onError((error, context) => {
  if (error instanceof ApiError) {
    return context.json(errorBody(error.code, error.message), error.status);
  }

  console.error("Unhandled API error", error);
  return context.json(errorBody("internal_error", "An unexpected error occurred."), 500);
});

export default app;
