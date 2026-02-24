# WowPaymentManager

WOW 지급대행 B2B 내부망 통제 및 관리 시스템입니다. `admin.html`의 고밀도 디자인을 계승하며, API 기반의 안정적인 백엔드 연동을 제공합니다.

---

## ⚙️ 백엔드 설정 (Backend IP Config)

시스템 연동을 위한 백엔드 IP 정보는 `.env.local` 파일에서 관리합니다. 서버 환경에 맞춰 아래 변수를 수정하십시오.

```env
BACKEND_IP=127.0.0.1
BACKEND_PORT=33552
```

## 🚀 실행 방법 (Execution)

1. 의존성 설치 (최초 1회)
   ```bash
   npm install
   ```

2. 개발 서버 실행
   ```bash
   npm run dev
   ```

3. 운영 빌드 및 실행 (PM2 추천)
   ```bash
   npm run build
   pm2 start npm --name "WowPaymentManager" -- run start
   ```

---

## ⚠️ 핵심 개발 원칙
1. **API Only**: 모든 데이터 연동은 `docs/02_Specification/API_SPEC.md`에 명세된 API를 통해서만 이루어집니다.
2. **High-Density UI**: 컬러 사용을 최소화하고 텍스트 밀도를 높여 실무 효율성을 극대화합니다.
3. **Robustness**: 401(쓰로틀링) 및 402(세션 만료) 에러를 서버 단에서 자동 복구합니다.
