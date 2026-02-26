"use server";

import { revalidatePath } from "next/cache";
import { fetchLegacy, getCachedUserName, getCachedUserClass } from "@/lib/legacy-api";
import { ActionResult, LegacyListResponse } from "@/lib/types/legacy";
import { getLegacyErrorMessage } from "@/lib/error-codes";

/**
 * [결합도 낮추기] API 결과를 UI가 바로 쓰기 좋은 ActionResult 포맷으로 변환합니다.
 */
async function handleActionResponse<T>(
  path: string, 
  apiCall: Promise<any>
): Promise<ActionResult<T>> {
  const result = await apiCall;
  
  if (result.code === "1") {
    return { success: true, data: result };
  }
  if (result.code === "3") {
    return { success: true, data: result, message: "조회된 정보가 없습니다." } as any;
  }

  // [에러 핸들링] 중앙 집중식 에러 메시지 매핑 활용
  return { 
    success: false, 
    code: result.code, 
    error: getLegacyErrorMessage(path, result.code) 
  };
}

/** 
 * [서버 액션] 보유금액 및 자산 정보 
 */
export async function getBalanceInfo(): Promise<ActionResult> {
  return handleActionResponse("/90000", fetchLegacy("/90000"));
}

/** 
 * [서버 액션] 출금 한도 정보 
 */
export async function getWithdrawalLimits(): Promise<ActionResult> {
  return handleActionResponse("/90100", fetchLegacy("/90100"));
}

/** 
 * [데이터 페칭] 목록 조회 공통 (출금 신청 리스트 등)
 */
export async function getWithdrawalList(sdate: string, edate: string) {
  // [안정성] 호출 전 간단한 형식 체크 로직은 상위 호출부에서 수행
  return await fetchLegacy<LegacyListResponse>("/51000", { sdate, edate });
}

/**
 * [레거시 연동] 출금 승인 처리 (가맹점 확인)
 */
export async function approveWithdrawal(uniqueid: string): Promise<ActionResult> {
  const res = await fetchLegacy("/51400", { uniqueid });
  if (res.code === "1") revalidatePath("/withdrawals");
  return { 
    success: res.code === "1", 
    code: res.code, 
    error: res.code !== "1" ? getLegacyErrorMessage("/51400", res.code) : undefined 
  };
}

/**
 * [레거시 연동] 출금 취소 처리
 */
export async function cancelWithdrawal(uniqueid: string): Promise<ActionResult> {
  const res = await fetchLegacy("/51600", { uniqueid });
  if (res.code === "1") revalidatePath("/withdrawals");
  return { 
    success: res.code === "1", 
    code: res.code, 
    error: res.code !== "1" ? getLegacyErrorMessage("/51600", res.code) : undefined 
  };
}

/**
 * [데이터 페칭] 입금 신청 내역 조회
 */
export async function getDepositApplications(sdate: string, edate: string) {
  return await fetchLegacy<LegacyListResponse>("/21000", { sdate, edate });
}

/**
 * [데이터 페칭] 입금 통지 내역 조회
 */
export async function getDepositNotifications(sdate: string, edate: string) {
  return await fetchLegacy<LegacyListResponse>("/40000", { sdate, edate });
}

/**
 * [데이터 페칭] 출금 통지 내역 조회
 */
export async function getWithdrawalNotifications(sdate: string, edate: string) {
  return await fetchLegacy<LegacyListResponse>("/30000", { sdate, edate });
}

/**
 * [레거시 연동] 출금 신청 접수 (50000)
 */
export async function applyWithdrawal(params: any): Promise<ActionResult> {
  const res = await fetchLegacy("/50000", params);
  if (res.code === "1") revalidatePath("/withdrawals");
  return {
    success: res.code === "1",
    code: res.code,
    error: res.code !== "1" ? getLegacyErrorMessage("/50000", res.code) : undefined
  };
}

/**
 * [데이터 페칭] 출금 신청 검색 (51100)
 */
export async function searchWithdrawals(bankuser: string, count: string = "30") {
  return await fetchLegacy<LegacyListResponse>("/51100", { bankuser, count });
}

// [응집도] 사용자 정보 조회용 (세션 캐시 활용)
export async function getUserName() { return await getCachedUserName(); }
export async function getUserClass() { return await getCachedUserClass(); }
