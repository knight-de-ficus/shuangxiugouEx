import { useCallback, useEffect, useMemo, useState, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import { Building2, CalendarCheck, ChevronRight, Factory, Heart, Info, Receipt, Search, ShieldCheck, UserCheck } from 'lucide-react';
import { INITIAL_BRANDS, CATEGORIES } from './data';
import type { BrandItem, CompanyRole, EmployeeVoteStats } from './types';
import { AnimatedCounter } from './components/AnimatedCounter';
import { ReceiptModal } from './components/ReceiptModal';
import { EmployeeVoteModal, type EmployeeExecutionReport } from './components/EmployeeVoteModal';
import { getBrandMark } from './utils/brand.js';
import { getSiteStats, submitEmployeeReport, submitLead, submitPurchasePledge, voteForBrand } from './api/client';

const ROLE_LABEL: Record<CompanyRole, string> = { consumer: '消费品牌', supplier: '上游供应商', both: '品牌与供应商' };

export function App() {
  const [brands, setBrands] = useState<BrandItem[]>(INITIAL_BRANDS);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const [role, setRole] = useState<'all' | CompanyRole>('all');
  const [selected, setSelected] = useState<BrandItem | null>(null);
  const [employeeTarget, setEmployeeTarget] = useState<BrandItem | null>(null);
  const [ticketTarget, setTicketTarget] = useState<BrandItem | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [transferredAmount, setTransferredAmount] = useState(0);
  const [supported, setSupported] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState('');
  const supplierRelatedCount = useMemo(() => brands.filter((brand) => brand.companyRole !== 'consumer').length, [brands]);

  const refreshStats = useCallback(async () => {
    const stats = await getSiteStats();
    setTransferredAmount(stats.transferredAmount);
    const merge = (brand: BrandItem): BrandItem => ({
      ...brand,
      upvotes: stats.votes[brand.id]?.upvotes ?? 0,
      boycotts: 0,
      employeeStats: stats.employeeStats[brand.id],
    });
    setBrands(INITIAL_BRANDS.map(merge));
    setSelected((current) => current ? merge(current) : null);
  }, []);

  useEffect(() => {
    void refreshStats().catch(() => setNotice('公开互动数据暂时无法加载，红榜档案仍可正常浏览。'));
  }, [refreshStats]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return brands.filter((brand) => {
      const text = [brand.name, brand.companyName, ...brand.keyProducts, ...brand.supplyChainProducts].join(' ').toLowerCase();
      return (!keyword || text.includes(keyword))
        && (category === '全部' || brand.category === category)
        && (role === 'all' || brand.companyRole === role || brand.companyRole === 'both');
    });
  }, [brands, category, role, search]);

  const support = async (event: MouseEvent, brand: BrandItem) => {
    event.stopPropagation();
    if (supported[brand.id]) return;
    try {
      await voteForBrand(brand.id, 'up');
      setSupported((current) => ({ ...current, [brand.id]: true }));
      await refreshStats();
      setNotice('认可已记录。公众认可不参与双休兑现率计算。');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '认可记录失败。');
    }
  };

  const submitEmployee = async (brandId: string, report: EmployeeExecutionReport) => {
    await submitEmployeeReport(brandId, report);
    setNotice('员工周核验已进入人工审核；通过后才会进入公开聚合结果。');
  };

  const completeTicket = async (amount: number) => {
    if (!ticketTarget) return;
    const result = await submitPurchasePledge(ticketTarget.id, amount);
    setTicketTarget(null);
    if (result.submission.status === 'published') await refreshStats();
    setNotice(result.submission.status === 'published' ? '消费支持已记录。' : '消费记录已进入审核队列。');
  };

  return (
    <div className="min-h-screen bg-[#f5f3ef] text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-[#fbfbf8]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <button onClick={() => { setSelected(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-3 text-left">
            <img src="/logo.svg" alt="双休购" className="h-10 w-10" />
            <div><div className="font-black text-slate-950">双休购</div><div className="text-[10px] tracking-wide text-slate-500">双休实践企业红榜</div></div>
          </button>
          <button onClick={() => setShowSubmit(true)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-800">推荐企业 / 提交更新</button>
        </div>
      </header>

      {notice && <div className="fixed right-4 top-20 z-50 flex max-w-sm gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs shadow-xl" role="status"><span>{notice}</span><button onClick={() => setNotice('')} className="font-bold text-slate-400">✕</button></div>}

      <section className="border-b border-red-100 bg-[#f8f1ed] px-4 py-12">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_390px] lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold text-red-800"><ShieldCheck className="h-4 w-4" />只展示通过准入复核的企业</div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">把选择投给真正保障休息的企业。</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">红榜结论严格限定到页面标明的用人主体、岗位、基地和时间。企业未入选不代表负面评价；资料不足时，我们选择不展示。</p>
          </div>
          <div className="rounded-2xl bg-slate-950 p-5 text-white">
            <div className="text-xs text-slate-400">社区记录的消费支持</div>
            <div className="mt-1 font-mono text-3xl font-black text-red-400"><AnimatedCounter value={transferredAmount} /></div>
            <p className="mt-3 text-[11px] leading-5 text-slate-400">消费金额只表达支持，不参与企业准入和兑现率计算。</p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索企业、品牌、产品或上游部件" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-red-500" /></div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['all', 'consumer', 'supplier'] as const).map((value) => <FilterButton key={value} active={role === value} onClick={() => setRole(value)}>{value === 'all' ? '全部类型' : ROLE_LABEL[value]}</FilterButton>)}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((value) => <FilterButton key={value} active={category === value} onClick={() => setCategory(value)}>{value}</FilterButton>)}
          </div>
        </section>

        <div className="flex items-end justify-between gap-4">
          <div><h2 className="text-xl font-black text-slate-950">公开资料试运行红榜</h2><p className="mt-1 text-xs text-slate-500">当前显示 {filtered.length} / {brands.length} 家，其中供应链相关 {supplierRelatedCount} 家；达到员工样本门槛后会升级为“员工执行已核验”。</p></div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm">方法版本 v1.0</span>
        </div>

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((brand) => <RedlistCard key={brand.id} brand={brand} supported={Boolean(supported[brand.id])} onOpen={() => setSelected(brand)} onSupport={(event) => void support(event, brand)} onEmployee={(event) => { event.stopPropagation(); setEmployeeTarget(brand); }} onTicket={(event) => { event.stopPropagation(); setTicketTarget(brand); }} />)}
        </section>
        {filtered.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">红榜中暂时没有符合此筛选条件的企业。</div>}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-xs leading-6 text-slate-600">
          <h2 className="font-black text-slate-900">红榜不是什么</h2>
          <p className="mt-1">它不是官方认证、全集团背书或永久荣誉。公众认可、消费金额和普通网友留言不会改变双休兑现率；重大冲突会触发暂停展示和重新核验。</p>
        </section>
      </main>

      {selected && <CompanyDetail brand={selected} onClose={() => setSelected(null)} onEmployee={() => setEmployeeTarget(selected)} onTicket={() => setTicketTarget(selected)} />}
      {employeeTarget && <EmployeeVoteModal brand={employeeTarget} onClose={() => setEmployeeTarget(null)} onSubmit={submitEmployee} />}
      {ticketTarget && <ReceiptModal brand={ticketTarget} amount={199} onClose={() => setTicketTarget(null)} onComplete={completeTicket} />}
      {showSubmit && <SubmissionModal onClose={() => setShowSubmit(false)} onDone={(message) => { setShowSubmit(false); setNotice(message); }} />}
    </div>
  );
}

