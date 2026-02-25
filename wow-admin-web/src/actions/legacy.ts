"use server";

import { revalidatePath } from "next/cache";
import { fetchLegacy, getCachedUserName, getCachedUserClass } from "@/lib/legacy-api";
import { BANK_MAP } from "@/lib/bank-codes";
import {
  validateDate,
  validateMoney,
  validateName,
  validateBankCode,
  validateAccount,
  validatePhone,
  validateId,
  validationError,
} from "@/lib/validators";

// 로그인 시 캐싱된 사용자 이름 조회
export async function getUserName() {
  return await getCachedUserName();
}

// 로그인 시 캐싱된 사용자 등급 조회
export async function getUserClass() {
  return await getCachedUserClass();
}

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
  if (!validateDate(sdate) || !validateDate(edate)) {
    return validationError("날짜 형식이 올바르지 않습니다 (YYYY-MM-DD HH:mm:ss)");
  }
  return await fetchLegacy("/21000", { sdate, edate });
}

// [30000] 출금통지 내역 조회
export async function getWithdrawalNotifications(sdate: string, edate: string) {
  if (!validateDate(sdate) || !validateDate(edate)) {
    return validationError("날짜 형식이 올바르지 않습니다 (YYYY-MM-DD HH:mm:ss)");
  }
  return await fetchLegacy("/30000", { sdate, edate });
}

// [40000] 입금통지 내역 조회
export async function getDepositNotifications(sdate: string, edate: string) {
  if (!validateDate(sdate) || !validateDate(edate)) {
    return validationError("날짜 형식이 올바르지 않습니다 (YYYY-MM-DD HH:mm:ss)");
  }
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
  if (!validateMoney(params.money)) return validationError("유효하지 않은 금액입니다");
  if (!validateName(params.bankuser)) return validationError("예금주를 확인해 주세요");
  if (!validateBankCode(params.bankcode, BANK_MAP))
    return validationError("유효하지 않은 은행코드입니다");
  if (!validateAccount(params.banknumber)) return validationError("계좌번호를 확인해 주세요");
  if (!validatePhone(params.phone)) return validationError("전화번호를 확인해 주세요");

  const result = await fetchLegacy("/50000", params);
  if (result.code === "1") revalidatePath("/withdrawals");
  return result;
}

// [51000] 출금신청 리스트 조회
export async function getWithdrawalList(sdate: string, edate: string) {
  if (!validateDate(sdate) || !validateDate(edate)) {
    return validationError("날짜 형식이 올바르지 않습니다 (YYYY-MM-DD HH:mm:ss)");
  }
  return await fetchLegacy("/51000", { sdate, edate });
}

// [51100] 출금신청 검색 (이름/번호)
export async function searchWithdrawals(bankuser: string, count: string = "30") {
  if (!validateName(bankuser)) return validationError("검색어를 확인해 주세요");
  const n = Number(count);
  if (!Number.isInteger(n) || n < 1 || n > 100)
    return validationError("조회 건수가 올바르지 않습니다");
  return await fetchLegacy("/51100", { bankuser, count });
}

// [51400] 출금 승인 (가맹점 확인)
export async function approveWithdrawal(uniqueid: string) {
  if (!validateId(uniqueid)) return validationError("유효하지 않은 ID입니다");
  const result = await fetchLegacy("/51400", { uniqueid });
  if (result.code === "1") revalidatePath("/withdrawals");
  return result;
}

// [51600] 출금 취소 (데이터 취소)
export async function cancelWithdrawal(uniqueid: string) {
  if (!validateId(uniqueid)) return validationError("유효하지 않은 ID입니다");
  const result = await fetchLegacy("/51600", { uniqueid });
  if (result.code === "1") revalidatePath("/withdrawals");
  return result;
}
