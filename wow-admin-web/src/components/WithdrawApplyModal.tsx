"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { applyWithdrawal, searchWithdrawals, getWithdrawalLimits } from "@/actions/legacy";
import { useRouter } from "next/navigation";
import { BANKS } from "@/lib/bank-codes";
import { toast } from "@/lib/toast";
import { ConfirmModal } from "@/components/ConfirmModal";

const INITIAL_FORM = {
  bankuser: "",
  money: "",
  bankcode: "",
  bankname: "",
  phone: "",
  banknumber: "",
};

export function WithdrawApplyModal() {
  const modalRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [prevHistory, setPrevHistory] = useState<any[]>([]);
  const [limits, setLimits] = useState({ min: 0, max: 0 });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 클라이언트 마운트 후 portal 활성화 (hydration mismatch 방지)
  useEffect(() => { setMounted(true); }, []);

  // 한도 정보 미리 가져오기
  useEffect(() => {
    getWithdrawalLimits().then(res => {
      if (res.success) {
        setLimits({
          min: Number(res.data?._MINSENDMONEY || 0),
          max: Number(res.data?._MAXSENDMONEY || 0)
        });
      }
    });
  }, []);

  const updateField = useCallback((name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleBankChange = useCallback((bankcode: string) => {
    const bank = BANKS.find(b => b.code === bankcode);
    setForm(prev => ({ ...prev, bankcode, bankname: bank?.name || "" }));
  }, []);

  const handlePrevSelect = useCallback((h: any) => {
    const bank = BANKS.find(b => b.code === h._BANKCODE);
    setForm(prev => ({
      ...prev,
      bankcode: h._BANKCODE || "",
      bankname: bank?.name || h._BANKNAME || "",
      banknumber: h._BANKNUMBER || "",
      phone: h._PHONE || prev.phone,
    }));
  }, []);

  const handlePrevLookup = async () => {
    if (!form.bankuser.trim()) {
      toast.error("성함을 먼저 입력하세요.");
      return;
    }
    setLoading(true);
    try {
      const res = await searchWithdrawals(form.bankuser);
      if (res.code === "1" && res.data?.length) {
        setPrevHistory(res.data);
      } else {
        toast.error("이전 내역이 없습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // bankname 누락 방지
    if (!form.bankcode) {
      toast.error("은행을 선택하세요.");
      return;
    }
    setConfirmOpen(true);
  };

  const executeSubmit = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      const res = await applyWithdrawal(form);
      if (res.success) {
        toast.success("출금 신청이 완료되었습니다.");
        closeAndReset();
        router.refresh();
      } else {
        toast.error(res.error || "신청 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM);
    setPrevHistory([]);
  }, []);

  const closeAndReset = useCallback(() => {
    modalRef.current?.close();
    resetForm();
  }, [resetForm]);

  return (
    <>
      <button
        onClick={() => modalRef.current?.showModal()}
        className="btn btn-primary shadow-lg shadow-primary/20 font-bold gap-2 pr-6 pl-8 rounded-none rounded-l-2xl h-14 w-fit min-w-[90%]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        신규 출금 신청
      </button>

      {/* Portal: sidebar DOM 컨텍스트에서 분리하여 닫기 애니메이션이 중앙에서 수행되도록 함 */}
      {mounted && createPortal(<>
      <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle" onClose={resetForm}>
        <div className="modal-box max-w-2xl p-0 overflow-hidden bg-base-100 border border-base-300 shadow-2xl">
          {/* Modal Header */}
          <div className="bg-primary p-6 text-primary-content relative">
            <h3 className="font-bold text-xl tracking-tight flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-lg">💸</span>
              신규 출금 신청 등록
            </h3>
            <p className="text-sm opacity-70 mt-1 font-medium italic">지급 대행을 위한 출금 정보를 정확히 입력하십시오.</p>
            <button
              type="button"
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-6"
              onClick={closeAndReset}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 예금주 */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-base-content/60 uppercase tracking-widest text-sm">Recipient Name</span>
                </label>
                <div className="join w-full shadow-sm">
                  <input
                    name="bankuser"
                    required
                    placeholder="성함 입력"
                    className="input input-bordered join-item w-full font-bold focus:border-primary"
                    value={form.bankuser}
                    onChange={(e) => updateField("bankuser", e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-neutral join-item font-bold"
                    onClick={handlePrevLookup}
                    disabled={loading}
                  >
                    조회
                  </button>
                </div>
              </div>

              {/* 금액 */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-base-content/60 uppercase tracking-widest text-sm">Amount (KRW)</span>
                  <span className="label-text-alt font-bold text-primary/60">
                    {limits.min > 0 && `Min: ${limits.min.toLocaleString()}`}
                    {limits.max > 0 && ` / Max: ${limits.max.toLocaleString()}`}
                  </span>
                </label>
                <input
                  name="money"
                  type="number"
                  required
                  min={limits.min || undefined}
                  max={limits.max || undefined}
                  placeholder="0"
                  className="input input-bordered w-full font-bold text-lg tabular-nums focus:border-primary shadow-sm"
                  value={form.money}
                  onChange={(e) => updateField("money", e.target.value)}
                />
              </div>
            </div>

            {/* 이전 내역 퀵 가이드 (조회 시 노출) */}
            {prevHistory.length > 0 && (
              <div className="bg-base-200/50 rounded-xl p-4 space-y-3 border border-base-300">
                <span className="text-sm font-medium text-base-content/30 uppercase tracking-widest">Previous Records</span>
                <div className="flex flex-wrap gap-2">
                  {prevHistory.slice(0, 3).map((h, i) => (
                    <button
                      key={i}
                      type="button"
                      className="btn btn-xs btn-outline btn-ghost font-bold rounded-lg py-3 h-auto"
                      onClick={() => handlePrevSelect(h)}
                    >
                      {h._BANKNAME} | {h._BANKNUMBER}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 은행 선택 */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-base-content/60 uppercase tracking-widest text-sm">Bank Selection</span>
                </label>
                <select
                  name="bankcode"
                  required
                  className="select select-bordered w-full font-bold focus:border-primary shadow-sm"
                  value={form.bankcode}
                  onChange={(e) => handleBankChange(e.target.value)}
                >
                  <option value="">은행을 선택하세요</option>
                  {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                </select>
              </div>

              {/* 연락처 */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-base-content/60 uppercase tracking-widest text-sm">Contact Phone</span>
                </label>
                <input
                  name="phone"
                  required
                  placeholder="01012345678"
                  className="input input-bordered w-full font-bold focus:border-primary shadow-sm"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
            </div>

            {/* 계좌번호 */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium text-base-content/60 uppercase tracking-widest text-sm">Account Number</span>
              </label>
              <input
                name="banknumber"
                required
                placeholder="하이픈(-) 없이 숫자만 입력"
                className="input input-bordered w-full font-bold text-lg tabular-nums focus:border-primary shadow-sm"
                value={form.banknumber}
                onChange={(e) => updateField("banknumber", e.target.value)}
              />
            </div>

            {/* Submit */}
            <div className="modal-action pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-block h-14 text-lg font-bold shadow-xl shadow-primary/30 rounded-xl"
              >
                {loading ? <span className="loading loading-spinner" /> : "출금 신청 제출하기"}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop bg-black/40 backdrop-blur-sm">
          <button onClick={() => closeAndReset()}>close</button>
        </form>
      </dialog>

      <ConfirmModal
        open={confirmOpen}
        title="출금 신청 확인"
        message={`${form.bankuser}님에게 ${Number(form.money || 0).toLocaleString()}원을 ${form.bankname || "선택된 은행"}으로 출금 신청하시겠습니까?`}
        confirmLabel="신청 제출"
        cancelLabel="취소"
        loading={loading}
        onConfirm={executeSubmit}
        onCancel={() => setConfirmOpen(false)}
      />
      </>, document.body)}
    </>
  );
}
