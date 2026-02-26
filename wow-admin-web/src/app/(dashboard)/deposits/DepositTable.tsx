"use client";

import { useState, useMemo, useEffect } from "react";
import { Highlight } from "@/components/Highlight";
import { toast } from "@/lib/toast";

interface DepositTableProps {
  initialData: any[];
  tab: string;
}

export function DepositTable({ initialData, tab }: DepositTableProps) {
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
      (row._ORDERNM || row._IN_BANK_USERNAME)?.toLowerCase().includes(lower) ||
      row._UNIQUEID?.includes(lower) ||
      row._ORDER_ID?.toLowerCase().includes(lower) ||
      row._TR_ID?.toLowerCase().includes(lower)
    );
  }, [initialData, debouncedSearch]);

  return (
    <div className="space-y-3">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-base-100 p-4 rounded-xl border border-base-300 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-primary rounded-full" />
          <h3 className="text-sm font-medium text-base-content/50 uppercase tracking-widest">실시간 입금 필터</h3>
          <div className="relative">
            <input
              type="text"
              placeholder="가맹점, 입금주, 주문/트랜잭션 ID 검색..."
              className="input input-bordered input-sm w-72 lg:w-96 font-bold bg-base-200/50 focus:bg-base-100 transition-all border-base-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <kbd className="kbd kbd-xs absolute right-2 top-1/2 -translate-y-1/2 opacity-30">FIND</kbd>
          </div>
        </div>
        <div className="text-sm font-medium text-base-content/50">
          RESULTS: <span className="text-primary font-black">{filteredData.length}</span> / {initialData.length} 건
        </div>
      </div>

      {/* Main Table */}
      <div className="card card-border bg-base-100 shadow-xl border-base-300 overflow-hidden h-[calc(100vh-340px)]">
        <div className="overflow-auto h-full custom-scrollbar">
          <table className="table table-pin-rows table-zebra table-md">
            <thead className="text-base-content/60 border-b border-base-300">
              <tr className="bg-base-200/95 backdrop-blur-sm">
                <th className="font-bold py-4 pl-6 bg-base-200/95">입금일시</th>
                <th className="font-bold py-4">가맹점 정보</th>
                <th className="font-bold py-4">{tab === "application" ? "Unique ID" : "주문 / 트랜잭션 식별자"}</th>
                <th className="font-bold py-4 text-right pr-10">입금 금액</th>
                <th className="font-bold py-4">입금자(예금주)</th>
                <th className="font-bold py-4 text-center">처리 상태</th>
                {tab === "notification" && <th className="font-bold py-4 pr-6">시스템 응답</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={tab === "notification" ? 7 : 6} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      <p className="text-xl font-bold">일치하는 입금 내역이 없습니다.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row: any) => (
                  <tr key={row._UNIQUEID} className="group hover:bg-primary/[0.02] transition-colors">
                    <td className="pl-6 py-3">
                      <div className="text-sm font-bold text-base-content/70 tabular-nums">{row._CREATE_DATETIME || row._DATETIME}</div>
                    </td>
                    <td>
                      <div className="font-bold text-base-content/80 uppercase">
                        <Highlight text={row._AFFILIATE_ID} query={debouncedSearch} />
                      </div>
                      {row._IN_BANK_CODE && (
                        <div className="mt-1">
                          <span className="text-sm font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm uppercase tracking-tight">
                            Bank {row._IN_BANK_CODE}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="text-sm">
                      {tab === "application" ? (
                        <span className="text-base-content/50 font-bold tabular-nums">
                          <Highlight text={row._UNIQUEID} query={debouncedSearch} />
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="font-bold text-base-content/70 truncate max-w-56 tabular-nums">
                            <Highlight text={row._ORDER_ID} query={debouncedSearch} />
                          </div>
                          <div className="text-sm text-base-content/40 truncate max-w-56 tabular-nums">
                            TRX: <Highlight text={row._TR_ID} query={debouncedSearch} />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="text-right pr-10">
                      <div className="font-bold text-lg tracking-tighter tabular-nums text-base-content">
                        {Number(row._ORDERAMT || row._AMOUNT || 0).toLocaleString()}<span className="text-sm ml-1 text-base-content/40">원</span>
                      </div>
                    </td>
                    <td className="font-bold text-base">
                      <Highlight text={row._ORDERNM || row._IN_BANK_USERNAME} query={debouncedSearch} />
                    </td>
                    <td className="text-center">
                      <span className={`badge badge-md font-bold tracking-tight ${
                        tab === "application"
                          ? "badge-info badge-soft border-info/20"
                          : row._STATE !== "0"
                            ? "badge-success badge-soft border-success/20"
                            : "badge-ghost opacity-40"
                      }`}>
                        {tab === "application" ? "신청접수" : row._STATE !== "0" ? "입금확인" : "확인중"}
                      </span>
                    </td>
                    {tab === "notification" && (
                      <td className="pr-6">
                        <div className="flex flex-col items-start gap-0.5">
                          <div className="text-sm font-medium text-base-content/50 tabular-nums">[{row._RESPONSE_CODE}]</div>
                          {row._RESPONSE_MESSAGE && (
                            <div className="text-sm font-bold text-base-content/60 leading-tight">
                              {row._RESPONSE_MESSAGE}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
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
