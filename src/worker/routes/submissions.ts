import { Hono } from "hono";
import { parseJsonBody } from "../services/validation";
import { enumField, requireRecord, stringField } from "../services/community-validation";
import type { AppEnv } from "../types/bindings";
import { enforceRateLimit } from "../services/security-controls";
import { enqueueModeration } from "../services/moderation";

export const submissionRoutes = new Hono<AppEnv>();

submissionRoutes.get("/", async (context) => {
  const result = await context.env.DB.prepare(
    "SELECT id, kind, company_name, parent_company, work_policy, evidence, created_at FROM submissions WHERE status = 'accepted' ORDER BY created_at DESC LIMIT 100",
  ).all<{
    id: string;
    kind: "recommend" | "report";
    company_name: string;
    parent_company: string;
    work_policy: "strict_double" | "alternate" | "single" | "unknown";
    evidence: string;
    created_at: string;
  }>();
  return context.json({
    submissions: result.results.map((row) => ({
      id: row.id,
      kind: row.kind,
      companyName: row.company_name,
      parentCompany: row.parent_company,
      workPolicy: row.work_policy,
      evidence: row.evidence,
      createdAt: row.created_at,
    })),
  });
});

submissionRoutes.post("/", async (context) => {
  await enforceRateLimit(context, "submission", 5, 3600);
  const body = requireRecord(await parseJsonBody(context.req.raw));
  const kind = enumField(body, "kind", ["recommend", "report"] as const);
  const companyName = stringField(body, "companyName", 1, 120);
  const parentCompany = stringField(body, "parentCompany", 0, 160, true);
  const workPolicy = enumField(body, "workPolicy", ["strict_double", "alternate", "single", "unknown"] as const);
  const evidence = stringField(body, "evidence", 0, 2000, true);

  const submission = await enqueueModeration(
    context,
    "company_submission",
    `${kind}:${companyName.toLocaleLowerCase("zh-CN")}`,
    { kind, companyName, parentCompany, workPolicy, evidence },
  );

  return context.json({ submission }, 202);
});
