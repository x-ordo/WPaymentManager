"use client";

import { useRef, useState } from "react";
import { applyWithdrawal, searchWithdrawals } from "@/actions/legacy";
import { useRouter } from "next/navigation";
import { BANKS } from "@/lib/bank-codes";
import { getLegacyErrorMessage } from "@/lib/error-codes";
import { ConfirmModal } from "@/components/ConfirmModal";
import { toast } from "@/lib/toast";

export default function WithdrawalApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [prevHistory, setPrevHistory] = useState<any[]>([]);
  const modalRef = useRef<HTMLDialogElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handlePrevLookup = async () => {
    const name = (document.getElementsByName("bankuser")[0] as HTMLInputElement).value;
    if (!name) {
      toast.error("예금주 성함을 먼저 입력하세요.");
      return;
    }
    setLoading(true);
    const res = await searchWithdrawals(name);
    if (res.code === "1") {
      setPrevHistory(res.data || []);
      modalRef.current?.showModal();
    } else {
      toast.error("이전 내역이 없습니다.");
    }
    setLoading(false);
  };

  const handleApplyFromHistory = (item: any) => {
    const form = formRef.current;
    if (!form) return;
    (form.elements.namedItem("bankuser") as HTMLInputElement).value = item._BANKUSER;
    (form.elements.namedItem("banknumber") as HTMLInputElement).value = item._BANKNUMBER;
    (form.elements.namedItem("bankname") as HTMLInputElement).value = item._BANKNAME;
    (form.elements.namedItem("bankcode") as HTMLInputElement).value = item._BANKCODE;
    (form.elements.namedItem("phone") as HTMLInputElement).value = item._PHONE || "";
    modalRef.current?.close();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const executeSubmit = async () => {
    const form = formRef.current;
    if (!form) return;

    const formData = new FormData(form);
    const params = {
      money: formData.get("money") as string,
      bankuser: formData.get("bankuser") as string,
      bankcode: formData.get("bankcode") as string,
      bankname: formData.get("bankname") as string,
      banknumber: formData.get("banknumber") as string,
      phone: formData.get("phone") as string,
    };

    setLoading(true);
    try {
      const res = await applyWithdrawal(params);
      if (res.code === "1") {
        toast.success("출금 신청이 완료되었습니다.");
        router.push("/withdrawals");
      } else {
        const errorMsg = res.code === "VALIDATION_ERROR"
          ? (res.message ?? res.error ?? "입력값 오류")
          : getLegacyErrorMessage("/50000", res.code ?? "");
        toast.error(errorMsg);
      }
    } catch {
      toast.error("서버 통신 중 장애가 발생했습니다.");
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight">신규 출금 신청 등록</h1>
        <p className="text-sm text-base-content/50 mt-1">지급 대행을 위한 출금 정보를 정확히 입력하십시오.</p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="card card-border bg-base-100">
        <div className="card-body space-y-6 p-6 lg:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">예금주 성함 *</legend>
              <div className="join w-full">
                <input name="bankuser" required className="input join-item flex-1 font-semibold" placeholder="성함 입력" />
                <button type="button" onClick={handlePrevLookup} className="btn btn-ghost join-item">이전내역</button>
              </div>
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">출금 신청 금액 (원) *</legend>
              <input name="money" type="number" required className="input w-full text-xl font-bold text-right tabular-nums" placeholder="0" />
            </fieldset>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">은행명</legend>
              <input name="bankname" readOnly className="input w-full bg-base-200" placeholder="자동입력" />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">은행 선택 *</legend>
              <select name="bankcode" required className="select w-full font-semibold"
                onChange={(e) => {
                  const bank = BANKS.find(b => b.code === e.target.value);
                  const nameInput = e.target.form?.elements.namedItem("bankname") as HTMLInputElement;
                  if (nameInput) nameInput.value = bank?.name ?? "";
                }}
              >
                <option value="">은행 선택</option>
                {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">연락처 *</legend>
              <input name="phone" required className="input w-full" placeholder="01012345678" />
            </fieldset>
          </div>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">출금 계좌 번호 *</legend>
            <input name="banknumber" required className="input w-full text-lg font-bold tracking-tight" placeholder="하이픈(-) 없이 숫자만 입력" />
          </fieldset>

          <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg">
            {loading && <span className="loading loading-spinner loading-sm" />}
            출금 신청 제출
          </button>
        </div>
      </form>

      {/* Prev History Modal */}
      <dialog ref={modalRef} className="modal">
        <div className="modal-box max-w-xl">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-lg">이전 출금 내역 조회</h3>
            <form method="dialog">
              <button className="btn btn-ghost btn-sm btn-circle">&times;</button>
            </form>
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {prevHistory.map((h, i) => (
              <button key={i} onClick={() => handleApplyFromHistory(h)} className="w-full text-left p-4 border border-base-300 rounded-lg hover:bg-primary/5 flex justify-between items-center transition-colors group">
                <div className="flex flex-col">
                  <span className="font-bold text-base group-hover:text-primary">{h._BANKNAME} / {h._BANKUSER}</span>
                  <span className="text-sm text-base-content/40">{h._BANKNUMBER}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-base tabular-nums">{Number(h._MONEY).toLocaleString()}원</div>
                  <div className="text-sm font-light text-base-content/30">{h._CREATE_DATETIME}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
        <form method="dialog" className="modal-backdrop"><button>close</button></form>
      </dialog>

      {/* Submit Confirm Modal */}
      <ConfirmModal
        open={showConfirm}
        title="출금 신청 확인"
        message="출금 신청을 진행하시겠습니까? 제출 후 관리자 승인을 기다립니다."
        confirmLabel="신청 제출"
        variant="primary"
        loading={loading}
        onConfirm={executeSubmit}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
