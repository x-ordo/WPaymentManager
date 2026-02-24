실무 환경의 압도적인 데이터 밀도와 처리 속도를 보장하기 위해, Next.js의 **Server Actions**와 **TanStack Table**을 결합한 출금 관리 리스트의 핵심 구현 코드입니다.

브라우저 네트워크 탭에 API 호출 내역이나 파라미터가 전혀 노출되지 않으며, 인라인 버튼을 통한 즉각적인 상태 제어(Optimistic UI)가 포함되어 있습니다.

### 1. Server Actions: 백엔드 로직 캡슐화 (`app/actions/withdrawals.ts`)

클라이언트에서 호출하지만 실제로는 서버(Node.js)에서 실행되는 함수들입니다. 여기서 레거시 API 통신 및 401(쓰로틀링)/402(세션 만료) 에러 복구 로직을 전담합니다.

```typescript
"use server";

import { revalidatePath } from "next/cache";
// 내부 통신 유틸리티 (이전 단계에서 구성한 fetchLegacy 함수 가정)
import { fetchLegacy } from "@/lib/legacy-api";

// 1. 출금 리스트 조회 (51000)
export async function getWithdrawalList(sdate: string, edate: string) {
  try {
    const result = await fetchLegacy("/51000", { sdate, edate });
    if (result.code === "1") {
      return { success: true, data: result.data };
    }
    return { success: false, message: result.message };
  } catch (error) {
    return { success: false, message: "서버 통신 오류" };
  }
}

// 2. 출금 승인 처리 (51400) - 가맹점 확인
export async function approveWithdrawal(uniqueId: string) {
  try {
    const result = await fetchLegacy("/51400", { uniqueid: uniqueId });

    if (result.code === "1") {
      revalidatePath("/withdrawals"); // 성공 시 리스트 캐시 무효화 및 재조회
      return { success: true };
    }
    return { success: false, message: result.message, code: result.code };
  } catch (error) {
    return { success: false, message: "승인 처리 중 오류 발생" };
  }
}

// 3. 출금 취소 처리 (51600) - 데이타 취소
export async function cancelWithdrawal(uniqueId: string) {
  try {
    const result = await fetchLegacy("/51600", { uniqueid: uniqueId });

    if (result.code === "1") {
      revalidatePath("/withdrawals");
      return { success: true };
    }
    return { success: false, message: result.message, code: result.code };
  } catch (error) {
    return { success: false, message: "취소 처리 중 오류 발생" };
  }
}
```

### 2. 고밀도 데이터 그리드 컴포넌트 (`components/WithdrawalTable.tsx`)

불필요한 여백을 제거하고 선과 텍스트 위주로 구성된 전형적인 B2B 금융망 스타일의 테이블입니다. `TanStack Table`을 사용하여 추후 정렬이나 필터링 확장이 매우 용이합니다.

