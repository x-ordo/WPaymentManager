"use client";

import { useRef, useState } from "react";
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
  const modalRef = useRef<HTMLDialogElement>(null);

  const handlePrevLookup = async () => {
    const name = (document.getElementsByName("bankuser")[0] as HTMLInputElement).value;
    if (!name) return alert("예금주 이름을 먼저 입력하세요.");
    setLoading(true);
    const res = await searchWithdrawals(name);
    if (res.code === "1") {
      setPrevHistory(res.data || []);
      modalRef.current?.showModal();
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
    modalRef.current?.close();
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-base-300 pb-4">
        <h1 className="text-xl font-bold tracking-tight">신규 출금 신청 등록</h1>
        <p className="text-sm text-base-content/50 mt-1">지급 대행을 위한 출금 정보를 정확히 입력하십시오.</p>
      </div>

      <form onSubmit={handleSubmit} className="card card-border bg-base-100">
        <div className="card-body space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="label text-xs font-semibold">예금주 성함 *</label>
              <div className="join w-full">
                <input name="bankuser" required className="input input-bordered join-item flex-1 font-semibold" placeholder="성함 입력" />
                <button type="button" onClick={handlePrevLookup} className="btn btn-ghost join-item text-xs">이전내역</button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="label text-xs font-semibold">출금 신청 금액 (원) *</label>
              <input name="money" type="number" required className="input input-bordered w-full text-lg font-bold text-right font-mono tabular-nums" placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="label text-xs font-semibold">은행명</label>
              <input name="bankname" readOnly className="input input-bordered w-full bg-base-200" placeholder="자동입력" />
            </div>
            <div className="space-y-1.5">
              <label className="label text-xs font-semibold">은행 선택 *</label>
              <select name="bankcode" required className="select select-bordered w-full font-semibold"
                onChange={(e) => {
                  const bank = BANKS.find(b => b.code === e.target.value);
                  const nameInput = e.target.form?.elements.namedItem("bankname") as HTMLInputElement;
                  if (nameInput) nameInput.value = bank?.name ?? "";
                }}
              >
                <option value="">은행 선택</option>
                {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="label text-xs font-semibold">연락처 *</label>
              <input name="phone" required className="input input-bordered w-full font-mono" placeholder="01012345678" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="label text-xs font-semibold">출금 계좌 번호 *</label>
            <input name="banknumber" required className="input input-bordered w-full text-base font-mono font-bold tracking-tight" placeholder="하이픈(-) 없이 숫자만 입력" />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            출금 신청 제출
          </button>
        </div>
      </form>

      {/* Prev History Modal */}
      <dialog ref={modalRef} className="modal">
        <div className="modal-box max-w-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-base">이전 출금 내역 조회</h3>
            <form method="dialog">
              <button className="btn btn-ghost btn-sm btn-circle">&times;</button>
            </form>
          </div>
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {prevHistory.map((h, i) => (
              <button key={i} onClick={() => handleApplyFromHistory(h)} className="w-full text-left p-3 border border-base-300 rounded-lg hover:bg-primary/5 flex justify-between items-center transition-colors group">
                <div className="flex flex-col">
                  <span className="font-bold text-sm group-hover:text-primary">{h._BANKNAME} / {h._BANKUSER}</span>
                  <span className="text-xs font-mono text-base-content/40">{h._BANKNUMBER}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm font-mono tabular-nums">{Number(h._MONEY).toLocaleString()}원</div>
                  <div className="text-2xs text-base-content/30">{h._CREATEDATE}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
        <form method="dialog" className="modal-backdrop"><button>close</button></form>
      </dialog>
    </div>
  );
}
