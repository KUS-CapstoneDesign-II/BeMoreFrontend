# Frontend 작업 가이드: VAD 데이터 수신 및 통합

**작성일**: 2024-11-04
**상황**: Backend VAD 처리 완료 → Frontend 수신 및 표시 단계
**목표**: Backend VAD 데이터를 Frontend에서 수신하여 리포트에 완벽하게 표시

---

## 📋 현재 상황 체크리스트

### ✅ 이미 완료된 것
- [x] VAD 유틸리티 생성 (`src/utils/vadUtils.ts`)
- [x] App.tsx 메시지 핸들러 구현 (`src/App.tsx:146-197`)
- [x] ReportPage VAD 섹션 추가 (`src/components/Session/ReportPage.tsx:232-290`)
- [x] SessionSummaryReport VAD 섹션 추가 (`src/components/Session/SessionSummaryReport.tsx:250-321`)
- [x] VAD 타입 정의 (`src/types/index.ts:85-94`)
- [x] 테스트 케이스 작성 (33개 통과)

### ⏳ 지금 해야 할 것
- [ ] Backend VAD 메시지 형식 확인
- [ ] 실제 메시지 수신 테스트
- [ ] vadUtils 함수 동작 검증
- [ ] UI에서 제대로 표시되는지 확인
- [ ] 에러 처리 검증
- [ ] 추가 기능 구현 (선택사항)
- [ ] E2E 통합 테스트

---

## 🎯 Phase 1: Backend 메시지 형식 확인 (5분)

### Step 1.1: Backend에 확인해야 할 사항

```
🎯 Backend 팀에게 확인할 것:

1. VAD 메시지 형식
   - 어떤 필드명을 사용하는가? (camelCase/snake_case)
   - 비율은 0-100인가 아니면 0.0-1.0인가?
   - 시간 값은 초(s)인가 밀리초(ms)인가?

2. 메시지 전송 타이밍
   - 언제부터 메시지를 보내나?
   - 얼마나 자주 보내나? (매분? 실시간?)
   - 세션 종료 시에도 보내나?

3. 샘플 메시지
   - 실제로 보내는 메시지 1-2개 로깅해달라
```

### Step 1.2: Backend 메시지 샘플 보관

Backend에서 받은 샘플을 여기에 저장:

```javascript
// 받은 메시지 샘플
const backendVADMessage = {
  // Backend가 실제로 보내는 형식
  type: 'vad_analysis',
  data: {
    // 필드들을 여기에 기록
  }
};
```

---

## 🔍 Phase 2: 콘솔 로그 모니터링 (실시간)

### Step 2.1: DevTools 열기

```bash
# Chrome/Edge/Firefox에서
F12 또는 오른쪽 클릭 → 검사 → Console 탭
```

### Step 2.2: VAD 데이터 필터링

Console에서 다음 필터 사용:

```
필터 입력창: VAD
또는: voice message
```

### Step 2.3: 다음을 모니터링하세요

#### ✅ 성공 신호
```
🎤 Voice message: {type: 'vad_analysis', data: {...}}
🔍 VAD Format Analysis
  detectedFields: ['speechRatio', 'pauseRatio', ...]
  detectedRatios: [...]

✅ VAD metrics processed successfully
  speechRatio: 65.0%
  pauseRatio: 35.0%
  avgPauseDuration: 2.50s
  longestPause: 8.00s
```

#### ❌ 실패 신호
```
❌ VAD metrics validation failed
  receivedDataKeys: ['speech_ratio', 'pause_ratio', ...]
  recommendations: ['Normalize speech_ratio...']

⚠️ VAD data is not an object
❌ Invalid VAD metrics structure
```

---

## 🧪 Phase 3: 실제 메시지 수신 테스트 (15분)

### Step 3.1: 브라우저에서 테스트

1. **BeMore 애플리케이션 실행**
   ```bash
   npm run dev
   # 또는 프로덕션 서버 접속
   ```

2. **DevTools → Console 탭 열기**

