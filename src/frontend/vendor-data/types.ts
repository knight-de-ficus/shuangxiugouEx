export type RestPatternId =
  | 'standard' // 标准双休：周六、周日固定休
  | 'shift' // 轮休 / 调休 / 综合计算工时制
  | 'flex' // 弹性 / 混合办公（远程office）
  | 'short' // 缩短工时：四天半 / 四天 / 36 小时周
  | 'restrict' // 加班管控：强制下班、加班审批制、周末禁会
  | 'bigsmall' // 大小周（单双休交替）
  | 'single' // 单休

export type EvidenceLevel = 'A' | 'B' | 'C'

export type Ownership = '央企/国企' | '民营企业' | '外资企业' | '合资企业' | '上市公司' | '其他'

export interface Source {
  title: string
  url: string
  date: string
  publisher?: string
}

export interface Company {
  id: string
  name: string
  brand?: string
  industryId: string
  subIndustry: string
  /** 主要产品 / 业务线 */
  products: string[]
  /** 产品类型标签 */
  productTypes: string[]
  province: string
  city: string
  ownership: Ownership
  restPattern: RestPatternId
  /** 平均每周休息天数；null 表示未公开、无法确证 */
  weeklyRestDays: number | null
  /** 周均工时；null 表示未公开 */
  weeklyHours: number | null
  /** 制度生效时间，如 2026-01 */
  since: string
  /** 覆盖范围：全员 / 总部 / 研发体系 / 某工厂 … */
  scope: string
  /** 制度要点 */
  policy: string
  note?: string
  evidence: EvidenceLevel
  sources: Source[]
  /** 一句话亮点，用于卡片与详情展示（吸睛、真实，不夸大） */
  slogan?: string
  /** 亮点标签，如「反内卷标杆」「出口欧洲」「不降薪四天」 */
  tags?: string[]
  /** 成立年份，如 1984；null 表示未见公开披露 */
  founded?: string
  /** 总部所在城市 / 国家 */
  hq?: string
  /** 规模描述（员工数 / 营收 / 基地数等），公开可查者 */
  scale?: string
  /** 官方网站 */
  website?: string
  /** 工厂 / 生产基地 / 网点列表（制造、轮休、网点类企业重点填） */
  factories?: { name: string; city: string; note?: string }[]
  /** 详细介绍：发展背景、双休制度由来、行业地位等 */
  detail?: string
}

export interface Industry {
  id: string
  name: string
  desc: string
}

export interface IndustryBenchmark {
  industryId: string
  /** 行业平均月加班时长（小时），null 表示无公开数据 */
  monthlyOtHours: [number, number] | null
  /** 行业双休落地情况描述 */
  status: string
  /** 趋势 */
  trend: '改善' | '持平' | '恶化' | '不明'
  /** 驱动因素 */
  drivers: string[]
  sources: Source[]
}
