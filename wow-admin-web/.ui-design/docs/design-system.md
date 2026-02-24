# WOW Payment Manager — Design System

## Philosophy: Calm Control

업무 도구는 하루 8시간 이상 응시합니다. 화려한 색상은 피로를 유발하고, 과도한 장식은 데이터 인식을 방해합니다.

**원칙:**
- 무채색 지배: 색상은 상태 표시(파랑/빨강/초록)에만 사용
- 고밀도 우선: 한 화면에 최대한 많은 레코드를 노출
- 숫자 가독성: 금액과 코드는 항상 `font-mono` + `tabular-nums`
- 최소 움직임: 트랜지션은 200ms 이내, 장식 애니메이션 없음

---

## Color Tokens

### Surface (배경)
| Token | CSS Variable | 값 | 용도 |
|-------|-------------|-----|------|
| `bg-surface-page` | `--surface-page` | `#FAFAFA` | 페이지 전체 배경 |
| `bg-surface-card` | `--surface-card` | `#FFFFFF` | 카드, 테이블 배경 |
| `bg-surface-header` | `--surface-header` | `#F0F0F0` | 테이블 헤더, 섹션 헤더 |
| `bg-surface-hover` | `--surface-hover` | `#FAFAFA` | 행 hover 상태 |

### Ink (텍스트)
| Token | CSS Variable | 값 | 용도 |
|-------|-------------|-----|------|
| `text-ink-primary` | `--ink-primary` | `#1A1A1A` | 주요 정보 (금액, 이름) |
| `text-ink-secondary` | `--ink-secondary` | `#404040` | 보조 정보 (가맹점, 헤더) |
| `text-ink-tertiary` | `--ink-tertiary` | `#737373` | 설명 텍스트, 날짜 |
| `text-ink-muted` | `--ink-muted` | `#A3A3A3` | 비활성, 라벨 |

### Border (테두리)
| Token | CSS Variable | 값 | 용도 |
|-------|-------------|-----|------|
| `border-border-default` | `--border-default` | `#E5E5E5` | 카드, 테이블 외곽 |
| `border-border-subtle` | `--border-subtle` | `#F5F5F5` | 테이블 행 구분 |
| `border-border-strong` | `--border-strong` | `#D4D4D4` | 강조 구분선 |

### Status (상태 — 유일한 유채색)
| Token | 값 | 용도 |
|-------|-----|------|
| `text-status-info` | `#3B82F6` | 정상 처리, 사용가능일 |
| `text-status-danger` | `#DC2626` | 오류, 경고, 기한임박 |
| `text-status-success` | `#16A34A` | 성공 완료 |

---

## Typography Scale

| 토큰 | 크기 | 용도 |
|------|------|------|
| `text-2xs` | 11px | 마이크로 라벨, 시스템 코드 |
| `text-xs` | 12px | 캡션, 메타데이터, 날짜 |
| `text-sm` | 13px | 테이블 본문, 밀집 UI |
| `text-base` | 14px | 기본 본문 |
| `text-md` | 15px | 강조 본문 |
| `text-lg` | 18px | 섹션 제목 |
| `text-xl` | 24px | 페이지 제목 |
| `text-2xl` | 32px | 대시보드 주요 수치 |
| `text-3xl` | 40px | KPI 히어로 수치 |

### 타이포그래피 규칙
- **금액**: `font-mono font-bold tracking-tighter tabular-nums`
- **날짜/코드**: `font-mono text-ink-tertiary`
- **라벨**: `font-semibold text-ink-muted uppercase tracking-wide`
- **페이지 제목**: `text-xl font-bold text-ink-primary tracking-tight`

---

## Spacing

4px 그리드 기반. Tailwind 기본 값과 호환.

| 토큰 | 값 | 주요 용도 |
|------|-----|---------|
| `p-1` / `gap-1` | 4px | 아이콘-텍스트 간격 |
| `p-2` / `gap-2` | 8px | 테이블 셀 패딩, 버튼 내부 |
| `p-3` / `gap-3` | 12px | 인라인 요소 간격 |
| `p-4` / `gap-4` | 16px | 카드 내부 패딩 |
| `p-6` / `gap-6` | 24px | 섹션 간 여백 |
| `p-8` / `gap-8` | 32px | 페이지 내 대구획 |

---

## Component Patterns

### 버튼
```html
<!-- Primary (주요 액션: 승인, 제출) -->
<button class="bg-btn-primary-bg text-btn-primary-text hover:bg-btn-primary-hover
  px-4 py-2 text-sm font-bold transition-colors duration-fast">
  승인
</button>

<!-- Ghost (보조 액션: 취소, 닫기) -->
<button class="border border-btn-ghost-border text-btn-ghost-text hover:bg-btn-ghost-hover
  px-4 py-2 text-sm font-bold transition-colors duration-fast">
  취소
</button>
```

### 테이블
```html
<table class="w-full text-sm border-collapse">
  <thead class="bg-surface-header border-b border-border-default text-ink-tertiary font-semibold">
    <tr><th class="px-3 py-2.5 text-left">컬럼명</th></tr>
  </thead>
  <tbody class="divide-y divide-border-subtle">
    <tr class="hover:bg-surface-hover transition-colors duration-fast">
      <td class="px-3 py-2">데이터</td>
    </tr>
  </tbody>
</table>
```

### 카드
```html
<div class="bg-surface-card border border-border-default shadow-xs p-6">
  <h3 class="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">라벨</h3>
  <div class="text-2xl font-bold text-ink-primary font-mono tracking-tighter tabular-nums">
    1,234,567원
  </div>
</div>
```

### 입력 필드
```html
<input class="w-full border border-border-default px-3 py-2 text-base font-mono
  outline-none focus-visible:border-border-focus transition-colors duration-fast" />
```

---

## WCAG Contrast Compliance

| 조합 | 비율 | 등급 |
|------|------|------|
| ink-primary (#1A1A1A) on surface-card (#FFFFFF) | 16.6:1 | AAA |
| ink-secondary (#404040) on surface-card (#FFFFFF) | 9.7:1 | AAA |
| ink-tertiary (#737373) on surface-card (#FFFFFF) | 4.6:1 | AA |
| ink-muted (#A3A3A3) on surface-card (#FFFFFF) | 2.7:1 | Large text only |
| status-info (#3B82F6) on surface-card (#FFFFFF) | 4.5:1 | AA |
| status-danger (#DC2626) on surface-card (#FFFFFF) | 5.6:1 | AA |

> `ink-muted`는 장식적 라벨에만 사용. 필수 정보에는 `ink-tertiary` 이상 사용할 것.
