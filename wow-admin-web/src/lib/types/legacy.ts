/**
 * 레거시 API 통신을 위한 공통 및 개별 타입 정의
 */

export interface LegacyBaseResponse {
  code: string;
  message: string;
}

// [10100] 로그인 응답
export interface LoginResponse extends LegacyBaseResponse {
  connectionid?: string;
  _IN_NAME?: string;
  _MONEY?: string;
  _CLASS?: string;
  _APROVALUE?: string;
  _COMMISION_PERIN?: string;
  _COMMISION_PEROUT?: string;
  _COMMISION_IN?: string;
  _COMMISION_OUT?: string;
}

// 내역 조회 공통 데이터 (Row)
export interface HistoryRow {
  _UNIQUEID: string;
  _CREATE_DATETIME: string;
  _AFFILIATE_ID: string;
  _MONEY?: string;
  _AMOUNT?: string;
  _ORDERNM?: string;
  _NAME?: string;
  _BANKCODE?: string;
  _BANKNAME?: string;
  _BANKNUMBER?: string;
  _STATE?: string;
  _RETURNCODE?: string;
  _RETURNMSG?: string;
  [key: string]: any;
}

// [21000, 30000, 40000, 51000] 목록형 응답
export interface LegacyListResponse extends LegacyBaseResponse {
  data?: HistoryRow[];
}

// 서버 액션 결과 표준 규격
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}
