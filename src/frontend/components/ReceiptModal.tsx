import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, Copy, Check, Sparkles, ShieldCheck } from 'lucide-react';
import type { BrandItem } from '../types';

export type ReceiptTarget = Pick<BrandItem, 'id' | 'name' | 'companyName'> &
  Partial<Pick<BrandItem, 'admission' | 'verifiedScope'>>;

const MIN_PURCHASE_AMOUNT = 1;
const MAX_PURCHASE_AMOUNT = 1_000_000;

function validateAmountInput(value: string): string | null {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return '请输入有效金额，最多保留两位小数。';
  }
  const parsed = Number(normalized);
  if (parsed < MIN_PURCHASE_AMOUNT || parsed > MAX_PURCHASE_AMOUNT) {
    return '金额需在 1 元到 1,000,000 元之间。';
  }
  return null;
}

interface ReceiptCardProps {
  brand: ReceiptTarget;
  amount: number;
  onClose: () => void;
  onComplete: (amount: number) => Promise<void>;
}

export const ReceiptModal: React.FC<ReceiptCardProps> = ({
  brand,
  amount,
  onClose,
  onComplete,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isDefault = brand.id === 'default';
  const [amountInput, setAmountInput] = useState(String(amount));
  const amountError = validateAmountInput(amountInput);
  const customAmount = amountError ? 0 : Number(amountInput);
  const amountLabel = amountError
    ? amountInput || '—'
    : customAmount.toLocaleString('zh-CN', { maximumFractionDigits: 2 });

  const ticketNo = `WLB-${new Date().getTime().toString().slice(-8)}`;
  const dateStr = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const handleCopyText = () => {
    if (amountError) return;
    const text = isDefault
      ? `【双休购 · 消费支持凭据】\n凭证编号：${ticketNo}\n支持对象：default\n消费支持：¥${amountLabel}\n通用消费支持记录，不对应具体企业。`
      : `【双休购 · 红榜消费支持凭据】\n凭证编号：${ticketNo}\n支持对象：${brand.name}\n入选状态：${brand.admission === 'employee_verified' ? '员工执行已核验' : '公开资料试运行入选'}\n结论范围：${brand.verifiedScope}\n消费支持：¥${amountLabel}\n消费金额仅表达支持，不参与企业准入和双休兑现率计算。`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(receiptRef.current, {
        cacheBust: true,
        pixelRatio: 3, // 高清视网膜长图
        backgroundColor: '#faf8f5',
      });
      const link = document.createElement('a');
      link.download = `双休购考核小票-${brand.name}-${ticketNo}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
      alert('生成图片失败，可尝试直接复制小票文本');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-sm w-full my-auto space-y-4">
        {/* 顶部控制栏 */}
        <div className="flex items-center justify-between text-white/80 px-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-red-400">
            <Sparkles className="w-3.5 h-3.5" />
            {isDefault ? '消费支持凭据' : '红榜消费支持凭据'}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* 拟物热敏小票主体 */}
        <div
          ref={receiptRef}
          className="receipt-tear-top receipt-tear-bottom bg-[#faf8f5] text-slate-900 p-6 shadow-2xl border-x border-[#ebe5dc] relative font-mono select-none overflow-hidden"
          style={{
            backgroundImage: 'radial-gradient(rgba(0,0,0,0.02) 1px, transparent 0)',
            backgroundSize: '8px 8px',
          }}
        >
          {/* 红榜状态盖戳 */}
          {!isDefault && <div className="absolute right-4 top-20 pointer-events-none opacity-85 rotate-[-14deg]">
            <div className="border-2 border-red-600 text-red-600 rounded-lg px-2.5 py-1 text-[11px] font-black tracking-widest uppercase flex items-center gap-1 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>红榜在列</span>
            </div>
          </div>}

          {/* 抬头 */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300 space-y-1">
            <div className="text-base font-black tracking-tighter text-slate-950 flex items-center justify-center gap-2">
              <img src="/logo.svg" alt="双休购购物车 Logo" className="h-7 w-7" />
              <span>双休购 · 消费支持凭据</span>
            </div>
            <div className="text-[10px] text-slate-500 font-sans tracking-tight">
              {isDefault ? 'SHUANGXIUGOU SUPPORT RECEIPT' : 'SHUANGXIUGOU REDLIST SUPPORT RECEIPT'}
            </div>
            <div className="text-[10px] text-slate-400 font-mono pt-1">
              NO. {ticketNo} · {dateStr}
            </div>
          </div>

          {/* 考核主体信息 */}
          <div className="py-4 border-b border-dashed border-slate-300 space-y-2 text-xs">
            <div className="flex justify-between items-start">
              <span className="text-slate-500">记录方式:</span>
              <span className="font-bold text-slate-800">社区消费支持</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-slate-500 whitespace-nowrap">支持对象:</span>
              <span className="font-bold text-slate-900 text-right truncate max-w-[180px]">
                {brand.name}
              </span>
            </div>
            {!isDefault && <div className="flex justify-between items-start gap-2">
              <span className="text-slate-500 whitespace-nowrap">所属企业:</span>
              <span className="text-[11px] text-slate-600 text-right truncate max-w-[180px]">
                {brand.companyName}
              </span>
            </div>}
            {!isDefault && <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500">入选状态:</span>
              <span className="font-black px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-800">
                {brand.admission === 'employee_verified' ? '员工执行已核验' : '公开资料试运行'}
              </span>
            </div>}
          </div>

          {/* 金额核算区 */}
          <div className="py-4 border-b border-dashed border-slate-300 space-y-2 text-xs">
            <div className="flex justify-between items-baseline">
              <span className="text-slate-600 font-semibold">
                消费支持金额:
              </span>
              <span className="text-xl font-black font-mono text-red-700">
                + ¥ {amountLabel}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 leading-normal font-sans">
              金额仅记录消费者的支持意愿，不参与红榜准入、可信度或双休兑现率计算。
            </div>
          </div>

          {/* 态度标语与条形码 */}
          <div className="pt-4 text-center space-y-3">
            <div className="text-[11px] text-slate-700 font-sans italic font-medium leading-relaxed px-2">
              “让每一次消费选择，
              <br />
              支持更尊重休息的工作方式。”
            </div>

            {/* 仿真条形码 */}
            <div className="flex flex-col items-center justify-center pt-1">
              <div className="flex items-center gap-[2px] h-9">
                {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 1, 3, 4, 1, 2, 3, 1].map(
                  (w, i) => (
                    <div
                      key={i}
                      className="bg-slate-800 h-full"
                      style={{ width: `${w * 1.5}px` }}
                    />
                  )
                )}
              </div>
              <div className="text-[9px] text-slate-400 font-mono tracking-widest pt-1">
                SHUANGXIUGOU · WORKERS
              </div>
            </div>
          </div>
        </div>

        {/* 交互调整与按钮区 */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">本次消费支持金额:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">¥</span>
              <input
                type="number"
                min={MIN_PURCHASE_AMOUNT}
                max={MAX_PURCHASE_AMOUNT}
                step="0.01"
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                aria-invalid={Boolean(amountError)}
                aria-describedby="purchase-amount-error"
                className="w-24 px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 text-right focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          {amountError && (
            <p id="purchase-amount-error" className="text-[11px] text-rose-700" role="alert">
              {amountError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleCopyText}
              className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-red-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制' : '复制文本'}</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={downloading}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? '生成中...' : '保存高清图'}</span>
            </button>
          </div>

          <button
            onClick={async () => {
              setSaving(true);
              try {
                await onComplete(customAmount);
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving || Boolean(amountError)}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{saving ? '提交审核中…' : '登记消费支持'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
