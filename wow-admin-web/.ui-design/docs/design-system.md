# WOW Payment Manager — Design System v2.2

## Philosophy: Calm Control

업무 도구는 하루 8시간 이상 응시합니다. 화려한 색상은 피로를 유발하고, 과도한 장식은 데이터 인식을 방해합니다.

**원칙:**
- 무채색 지배: 색상은 상태 표시와 브랜드 프라이머리에만 사용
- 전폭 활용: max-width 제한 없이 뷰포트 전체를 사용하되, 외곽 패딩(32px)으로 호흡 확보
- 고밀도 우선: 한 화면에 최대한 많은 레코드를 노출
- Hana2 단일 폰트: `font-mono` 사용 금지. 숫자 데이터는 `tabular-nums`만으로 정렬
- 최소 움직임: `transition-all` / `transition-colors`, 장식 애니메이션 없음
- daisyUI 우선: 모든 UI는 daisyUI 컴포넌트 클래스 기반

---

## Color System

### daisyUI Theme (globals.css — oklch)

모든 색상은 `globals.css`의 `@plugin "daisyui/theme"` 블록에서 oklch 형식으로 정의됩니다.
컴포넌트에서는 daisyUI 시맨틱 클래스를 사용하며, 직접 hex/oklch 값을 쓰지 않습니다.

| 역할 | daisyUI 변수 | oklch 값 | 클래스 예시 |
|------|-------------|----------|------------|
| 브랜드 | `--color-primary` | `oklch(42% 0.1 170)` | `bg-primary`, `text-primary` |
| 보조 | `--color-secondary` | `oklch(34% 0 0)` | `bg-secondary` |
| 강조 | `--color-accent` | `oklch(70% 0.17 162)` | `text-accent` |
| 배경 | `--color-base-100` | `oklch(98.5% 0 0)` | `bg-base-100` |
| 섹션 | `--color-base-200` | `oklch(96% 0.01 250)` | `bg-base-200` |
| 테두리 | `--color-base-300` | `oklch(91% 0.01 250)` | `border-base-300` |
| 본문 | `--color-base-content` | `oklch(14% 0 0)` | `text-base-content` |

### Status Colors (유일한 유채색)

| 상태 | oklch | 용도 | 클래스 |
|------|-------|------|--------|
| Info | `oklch(63% 0.19 240)` | 정보성, 접수완료 | `badge-info`, `text-info` |
| Success | `oklch(70% 0.17 162)` | 성공, 처리완료 | `badge-success`, `text-success` |
| Warning | `oklch(75% 0.16 75)` | 경고, 대기중 | `badge-warning`, `text-warning` |
| Error | `oklch(58% 0.22 27)` | 오류, 취소 | `badge-error`, `text-error` |

### 텍스트 불투명도 계층

daisyUI `base-content`에 불투명도를 적용하여 텍스트 위계를 표현합니다:

| 계층 | 클래스 | 용도 | WCAG |
|------|--------|------|------|
| Primary | `text-base-content` | 금액, 이름, 제목 (최대 강조) | AAA |
| Secondary | `text-base-content/80` | 가맹점, 주요 정보 | AAA |
| Tertiary | `text-base-content/70` | 날짜, 코드 | AA |
| Label | `text-base-content/50` | 기능 라벨, 섹션 제목 | AA (최소) |
| Suffix | `text-base-content/40` | 단위 접미사 (원, 건, KRW) | Large text |
| Ghost | `text-base-content/20` | 순수 장식, 구분선 | Decorative |

> **WCAG 규칙**: 기능 라벨(`text-xs` 이하)은 반드시 `/50` 이상. `/40`은 단위 접미사와 large text에만 허용. `/20`은 순수 장식용.

---

## Typography

### 폰트 전략

- **Hana2**: `:root`에서 유일한 기본 폰트. 모든 UI 텍스트(본문, 숫자, 라벨)에 사용.
- **font-mono 사용 금지**: 숫자 데이터도 Hana2로 표시. `tabular-nums`만으로 정렬 보장.
- **한글 font-weight 주의**: `font-black`(900)은 한글 획이 뭉개질 수 있음. 한글 버튼/라벨에는 `font-bold`(700) 권장.
- **Hana2 폰트 웨이트**: Light(300), Regular(400), Medium(500), Bold(700), Heavy(900)

### Font Weight Hierarchy (5단계)

모든 5가지 Hana2 웨이트를 의미적으로 구분하여 사용합니다:

| 웨이트 | 클래스 | 역할 | 예시 |
|--------|--------|------|------|
| Heavy (900) | `font-black` | 페이지 제목, 히어로 금액, 브랜드명 | 종합 대시보드, 1,234,567 (대형) |
| Bold (700) | `font-bold` | 테이블 헤더, 데이터 값, 버튼, 배지, 탭 | 예금주명, 입금일시, 승인 버튼 |
| Medium (500) | `font-medium` | 라벨, 섹션 제목, 필터 카운터 | 총 신청 금액, 조회기간, KST |
| Regular (400) | `font-normal` | 단위 접미사, 본문, 보조 정보 | 원, 건, KRW, ~(구분자) |
| Light (300) | `font-light` | 장식 텍스트, 비활성 상태 | — Done —, 이전 날짜 |

