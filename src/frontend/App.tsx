import { useCallback, useEffect, useMemo, useState, type FormEvent, type MouseEvent } from 'react';
import { Heart, Plus, Receipt, Search, ThumbsDown } from 'lucide-react';
import { INITIAL_BRANDS } from './data';
import type { BrandItem } from './types';
import { AnimatedCounter } from './components/AnimatedCounter';
import { ReceiptModal } from './components/ReceiptModal';
import { getBrandMark } from './utils/brand.js';
import { getSiteStats, submitLead, submitPurchasePledge, voteForBrand } from './api/client';

type VoteChoice = 'up' | 'down';

export function App() {
  const [brands, setBrands] = useState<BrandItem[]>(INITIAL_BRANDS);
  const [search, setSearch] = useState('');
  const [ticketTarget, setTicketTarget] = useState<BrandItem | null>(null);
  const [submitTarget, setSubmitTarget] = useState<BrandItem | null>(null);
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

  return (
    <div className="min-h-screen bg-[#f5f5f1] text-slate-900 selection:bg-red-700 selection:text-white">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-[#fbfbf8]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 text-left"
            aria-label="返回页面顶部"
          >
            <img src="/logo.svg" alt="双休购" className="h-10 w-10 shrink-0" />
            <span className="whitespace-nowrap text-[27px] font-black tracking-tight text-slate-950 sm:text-[30px]">双休购</span>
          </button>
        </div>
      </header>

      {notice && (
        <div className="fixed right-4 top-20 z-50 flex max-w-sm items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs shadow-lg" role="status">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="font-bold text-slate-400" aria-label="关闭提示">✕</button>
        </div>
      )}

      <section className="relative w-full overflow-hidden bg-white" aria-label="双休企业消费支持金额">
        <img src="/banner.png" alt="红旗与劳动者" className="block h-auto w-full" />
        <div className="absolute left-[6%] top-1/2 max-w-[36%] -translate-y-1/2">
          <div className="text-[10px] font-bold tracking-wide text-slate-600 sm:text-sm">已为双休企业支持</div>
          <div className="mt-1 whitespace-nowrap font-mono text-lg font-black tracking-tight text-red-700 sm:mt-2 sm:text-3xl">
            <AnimatedCounter value={transferredAmount} />
          </div>
        </div>
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
              onVote={(event, choice) => void handleVote(event, brand, choice)}
              onSubmit={() => setSubmitTarget(brand)}
              onTicket={() => setTicketTarget(brand)}
            />
          ))}
        </section>

        {filteredBrands.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">没有找到相关品牌。</div>
        )}
      </main>

      {ticketTarget && (
        <ReceiptModal
          brand={ticketTarget}
          amount={199}
          onClose={() => setTicketTarget(null)}
          onComplete={completeTicket}
        />
      )}

      {submitTarget && (
        <SubmissionModal
          brand={submitTarget}
          onClose={() => setSubmitTarget(null)}
          onDone={(message) => {
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
  onVote,
  onSubmit,
  onTicket,
}: {
  brand: BrandItem;
  vote?: VoteChoice;
  onVote: (event: MouseEvent, choice: VoteChoice) => void;
  onSubmit: () => void;
  onTicket: () => void;
}) {
  const products = Array.from(new Set([...brand.keyProducts, ...brand.supplyChainProducts])).slice(0, 8);

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
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

function SubmissionModal({ brand, onClose, onDone }: { brand: BrandItem; onClose: () => void; onDone: (message: string) => void }) {
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await submitLead({
        kind: 'report',
        companyName: brand.name,
        parentCompany: brand.companyName,
        workPolicy: 'unknown',
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
          <h2 className="font-black text-slate-950">{brand.name}</h2>
          <button type="button" onClick={onClose} className="rounded-md px-2 py-1 font-bold text-slate-500" aria-label="关闭">✕</button>
        </div>
        <textarea
          required
          minLength={10}
          maxLength={2000}
          rows={6}
          name="evidence"
          placeholder="提交更多信息"
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
