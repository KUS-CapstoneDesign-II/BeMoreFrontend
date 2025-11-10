# Frontend VAD 통합: 즉시 실행 체크리스트

**지금 바로 확인하고 실행하세요!**

---

## 🚀 RIGHT NOW (지금 바로)

### ✅ Step 1: 현재 상황 확인 (2분)

```bash
# 터미널에서
cd /Users/_woo_s.j/Desktop/woo/workspace/BeMoreFrontend

# 1. 파일 확인
ls -la src/utils/vadUtils.ts
ls -la src/App.tsx
ls -la src/components/Session/ReportPage.tsx

# 결과: 파일이 있어야 함 ✅
```

### ✅ Step 2: 코드 확인 (3분)

**A. App.tsx에 VAD 핸들러가 있는가?**

```bash
grep -n "onVoiceMessage" src/App.tsx | head -1
```

**결과 예시**:
```
144:    onVoiceMessage: (message) => {
```

✅ 있으면 OK! ❌ 없으면 문제

**B. ReportPage에 VAD 섹션이 있는가?**

```bash
grep -n "음성 활동 분석" src/components/Session/ReportPage.tsx
```

**결과 예시**:
```
234:                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🎤 음성 활동 분석</h2>
```

✅ 있으면 OK! ❌ 없으면 문제

### ✅ Step 3: 앱 실행 (2분)

```bash
# 개발 서버 시작
npm run dev

# 또는 프로덕션 빌드
npm run build
npm run preview
```

결과:
- ✅ 에러 없음
- ❌ 에러 있음 → 해결 필요

---

## 💻 IN APP (앱 실행 후)

### ✅ Step 4: Console 모니터링 (1분)

1. 브라우저 F12 열기
2. Console 탭 클릭
3. 필터 입력: `VAD` 또는 `voice message`

### ✅ Step 5: 세션 시작 (1분)

1. BeMore 앱 로드
2. "상담 시작" 클릭
3. 세션 활성화 대기

### ✅ Step 6: 메시지 수신 확인 (2분)

Console에서 다음을 찾으세요:

#### ✅ 성공 신호
```
🎤 Voice message: {type: 'vad_analysis', data: {...}}
```

- 있으면 ✅ Backend가 메시지 보냄
- 없으면 ❌ Backend가 아직 미전송

#### ✅ 데이터 처리 신호
```
✅ VAD metrics processed successfully
  speechRatio: 65.0%
  pauseRatio: 35.0%
```

- 있으면 ✅ Frontend가 처리함
- 없으면 ❌ 처리 실패

### ✅ Step 7: UI 확인 (2분)

세션 종료 후 Report Page 확인:

```
화면에 보여야 할 것:
┌─────────────────────────────────┐
│ 🎤 음성 활동 분석                │
├──────────────┬──────────────────┤
│ 발화 비율    │ 65.0%            │
│ 침묵 비율    │ 35.0%            │
│ 평균 침묵    │ 2.5s             │
│ 최장 침묵    │ 8.0s             │
│ 발화 버스트  │ 12               │
│ 침묵 구간    │ 11               │
└──────────────┴──────────────────┘
```

- 보이면 ✅ OK!
- 안 보이면 ❌ 문제

---

## 🔍 TROUBLESHOOTING (문제 해결)

### ❌ 문제: "음성 활동 데이터가 없습니다" 표시

**원인 분석**:

```
1️⃣ WebSocket 연결 확인
   Console: Ctrl+F → "Voice CONNECTED"

   ✅ 있으면: WebSocket OK
   ❌ 없으면: WebSocket 연결 실패

2️⃣ Backend 메시지 확인
   Console: 필터 "voice message"

   ✅ 있으면: Backend가 보냄
   ❌ 없으면: Backend가 미전송

3️⃣ 메시지 형식 확인
   Console에서 메시지 클릭 → data 살펴보기

   ✅ 필드 있으면: OK
   ❌ 필드 없으면: Backend에 요청
```

### ❌ 문제: NaN 표시

**원인**: 데이터 형식 불일치

```
Console 에러 확인:
Ctrl+F → "recommendation"

다음을 시도:
1. Backend 메시지 형식 로깅해달라 요청
2. vadUtils.ts의 mapVADMetrics() 수정 필요할 수 있음
```

### ❌ 문제: Console 에러

**해결 방법**:

```bash
1. 전체 에러 메시지 복사
2. 이 파일 열기: FRONTEND_NEXT_STEPS_VAD_INTEGRATION.md
3. "문제 발생 시 체크리스트" 섹션 확인
4. 각 항목 순서대로 확인
```

---

## 📊 3가지 시나리오별 액션

### 시나리오 1: 메시지는 오는데 NaN 표시

