import { COMPANIES, LAST_UPDATED } from './vendor-data/data/companies';
import { INDUSTRY_MAP } from './vendor-data/data/industries';
import { mergeProfile } from './vendor-data/data/profiles';
import type { Company, RestPatternId } from './vendor-data/types';
import type { AuditStatus, BrandItem, OvertimeComp, WeekendPolicy, WlbTier } from './types';

function tierFor(company: Company): WlbTier {
  if (company.restPattern === 'single') return 'C';
  if (company.restPattern === 'short' && company.evidence !== 'C') return 'S';
  if (company.weeklyRestDays === null || company.weeklyHours === null) return 'B';
  if (company.restPattern === 'bigsmall' || company.restPattern === 'shift') return 'B';
  return 'A';
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
  return {
    id: company.id,
    name: company.brand || company.name,
    companyName: company.name,
    logoText: company.brand || company.name,
    category: INDUSTRY_MAP[company.industryId]?.name || company.subIndustry || '其他',
    tier: tierFor(company),
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
      sourceUrl: source.url,
    })),
    auditStatus: auditStatusFor(company),
    upvotes: 0,
    boycotts: 0,
  };
}

export const DATA_VERSION = 'shuangxiu-index';
export const DATA_UPDATED_AT = LAST_UPDATED;
export const DATA_LICENSE = 'Copied from shuangxiu-index; verify upstream licensing and source records before redistribution.';
export const DATA_DISCLAIMER = '公开资料仅供参考；不同岗位、地点和时期的制度可能不同。';

export const INITIAL_BRANDS: BrandItem[] = COMPANIES.map(mergeProfile).map(toBrand);
export const CATEGORIES = ['全部', ...Array.from(new Set(INITIAL_BRANDS.map((brand) => brand.category))).sort()];