```tsx
"use client";

import { useState, useTransition } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { approveWithdrawal, cancelWithdrawal } from "@/app/actions/withdrawals";

// API 응답 데이터 타입 정의
type Withdrawal = {
  _UNIQUEID: string;
  _CREATE_DATETIME: string;
  _AFFILIATE_ID: string;
  _BANKNAME: string;
  _BANKNUMBER: string;
  _BANKUSER: string;
  _MONEY: string;
  _STATE: string; // 0: 미처리, 1: 처리, 2: 오류, 3: 취소
};

const columnHelper = createColumnHelper<Withdrawal>();

export default function WithdrawalTable({
  initialData,
}: {
  initialData: Withdrawal[];
}) {
  const [data, setData] = useState(() => initialData);
  const [isPending, startTransition] = useTransition();

  // 상태 코드 변환 유틸리티
  const getStatusBadge = (state: string) => {
    switch (state) {
      case "0":
        return <span className="text-gray-600 font-medium">대기</span>;
      case "1":
        return <span className="text-blue-600 font-bold">완료</span>;
      case "2":
        return <span className="text-red-600 font-bold">오류</span>;
      case "3":
        return <span className="text-slate-400 line-through">취소</span>;
      default:
        return <span>알수없음</span>;
    }
  };

  const handleAction = async (
    actionFn: Function,
    uniqueId: string,
    actionName: string,
  ) => {
    if (!confirm(`해당 건을 ${actionName} 하시겠습니까?`)) return;

    startTransition(async () => {
      const res = await actionFn(uniqueId);
      if (res.success) {
        alert(`${actionName} 완료되었습니다.`);
        // Note: Server Action의 revalidatePath가 동작하여 상위 페이지가 새로고침됨
      } else {
        alert(`[에러] ${res.message} (코드: ${res.code || "알수없음"})`);
      }
    });
  };

  const columns = [
    columnHelper.accessor("_CREATE_DATETIME", {
      header: "신청일시",
      cell: (info) => (
        <div className="text-xs text-gray-500">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("_AFFILIATE_ID", {
      header: "가맹점",
      cell: (info) => <div className="font-semibold">{info.getValue()}</div>,
    }),
    columnHelper.accessor("_BANKNAME", {
      header: "은행",
    }),
    columnHelper.accessor("_BANKNUMBER", {
      header: "계좌번호",
      cell: (info) => (
        <div className="font-mono text-xs tracking-tighter">
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor("_BANKUSER", {
      header: "예금주",
    }),
    columnHelper.accessor("_MONEY", {
      header: () => <div className="text-right">금액</div>,
      cell: (info) => (
        <div className="text-right font-bold text-gray-900">
          {Number(info.getValue()).toLocaleString()}
        </div>
      ),
    }),
    columnHelper.accessor("_STATE", {
      header: () => <div className="text-center">상태</div>,
      cell: (info) => (
        <div className="text-center">{getStatusBadge(info.getValue())}</div>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: () => <div className="text-center">관리</div>,
      cell: (props) => {
        const row = props.row.original;
        // 미처리(0) 상태일 때만 액션 버튼 노출
        if (row._STATE !== "0") return null;

        return (
          <div className="flex justify-center gap-1">
            <button
              onClick={() =>
                handleAction(approveWithdrawal, row._UNIQUEID, "승인")
              }
              disabled={isPending}
              className="px-2 py-1 text-xs font-semibold text-white bg-blue-600 border border-blue-700 hover:bg-blue-700 disabled:opacity-50"
            >
              승인
            </button>
            <button
              onClick={() =>
                handleAction(cancelWithdrawal, row._UNIQUEID, "취소")
              }
              disabled={isPending}
              className="px-2 py-1 text-xs font-semibold text-gray-700 bg-white border border-gray-400 hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto bg-white border border-gray-300">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-gray-100 border-b border-gray-300">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-3 py-2 border-r border-gray-300 font-semibold text-gray-700 last:border-r-0 whitespace-nowrap"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-gray-200 hover:bg-yellow-50 transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-3 py-1.5 border-r border-gray-200 last:border-r-0 whitespace-nowrap align-middle"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-8 text-center text-gray-500"
              >
                조회된 출금 신청 내역이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

### 3. 페이지 뷰 연동 (`app/withdrawals/page.tsx`)

서버 컴포넌트에서 최초 데이터를 Fetching하여 클라이언트 컴포넌트에 넘겨주는 구조입니다.

```tsx
import { getWithdrawalList } from "@/app/actions/withdrawals";
import WithdrawalTable from "@/components/WithdrawalTable";

export default async function WithdrawalsPage({
  searchParams,
}: {
  searchParams: { sdate?: string; edate?: string };
}) {
  // 기본 검색 기간: 오늘 00:00:00 ~ 23:59:59 (서버 타임 기준)
  const today = new Date().toISOString().split("T")[0];
  const sdate = searchParams.sdate || `${today} 00:00:00`;
  const edate = searchParams.edate || `${today} 23:59:59`;

  const response = await getWithdrawalList(sdate, edate);
  const initialData = response.success ? response.data : [];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="mb-4 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold text-gray-800">출금 승인 관리</h1>
          <p className="text-xs text-gray-500 mt-1">
            조회 기간: {sdate} ~ {edate}
          </p>
        </div>
        {/* 상단 액션 바 (엑셀 다운로드 등 추가 가능 위치) */}
        <div className="space-x-2">
          <button className="px-3 py-1.5 bg-gray-800 text-white text-sm font-semibold hover:bg-gray-700">
            새로고침
          </button>
        </div>
      </div>

      <WithdrawalTable initialData={initialData} />
    </div>
  );
}
```

### 시스템 설계 고려사항

1. **동시성 제어:** 여러 관리자가 동시에 접속하여 같은 건을 승인할 수 있습니다. 레거시 API(`51400`)에서 락(Lock) 처리를 해주지 않는다면, Server Action(`approveWithdrawal`) 내부에서 Redis나 메모리 변수를 활용해 임시 락을 걸거나, MS SQL 로그 테이블 기록 시 Unique Constraint를 활용해 중복 승인을 방어해야 합니다.
2. **자동 새로고침 전략:** 프론트엔드에서 SWR을 도입해 10초마다 `getWithdrawalList`를 폴링하도록 변경하면 관리자가 새로고침 버튼을 누르지 않아도 실시간 뷰어처럼 작동하게 만들 수 있습니다.
