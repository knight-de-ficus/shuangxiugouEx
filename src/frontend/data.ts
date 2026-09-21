import { COMPANIES, LAST_UPDATED } from './vendor-data/data/companies';
import { INDUSTRY_MAP } from './vendor-data/data/industries';
import { mergeProfile } from './vendor-data/data/profiles';
import type { Company, RestPatternId } from './vendor-data/types';
import type { AuditStatus, BrandItem, OvertimeComp, WeekendPolicy, WlbTier } from './types';

function tierAssessment(company: Company): { tier: WlbTier; score: number | null; reason: string } {
  if (company.weeklyRestDays === null && company.weeklyHours === null) {
    return { tier: 'O', score: null, reason: '缺少可量化的周休天数与周工时数据' };
  }

  let score = 0;
  const reasons: string[] = [];

  if (company.weeklyRestDays !== null) {
    if (company.weeklyRestDays >= 3) score += 30;
    else if (company.weeklyRestDays >= 2) score += 25;
    else if (company.weeklyRestDays >= 1.5) score += 12;
    else if (company.weeklyRestDays >= 1) score += 0;
    else score -= 15;
    reasons.push(`周休 ${company.weeklyRestDays} 天`);
  } else {
    reasons.push('周休天数未披露');
  }

  if (company.weeklyHours !== null) {
    if (company.weeklyHours <= 32) score += 30;
    else if (company.weeklyHours <= 36) score += 27;
    else if (company.weeklyHours <= 40) score += 23;
    else if (company.weeklyHours <= 44) score += 8;
    else if (company.weeklyHours <= 48) score -= 5;
    else score -= 20;
    reasons.push(`周工时 ${company.weeklyHours} 小时`);
  } else {
    reasons.push('周工时未披露');
  }

  const patternScore: Record<RestPatternId, number> = {
    short: 20,
    standard: 15,
    flex: 10,
    restrict: 5,
    shift: 5,
    bigsmall: -15,
    single: -25,
  };
  const evidenceScore = { A: 20, B: 10, C: -10 }[company.evidence];
  score += patternScore[company.restPattern] + evidenceScore + Math.min(company.sources.length * 2, 5);
  score = Math.max(0, Math.min(100, score));

  const tier: WlbTier = score >= 85 ? 'S' : score >= 65 ? 'A' : score >= 35 ? 'B' : 'C';
  return {
    tier,
    score,
    reason: `${reasons.join(' · ')} · ${company.evidence} 级证据`,
  };
}

function weekendPolicyFor(pattern: RestPatternId): WeekendPolicy {
  if (pattern === 'single') return 'single';
  if (pattern === 'bigsmall' || pattern === 'shift') return 'alternate';
  if (pattern === 'restrict') return 'overtime';
  return 'strict_double';
}

function weekendLabelFor(company: Company): string {
  const labels: Record<RestPatternId, string> = {
    standard: '标准双休',
    shift: '轮班 / 综合工时',
    flex: '弹性 / 混合办公',
    short: '缩短工时',
    restrict: '加班管控',
    bigsmall: '大小周',
    single: '单休',
  };
  return company.weeklyRestDays === null ? `${labels[company.restPattern]} · 数据待补全` : labels[company.restPattern];
}

function overtimeFor(company: Company): { value: OvertimeComp; label: string } {
  if (company.restPattern === 'single') return { value: 'unpaid', label: '加班补偿情况待核验' };
  if (company.restPattern === 'shift' || company.restPattern === 'bigsmall') {
    return { value: 'swap_leave', label: '排班 / 调休，以具体岗位为准' };
  }
  return { value: 'rarely_overtime', label: '公开资料未显示常态超时' };
}

function auditStatusFor(company: Company): AuditStatus {
  if (company.evidence === 'A') return 'official_verified';
  if (company.evidence === 'B') return 'community_verified';
  return 'under_review';
}

function toBrand(company: Company): BrandItem {
  const overtime = overtimeFor(company);
  const assessment = tierAssessment(company);
  return {
    id: company.id,
    name: company.brand || company.name,
    companyName: company.name,
    logoText: company.brand || company.name,
    category: INDUSTRY_MAP[company.industryId]?.name || company.subIndustry || '其他',
    tier: assessment.tier,
    tierScore: assessment.score,
    tierReason: assessment.reason,
    weekendPolicy: weekendPolicyFor(company.restPattern),
    weekendPolicyLabel: weekendLabelFor(company),
    overtimeComp: overtime.value,
    overtimeLabel: overtime.label,
    summary: company.slogan || company.policy,
    keyProducts: company.products.length > 0 ? company.products : company.productTypes,
    reasons: [company.policy, company.note, company.scope ? `适用范围：${company.scope}` : undefined].filter(
      (value): value is string => Boolean(value),
    ),
    evidence: company.sources.map((source, index) => ({
      id: `${company.id}-source-${index + 1}`,
      date: source.date,
      type: 'esg_report',
      title: source.title,
      summary: source.publisher ? `发布方：${source.publisher}` : company.policy,
      sourceUrl: safeSourceUrl(source.url),
    })),
    auditStatus: auditStatusFor(company),
    upvotes: 0,
    boycotts: 0,
  };
}

function safeSourceUrl(rawUrl: string): string | undefined {
  try {
    const url = new URL(rawUrl);
    return url.protocol === 'https:' ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export const DATA_VERSION = 'shuangxiu-index';
export const DATA_UPDATED_AT = LAST_UPDATED;
export const DATA_LICENSE = 'Copied from shuangxiu-index; verify upstream licensing and source records before redistribution.';
export const DATA_DISCLAIMER = '公开资料仅供参考；不同岗位、地点和时期的制度可能不同。';

export const INITIAL_BRANDS: BrandItem[] = COMPANIES.map(mergeProfile).map(toBrand);
export const CATEGORIES = ['全部', ...Array.from(new Set(INITIAL_BRANDS.map((brand) => brand.category))).sort()];
