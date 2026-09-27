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
import { purchaseAmountCents } from "../services/purchase-amount";
import { publishBrandVote, publishPurchasePledge } from "../services/direct-engagement";

const AUTO_PUBLISH_PURCHASE_MAX_CENTS = 50_000;

export const engagementRoutes = new Hono<AppEnv>();

engagementRoutes.post("/brands/:id/votes", async (context) => {
  const id = companyId(context.req.param("id"));
  await ensureCompanyExists(context.env.DB, id);
  await enforceRateLimit(context, "brand-vote", 30, 3600);
  const body = requireRecord(await parseJsonBody(context.req.raw));
  const voteType = enumField(body, "voteType", ["up", "down"] as const);
  const submission = await publishBrandVote(context, id, voteType);
  return context.json({ submission }, 201);
});

engagementRoutes.post("/brands/:id/employee-reports", async (context) => {
  const id = companyId(context.req.param("id"));
  await ensureCompanyExists(context.env.DB, id);
  await enforceRateLimit(context, "employee-report", 8, 86400);
  const body = requireRecord(await parseJsonBody(context.req.raw));
  const role = stringField(body, "role", 1, 60);
  const location = stringField(body, "location", 1, 80);
  const employmentStatus = enumField(body, "employmentStatus", ["current", "recent_former"] as const);
  const observedWeeks = integerField(body, "observedWeeks", 1, 8);
  const doubleRestWeeks = integerField(body, "doubleRestWeeks", 0, 8);
  if (doubleRestWeeks > observedWeeks) {
    throw new ApiError(400, "bad_request", "doubleRestWeeks cannot exceed observedWeeks.");
  }
  const weeklyHours = integerField(body, "weeklyHours", 0, 100);
  const restDayInterruptions = integerField(body, "restDayInterruptions", 0, 30);
  const statutoryPay = booleanField(body, "statutoryPay");
  const comment = stringField(body, "comment", 0, 1000, true);
  const submission = await enqueueModeration(context, "employee_report", id, {
    companyId: id,
    role,
    location,
    employmentStatus,
    observedWeeks,
    doubleRestWeeks,
    weeklyHours,
    restDayInterruptions,
    statutoryPay,
    comment,
  });
  return context.json({ submission }, 202);
});

engagementRoutes.post("/brands/:id/purchase-pledges", async (context) => {
  const id = companyId(context.req.param("id"));
  // The banner records general support under a virtual target, not a catalog company.
  if (id !== "default") await ensureCompanyExists(context.env.DB, id);
  await enforceRateLimit(context, "purchase-pledge", 10, 86400);
  const body = requireRecord(await parseJsonBody(context.req.raw));
  const amountCents = purchaseAmountCents(body.amountCents);
  const pledgeDay = new Date().toISOString().slice(0, 10);
  if (amountCents <= AUTO_PUBLISH_PURCHASE_MAX_CENTS) {
    const submission = await publishPurchasePledge(context, id, amountCents, pledgeDay);
    return context.json({ submission }, 201);
  }

  const submission = await enqueueModeration(
    context,
    "purchase_pledge",
    `${id}:${pledgeDay}`,
    { companyId: id, amountCents, pledgeDay },
  );
  return context.json({ submission }, 202);
});
