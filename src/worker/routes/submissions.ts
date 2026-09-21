import { Hono } from "hono";
import { parseJsonBody } from "../services/validation";
import { enumField, requireRecord, stringField } from "../services/community-validation";
import type { AppEnv } from "../types/bindings";
import { enforceRateLimit } from "../services/security-controls";

export const submissionRoutes = new Hono<AppEnv>();

submissionRoutes.post("/", async (context) => {
  await enforceRateLimit(context, "submission", 5, 3600);
  const body = requireRecord(await parseJsonBody(context.req.raw));
  const id = crypto.randomUUID();
  const kind = enumField(body, "kind", ["recommend", "report"] as const);
  const companyName = stringField(body, "companyName", 1, 120);
  const parentCompany = stringField(body, "parentCompany", 0, 160, true);
  const workPolicy = enumField(body, "workPolicy", ["strict_double", "alternate", "single", "unknown"] as const);
  const evidence = stringField(body, "evidence", 0, 2000, true);

  await context.env.DB.prepare(
    "INSERT INTO submissions (id, kind, company_name, parent_company, work_policy, evidence) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(id, kind, companyName, parentCompany, workPolicy, evidence)
    .run();

  return context.json({ submission: { id, status: "pending" } }, 201);
});
