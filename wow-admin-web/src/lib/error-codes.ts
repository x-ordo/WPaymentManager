/**
 * Legacy API Error Code Mappings
 * Based on @docs/02_Specification/API_SPEC_NEW.md
 */

export const COMMON_ERROR_CODES: Record<string, string> = {
  "400": "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  "401": "요청이 너무 잦습니다. 5초 후 이용해 주세요.",
  "402": "세션 정보가 없습니다. 다시 로그인해 주세요.",
  "404": "존재하지 않는 서비스 경로입니다.",
  "500": "데이터베이스 통신 장애가 발생했습니다.",
  "TIMEOUT": "서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.",
};

export const LOGIN_ERROR_CODES: Record<string, string> = {
  "2": "사용 기간이 만료된 계정입니다.",
  "3": "아이디 또는 비밀번호가 일치하지 않습니다.",
  "5": "현재 사용 불가 처리된 상태입니다.",
  "6": "현재 시스템 점검 시간입니다.",
};

export const WITHDRAW_APPLY_ERROR_CODES: Record<string, string> = {
  "2": "회원 정보를 찾을 수 없습니다.",
  "3": "1회 출금 최대 한도를 초과하였습니다.",
  "4": "예금주 성함을 입력해 주세요.",
  "5": "은행코드 선택 오류입니다.",
  "6": "현재 시스템 점검 시간입니다.",
  "7": "계좌번호를 입력해 주세요.",
  "8": "1회 출금 최소 한도에 미달하였습니다.",
  "9": "동일 금액 출금 신청은 30초 후 가능합니다.",
};

export const HISTORY_ERROR_CODES: Record<string, string> = {
  "2": "회원 정보를 찾을 수 없습니다.",
  "3": "조회된 내역이 없습니다.",
  "6": "현재 시스템 점검 시간입니다.",
};

/**
 * API 경로와 응답 코드를 받아 적절한 사용자 메시지를 반환합니다.
 */
export function getLegacyErrorMessage(path: string, code: string): string {
  // 1. 공통 코드 먼저 확인
  if (COMMON_ERROR_CODES[code]) return COMMON_ERROR_CODES[code];

  // 2. 경로별 특화 코드 확인
  if (path.includes("10100")) return LOGIN_ERROR_CODES[code] || `로그인 실패 (Code: ${code})`;
  if (path.includes("50000")) return WITHDRAW_APPLY_ERROR_CODES[code] || `신청 실패 (Code: ${code})`;
  if (["21000", "30000", "40000", "51000", "51100"].some(p => path.includes(p))) {
    return HISTORY_ERROR_CODES[code] || `조회 실패 (Code: ${code})`;
  }
  if (path.includes("51400") || path.includes("51600")) {
    if (code === "2") return "회원 정보를 찾을 수 없습니다.";
    if (code === "6") return "시스템 점검 중입니다.";
  }

  return `처리 중 오류가 발생했습니다. (Code: ${code})`;
}