function RedlistCard({ brand, supported, onOpen, onSupport, onEmployee, onTicket }: { brand: BrandItem; supported: boolean; onOpen: () => void; onSupport: (event: MouseEvent) => void; onEmployee: (event: MouseEvent) => void; onTicket: (event: MouseEvent) => void }) {
  const metric = publicMetric(brand.employeeStats);
  const disputed = brand.auditStatus === 'disputed';
  return <article role="button" tabIndex={0} onClick={onOpen} onKeyDown={(event) => { if (event.key === 'Enter') onOpen(); }} className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="h-1 bg-red-700" />
    <div className="flex-1 space-y-4 p-5">
      <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-black">{getBrandMark(brand.logoText)}</div><div className="min-w-0"><h3 className="truncate font-black text-slate-950">{brand.name}</h3><p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{brand.companyName}</p></div></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${disputed ? 'bg-amber-100 text-amber-900' : 'bg-red-50 text-red-800'}`}>{disputed ? '存在争议' : '试运行入选'}</span></div>
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">{brand.companyRole !== 'consumer' ? <Factory className="h-4 w-4 text-red-600" /> : <Building2 className="h-4 w-4 text-red-600" />}{ROLE_LABEL[brand.companyRole]}</div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">双休兑现率</div><div className="mt-1 flex items-end justify-between"><strong className="text-2xl font-black text-slate-950">{metric.label}</strong><span className="text-[11px] font-bold text-slate-500">可信度 {brand.confidence}</span></div><p className="mt-2 text-[11px] leading-5 text-slate-500">{metric.note}</p></div>
      <div><div className="text-[10px] font-bold text-slate-400">已核验范围</div><p className="mt-1 text-xs leading-5 text-slate-700">{brand.verifiedScope}</p></div>
      <div className="flex flex-wrap gap-1.5">{brand.keyProducts.slice(0, 5).map((product) => <span key={product} className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-600">{product}</span>)}</div>
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-400"><span>核验于 {brand.verifiedAt}</span><span className="inline-flex items-center font-bold text-red-700">查看入选依据 <ChevronRight className="h-3 w-3" /></span></div>
    </div>
    <div className="grid grid-cols-3 border-t border-slate-200 bg-slate-50 text-[11px] font-bold">
      <button onClick={onSupport} className={`flex items-center justify-center gap-1 py-3 ${supported ? 'text-red-700' : 'text-slate-600'}`}><Heart className={`h-3.5 w-3.5 ${supported ? 'fill-red-600' : ''}`} />认可 {brand.upvotes || ''}</button>
      <button onClick={onEmployee} className="flex items-center justify-center gap-1 border-x border-slate-200 py-3 text-slate-600"><UserCheck className="h-3.5 w-3.5" />员工核验</button>
      <button onClick={onTicket} className="flex items-center justify-center gap-1 py-3 text-slate-600"><Receipt className="h-3.5 w-3.5" />消费支持</button>
    </div>
  </article>;
}

function CompanyDetail({ brand, onClose, onEmployee, onTicket }: { brand: BrandItem; onClose: () => void; onEmployee: () => void; onTicket: () => void }) {
  const metric = publicMetric(brand.employeeStats);
  const comments = sampleComments(brand.employeeStats, brand.id);
  const disputed = brand.auditStatus === 'disputed';
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45" role="dialog" aria-modal="true"><button className="absolute inset-0" onClick={onClose} aria-label="关闭" /><aside className="relative h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
    <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white/95 p-5 backdrop-blur"><div><span className={`text-[10px] font-bold ${disputed ? 'text-amber-700' : 'text-red-700'}`}>{ROLE_LABEL[brand.companyRole]} · {disputed ? '存在争议，继续核验' : '试运行入选'}</span><h2 className="mt-1 text-xl font-black text-slate-950">{brand.name}</h2><p className="text-xs text-slate-500">{brand.companyName}</p></div><button onClick={onClose} className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-bold">✕</button></div>
    <div className="space-y-6 p-5">
      <DetailSection title="入选结论"><div className="grid grid-cols-2 gap-3"><Metric label="双休兑现率" value={metric.label} /><Metric label="数据可信度" value={brand.confidence} /></div><p className="mt-3 text-sm leading-6 text-slate-700">{brand.inclusionSummary}</p><div className="mt-3 rounded-xl bg-red-50 p-3 text-xs leading-5 text-red-950"><strong>结论范围：</strong>{brand.verifiedScope}</div></DetailSection>
      <DetailSection title="制度与执行"><p className="text-sm leading-6 text-slate-700">{brand.summary}</p><div className="mt-3 grid grid-cols-2 gap-3"><Metric label="公开制度" value={brand.weekendPolicyLabel} /><Metric label="员工样本" value={`${brand.employeeStats?.totalEmployeeVotes ?? 0} 人`} /></div>{brand.employeeStats?.avgWeeklyHours !== undefined && <p className="mt-3 text-xs text-slate-500">员工报告平均周工时：{brand.employeeStats.avgWeeklyHours} 小时；累计观察 {brand.employeeStats.totalObservedWeeks ?? 0} 个员工周。</p>}</DetailSection>
      {brand.companyRole !== 'consumer' && <DetailSection title="供应链位置"><div className="flex flex-wrap gap-2">{brand.supplyChainProducts.map((product) => <span key={product} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">{product}</span>)}</div><p className="mt-3 text-xs text-slate-500">未核实的具体客户关系不会公开展示。</p></DetailSection>}
      <DetailSection title="入选依据">{brand.evidence.length ? <div className="space-y-3">{brand.evidence.map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-3"><div className="flex justify-between gap-3 text-[10px] text-slate-400"><span>{item.date}</span><span>公开资料</span></div><h4 className="mt-1 text-xs font-bold text-slate-900">{item.title}</h4><p className="mt-1 text-xs leading-5 text-slate-600">{item.summary}</p>{item.sourceUrl && <a className="mt-2 inline-block text-[11px] font-bold text-red-700" href={item.sourceUrl} target="_blank" rel="noreferrer">查看原始来源</a>}</article>)}</div> : <p className="text-xs text-slate-500">暂无可公开来源。</p>}</DetailSection>
      <DetailSection title="适用限制"> <ul className="space-y-2 text-xs leading-5 text-slate-600">{brand.limitations.map((item) => <li key={item} className="flex gap-2"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />{item}</li>)}</ul></DetailSection>
      <DetailSection title="员工反馈"><div className="mb-3 flex items-center justify-between"><p className="text-xs text-slate-500">随机分层展示最多3条已审核反馈。</p><button onClick={onEmployee} className="rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-bold text-white">提交员工核验</button></div>{comments.length ? <div className="space-y-2">{comments.map((comment) => <blockquote key={comment.id} className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-700"><div className="mb-1 flex justify-between text-[10px] text-slate-400"><span>{comment.role}</span><span>{comment.date}</span></div>“{comment.comment}”</blockquote>)}</div> : <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs text-slate-500">尚无通过审核的员工反馈。</div>}</DetailSection>
      <div className="flex gap-2"><button onClick={onTicket} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-3 text-xs font-black text-white"><Receipt className="h-4 w-4" />消费支持</button><button onClick={onEmployee} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-xs font-black"><CalendarCheck className="h-4 w-4" />核验实际执行</button></div>
    </div>
  </aside></div>;
}

function SubmissionModal({ onClose, onDone }: { onClose: () => void; onDone: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setBusy(true); try { await submitLead({ kind: 'recommend', companyName: String(data.get('companyName') || ''), parentCompany: String(data.get('parentCompany') || ''), workPolicy: 'strict_double', evidence: String(data.get('evidence') || '') }); onDone('资料已进入候选企业审核队列，审核通过前不会公开展示。'); } catch (error) { onDone(error instanceof Error ? error.message : '提交失败。'); } finally { setBusy(false); } };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"><div className="flex justify-between"><div><h2 className="font-black">推荐红榜候选 / 提交更新</h2><p className="mt-1 text-xs text-slate-500">未通过准入复核的企业不会公开。</p></div><button type="button" onClick={onClose}>✕</button></div><input required name="companyName" placeholder="企业或品牌名称" className="w-full rounded-lg border border-slate-200 p-3 text-xs" /><input name="parentCompany" placeholder="法定用人单位（建议填写）" className="w-full rounded-lg border border-slate-200 p-3 text-xs" /><textarea required minLength={10} maxLength={2000} rows={5} name="evidence" placeholder="请说明主体、基地、岗位、执行时间，并附可核验来源。不要提交个人敏感信息。" className="w-full rounded-lg border border-slate-200 p-3 text-xs" /><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-xs font-bold">取消</button><button disabled={busy} className="rounded-lg bg-red-700 px-4 py-2 text-xs font-bold text-white">{busy ? '提交中…' : '提交审核'}</button></div></form></div>;
}

function publicMetric(stats?: EmployeeVoteStats) { const ready = Boolean(stats && stats.totalEmployeeVotes >= 8 && (stats.totalObservedWeeks ?? 0) >= 24); return ready ? { label: `${stats!.realDoubleWeekendRate}%`, note: `${stats!.totalEmployeeVotes} 名员工、${stats!.totalObservedWeeks} 个员工周的已审核结果` } : { label: '核验中', note: '当前依据为公开资料试运行入选；员工执行样本尚未达到公开率门槛' }; }
function sampleComments(stats: EmployeeVoteStats | undefined, seed: string) { const all = stats?.anonymousComments ?? []; if (all.length <= 3) return all; const score = (id: string) => Array.from(`${seed}:${new Date().toISOString().slice(0, 10)}:${id}`).reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 7); const positive = all.filter((item) => item.voteType === 'supports_double').sort((a, b) => score(a.id) - score(b.id)); const caution = all.filter((item) => item.voteType === 'reports_overtime').sort((a, b) => score(a.id) - score(b.id)); const chosen = [positive[0], caution[0]].filter(Boolean); for (const item of [...all].sort((a, b) => score(a.id) - score(b.id))) if (chosen.length < 3 && !chosen.some((picked) => picked.id === item.id)) chosen.push(item); return chosen.slice(0, 3); }
function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) { return <button onClick={onClick} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{children}</button>; }
function DetailSection({ title, children }: { title: string; children: ReactNode }) { return <section><h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950"><span className="h-4 w-1 rounded bg-red-700" />{title}</h3>{children}</section>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="text-[10px] font-bold text-slate-400">{label}</div><div className="mt-1 text-lg font-black text-slate-950">{value}</div></div>; }

export default App;
