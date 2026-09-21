import type { Context } from "hono";
import { ApiError } from "./errors";
import { adminFingerprint, networkVisitorHash } from "./security-controls";
import type { AppEnv } from "../types/bindings";
import {
  booleanField,
  enumField,
  integerField,
  requireRecord,
  stringField,
} from "./community-validation";

export type ModerationType =
  | "brand_vote"
  | "employee_report"
  | "purchase_pledge"
  | "company_submission"
  | "community_post"
  | "community_reply"
  | "community_vote";

export type ModerationStatus = "pending" | "approved" | "rejected";

export type ModerationRow = {
  id: string;
  submission_type: ModerationType;
  target_key: string;
  payload_json: string;
  submitter_hash: string;
  status: ModerationStatus;
  reviewer_note: string;
  published_id: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export async function enqueueModeration(
  context: Context<AppEnv>,
  submissionType: ModerationType,
  targetKey: string,
  payload: Record<string, unknown>,
): Promise<{ id: string; status: "pending" }> {
  const normalizedTarget = targetKey.trim();
  if (normalizedTarget.length < 1 || normalizedTarget.length > 180) {
    throw new ApiError(400, "bad_request", "Moderation target is invalid.");
  }
  const payloadJson = JSON.stringify(payload);
  if (payloadJson.length < 2 || payloadJson.length > 8192) {
    throw new ApiError(413, "payload_too_large", "Submission payload is too large.");
  }
  const id = crypto.randomUUID();
  const submitterHash = await networkVisitorHash(context);
  let publishedDuplicate: unknown = null;
  if (submissionType === "brand_vote") {
    publishedDuplicate = await context.env.DB.prepare(
      "SELECT 1 FROM brand_votes WHERE company_id = ? AND visitor_hash = ?",
    ).bind(normalizedTarget, submitterHash).first();
  } else if (submissionType === "employee_report") {
    publishedDuplicate = await context.env.DB.prepare(
      "SELECT 1 FROM employee_reports WHERE company_id = ? AND reporter_hash = ?",
    ).bind(normalizedTarget, submitterHash).first();
  } else if (submissionType === "purchase_pledge") {
    const separator = normalizedTarget.lastIndexOf(":");
    const companyId = normalizedTarget.slice(0, separator);
    const pledgeDay = normalizedTarget.slice(separator + 1);
    publishedDuplicate = await context.env.DB.prepare(
      "SELECT 1 FROM purchase_pledges WHERE company_id = ? AND pledger_hash = ? AND pledge_day = ?",
    ).bind(companyId, submitterHash, pledgeDay).first();
  } else if (submissionType === "community_vote") {
    publishedDuplicate = await context.env.DB.prepare(
      "SELECT 1 FROM community_post_votes WHERE post_id = ? AND visitor_hash = ?",
    ).bind(normalizedTarget, submitterHash).first();
  }
  if (publishedDuplicate) {
    throw new ApiError(409, "conflict", "This network has already published an equivalent submission.");
  }
  try {
    await context.env.DB.prepare(
      "INSERT INTO moderation_queue (id, submission_type, target_key, payload_json, submitter_hash) VALUES (?, ?, ?, ?, ?)",
    )
      .bind(id, submissionType, normalizedTarget, payloadJson, submitterHash)
      .run();
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      throw new ApiError(409, "conflict", "An equivalent submission from this network is already pending review.");
    }
    throw error;
  }
  return { id, status: "pending" };
}

export async function listModerationQueue(
  db: D1Database,
  status: ModerationStatus,
): Promise<Array<Omit<ModerationRow, "submitter_hash" | "payload_json"> & { payload: unknown }>> {
  const result = await db.prepare(
    "SELECT id, submission_type, target_key, payload_json, status, reviewer_note, published_id, created_at, reviewed_at FROM moderation_queue WHERE status = ? ORDER BY created_at ASC LIMIT 100",
  )
    .bind(status)
    .all<Omit<ModerationRow, "submitter_hash">>();

  return result.results.map((row) => {
    let payload: unknown = null;
    try {
      payload = JSON.parse(row.payload_json) as unknown;
    } catch {
      payload = { error: "Stored payload is invalid JSON." };
    }
    const { payload_json: _payloadJson, ...publicRow } = row;
    return { ...publicRow, payload };
  });
}

