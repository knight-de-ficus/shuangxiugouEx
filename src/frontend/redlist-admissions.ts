import type { AuditStatus, CompanyRole, ConfidenceLevel, RedlistAdmission } from './types';
import type { Source } from './vendor-data/types';

export interface RedlistAdmissionRecord {
  admission: RedlistAdmission;
  companyRole: CompanyRole;
  confidence: ConfidenceLevel;
  verifiedScope: string;
  verifiedAt: string;
  inclusionSummary: string;
  limitations: string[];
  supplyChainProducts: string[];
  sources: Source[];
  auditStatus?: AuditStatus;
}

/** 人工筛选表于 2026-09-27 标记为“展示”的公开红榜名单。 */
export const REDLIST_IDS = [
  "tesla-cn",
  "lenovo",
  "letv",
  "vipshop",
  "decathlon",
  "sam-club",
  "nike-cn",
  "lego-cn",
  "microsoft-cn",
  "google-cn",
  "apple-cn",
  "qualcomm-cn",
  "intel-cn",
  "oracle-cn",
  "cisco-cn",
  "canva-cn",
  "microstrategy-cn",
  "hsbc-cn",
  "ericsson-cn",
  "gen0059",
  "gen0060",
  "gen0199",
  "gen0236",
  "gen0299",
  "gen0308",
  "gen0351",
  "gen0683"
] as const;