3. **세션 시작**
   - 홈 페이지에서 "상담 시작" 클릭
   - 세션이 활성화될 때까지 대기

4. **메시지 수신 확인**
   - Console에서 위의 "성공 신호"가 보이는지 확인
   - Speech ratio, pause ratio 등의 값이 표시되는지 확인

### Step 3.2: 문제가 있으면

#### 메시지가 안 오는 경우
```
✓ WebSocket 연결 확인: console에서 "✅ 🟢 Voice CONNECTED" 검색
✓ Backend가 메시지를 보내고 있는지 확인
✓ Network 탭에서 WebSocket 메시지 확인
```

#### 메시지는 오지만 NaN 표시
```
✓ Backend 메시지 형식과 Frontend 기대값 비교
✓ vadUtils의 매핑 함수가 필드를 제대로 변환하는지 확인
✓ Console의 "recommendations" 메시지 확인
```

---

## 🔧 Phase 4: 코드 검증 (10분)

### Step 4.1: App.tsx 메시지 핸들러 확인

**파일**: `src/App.tsx:146-197`

```typescript
// 확인할 부분
onVoiceMessage: (message) => {
  console.log('🎤 Voice message:', message);  // ← 여기서 Backend 형식 확인

  if (message.type === 'vad_analysis' || message.type === 'vad_realtime') {
    const analysis = analyzeVADFormat(message.data);  // ← 형식 분석
    const vadMetrics = transformVADData(message.data, {
      mapFields: true,                 // ← 필드명 변환
      normalizeRanges: true,           // ← 범위 정규화
      convertTimeUnits: true,          // ← 시간 단위 변환
      validateOutput: true,            // ← 검증
    });

    if (vadMetrics) {
      setVadMetrics(vadMetrics);       // ← 상태 저장
      Logger.info('✅ VAD metrics processed successfully', {...});
    }
  }
}
```

**확인 체크리스트**:
- [x] `transformVADData` 함수가 있는가?
- [x] 옵션 4개가 모두 true인가?
- [x] `setVadMetrics`로 상태를 저장하는가?

### Step 4.2: vadUtils 함수 검증

**파일**: `src/utils/vadUtils.ts`

```typescript
// 다음 함수들이 있는지 확인
export function analyzeVADFormat(data: unknown): VADFormatAnalysis
export function transformVADData(data: unknown, options?: TransformOptions): VADMetrics | null
export function mapVADMetrics(data: Record<string, unknown>): Record<string, unknown>
export function normalizeVADMetrics(data: Record<string, unknown>): Record<string, unknown>
export function convertTimeUnits(data: Record<string, unknown>): Record<string, unknown>
export function validateVADMetrics(metrics: unknown): boolean
```

**테스트 방법**:
```javascript
// Browser Console에서 실행
import { transformVADData } from '@/utils/vadUtils';

// Backend 데이터 형식으로 테스트
const testData = {
  speech_ratio: 65,
  pause_ratio: 35,
  average_pause_duration: 2.5,  // 초
  longest_pause: 8,
  speech_burst_count: 12,
  average_speech_burst: 5.5,
  pause_count: 11,
  summary: '자연스러운 발화'
};

const result = transformVADData(testData, {
  mapFields: true,
  normalizeRanges: true,
  convertTimeUnits: true,
  validateOutput: true
});

console.log(result);
// 예상 결과:
// {
//   speechRatio: 0.65,
//   pauseRatio: 0.35,
//   averagePauseDuration: 2500,  // ms로 변환
//   longestPause: 8000,
//   speechBurstCount: 12,
//   averageSpeechBurst: 5500,
//   pauseCount: 11,
//   summary: '자연스러운 발화'
// }
```

---

## 📊 Phase 5: UI 확인 (5분)

### Step 5.1: ReportPage VAD 섹션 확인

**위치**: `src/components/Session/ReportPage.tsx:232-290`

세션 완료 후 Report Page 확인:

