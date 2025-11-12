# 🚀 CI/CD 파이프라인 활성화 - Quick Start

**소요 시간**: 10분
**난이도**: ⭐☆☆☆☆ (매우 쉬움)

---

## Step 1: 테스트 계정 확인 (2분)

로컬에서 계정이 정상 작동하는지 먼저 확인합니다:

```bash
# 프로덕션 환경에서 작동하는 계정으로 테스트
TEST_EMAIL=final2025@test.com \
TEST_PASSWORD=Test1234 \
./scripts/verify-test-account.sh
```

**예상 출력**:
```
========================================
🔍 테스트 계정 검증 스크립트
========================================

📋 설정 정보:
  API URL: https://bemorebackend.onrender.com
  APP URL: https://be-more-frontend.vercel.app
  TEST_EMAIL: final2025@test.com
  TEST_PASSWORD: ******* (숨김)

1️⃣ 백엔드 서버 확인...
   ✅ 백엔드 서버 정상 (HTTP 200)

2️⃣ 로그인 테스트...
   HTTP Status: 200
   ✅ 로그인 성공!
   📝 accessToken: eyJhbGciOiJIUzI1NiIsIn... (일부)

========================================
✅ 테스트 계정 검증 완료!
========================================
```

✅ **성공** → Step 2로 진행
❌ **실패** → 다른 계정으로 재시도

---

## Step 2: GitHub Secrets 설정 (3분)

### 2-1. GitHub Repository Settings 이동

```
https://github.com/[YOUR_ORG]/BeMoreFrontend/settings/secrets/actions
```

또는:
1. Repository 페이지 → **Settings** 탭
2. 왼쪽 사이드바 → **Secrets and variables** → **Actions**

### 2-2. Repository Secrets 추가

**New repository secret** 버튼 클릭 후 4개 추가:

#### 1. VITE_APP_URL
```
Name: VITE_APP_URL
Secret: https://be-more-frontend.vercel.app
```

#### 2. VITE_API_URL
```
Name: VITE_API_URL
Secret: https://bemorebackend.onrender.com
```

#### 3. TEST_EMAIL
```
Name: TEST_EMAIL
Secret: final2025@test.com
```
(또는 Step 1에서 검증한 이메일)

#### 4. TEST_PASSWORD
```
Name: TEST_PASSWORD
Secret: Test1234
```
(또는 Step 1에서 검증한 비밀번호)

### 2-3. 확인

4개 Secret이 모두 표시되어야 합니다:
```
✅ VITE_APP_URL       Updated [날짜]
✅ VITE_API_URL       Updated [날짜]
✅ TEST_EMAIL         Updated [날짜]
✅ TEST_PASSWORD      Updated [날짜]
```

---

## Step 3: 워크플로우 수동 실행 (5분)

### 3-1. Actions 탭 이동

```
https://github.com/[YOUR_ORG]/BeMoreFrontend/actions
```

### 3-2. 워크플로우 실행

1. 왼쪽 사이드바: **E2E Session Flow Verification** 클릭
2. 오른쪽 상단: **Run workflow** 버튼 클릭
3. Environment: **production** (기본값)
4. **Run workflow** 버튼 클릭

### 3-3. 실행 모니터링

**예상 시간**: 약 4분 30초

**진행 상황**:
```
⏳ Checkout code                      (5초)
⏳ Setup Node.js                       (10초)
⏳ Install dependencies                (30초)
⏳ Install Playwright browsers         (45초)
⏳ Run session flow verification       (172.5초) ⭐
⏳ Upload artifacts                    (10초)
```

### 3-4. 결과 확인

**성공 시**:
```
✅ E2E Session Flow Test
   All checks have passed
```

**실패 시**:
```
❌ E2E Session Flow Test
   Some checks failed
```

실패해도 당황하지 마세요! Render 콜드 스타트로 인한 실패일 가능성이 높습니다.
→ **Re-run all jobs** 클릭하여 재실행하면 대부분 성공합니다.

---

## Step 4: 아티팩트 다운로드 (선택)

워크플로우 실행 페이지 하단:

**Artifacts** 섹션:
- 📊 `session-flow-report-chromium` - HTML 리포트
- 📸 `session-flow-screenshots-chromium` - 스크린샷 5개

다운로드하여 브라우저에서 확인할 수 있습니다.

---

## ✅ 완료 체크리스트

활성화 완료 확인:

### 설정 단계
- [ ] 로컬에서 테스트 계정 검증 성공
- [ ] GitHub Secrets 4개 모두 설정 완료
- [ ] Secret 이름 정확 (대소문자 구분)

### 테스트 단계
- [ ] 워크플로우 수동 실행 성공
- [ ] All Phases Passed 확인
- [ ] HTML 리포트 다운로드 완료

### 자동화 확인 (선택)
- [ ] src 파일 변경 후 PR 생성
- [ ] PR 자동 코멘트 생성 확인

---

## 🔧 문제 해결

### "Login failed" 에러

**원인**: 잘못된 계정 정보

**해결**:
```bash
# 다른 계정으로 재시도
TEST_EMAIL=other@test.com \
TEST_PASSWORD=OtherPassword \
./scripts/verify-test-account.sh
```

### "Render cold start timeout"

**원인**: Backend가 15분 이상 sleep 상태

**해결**: **Re-run all jobs** 클릭 (거의 항상 성공)

### "Secrets not set" 에러

**원인**: Secret 이름 오타

**해결**:
- Repository Settings → Secrets 다시 확인
- 정확히 대문자로 입력했는지 확인
  - ❌ `test_email`
  - ✅ `TEST_EMAIL`

---

## 🎉 축하합니다!

CI/CD 파이프라인이 활성화되었습니다!

**이제 자동으로**:
- ✅ main 브랜치 push 시 E2E 테스트 자동 실행
- ✅ PR 생성 시 E2E 테스트 자동 실행 + 코멘트
- ✅ HTML 리포트 자동 생성 (30일 보관)
- ✅ 스크린샷 자동 캡처 (30일 보관)

---

## 📚 다음 단계

**추천**:
1. **PR 테스트**: 간단한 파일 변경 후 PR 생성하여 자동 실행 확인
2. **모니터링**: 주간 성공률 확인 (목표: 95%+)
3. **확장**: Multi-browser 테스트, Staging 환경 추가

**상세 문서**:
- [CI_CD_ACTIVATION_GUIDE.md](./CI_CD_ACTIVATION_GUIDE.md) - 전체 가이드 (30분)
- [PHASE_12_E2E_COMPLETION.md](./PHASE_12_E2E_COMPLETION.md) - Phase 12 완료 보고서

---

**작성**: BeMore 프론트엔드 팀
**최종 업데이트**: 2025-01-12
**예상 완료 시간**: 10분
**난이도**: ⭐☆☆☆☆ (매우 쉬움)
