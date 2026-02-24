import "server-only";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const ACCOUNT_REGEX = /^\d[\d-]{3,18}\d$/;
const PHONE_REGEX = /^01[016789]\d{7,8}$/;
const NUMERIC_REGEX = /^\d+$/;
const NAME_REGEX = /^[가-힣a-zA-Z\s]+$/;

export function validateDate(value: string): boolean {
  if (!DATE_REGEX.test(value)) return false;
  const d = new Date(value.replace(" ", "T"));
  return !isNaN(d.getTime());
}

export function validateMoney(value: string, min = 1, max = 10_000_000): boolean {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max;
}

export function validateBankCode(code: string, bankMap: Record<string, string>): boolean {
  return code in bankMap;
}

export function validateAccount(value: string): boolean {
  return ACCOUNT_REGEX.test(value);
}

export function validatePhone(value: string): boolean {
  return PHONE_REGEX.test(value);
}

export function validateName(value: string): boolean {
  return value.length >= 2 && value.length <= 20 && NAME_REGEX.test(value);
}

export function validateId(value: string): boolean {
  return NUMERIC_REGEX.test(value);
}

/** 검증 실패 시 반환할 표준 에러 응답 */
export function validationError(message: string) {
  return { code: "VALIDATION_ERROR", message };
}
