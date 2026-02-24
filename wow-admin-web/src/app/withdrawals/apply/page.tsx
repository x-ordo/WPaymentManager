"use client";

import { useState } from "react";
import { applyWithdrawal, searchWithdrawals } from "@/actions/legacy";
import { useRouter } from "next/navigation";

const BANKS = [
  { code: '003', name: 'IBK기업은행' }, { code: '004', name: 'KB국민은행' },
  { code: '011', name: 'NH농협은행' }, { code: '020', name: '우리은행' },
  { code: '081', name: '하나은행' }, { code: '088', name: '신한은행' },
  { code: '089', name: '케이뱅크' }, { code: '090', name: '카카오뱅크' },
  { code: '092', name: '토스뱅크' }, { code: '045', name: '새마을금고' },
  { code: '071', name: '우체국' }, { code: '048', name: '신협' }
];

export default function WithdrawalApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [prevHistory, setPrevHistory] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  const handlePrevLookup = async () => {
    const name = (document.getElementsByName("bankuser")[0] as HTMLInputElement).value;
    if (!name) return alert("예금주 이름을 먼저 입력하세요.");
    setLoading(true);
    const res = await searchWithdrawals(name);
    if (res.code === "1") {
      setPrevHistory(res.data || []);
      setShowModal(true);
    } else {
      alert("이전 내역이 없습니다.");
    }
    setLoading(false);
  };

  const handleApplyFromHistory = (item: any) => {
    const form = document.querySelector("form") as HTMLFormElement;
    (form.elements.namedItem("bankuser") as HTMLInputElement).value = item._BANKUSER;
    (form.elements.namedItem("banknumber") as HTMLInputElement).value = item._BANKNUMBER;
    (form.elements.namedItem("bankname") as HTMLInputElement).value = item._BANKNAME;
    (form.elements.namedItem("bankcode") as HTMLInputElement).value = item._BANKCODE;
    (form.elements.namedItem("phone") as HTMLInputElement).value = item._PHONE || "";
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = {
      money: formData.get("money") as string,
      bankuser: formData.get("bankuser") as string,
      bankcode: formData.get("bankcode") as string,
      bankname: formData.get("bankname") as string,
      banknumber: formData.get("banknumber") as string,
      phone: formData.get("phone") as string,
    };

    if (!confirm("출금 신청을 진행하시겠습니까?")) return;
    setLoading(true);
    const res = await applyWithdrawal(params);
    if (res.code === "1") {
      alert("출금 신청 완료");
      router.push("/withdrawals");
    } else alert(`실패: ${res.message}`);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 relative">
      <div className="border-b border-border-strong pb-4">
        <h1 className="text-xl font-bold text-ink-primary tracking-tight">신규 출금 신청 등록</h1>
        <p className="text-sm text-ink-tertiary mt-1">지급 대행을 위한 출금 정보를 정확히 입력하십시오.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-card border border-border-default shadow-sm rounded-lg p-8 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-secondary">예금주 성함 *</label>
            <div className="flex gap-2">
              <input name="bankuser" required className="flex-1 border border-border-default px-3 py-2.5 text-sm focus-visible:border-border-focus outline-none rounded-md font-semibold" placeholder="성함 입력" />
              <button type="button" onClick={handlePrevLookup} className="bg-surface-muted border border-border-default rounded-md px-3 text-xs font-semibold text-ink-tertiary hover:bg-surface-active transition-colors duration-fast">
                이전내역
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-secondary">출금 신청 금액 (원) *</label>
            <input name="money" type="number" required className="w-full border border-border-default rounded-md px-3 py-2.5 text-lg focus-visible:border-border-focus outline-none font-bold text-right font-mono tabular-nums" placeholder="0" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-secondary">은행명</label>
            <input name="bankname" className="w-full border border-border-default rounded-md px-3 py-2.5 text-sm outline-none bg-surface-muted" placeholder="자동입력" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-secondary">은행 선택 *</label>
            <select name="bankcode" required className="w-full border border-border-default rounded-md px-3 py-2.5 text-sm outline-none focus-visible:border-border-focus font-semibold">
              <option value="">은행 선택</option>
              {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-secondary">연락처 *</label>
            <input name="phone" required className="w-full border border-border-default rounded-md px-3 py-2.5 text-sm font-mono outline-none focus-visible:border-border-focus" placeholder="01012345678" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-secondary">출금 계좌 번호 *</label>
          <input name="banknumber" required className="w-full border border-border-default rounded-md px-3 py-2.5 text-base font-mono font-bold tracking-tight outline-none focus-visible:border-border-focus" placeholder="하이픈(-) 없이 숫자만 입력" />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-btn-primary-bg text-btn-primary-text rounded-md py-3.5 text-sm font-bold hover:bg-btn-primary-hover transition-colors duration-fast disabled:opacity-30">
          출금 신청 제출
        </button>
      </form>

      {/* Prev History Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8">
          <div className="bg-surface-card w-full max-w-xl max-h-[80vh] overflow-hidden flex flex-col shadow-xl rounded-xl border border-border-default">
            <div className="p-5 border-b border-border-default flex justify-between items-center bg-surface-muted rounded-t-xl">
              <h3 className="font-bold text-base text-ink-primary">이전 출금 내역 조회</h3>
              <button onClick={() => setShowModal(false)} className="text-xl font-bold text-ink-tertiary hover:text-ink-primary">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
              {prevHistory.map((h, i) => (
                <button key={i} onClick={() => handleApplyFromHistory(h)} className="w-full text-left p-3 border border-border-default rounded-md hover:bg-surface-primary-light flex justify-between items-center transition-colors duration-fast group">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-ink-primary group-hover:text-primary-text">{h._BANKNAME} / {h._BANKUSER}</span>
                    <span className="text-xs font-mono text-ink-muted">{h._BANKNUMBER}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm font-mono tabular-nums">{Number(h._MONEY).toLocaleString()}원</div>
                    <div className="text-2xs text-ink-disabled">{h._CREATEDATE}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
