# 🎯 Frontend 팀 실행 가이드

**프로젝트**: 감정 분석 시스템 - 실시간 업데이트 구현
**버전**: v1.2.0
**담당**: Frontend 팀
**소요 시간**: 15분
**상태**: ✅ 코드 완성 (배포만 진행)

---

## 📋 빠른 체크리스트 (2분)

```
□ 최신 코드 pull 완료
□ npm run build 성공
□ 빌드 폴더 배포 준비
```

완료되면 아래로 스크롤하여 "Phase 1: 검증 실행" 진행

---

## 🔍 상세 검증 프로세스

### Step 1: 코드 상태 확인 (3분)

**이미 구현된 것들을 확인하세요:**

#### 1-1: App.tsx에서 상태 선언 확인

```bash
# Terminal에서 실행:
grep -n "emotionUpdatedAt\|emotionUpdateCount" src/App.tsx
```

**예상 결과:**
```
91:  const [emotionUpdatedAt, setEmotionUpdatedAt] = useState<number | null>(null);
92:  const [emotionUpdateCount, setEmotionUpdateCount] = useState(0);
```

**확인 사항**: ✓ 두 줄 모두 있는가?

---

#### 1-2: onLandmarksMessage 핸들러 확인

```bash
grep -A 20 "if (message.type === 'emotion_update')" src/App.tsx | head -30
```

**예상 결과:**
```typescript
if (message.type === 'emotion_update') {
  const emotion = message.data?.emotion;
  const mappedEmotion = emotionMap[emotion] || null;

  const now = Date.now();
  const newCount = emotionUpdateCount + 1;  // ← 중요: 로컬 변수

  setEmotionUpdatedAt(now);
  setEmotionUpdateCount(newCount);

  console.log(`✅ Emotion updated:`, {
    emotion: mappedEmotion,
    updateCount: newCount,  // ← 로컬 변수 사용
    timestamp: new Date(now).toLocaleTimeString(),
  });

  setCurrentEmotion(mappedEmotion as EmotionType);
}
```

**확인 사항**: ✓ `const newCount = emotionUpdateCount + 1;` 있는가?

---

#### 1-3: 세션 초기화 확인

```bash
grep -B 2 -A 5 "Reset emotion state for new session" src/App.tsx
```

**예상 결과:**
```typescript
// 🎯 감정 상태 초기화 (새 세션 시작)
setCurrentEmotion(null);
setEmotionUpdatedAt(null);
setEmotionUpdateCount(0);
console.log('✅ [CRITICAL] Reset emotion state for new session');
```

**확인 사항**: ✓ 3가지 setState가 모두 있는가?

---

#### 1-4: EmotionCard Props 확인

```bash
grep -B 5 -A 5 "lastUpdatedAt=\|updateCount=" src/App.tsx | grep -A 10 "EmotionCard"
```

**예상 결과:**
```typescript
<EmotionCard
  emotion={currentEmotion}
  confidence={0.85}
  lastUpdatedAt={emotionUpdatedAt}
  updateCount={emotionUpdateCount}
/>
```

**확인 사항**: ✓ 네 개의 props가 모두 전달되는가?

---

#### 1-5: EmotionCard 컴포넌트 확인

```bash
grep -n "elapsedTime\|lastUpdatedAt\|updateCount" src/components/Emotion/EmotionCard.tsx | head -10
```

**예상 결과:**
```
5:interface EmotionCardProps {
9:  lastUpdatedAt?: number | null;
10:  updateCount?: number;
...
99:const [elapsedTime, setElapsedTime] = useState(0);
...
111:if (!lastUpdatedAt) return;
```

**확인 사항**: ✓ 모든 라인이 검색되는가?

---

### Step 2: 빌드 실행 (2분)

```bash
# 프로젝트 루트에서 실행:
npm run build

# 또는
yarn build
```

**예상 결과:**
```
✓ Built successfully in 2.5s
✓ Ready for deployment
```

**만약 빌드 실패:**
```
❌ Build failed
error: [에러 메시지]

→ src/App.tsx 또는 EmotionCard.tsx에 문법 오류가 있습니다.
→ grep 결과와 실제 코드를 비교하여 수정하세요.
```

---

### Step 3: 로컬 실행 및 로그 검증 (5분)