```
✓ 🎤 음성 활동 분석 섹션이 보이는가?
✓ 발화 비율: XX%
✓ 침묵 비율: XX%
✓ 평균 침묵 시간: X.Xs
✓ 최장 침묵 시간: X.Xs
✓ 발화 버스트: XX
✓ 침묵 구간: XX
✓ 분석: [분석 텍스트]
```

### Step 5.2: SessionSummaryReport VAD 섹션 확인

**위치**: `src/components/Session/SessionSummaryReport.tsx:250-321`

Summary Report 모달에서 확인:

```
✓ 🎤 음성 활동 분석 섹션
✓ 같은 6개 지표가 3열 그리드로 표시되는가?
✓ 분석 요약이 표시되는가?
```

### Step 5.3: Dark Mode 확인

```
✓ Dark mode 토글 (Cmd+Shift+L 또는 UI 토글)
✓ 색상이 제대로 조정되는가?
✓ 텍스트가 읽기 쉬운가?
```

---

## 🐛 Phase 6: 에러 처리 검증 (10분)

### Step 6.1: 예상되는 에러 시나리오

#### 시나리오 1: Backend 메시지 필드 누락

```
Backend가 이렇게 보냄:
{
  type: 'vad_analysis',
  data: {
    speechRatio: 0.65
    // pauseRatio 누락!
  }
}

Frontend 행동:
❌ VAD metrics validation failed
  - Missing field: pauseRatio
  - Report: "음성 활동 데이터가 없습니다"
```

**확인**: ReportPage에서 fallback UI가 표시되는가?

#### 시나리오 2: Backend 데이터 타입 오류

```
Backend가 이렇게 보냄:
{
  type: 'vad_analysis',
  data: {
    speechRatio: "65"  // 문자열!
    pauseRatio: null   // null!
  }
}

Frontend 행동:
❌ VAD metrics validation failed
  - Invalid type for speechRatio
  - Invalid type for pauseRatio
```

**확인**: Console에 에러가 나타나는가?

#### 시나리오 3: Backend 메시지 형식 다름

```
Backend가 다른 형식으로 보냄:
{
  type: 'voice_analysis'  // 'vad_analysis' 아님!
  data: {...}
}

Frontend 행동:
- 메시지 무시됨
- Report: "음성 활동 데이터가 없습니다"
```

**확인**: 메시지 타입이 일치하는가?

### Step 6.2: Console 에러 확인

```javascript
// Console에서 검색
Errors containing: "VAD"
Warnings containing: "validation"
```

모든 에러가 예상된 것인지 확인하세요.

---

## 📈 Phase 7: 추가 기능 (선택사항)

### Step 7.1: VAD Store 활용 (권장)

현재는 App.tsx의 로컬 상태(`vadMetrics`)를 사용하고 있습니다.
전역 상태로 옮기면 다른 컴포넌트에서도 접근 가능합니다.

```typescript
// src/stores/vadStore.ts 활용
import { useVADStore } from '@/stores/vadStore';

// App.tsx에서
const updateVADStore = useVADStore((state) => state.updateMetrics);

if (vadMetrics) {
  updateVADStore(vadMetrics);  // ← 추가
  setVadMetrics(vadMetrics);    // 기존
}
```

### Step 7.2: VAD Timeline Chart (선택사항)

ReportPage에 시계열 차트 추가:

```typescript
// src/components/Charts/VADTimeline.tsx 이미 있음
// ReportPage에서 사용:

<VADTimeline
  data={vadTimeSeries}
  metrics={vadMetrics}
/>
```

### Step 7.3: 심리 분석 통합 (선택사항)

VAD 메트릭을 심리 지표와 연결:

```
발화 비율 65% + 발화 버스트 12개
→ 적극적인 참여, 좋은 engagement

평균 침묵 2.5초 + 최장 침묵 8초
→ 생각할 시간을 가짐, 신중함
```

---

## ✅ Phase 8: 최종 검증 체크리스트

### 메시지 수신
- [ ] Console에서 "🎤 Voice message" 로그 확인
- [ ] Backend 형식과 Frontend 기대값 일치
- [ ] 메시지 타입 확인 ('vad_analysis' 또는 'vad_realtime')

