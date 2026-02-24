제시해주신 제약 조건에 맞춰, 오직 전달해주신 API 11개만을 1:1로 맵핑한 **Next.js Server Actions (`src/actions/legacy.ts`)** 코드입니다.

불필요한 데이터 가공이나 외부 로직 추가 없이, 파라미터를 받아 `fetchLegacy` 코어 엔진으로 전달하고, 상태 변경이 일어나는 액션(출금 신청/승인/취소) 후에는 Next.js의 `revalidatePath`를 호출하여 프론트엔드 화면이 즉시 새로고침되도록 설계했습니다.

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { fetchLegacy } from "@/lib/legacy-api";

// ==========================================
// 1. 대시보드 및 공통 정보 조회
// ==========================================

// 보유금액, 사용가능일 요청 (90000)
export async function getBalanceInfo() {
  return await fetchLegacy("/90000");
}

// 출금신청 최소/최대금액 요청 (90100)
export async function getWithdrawalLimits() {
  return await fetchLegacy("/90100");
}

// ==========================================
// 2. 입출금 내역 및 통지 조회
// ==========================================

// 입금신청내역 불러오기 (21000)
export async function getDepositApplications(sdate: string, edate: string) {
  return await fetchLegacy("/21000", { sdate, edate });
}

// 출금통지 불러오기 (30000)
export async function getWithdrawalNotifications(sdate: string, edate: string) {
  return await fetchLegacy("/30000", { sdate, edate });
}

// 입금통지 불러오기 (40000)
export async function getDepositNotifications(sdate: string, edate: string) {
  return await fetchLegacy("/40000", { sdate, edate });
}

// ==========================================
// 3. 출금 신청 및 관리 (List & Search)
// ==========================================

// 출금신청 리스트 불러오기 (51000)
export async function getWithdrawalList(sdate: string, edate: string) {
  return await fetchLegacy("/51000", { sdate, edate });
}

// 출금신청 리스트 이름or전화번호 검색 (51100)
export async function searchWithdrawalList(
  bankuser: string,
  count: string = "30",
) {
  return await fetchLegacy("/51100", { bankuser, count });
}

// ==========================================
// 4. 출금 액션 (Mutation) - 상태 변경 후 캐시 무효화
// ==========================================

// 출금신청 접수하기 (50000)
export async function applyWithdrawal(params: {
  money: string;
  bankuser: string;
  bankcode: string;
  bankname: string;
  banknumber: string;
  phone: string;
}) {
  const result = await fetchLegacy("/50000", params);

  if (result.code === "1") {
    revalidatePath("/withdrawals"); // 출금 리스트 페이지 캐시 갱신
  }
  return result;
}

// 가맹점 확인 - 출금 승인 (51400)
export async function approveWithdrawal(uniqueid: string) {
  const result = await fetchLegacy("/51400", { uniqueid });

  if (result.code === "1") {
    revalidatePath("/withdrawals");
  }
  return result;
}

// 데이타 취소 - 출금 승인 취소 (51600)
export async function cancelWithdrawal(uniqueid: string) {
  const result = await fetchLegacy("/51600", { uniqueid });

  if (result.code === "1") {
    revalidatePath("/withdrawals");
  }
  return result;
}
```

### 적용 포인트

1. **의존성 제로:** 전달해주신 명세 외의 어떤 기능(예: 자체 유저 권한 테이블 등)도 섞여있지 않습니다.
2. **은닉성 확보:** 브라우저(클라이언트 컴포넌트)에서 위 함수들을 호출하면, 브라우저 네트워크 탭에는 `payload`나 `API URL`이 전혀 노출되지 않고 오직 Next.js 내부 통신망(POST)으로만 처리됩니다.
3. **UI 동기화 (`revalidatePath`):** `50000`, `51400`, `51600` API가 성공(`code: '1'`)하면 프론트엔드의 캐시를 즉시 파기하여, 사용자가 새로고침을 누르지 않아도 상태가 업데이트된 리스트를 다시 불러오도록 통제했습니다.

백엔드 통신 및 맵핑 계층이 모두 완성되었습니다. 이제 이 함수들을 화면에 렌더링하기만 하면 됩니다.

가장 빈번하게 사용될 **출금신청 리스트(51000)와 승인(51400)/취소(51600) 버튼이 결합된 프론트엔드 메인 페이지(`app/withdrawals/page.tsx`)**의 UI 코드를 작성할까요?
