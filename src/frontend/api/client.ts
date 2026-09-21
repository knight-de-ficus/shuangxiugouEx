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

export interface SiteStats {
  transferredAmount: number;
  votes: Record<string, { upvotes: number; boycotts: number }>;
  employeeStats: Record<string, EmployeeVoteStats>;
}

export interface PendingSubmission {
  id: string;
  status: 'pending';
}

export interface PublishedSubmission {
  id: string;
  kind: 'recommend' | 'report';
  companyName: string;
  parentCompany: string;
  workPolicy: 'strict_double' | 'alternate' | 'single' | 'unknown';
  evidence: string;
  createdAt: string;
}

export const getSiteStats = () => requestJson<SiteStats>('/api/stats');

export const voteForBrand = (companyId: string, voteType: 'up' | 'down') =>
  requestJson<{ submission: PendingSubmission }>(`/api/brands/${encodeURIComponent(companyId)}/votes`, {
    method: 'POST',
    body: JSON.stringify({ voteType }),
  });

export const submitEmployeeReport = (
  companyId: string,
  input: { role: string; weekendRating: number; offWorkTime: string; statutoryPay: boolean; comment: string },
) =>
  requestJson<{ submission: PendingSubmission }>(`/api/brands/${encodeURIComponent(companyId)}/employee-reports`, {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const submitPurchasePledge = (companyId: string, amount: number) =>
  requestJson<{ submission: PendingSubmission }>(`/api/brands/${encodeURIComponent(companyId)}/purchase-pledges`, {
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
  requestJson<{ submission: PendingSubmission }>('/api/submissions', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const getPublishedSubmissions = () =>
  requestJson<{ submissions: PublishedSubmission[] }>('/api/submissions');

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
  requestJson<{ submission: PendingSubmission }>('/api/community/posts', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const createCommunityReply = (postId: string, content: string) =>
  requestJson<{ submission: PendingSubmission }>(
    `/api/community/posts/${encodeURIComponent(postId)}/replies`,
    { method: 'POST', body: JSON.stringify({ content }) },
  );

export const voteForCommunityPost = (postId: string) =>
  requestJson<{ submission: PendingSubmission }>(`/api/community/posts/${encodeURIComponent(postId)}/vote`, {
    method: 'POST',
  });