function parseStoredPayload(raw: string): Record<string, unknown> {
  try {
    return requireRecord(JSON.parse(raw) as unknown);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(409, "conflict", "Stored moderation payload is invalid.");
  }
}

function publicationStatements(
  db: D1Database,
  row: ModerationRow,
  publishedId: string,
): D1PreparedStatement[] {
  const payload = parseStoredPayload(row.payload_json);
  switch (row.submission_type) {
    case "brand_vote": {
      const companyId = stringField(payload, "companyId", 1, 80);
      const voteType = enumField(payload, "voteType", ["up", "down"] as const);
      return [
        db.prepare("INSERT INTO brand_votes (company_id, visitor_hash, vote_type) VALUES (?, ?, ?)")
          .bind(companyId, row.submitter_hash, voteType),
      ];
    }
    case "employee_report": {
      const companyId = stringField(payload, "companyId", 1, 80);
      const role = stringField(payload, "role", 1, 60);
      const weekendRating = integerField(payload, "weekendRating", 0, 100);
      const offWorkTime = stringField(payload, "offWorkTime", 5, 5);
      if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(offWorkTime)) {
        throw new ApiError(409, "conflict", "Stored off-work time is invalid.");
      }
      const statutoryPay = booleanField(payload, "statutoryPay");
      const comment = stringField(payload, "comment", 0, 1000, true);
      return [
        db.prepare(
          "INSERT INTO employee_reports (id, company_id, role, weekend_rating, off_work_time, statutory_pay, comment, reporter_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ).bind(
          publishedId,
          companyId,
          role,
          weekendRating,
          offWorkTime,
          statutoryPay ? 1 : 0,
          comment,
          row.submitter_hash,
        ),
      ];
    }
    case "purchase_pledge": {
      const companyId = stringField(payload, "companyId", 1, 80);
      const amountCents = integerField(payload, "amountCents", 1, 1_000_000);
      const pledgeDay = stringField(payload, "pledgeDay", 10, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(pledgeDay)) {
        throw new ApiError(409, "conflict", "Stored pledge date is invalid.");
      }
      return [
        db.prepare(
          "INSERT INTO purchase_pledges (id, company_id, amount_cents, pledger_hash, pledge_day) VALUES (?, ?, ?, ?, ?)",
        ).bind(publishedId, companyId, amountCents, row.submitter_hash, pledgeDay),
      ];
    }
    case "company_submission": {
      const kind = enumField(payload, "kind", ["recommend", "report"] as const);
      const companyName = stringField(payload, "companyName", 1, 120);
      const parentCompany = stringField(payload, "parentCompany", 0, 160, true);
      const workPolicy = enumField(payload, "workPolicy", ["strict_double", "alternate", "single", "unknown"] as const);
      const evidence = stringField(payload, "evidence", 0, 2000, true);
      return [
        db.prepare(
          "INSERT INTO submissions (id, kind, company_name, parent_company, work_policy, evidence, status) VALUES (?, ?, ?, ?, ?, ?, 'accepted')",
        ).bind(publishedId, kind, companyName, parentCompany, workPolicy, evidence),
      ];
    }
    case "community_post": {
      const authorAlias = stringField(payload, "authorAlias", 1, 40);
      const authorRole = stringField(payload, "authorRole", 0, 60, true);
      const targetCompany = stringField(payload, "targetCompany", 1, 120);
      const category = enumField(payload, "category", ["avoid_trap", "recommend_wlb", "ask_intel"] as const);
      const title = stringField(payload, "title", 4, 140);
      const content = stringField(payload, "content", 10, 4000);
      const evidenceBadge = stringField(payload, "evidenceBadge", 0, 120, true);
      return [
        db.prepare(
          "INSERT INTO community_posts (id, author_alias, author_role, target_company, category, title, content, evidence_badge) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ).bind(publishedId, authorAlias, authorRole, targetCompany, category, title, content, evidenceBadge),
      ];
    }
    case "community_reply": {
      const postId = stringField(payload, "postId", 1, 80);
      const authorAlias = stringField(payload, "authorAlias", 1, 40);
      const content = stringField(payload, "content", 1, 1000);
      return [
        db.prepare(
          "INSERT INTO community_replies (id, post_id, author_alias, content) SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM community_posts WHERE id = ?)",
        ).bind(publishedId, postId, authorAlias, content, postId),
      ];
    }
    case "community_vote": {
      const postId = stringField(payload, "postId", 1, 80);
      return [
        db.prepare(
          "INSERT INTO community_post_votes (post_id, visitor_hash) SELECT ?, ? WHERE EXISTS (SELECT 1 FROM community_posts WHERE id = ?)",
        ).bind(postId, row.submitter_hash, postId),
        db.prepare("UPDATE community_posts SET upvotes = upvotes + 1 WHERE id = ?").bind(postId),
      ];
    }
  }
}

