import type { CommunityPost, EmployeeVoteStats, PostCategory } from '../types';

interface ApiErrorBody {
  error?: { message?: string };
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const body = (await response.json().catch(() => ({}))) as T & ApiErrorBody;
  if (!response.ok) {
    throw new Error(body.error?.message || `请求失败（HTTP ${response.status}）`);
  }
  return body;
}

export function getVisitorId(): string {
  const key = 'shuangxiugou-visitor-id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

export interface SiteStats {
  transferredAmount: number;
  votes: Record<string, { upvotes: number; boycotts: number }>;
  employeeStats: Record<string, EmployeeVoteStats>;
}

export const getSiteStats = () => requestJson<SiteStats>('/api/stats');

export const voteForBrand = (companyId: string, voteType: 'up' | 'down') =>
  requestJson<{ recorded: true }>(`/api/brands/${encodeURIComponent(companyId)}/votes`, {
    method: 'POST',
    body: JSON.stringify({ visitorId: getVisitorId(), voteType }),
  });

export const submitEmployeeReport = (
  companyId: string,
  input: { role: string; weekendRating: number; offWorkTime: string; statutoryPay: boolean; comment: string },
) =>
  requestJson<{ report: { id: string } }>(`/api/brands/${encodeURIComponent(companyId)}/employee-reports`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const submitPurchasePledge = (companyId: string, amount: number) =>
  requestJson<{ pledge: { id: string } }>(`/api/brands/${encodeURIComponent(companyId)}/purchase-pledges`, {
    method: 'POST',
    body: JSON.stringify({ amountCents: Math.round(amount * 100) }),
  });

export const submitLead = (input: {
  kind: 'recommend' | 'report';
  companyName: string;
  parentCompany: string;
  workPolicy: 'strict_double' | 'alternate' | 'single' | 'unknown';
  evidence: string;
}) =>
  requestJson<{ submission: { id: string; status: 'pending' } }>('/api/submissions', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const listCommunityPosts = (category: 'all' | PostCategory = 'all') =>
  requestJson<{ posts: CommunityPost[] }>(
    `/api/community/posts${category === 'all' ? '' : `?category=${encodeURIComponent(category)}`}`,
  );

export const createCommunityPost = (input: {
  authorRole: string;
  targetCompany: string;
  category: PostCategory;
  title: string;
  content: string;
  evidenceBadge: string;
}) =>
  requestJson<{ post: { id: string; authorAlias: string } }>('/api/community/posts', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const createCommunityReply = (postId: string, content: string) =>
  requestJson<{ reply: { id: string; author: string } }>(
    `/api/community/posts/${encodeURIComponent(postId)}/replies`,
    { method: 'POST', body: JSON.stringify({ content }) },
  );

export const voteForCommunityPost = (postId: string) =>
  requestJson<{ upvotes: number }>(`/api/community/posts/${encodeURIComponent(postId)}/vote`, {
    method: 'POST',
    body: JSON.stringify({ visitorId: getVisitorId() }),
  });