> **핵심 원칙**: `font-black`은 페이지당 1~3회만 사용 (제목, 핵심 KPI). 나머지는 bold 이하로 배분.

### Typography Scale

| 토큰 | 크기 | 용도 |
|------|------|------|
| `text-xs` | 12px | 캡션, 메타데이터, stat-title |
| `text-sm` | 13px | 테이블 본문, 보조 정보 |
| `text-base` | 14px | 기본 본문 |
| `text-lg` | 18px | 섹션 제목, nav item |
| `text-xl` | 24px | 부제목, 수수료 금액 |
| `text-2xl` | 32px | 페이지 제목 |
| `text-3xl` | 40px | 통계 수치 (stat-value) |
| `text-5xl` ~ `text-7xl` | 48~72px | KPI 히어로 금액 |

### 최소 텍스트 크기

**`text-sm` (13px)이 최소 크기입니다.** `text-xs` 이하 및 bracket 폰트 크기 사용을 금지합니다.

| 크기 | 클래스 | 용도 |
|------|--------|------|
| 13px | `text-sm` | 라벨, 배지, 접미사, 보조 ID, 응답코드 |
| 14px | `text-base` | 기본 본문, 예금주, 테이블 본문 |
| 18px | `text-lg` | 금액 (중형) |

### 타이포그래피 패턴

```
페이지 제목:    text-2xl font-black tracking-tight text-base-content
금액 (대형):    font-black text-5xl tracking-tighter tabular-nums
금액 (중형):    font-bold text-lg tracking-tighter tabular-nums
통계 수치:     text-xl font-black tabular-nums (compact grid, 페이지 KPI)
테이블 헤더:    font-bold py-4 (font-black 아님)
데이터 값:     font-bold text-base-content/80
날짜/ID:       text-sm font-bold text-base-content/70 tabular-nums
라벨:          font-medium text-base-content/50 uppercase tracking-widest
단위 접미사:    font-normal text-base-content/40 (원, 건, KRW)
장식/비활성:    font-light text-base-content/20 italic
```

---

## Component Patterns (daisyUI)

### 카드

```html
<!-- 일반 카드 -->
<div class="card card-border bg-base-100 shadow-sm border-base-300">
  <div class="card-body p-6">...</div>
</div>

<!-- 히어로 카드 (대시보드 메인) -->
<div class="card bg-primary text-primary-content shadow-md">
  <div class="card-body p-8 lg:p-10">...</div>
</div>
```

### 통계 (Compact Stats Grid)

`gap-px bg-base-300` 기법으로 1px 구분선을 가진 컴팩트 그리드:

```html
<div class="grid grid-cols-3 gap-px bg-base-300 rounded-xl overflow-hidden border border-base-300">
  <div class="bg-base-100 px-5 py-3">
    <div class="text-xs font-bold text-base-content/50 uppercase tracking-widest">라벨</div>
    <div class="text-xl font-black tabular-nums text-base-content mt-1">
      1,234,567<span class="text-xs font-bold text-base-content/40 ml-1">원</span>
    </div>
  </div>
  <!-- 추가 셀 동일 패턴 -->
</div>
```

- 입금: `grid-cols-3` (총 입금액, 접수 완료, 전체 건수/미처리)
- 출금: `grid-cols-4` (총 신청 금액, 정상 처리, 대기중, 오류/취소)

### 탭

```html
<div role="tablist" class="tabs tabs-box bg-base-200/50 p-1 rounded-lg">
  <a role="tab" class="tab font-bold transition-all tab-active bg-primary text-primary-content shadow-sm">활성탭</a>
  <a role="tab" class="tab font-bold transition-all text-base-content/40">비활성탭</a>
</div>
```

### 데이터 테이블

`table-pin-rows`로 헤더를 고정하고 `h-[calc(100vh-340px)]`로 뷰포트 채움:

```html
<div class="card card-border bg-base-100 shadow-xl border-base-300 overflow-hidden h-[calc(100vh-340px)]">
  <div class="overflow-auto h-full custom-scrollbar">
    <table class="table table-pin-rows table-zebra table-md">
      <thead class="text-base-content/60 border-b border-base-300">
        <tr class="bg-base-200/95 backdrop-blur-sm">
          <th class="font-black py-5 pl-6 bg-base-200/95">컬럼명</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-base-300">
        <tr class="group hover:bg-primary/[0.02] transition-colors">
          <td class="pl-6 py-3">데이터</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### 조회기간 필터 (SearchFilter)

날짜 범위 + 빠른 필터를 단일 행으로 배치:

```html
<div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-base-100 px-4 py-3 rounded-xl border border-base-300">
  <form class="flex items-center gap-3 flex-1">
    <div class="text-xs font-bold text-base-content/50 uppercase tracking-widest">조회기간</div>
    <div class="join">
      <input class="input input-sm join-item w-44 font-bold text-center tabular-nums" />
      <span class="join-item flex items-center px-2 bg-base-200 text-base-content/40">~</span>
      <input class="input input-sm join-item w-44 font-bold text-center tabular-nums" />
    </div>
    <button class="btn btn-primary btn-sm px-6">조회</button>
  </form>
  <div class="flex gap-1.5">
    <a class="btn btn-xs btn-primary">오늘</a>
    <a class="btn btn-xs btn-soft">어제</a>
  </div>