export const REDLIST_ADMISSIONS: Record<string, RedlistAdmissionRecord> = {
  "tesla-cn": {
    admission: 'public_evidence_trial',
    companyRole: "consumer",
    confidence: "中等",
    verifiedScope: "上海超级工厂产线",
    verifiedAt: '2026-09-27',
    inclusionSummary: "开除提议延长工时的产线组长，立工时红线",
    limitations: [
  "缺少周工时",
  "核实周工时",
  "属于以处罚性案例确立工时红线的做法，而非发布制度文件。"
],
    supplyChainProducts: [],
    sources: [
  {
    "title": "风向变了！多家知名企业带头「反内卷」",
    "url": "https://news.qq.com/rain/a/20260109A073H200",
    "date": "2026-01-09",
    "publisher": "腾讯新闻"
  }
],
  },
  "lenovo": {
    admission: 'public_evidence_trial',
    companyRole: "both",
    confidence: "较高",
    verifiedScope: "全员倡导",
    verifiedAt: '2026-09-27',
    inclusionSummary: "PC 全球第一，职能岗标准双休",
    limitations: [
  "缺少周工时",
  "核实周工时"
],
    supplyChainProducts: [
  "ThinkPad",
  "Yoga",
  "拯救者",
  "ThinkSystem 服务器",
  "摩托罗拉手机"
],
    sources: [
  {
    "title": "风向变了！多家知名企业带头「反内卷」",
    "url": "https://news.qq.com/rain/a/20260109A073H200",
    "date": "2026-01-09",
    "publisher": "腾讯新闻"
  },
  {
    "title": "955.WLB Issue #318：Lenovo",
    "url": "https://github.com/formulahendry/955.WLB/issues/318",
    "date": "2024-03-25",
    "publisher": "GitHub · 955.WLB"
  }
],
  },
  "letv": {
    admission: 'public_evidence_trial',
    companyRole: "consumer",
    confidence: "较高",
    verifiedScope: "乐视视频与乐视智能生态两个业务团队，涉及约 300—400 人",
    verifiedAt: '2026-09-27',
    inclusionSummary: "上四休三且不降薪",
    limitations: [
  "复核主体、岗位、基地和持续执行情况",
  "员工反馈：周三下午 2 点前打卡即可，可安排就医、接送孩子；300 多名员工「没有人卷」，压力给到领导层。员工称这是「快乐星期三」。"
],
    supplyChainProducts: [],
    sources: [
  {
    "title": "海报观察｜乐视宣布实行四天半工作制",
    "url": "https://www.dzwww.com/xinwen/shehuixinwen/202301/t20230104_11250545.htm",
    "date": "2023-01-04",
    "publisher": "大众网"
  },
  {
    "title": "互联网「上四休三」有多难？",
    "url": "https://youle.zhipin.com/articles/9b8ec1d29b4a7a78qxB_2d21FA~~.html",
    "date": "2024",
    "publisher": "BOSS直聘"
  },
  {
    "title": "944.Life 收录案例：乐视：励志上班四天半！",
    "url": "https://mp.weixin.qq.com/s/-5cLxaHFxF8clM4W0jAkqA",
    "date": "2022-08-07",
    "publisher": "GitHub · 944.Life"
  }
],
  },
  "vipshop": {
    admission: 'public_evidence_trial',
    companyRole: "consumer",
    confidence: "中等",
    verifiedScope: "总部职能岗",
    verifiedAt: '2026-09-27',
    inclusionSummary: "特卖电商，双休稳定",
    limitations: [
  "缺少周工时",
  "核实周工时",
  "补充权威或官方来源"
],
    supplyChainProducts: [],
    sources: [
  {
    "title": "双休有哪些公司（分地区整理）",
    "url": "https://aiqicha.baidu.com/details/ugknowledge?id=929cf9e197e7248b7dae72279b1e4a26",
    "date": "2026-08",
    "publisher": "爱企查"
  },
  {
    "title": "955.WLB README 白名单：Vipshop (唯品会) - 上海",
    "url": "https://github.com/formulahendry/955.WLB",
    "date": "2025-02-03",
    "publisher": "GitHub · 955.WLB"
  },
  {
    "title": "955.WLB Issue #172：唯品会真是一枝独秀",
    "url": "https://github.com/formulahendry/955.WLB/issues/172",
    "date": "2019-04-08",
    "publisher": "GitHub · 955.WLB"
  }
],
  },
  "decathlon": {
    admission: 'public_evidence_trial',
    companyRole: "consumer",
    confidence: "初步",
    verifiedScope: "在华员工",
    verifiedAt: '2026-09-27',
    inclusionSummary: "运动零售法企，双休 + 弹性",
    limitations: [
  "补充权威或官方来源"
],
    supplyChainProducts: [],
    sources: [
  {
    "title": "上有老下有小，以后买双休企业的产品",
    "url": "https://www.toutiao.com/article/7682414218775183895",
    "date": "2026-09-06",
    "publisher": "今日头条"
  }
],
  },
  "sam-club": {
    admission: 'public_evidence_trial',
    companyRole: "consumer",
    confidence: "初步",
    verifiedScope: "在华员工（门店为排班制）",
    verifiedAt: '2026-09-27',
    inclusionSummary: "山姆会员店，零售双休",
    limitations: [
  "补充权威或官方来源"
],
    supplyChainProducts: [],
    sources: [
  {
    "title": "上有老下有小，以后买双休企业的产品",
    "url": "https://www.toutiao.com/article/7682414218775183895",
    "date": "2026-09-06",
    "publisher": "今日头条"
  }
],
  },
  "nike-cn": {
    admission: 'public_evidence_trial',
    companyRole: "consumer",
    confidence: "较高",
    verifiedScope: "仅限办公室员工",
    verifiedAt: '2026-09-27',
    inclusionSummary: "运动巨头在华，双休 + 弹性",
    limitations: [
  "复核主体、岗位、基地和持续执行情况",
  "官方明确否认「上四休三」，本条按混合办公归类，工时总量不变。"
],
    supplyChainProducts: [],
    sources: [
  {
    "title": "「每周工作4天」又冲上热搜！某公司回应了！",
    "url": "https://static.nfapp.southcn.com/content/202310/25/c8232544.html",
    "date": "2023-10-25",
    "publisher": "南方+"
  },
  {
    "title": "「上四休三」新型混合办公模式流行",
    "url": "https://www.51ldb.com/shsldb/dc/content/018b6b0a6468c0010000ada09aaa8097.htm",
    "date": "2023-10",
    "publisher": "劳动报"
  },
  {
    "title": "955.WLB README 白名单：Nike - 上海",
    "url": "https://github.com/formulahendry/955.WLB",
    "date": "2025-02-03",
    "publisher": "GitHub · 955.WLB"
  }
],
  },
  "lego-cn": {
    admission: 'public_evidence_trial',
    companyRole: "consumer",
    confidence: "初步",
    verifiedScope: "办公室岗位",
    verifiedAt: '2026-09-27',
    inclusionSummary: "乐高在华，双休稳定",
    limitations: [
  "补充权威或官方来源"
],
    supplyChainProducts: [],
    sources: [
  {
    "title": "外企小而美",
    "url": "https://aiqicha.baidu.com/details/ugknowledge?id=7220c555693fa0f7cbf09cfc0bc68f80",
    "date": "2026",
    "publisher": "爱企查"
  },
  {
    "title": "北京好的外企",
    "url": "https://aiqicha.baidu.com/details/ugknowledge?id=cea33a601a9ed8f8ca1b33f6ac6bf2d1",
    "date": "2026",
    "publisher": "爱企查"
  },
  {
    "title": "955.WLB README 白名单：LEGO Group - 上海",
    "url": "https://github.com/formulahendry/955.WLB",
    "date": "2025-02-03",
    "publisher": "GitHub · 955.WLB"
  }
],
  },
  "microsoft-cn": {
    admission: 'public_evidence_trial',
    companyRole: "both",
    confidence: "初步",
    verifiedScope: "办公室岗位",
    verifiedAt: '2026-09-27',
    inclusionSummary: "微软在华，双休 + 弹性",
    limitations: [
  "补充权威或官方来源"
],
    supplyChainProducts: [
  "Windows",
  "Microsoft 365",
  "Azure",
  "Surface",
  "Copilot",
  "Teams"
],
    sources: [
  {
    "title": "北京好的外企",
    "url": "https://aiqicha.baidu.com/details/ugknowledge?id=cea33a601a9ed8f8ca1b33f6ac6bf2d1",
    "date": "2026",
    "publisher": "爱企查"
  },
  {
    "title": "955.WLB README 白名单：Microsoft - 北京/上海/苏州",
    "url": "https://github.com/formulahendry/955.WLB",
    "date": "2025-02-03",
    "publisher": "GitHub · 955.WLB"
  },
  {
    "title": "955.WLB Issue #42：[955公司内推] 微软热招",
    "url": "https://github.com/formulahendry/955.WLB/issues/42",
    "date": "2019-03-28",
    "publisher": "GitHub · 955.WLB"
  },
  {
    "title": "944.Life 收录案例：微软日本公布“上四休三”新工作制结果：员工效率提高40%",
    "url": "https://mp.weixin.qq.com/s/G0GhpfJc_LaWiLeDfytaig",
    "date": "2022-08-07",
    "publisher": "GitHub · 944.Life"
  },
  {
    "title": "944.Life 收录案例：微软给所有员工加了 5 天假期！我今年还剩 41.5 天年假。",
    "url": "https://mp.weixin.qq.com/s/t6Ck3c75pB5SsrdrNd4kjg",
    "date": "2022-08-07",
    "publisher": "GitHub · 944.Life"
  }
],
  },
  "google-cn": {
    admission: 'public_evidence_trial',
    companyRole: "both",
    confidence: "初步",
    verifiedScope: "办公室岗位（硬件团队相对更卷）",
    verifiedAt: '2026-09-27',
    inclusionSummary: "谷歌在华，双休稳定",
    limitations: [
  "补充权威或官方来源"
],
    supplyChainProducts: [
  "Google 搜索",
  "Android",
  "Google Cloud",
  "Gemini",
  "Google Workspace",
  "Google Maps"
],
    sources: [
  {
    "title": "神仙外企榜单",
    "url": "https://www.toutiao.com/article/7627819893836087808/",
    "date": "2026",
    "publisher": "今日头条"
  },
  {
    "title": "北京好的外企",
    "url": "https://aiqicha.baidu.com/details/ugknowledge?id=cea33a601a9ed8f8ca1b33f6ac6bf2d1",
    "date": "2026",
    "publisher": "爱企查"
  },
  {
    "title": "955.WLB README 白名单：Google - 北京/上海",
    "url": "https://github.com/formulahendry/955.WLB",
    "date": "2025-02-03",
    "publisher": "GitHub · 955.WLB"
  }
],
  },
  "apple-cn": {
    admission: 'public_evidence_trial',
    companyRole: "consumer",
    confidence: "初步",
    verifiedScope: "办公室岗位",
    verifiedAt: '2026-09-27',
    inclusionSummary: "苹果在华，双休 + 弹性",
    limitations: [
  "补充权威或官方来源"
],
    supplyChainProducts: [],
    sources: [
  {
    "title": "北京好的外企",
    "url": "https://aiqicha.baidu.com/details/ugknowledge?id=cea33a601a9ed8f8ca1b33f6ac6bf2d1",
    "date": "2026",
    "publisher": "爱企查"
  },
  {
    "title": "955.WLB README 白名单：Apple - 北京/上海",
    "url": "https://github.com/formulahendry/955.WLB",
    "date": "2025-02-03",
    "publisher": "GitHub · 955.WLB"
  }
],
  },
  "qualcomm-cn": {
    admission: 'public_evidence_trial',
    companyRole: "supplier",
    confidence: "初步",
    verifiedScope: "办公室与研发岗位",
    verifiedAt: '2026-09-27',
    inclusionSummary: "高通在华，双休稳定",
    limitations: [
  "补充权威或官方来源"
],
    supplyChainProducts: [
  "骁龙移动平台",
  "5G 基带",
  "汽车芯片",
  "物联网芯片",
  "射频前端"
],
    sources: [
  {
    "title": "北京好的外企",
    "url": "https://aiqicha.baidu.com/details/ugknowledge?id=cea33a601a9ed8f8ca1b33f6ac6bf2d1",
    "date": "2026",
    "publisher": "爱企查"
  },
  {
    "title": "955.WLB README 白名单：Qualcomm - 北京/上海",
    "url": "https://github.com/formulahendry/955.WLB",
    "date": "2025-02-03",
    "publisher": "GitHub · 955.WLB"
  }
],
  },
  "intel-cn": {
    admission: 'public_evidence_trial',
    companyRole: "supplier",
    confidence: "初步",
    verifiedScope: "办公室与研发岗位（大连、成都工厂产线为轮班制）",
    verifiedAt: '2026-09-27',
    inclusionSummary: "英特尔在华，双休 + 弹性",
    limitations: [
  "补充权威或官方来源",
  "大连、成都等晶圆厂产线岗位为轮班制，与办公室岗位制度不同。"
],
    supplyChainProducts: [
  "酷睿处理器",
  "至强服务器芯片",
  "数据中心产品",
  "FPGA",
  "晶圆代工服务"
],
    sources: [
  {
    "title": "北京好的外企",
    "url": "https://aiqicha.baidu.com/details/ugknowledge?id=cea33a601a9ed8f8ca1b33f6ac6bf2d1",
    "date": "2026",
    "publisher": "爱企查"
  },
  {
    "title": "955.WLB README 白名单：Intel - 北京/上海/深圳",
    "url": "https://github.com/formulahendry/955.WLB",
    "date": "2025-02-03",
    "publisher": "GitHub · 955.WLB"
  },
  {
    "title": "955.WLB Issue #143：[955公司内推] Intel上海 最新招聘 深度学习实习生",
    "url": "https://github.com/formulahendry/955.WLB/issues/143",
    "date": "2019-04-03",
    "publisher": "GitHub · 955.WLB"
  },
  {
    "title": "955.WLB Issue #219：NEW！！！Intel上海 最新实习生招聘信息 Deep Learning Software Intern",
    "url": "https://github.com/formulahendry/955.WLB/issues/219",
    "date": "2019-12-16",
    "publisher": "GitHub · 955.WLB"
  },
  {
    "title": "955.WLB Issue #290：Intel 大数据团队招聘",
    "url": "https://github.com/formulahendry/955.WLB/issues/290",
    "date": "2022-03-09",
    "publisher": "GitHub · 955.WLB"
  },
  {
    "title": "944.Life 收录案例：上海三大 IT 养老院 ( IBM, Intel, EMC ) 的故事",
    "url": "https://www.zhihu.com/question/38934808/answer/588953577",
    "date": "2022-08-07",
    "publisher": "GitHub · 944.Life"
  },
  {
    "title": "944.Life 收录案例：Intel，有效工作时间在5小时以内？",
    "url": "https://mp.weixin.qq.com/s/dhgZpQ82_uMnJDTagylQOA",
    "date": "2022-08-07",
    "publisher": "GitHub · 944.Life"
  }
],
  },
  "oracle-cn": {
    admission: 'public_evidence_trial',
    companyRole: "supplier",
    confidence: "初步",
    verifiedScope: "办公室岗位",
    verifiedAt: '2026-09-27',
    inclusionSummary: "Oracle 在华，双休稳定",
    limitations: [
  "补充权威或官方来源"
],
    supplyChainProducts: [
  "Oracle Database",
  "Oracle Cloud",
  "MySQL",
  "Java",
  "企业应用软件",
  "NetSuite"
],
    sources: [
  {
    "title": "北京好的外企",
    "url": "https://aiqicha.baidu.com/details/ugknowledge?id=cea33a601a9ed8f8ca1b33f6ac6bf2d1",
    "date": "2026",
    "publisher": "爱企查"
  },
  {
    "title": "955.WLB README 白名单：Oracle - 上海",
    "url": "https://github.com/formulahendry/955.WLB",
    "date": "2025-02-03",
    "publisher": "GitHub · 955.WLB"
  }
],
  },
  "cisco-cn": {
    admission: 'public_evidence_trial',
    companyRole: "supplier",
    confidence: "初步",
    verifiedScope: "办公室岗位",
    verifiedAt: '2026-09-27',
    inclusionSummary: "思科在华，双休 + 弹性",
    limitations: [
  "补充权威或官方来源"
],
    supplyChainProducts: [
  "交换机",
  "路由器",
  "Webex",
  "网络安全产品",
  "数据中心网络"
],
    sources: [
  {
    "title": "北京好的外企",
    "url": "https://aiqicha.baidu.com/details/ugknowledge?id=cea33a601a9ed8f8ca1b33f6ac6bf2d1",
    "date": "2026",
    "publisher": "爱企查"
  },
  {
    "title": "955.WLB README 白名单：Cisco - 北京/上海/杭州/苏州",
    "url": "https://github.com/formulahendry/955.WLB",
    "date": "2025-02-03",
    "publisher": "GitHub · 955.WLB"
  }
],
  },
  "canva-cn": {
    admission: 'public_evidence_trial',
    companyRole: "consumer",
    confidence: "初步",
    verifiedScope: "办公室岗位",
    verifiedAt: '2026-09-27',
    inclusionSummary: "Canva 在华，远程友好",
    limitations: [
  "补充权威或官方来源"
],
    supplyChainProducts: [],
    sources: [
  {
    "title": "外企小而美",
    "url": "https://aiqicha.baidu.com/details/ugknowledge?id=7220c555693fa0f7cbf09cfc0bc68f80",
    "date": "2026",
    "publisher": "爱企查"
  },
  {
    "title": "955.WLB README 白名单：Canva - 北京/武汉",
    "url": "https://github.com/formulahendry/955.WLB",
    "date": "2025-02-03",
    "publisher": "GitHub · 955.WLB"
  }
],
  },
  "microstrategy-cn": {
    admission: 'public_evidence_trial',
    companyRole: "supplier",
    confidence: "初步",
    verifiedScope: "办公室岗位",
    verifiedAt: '2026-09-27',
    inclusionSummary: "MicroStrategy 在华，双休",
    limitations: [
  "补充权威或官方来源"
],
    supplyChainProducts: [
  "MicroStrategy BI 平台",
  "数据分析产品",
  "移动 BI",
  "AI 报表"
],
    sources: [
  {
    "title": "外企小而美",
    "url": "https://aiqicha.baidu.com/details/ugknowledge?id=7220c555693fa0f7cbf09cfc0bc68f80",
    "date": "2026",
    "publisher": "爱企查"
  },
  {
    "title": "955.WLB README 白名单：MicroStrategy - 杭州",
    "url": "https://github.com/formulahendry/955.WLB",
    "date": "2025-02-03",
    "publisher": "GitHub · 955.WLB"
  }
],
  },
  "hsbc-cn": {
    admission: 'public_evidence_trial',
    companyRole: "consumer",
    confidence: "初步",
    verifiedScope: "办公室岗位",
    verifiedAt: '2026-09-27',
    inclusionSummary: "汇丰在华，双休稳定",
    limitations: [
  "补充权威或官方来源"
],
    supplyChainProducts: [],
    sources: [
  {
    "title": "北京好的外企",
    "url": "https://aiqicha.baidu.com/details/ugknowledge?id=cea33a601a9ed8f8ca1b33f6ac6bf2d1",
    "date": "2026",
    "publisher": "爱企查"
  },
  {
    "title": "广州这些外企还是很值得去的！",
    "url": "https://www.hanlefang.net/xiu-ctgtxtnbnbgdcdxntg.html",
    "date": "2026",
    "publisher": "hanlefang"
  },
  {
    "title": "955.WLB README 白名单：HSBC - 上海/广州/西安",
    "url": "https://github.com/formulahendry/955.WLB",
    "date": "2025-02-03",
    "publisher": "GitHub · 955.WLB"
  },
  {
    "title": "955.WLB Issue #136：更正：HSBC是最讲平衡生活的",
    "url": "https://github.com/formulahendry/955.WLB/issues/136",
    "date": "2019-04-03",
    "publisher": "GitHub · 955.WLB"
  }
],
  },
  "ericsson-cn": {
    admission: 'public_evidence_trial',
    companyRole: "supplier",
    confidence: "初步",
    verifiedScope: "办公室与研发岗位",
    verifiedAt: '2026-09-27',
    inclusionSummary: "爱立信在华，双休 + 弹性",
    limitations: [
  "补充权威或官方来源"
],
    supplyChainProducts: [
  "5G 基站",
  "核心网",
  "微波传输",
  "网络管理软件",
  "企业无线解决方案"
],
    sources: [
  {
    "title": "广州这些外企还是很值得去的！",
    "url": "https://www.hanlefang.net/xiu-ctgtxtnbnbgdcdxntg.html",
    "date": "2026",
    "publisher": "hanlefang"
  },
  {
    "title": "955.WLB README 白名单：Ericsson - 上海",
    "url": "https://github.com/formulahendry/955.WLB",
    "date": "2025-02-03",
    "publisher": "GitHub · 955.WLB"
  }
],
  },
  "gen0059": {
    admission: 'public_evidence_trial',
    companyRole: "both",
    confidence: "中等",
    verifiedScope: "办公室 / 研发中心岗（按行业普遍情况归类）",
    verifiedAt: '2026-09-27',
    inclusionSummary: "外资企业（含独资与外商投资的研发中心、办公室）在华普遍执行标准工时与周末双休，职能与研发岗为标准双休，生产按排班。本条依据行业惯例归类，非单一官方公告，建议以面试 / Offer 核实。",
    limitations: [
  "缺少周休与周工时",
  "核实周休天数",
  "核实周工时",
  "补充权威或官方来源",
  "不能以行业惯例代替企业事实",
  "本条目依据行业普遍情况归类，非单一官方公告，建议以面试 / Offer 确认为准。"
],
    supplyChainProducts: [
  "ESP",
  "电驱",
  "传感器"
],
    sources: [
  {
    "title": "企业官网",
    "url": "https://www.bosch.com.cn",
    "date": "—",
    "publisher": "企业官网"
  },
  {
    "title": "955.WLB README 白名单：Bosch Group - 上海/苏州/无锡",
    "url": "https://github.com/formulahendry/955.WLB",
    "date": "2025-02-03",
    "publisher": "GitHub · 955.WLB"
  }
],
  },
  "gen0060": {
    admission: 'public_evidence_trial',
    companyRole: "supplier",
    confidence: "中等",
    verifiedScope: "办公室 / 研发中心岗（按行业普遍情况归类）",
    verifiedAt: '2026-09-27',
    inclusionSummary: "外资企业（含独资与外商投资的研发中心、办公室）在华普遍执行标准工时与周末双休，职能与研发岗为标准双休，生产按排班。本条依据行业惯例归类，非单一官方公告，建议以面试 / Offer 核实。",
    limitations: [
  "缺少周休与周工时",
  "核实周休天数",
  "核实周工时",
  "补充权威或官方来源",
  "不能以行业惯例代替企业事实",
  "本条目依据行业普遍情况归类，非单一官方公告，建议以面试 / Offer 确认为准。"
],
    supplyChainProducts: [
  "轮胎",
  "座舱",
  "ADAS"
],
    sources: [
  {
    "title": "企业官网",
    "url": "https://www.continental.com",
    "date": "—",
    "publisher": "企业官网"
  },
  {
    "title": "955.WLB README 白名单：Continental AG - 上海/合肥",
    "url": "https://github.com/formulahendry/955.WLB",
    "date": "2025-02-03",
    "publisher": "GitHub · 955.WLB"
  }
],
  },
  "gen0199": {
    admission: 'public_evidence_trial',
    companyRole: "consumer",
    confidence: "中等",
    verifiedScope: "办公室 / 研发中心岗（按行业普遍情况归类）",
    verifiedAt: '2026-09-27',
    inclusionSummary: "外资企业（含独资与外商投资的研发中心、办公室）在华普遍执行标准工时与周末双休，职能与研发岗为标准双休，生产按排班。本条依据行业惯例归类，非单一官方公告，建议以面试 / Offer 核实。",
    limitations: [
  "缺少周休与周工时",
  "核实周休天数",
  "核实周工时",
  "补充权威或官方来源",
  "不能以行业惯例代替企业事实",
  "本条目依据行业普遍情况归类，非单一官方公告，建议以面试 / Offer 确认为准。"
],
    supplyChainProducts: [],
    sources: [
  {
    "title": "企业官网",
    "url": "https://www.philips.com.cn",
    "date": "—",
    "publisher": "企业官网"
  },
  {
    "title": "955.WLB README 白名单：Philips - 上海/苏州",
    "url": "https://github.com/formulahendry/955.WLB",
    "date": "2025-02-03",
    "publisher": "GitHub · 955.WLB"
  }
],
  },
  "gen0236": {
    admission: 'public_evidence_trial',
    companyRole: "consumer",
    confidence: "初步",
    verifiedScope: "依岗位而定（按行业普遍情况归类）",
    verifiedAt: '2026-09-27',
    inclusionSummary: "民营企业休息制度差异较大：职能岗多为标准双休，生产一线常轮班作业。本条按行业普遍情况归类，待核实，建议以面试 / Offer 确认。",
    limitations: [
  "缺少周休与周工时",
  "核实周休天数",
  "核实周工时",
  "补充权威或官方来源",
  "不能以行业惯例代替企业事实",
  "本条目依据行业普遍情况归类，非单一官方公告，建议以面试 / Offer 确认为准。"
],
    supplyChainProducts: [],
    sources: [
  {
    "title": "企业官网",
    "url": "https://www.mihoyo.com",
    "date": "—",
    "publisher": "企业官网"
  },
  {
    "title": "955.WLB Issue #286：推荐新公司 & Feature.com炸了",
    "url": "https://github.com/formulahendry/955.WLB/issues/286",
    "date": "2022-01-19",
    "publisher": "GitHub · 955.WLB"
  }
],
  },
  "gen0299": {
    admission: 'public_evidence_trial',
    companyRole: "consumer",
    confidence: "初步",
    verifiedScope: "依岗位而定（按行业普遍情况归类）",
    verifiedAt: '2026-09-27',
    inclusionSummary: "民营企业休息制度差异较大：职能岗多为标准双休，生产一线常轮班作业。本条按行业普遍情况归类，待核实，建议以面试 / Offer 确认。",
    limitations: [
  "缺少周休与周工时",
  "核实周休天数",
  "核实周工时",
  "补充权威或官方来源",
  "不能以行业惯例代替企业事实",
  "本条目依据行业普遍情况归类，非单一官方公告，建议以面试 / Offer 确认为准。"
],
    supplyChainProducts: [],
    sources: [
  {
    "title": "企业官网",
    "url": "https://www.douban.com",
    "date": "—",
    "publisher": "企业官网"
  },
  {
    "title": "955.WLB README 白名单：Douban (豆瓣) - 北京",
    "url": "https://github.com/formulahendry/955.WLB",
    "date": "2025-02-03",
    "publisher": "GitHub · 955.WLB"
  }
],
  },
  "gen0308": {
    admission: 'public_evidence_trial',
    companyRole: "consumer",
    confidence: "初步",
    verifiedScope: "办公室 / 研发中心岗（按行业普遍情况归类）",
    verifiedAt: '2026-09-27',
    inclusionSummary: "外资企业（含独资与外商投资的研发中心、办公室）在华普遍执行标准工时与周末双休，职能与研发岗为标准双休，生产按排班。本条依据行业惯例归类，非单一官方公告，建议以面试 / Offer 核实。",
    limitations: [
  "缺少周休与周工时",
  "核实周休天数",
  "核实周工时",
  "补充权威或官方来源",
  "不能以行业惯例代替企业事实",
  "核查 GitHub 反向 Issue",
  "本条目依据行业普遍情况归类，非单一官方公告，建议以面试 / Offer 确认为准。",
  "955.WLB Issue #247 提出反向意见，需持续复核实际执行情况"
],
    supplyChainProducts: [],
    sources: [
  {
    "title": "企业官网",
    "url": "https://www.shopee.cn",
    "date": "—",
    "publisher": "企业官网"
  },
  {
    "title": "955.WLB Issue #56：深圳一家很不错的外企公司推荐！！向往955的帮忙顶起来",
    "url": "https://github.com/formulahendry/955.WLB/issues/56",
    "date": "2019-03-29",
    "publisher": "GitHub · 955.WLB"
  },
  {
    "title": "955.WLB Issue #317：[Propose new company] shopee",
    "url": "https://github.com/formulahendry/955.WLB/issues/317",
    "date": "2024-03-25",
    "publisher": "GitHub · 955.WLB"
  },
  {
    "title": "反向线索 · 955.WLB Issue #247：shopee不是955， 请移除",
    "url": "https://github.com/formulahendry/955.WLB/issues/247",
    "date": "2020-11-13",
    "publisher": "GitHub · 955.WLB"
  }
],
    auditStatus: 'disputed',
  },
  "gen0351": {
    admission: 'public_evidence_trial',
    companyRole: "consumer",
    confidence: "中等",
    verifiedScope: "办公室 / 研发中心岗（按行业普遍情况归类）",
    verifiedAt: '2026-09-27',
    inclusionSummary: "外资企业（含独资与外商投资的研发中心、办公室）在华普遍执行标准工时与周末双休，职能与研发岗为标准双休，生产按排班。本条依据行业惯例归类，非单一官方公告，建议以面试 / Offer 核实。",
    limitations: [
  "缺少周休与周工时",
  "核实周休天数",
  "核实周工时",
  "补充权威或官方来源",
  "不能以行业惯例代替企业事实",
  "本条目依据行业普遍情况归类，非单一官方公告，建议以面试 / Offer 确认为准。"
],
    supplyChainProducts: [],
    sources: [
  {
    "title": "企业官网",
    "url": "https://www.starbucks.com.cn",
    "date": "—",
    "publisher": "企业官网"
  },
  {
    "title": "955.WLB README 白名单：Starbucks - 上海",
    "url": "https://github.com/formulahendry/955.WLB",
    "date": "2025-02-03",
    "publisher": "GitHub · 955.WLB"
  }
],
  },
  "gen0683": {
    admission: 'public_evidence_trial',
    companyRole: "consumer",
    confidence: "中等",
    verifiedScope: "职能 / 研发 / 职能支持岗（按行业普遍情况归类）",
    verifiedAt: '2026-09-27',
    inclusionSummary: "央企 / 国有企业用工普遍执行《劳动法》标准工时（每日 8 小时、每周 40 小时、周末双休），职能、研发、职能支持岗为标准双休；生产一线按排班轮休。本条依据国企用工惯例与公开招聘信息归类，非单一企业官方公告，实际以 Offer 与岗位为准。",
    limitations: [
  "缺少周休与周工时",
  "核实周休天数",
  "核实周工时",
  "补充权威或官方来源",
  "不能以行业惯例代替企业事实",
  "本条目依据行业普遍情况归类，非单一官方公告，建议以面试 / Offer 确认为准。"
],
    supplyChainProducts: [],
    sources: [
  {
    "title": "企业官网",
    "url": "https://www.icbc.com",
    "date": "—",
    "publisher": "企业官网"
  },
  {
    "title": "955.WLB Issue #63：工商银行955-995",
    "url": "https://github.com/formulahendry/955.WLB/issues/63",
    "date": "2019-03-29",
    "publisher": "GitHub · 955.WLB"
  }
],
  },
};