export async function decideModeration(
  context: Context<AppEnv>,
  queueId: string,
  decision: "approved" | "rejected",
  note: string,
): Promise<{ id: string; status: "approved" | "rejected"; publishedId: string | null }> {
  if (!/^[0-9a-f-]{36}$/.test(queueId)) {
    throw new ApiError(400, "bad_request", "Queue id is invalid.");
  }
  const row = await context.env.DB.prepare(
    "SELECT id, submission_type, target_key, payload_json, submitter_hash, status, reviewer_note, published_id, created_at, reviewed_at FROM moderation_queue WHERE id = ?",
  )
    .bind(queueId)
    .first<ModerationRow>();
  if (!row) throw new ApiError(404, "not_found", "Moderation entry was not found.");
  if (row.status !== "pending") {
    throw new ApiError(409, "conflict", "Moderation entry has already been decided.");
  }

  const publishedId = decision === "approved" ? crypto.randomUUID() : null;
  const reviewerFingerprint = await adminFingerprint(context);
  if (decision === "approved" && (row.submission_type === "community_reply" || row.submission_type === "community_vote")) {
    const payload = parseStoredPayload(row.payload_json);
    const postId = stringField(payload, "postId", 1, 80);
    const post = await context.env.DB.prepare("SELECT id FROM community_posts WHERE id = ?").bind(postId).first();
    if (!post) throw new ApiError(409, "conflict", "The target community post is no longer published.");
  }
  const statements = decision === "approved"
    ? publicationStatements(context.env.DB, row, publishedId as string)
    : [];
  statements.push(
    context.env.DB.prepare(
      "UPDATE moderation_queue SET status = ?, reviewer_note = ?, published_id = ?, reviewed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ? AND status = 'pending'",
    ).bind(decision, note, publishedId, queueId),
    context.env.DB.prepare(
      "INSERT INTO moderation_audit_log (id, queue_id, decision, reviewer_fingerprint, note) VALUES (?, ?, ?, ?, ?)",
    ).bind(crypto.randomUUID(), queueId, decision, reviewerFingerprint, note),
  );

  try {
    const results = await context.env.DB.batch(statements);
    const updateResult = results[results.length - 2];
    if (updateResult.meta.changes !== 1) {
      throw new ApiError(409, "conflict", "Moderation entry changed while it was being reviewed.");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && (error.message.includes("UNIQUE") || error.message.includes("FOREIGN KEY"))) {
      throw new ApiError(409, "conflict", "This entry conflicts with already published data.");
    }
    throw error;
  }

  return { id: queueId, status: decision, publishedId };
}
