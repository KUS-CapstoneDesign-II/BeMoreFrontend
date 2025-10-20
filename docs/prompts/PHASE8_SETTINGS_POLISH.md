# Phase 8: Settings & Final Polish

## 🎯 목표

사용자 경험을 완성하고 프로덕션 배포 준비를 완료하는 최종 마무리 단계

---

## 📋 구현 체크리스트

### 1. Settings Page

**파일**: `src/pages/Settings.tsx`

```typescript
// UI 레이아웃
┌─────────────────────────────────────┐
│ Settings                            │
├─────────────────────────────────────┤
│ [Tab: 계정] [Tab: 알림] [Tab: 개인화] [Tab: 프라이버시] │
├─────────────────────────────────────┤
│ 계정 설정                            │
│ ┌───────────────────────────────┐   │
│ │ 이메일 변경                    │   │
│ │ 비밀번호 변경                   │   │
│ │ 계정 삭제                       │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

### 2. Account Settings

**파일**: `src/components/Settings/AccountSettings.tsx`

```typescript
// 기능
1. 이메일 변경
   - 새 이메일 입력
   - 인증 코드 발송
   - 인증 코드 확인
   - 이메일 업데이트

2. 비밀번호 변경
   - 현재 비밀번호 확인
   - 새 비밀번호 입력
   - 비밀번호 확인
   - 비밀번호 강도 표시

3. 계정 삭제
   - 삭제 확인 모달
   - 비밀번호 재확인
   - 30일 유예기간 안내
   - 삭제 요청

// UI
┌─────────────────────────────────────┐
│ 이메일 변경                          │
├─────────────────────────────────────┤
│ 현재: user@example.com              │
│                                     │
│ 새 이메일: [           ]  [인증]    │
│ 인증 코드: [      ]      [확인]    │
│                                     │
│ [저장]                              │
└─────────────────────────────────────┘
```

---

### 3. Notification Settings

**파일**: `src/components/Settings/NotificationSettings.tsx`

```typescript
// 기능
1. 푸시 알림
   - 세션 시작 알림 (ON/OFF)
   - 세션 종료 알림 (ON/OFF)
   - AI 인사이트 알림 (ON/OFF)
   - 긴급 알림 (항상 ON)

2. 이메일 알림
   - 주간 리포트 (ON/OFF)
   - 월간 리포트 (ON/OFF)
   - 마케팅 메일 (ON/OFF)

3. SMS 알림
   - 세션 리마인더 (ON/OFF)
   - 긴급 알림 (ON/OFF)

// UI
┌─────────────────────────────────────┐
│ 푸시 알림                            │
├─────────────────────────────────────┤
│ ┌─────────────────────────────┐     │
│ │ 세션 시작 알림      [ON/OFF] │     │
│ │ 세션 종료 알림      [ON/OFF] │     │
│ │ AI 인사이트         [ON/OFF] │     │
│ │ 긴급 알림           [ON]     │     │
│ └─────────────────────────────┘     │
│                                     │
│ [모두 허용]  [모두 차단]             │
└─────────────────────────────────────┘
```

---

### 4. Personalization Settings

**파일**: `src/components/Settings/PersonalizationSettings.tsx`

```typescript
// 기능
1. 테마
   - Light / Dark / System (이미 구현됨)
   - Color scheme (Teal / Blue / Purple / Green)

2. 폰트 크기
   - Small (14px)
   - Medium (16px) - Default
   - Large (18px)
   - Extra Large (20px)

3. 언어
   - 한국어 (기본)
   - English
   - 日本語 (향후)

4. 레이아웃
   - Compact (압축)
   - Standard (기본)
   - Comfortable (여유)

// UI
┌─────────────────────────────────────┐
│ 폰트 크기                            │
├─────────────────────────────────────┤
│ Aa [━━●━━━━━] Aa                    │
│                                     │
│ 미리보기:                            │
│ 이것은 미리보기 텍스트입니다.         │
│                                     │
│ [적용]                              │
└─────────────────────────────────────┘
```

---

### 5. Privacy Settings

**파일**: `src/components/Settings/PrivacySettings.tsx`

```typescript
// 기능
1. 데이터 다운로드
   - 전체 데이터 내보내기 (JSON)
   - 세션 히스토리 다운로드
   - 메시지 히스토리 다운로드

2. 데이터 삭제
   - 세션 히스토리 삭제
   - 메시지 히스토리 삭제
   - 모든 데이터 삭제

3. 프라이버시
   - 데이터 수집 동의 (ON/OFF)
   - 분석 데이터 수집 (ON/OFF)
   - 제3자 공유 거부 (ON)