#### 3-1: 로컬 서버 시작

```bash
npm start
# 또는
yarn start
```

브라우저에서 앱이 열리면 다음으로 진행

---

#### 3-2: 개발자 도구 열기

```
Mac: Command + Option + I
Windows/Linux: F12 또는 Ctrl + Shift + I
```

**화면**: Console 탭을 선택

---

#### 3-3: 새로운 세션 시작

1. 앱에서 **"세션 시작"** 버튼 클릭
2. Console 탭을 보고 다음 로그가 나타나는지 확인

**기대 로그:**

```
✅ [CRITICAL] Reset emotion state for new session
  ├─ currentEmotion: null
  ├─ emotionUpdatedAt: null
  └─ emotionUpdateCount: 0

[App.tsx] 🎯 [CRITICAL] currentEmotion state changed!
  ├─ currentEmotion value: null
  ├─ currentEmotion type: undefined
  ├─ isValidEmotion: false
  └─ EmotionCard will now display with emotion=null

💚 감정 분석 중...
```

**확인 사항:**
- ✓ "Reset emotion state" 로그 있는가?
- ✓ currentEmotion이 null인가?
- ✓ emotionUpdateCount가 0인가?

---

#### 3-4: UI 확인

세션 시작 후 분석 탭을 확인:

```
기대 UI:
┌─────────────────────────┐
│   현재 감정              │
├─────────────────────────┤
│       ❓                │
│                          │
│   감정 분석 중...        │
│                          │
└─────────────────────────┘
```

**확인 사항:**
- ✓ ❓ 아이콘이 표시되는가?
- ✓ "감정 분석 중..." 텍스트가 보이는가?
- ✓ 빌딩 로더 애니메이션이 돌아가는가?

---

#### 3-5: Backend 없이 테스트 (선택사항)

Backend가 아직 준비되지 않았으면 이 단계를 건너뛰세요.

Backend가 이미 배포되었다면:

1. 다양한 표정 지어보기 (5초 이상)
2. Console을 보고 다음 로그가 나타나는지 확인

**기대 로그:**
```
👤 Landmarks message: {type: 'emotion_update', data: {emotion: 'happy'}}

🎯 [CRITICAL] emotion_update details:
  ├─ emotionValue: 'happy'
  ├─ emotionType: 'string'
  └─ isValidEmotionEnum: true

✅ Setting currentEmotion to: "happy"

✅ Emotion updated:
  ├─ emotion: happy
  ├─ updateCount: 1
  ├─ timestamp: 7:13:07 PM
  └─ timeSinceLastUpdate: first

✅ currentEmotion state updated

[App.tsx] 🎯 [CRITICAL] currentEmotion state changed!
  ├─ currentEmotion value: happy
  ├─ isValidEmotion: true
  └─ EmotionCard will now display with emotion="happy"
```

**확인 사항:**
- ✓ "emotion_update" 로그 있는가?
- ✓ emotionValue가 'happy'인가? (neutral이 아닌가?)
- ✓ updateCount가 1부터 시작하는가?

---

### Step 4: 배포 준비 (2분)

#### 4-1: 빌드 폴더 확인

```bash
# build 폴더가 생성되었는지 확인
ls -la build/

# 파일 목록:
# index.html (크기: ~100KB)
# static/js/main.xxxxx.js (메인 번들)
# static/css/main.xxxxx.css (스타일)
```

**확인 사항**: ✓ build 폴더에 파일들이 있는가?

---

#### 4-2: 배포 전 최종 확인

```bash
# 코드에 console.error나 console.warn이 있는가?
grep -r "console.error\|console.warn" src/App.tsx src/components/Emotion/EmotionCard.tsx

# 예상: 특별한 에러/경고가 없어야 함
# (단, 초기화 로그는 괜찮음)
```

---

#### 4-3: 변경사항 커밋 (선택사항)

이미 모든 코드가 main에 커밋되었다면 이 단계는 건너뛰세요.

만약 로컬 변경사항이 있다면:

```bash
git status
git add .
git commit -m "feat(emotion): add real-time emotion sync and update tracking"
git push origin main
```

---

## 🚀 배포 실행

### 배포 방법 (담당자별로 다름)

