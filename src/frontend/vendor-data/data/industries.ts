import type { Industry } from '../types'

export const INDUSTRIES: Industry[] = [
  { id: 'auto', name: '汽车与出行', desc: '整车制造、新能源车企、汽车零部件、出行服务' },
  { id: 'tech3c', name: '消费电子 / 智能硬件', desc: '无人机、手机电脑、影像设备、智能穿戴、机器人' },
  { id: 'appliance', name: '家电', desc: '白电、厨电、小家电、清洁电器' },
  { id: 'internet', name: '互联网 / 软件 / 游戏', desc: '平台服务、社交通讯、电商、游戏、企业软件' },
  { id: 'food', name: '食品饮料', desc: '饮料、休闲食品、调味品、农牧食品、餐饮连锁' },
  { id: 'retail', name: '零售 / 商超 / 电商', desc: '连锁商超、会员店、运动零售、折扣百货' },
  { id: 'home', name: '家居 / 家装', desc: '家具、板材家居、家装零售、家居卖场' },
  { id: 'manufacturing', name: '制造 / 工业 / 半导体', desc: '集成电路、电梯设备、工业电气、精密制造' },
  { id: 'pharma', name: '医药健康', desc: '医学检验、医疗器械、生物医药、健康科技' },
  { id: 'finance', name: '金融 / 保险', desc: '银行、保险、证券、支付与金融科技' },
  { id: 'edu', name: '教育 / 培训', desc: '职业教育、考研规划、在线教育、企业培训' },
  { id: 'logistics', name: '物流 / 供应链', desc: '快递、即时配送、干线运输、仓储供应链' },
  { id: 'energy', name: '能源 / 化工 / 材料', desc: '动力电池、工业气体、化工新材、电力' },
  { id: 'culture', name: '文化 / 传媒', desc: '影视、内容创作、MCN、广告营销' },
  { id: 'daily', name: '日化 / 服饰 / 快消', desc: '生活用纸、个护日化、运动服饰、美妆' },
  { id: 'telecom', name: '通信 / 运营商', desc: '基础电信运营商、通信设备、网络服务' },
]

export const INDUSTRY_MAP: Record<string, Industry> = Object.fromEntries(
  INDUSTRIES.map((i) => [i.id, i]),
)