### 데이터 변환
- [ ] Console에서 "🔍 VAD Format Analysis" 로그 확인
- [ ] "✅ VAD metrics processed successfully" 메시지 확인
- [ ] 변환된 값이 올바른지 확인 (범위, 단위)

### UI 표시
- [ ] ReportPage에 VAD 섹션 표시
- [ ] SessionSummaryReport에 VAD 섹션 표시
- [ ] 모든 6개 지표가 표시됨
- [ ] 값이 정확함
- [ ] Dark mode에서도 정상

### 에러 처리
- [ ] 메시지 없음 → "음성 활동 데이터가 없습니다" 표시
- [ ] 형식 오류 → Console 에러 메시지 표시
- [ ] 유효성 검사 실패 → 데이터 무시, UI 안전함

### 성능
- [ ] 메시지 처리 시간 < 5ms
- [ ] 렌더링 지연 없음
- [ ] 메모리 누수 없음

---

## 🚀 배포 전 최종 확인

### 커밋 확인
```bash
git log --oneline | head -5

# 다음 커밋이 있는지 확인:
# - feat(vad): implement VAD data transformation
# - feat(utils): add comprehensive VAD validation
# - fix(reportpage): add VAD metrics display
# - fix(summary): add VAD analysis section
```

### 테스트 실행
```bash
# VAD 유틸리티 테스트
npm test -- vadUtils.test.ts

# 전체 테스트
npm test

# 빌드
npm run build
```

### 타입 체크
```bash
npm run typecheck
```

모두 통과해야 함!

---

## 📞 문제 발생 시 체크리스트

### 문제: "음성 활동 데이터가 없습니다" 표시

**확인순서**:
1. [ ] WebSocket 연결됨? (`✅ 🟢 Voice CONNECTED`)
2. [ ] Backend가 메시지 보냄? (Network 탭 확인)
3. [ ] 메시지 타입 맞음? (`'vad_analysis'` 확인)
4. [ ] 필드 모두 있음? (Backend 메시지 로그 확인)
5. [ ] 필드 타입 맞음? (숫자 확인)

### 문제: NaN 표시

**확인순서**:
1. [ ] vadUtils 함수 로드됨?
2. [ ] `normalizeRanges: true`인가?
3. [ ] `convertTimeUnits: true`인가?
4. [ ] Backend 범위 0-100인가? (0.0-1.0 아닌가?)
5. [ ] Backend 단위 초인가? (밀리초 아닌가?)

### 문제: Console 에러

**확인순서**:
1. [ ] 에러 메시지 전체 읽음
2. [ ] `recommendations` 항목 확인
3. [ ] Backend 형식 변경 요청
4. [ ] vadUtils 함수 수정
5. [ ] 테스트

---

## 📋 요약: Frontend가 할 일

| 순서 | 작업 | 소요시간 | 상태 |
|------|------|---------|------|
| 1 | Backend 메시지 형식 확인 | 5분 | ⏳ 진행 중 |
| 2 | Console 모니터링 | 실시간 | ⏳ 진행 중 |
| 3 | 메시지 수신 테스트 | 15분 | ⏳ 대기 중 |
| 4 | 코드 검증 | 10분 | ⏳ 대기 중 |
| 5 | UI 확인 | 5분 | ⏳ 대기 중 |
| 6 | 에러 처리 검증 | 10분 | ⏳ 대기 중 |
| 7 | 추가 기능 (선택) | 변수 | ⏳ 선택사항 |
| 8 | 최종 검증 & 배포 | 15분 | ⏳ 대기 중 |

**전체 소요시간**: ~1.5-2시간 (선택사항 제외)

---

## 🎯 다음 액션

1. **지금**: Backend에 메시지 형식 확인 요청
2. **메시지 도착 시**: Console에서 로그 확인
3. **데이터 보이면**: UI 테스트 시작
4. **테스트 통과 시**: 배포 준비

**준비 완료!** 🚀

