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
import { enforceRateLimit, ensureCompanyExists } from "../services/security-controls";
import { enqueueModeration } from "../services/moderation";

export const engagementRoutes = new Hono<AppEnv>();

engagementRoutes.post("/brands/:id/votes", async (context) => {
  const id = companyId(context.req.param("id"));
  await ensureCompanyExists(context.env.DB, id);
  await enforceRateLimit(context, "brand-vote", 30, 3600);
  const body = requireRecord(await parseJsonBody(context.req.raw));
  const voteType = enumField(body, "voteType", ["up", "down"] as const);
  const submission = await enqueueModeration(context, "brand_vote", id, { companyId: id, voteType });
  return context.json({ submission }, 202);
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
  const submission = await enqueueModeration(context, "employee_report", id, {
    companyId: id,
    role,
    weekendRating,
    offWorkTime,
    statutoryPay,
    comment,
  });
  return context.json({ submission }, 202);
});

engagementRoutes.post("/brands/:id/purchase-pledges", async (context) => {
  const id = companyId(context.req.param("id"));
  await ensureCompanyExists(context.env.DB, id);
  await enforceRateLimit(context, "purchase-pledge", 10, 86400);
  const body = requireRecord(await parseJsonBody(context.req.raw));
  const amountCents = integerField(body, "amountCents", 1, 1_000_000);
  const pledgeDay = new Date().toISOString().slice(0, 10);
  const submission = await enqueueModeration(context, "purchase_pledge", `${id}:${pledgeDay}`, {
    companyId: id,
    amountCents,
    pledgeDay,
  });
  return context.json({ submission }, 202);
});