// UI
┌─────────────────────────────────────┐
│ 데이터 관리                          │
├─────────────────────────────────────┤
│ [📥 전체 데이터 다운로드]            │
│                                     │
│ ⚠️ 위험 구역                         │
│ [🗑️ 세션 히스토리 삭제]             │
│ [🗑️ 모든 데이터 삭제]               │
│                                     │
│ ※ 삭제된 데이터는 복구할 수 없습니다. │
└─────────────────────────────────────┘
```

---

### 6. Session Summary Report

**파일**: `src/components/SessionSummary/SummaryReport.tsx`

```typescript
// UI (세션 종료 시 자동 표시)
┌─────────────────────────────────────┐
│ 세션 요약                            │
├─────────────────────────────────────┤
│ 날짜: 2025-10-20                    │
│ 시간: 14:30 - 15:15 (45분)         │
├─────────────────────────────────────┤
│ [Emotion Distribution Chart]        │
│ 😊 45%  😢 30%  😰 25%              │
├─────────────────────────────────────┤
│ 주요 감정: 행복                      │
│ 메시지 수: 23개                      │
│ 평균 응답 시간: 1.2초                │
├─────────────────────────────────────┤
│ AI 추천 사항                         │
│ • 긍정적인 패턴이 보입니다!          │
│ • 이 상태를 유지하세요              │
│ • 다음 세션 권장: 3일 후             │
├─────────────────────────────────────┤
│ [PDF 다운로드]  [다음 세션 예약]     │
│ [닫기]                              │
└─────────────────────────────────────┘

// 기능
- 세션 통계 요약
- 감정 분포 차트
- AI 인사이트
- PDF 다운로드
- 다음 세션 예약 연동
```

---

### 7. Error Boundary

**파일**: `src/components/ErrorBoundary/ErrorBoundary.tsx`

```typescript
// React Error Boundary
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Error tracking service (Sentry)
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}

// UI (에러 발생 시)
┌─────────────────────────────────────┐
│ 😢 문제가 발생했습니다               │
├─────────────────────────────────────┤
│ 죄송합니다. 일시적인 오류가          │
│ 발생했습니다.                        │
│                                     │
│ 잠시 후 다시 시도해주세요.           │
│                                     │
│ [새로고침]  [홈으로]                │
│                                     │
│ 에러 코드: ERR_001                  │
│ [에러 리포트 전송]                  │
└─────────────────────────────────────┘
```

---

### 8. Error Tracking Service

**파일**: `src/utils/errorTracking.ts`

```typescript
// Sentry 통합
import * as Sentry from "@sentry/react";

// 초기화
Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// 에러 로깅
export function logError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

// 사용자 피드백
export function collectFeedback(feedback: {
  name: string;
  email: string;
  message: string;
}) {
  Sentry.captureUserFeedback(feedback);
}
```

---

### 9. Loading States Optimization

**파일**: `src/components/Loading/LoadingStates.tsx`

```typescript
// 글로벌 로딩 상태
export function GlobalLoader() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-gray-700 dark:text-gray-200">로딩 중...</p>
      </div>
    </div>
  );
}

// 인라인 로딩
export function InlineLoader() {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>
  );
}

// 버튼 로딩
export function ButtonLoader() {
  return (
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
  );
}
```

---

### 10. Image Optimization

**파일**: `vite.config.ts` (업데이트)

```typescript
import imagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    react(),
    imagemin({
      gifsicle: {
        optimizationLevel: 7,
        interlaced: false,
      },
      optipng: {
        optimizationLevel: 7,
      },
      mozjpeg: {
        quality: 80,
      },
      pngquant: {
        quality: [0.8, 0.9],
        speed: 4,
      },
      svgo: {
        plugins: [
          { name: 'removeViewBox' },
          { name: 'removeEmptyAttrs', active: false },
        ],
      },
      webp: {
        quality: 80,
      },
    }),
  ],
});
```

---

### 11. Service Worker Enhancement

**파일**: `public/sw.js` (업데이트)

```javascript
// 고급 캐싱 전략
const STATIC_CACHE = 'bemore-static-v2';
const DYNAMIC_CACHE = 'bemore-dynamic-v2';
const IMAGE_CACHE = 'bemore-images-v2';

// 캐시 우선순위
const cacheStrategy = {
  static: ['/', '/index.html', '/manifest.json'],
  images: /\.(png|jpg|jpeg|svg|gif|webp)$/,
  api: /\/api\//,
};

// Network-first for API
// Cache-first for static
// Stale-while-revalidate for images

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API: Network-first
  if (cacheStrategy.api.test(url.pathname)) {
    event.respondWith(networkFirst(request));
  }
  // Images: Stale-while-revalidate
  else if (cacheStrategy.images.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
  // Static: Cache-first
  else {
    event.respondWith(cacheFirst(request));
  }
});
```

---

### 12. Performance Monitoring

**파일**: `src/utils/performance.ts` (업데이트)

```typescript
// Core Web Vitals 모니터링
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: Metric) {
  // Send to analytics service
  const body = JSON.stringify(metric);
  const url = '/api/analytics/performance';

  // Use `navigator.sendBeacon()` if available
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, { body, method: 'POST', keepalive: true });
  }
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

---

