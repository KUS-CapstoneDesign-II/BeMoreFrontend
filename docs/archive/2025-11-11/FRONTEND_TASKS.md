# 프론트엔드 임시 조치 및 개선 작업

**작성일**: 2025-01-XX
**우선순위**: P0 (긴급) → P1 (이번 주) → P2 (다음 주)
**관련 이슈**: 프로덕션 콘솔 에러 분석 결과

---

## 🔴 P0: CORS 에러 대응 - 사용자 경험 개선 (긴급)

### 현상
백엔드 CORS 설정 부재로 모든 API 호출이 차단되는 상황입니다.

```
Access to XMLHttpRequest at 'https://bemorebackend.onrender.com/api/auth/login'
from origin 'https://be-more-frontend.vercel.app' has been blocked by CORS policy
```

### 영향도
- **심각도**: Critical (P0)
- **현재 상태**: 로그인/인증 완전 차단
- **사용자 영향**: 서비스 사용 불가

### 프론트엔드 임시 조치

백엔드 CORS 수정이 완료될 때까지 사용자 경험을 개선하기 위한 임시 조치입니다.

#### 1. 사용자 친화적 에러 메시지 표시

**파일**: `src/services/api.ts` (또는 API 호출 로직이 있는 파일)

**현재 코드**:
```typescript
// 기존: 일반적인 에러 처리
try {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    // ...
  });
} catch (error) {
  console.error('Login failed:', error);
  throw error;
}
```

**개선 코드**:
```typescript
import { ERROR_MESSAGES } from '../utils/messageHelper';

async function loginAPI(credentials: LoginCredentials) {
  try {
    const response = await fetch('https://bemorebackend.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // CORS 에러 감지
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      Logger.error('❌ CORS error detected - backend configuration required');

      // 사용자 친화적 메시지
      throw new Error(
        '서버 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요. ' +
        '문제가 계속되면 관리자에게 문의하세요.'
      );
    }

    // 일반 에러
    Logger.error('❌ API call failed:', error);
    throw error;
  }
}
```

#### 2. 전역 에러 핸들러 추가 (선택 사항)

**파일**: `src/services/api.ts`

```typescript
/**
 * Global API error handler with CORS detection
 */
export function handleAPIError(error: unknown, context: string): never {
  // CORS/Network error detection
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    const userMessage =
      '🌐 서버와 연결할 수 없습니다.\n\n' +
      '현재 서버 설정 작업이 진행 중입니다. 잠시 후 다시 시도해주세요.\n\n' +
      '문제가 계속되면 support@example.com으로 문의하세요.';

    Logger.error(`❌ CORS error in ${context}`);
    throw new Error(userMessage);
  }

  // HTTP errors
  if (error instanceof Error) {
    Logger.error(`❌ ${context} failed:`, error.message);
    throw error;
  }

  // Unknown errors
  Logger.error(`❌ ${context} failed with unknown error:`, error);
  throw new Error('알 수 없는 오류가 발생했습니다');
}

// 사용 예시
async function loginAPI(credentials: LoginCredentials) {
  try {
    // ... fetch logic
  } catch (error) {
    handleAPIError(error, 'Login');
  }
}
```

#### 3. 백엔드 CORS 수정 완료 후 테스트

**테스트 체크리스트**:
- [ ] Vercel 프로덕션에서 로그인 시도
- [ ] 브라우저 콘솔에서 CORS 에러 사라짐 확인
- [ ] 세션 시작/종료 정상 작동 확인
- [ ] 모든 API 엔드포인트 호출 성공 확인
- [ ] 개발자 도구 Network 탭에서 응답 헤더 확인:
  - `Access-Control-Allow-Origin: https://be-more-frontend.vercel.app`
  - `Access-Control-Allow-Credentials: true`

---

## 🟡 P1: Analytics 엔드포인트 임시 비활성화 (이번 주)

### 현상
백엔드에 Analytics 엔드포인트가 없어 반복적인 404 에러가 발생합니다.

```
POST /api/analytics/vitals 404
POST /api/analytics/alert 404
```

### 영향도
- **심각도**: Medium (P1)
- **현재 상태**: 서비스는 작동하지만 콘솔 에러 누적
- **사용자 영향**: 없음 (내부 로그만 발생)

### 프론트엔드 조치

#### 옵션 1: Feature Flag로 비활성화 (권장)

**파일**: `src/config/env.ts` 또는 `src/config/features.ts`

```typescript
// 신규 파일 생성 또는 기존 env.ts에 추가
export const FEATURE_FLAGS = {
  ANALYTICS_ENABLED: false, // 백엔드 준비 시 true로 변경
  PERFORMANCE_MONITORING: false,
  ERROR_REPORTING: true, // 로컬 로깅은 유지
} as const;
```

**파일**: `src/services/analytics.ts` (또는 해당 로직이 있는 파일)