</div>
```

### 결과 내 필터 (Table Filter)

```html
<div class="flex justify-between items-center bg-base-100 p-4 rounded-xl border border-base-300 shadow-sm">
  <div class="flex items-center gap-3">
    <div class="w-1 h-6 bg-primary rounded-full" />
    <h3 class="text-sm font-bold text-base-content/50 uppercase tracking-widest">필터 라벨</h3>
    <input class="input input-bordered input-sm w-96 font-bold bg-base-200/50" />
  </div>
  <div class="text-xs font-bold text-base-content/50">RESULTS: <span class="text-primary font-black">N</span> / M 건</div>
</div>
```

### 배지 (상태)

```html
<span class="badge badge-success badge-soft font-bold">처리완료</span>
<span class="badge badge-error badge-soft font-bold">오류</span>
<span class="badge badge-ghost badge-outline opacity-50 font-bold">대기중</span>
```

### 버튼 그룹 (액션)

```html
<div class="join shadow-sm border border-base-300 overflow-hidden">
  <button class="btn btn-primary btn-sm join-item font-black px-4">승인</button>
  <button class="btn btn-neutral btn-sm join-item font-black px-4">취소</button>
</div>
```

### 모달

```html
<dialog class="modal">
  <div class="modal-box max-w-2xl p-0 bg-base-100 border border-base-300 shadow-2xl">
    <!-- Header with bg-primary gradient -->
    <!-- Body with form fields -->
  </div>
  <form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>
```

---

## Shadow Usage

| 레벨 | 클래스 | 용도 |
|------|--------|------|
| Subtle | `shadow-sm` | 카드, 배지, 입력 필드 |
| Medium | `shadow-md` | 히어로 카드 |
| Prominent | `shadow-lg` | 드롭다운 메뉴 |
| Heavy | `shadow-xl` | 데이터 테이블 컨테이너 |
| Maximum | `shadow-2xl` | 모달 다이얼로그 |
| Colored | `shadow-primary/20` | 프라이머리 버튼 강조 |

---

## Spacing

4px 그리드 기반. Tailwind 기본 값과 호환.

| 토큰 | 값 | 주요 용도 |
|------|-----|---------|
| `p-1` / `gap-1` | 4px | 아이콘-텍스트 간격 |
| `p-2` / `gap-2` | 8px | 테이블 셀 패딩, 버튼 내부 |
| `p-4` / `gap-4` | 16px | 카드 내부 패딩, 검색바, 페이지 섹션 간 여백 (`space-y-4`) |
| `p-6` / `gap-6` | 24px | card-body |
| `p-8` / `gap-8` | 32px | 히어로 카드 패딩 |
| `p-10` | 40px | 대형 카드 데스크톱 패딩 |

---

## Layout

데스크탑 화면 활용도를 극대화합니다. `max-width` 제한 없이 뷰포트 전체를 사용합니다.

| 요소 | 값 | 비고 |
|------|-----|------|
| 사이드바 | `w-64` (256px) | 고정, `lg:drawer-open` |
| 콘텐츠 최대폭 | 없음 | `max-w-*` 사용 금지 |
| 콘텐츠 패딩 (모바일) | `p-4` (16px) | |
| 콘텐츠 패딩 (데스크탑) | `lg:p-8` (32px) | 외곽 호흡 확보 |

> 금융 업무 도구는 데이터 밀도가 핵심. 뷰포트 전체를 활용하되, 32px 패딩으로 콘텐츠가 브라우저 끝에 붙지 않도록 한다.

---

## WCAG Contrast Compliance

| 조합 | 비율 | 등급 | 허용 용도 |
|------|------|------|-----------|
| base-content on base-100 | ~16:1 | AAA | 금액, 제목, 본문 |
| base-content/80 on base-100 | ~10:1 | AAA | 주요 정보 |
| base-content/70 on base-100 | ~7:1 | AA | 날짜, 코드 |
| base-content/50 on base-100 | ~4.5:1 | AA (최소) | 기능 라벨, 섹션 제목 |
| base-content/40 on base-100 | ~3.2:1 | Large text | 단위 접미사 (원, 건) |
| base-content/20 on base-100 | ~1.8:1 | Decorative | 순수 장식, 구분선 |

> **필수 규칙**: 기능 라벨(`text-xs`)은 `/50` 이상. 단위 접미사는 `/40` 이상. `/20`은 순수 장식에만 허용.
