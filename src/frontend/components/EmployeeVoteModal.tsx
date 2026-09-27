import { useState, type FormEvent } from 'react';
import { BadgeCheck, CalendarDays, Clock, Lock, MapPin, UserCheck } from 'lucide-react';
import type { BrandItem } from '../types';

export interface EmployeeExecutionReport {
  role: string;
  location: string;
  employmentStatus: 'current' | 'recent_former';
  observedWeeks: number;
  doubleRestWeeks: number;
  weeklyHours: number;
  restDayInterruptions: number;
  statutoryPay: boolean;
  comment: string;
}

interface Props {
  brand: BrandItem;
  onClose: () => void;
  onSubmit: (brandId: string, report: EmployeeExecutionReport) => Promise<void>;
}

export function EmployeeVoteModal({ brand, onClose, onSubmit }: Props) {
  const [role, setRole] = useState('研发技术');
  const [location, setLocation] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState<'current' | 'recent_former'>('current');
  const [observedWeeks, setObservedWeeks] = useState(8);
  const [doubleRestWeeks, setDoubleRestWeeks] = useState(8);
  const [weeklyHours, setWeeklyHours] = useState(40);
  const [restDayInterruptions, setRestDayInterruptions] = useState(0);
  const [statutoryPay, setStatutoryPay] = useState(true);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (doubleRestWeeks > observedWeeks) {
      setError('休足两天的周数不能超过观察周数。');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSubmit(brand.id, { role, location, employmentStatus, observedWeeks, doubleRestWeeks, weeklyHours, restDayInterruptions, statutoryPay, comment });
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '提交失败，请稍后重试。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between bg-slate-950 p-5 text-white">
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-red-300"><BadgeCheck className="h-4 w-4" />员工事实核验</div>
            <h2 className="text-lg font-black">核验 {brand.name} 最近 8 周的休息情况</h2>
            <p className="mt-1 text-xs text-slate-400">不再填写主观分数，只记录实际发生的员工周。</p>
          </div>
          <button onClick={onClose} className="rounded-lg bg-white/10 px-2 py-1 text-sm" aria-label="关闭">✕</button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-5 text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 font-bold text-slate-700">
              <span className="flex items-center gap-1"><UserCheck className="h-4 w-4 text-red-600" />岗位类型</span>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-normal">
                <option>研发技术</option><option>生产/工厂</option><option>职能/财务/人事</option><option>门店/客服/销售</option><option>物流/运维</option><option>其他</option>
              </select>
            </label>
            <label className="space-y-1.5 font-bold text-slate-700">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-red-600" />城市或基地</span>
              <input required maxLength={80} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="例如：保定总部 / 成都工厂" className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-normal" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {([['current', '目前在职'], ['recent_former', '一年内离职']] as const).map(([value, label]) => (
              <button type="button" key={value} onClick={() => setEmploymentStatus(value)} className={`rounded-lg border p-2.5 font-bold ${employmentStatus === value ? 'border-red-500 bg-red-50 text-red-800' : 'border-slate-200 text-slate-600'}`}>{label}</button>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-1.5 font-bold text-slate-800"><CalendarDays className="h-4 w-4 text-red-600" />最近实际工作情况</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="观察周数（1–8）" value={observedWeeks} min={1} max={8} onChange={(value) => { setObservedWeeks(value); setDoubleRestWeeks((current) => Math.min(current, value)); }} />
              <NumberField label="其中休足两天的周数" value={doubleRestWeeks} min={0} max={observedWeeks} onChange={setDoubleRestWeeks} />
              <NumberField label="通常每周实际工时" value={weeklyHours} min={0} max={100} suffix="小时" onChange={setWeeklyHours} />
              <NumberField label="休息日被工作打断次数" value={restDayInterruptions} min={0} max={30} suffix="次" onChange={setRestDayInterruptions} />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-1.5 font-bold text-slate-700"><Clock className="h-4 w-4 text-red-600" />加班费或补休是否实际兑现</div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setStatutoryPay(true)} className={`rounded-lg border p-2.5 font-bold ${statutoryPay ? 'border-red-500 bg-red-50 text-red-800' : 'border-slate-200'}`}>是 / 没有加班</button>
              <button type="button" onClick={() => setStatutoryPay(false)} className={`rounded-lg border p-2.5 font-bold ${!statutoryPay ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-slate-200'}`}>没有兑现</button>
            </div>
          </div>

          <label className="block space-y-1.5 font-bold text-slate-700">
            <span>补充说明（可选）</span>
            <textarea rows={3} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="只写岗位与制度事实，请勿填写姓名、联系方式、工牌号等个人信息。" className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 font-normal" />
          </label>

          <div className="flex gap-2 rounded-lg bg-slate-100 p-3 text-[11px] leading-relaxed text-slate-500"><Lock className="mt-0.5 h-4 w-4 shrink-0" />反馈先进入人工审核。网络标识仅用于防重复；公开数据按岗位和基地聚合，不公开个人身份。</div>
          {error && <p className="font-bold text-rose-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 font-bold text-slate-600">取消</button>
            <button disabled={busy} className="rounded-lg bg-red-700 px-5 py-2.5 font-bold text-white disabled:opacity-50">{busy ? '提交中…' : '提交员工周核验'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NumberField({ label, value, min, max, suffix, onChange }: { label: string; value: number; min: number; max: number; suffix?: string; onChange: (value: number) => void }) {
  return <label className="space-y-1 text-[11px] font-bold text-slate-600"><span>{label}</span><div className="flex items-center gap-2"><input type="number" value={value} min={min} max={max} onChange={(e) => onChange(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-sm text-slate-900" />{suffix && <span className="text-slate-400">{suffix}</span>}</div></label>;
}