```typescript
import { FEATURE_FLAGS } from '../config/features';
import { Logger } from '../config/env';

export async function sendVitals(metric: string, value: number, pathname: string) {
  // Feature flag 체크
  if (!FEATURE_FLAGS.ANALYTICS_ENABLED) {
    Logger.info('📊 Analytics disabled - would send:', { metric, value, pathname });
    return; // 백엔드 호출 스킵
  }

  // 실제 API 호출
  try {
    await fetch('/api/analytics/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metric, value, pathname }),
    });
  } catch (error) {
    Logger.error('❌ Analytics API failed:', error);
    // 에러를 throw하지 않아 앱 동작에 영향 없음
  }
}

export async function sendAlert(metric: string, value: number, threshold: number) {
  if (!FEATURE_FLAGS.ANALYTICS_ENABLED) {
    Logger.warn('⚠️ Performance alert (analytics disabled):', { metric, value, threshold });
    return;
  }

  try {
    await fetch('/api/analytics/alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metric, value, threshold }),
    });
  } catch (error) {
    Logger.error('❌ Alert API failed:', error);
  }
}
```

#### 옵션 2: 환경 변수로 제어

**파일**: `.env.production`

```bash
# Analytics 기능 제어
VITE_ANALYTICS_ENABLED=false
VITE_ANALYTICS_ENDPOINT=https://bemorebackend.onrender.com/api/analytics
```

**파일**: `src/config/env.ts`

```typescript
export const Config = {
  ANALYTICS_ENABLED: import.meta.env.VITE_ANALYTICS_ENABLED === 'true',
  ANALYTICS_ENDPOINT: import.meta.env.VITE_ANALYTICS_ENDPOINT || '',
} as const;
```

**파일**: `src/services/analytics.ts`

```typescript
import { Config } from '../config/env';

export async function sendVitals(metric: string, value: number, pathname: string) {
  if (!Config.ANALYTICS_ENABLED) {
    return; // 환경 변수로 제어
  }

  await fetch(`${Config.ANALYTICS_ENDPOINT}/vitals`, {
    // ...
  });
}
```

#### 백엔드 엔드포인트 구현 완료 후

1. **Feature flag 활성화**:
   ```typescript
   // src/config/features.ts
   export const FEATURE_FLAGS = {
     ANALYTICS_ENABLED: true, // ✅ 활성화
   };
   ```

2. **테스트 체크리스트**:
   - [ ] `/api/analytics/vitals` 엔드포인트 200 응답 확인
   - [ ] `/api/analytics/alert` 엔드포인트 200 응답 확인
   - [ ] 브라우저 콘솔에서 404 에러 사라짐 확인
   - [ ] Core Web Vitals 데이터 백엔드 저장 확인
   - [ ] 임계값 초과 시 알림 발송 확인

---

## 🟢 P2: PerformanceObserver 호환성 개선 (다음 주)

### 현상
브라우저 API 호환성 문제로 경고가 발생합니다.

```
The PerformanceObserver does not support buffered flag with the entryTypes argument
```

### 영향도
- **심각도**: Low (P2)
- **현재 상태**: 경고만 발생, 기능은 정상 작동
- **사용자 영향**: 없음

### 프론트엔드 개선

**파일**: `src/utils/performanceMonitor.ts` (또는 해당 로직이 있는 파일)

**현재 코드** (추정):
```typescript
// 문제: buffered 옵션과 entryTypes 동시 사용
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // ...
  }
});

observer.observe({
  entryTypes: ['navigation', 'paint', 'measure'],
  buffered: true // ⚠️ 일부 브라우저에서 경고 발생
});
```

**개선 코드**:
```typescript
// 해결: type별로 개별 observer 생성 또는 호환성 체크
function setupPerformanceObserver() {
  try {
    // 브라우저 지원 여부 체크
    if (!window.PerformanceObserver) {
      Logger.warn('⚠️ PerformanceObserver not supported');
      return;
    }

    // 옵션 1: type별 개별 observer (권장)
    const navigationObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        handleNavigationEntry(entry);
      }
    });
    navigationObserver.observe({ type: 'navigation', buffered: true });

    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        handlePaintEntry(entry);
      }
    });
    paintObserver.observe({ type: 'paint', buffered: true });

    Logger.info('✅ PerformanceObserver initialized');
  } catch (error) {
    Logger.warn('⚠️ PerformanceObserver setup failed:', error);
    // Fallback: 기존 Performance API 사용
    usePerformanceAPIFallback();
  }
}

// Fallback 방식
function usePerformanceAPIFallback() {
  // window.performance.getEntriesByType() 사용
  const navigationEntries = performance.getEntriesByType('navigation');
  const paintEntries = performance.getEntriesByType('paint');

  navigationEntries.forEach(handleNavigationEntry);
  paintEntries.forEach(handlePaintEntry);
}
```

