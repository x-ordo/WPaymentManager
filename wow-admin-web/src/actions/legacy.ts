"use server";

import { revalidatePath } from "next/cache";
import { fetchLegacy } from "@/lib/legacy-api";

// [90000] 보유금액, 사용가능일, 수수료 정보
export async function getBalanceInfo() {
  return await fetchLegacy("/90000");
}

// [90100] 출금 한도 정보
export async function getWithdrawalLimits() {
  return await fetchLegacy("/90100");
}

// [21000] 입금신청내역 조회
export async function getDepositApplications(sdate: string, edate: string) {
  return await fetchLegacy("/21000", { sdate, edate });
}

// [30000] 출금통지 내역 조회
export async function getWithdrawalNotifications(sdate: string, edate: string) {
  return await fetchLegacy("/30000", { sdate, edate });
}

// [40000] 입금통지 내역 조회
export async function getDepositNotifications(sdate: string, edate: string) {
  return await fetchLegacy("/40000", { sdate, edate });
}

// [50000] 출금신청 접수 (신규 등록)
export async function applyWithdrawal(params: {
  money: string;
  bankuser: string;
  bankcode: string;
  bankname: string;
  banknumber: string;
  phone: string;
}) {
  const result = await fetchLegacy("/50000", params);
  if (result.code === "1") revalidatePath("/withdrawals");
  return result;
}

// [51000] 출금신청 리스트 조회
export async function getWithdrawalList(sdate: string, edate: string) {
  return await fetchLegacy("/51000", { sdate, edate });
}

// [51100] 출금신청 검색 (이름/번호)
export async function searchWithdrawals(bankuser: string, count: string = "30") {
  return await fetchLegacy("/51100", { bankuser, count });
}

// [51400] 출금 승인 (가맹점 확인)
export async function approveWithdrawal(uniqueid: string) {
  const result = await fetchLegacy("/51400", { uniqueid });
  if (result.code === "1") revalidatePath("/withdrawals");
  return result;
}

// [51600] 출금 취소 (데이터 취소)
export async function cancelWithdrawal(uniqueid: string) {
  const result = await fetchLegacy("/51600", { uniqueid });
  if (result.code === "1") revalidatePath("/withdrawals");
  return result;
}
