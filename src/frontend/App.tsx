import { useCallback, useEffect, useMemo, useState, type FormEvent, type MouseEvent } from 'react';
import { ExternalLink, Heart, Plus, Receipt, Search, ThumbsDown } from 'lucide-react';
import { INITIAL_BRANDS } from './data';
import type { BrandItem } from './types';
import { AnimatedCounter } from './components/AnimatedCounter';
import { ReceiptModal, type ReceiptTarget } from './components/ReceiptModal';
import { getBrandMark } from './utils/brand.js';
import { getSiteStats, submitLead, submitPurchasePledge, voteForBrand } from './api/client';

type VoteChoice = 'up' | 'down';
const BANNER_DEFAULT_BRAND: ReceiptTarget = { id: 'default', name: 'default', companyName: '' };

export function App() {
  const [brands, setBrands] = useState<BrandItem[]>(INITIAL_BRANDS);
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<BrandItem | null>(null);
  const [ticketTarget, setTicketTarget] = useState<ReceiptTarget | null>(null);
  const [submitTarget, setSubmitTarget] = useState<BrandItem | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [transferredAmount, setTransferredAmount] = useState(0);
  const [voteHistory, setVoteHistory] = useState<Record<string, VoteChoice>>({});
  const [notice, setNotice] = useState('');

  const refreshStats = useCallback(async () => {
    const stats = await getSiteStats();
    setTransferredAmount(stats.transferredAmount);
    setBrands(INITIAL_BRANDS.map((brand) => ({
      ...brand,
      upvotes: stats.votes[brand.id]?.upvotes ?? 0,
      boycotts: stats.votes[brand.id]?.boycotts ?? 0,
      employeeStats: stats.employeeStats[brand.id],
    })));
  }, []);

  useEffect(() => {
    void refreshStats().catch(() => setNotice('互动数据暂时无法加载。'));
  }, [refreshStats]);

  const filteredBrands = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return brands;
    return brands.filter((brand) =>
      [brand.name, brand.companyName, ...brand.keyProducts, ...brand.supplyChainProducts]
        .join(' ')
        .toLowerCase()
        .includes(keyword),
    );
  }, [brands, search]);

  const handleVote = async (event: MouseEvent, brand: BrandItem, choice: VoteChoice) => {
    event.stopPropagation();
    if (voteHistory[brand.id]) return;

    try {
      await voteForBrand(brand.id, choice);
      setVoteHistory((current) => ({ ...current, [brand.id]: choice }));
      await refreshStats();
      setNotice(choice === 'up' ? '已点赞。' : '已点踩。');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '操作失败。');
    }
  };

  const completeTicket = async (amount: number) => {
    if (!ticketTarget) return;
    const result = await submitPurchasePledge(ticketTarget.id, amount);
    setTicketTarget(null);
    if (result.submission.status === 'published') await refreshStats();
    setNotice('消费支持已提交。');
  };

  const openSubmission = (brand: BrandItem | null = null) => {
    setSubmitTarget(brand);
    setShowSubmit(true);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f1] text-slate-900 selection:bg-red-700 selection:text-white">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-[#fbfbf8]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 text-left"
            aria-label="返回页面顶部"
          >
            <img src="/logo.svg" alt="双休购" className="h-10 w-10 shrink-0" />
            <span className="whitespace-nowrap text-[27px] font-black tracking-tight text-slate-950 sm:text-[30px]">双休购</span>
          </button>
          <button
            onClick={() => openSubmission()}
            className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-800 transition hover:bg-red-100"
          >
            + 提交企业信息
          </button>
        </div>
      </header>

      {notice && (
        <div className="fixed right-4 top-20 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs shadow-lg" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="font-bold text-slate-400" aria-label="关闭提示">✕</button>
        </div>
      )}

      <section className="relative w-full overflow-hidden bg-white pb-5 sm:pb-8" aria-label="双休企业消费支持金额">
        <img src="/banner.png" alt="红旗与劳动者" className="block h-auto w-full" />
        <div className="absolute left-[4%] top-[46%] z-10 w-[42%] max-w-sm -translate-y-1/2 rounded-xl border border-red-200 bg-white/95 p-3 shadow-xl backdrop-blur-sm sm:left-[6%] sm:w-full sm:rounded-2xl sm:p-6">
          <div className="text-[9px] font-bold tracking-wide text-slate-500 sm:text-sm">已为双休企业支持</div>
          <div className="mt-1 whitespace-nowrap font-mono text-lg font-black tracking-tight text-red-700 sm:mt-2 sm:text-4xl">
            <AnimatedCounter value={transferredAmount} />
          </div>
          <button
            onClick={() => setTicketTarget(BANNER_DEFAULT_BRAND)}
            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-700 px-2 py-2 text-[10px] font-black text-white transition hover:bg-red-600 sm:mt-5 sm:gap-2 sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm"
          >
            <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            消费支持
          </button>
        </div>
        <svg className="pointer-events-none absolute bottom-0 left-0 z-20 h-7 w-full sm:h-12" viewBox="0 0 1440 96" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 12 Q720 96 1440 12 V96 H0 Z" fill="#f5f5f1" />
        </svg>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索品牌或产品"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
        </div>

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-label="品牌列表">
          {filteredBrands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              vote={voteHistory[brand.id]}
              onOpen={() => setSelectedBrand(brand)}
              onVote={(event, choice) => void handleVote(event, brand, choice)}
              onSubmit={(event) => {
                event.stopPropagation();
                openSubmission(brand);
              }}
              onTicket={(event) => {
                event.stopPropagation();
                setTicketTarget(brand);
              }}
            />
          ))}
        </section>

        {filteredBrands.length === 0 && (
          <div className="space-y-4 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="text-sm font-bold text-slate-700">没有找到相关品牌</div>
            <button
              onClick={() => openSubmission()}
              className="rounded-lg bg-red-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-red-600"
            >
              + 提交这家企业信息
            </button>
          </div>
        )}
      </main>

      {selectedBrand && <CompanyDetail brand={selectedBrand} onClose={() => setSelectedBrand(null)} />}

      {ticketTarget && (
        <ReceiptModal
          brand={ticketTarget}
          amount={199}
          onClose={() => setTicketTarget(null)}
          onComplete={completeTicket}
        />
      )}

      {showSubmit && (
        <SubmissionModal
          brand={submitTarget}
          initialName={submitTarget ? undefined : search.trim()}
          onClose={() => {
            setShowSubmit(false);
            setSubmitTarget(null);
          }}
          onDone={(message) => {
            setShowSubmit(false);
            setSubmitTarget(null);
            setNotice(message);
          }}
        />
      )}
    </div>
  );
}

