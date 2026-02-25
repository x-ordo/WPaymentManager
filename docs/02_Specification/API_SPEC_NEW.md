# Legacy API Specification (Comprehensive)

본 문서는 **Wow Payment Manager**의 모든 레거시 API 규격을 원문 그대로 반영하여 정리한 최종 문서입니다.

---

## 1. 공통 사항

### 1.1 기본 정보
- **Base URL**: `http://{BACKEND_IP}:{BACKEND_PORT}`
- **인증 방식**: 로그인 후 발급된 `connectionid`를 모든 요청에 필수 첨부

### 1.2 공통 결과값 (Error Codes)
| 코드 | 메시지 | 설명 |
| :--- | :--- | :--- |
| **400** | 예외발생 다음에 이용해 주세요 | 서버 오류 |
| **401** | 5초후 이용해 주세요 | 호출 빈도 제한 (5초 대기 필요) |
| **402** | Connect정보 없음 | 로그인 세션 없음 (재로그인 필요) |
| **404** | Not Found | API 경로 없음 |
| **500** | Database Error | DB 연동 오류 |

---

## 2. API 상세 규격

### 2.1 [10100] 로그인
- **Endpoint**: `/10100?id={id}&pass={pass}`
- **성공 응답 필드**:
  - `connectionid`: API 호출 필수 키
  - `_IN_NAME`: 입금자 이름
  - `_MONEY`: 보유 금액
  - `_CLASS`: 등급 (0:가맹점, 40:지사, 60:에이전시, 80:운영자, 100:마스터)
  - `_APROVALUE`: 사용 가능일
  - `_COMMISION_PERIN`: 입금 %수수료
  - `_COMMISION_PEROUT`: 출금 %수수료
  - `_COMMISION_IN`: 입금 수수료
  - `_COMMISION_OUT`: 출금 수수료
- **오류 응답**:
  - `2`: 사용 기간 만료
  - `3`: ID, 비번 불일치
  - `5`: 사용 불가처리 상태
  - `6`: 시스템 점검 시간

---

### 2.2 [90000] 보유금액 및 사용가능일 요청
- **Endpoint**: `/90000?id={id}&pass={pass}&connectionid={id}`
- **응답 필드**: `_MONEY`, `_APROVALUE`, `_COMMISION_PERIN`, `_COMMISION_PEROUT`, `_COMMISION_IN`, `_COMMISION_OUT`
- **오류 응답**: `2`(기간 만료), `3`(회원정보 없음), `5`(사용 불가), `6`(점검 중)

---

### 2.3 [90100] 출금신청 최소/최대 금액 요청
- **Endpoint**: `/90100?id={id}&pass={pass}&connectionid={id}`
- **응답 필드**: `_MINSENDMONEY`(최소), `_MAXSENDMONEY`(최대)
- **오류 응답**: `6`(점검 중)

---

### 2.4 [21000] 입금신청내역 조회
- **Endpoint**: `/21000?id={id}&pass={pass}&sdate={sdate}&edate={edate}&connectionid={id}`
- **응답**: `data` 배열 내 상세 정보
- **오류 응답**: `2`(회원정보 없음), `3`(정보 없음), `6`(점검 중)

---

### 2.5 [30000] 출금통지 불러오기
- **Endpoint**: `/30000?id={id}&pass={pass}&sdate={sdate}&edate={edate}&connectionid={id}`
- **응답 데이터 (`data`) 필드**:
  - `_UNIQUEID`: 고유 아이디
  - `_CREATE_DATETIME`: 통보일자
  - `_AFFILIATE_ID`: 가맹점명
  - `_NAME`: 예금주
  - `_MONEY`: 금액
  - `_ORDERNUMBER`: 주문번호
  - `_BANKCODE`: 은행코드
  - `_TEL`: 전화번호
  - `_BANKNUMBER`: 계좌번호
  - `_USE`: True(처리), False(미처리)
  - `_RETURNCODE`: 응답코드
  - `_RETURNMSG`: 응답메시지
