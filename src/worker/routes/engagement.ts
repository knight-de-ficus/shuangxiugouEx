import { Hono } from "hono";
import { ApiError } from "../services/errors";
import { parseJsonBody } from "../services/validation";
import {
  booleanField,
  companyId,
  enumField,
  hashVisitor,
  integerField,
  requireRecord,
  stringField,
  visitorId,
} from "../services/community-validation";
import type { AppEnv } from "../types/bindings";

export const engagementRoutes = new Hono<AppEnv>();

engagementRoutes.post("/brands/:id/votes", async (context) => {
  const id = companyId(context.req.param("id"));
  const body = requireRecord(await parseJsonBody(context.req.raw));
  const voteType = enumField(body, "voteType", ["up", "down"] as const);
  const visitorHash = await hashVisitor(visitorId(body));
  const result = await context.env.DB.prepare(
    "INSERT INTO brand_votes (company_id, visitor_hash, vote_type) VALUES (?, ?, ?) ON CONFLICT DO NOTHING",
  )
    .bind(id, visitorHash, voteType)
    .run();
  if (result.meta.changes === 0) {
    throw new ApiError(409, "conflict", "This visitor already voted for the company.");
  }
  return context.json({ recorded: true }, 201);
});

engagementRoutes.post("/brands/:id/employee-reports", async (context) => {
  const id = companyId(context.req.param("id"));
  const body = requireRecord(await parseJsonBody(context.req.raw));
  const role = stringField(body, "role", 1, 60);
  const weekendRating = integerField(body, "weekendRating", 0, 100);
  const offWorkTime = stringField(body, "offWorkTime", 5, 5);
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(offWorkTime)) {
    throw new ApiError(400, "bad_request", "offWorkTime must use 24-hour HH:MM format.");
  }
  const statutoryPay = booleanField(body, "statutoryPay");
  const comment = stringField(body, "comment", 0, 1000, true);
  const reportId = crypto.randomUUID();
  await context.env.DB.prepare(
    "INSERT INTO employee_reports (id, company_id, role, weekend_rating, off_work_time, statutory_pay, comment) VALUES (?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(reportId, id, role, weekendRating, offWorkTime, statutoryPay ? 1 : 0, comment)
    .run();
  return context.json({ report: { id: reportId } }, 201);
});

engagementRoutes.post("/brands/:id/purchase-pledges", async (context) => {
  const id = companyId(context.req.param("id"));
  const body = requireRecord(await parseJsonBody(context.req.raw));
  const amountCents = integerField(body, "amountCents", 1, 100_000_000);
  const pledgeId = crypto.randomUUID();
  await context.env.DB.prepare(
    "INSERT INTO purchase_pledges (id, company_id, amount_cents) VALUES (?, ?, ?)",
  )
    .bind(pledgeId, id, amountCents)
    .run();
  return context.json({ pledge: { id: pledgeId } }, 201);
});