```
상황:
  ✅ 🎤 Voice message 로그 있음
  ❌ 하지만 발화 비율: NaN%

해결:
  1. Backend 메시지 형식 확인
  2. vadUtils.ts 매핑 함수 수정
  3. 다시 테스트
```

### 시나리오 2: 메시지 안 옴

```
상황:
  ✅ WebSocket 연결됨
  ❌ 🎤 Voice message 로그 없음

해결:
  1. Backend에 메시지 전송 확인 요청
  2. Network 탭에서 WebSocket 메시지 확인
  3. Backend에서 VAD 처리 확인
```

### 시나리오 3: 모든 게 작동함

```
상황:
  ✅ 메시지 옴
  ✅ 데이터 처리됨
  ✅ UI에 표시됨

축하합니다! 🎉

다음: E2E 테스트 및 배포 준비
```

---

## ⚙️ 빠른 수정 가이드

### 문제: Backend 필드명이 다름

**발견**:
```
Console: 🔍 VAD Format Analysis
detectedFields: ['speech_ratio', 'pause_ratio']  # snake_case!
```

**수정**:
```
파일: src/utils/vadUtils.ts
함수: mapVADMetrics()

변경 전:
const fieldMapping = {
  speechRatio: 'speechRatio',
  pauseRatio: 'pauseRatio',
}

변경 후 (snake_case 지원):
const fieldMapping = {
  speech_ratio: 'speechRatio',
  pause_ratio: 'pauseRatio',
  // ... 나머지 필드
}

수정 후:
npm run dev
테스트
```

### 문제: Backend 비율이 0-100

**발견**:
```
Console: recommendation: 'Normalize speechRatio from 0-100 to 0.0-1.0'
```

**수정**:
```
파일: src/utils/vadUtils.ts
함수: normalizeVADMetrics()

이미 처리되어 있는지 확인:
const speechRatio = typeof ratios.speechRatio === 'number'
  ? Math.max(0, Math.min(1, ratios.speechRatio > 100
    ? ratios.speechRatio / 100
    : ratios.speechRatio))
  : undefined;

만약 없으면 추가
```

---

## 📞 Backend에게 보낼 메시지

만약 메시지가 안 오거나 형식이 다르면:

```
안녕하세요!

Frontend에서 VAD 데이터를 기다리고 있습니다.

확인해주실 사항:

1. VAD 메시지를 WebSocket으로 보내고 있나요?
   메시지 타입: 'vad_analysis' 또는 'vad_realtime'

2. 실제로 보내는 메시지 샘플을 콘솔에 로깅해주실 수 있나요?

3. 메시지가 매분마다 오나요? 아니면 실시간인가요?

Frontend는 이미 모든 준비가 완료되었습니다.
메시지만 받으면 자동으로 처리되어 리포트에 표시됩니다!

감사합니다.
```

---

## 🎯 Success Criteria

**다음이 모두 작동하면 성공!** ✅

```
필수:
  ✅ Console에 🎤 Voice message 로그
  ✅ ✅ VAD metrics processed successfully 로그
  ✅ ReportPage에 🎤 음성 활동 분석 섹션
  ✅ 6개 지표 모두 숫자로 표시 (NaN 아님)
  ✅ Dark mode에서도 정상

선택사항:
  ☐ SessionSummaryReport에도 VAD 섹션
  ☐ VAD Store 활용
  ☐ VAD Timeline Chart
```

---

## ⏱️ 시간 추정

| 작업 | 시간 |
|------|------|
| 현황 확인 | 5분 |
| 앱 실행 | 2분 |
| Console 모니터링 | 2분 |
| 문제 없으면: 테스트 & 배포 | 15분 |
| 문제 있으면: 해결 | 30-60분 |

**총 소요시간: 20분 ~ 2시간**

---

## 📋 최종 체크리스트

```
지금 바로:
  [ ] src/utils/vadUtils.ts 파일 확인
  [ ] src/App.tsx에 VAD 핸들러 확인
  [ ] npm run dev 실행
  [ ] F12로 Console 열기

앱 실행 후:
  [ ] 🎤 Voice message 로그 확인
  [ ] ✅ VAD metrics processed 로그 확인
  [ ] ReportPage에 데이터 표시 확인
  [ ] Dark mode 확인

모두 완료:
  [ ] 문서화
  [ ] 커밋
  [ ] 배포 준비
```

---

## 🚀 준비 완료?

**모든 준비가 되었습니다!**

Backend에서 메시지를 보내기만 하면 Frontend에서는 자동으로:
- ✅ 메시지 수신
- ✅ 데이터 변환
- ✅ 검증
- ✅ 저장
- ✅ UI 표시

**Let's go!** 🎉