function BrandCard({
  brand,
  vote,
  onOpen,
  onVote,
  onSubmit,
  onTicket,
}: {
  brand: BrandItem;
  vote?: VoteChoice;
  onOpen: () => void;
  onVote: (event: MouseEvent, choice: VoteChoice) => void;
  onSubmit: (event: MouseEvent) => void;
  onTicket: (event: MouseEvent) => void;
}) {
  const products = Array.from(new Set([...brand.keyProducts, ...brand.supplyChainProducts])).slice(0, 8);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      className="flex cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-200"
    >
      <div className="h-1 bg-red-700" />
      <div className="flex-1 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-black text-slate-800" aria-hidden="true">
            {getBrandMark(brand.logoText)}
          </div>
          <h2 className="truncate text-lg font-black text-slate-950">{brand.name}</h2>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {products.map((product) => (
            <span key={product} className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
              {product}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 border-t border-slate-200 bg-slate-50 text-[11px] font-bold sm:grid-cols-4">
        <button
          onClick={(event) => onVote(event, 'up')}
          className={`flex items-center justify-center gap-1.5 border-b border-r border-slate-200 px-2 py-3 transition sm:border-b-0 ${vote === 'up' ? 'text-red-700' : 'text-slate-600 hover:bg-white'}`}
        >
          <Heart className={`h-3.5 w-3.5 ${vote === 'up' ? 'fill-red-600' : ''}`} />
          <span>{brand.upvotes}</span>
        </button>
        <button
          onClick={(event) => onVote(event, 'down')}
          className={`flex items-center justify-center gap-1.5 border-b border-slate-200 px-2 py-3 transition sm:border-b-0 sm:border-r ${vote === 'down' ? 'text-slate-950' : 'text-slate-600 hover:bg-white'}`}
        >
          <ThumbsDown className={`h-3.5 w-3.5 ${vote === 'down' ? 'fill-slate-700' : ''}`} />
          <span>{brand.boycotts}</span>
        </button>
        <button onClick={onSubmit} className="flex items-center justify-center gap-1.5 border-r border-slate-200 px-2 py-3 text-slate-600 transition hover:bg-white">
          <Plus className="h-3.5 w-3.5" />
          <span>提交更多信息</span>
        </button>
        <button onClick={onTicket} className="flex items-center justify-center gap-1.5 px-2 py-3 text-red-700 transition hover:bg-white">
          <Receipt className="h-3.5 w-3.5" />
          <span>消费支持</span>
        </button>
      </div>
    </article>
  );
}

function CompanyDetail({ brand, onClose }: { brand: BrandItem; onClose: () => void }) {
  const products = Array.from(new Set([...brand.keyProducts, ...brand.supplyChainProducts]));
  const webEvidence = brand.evidence.filter((item) => item.sourceUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="关闭详情" />
      <section className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="h-1.5 bg-red-700" />
        <div className="space-y-6 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-black text-slate-800" aria-hidden="true">
                {getBrandMark(brand.logoText)}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-black text-slate-950">{brand.name}</h2>
                <p className="mt-1 text-xs text-slate-500">{brand.companyName}</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-500 transition hover:bg-slate-200" aria-label="关闭">✕</button>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-black text-slate-900">产品</h3>
            <div className="flex flex-wrap gap-2">
              {products.map((product) => <span key={product} className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600">{product}</span>)}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-black text-slate-900">双休证据</h3>
            <div className="space-y-2">
              {webEvidence.map((item) => (
                <a
                  key={item.id}
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-3 text-xs transition hover:border-red-300 hover:bg-red-50/40"
                >
                  <span className="min-w-0">
                    <span className="block font-bold text-slate-900">{item.title}</span>
                    <span className="mt-1 block text-[11px] text-slate-400">{item.date}</span>
                  </span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-red-700" />
                </a>
              ))}
              {webEvidence.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500">暂无网页证据</div>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SubmissionModal({ brand, initialName, onClose, onDone }: { brand: BrandItem | null; initialName?: string; onClose: () => void; onDone: (message: string) => void }) {
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await submitLead({
        kind: data.get('kind') === 'report' ? 'report' : 'recommend',
        companyName: String(data.get('companyName') || ''),
        parentCompany: String(data.get('parentCompany') || ''),
        workPolicy: String(data.get('workPolicy') || 'unknown') as 'strict_double' | 'alternate' | 'single' | 'unknown',
        evidence: String(data.get('evidence') || ''),
      });
      onDone('信息已提交。');
    } catch (error) {
      onDone(error instanceof Error ? error.message : '提交失败。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-black text-slate-950">提交企业信息</h2>
          <button type="button" onClick={onClose} className="rounded-md px-2 py-1 font-bold text-slate-500" aria-label="关闭">✕</button>
        </div>
        <select name="kind" defaultValue={brand ? 'report' : 'recommend'} className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100">
          <option value="recommend">推荐双休企业</option>
          <option value="report">提交更多信息</option>
        </select>
        <input
          required
          name="companyName"
          defaultValue={brand?.name ?? initialName ?? ''}
          placeholder="企业或品牌名称"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
        />
        <input
          name="parentCompany"
          defaultValue={brand?.companyName ?? ''}
          placeholder="公司全名（选填）"
          className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
        />
        <select name="workPolicy" defaultValue="unknown" className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100">
          <option value="strict_double">严格双休 / 极少加班</option>
          <option value="alternate">大小周 / 有偿加班</option>
          <option value="single">单休 / 严重超时加班</option>
          <option value="unknown">暂不确定</option>
        </select>
        <textarea
          required
          minLength={10}
          maxLength={2000}
          rows={6}
          name="evidence"
          placeholder="网页链接或其他可核对信息"
          className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">取消</button>
          <button disabled={busy} className="rounded-lg bg-red-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
            {busy ? '提交中…' : '提交'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default App;
