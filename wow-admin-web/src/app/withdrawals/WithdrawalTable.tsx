"use client";

import { useTransition } from "react";
import { approveWithdrawal, cancelWithdrawal } from "@/actions/legacy";

export default function WithdrawalTable({ initialData, viewMode }: { initialData: any[], viewMode: string }) {
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

  const getStatusStyle = (row: any) => {
    if (viewMode === "active") {
      if (row._STATE === "0") return "border border-border-strong text-ink-secondary bg-surface-muted";
      if (row._STATE === "1") return "bg-status-success-light text-status-success-strong";
      return "text-status-danger-strong bg-status-danger-light";
    }
    return row._USE === "True"
      ? "bg-status-success-light text-status-success-strong"
      : "text-status-danger-strong bg-status-danger-light";
  };

  const getStatusLabel = (row: any) => {
    if (viewMode === "active") {
      if (row._STATE === "0") return "대기중";
      if (row._STATE === "1") return "처리완료";
      return "취소됨";
    }
    return row._USE === "True" ? "통보완료" : "실패";
  };

  return (
    <div className="bg-surface-card border border-border-default shadow-xs rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-muted text-xs text-ink-tertiary font-medium uppercase tracking-wide border-b border-border-default">
            <th className="text-left px-4 py-3 whitespace-nowrap">일시</th>
            <th className="text-left px-4 py-3 whitespace-nowrap">가맹점</th>
            <th className="text-left px-4 py-3 whitespace-nowrap">{viewMode === 'active' ? '예금주' : '수취인'}</th>
            <th className="text-left px-4 py-3 whitespace-nowrap">계좌정보</th>
            <th className="text-left px-4 py-3 whitespace-nowrap">연락처</th>
            <th className="text-right px-4 py-3 whitespace-nowrap">신청금액</th>
            <th className="text-center px-4 py-3 whitespace-nowrap">상태</th>
            <th className="text-center px-4 py-3 whitespace-nowrap">액션</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {initialData.length === 0 ? (
            <tr><td colSpan={8} className="py-20 text-ink-muted text-center">데이터가 존재하지 않습니다.</td></tr>
          ) : (
            initialData.map((row) => (
              <tr key={row._UNIQUEID} className={`hover:bg-surface-hover transition-colors duration-fast ${row._RETURNCODE !== "0" && row._RETURNCODE ? 'bg-status-danger-light/30' : ''}`}>
                <td className="px-4 py-3 align-top">
                  <div className="font-mono text-xs text-ink-tertiary whitespace-nowrap">{row._CREATE_DATETIME}</div>
                  <div className="font-mono text-2xs text-ink-muted mt-0.5">ID {row._UNIQUEID}</div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="font-semibold text-ink-primary">{row._AFFILIATE_ID}</div>
                  <div className="font-mono text-2xs text-ink-muted mt-0.5">{row._ORDERNUMBER || "—"}</div>
                </td>
                <td className="px-4 py-3 font-semibold text-ink-primary whitespace-nowrap">
                  {viewMode === 'active' ? row._BANKUSER : row._NAME}
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="font-semibold text-ink-primary whitespace-nowrap">{row._BANKNAME}</div>
                  <div className="font-mono text-xs text-ink-tertiary mt-0.5">{row._BANKNUMBER}</div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink-secondary whitespace-nowrap">
                  {row._TEL || row._PHONE || <span className="text-ink-disabled">미등록</span>}
                </td>
                <td className="px-4 py-3 text-right font-bold font-mono tabular-nums text-ink-primary whitespace-nowrap">
                  {Number(row._MONEY).toLocaleString()}원
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block font-semibold text-xs px-2.5 py-1 rounded-md ${getStatusStyle(row)}`}>
                    {getStatusLabel(row)}
                  </span>
                  {row._RETURNMSG && (
                    <div className="text-2xs text-ink-muted mt-1 max-w-[6rem] mx-auto truncate" title={row._RETURNMSG}>{row._RETURNMSG}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {viewMode === 'active' && row._STATE === "0" ? (
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleAction("APPROVE", row._UNIQUEID)}
                        disabled={isPending}
                        className="px-3.5 py-1.5 bg-btn-primary-bg text-btn-primary-text text-xs font-semibold hover:bg-btn-primary-hover rounded-md transition-colors duration-fast disabled:opacity-30"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => handleAction("CANCEL", row._UNIQUEID)}
                        disabled={isPending}
                        className="px-3.5 py-1.5 border border-btn-ghost-border text-btn-ghost-text text-xs font-semibold hover:bg-btn-ghost-hover rounded-md transition-colors duration-fast disabled:opacity-30"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <span className="text-2xs font-medium text-ink-disabled">—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
