# 고밀도 출금 관리 리스트 UI (`src/app/withdrawals/ClientTable.tsx`)

`admin.html`의 스타일을 참고하여 **컬러 사용을 최소화하고 텍스트 밀도를 극대화**한 리스트 구현 예제입니다.

---

### 1. 주요 디자인 포인트
*   **Monochrome Palette:** 블랙, 화이트, 그레이 톤만 사용.
*   **Compact Padding:** 셀 패딩을 줄여(`py-1.5`) 한 화면에 25~30행 이상 노출.
*   **Subtle Action:** 승인/취소 버튼은 배경색 없이 보더와 텍스트로만 표현하여 시각적 소음을 제거.

### 2. 구현 코드

```tsx
"use client";

import { useTransition } from "react";
import { approveWithdrawal, cancelWithdrawal } from "@/actions/legacy";

export default function WithdrawalTable({ initialData }: { initialData: any[] }) {
  const [isPending, startTransition] = useTransition();

  const handleAction = (type: "APPROVE" | "CANCEL", id: string) => {
    const label = type === "APPROVE" ? "승인" : "취소";
    if (!confirm(`해당 건을 ${label} 하시겠습니까?`)) return;

    startTransition(async () => {
      const res = await (type === "APPROVE" ? approveWithdrawal(id) : cancelWithdrawal(id));
      if (res.code === "1") alert(`${label} 완료`);
      else alert(`오류: ${res.message}`);
    });
  };

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-sm overflow-hidden">
      <table className="w-full text-[13px] text-center border-collapse">
        <thead className="bg-[#F0F0F0] border-b border-[#E5E5E5] text-[#525252] font-bold">
          <tr>
            <th className="px-3 py-3 font-bold">신청일</th>
            <th className="px-3 py-3">가맹점</th>
            <th className="px-3 py-3">예금주</th>
            <th className="px-3 py-3">계좌정보</th>
            <th className="px-3 py-3 text-right">금액</th>
            <th className="px-3 py-3">상태</th>
            <th className="px-3 py-3">관리</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F5F5F5]">
          {initialData.map((row) => (
            <tr key={row._UNIQUEID} className="hover:bg-[#FAFAFA] transition-colors">
              <td className="px-3 py-2 text-[#737373] font-mono">{row._CREATE_DATETIME.split(' ')[0]}</td>
              <td className="px-3 py-2 font-semibold text-[#1A1A1A]">{row._AFFILIATE_ID}</td>
              <td className="px-3 py-2 text-[#1A1A1A]">{row._BANKUSER}</td>
              <td className="px-3 py-2">
                <div className="text-[#1A1A1A] font-medium">{row._BANKNAME}</div>
                <div className="text-[#A3A3A3] text-[11px] font-mono">{row._BANKNUMBER}</div>
              </td>
              <td className="px-3 py-2 text-right font-bold text-[#1A1A1A]">
                {Number(row._MONEY).toLocaleString()}
              </td>
              <td className="px-3 py-2">
                <span className={`font-bold ${row._STATE === '1' ? 'text-black' : 'text-[#A3A3A3]'}`}>
                  {row._STATE === '0' ? '대기' : row._STATE === '1' ? '완료' : '기타'}
                </span>
              </td>
              <td className="px-3 py-2">
                {row._STATE === "0" && (
                  <div className="flex justify-center gap-2">
                    <button 
                      onClick={() => handleAction("APPROVE", row._UNIQUEID)}
                      disabled={isPending}
                      className="px-2 py-1 border border-[#1A1A1A] text-[#1A1A1A] text-[11px] font-bold hover:bg-[#1A1A1A] hover:text-white disabled:opacity-30"
                    >
                      승인
                    </button>
                    <button 
                      onClick={() => handleAction("CANCEL", row._UNIQUEID)}
                      disabled={isPending}
                      className="px-2 py-1 border border-[#E5E5E5] text-[#737373] text-[11px] font-bold hover:bg-[#F5F5F5] disabled:opacity-30"
                    >
                      취소
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```
