"use client";

import { useTransition, useState, useMemo, useEffect } from "react";
import { approveWithdrawal, cancelWithdrawal } from "@/actions/legacy";
import { getBankName } from "@/lib/bank-codes";
import { getLegacyErrorMessage } from "@/lib/error-codes";
import { Highlight } from "@/components/Highlight";
import { toast } from "@/lib/toast";

export default function WithdrawalTable({ initialData, viewMode }: { initialData: any[], viewMode: string }) {
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const filteredData = useMemo(() => {
    if (!debouncedSearch) return initialData;
    const lower = debouncedSearch.toLowerCase();
    return initialData.filter((row) => 
      row._AFFILIATE_ID?.toLowerCase().includes(lower) ||
      (row._BANKUSER || row._NAME)?.toLowerCase().includes(lower) ||
      row._BANKNUMBER?.includes(lower) ||
      row._UNIQUEID?.includes(lower) ||
      row._ORDERNUMBER?.toLowerCase().includes(lower)
    );
  }, [initialData, debouncedSearch]);

  const handleAction = (type: "APPROVE" | "CANCEL", id: string) => {
    const label = type === "APPROVE" ? "승인" : "취소";
    if (!confirm(`해당 건을 ${label} 하시겠습니까?`)) return;

    startTransition(async () => {
      try {
        const res = await (type === "APPROVE" ? approveWithdrawal(id) : cancelWithdrawal(id));
        if (res.success) {
          toast.success(`${label} 처리가 완료되었습니다.`);
        } else {
          toast.error(res.error || `${label} 중 오류가 발생했습니다.`);
        }
      } catch (error) {
        toast.error(`${label} 중 통신 오류가 발생했습니다.`);
      }
    });
  };

  const getStatusBadge = (row: any) => {
    if (viewMode === "active") {
      if (row._STATE === "0") {
        if (row._SHOP_STATE !== "0") return <div className="badge badge-info badge-soft font-bold">가맹점승인</div>;
        return <div className="badge badge-ghost badge-outline opacity-50 font-bold">대기중</div>;
      }
      if (row._STATE === "1") return <div className="badge badge-success badge-soft font-bold">처리완료</div>;
      if (row._STATE === "2") return <div className="badge badge-error badge-soft font-bold">오류</div>;
      if (row._STATE === "3") return <div className="badge badge-warning badge-soft font-bold">취소</div>;
      return <div className="badge badge-ghost font-bold">상태({row._STATE})</div>;
    }
    return row._USE === "True"
      ? <div className="badge badge-success badge-soft font-bold text-sm">통보완료</div>
      : <div className="badge badge-error badge-soft font-bold text-sm">실패</div>;
  };

  return (
    <div className="space-y-3">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-base-100 p-4 rounded-xl border border-base-300 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-primary rounded-full" />
          <h3 className="text-sm font-medium text-base-content/50 uppercase tracking-widest">결과 내 필터링</h3>
          <div className="relative">
            <input 
              type="text"
              placeholder="가맹점, 예금주, 계좌번호로 실시간 검색..."
              className="input input-bordered input-sm w-72 lg:w-96 font-bold bg-base-200/50 focus:bg-base-100 transition-all border-base-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <kbd className="kbd kbd-xs absolute right-2 top-1/2 -translate-y-1/2 opacity-30">SEARCH</kbd>
          </div>
        </div>
        <div className="text-sm font-medium text-base-content/50">
          FILTERED: <span className="text-primary font-black">{filteredData.length}</span> / TOTAL: {initialData.length} 건
        </div>
      </div>

      {/* Main Table */}
      <div className="card card-border bg-base-100 shadow-xl border-base-300 overflow-hidden h-[calc(100vh-340px)]">
        <div className="overflow-auto h-full custom-scrollbar">
          <table className="table table-pin-rows table-zebra table-md">
            <thead className="text-base-content/60 border-b border-base-300">
              <tr className="bg-base-200/95 backdrop-blur-sm">
                <th className="font-bold py-5 pl-6 bg-base-200/95">일시 / ID</th>
                <th className="font-bold py-4">가맹점 / 주문번호</th>
                <th className="font-bold py-4">예금주(수취인)</th>
                <th className="font-bold py-4">은행 / 계좌정보</th>
                <th className="font-bold py-4 text-right pr-10">신청 금액</th>
                <th className="font-bold py-4 text-center">처리 상태</th>
                <th className="font-bold py-4 text-center pr-6">관리 액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 0112.728 0M7.071 7.071a9 9 0 0012.728 0M5.121 5.121a14 14 0 0013.758 0" /></svg>
                      <p className="text-xl font-bold">조회된 데이터가 없습니다.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row._UNIQUEID} className="group hover:bg-primary/[0.02] transition-colors">
                    <td className="pl-6 py-3">
                      <div className="text-sm font-bold text-base-content/70 tabular-nums">{row._CREATE_DATETIME}</div>
                      <div className="text-sm text-base-content/40 mt-0.5">#{row._UNIQUEID}</div>
                    </td>
                    <td>
                      <div className="font-bold text-base-content/80">
                        <Highlight text={row._AFFILIATE_ID} query={debouncedSearch} />
                      </div>
                      <div className="text-sm text-base-content/40 mt-0.5">
                        <Highlight text={row._ORDERNUMBER || "—"} query={debouncedSearch} />
                      </div>
                    </td>
                    <td className="font-bold text-base">
                      <Highlight text={viewMode === 'active' ? row._BANKUSER : row._NAME} query={debouncedSearch} />
                    </td>
                    <td>
                      <div className="font-bold text-sm text-base-content/70">{row._BANKNAME || getBankName(row._BANKCODE)}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-primary tabular-nums">
                          <Highlight text={row._BANKNUMBER} query={debouncedSearch} />
                        </span>
                        <button 
                          onClick={() => { navigator.clipboard.writeText(row._BANKNUMBER); toast.success("복사되었습니다."); }}
                          className="btn btn-ghost btn-xs btn-square opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                        </button>
                      </div>
                    </td>
                    <td className="text-right pr-10">
                      <div className="font-bold text-lg tracking-tighter tabular-nums text-base-content">
                        {Number(row._MONEY).toLocaleString()}<span className="text-sm ml-1 text-base-content/40">원</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        {getStatusBadge(row)}
                        {row._ADMIN_STATE !== "0" && row._ADMIN_STATE !== undefined && (
                          <span className="text-sm font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm uppercase tracking-tight">Admin</span>
                        )}
                      </div>
                    </td>
                    <td className="text-center pr-6">
                      {viewMode === 'active' && row._STATE === "0" ? (
                        <div className="join shadow-sm border border-base-300 overflow-hidden">
                          <button
                            onClick={() => handleAction("APPROVE", row._UNIQUEID)}
                            disabled={isPending}
                            className="btn btn-primary btn-sm join-item font-bold px-4 hover:brightness-110"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleAction("CANCEL", row._UNIQUEID)}
                            disabled={isPending}
                            className="btn btn-neutral btn-sm join-item font-bold px-4"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm font-light text-base-content/20 uppercase tracking-widest italic">— Done —</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
