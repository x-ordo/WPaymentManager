"use client";

import { useTransition } from "react";
import { approveWithdrawal, cancelWithdrawal } from "@/actions/legacy";
import { getBankName } from "@/lib/bank-codes";

export default function WithdrawalTable({ initialData, viewMode }: { initialData: any[], viewMode: string }) {
  const [isPending, startTransition] = useTransition();

  const handleAction = (type: "APPROVE" | "CANCEL", id: string) => {
    const label = type === "APPROVE" ? "승인" : "취소";
    if (!confirm(`해당 건을 ${label} 하시겠습니까?`)) return;

    startTransition(async () => {
      const res = await (type === "APPROVE" ? approveWithdrawal(id) : cancelWithdrawal(id));
      if (res.code === "1") alert(`${label} 완료`);
      else if (res.code === "VALIDATION_ERROR") alert(res.message);
      else alert(`${label} 처리 중 오류가 발생했습니다.`);
    });
  };

  const getStatusBadge = (row: any) => {
    if (viewMode === "active") {
      if (row._STATE === "0") return { cls: "badge-ghost badge-outline", label: "대기중" };
      if (row._STATE === "1") return { cls: "badge-success badge-soft", label: "처리완료" };
      if (row._STATE === "2") return { cls: "badge-error badge-soft", label: "오류" };
      if (row._STATE === "3") return { cls: "badge-warning badge-soft", label: "취소" };
      return { cls: "badge-ghost", label: `상태(${row._STATE})` };
    }
    return row._USE === "True"
      ? { cls: "badge-success badge-soft", label: "통보완료" }
      : { cls: "badge-error badge-soft", label: "실패" };
  };

  return (
    <div className="card card-border bg-base-100 overflow-hidden">
      <table className="table table-zebra">
        <thead>
          <tr className="text-sm">
            <th>일시</th>
            <th>가맹점</th>
            <th>{viewMode === 'active' ? '예금주' : '수취인'}</th>
            <th>계좌정보</th>
            {viewMode === "history" && <th>연락처</th>}
            <th className="text-right">신청금액</th>
            <th className="text-center">상태</th>
            <th className="text-center">액션</th>
          </tr>
        </thead>
        <tbody>
          {initialData.length === 0 ? (
            <tr><td colSpan={viewMode === "history" ? 8 : 7} className="py-20 text-base text-base-content/40 text-center">데이터가 존재하지 않습니다.</td></tr>
          ) : (
            initialData.map((row) => {
              const status = getStatusBadge(row);
              return (
                <tr key={row._UNIQUEID} className={row._RETURNCODE !== "0" && row._RETURNCODE ? 'bg-error/5' : ''}>
                  <td className="align-top">
                    <div className="font-mono text-sm text-base-content/50 whitespace-nowrap">{row._CREATE_DATETIME}</div>
                    <div className="font-mono text-xs text-base-content/30 mt-0.5">ID {row._UNIQUEID}</div>
                  </td>
                  <td className="align-top">
                    <div className="font-semibold">{row._AFFILIATE_ID}</div>
                    <div className="font-mono text-xs text-base-content/40 mt-0.5">{row._ORDERNUMBER || "—"}</div>
                  </td>
                  <td className="font-semibold whitespace-nowrap">
                    {viewMode === 'active' ? row._BANKUSER : row._NAME}
                  </td>
                  <td className="align-top">
                    <div className="font-semibold whitespace-nowrap">{row._BANKNAME || getBankName(row._BANKCODE)}</div>
                    <div className="font-mono text-sm text-base-content/50 mt-0.5">{row._BANKNUMBER}</div>
                  </td>
                  {viewMode === "history" && (
                    <td className="font-mono text-sm whitespace-nowrap">
                      {row._TEL || row._PHONE || <span className="text-base-content/30">미등록</span>}
                    </td>
                  )}
                  <td className="text-right font-bold font-mono tabular-nums whitespace-nowrap">
                    {Number(row._MONEY).toLocaleString()}원
                  </td>
                  <td className="text-center">
                    <span className={`badge ${status.cls}`}>{status.label}</span>
                    {row._RETURNMSG && (
                      <div className="text-xs text-base-content/40 mt-1 max-w-[8rem] mx-auto truncate" title={row._RETURNMSG}>{row._RETURNMSG}</div>
                    )}
                  </td>
                  <td className="text-center">
                    {viewMode === 'active' && row._STATE === "0" ? (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleAction("APPROVE", row._UNIQUEID)}
                          disabled={isPending}
                          className="btn btn-primary btn-sm"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleAction("CANCEL", row._UNIQUEID)}
                          disabled={isPending}
                          className="btn btn-ghost btn-sm"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-base-content/30">—</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