#### Vercel 배포:
```bash
# Vercel이 자동으로 main branch 감지하여 배포
# 또는 CLI로 수동 배포:
vercel --prod
```

#### AWS/Google Cloud 배포:
```bash
# 담당 DevOps 팀에 build/ 폴더 전달
# 또는 CI/CD 파이프라인에 자동 트리거
```

#### Netlify 배포:
```bash
netlify deploy --prod --dir=build
```

---

## ✅ 배포 후 검증 (실시간 모니터링)

### 검증 1: 프로덕션 환경에서 콘솔 확인

배포 완료 후:

1. 프로덕션 URL 방문
2. F12 (개발자 도구)
3. Console 탭 선택
4. 세션 시작

**확인 사항:**
- ✓ "Reset emotion state" 로그 보이는가?
- ✓ 에러 메시지가 없는가?

---

### 검증 2: 감정 업데이트 테스트

Backend가 이미 배포되었다면:

1. 다양한 표정 지어보기
2. Console에서 "Emotion updated" 로그 확인
3. UI에서 감정이 변하는지 확인

**기대 결과:**
```
현재 감정   ✨ 실시간 업데이트 (3회)

😊
행복
긍정적인 에너지가 느껴지네요!

마지막 업데이트: 2초 전 • 총 3회
```

---

### 검증 3: 성능 모니터링

DevTools → Performance 탭:

1. 녹화 시작
2. 세션 시작 + 표정 변경
3. 녹화 중지
4. 결과 확인

**기대:**
- 프레임 레이트: 60fps (버벅거림 없음)
- 응답 시간: < 100ms
- 메모리: < 50MB 증가

---

## 📊 배포 완료 체크리스트

```
□ Step 1: 코드 상태 확인 완료
  └─ 5가지 grep 검색 모두 성공

□ Step 2: 빌드 실행 성공
  └─ "Built successfully" 메시지

□ Step 3: 로컬 실행 검증
  └─ Console 로그 모두 확인

□ Step 4: 배포 준비 완료
  └─ build/ 폴더 생성됨

□ 배포 실행 완료
  └─ 프로덕션 URL에 배포됨

□ 배포 후 검증 완료
  └─ 프로덕션에서 로그 확인
```

---

## 🔧 트러블슈팅

### 문제 1: "npm run build가 실패한다"

```
Error: Cannot find module 'EmotionCard'
또는
Syntax error in App.tsx

해결:
1. git status 확인
2. 최신 코드를 pull했는가?
3. npm install 다시 실행
4. node_modules 삭제 후 npm install
```

---

### 문제 2: "Console에 'Reset emotion state' 로그가 안 나온다"

```
원인: 코드가 최신 상태가 아님

해결:
1. src/App.tsx에서 grep 확인
2. setCurrentEmotion(null) 코드가 있는가?
3. setEmotionUpdatedAt(null) 코드가 있는가?
4. setEmotionUpdateCount(0) 코드가 있는가?
```

---

### 문제 3: "감정 업데이트 로그가 안 나온다"

```
원인: Backend에서 emotion_update를 보내지 않음

확인 사항:
1. Backend가 배포되었는가?
2. Backend 로그에서 emotion_update 전송 확인
3. Frontend WebSocket 연결 상태 확인
```

---

### 문제 4: "UI가 깜빡인다"

```
원인: 과도한 re-render

해결:
1. React DevTools Profiler 실행
2. render 횟수 확인
3. EmotionCard의 useEffect dependencies 확인
   → [lastUpdatedAt] 외에 다른 의존성 없는가?
```

---

## 📞 지원

배포 중 문제 발생 시:

- **Frontend Lead**: [연락처]
- **DevOps**: [연락처]
- **Slack**: #deployment

---

## 📝 배포 기록

| 날짜 | 시간 | 배포자 | 상태 | 비고 |
|------|------|--------|------|------|
| 2025-10-25 | HH:MM | [이름] | ✅ 성공 | Phase 1 완료 |

---

## 다음 단계

✅ **Phase 1 (Frontend) 완료**

⏳ **Phase 2 (Backend)**: 1-2시간 내 Gemini 프롬프트 개선

⏳ **Phase 3 (통합 테스트)**: Backend 배포 후 30분

---

