# 🔍 BeMore Frontend - 프로젝트 검증 시스템

**생성일**: 2025-01-11
**버전**: 1.0
**목적**: 프로젝트 전체 기능, 라우팅, 백엔드 통합을 자동/수동으로 검증

---

## 📋 개요

이 프로젝트는 3가지 검증 도구를 제공합니다:

1. **자동화된 E2E 테스트** (Playwright) - 사용자 경로, 인증, 에러 처리
2. **개발자 검증 대시보드** (DevTools 페이지) - 시스템 상태 체크, 수동 테스트
3. **통합 검증 스크립트** (`npm run verify`) - 빠른 프로젝트 검증

---

## 🚀 사용 방법

### 1. 빠른 검증 (1-2분)

```bash
npm run verify
```

**검증 항목**:
- ✅ 환경 변수 확인
- ✅ 파일 구조 검증
- ✅ TypeScript 컴파일
- ✅ ESLint 검사
- ✅ 프로덕션 빌드
- ✅ API 헬스 체크

**출력**:
- 콘솔: 컬러풀한 검증 결과
- JSON: `verification-report.json` (CI/CD용)
- HTML: `verification-report.html` (브라우저용)

### 2. 전체 검증 (E2E 포함, 5-10분)

```bash
npm run verify:full
```

**포함**:
- `npm run verify` (프로젝트 검증)
- `npm run e2e` (E2E 테스트)

### 3. CI/CD 검증

```bash
npm run verify:ci
```

**포함**:
- `npm run verify` (프로젝트 검증)
- `npm run build` (빌드 테스트)
- `npm run e2e` (E2E 테스트)

### 4. DevTools 대시보드 (수동 검증)

```bash
npm run dev
# → http://localhost:5173/dev-tools
```

**기능**:
- 📊 시스템 상태 체크 (API, WebSocket, 인증, Feature Flags)
- 🧭 라우트 네비게이션 테스트 (모든 페이지 빠른 이동)
- 🔌 API 테스트 도구 (각 엔드포인트 테스트)
- ✅ 수동 검증 체크리스트 (진행 상황 추적)
- 📋 환경 정보 표시

**주의**: 개발 환경(`npm run dev`)에서만 접근 가능합니다.

---

## 🧪 E2E 테스트

### E2E 테스트 실행

```bash
# 일반 모드
npm run e2e

# UI 모드 (대화형)
npm run e2e:ui
```

### E2E 테스트 목록

#### 1. User Journey (사용자 경로)
**파일**: `tests/e2e/comprehensive/user-journey.spec.ts`

**시나리오**:
- 로그인 → 대시보드 → 세션 → 히스토리 → 로그아웃
- 보호된 라우트 리다이렉트 검증
- 브라우저 뒤로가기/앞으로가기 동작
- 페이지 새로고침 시 상태 유지

#### 2. Auth Flow (인증 흐름)
**파일**: `tests/e2e/comprehensive/auth-flow.spec.ts`

**시나리오**:
- 로그인 성공/실패
- 회원가입 성공/실패 (중복 이메일, 약한 비밀번호)
- 로그아웃
- 세션 유지 (페이지 새로고침, 탭 간 세션 공유)

#### 3. Error Handling (에러 처리)
**파일**: `tests/e2e/comprehensive/error-handling.spec.ts`

**시나리오**:
- 네트워크 오프라인
- API 타임아웃
- 서버 에러 (500, 503)
- Rate Limit (429)
- 에러 복구 및 사용자 피드백

### Mock API 사용

E2E 테스트는 **실제 프로덕션 API** 또는 **Mock API** 모드를 지원합니다.

**Mock API 모드 활성화**:
```bash
export VITE_TEST_MODE=mock
npm run e2e
```

**실제 API 모드** (기본값):
```bash
export VITE_TEST_MODE=production
npm run e2e
```

**Mock API 설정**:
- `tests/fixtures/mock-api.ts` - Mock 응답 데이터
- `tests/fixtures/test-users.ts` - 테스트 사용자 데이터

---

## 📊 검증 리포트

### 콘솔 출력 예시

```
======================================================================
🔍  PROJECT VERIFICATION REPORT
======================================================================

📅 Timestamp: 2025-01-11T10:30:00.000Z
🖥️  Environment: development
📦 Node: v20.10.0 | NPM: 10.2.5

----------------------------------------------------------------------
📊 VERIFICATION RESULTS:
----------------------------------------------------------------------

✅ Environment Variables
   환경 변수 파일 확인 완료
   Details: Required: VITE_API_URL

✅ File Structure
   파일 구조 검증 완료
   Details: Verified 7 essential files

✅ TypeScript Compilation
   TypeScript 컴파일 성공

⚠️ ESLint
   ESLint 경고 3개 발견
   Details: ...

✅ Production Build
   프로덕션 빌드 성공

⚠️ API Health Check
   API 연결 실패 (백엔드가 실행 중인지 확인하세요)
   Details: URL: http://localhost:8000

----------------------------------------------------------------------
📈 SUMMARY:
----------------------------------------------------------------------
Total Tests: 6
Passed: 4
Failed: 0
Warnings: 2

Pass Rate: 67%
======================================================================

⚠️  검증 완료 (경고 있음)
```