## 🎨 디자인 가이드라인

### Settings 스타일
```css
.settings-section {
  @apply bg-white dark:bg-gray-800 rounded-xl p-6 mb-4;
  @apply border border-gray-200 dark:border-gray-700;
}

.settings-row {
  @apply flex items-center justify-between py-3;
  @apply border-b border-gray-200 dark:border-gray-700 last:border-0;
}

.settings-toggle {
  @apply relative inline-flex h-6 w-11 items-center rounded-full;
  @apply transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
  @apply bg-gray-200 dark:bg-gray-700;
}

.settings-toggle.enabled {
  @apply bg-primary-500;
}
```

---

## 🧪 테스트 시나리오

### 1. Settings 변경
1. Settings 페이지 접속
2. 각 탭 전환 확인
3. 설정 변경 (테마, 폰트 크기 등)
4. 설정 저장 확인
5. 페이지 새로고침 후 설정 유지 확인

### 2. 세션 요약
1. 세션 종료
2. 요약 모달 표시
3. 차트 및 통계 확인
4. PDF 다운로드
5. 다음 세션 예약

### 3. 에러 처리
1. 임의로 에러 발생
2. Error Boundary 작동 확인
3. 에러 리포트 전송
4. 새로고침 버튼 작동

### 4. Lighthouse 테스트
1. npm run build
2. npm run preview
3. Lighthouse 실행
4. 점수 확인 (목표: 95+)

---

## 📦 필요한 Dependencies

```bash
npm install @sentry/react @sentry/tracing     # Error tracking
npm install web-vitals                        # Performance monitoring
npm install vite-plugin-imagemin             # Image optimization
npm install jspdf                             # PDF generation
npm install html2canvas                       # Screenshot for PDF
```

---

## ✅ 완료 기준

- [ ] 모든 설정 페이지 구현
- [ ] 설정 저장/로드 정상 작동
- [ ] 세션 요약 리포트 생성
- [ ] PDF 다운로드 정상 작동
- [ ] Error Boundary 작동
- [ ] Sentry 에러 트래킹 연동
- [ ] 이미지 최적화 적용
- [ ] Service Worker 고급 캐싱
- [ ] **Lighthouse 스코어 95+ 달성**
- [ ] Dark mode 모든 페이지 지원
- [ ] 모바일 반응형 완벽 지원
- [ ] 접근성 (WCAG 2.1 AA) 완벽 준수
- [ ] TypeScript 타입 안전
- [ ] Build 에러 없음
- [ ] **프로덕션 배포 준비 완료**

---

## 🎯 Lighthouse 목표 점수

```
Performance: 95+
Accessibility: 100
Best Practices: 100
SEO: 95+
PWA: 100 (Installable)
```

---

## 🚀 실행 명령어

```bash
# Phase 8 시작
"Phase 8 구현을 시작합니다. PHASE8_SETTINGS_POLISH.md의 모든 요구사항을 순서대로 구현해주세요."

# Lighthouse 테스트
npm run build
npm run preview
# Chrome DevTools > Lighthouse 실행

# 프로덕션 배포
npm run build
# dist/ 폴더를 서버에 배포
```

---

## 📝 최종 체크리스트

### 코드 품질
- [ ] ESLint 에러 0개
- [ ] TypeScript 에러 0개
- [ ] Console 경고 0개
- [ ] 사용하지 않는 코드 제거
- [ ] 주석 최신화

### 성능
- [ ] Bundle size 최적화
- [ ] 이미지 최적화 (WebP)
- [ ] Lazy loading 적용
- [ ] Code splitting 적용
- [ ] Service Worker 캐싱

### 사용자 경험
- [ ] 모든 user flow 완성
- [ ] 로딩 상태 명확
- [ ] 에러 처리 완벽
- [ ] 오프라인 지원
- [ ] Dark mode 완벽 지원

### 접근성
- [ ] ARIA labels 모든 요소
- [ ] Keyboard navigation
- [ ] Screen reader 지원
- [ ] Color contrast 4.5:1+
- [ ] Focus indicators

### 보안
- [ ] XSS 방지
- [ ] CSRF 방지
- [ ] SQL Injection 방지
- [ ] 민감 정보 암호화
- [ ] HTTPS 강제

### 배포
- [ ] 환경 변수 설정
- [ ] API URL 프로덕션 변경
- [ ] 에러 트래킹 활성화
- [ ] Analytics 활성화
- [ ] SEO 메타 태그

---

## 🎉 완료 시

**축하합니다! 🎊**

BeMore Frontend가 완성되었습니다!

이제 **실제 사용 가능한 서비스**입니다:
- ✅ 사용자 인증 & 프로필
- ✅ 세션 히스토리 & 분석
- ✅ 실시간 AI 상호작용
- ✅ 완벽한 설정 & 개인화
- ✅ 프로덕션 최적화 완료

**다음 단계**: 백엔드 서버 배포 & 도메인 연결 🚀
