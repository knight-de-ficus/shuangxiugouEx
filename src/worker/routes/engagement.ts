import { Hono } from "hono";
import { ApiError } from "../services/errors";
import { parseJsonBody } from "../services/validation";
import {
  booleanField,
  companyId,
  enumField,
  integerField,
  requireRecord,
  stringField,
} from "../services/community-validation";
import type { AppEnv } from "../types/bindings";
import { enforceRateLimit, ensureCompanyExists, networkVisitorHash } from "../services/security-controls";

export const engagementRoutes = new Hono<AppEnv>();

engagementRoutes.post("/brands/:id/votes", async (context) => {
  const id = companyId(context.req.param("id"));
  await ensureCompanyExists(context.env.DB, id);
  await enforceRateLimit(context, "brand-vote", 30, 3600);
  const body = requireRecord(await parseJsonBody(context.req.raw));
  const voteType = enumField(body, "voteType", ["up", "down"] as const);
  const visitorHash = await networkVisitorHash(context);
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
  await ensureCompanyExists(context.env.DB, id);
  await enforceRateLimit(context, "employee-report", 8, 86400);
  const body = requireRecord(await parseJsonBody(context.req.raw));
  const role = stringField(body, "role", 1, 60);
  const weekendRating = integerField(body, "weekendRating", 0, 100);
  const offWorkTime = stringField(body, "offWorkTime", 5, 5);
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(offWorkTime)) {
    throw new ApiError(400, "bad_request", "offWorkTime must use 24-hour HH:MM format.");
  }
  const statutoryPay = booleanField(body, "statutoryPay");
  const comment = stringField(body, "comment", 0, 1000, true);
  const reporterHash = await networkVisitorHash(context);
  const reportId = crypto.randomUUID();
  try {
    await context.env.DB.prepare(
      "INSERT INTO employee_reports (id, company_id, role, weekend_rating, off_work_time, statutory_pay, comment, reporter_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(reportId, id, role, weekendRating, offWorkTime, statutoryPay ? 1 : 0, comment, reporterHash)
      .run();
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      throw new ApiError(409, "conflict", "This network has already submitted a report for the company.");
    }
    throw error;
  }
  return context.json({ report: { id: reportId } }, 201);
});

engagementRoutes.post("/brands/:id/purchase-pledges", async (context) => {
  const id = companyId(context.req.param("id"));
  await ensureCompanyExists(context.env.DB, id);
  await enforceRateLimit(context, "purchase-pledge", 10, 86400);
  const body = requireRecord(await parseJsonBody(context.req.raw));
  const amountCents = integerField(body, "amountCents", 1, 1_000_000);
  const pledgerHash = await networkVisitorHash(context);
  const pledgeDay = new Date().toISOString().slice(0, 10);
  const pledgeId = crypto.randomUUID();
  try {
    await context.env.DB.prepare(
      "INSERT INTO purchase_pledges (id, company_id, amount_cents, pledger_hash, pledge_day) VALUES (?, ?, ?, ?, ?)",
    )
      .bind(pledgeId, id, amountCents, pledgerHash, pledgeDay)
      .run();
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      throw new ApiError(409, "conflict", "This network has already checked in for the company today.");
    }
    throw error;
  }
  return context.json({ pledge: { id: pledgeId } }, 201);
});
