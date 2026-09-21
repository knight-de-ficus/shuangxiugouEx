import { Hono } from "hono";
import { ApiError } from "../services/errors";
import { parseJsonBody } from "../services/validation";
import {
  enumField,
  requireRecord,
  stringField,
} from "../services/community-validation";
import { enforceRateLimit } from "../services/security-controls";
import { enqueueModeration } from "../services/moderation";
import type { AppEnv } from "../types/bindings";

type PostRow = {
  id: string;
  author_alias: string;
  author_role: string;
  target_company: string;
  category: "avoid_trap" | "recommend_wlb" | "ask_intel";
  title: string;
  content: string;
  evidence_badge: string;
  upvotes: number;
  created_at: string;
  replies_count: number;
};

type ReplyRow = {
  id: string;
  post_id: string;
  author_alias: string;
  content: string;
  created_at: string;
};

export const communityRoutes = new Hono<AppEnv>();

communityRoutes.get("/posts", async (context) => {
  const category = context.req.query("category");
  const allowedCategories = ["avoid_trap", "recommend_wlb", "ask_intel"] as const;
  if (category && !allowedCategories.includes(category as (typeof allowedCategories)[number])) {
    throw new ApiError(400, "bad_request", "category contains an unsupported value.");
  }

  const postsStatement = category
    ? context.env.DB.prepare(
        "SELECT p.id, p.author_alias, p.author_role, p.target_company, p.category, p.title, p.content, p.evidence_badge, p.upvotes, p.created_at, COUNT(r.id) AS replies_count FROM community_posts p LEFT JOIN community_replies r ON r.post_id = p.id WHERE p.category = ? GROUP BY p.id ORDER BY p.created_at DESC LIMIT ?",
      ).bind(category, 50)
    : context.env.DB.prepare(
        "SELECT p.id, p.author_alias, p.author_role, p.target_company, p.category, p.title, p.content, p.evidence_badge, p.upvotes, p.created_at, COUNT(r.id) AS replies_count FROM community_posts p LEFT JOIN community_replies r ON r.post_id = p.id GROUP BY p.id ORDER BY p.created_at DESC LIMIT ?",
      ).bind(50);

  const repliesStatement = category
    ? context.env.DB.prepare(
        "SELECT id, post_id, author_alias, content, created_at FROM (SELECT r.id, r.post_id, r.author_alias, r.content, r.created_at, ROW_NUMBER() OVER (PARTITION BY r.post_id ORDER BY r.created_at DESC) AS reply_rank FROM community_replies r WHERE r.post_id IN (SELECT id FROM community_posts WHERE category = ? ORDER BY created_at DESC LIMIT ?)) WHERE reply_rank <= ? ORDER BY created_at ASC",
      ).bind(category, 50, 20)
    : context.env.DB.prepare(
        "SELECT id, post_id, author_alias, content, created_at FROM (SELECT r.id, r.post_id, r.author_alias, r.content, r.created_at, ROW_NUMBER() OVER (PARTITION BY r.post_id ORDER BY r.created_at DESC) AS reply_rank FROM community_replies r WHERE r.post_id IN (SELECT id FROM community_posts ORDER BY created_at DESC LIMIT ?)) WHERE reply_rank <= ? ORDER BY created_at ASC",
      ).bind(50, 20);

  const [postsResult, repliesResult] = await context.env.DB.batch([postsStatement, repliesStatement]);
  const posts = postsResult.results as PostRow[];
  const replies = repliesResult.results as ReplyRow[];

  return context.json({
    posts: posts.map((post) => ({
      id: post.id,
      authorAlias: post.author_alias,
      authorRole: post.author_role || undefined,
      targetBrandName: post.target_company,
      category: post.category,
      title: post.title,
      content: post.content,
      evidenceBadge: post.evidence_badge || undefined,
      upvotes: post.upvotes,
      repliesCount: post.replies_count,
      createdAt: post.created_at,
      replies: replies
        .filter((reply) => reply.post_id === post.id)
        .map((reply) => ({
          id: reply.id,
          author: reply.author_alias,
          content: reply.content,
          createdAt: reply.created_at,
        })),
    })),
  });
});

communityRoutes.post("/posts", async (context) => {
  await enforceRateLimit(context, "community-post", 5, 3600);
  const body = requireRecord(await parseJsonBody(context.req.raw));
  const category = enumField(body, "category", ["avoid_trap", "recommend_wlb", "ask_intel"] as const);
  const authorRole = stringField(body, "authorRole", 0, 60, true);
  const targetCompany = stringField(body, "targetCompany", 1, 120);
  const title = stringField(body, "title", 4, 140);
  const content = stringField(body, "content", 10, 4000);
  const evidenceBadge = stringField(body, "evidenceBadge", 0, 120, true);
  const authorAlias = `匿名打工人 #${crypto.getRandomValues(new Uint16Array(1))[0].toString().padStart(5, "0").slice(-4)}`;

  const submission = await enqueueModeration(
    context,
    "community_post",
    `${category}:${targetCompany.toLocaleLowerCase("zh-CN")}`,
    { authorAlias, authorRole, targetCompany, category, title, content, evidenceBadge },
  );

  return context.json({ submission }, 202);
});

communityRoutes.post("/posts/:id/replies", async (context) => {
  const postId = context.req.param("id");
  if (!/^[A-Za-z0-9-]{1,80}$/.test(postId)) {
    throw new ApiError(400, "bad_request", "Post id is invalid.");
  }
  if (!(await context.env.DB.prepare("SELECT id FROM community_posts WHERE id = ?").bind(postId).first())) {
    throw new ApiError(404, "not_found", "Post not found.");
  }
  await enforceRateLimit(context, "community-reply", 20, 3600);
  await enforceRateLimit(context, `community-reply:${postId}`, 5, 300);

  const body = requireRecord(await parseJsonBody(context.req.raw));
  const content = stringField(body, "content", 1, 1000);
  const authorAlias = "匿名热心打工人";
  const submission = await enqueueModeration(
    context,
    "community_reply",
    postId,
    { postId, authorAlias, content },
  );

  return context.json({ submission }, 202);
});

communityRoutes.post("/posts/:id/vote", async (context) => {
  const postId = context.req.param("id");
  if (!/^[A-Za-z0-9-]{1,80}$/.test(postId)) {
    throw new ApiError(400, "bad_request", "Post id is invalid.");
  }
  await enforceRateLimit(context, "community-vote", 30, 3600);
  if (!(await context.env.DB.prepare("SELECT id FROM community_posts WHERE id = ?").bind(postId).first())) {
    throw new ApiError(404, "not_found", "Post not found.");
  }
  const submission = await enqueueModeration(context, "community_vote", postId, { postId });
  return context.json({ submission }, 202);
});
