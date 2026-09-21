import { useCallback, useEffect, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Search,
  Heart,
  ThumbsDown,
  Sparkles,
  HelpCircle,
  ChevronRight,
  Building,
  Receipt,
  CheckCircle2,
  Filter,
  Clock,
  UserCheck,
  ShoppingBag,
  MessageSquare,
  Compass
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { INITIAL_BRANDS, CATEGORIES } from './data';
import type { BrandItem, WlbTier } from './types';
import { AnimatedCounter } from './components/AnimatedCounter';
import { ReceiptModal } from './components/ReceiptModal';
import { EmployeeVoteModal } from './components/EmployeeVoteModal';
import { ShoppingLens } from './components/ShoppingLens';
import { CommunityLounge } from './components/CommunityLounge';
import { getBrandMark } from './utils/brand.js';
import {
  getSiteStats,
  submitEmployeeReport,
  submitLead,
  submitPurchasePledge,
  voteForBrand,
} from './api/client';

const BRANDS_PER_PAGE = 24;

export function App() {
  const [activeMainTab, setActiveMainTab] = useState<'brands' | 'shopping' | 'community'>('brands');
  const [brands, setBrands] = useState<BrandItem[]>(INITIAL_BRANDS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedTier, setSelectedTier] = useState<string>('全部');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBrand, setSelectedBrand] = useState<BrandItem | null>(null);

  // 互动数据
  const [transferredAmount, setTransferredAmount] = useState(0);
  const [userVoteHistory, setUserVoteHistory] = useState<Record<string, 'up' | 'down'>>({});
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketBrand, setTicketBrand] = useState<BrandItem | null>(null);
  const [ticketAmount] = useState(199);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [votingEmployeeBrand, setVotingEmployeeBrand] = useState<BrandItem | null>(null);
  const [notice, setNotice] = useState('');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  const refreshStats = useCallback(async () => {
    const stats = await getSiteStats();
    setTransferredAmount(stats.transferredAmount);
    setBrands(
      INITIAL_BRANDS.map((brand) => ({
        ...brand,
        ...stats.votes[brand.id],
        employeeStats: stats.employeeStats[brand.id],
      })),
    );
    setSelectedBrand((current) =>
      current
        ? {
            ...current,
            ...stats.votes[current.id],
            employeeStats: stats.employeeStats[current.id],
          }
        : null,
    );
  }, []);

  useEffect(() => {
    void refreshStats().catch(() => setNotice('互动数据暂时无法加载，请稍后重试。'));
  }, [refreshStats]);

  // 筛选过滤
  const filteredBrands = brands.filter((brand) => {
    const matchesSearch =
      brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.keyProducts.some((p) => p.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === '全部' || brand.category === selectedCategory;
    const matchesTier = selectedTier === '全部' || brand.tier === selectedTier;

    return matchesSearch && matchesCategory && matchesTier;
  });
  const totalPages = Math.max(1, Math.ceil(filteredBrands.length / BRANDS_PER_PAGE));
  const visiblePage = Math.min(currentPage, totalPages);
  const pagedBrands = filteredBrands.slice(
    (visiblePage - 1) * BRANDS_PER_PAGE,
    visiblePage * BRANDS_PER_PAGE,
  );

  const handleBrandVote = async (id: string, voteType: 'up' | 'down') => {
    if (userVoteHistory[id]) return;
    setNotice('');
    try {
      await voteForBrand(id, voteType);
      setUserVoteHistory((prev) => ({ ...prev, [id]: voteType }));
      await refreshStats();
      if (voteType === 'up') confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '投票保存失败。');
    }
  };

  const handleUpvote = (id: string) => void handleBrandVote(id, 'up');
  const handleBoycott = (id: string) => void handleBrandVote(id, 'down');

  const openTicketGenerator = (brand: BrandItem) => {
    setTicketBrand(brand);
    setShowTicketModal(true);
  };

  const handleEmployeeVoteSubmit = async (
    brandId: string,
    data: {
      role: string;
      weekendRating: number;
      offWorkTime: string;
      statutoryPay: boolean;
      comment: string;
    }
  ) => {
    await submitEmployeeReport(brandId, data);
    await refreshStats();
    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.5 },
    });
  };

  const completeTicketVote = async (amount: number) => {
    if (!ticketBrand) return;
    try {
      await submitPurchasePledge(ticketBrand.id, amount);
      await refreshStats();
      setShowTicketModal(false);
      confetti({ particleCount: 80, spread: 90, origin: { y: 0.6 } });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '消费打卡保存失败。');
    }
  };

  const getTierBadge = (tier: WlbTier) => {
    switch (tier) {
      case 'S':
        return (
          <span className="inline-flex shrink-0 items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap bg-red-50 text-red-800 border border-red-300">
            <Sparkles className="w-3.5 h-3.5 text-red-600" /> S级 · 标杆模范
          </span>
        );
      case 'A':
        return (
          <span className="inline-flex shrink-0 items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap bg-rose-50 text-rose-800 border border-rose-300">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-600" /> A级 · 合规双休
          </span>
        );
      case 'B':
        return (
          <span className="inline-flex shrink-0 items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap bg-amber-50 text-amber-900 border border-amber-300">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> B级 · 存在周末加班
          </span>
        );
      case 'C':
        return (
          <span className="inline-flex shrink-0 items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap bg-rose-50 text-rose-900 border border-rose-300">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> C级 · 加班严重
          </span>
        );
      case 'O':
        return (
          <span className="inline-flex shrink-0 items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold whitespace-nowrap bg-slate-100 text-slate-600 border border-slate-300">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" /> O级 · 信息不足
          </span>
        );
    }
  };

  const selectedEmployeeStats = selectedBrand?.employeeStats ?? {
    realDoubleWeekendRate: 0,
    avgOffWorkTime: '暂无',
    hasStatutoryPayRate: 0,
    totalEmployeeVotes: 0,
    anonymousComments: [],
  };

  return (
    <div className="min-h-screen bg-[#f5f5f1] text-slate-800 flex flex-col selection:bg-red-600 selection:text-white">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 bg-[#fbfbf8]/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="双休购 Logo" className="w-10 h-10 shrink-0" />
            <div>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap">双休购</span>
              {/* <span className="hidden sm:inline-block ml-2 text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded font-medium border border-red-200">
                劳工友好品牌索引
              </span> */}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowContributeModal(true)}
              className="hidden sm:inline-flex text-xs sm:text-sm bg-transparent hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition"
            >
              + 提交爆料 / 推荐
            </button>
            <a
              href="https://github.com/knight-de-ficus/shuangxiugouEx"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition"
            >
              <span>★ Star on GitHub</span>
            </a>
          </div>
        </div>
      </header>

      {notice && (
        <div className="fixed right-4 top-20 z-50 max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700 shadow-xl" role="status">
          <div className="flex items-start gap-3">
            <span className="flex-1">{notice}</span>
            <button onClick={() => setNotice('')} className="font-bold text-slate-400 hover:text-slate-700" aria-label="关闭提示">✕</button>
          </div>
        </div>
      )}

      {/* 红旗主题 Banner：左侧消费打卡，右侧保留旗帜主体 */}
      <section className="bg-[#f7f2ef] border-b border-red-100 px-4 py-5 sm:py-7">
        <div className="max-w-6xl mx-auto overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
          <div className="relative min-h-[390px] sm:min-h-[470px] bg-[url('/banner.png')] bg-cover bg-[68%_center] sm:bg-center">
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent sm:via-white/0" />
            <div className="relative z-10 flex min-h-[390px] sm:min-h-[470px] items-center p-6 sm:p-10">
              <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white/95 p-6 shadow-xl backdrop-blur-sm sm:p-8">
                <div className="mb-5 flex items-center gap-3">
                  {/* <img src="/logo.svg" alt="双休购购物车 Logo" className="h-12 w-12" /> */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">消费打卡</div>
                    <h1 className="text-xl font-black text-slate-950 sm:text-2xl">把选择投给尊重劳动者的企业</h1>
                  </div>
                </div>
                <p className="mb-2 text-xs font-semibold text-slate-500">已为双休企业贡献的消费</p>
                <div className="mb-5 font-mono text-4xl font-black tracking-tight text-red-700 sm:text-5xl">
                  <AnimatedCounter value={transferredAmount} />
                </div>
                <button
                  onClick={() => {
                    setTicketBrand(brands.find((brand) => brand.tier === 'S' || brand.tier === 'A') ?? brands[0]);
                    setShowTicketModal(true);
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-black text-white transition hover:bg-red-600"
                >
                  <Receipt className="h-4 w-4" />
                  登记消费并生成小票
                </button>
              </div>
            </div>
          </div>
          {/* <div className="grid grid-cols-2 gap-px bg-slate-200 text-center text-xs sm:grid-cols-5">
            {[
              ['收录企业', brands.length, 'text-slate-900'],
              ['S 级标杆', brands.filter((brand) => brand.tier === 'S').length, 'text-red-700'],
              ['A 级双休', brands.filter((brand) => brand.tier === 'A').length, 'text-rose-700'],
              ['B/C 级关注', brands.filter((brand) => brand.tier === 'B' || brand.tier === 'C').length, 'text-amber-700'],
              ['O 级待补全', brands.filter((brand) => brand.tier === 'O').length, 'text-slate-600'],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="bg-white px-3 py-3">
                <div className={`text-lg font-black ${color}`}>{value}</div>
                <div className="text-[11px] text-slate-500">{label}</div>
              </div>
            ))}
          </div> */}
        </div>
      </section>

      {/* 全局三大核心场景切换 Tab */}
      <div className="bg-white border-b border-slate-200/80 sticky top-16 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 overflow-x-auto scrollbar-none">
          <div className="flex w-max min-w-full gap-1 sm:gap-3 py-2">
            <button
              onClick={() => setActiveMainTab('brands')}
              className={`flex shrink-0 items-center gap-2 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                activeMainTab === 'brands'
                  ? 'bg-red-50 text-red-800 border-2 border-red-500 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4 text-red-600" />
              <span>企业真假双休档案</span>
              <span className="text-[10px] font-mono bg-red-200/60 text-red-900 px-1.5 py-0.5 rounded-full">
                {brands.length}
              </span>
            </button>

            <button
              onClick={() => setActiveMainTab('shopping')}
              className={`flex shrink-0 items-center gap-2 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                activeMainTab === 'shopping'
                  ? 'bg-red-50 text-red-800 border-2 border-red-500 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-red-600" />
              <span>网购透镜 · 查避雷选平替</span>
              <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                HOT
              </span>
            </button>

            <button
              onClick={() => setActiveMainTab('community')}
              className={`flex shrink-0 items-center gap-2 py-2 px-3 sm:px-4 rounded-md text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                activeMainTab === 'community'
                  ? 'bg-red-50 text-red-800 border-2 border-red-500 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-red-600" />
              <span>打工人茶水间 · 讨论广场</span>
              <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full">
                交流区
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 核心内容区 */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {activeMainTab === 'shopping' && (
          <ShoppingLens
            brands={brands}
            onSelectBrand={(b) => setSelectedBrand(b)}
            onOpenTicket={(b) => openTicketGenerator(b)}
          />
        )}

        {activeMainTab === 'community' && <CommunityLounge />}

        {activeMainTab === 'brands' && (
          <>
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索品牌名称（如：蜂花、星宇、迪卡侬）、公司主体或商品品类（如：车灯、洗发水、机械键盘）..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition text-sm"
            />
          </div>

          {/* 品类选择 */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> 品类:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setCurrentPage(1);
                }}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                } whitespace-nowrap`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 评级筛选 */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 mr-1">评级过滤:</span>
            {['全部', 'S', 'A', 'B', 'C', 'O'].map((tier) => (
              <button
                key={tier}
                onClick={() => {
                  setSelectedTier(tier);
                  setCurrentPage(1);
                }}
                className={`text-xs px-3 py-1 rounded-md font-mono font-bold transition ${
                  selectedTier === tier
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                } whitespace-nowrap`}
              >
                {tier === '全部' ? '全部评级' : `${tier} 级`}
              </button>
            ))}
          </div>
        </div>

        {/* 品牌列表网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pagedBrands.map((brand) => {
            const hasBoycotted = userVoteHistory[brand.id] === 'down';
            const hasUpvoted = userVoteHistory[brand.id] === 'up';

            return (
              <div
                key={brand.id}
                className={`bg-white rounded-xl border transition-shadow duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden relative group ${
                  brand.tier === 'C'
                    ? 'border-rose-200 border-l-4 border-l-rose-500'
                    : brand.tier === 'S'
                    ? 'border-red-200 border-l-4 border-l-red-600'
                    : 'border-slate-200/80 shadow-slate-900/5'
                }`}
              >
                <div className="p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="w-10 h-10 shrink-0 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center font-extrabold tracking-tight text-slate-700 text-sm" aria-label={`${brand.name} 标识`} title={brand.logoText}>
                        {getBrandMark(brand.logoText)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-base leading-snug truncate">{brand.name}</h3>
                        <p className="text-xs text-slate-400 truncate max-w-[180px]" title={brand.companyName}>{brand.companyName}</p>
                      </div>
                    </div>
                    {getTierBadge(brand.tier)}
                  </div>

                  {/* 工时状态标签 */}
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-400">量化评分：</span>
                      <span className="font-mono font-bold">{brand.tierScore === null ? '待补全' : `${brand.tierScore} / 100`}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-400">工时政策：</span>
                      <span className="font-semibold whitespace-nowrap pl-2">{brand.weekendPolicyLabel}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="text-slate-400">加班对待：</span>
                      <span className="font-semibold whitespace-nowrap pl-2">{brand.overtimeLabel}</span>
                    </div>
                  </div>

                  {/* 员工内部真实选票仪表盘 */}
                  {brand.employeeStats && (
                    <div className="bg-slate-900 text-slate-100 rounded-xl p-3 text-xs space-y-2 border border-slate-800 shadow-inner">
                      <div className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-800">
                        <span className="font-bold flex items-center gap-1 text-red-400">
                          <UserCheck className="w-3.5 h-3.5" /> 匿名员工反馈指数
                        </span>
                        <span className="text-slate-400 font-mono">
                          {brand.employeeStats.totalEmployeeVotes} 人已投票
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <div className="text-slate-400">反馈双休率:</div>
                          <div className={`font-mono font-bold text-sm ${brand.employeeStats.realDoubleWeekendRate >= 80 ? 'text-red-400' : brand.employeeStats.realDoubleWeekendRate >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {brand.employeeStats.realDoubleWeekendRate}%
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">平均离岗/下班:</div>
                          <div className="font-mono font-bold text-sm text-slate-200">
                            {brand.employeeStats.avgOffWorkTime}
                          </div>
                        </div>
                      </div>

                      {/* 最新匿名证言 */}
                      {brand.employeeStats.anonymousComments.length > 0 && (
                        <div className="pt-1 text-[11px] text-slate-300 italic line-clamp-1 border-t border-slate-800/80">
                          “{brand.employeeStats.anonymousComments[0].comment}”
                        </div>
                      )}
                    </div>
                  )}

                  {/* 核心产品品类标签 */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {brand.keyProducts.map((p, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium whitespace-nowrap"
                      >
                        {p}
                      </span>
                    ))}
                  </div>

                  {/* 如果是避雷企业，高亮展示平替推荐 */}
                  {brand.tier === 'C' && brand.alternatives && brand.alternatives.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-900 space-y-1.5">
                      <div className="font-bold flex items-center gap-1 text-red-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-red-600" />
                        打工人推荐双休平替：
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {brand.alternatives.map((altId) => {
                          const alt = brands.find((b) => b.id === altId);
                          if (!alt) return null;
                          return (
                            <button
                              key={alt.id}
                              onClick={() => setSelectedBrand(alt)}
                              className="bg-white hover:bg-red-100 border border-red-300 text-red-800 px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap transition flex items-center gap-1"
                            >
                              <span>{alt.name}</span>
                              <ChevronRight className="w-3 h-3 text-red-500" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 底部交互区 */}
                <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpvote(brand.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border whitespace-nowrap transition ${
                        hasUpvoted
                          ? 'bg-red-100 text-red-800 border-red-300'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                      title="我支持这家良心品牌"
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-red-600 text-red-600' : 'text-slate-400'}`} />
                      <span>{brand.upvotes}</span>
                    </button>
                    <button
                      onClick={() => handleBoycott(brand.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border whitespace-nowrap transition ${
                        hasBoycotted
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                      title="用脚投票抵制单休"
                    >
                      <ThumbsDown className={`w-3.5 h-3.5 ${hasBoycotted ? 'fill-rose-600 text-rose-600' : 'text-slate-400'}`} />
                      <span>{brand.boycotts}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      onClick={() => setVotingEmployeeBrand(brand)}
                      className="text-slate-600 hover:text-red-700 font-medium inline-flex items-center gap-1 bg-white hover:bg-red-50 px-2 py-1 rounded-lg border border-slate-200 whitespace-nowrap"
                      title="提交一条匿名员工经历反馈"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-red-600" />
                      <span>员工投票</span>
                    </button>
                    <button
                      onClick={() => openTicketGenerator(brand)}
                      className="text-slate-600 hover:text-red-700 font-medium inline-flex items-center gap-1 whitespace-nowrap"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>打卡</span>
                    </button>
                    <button
                      onClick={() => setSelectedBrand(brand)}
                      className="text-red-600 hover:text-red-700 font-bold inline-flex items-center gap-0.5 whitespace-nowrap"
                    >
                      <span>详情证据</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredBrands.length > 0 && (
          <nav className="flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row" aria-label="企业档案分页">
            <div className="text-xs text-slate-500">
              第 <span className="font-bold text-slate-900">{visiblePage}</span> / {totalPages} 页 · 共 {filteredBrands.length} 家企业 · 每页 {BRANDS_PER_PAGE} 家
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={visiblePage === 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                上一页
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                const start = Math.max(1, Math.min(visiblePage - 2, totalPages - 4));
                const page = start + index;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 min-w-8 rounded-lg px-2 text-xs font-bold ${page === visiblePage ? 'bg-red-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700'}`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={visiblePage === totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                下一页
              </button>
            </div>
          </nav>
        )}

        {filteredBrands.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-slate-600 font-medium">未找到匹配的品牌信息</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  库里还没有收录你查的品牌？欢迎点击右上角提交爆料或发起“求扒求证”。
                </p>
                <button
                  onClick={() => setShowContributeModal(true)}
                  className="inline-flex items-center gap-1 text-xs bg-red-600 text-white px-3.5 py-2 rounded-lg font-bold hover:bg-red-500 transition"
                >
                  + 我来提供这家企业信息
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* 品牌详情与法律证据弹窗 */}
      {selectedBrand && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">{selectedBrand.name}</h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building className="w-3.5 h-3.5" />
                    {selectedBrand.companyName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBrand(null)}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center gap-2">
                {getTierBadge(selectedBrand.tier)}
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  {selectedBrand.category}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs space-y-2">
                <div className="font-semibold text-slate-800">制度与背景概要：</div>
                <p className="text-slate-600 leading-relaxed">{selectedBrand.summary}</p>
                <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-500">
                  <span className="font-bold text-slate-700">量化依据：</span>{' '}
                  {selectedBrand.tierScore === null ? 'O 级不参与评分；' : `${selectedBrand.tierScore} / 100；`}
                  {selectedBrand.tierReason}
                </div>
              </div>

              {/* 核心证据链 */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-red-600" />
                    <span>公开司法文书与事实证据链 (Timeline)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    已核验案号 & 官方通报: {selectedBrand.evidence.length} 条
                  </span>
                </div>
                <div className="space-y-2 border-l-2 border-slate-200 pl-3 ml-1">
                  {selectedBrand.evidence.map((ev) => (
                    <div key={ev.id} className="relative p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 hover:border-slate-300 transition">
                      <div className="absolute -left-[19px] top-3.5 w-2 h-2 rounded-full bg-slate-400 ring-4 ring-white" />
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {ev.date}
                        </span>
                        <span className="bg-slate-200/80 px-2 py-0.5 rounded text-slate-700 font-medium">
                          {ev.type === 'official_punishment' ? '官方行政处罚/通报' : ev.type === 'judicial_record' ? '法院司法裁判文书' : 'ESG报告/独立认证'}
                        </span>
                      </div>

                      <div className="font-bold text-slate-900 text-xs sm:text-sm">{ev.title}</div>

                      {/* 官方案号与公开查询标识 */}
                      {ev.caseNumber && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-mono">
                          <span className="font-bold">公开发案号:</span>
                          <span>{ev.caseNumber}</span>
                        </div>
                      )}

                      <p className="text-slate-600 leading-relaxed text-xs pt-0.5">{ev.summary}</p>

                      {ev.sourceUrl && (
                        <div className="pt-1">
                          <a
                            href={ev.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 font-semibold hover:underline"
                          >
                            <span>查看公开通报/裁判文书源文</span>
                            <ChevronRight className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 员工真实评测与证言区 */}
              {(
                <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-red-400 flex items-center gap-1.5 text-xs">
                      <UserCheck className="w-4 h-4" />
                      <span>匿名员工反馈汇总 ({selectedEmployeeStats.totalEmployeeVotes} 条)</span>
                    </div>
                    <button
                      onClick={() => {
                        setVotingEmployeeBrand(selectedBrand);
                      }}
                      className="text-[11px] bg-red-500 hover:bg-red-400 text-slate-950 font-bold px-2.5 py-1 rounded-lg transition"
                    >
                      提交员工经历
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-800/80 p-2 rounded-xl">
                      <div className="text-slate-400 text-[10px]">反馈双休率</div>
                      <div className="font-mono font-bold text-red-400 text-sm">
                        {selectedEmployeeStats.realDoubleWeekendRate}%
                      </div>
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded-xl">
                      <div className="text-slate-400 text-[10px]">平均离岗时间</div>
                      <div className="font-mono font-bold text-slate-200 text-sm">
                        {selectedEmployeeStats.avgOffWorkTime}
                      </div>
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded-xl">
                      <div className="text-slate-400 text-[10px]">法定加班费兑付</div>
                      <div className="font-mono font-bold text-rose-400 text-sm">
                        {selectedEmployeeStats.hasStatutoryPayRate}%
                      </div>
                    </div>
                  </div>

                  {selectedEmployeeStats.anonymousComments.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] text-slate-400 font-semibold">匿名反馈摘录（未经身份核验）：</div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {selectedEmployeeStats.anonymousComments.map((cm) => (
                          <div key={cm.id} className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50 text-xs space-y-1">
                            <div className="flex justify-between items-center text-[10px] text-slate-400">
                              <span className="font-bold text-slate-300">{cm.role}</span>
                              <span className="font-mono">{cm.date}</span>
                            </div>
                            <p className="text-slate-200 leading-normal">“{cm.comment}”</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 替代品引导 */}
              {selectedBrand.tier === 'C' && selectedBrand.alternatives && (
                <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-300 text-xs space-y-2.5">
                  <div className="font-black text-red-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-red-600" />
                    <span>打工人用脚投票推荐：良心双休平替品牌</span>
                  </div>
                  <div className="text-slate-600 leading-normal">
                    不给违法违规与高压单休企业贡献利润，建议优先将消费预算转向以下落实双休的替代品牌：
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {selectedBrand.alternatives.map((altId) => {
                      const alt = brands.find((b) => b.id === altId);
                      if (!alt) return null;
                      return (
                        <button
                          key={alt.id}
                          onClick={() => setSelectedBrand(alt)}
                          className="bg-white hover:bg-red-50/80 border border-red-300/80 p-2.5 rounded-xl text-left transition flex items-center justify-between group shadow-xs"
                        >
                          <div>
                            <div className="font-bold text-slate-900 text-xs group-hover:text-red-700 transition">
                              {alt.name}
                            </div>
                            <div className="text-[11px] text-red-700 font-medium">
                              {alt.tier}级 · {alt.weekendPolicyLabel}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-red-600 transition" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedBrand(null);
                    openTicketGenerator(selectedBrand);
                  }}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
                >
                  <Receipt className="w-4 h-4" /> 生成我的投票小票
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 社交小票生成器 Modal */}
      {showTicketModal && ticketBrand && (
        <ReceiptModal
          brand={ticketBrand}
          amount={ticketAmount}
          onClose={() => setShowTicketModal(false)}
          onComplete={completeTicketVote}
        />
      )}

      {/* 匿名员工经历反馈 Modal */}
      {votingEmployeeBrand && (
        <EmployeeVoteModal
          brand={votingEmployeeBrand}
          onClose={() => setVotingEmployeeBrand(null)}
          onSubmit={handleEmployeeVoteSubmit}
        />
      )}

      {/* 提交推荐/爆料 Modal */}
      {showContributeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">推荐双休品牌 / 提交工时爆料</h3>
              <button
                onClick={() => setShowContributeModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              线索会保存到 D1 审核队列，不会未经核验直接改写厂商评级。请勿提交姓名、电话、工牌原图等个人敏感信息。
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const fields = new FormData(form);
                setIsSubmittingLead(true);
                try {
                  await submitLead({
                    kind: fields.get('kind') === 'report' ? 'report' : 'recommend',
                    companyName: String(fields.get('companyName') || ''),
                    parentCompany: String(fields.get('parentCompany') || ''),
                    workPolicy: String(fields.get('workPolicy') || 'unknown') as 'strict_double' | 'alternate' | 'single' | 'unknown',
                    evidence: String(fields.get('evidence') || ''),
                  });
                  form.reset();
                  setShowContributeModal(false);
                  setNotice('提交成功，线索已进入待审核队列。');
                } catch (error) {
                  setNotice(error instanceof Error ? error.message : '线索保存失败。');
                } finally {
                  setIsSubmittingLead(false);
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-700 font-semibold mb-1">提交类型</label>
                <select name="kind" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none">
                  <option value="recommend">推荐双休企业</option>
                  <option value="report">提交工时爆料</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">品牌名称 / 常见商品</label>
                <input
                  name="companyName"
                  required
                  placeholder="例如：某个洗发水品牌、键盘品牌"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">所属母公司主体 (选填)</label>
                <input
                  name="parentCompany"
                  placeholder="例如：企查查/天眼查可搜到的企业全称"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">工时与休假实情</label>
                <select name="workPolicy" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none">
                  <option value="strict_double">严格双休 / 极少加班 (值得推荐)</option>
                  <option value="alternate">大小周 / 有偿加班</option>
                  <option value="single">单休 / 严重超时加班 (提醒避雷)</option>
                  <option value="unknown">暂不确定 / 请求核验</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">佐证材料 (脱敏截图链接/通报文号/新闻来源)</label>
                <textarea
                  name="evidence"
                  rows={3}
                  placeholder="提供可信公开线索，例如官方通报链接、裁判文书号或员工社区交叉讨论地址"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowContributeModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition shadow-sm"
                >
                  {isSubmittingLead ? '保存中…' : '提交审核'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 底部 Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-500 space-y-2">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">双休购 · ShuangxiuGo</span>
            <span>- 守护劳动法与打工人休息权</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <a href="https://github.com/knight-de-ficus/shuangxiugouEx" target="_blank" rel="noreferrer" className="hover:text-red-600">GitHub 仓库</a>
            <button onClick={() => setShowContributeModal(true)} className="hover:text-red-600">提供数据</button>
            <span className="text-slate-300">|</span>
            <span>数据完全开源免责声明：仅作为消费参考</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