- **오류 응답**: `2`(회원정보 없음), `3`(정보 없음), `6`(점검 중)

---

### 2.6 [40000] 입금통지 불러오기
- **Endpoint**: `/40000?id={id}&pass={pass}&sdate={sdate}&edate={edate}&connectionid={id}`
- **응답 데이터 (`data`) 필드**:
  - `_UNIQUEID`: 고유 아이디
  - `_CREATE_DATETIME`: 통보일자
  - `_SERVICE_ID`: 서비스ID
  - `_ORDER_ID`: 주문ID
  - `_TR_ID`: 트랜잭션ID
  - `_RESPONSE_CODE`: 상태코드
  - `_RESPONSE_MESSAGE`: 상태메시지
  - `_AMOUNT`: 금액
  - `_IN_BANK_CODE`: 입금은행코드
  - `_IN_BANK_USERNAME`: 입금주
  - `_STATE`: 0(미처리), 0아님(처리)
  - `_AFFILIATE_ID`: 가맹점명
- **오류 응답**: `2`(회원정보 없음), `3`(정보 없음), `6`(점검 중)

---

### 2.7 [50000] 출금신청 접수하기
- **Endpoint**: `/50000?id={id}&pass={pass}&money={m}&bankuser={u}&bankcode={c}&bankname={n}&banknumber={num}&phone={p}&connectionid={id}`
- **오류 응답**:
  - `2`: 회원정보 없음
  - `3`: 1회 출금 최대 한도 초과
  - `4`: 예금주 누락
  - `5`: 은행코드 선택 오류
  - `6`: 시스템 점검 시간
  - `7`: 계좌번호 누락
  - `8`: 1회 출금 최소 한도 미달
  - `9`: 동일금액 출금신청 제한 (30초 후 가능)

---

### 2.8 [51000] 출금신청 리스트 조회
- **Endpoint**: `/51000?id={id}&pass={pass}&sdate={sdate}&edate={edate}&connectionid={id}`
- **응답 데이터 (`data`) 필드**:
  - `_UNIQUEID`, `_CREATE_DATETIME`(신청일자), `_AFFILIATE_ID`, `_BANKCODE`, `_BANKNAME`, `_BANKNUMBER`, `_BANKUSER`, `_MONEY`, `_RETURNCODE`, `_RETURNMSG`
  - `_STATE`: 상태 (0:미처리, 1:처리, 2:오류, 3:취소)
  - `_ADMIN_STATE`: 0이면 미승인, 0 아니면 승인
  - `_SHOP_STATE`: 0이면 대기, 0 아니면 가맹점 승인
  - `_MEMO`: 메모
  - `_VPN_BANKNAME`, `_VPN_BANKUSER`, `_VPNUSE`(False/True)
- **오류 응답**: `2`(회원정보 없음), `3`(정보 없음), `6`(점검 중)

---

### 2.9 [51100] 출금신청 리스트 조회 (이름/번호 검색)
- **Endpoint**: `/51100?id={id}&pass={pass}&bankuser={user}&count={count}&connectionid={id}`
- **응답 데이터 (`data`) 필드**: `_CREATE_DATETIME`, `_BANKCODE`, `_BANKNAME`, `_BANKNUMBER`, `_BANKUSER`, `_MONEY`, `_PHONE`
- **오류 응답**: `2`(회원정보 없음), `3`(정보 없음), `6`(점검 중)

---

### 2.10 [51400] 가맹점 확인 (출금 승인)
- **Endpoint**: `/51400?id={id}&pass={pass}&uniqueid={id}&connectionid={id}`
- **설명**: 가맹점에서 특정 출금 신청 건을 최종 승인 처리
- **오류 응답**: `2`(회원정보 없음), `6`(점검 중)

---

### 2.11 [51600] 데이터 취소 (승인 취소)
- **Endpoint**: `/51600?id={id}&pass={pass}&uniqueid={id}&connectionid={id}`
- **설명**: 가맹점에서 이미 승인한 출금 건을 다시 취소 처리
- **오류 응답**: `2`(회원정보 없음), `6`(점검 중)
