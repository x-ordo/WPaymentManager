# CHAGOK Telemetry Receiver

무단 배포 탐지를 위한 텔레메트리 수신 서버

## 배포 방법

```bash
cd telemetry
npm install
vercel --prod
```

## 환경 설정

배포 후 생성된 URL을 `frontend/src/lib/analytics.ts`와 `backend/app/middleware/telemetry.py`에 업데이트:

```typescript
// analytics.ts
const _e = btoa('https://your-telemetry-url.vercel.app/api');
```

## 로그 확인

```bash
vercel logs --follow
```

## 수집 데이터

- `d`: 배포 도메인
- `p`: 요청 경로
- `t`: 타임스탬프
- `u`: User Agent
- `ip`: 클라이언트 IP

## 알림 설정 (선택)

Vercel Dashboard > Integrations에서:
- Slack 연동: 특정 도메인 접근 시 알림
- Webhook: 외부 서비스 연동