### JSON 리포트

**파일**: `verification-report.json`

```json
{
  "timestamp": "2025-01-11T10:30:00.000Z",
  "environment": {
    "nodeVersion": "v20.10.0",
    "npmVersion": "10.2.5",
    "mode": "development"
  },
  "results": [
    {
      "name": "Environment Variables",
      "status": "pass",
      "message": "환경 변수 파일 확인 완료",
      "details": "Required: VITE_API_URL..."
    }
  ],
  "summary": {
    "total": 6,
    "passed": 4,
    "failed": 0,
    "warnings": 2
  }
}
```

### HTML 리포트

**파일**: `verification-report.html`

브라우저에서 열어 시각적으로 결과 확인 가능.

---

## ⚙️ 환경 설정

### 환경 변수

**`.env` (개발 환경)**:
```bash
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_ANALYTICS_ENABLED=false
```

**`.env.local` (백엔드 통합 테스트)**:
```bash
VITE_API_URL=https://bemorebackend.onrender.com
VITE_WS_URL=wss://bemorebackend.onrender.com
VITE_ANALYTICS_ENABLED=true
```

**E2E 테스트 환경**:
```bash
VITE_TEST_MODE=mock  # 또는 production
```

### Playwright 설정

**파일**: `playwright.config.ts`

기본 설정:
- Base URL: `http://localhost:4173` (preview 서버)
- Timeout: 60초
- 병렬 실행: 활성화
- HTML 리포트: `playwright-report/`

---

## 🔧 트러블슈팅

### 문제 1: TypeScript 컴파일 에러

**증상**: `npm run verify` 실행 시 TypeScript 에러

**해결**:
```bash
# TypeScript 컴파일 단독 실행
npm run typecheck

# 에러 수정 후 재검증
npm run verify
```

### 문제 2: API 헬스 체크 실패

**증상**: "API 연결 실패 (백엔드가 실행 중인지 확인하세요)"

**원인**:
- 백엔드 서버가 실행 중이 아님
- 잘못된 `VITE_API_URL` 설정
- 네트워크 문제

**해결**:
```bash
# 백엔드 URL 확인
echo $VITE_API_URL

# .env 파일 확인
cat .env

# 백엔드 서버 실행 (별도 터미널)
cd ../backend
npm run dev
```

### 문제 3: E2E 테스트 실패

**증상**: E2E 테스트가 실패하거나 타임아웃

**해결**:
```bash
# Preview 서버 실행 (E2E 테스트 전)
npm run build
npm run preview  # http://localhost:4173

# 별도 터미널에서 E2E 실행
npm run e2e

# UI 모드로 디버깅
npm run e2e:ui
```

### 문제 4: DevTools 페이지 404

**증상**: `/dev-tools` 접근 시 404 또는 리다이렉트

**원인**: 프로덕션 빌드에서는 DevTools가 비활성화됨

**해결**:
```bash
# 개발 서버에서만 접근 가능
npm run dev  # http://localhost:5173/dev-tools
```

---

## 📁 파일 구조

```
BeMoreFrontend/
├── src/
│   └── pages/
│       └── DevTools.tsx              # DevTools 대시보드
├── tests/
│   ├── fixtures/
│   │   ├── mock-api.ts               # Mock API 응답
│   │   └── test-users.ts             # 테스트 사용자
│   └── e2e/
│       └── comprehensive/
│           ├── user-journey.spec.ts  # 사용자 경로 테스트
│           ├── auth-flow.spec.ts     # 인증 테스트
│           └── error-handling.spec.ts # 에러 처리 테스트
├── scripts/
│   └── verify-project.ts             # 검증 스크립트
├── verification-report.json          # 검증 결과 (JSON)
├── verification-report.html          # 검증 결과 (HTML)
└── VERIFICATION_SYSTEM.md            # 이 문서
```

---

## 🎯 CI/CD 통합

### GitHub Actions 예시

```yaml
name: Verification

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run verification
        run: npm run verify:ci

      - name: Upload reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: verification-reports
          path: |
            verification-report.json
            verification-report.html
            playwright-report/
```

---

## 📞 문의

**Slack**: #frontend-dev
**이슈 트래커**: [GitHub Issues](https://github.com/your-org/bemore-frontend/issues)

---

**작성**: BeMore 프론트엔드 팀
**최종 업데이트**: 2025-01-11
**문서 버전**: 1.0
