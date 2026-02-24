AI 코딩 툴(Cursor, Claude Code 등)에 바로 붙여넣어 Vibe Coding 기반의 자동화된 스캐폴딩을 즉시 진행할 수 있도록, 핵심 명령어와 폴더 구조를 실전형으로 요약해 드립니다.

Windows Server 네이티브 환경(PM2 구동)과 MS SQL 연동을 전제로 한 초기 세팅 플랜입니다.

---

### 1. 프로젝트 생성 및 패키지 설치

터미널을 열고 아래 명령어를 순차적으로 실행합니다. (Next.js 14 App Router, TypeScript, Tailwind CSS 기본 적용)

```bash
# 1. Next.js 프로젝트 생성 (모든 프롬프트에 기본값/Yes 선택, App Router 사용)
npx create-next-app@latest wow-admin-web

# 2. 디렉토리 이동
cd wow-admin-web

# 3. 핵심 의존성 패키지 설치
# mssql: DB 통신 / @tanstack/react-table: 고밀도 데이터 그리드 / date-fns: 날짜 포맷팅
npm install mssql @tanstack/react-table date-fns

# 4. TypeScript 타입 정의 패키지 설치
npm install -D @types/mssql

```

### 2. 환경 변수 설정 (`.env.local`)

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고, API 접속 정보들을 세팅합니다.

```env
# [Legacy API Configuration]
LEGACY_API_BASE_URL=http://127.0.0.1:33552
LEGACY_ADMIN_ID=master
LEGACY_ADMIN_PASS=649005
```

### 3. 디렉토리 아키텍처 (App Router 기준)

유지보수와 파일 응집도를 높이기 위해, 아래와 같은 구조로 `src` 폴더 하위를 구성하는 것을 권장합니다.

```text
wow-admin-web/
├── src/
│   ├── app/                    # UI 라우팅 및 페이지 컴포넌트
│   │   ├── api/                # 클라이언트 조회용 Route Handlers (필요시)
│   │   ├── withdrawals/        # 출금 관리 페이지 그룹
│   │   │   └── page.tsx        # 출금 리스트 뷰어 메인 화면
│   │   ├── layout.tsx          # LNB(좌측 메뉴) 및 글로벌 레이아웃
│   │   └── page.tsx            # 메인 대시보드 (보유금액, 한도 표시)
│   │
│   ├── actions/                # Server Actions (DB Insert, API 상태 변경 등 Mutation 전담)
│   │   └── withdrawals.ts      # 출금 승인/취소 백엔드 로직
│   │
│   ├── components/             # 재사용 가능한 UI 컴포넌트
│   │   ├── layout/             # Sidebar, Header 등
│   │   └── ui/                 # WithdrawalTable.tsx (데이터 그리드) 등
│   │
│   └── lib/                    # 공통 유틸리티 및 코어 모듈
│       ├── db.ts               # MS SQL 커넥션 풀 설정
│       ├── legacy-api.ts       # 레거시 API 통신, 401/402 에러 제어, 감사 로그 적재 로직
│       └── utils.ts            # 금액 콤마, 날짜 변환 등 공통 함수
│
├── .env.local                  # 로컬 환경변수 (운영 환경 시 시스템 환경변수로 대체)
├── tailwind.config.ts          # 토스/금융망 스타일을 위한 컬러 팔레트 커스텀
└── package.json

```

### 4. Windows Server 네이티브(PM2) 구동 플랜

Next.js의 백엔드 메모리(Global Connection ID) 유지를 위해 IIS 프록시 대신 Node.js 네이티브 프로세스 매니저인 PM2 사용을 권장합니다.

```bash
# 1. PM2 전역 설치 (관리자 권한 PowerShell 권장)
npm install -g pm2

# 2. 운영용 빌드 생성
npm run build

# 3. PM2로 Next.js 프로덕션 모드 실행 (이름 지정)
pm2 start npm --name "wow-admin-web" -- run start

# 4. (선택) 서버 재부팅 시 자동 실행 등록 설정
pm2 save
pm2 startup

```

---

기본적인 스캐폴딩 준비가 완료되었습니다. 이 구조를 바탕으로 즉시 Cursor나 Claude에 이전에 작성해 드린 `lib/legacy-api.ts`와 `WithdrawalTable.tsx` 코드를 파일별로 주입하시면, 하루 안에 코어 기능 테스트가 가능한 수준까지 빌드가 완료될 것입니다.