**대안: 호환성 체크 후 조건부 사용**:
```typescript
function createCompatibleObserver(entryType: string, handler: (entry: PerformanceEntry) => void) {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach(handler);
  });

  try {
    // type 옵션 지원 여부 확인
    observer.observe({ type: entryType, buffered: true });
  } catch (error) {
    // Fallback: entryTypes 사용 (buffered 없이)
    Logger.warn(`⚠️ Fallback to entryTypes for ${entryType}`);
    observer.observe({ entryTypes: [entryType] });
  }

  return observer;
}

// 사용
const navigationObserver = createCompatibleObserver('navigation', handleNavigationEntry);
const paintObserver = createCompatibleObserver('paint', handlePaintEntry);
```

---

## 📋 작업 우선순위 및 일정

### 즉시 (오늘)
- [ ] **P0**: API 에러 핸들러 개선 (CORS 대응)
- [ ] **P0**: 사용자 친화적 에러 메시지 적용
- [ ] **P0**: 로컬 및 스테이징 환경에서 테스트

### 이번 주
- [ ] **P1**: Analytics feature flag 추가
- [ ] **P1**: Analytics 호출 임시 비활성화
- [ ] **P1**: 백엔드 팀에게 엔드포인트 구현 일정 확인
- [ ] 백엔드 CORS 수정 완료 시 즉시 프로덕션 테스트

### 다음 주
- [ ] **P2**: PerformanceObserver 호환성 개선
- [ ] **P2**: 브라우저 호환성 테스트 (Chrome, Firefox, Safari, Edge)
- [ ] **P2**: 경고 메시지 사라짐 확인

---

## 🧪 테스트 가이드

### CORS 수정 후 검증 (P0)

**테스트 환경**: Vercel 프로덕션 (`https://be-more-frontend.vercel.app`)

**테스트 시나리오**:
1. 프로덕션 사이트 접속
2. 로그인 시도
3. 브라우저 개발자 도구 → Console 탭 확인
   - ✅ CORS 에러 없음
   - ✅ API 호출 성공 (200 응답)
4. Network 탭 확인
   - ✅ `Access-Control-Allow-Origin` 헤더 존재
   - ✅ `Access-Control-Allow-Credentials: true`
5. 세션 시작/종료 테스트
   - ✅ 세션 정상 시작
   - ✅ 세션 정상 종료

### Analytics 활성화 후 검증 (P1)

**테스트 시나리오**:
1. Feature flag 활성화 (`ANALYTICS_ENABLED: true`)
2. 브라우저 새로고침
3. 개발자 도구 → Network 탭 확인
   - ✅ `/api/analytics/vitals` POST 200 응답
   - ✅ `/api/analytics/alert` POST 200 응답
4. Console 탭 확인
   - ✅ 404 에러 없음
   - ✅ Analytics 로그 정상 출력

### PerformanceObserver 개선 후 검증 (P2)

**테스트 브라우저**: Chrome, Firefox, Safari, Edge

**테스트 시나리오**:
1. 각 브라우저에서 사이트 접속
2. Console 탭 확인
   - ✅ PerformanceObserver 경고 없음
   - ✅ 성능 메트릭 정상 수집
3. Performance API 동작 확인
   - ✅ Navigation Timing 정상
   - ✅ Paint Timing 정상
   - ✅ Core Web Vitals 수집 정상

---

## 🤝 백엔드 팀 협업

### CORS 수정 완료 알림 받을 때

1. **즉시 프로덕션 테스트 실행**
2. 테스트 결과 백엔드 팀에게 피드백
3. 이슈 발생 시 즉시 공유 (브라우저 콘솔 스크린샷 포함)

### Analytics 엔드포인트 구현 완료 알림 받을 때

1. Feature flag 활성화 (`ANALYTICS_ENABLED: true`)
2. Git commit & push
3. Vercel 자동 배포 대기
4. 배포 완료 후 검증 테스트 실행
5. 결과 백엔드 팀에게 공유

---

## 📞 연락 및 이슈 트래킹

**긴급 문의**: [프론트엔드 담당자 연락처]
**이슈 트래커**: GitHub Issues 또는 Jira
**Slack 채널**: #frontend #backend-integration

**관련 문서**:
- [BACKEND_URGENT_ISSUES.md](./BACKEND_URGENT_ISSUES.md) - 백엔드 긴급 이슈
- [BACKEND_COMMUNICATION.md](./BACKEND_COMMUNICATION.md) - P1 완료 상세 내용

---

**예상 작업 시간**:
- P0 CORS 대응: 30분~1시간
- P1 Analytics 비활성화: 20분~30분
- P2 PerformanceObserver 개선: 1~2시간

**TL;DR**:
1. ⚠️ **P0 즉시**: CORS 에러 핸들러 개선하여 사용자 친화적 메시지 표시
2. 📊 **P1 이번 주**: Analytics 호출 임시 비활성화하여 404 에러 제거
3. 🔧 **P2 다음 주**: PerformanceObserver 브라우저 호환성 개선
