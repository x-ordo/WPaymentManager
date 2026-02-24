# WOW 지급대행 관리 시스템 문서 (Project Documentation)

본 문서는 WOW 지급대행 B2B 내부망 시스템 구축을 위한 가이드라인 및 기술 명세, 구현 예제 코드를 포함하고 있습니다.

## ⚠️ 핵심 연동 원칙 (Critical Rule)
**모든 백엔드 연동은 오직 `docs/02_Specification/API_SPEC.md`에 명세된 API를 통해서만 이루어집니다.**
- **API 중심 설계**: 인증, 조회, 승인, 취소 등 모든 비즈니스 로직은 API 호출로 캡슐화됩니다.
- **백엔드 내부 구조 무시**: 시스템은 백엔드의 데이터베이스나 내부 처리 방식에 대해 알지 못하며, 오직 API 응답 결과에 따라 동작합니다.

## 📂 폴더 구조 및 상세 내용

### 1. [01_Business](./01_Business) - 사업 및 요구사항
*   **RFP.md**: 제안요청서 (사업 개요, 아키텍처, 핵심 요구사항)
*   **IMPROVEMENTS.md**: 시스템 개선 제안 사항 (API 기반 품질 향상)

### 2. [02_Specification](./02_Specification) - 기술 명세
*   **API_SPEC.md**: **[유일한 연동 인터페이스]** 입출금, 로그인 등 11개 API 명세

### 3. [03_Setup](./03_Setup) - 환경 설정
*   **START_SETTING.md**: Next.js 프로젝트 설정 및 API 기반 환경 변수 세팅

### 4. [04_Implementation](./04_Implementation) - API 기반 구현 예제
*   **01_Withdrawal_Logic_and_Table.md**: API 호출 및 TanStack Table 구현
*   **02_Core_API_Module.md**: **API Only** 통신 코어 및 예외 처리 로직
*   **03_Server_Actions_Mapping.md**: 11개 API 전체에 대한 Server Actions 매핑
*   **04_Withdrawal_UI_Implementation.md**: 출금 관리 페이지 및 클라이언트 테이블 UI
*   **05_Dashboard_UI_Implementation.md**: 자금 현황 및 한도 정책 대시보드 UI
*   **06_Layout_and_Navigation_UI.md**: LNB 및 GNB를 포함한 글로벌 레이아웃

---
*최종 업데이트: 2026-02-23*
