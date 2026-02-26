"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { getKSTDate } from "@/lib/utils";

interface SearchFilterProps {
  tab: string;
  sdate: string;
  edate: string;
}

export function SearchFilter({ tab, sdate, edate }: SearchFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [localSdate, setSdate] = useState(sdate);
  const [localEdate, setEdate] = useState(edate);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("sdate", localSdate);
    params.set("edate", localEdate);
    params.set("tab", tab);

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const quickFilters = [
    { label: "오늘", days: 0 },
    { label: "어제", days: 1 },
    { label: "7일", days: 7 },
    { label: "이번 달", days: 30 },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-base-100 px-4 py-3 rounded-xl border border-base-300">
      <form onSubmit={handleSearch} className="flex items-center gap-3 flex-1">
        <div className="text-sm font-medium text-base-content/50 uppercase tracking-widest shrink-0">조회기간</div>
        <div className="join">
          <input
            type="text"
            className="input input-sm join-item w-44 font-bold text-center tabular-nums"
            value={localSdate}
            onChange={(e) => setSdate(e.target.value)}
            placeholder="YYYY-MM-DD HH:mm:ss"
          />
          <span className="join-item flex items-center px-2 bg-base-200 text-base-content/40 text-sm font-normal">~</span>
          <input
            type="text"
            className="input input-sm join-item w-44 font-bold text-center tabular-nums"
            value={localEdate}
            onChange={(e) => setEdate(e.target.value)}
            placeholder="YYYY-MM-DD HH:mm:ss"
          />
        </div>

        <button type="submit" disabled={isPending} className="btn btn-primary btn-sm px-6">
          {isPending ? <span className="loading loading-spinner loading-xs" /> : "조회"}
        </button>
      </form>

      {/* Quick Buttons */}
      <div className="flex gap-1.5 flex-wrap">
        {quickFilters.map((btn) => {
          const start = getKSTDate(btn.days, "start");
          const end = getKSTDate(0, "end");
          const isActive = sdate === start && edate === end;

          return (
            <Link
              key={btn.label}
              href={`${pathname}?tab=${tab}&sdate=${encodeURIComponent(start)}&edate=${encodeURIComponent(end)}`}
              className={`btn btn-xs ${isActive ? "btn-primary" : "btn-soft"}`}
            >
              {btn.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
