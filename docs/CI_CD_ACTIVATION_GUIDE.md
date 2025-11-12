# 🚀 CI/CD 파이프라인 활성화 가이드

**작성일**: 2025-01-12
**대상**: BeMore Frontend GitHub Repository
**소요 시간**: 30분

---

## 📋 목차

1. [사전 준비사항](#사전-준비사항)
2. [GitHub Secrets 설정](#github-secrets-설정)
3. [워크플로우 수동 실행](#워크플로우-수동-실행)
4. [첫 자동 실행 테스트](#첫-자동-실행-테스트)
5. [모니터링 및 검증](#모니터링-및-검증)
6. [트러블슈팅](#트러블슈팅)

---

## 사전 준비사항

### 필요한 정보

1. **프로덕션 계정 정보**
   - TEST_EMAIL: 프로덕션 환경에서 사용할 테스트 계정 이메일
   - TEST_PASSWORD: 해당 계정의 비밀번호

2. **환경 URL (이미 설정됨)**
   - VITE_APP_URL: https://be-more-frontend.vercel.app
   - VITE_API_URL: https://bemorebackend.onrender.com

3. **GitHub Repository 접근 권한**
   - Settings 탭 접근 권한
   - Secrets and variables 설정 권한

### 현재 상태 확인

✅ **이미 완료된 항목**:
- [x] GitHub Actions 워크플로우 파일 생성 (`.github/workflows/e2e-session.yml`)
- [x] E2E 검증 스크립트 작성 (`scripts/verify-session-flow.ts`)
- [x] 프로덕션 환경 검증 성공 (172.5초, All Phases Passed)
- [x] Render 콜드 스타트 대응 전략 구현

⏳ **활성화 필요**:
- [ ] GitHub Secrets 설정
- [ ] 워크플로우 수동 실행 테스트
- [ ] PR 자동 코멘트 검증

---

## GitHub Secrets 설정

### 1. GitHub Repository 이동

```
https://github.com/[YOUR_ORG]/BeMoreFrontend
```

### 2. Settings → Secrets and variables → Actions 이동

1. Repository 페이지에서 **Settings** 탭 클릭
2. 왼쪽 사이드바에서 **Secrets and variables** → **Actions** 클릭

### 3. Repository Secrets 추가

**Add repository secret** 버튼을 클릭하여 다음 4개의 Secret을 추가합니다:

#### Secret 1: VITE_APP_URL

```
Name: VITE_APP_URL
Value: https://be-more-frontend.vercel.app
```

**설명**: 프론트엔드 프로덕션 URL

#### Secret 2: VITE_API_URL

```
Name: VITE_API_URL
Value: https://bemorebackend.onrender.com
```

**설명**: 백엔드 API 프로덕션 URL

#### Secret 3: TEST_EMAIL

```
Name: TEST_EMAIL
Value: [실제 테스트 계정 이메일]
```

**설명**: E2E 테스트에 사용할 계정 이메일

**예시**:
- ✅ `final2025@test.com` (실제 작동 확인된 계정)
- ✅ `e2e-test@bemore.com` (전용 테스트 계정)
- ❌ `test@example.com` (실제 계정 아님)

#### Secret 4: TEST_PASSWORD

```
Name: TEST_PASSWORD
Value: [실제 테스트 계정 비밀번호]
```

**설명**: E2E 테스트 계정의 비밀번호

**예시**:
- ✅ `Test1234` (실제 작동 확인된 비밀번호)
- ❌ `password123` (기본값, 실제 작동 안함)

### 4. Secrets 설정 확인

모든 Secret 추가 후 다음 4개가 표시되어야 합니다:

```
VITE_APP_URL       Updated [날짜]
VITE_API_URL       Updated [날짜]
TEST_EMAIL         Updated [날짜]
TEST_PASSWORD      Updated [날짜]
```

---

## 워크플로우 수동 실행

### 1. Actions 탭 이동

```
https://github.com/[YOUR_ORG]/BeMoreFrontend/actions
```

### 2. 워크플로우 선택

1. 왼쪽 사이드바에서 **E2E Session Flow Verification** 클릭
2. 오른쪽 상단 **Run workflow** 버튼 클릭

### 3. 실행 옵션 선택

**Environment to test**: `production` (기본값)

**Run workflow** 버튼 클릭하여 실행 시작

### 4. 실행 모니터링

**예상 실행 시간**: 약 5분

**단계별 예상 시간**:
1. Checkout code: 5초
2. Setup Node.js: 10초
3. Install dependencies: 30초
4. Install Playwright browsers: 45초
5. Wait for deployment: 0초 (수동 실행 시 스킵)
6. Run session flow verification: **172.5초 (2분 52초)**
7. Upload artifacts: 10초

**총 예상 시간**: 약 4분 30초

### 5. 결과 확인

**성공 시 표시**:
```
✅ E2E Session Flow Test
   All jobs completed successfully
```

**실패 시 표시**:
```
❌ E2E Session Flow Test
   Some jobs failed
```

---

## 첫 자동 실행 테스트

### 트리거 조건

워크플로우는 다음 경우 자동 실행됩니다:

1. **Push to main**:
   - `src/**` 파일 변경
   - `scripts/verify-session-flow.ts` 파일 변경
   - `.github/workflows/e2e-session.yml` 파일 변경

2. **Pull Request to main**:
   - `src/**` 파일 변경
   - `scripts/verify-session-flow.ts` 파일 변경

### 테스트 방법

#### 방법 1: 간단한 코드 변경

```bash
# 1. 테스트용 브랜치 생성
git checkout -b test/ci-cd-activation

# 2. README.md에 줄바꿈 추가
echo "" >> README.md

# 3. Commit & Push
git add README.md
git commit -m "test: trigger CI/CD workflow"
git push origin test/ci-cd-activation

# 4. GitHub에서 PR 생성
```

#### 방법 2: src 파일 주석 추가

```typescript
// src/main.tsx에 주석 추가
// Test: CI/CD workflow activation - 2025-01-12
```

```bash
git add src/main.tsx
git commit -m "test: trigger CI/CD with src file change"
git push origin test/ci-cd-activation
```

### PR 자동 코멘트 확인

PR 생성 후 약 5분 뒤, 다음과 같은 자동 코멘트가 추가됩니다:

```markdown
## ✅ E2E Session Flow Verification

**Status**: PASSED
**Browser**: chromium
**Environment**: https://be-more-frontend.vercel.app

### Test Results
✅ All 5 phases passed successfully!

**Phases:**
- Phase 1: Session Start API Call
- Phase 2: WebSocket 3-Channel Connection
- Phase 3: MediaPipe Face Mesh Initialization
- Phase 4: Real-time Data Transmission
- Phase 5: Session End with Cleanup

📊 [Download HTML Report](...)
📸 [View Screenshots](...)
```

---

## 모니터링 및 검증

### 1. 아티팩트 다운로드

**Actions 탭에서**:
1. 실행된 워크플로우 클릭
2. 하단 **Artifacts** 섹션에서 다운로드:
   - `session-flow-report-chromium` - HTML 리포트
   - `session-flow-screenshots-chromium` - 스크린샷 (5개)

### 2. HTML 리포트 확인

다운로드한 `session-flow-report.html`을 브라우저에서 열어 확인:

**확인 항목**:
- ✅ All Phases Passed
- ✅ 총 시간: ~172.5초
- ✅ Phase 1: 156.6초 (콜드 스타트 대응)
- ✅ Phase 2-5: 정상 실행

### 3. 스크린샷 확인

다운로드한 `flow-screenshots.zip` 압축 해제:

**파일 목록**:
- `phase-1-session-start.png`
- `phase-2-websocket-connection.png`
- `phase-3-mediapipe-init.png`
- `phase-4-realtime-data.png`
- `phase-5-session-end.png`

### 4. 성공률 모니터링

**첫 주 목표**: 80% 성공률 (Render 콜드 스타트 고려)
**안정화 후**: 95%+ 성공률

**실패 원인 분석**:
- Render 콜드 스타트 타임아웃: 대부분의 실패 원인
- Backend DB 연결 문제: 드물게 발생
- Vercel 배포 지연: 거의 없음

---

## 트러블슈팅

### 문제 1: "Secrets not set" 에러

**증상**:
```
Error: TEST_EMAIL is required but not set
```

**원인**: GitHub Secrets 미설정

**해결**:
1. GitHub Repository Settings → Secrets 확인
2. 4개 Secret 모두 설정되었는지 확인
3. Secret 이름 철자 확인 (대소문자 구분)

---

### 문제 2: "Login failed" 에러

**증상**:
```
Phase 1 failed: Login response status 401
```

**원인**: 잘못된 TEST_EMAIL 또는 TEST_PASSWORD

**해결**:
1. 로컬에서 계정 확인:
   ```bash
   VITE_APP_URL=https://be-more-frontend.vercel.app \
   VITE_API_URL=https://bemorebackend.onrender.com \
   TEST_EMAIL=your@email.com \
   TEST_PASSWORD=yourpassword \
   npm run verify:session
   ```
2. 성공 확인 후 GitHub Secrets 업데이트

---

### 문제 3: "Render cold start timeout"

**증상**:
```
Phase 1 failed: Backend warmup timeout after 90 seconds
```

**원인**: Render Free Tier가 15분 이상 sleep 상태

**해결**:
1. 워크플로우 재실행 (Backend가 깨어났을 가능성 높음)
2. 정상 동작: 96.5% 성공률 목표 (3.5% 실패 허용)
3. 반복 실패 시: Render Paid Plan 검토 ($7/월)

---

### 문제 4: "Playwright browser not found"

**증상**:
```
Error: Chromium browser is not installed
```

**원인**: Playwright 설치 단계 실패

**해결**:
워크플로우 파일 확인:
```yaml
- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium
```

재실행으로 대부분 해결됨.

---

### 문제 5: "Deployment wait timeout"

**증상**:
```
Verification failed immediately after deployment
```

**원인**: Vercel 배포 120초 대기 시간 부족

**해결**:
워크플로우 파일에서 대기 시간 증가:
```yaml
- name: Wait for deployment (production)
  run: |
    echo "Waiting 180s for Vercel deployment..."
    sleep 180  # 120초 → 180초
```

---

## 성공 체크리스트

활성화 완료 확인:

### 설정 단계
- [ ] GitHub Secrets 4개 모두 설정 완료
- [ ] Secret 값 정확성 확인 (로컬 테스트 성공)
- [ ] Repository Settings 접근 권한 확인

### 테스트 단계
- [ ] 워크플로우 수동 실행 성공
- [ ] HTML 리포트 다운로드 및 확인
- [ ] 스크린샷 5개 모두 생성 확인
- [ ] All Phases Passed 결과 확인

### 자동화 단계
- [ ] PR 생성 시 자동 실행 확인
- [ ] PR 자동 코멘트 생성 확인
- [ ] Push to main 자동 실행 확인 (선택)

### 모니터링 단계
- [ ] 첫 주 성공률 80% 이상 확인
- [ ] 실패 원인 분석 및 기록
- [ ] 필요 시 워크플로우 개선

---

## 다음 단계

CI/CD 활성화 완료 후:

1. **모니터링 설정**
   - 주간 성공률 리포트 생성
   - 실패 알림 개선 (Slack, Discord 등)

2. **워크플로우 확장**
   - Multi-browser 테스트 (Firefox, Safari) 추가
   - Staging 환경 테스트 추가

3. **성능 최적화**
   - Backend warmup 시간 단축
   - 캐싱 전략 개선

---

## 참고 문서

- [GitHub Actions Workflow 파일](./.github/workflows/e2e-session.yml)
- [E2E Testing Strategy](./E2E_TESTING_STRATEGY.md)
- [Phase 12 Completion Report](./PHASE_12_E2E_COMPLETION.md)
- [Verification System](../VERIFICATION_SYSTEM.md)

---

**작성**: BeMore 프론트엔드 팀
**최종 업데이트**: 2025-01-12
**예상 완료 시간**: 30분
**난이도**: ⭐⭐☆☆☆ (쉬움)

---

**🎉 CI/CD 파이프라인 활성화로 자동화된 품질 보증을 시작하세요!**
