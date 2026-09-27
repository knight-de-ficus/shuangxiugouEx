import type { Context } from "hono";
import { ApiError } from "./errors";
import { networkVisitorHash } from "./security-controls";
import type { AppEnv } from "../types/bindings";

export type PublishedEngagement = { status: "published"; id?: string };

function isConstraintConflict(error: unknown): boolean {
  return error instanceof Error && /unique|primary key/i.test(error.message);
}

export async function publishBrandVote(
  context: Context<AppEnv>,
  companyId: string,
  voteType: "up" | "down",
): Promise<PublishedEngagement> {
  const visitorHash = await networkVisitorHash(context);
  try {
    await context.env.DB.prepare(
      "INSERT INTO brand_votes (company_id, visitor_hash, vote_type) VALUES (?, ?, ?)",
    ).bind(companyId, visitorHash, voteType).run();
  } catch (error) {
    if (isConstraintConflict(error)) {
      throw new ApiError(409, "conflict", "你已经为这家企业投过票了。");
    }
    throw error;
  }
  return { status: "published" };
}

export async function publishPurchasePledge(
  context: Context<AppEnv>,
  companyId: string,
  amountCents: number,
  pledgeDay: string,
): Promise<PublishedEngagement> {
  const pledgerHash = await networkVisitorHash(context);
  const id = crypto.randomUUID();
  try {
    await context.env.DB.prepare(
      "INSERT INTO purchase_pledges (id, company_id, amount_cents, pledger_hash, pledge_day) VALUES (?, ?, ?, ?, ?)",
    ).bind(id, companyId, amountCents, pledgerHash, pledgeDay).run();
  } catch (error) {
    if (isConstraintConflict(error)) {
      throw new ApiError(409, "conflict", "你今天已经为这家企业登记过消费了。");
    }
    throw error;
  }
  return { id, status: "published" };
}

export async function publishCommunityVote(
  context: Context<AppEnv>,
  postId: string,
): Promise<PublishedEngagement> {
  const visitorHash = await networkVisitorHash(context);
  try {
    await context.env.DB.batch([
      context.env.DB.prepare(
        "INSERT INTO community_post_votes (post_id, visitor_hash) VALUES (?, ?)",
      ).bind(postId, visitorHash),
      context.env.DB.prepare(
        "UPDATE community_posts SET upvotes = upvotes + 1 WHERE id = ?",
      ).bind(postId),
    ]);
  } catch (error) {
    if (isConstraintConflict(error)) {
      throw new ApiError(409, "conflict", "你已经为这条内容投过票了。");
    }
    throw error;
  }
  return { status: "published" };
}
