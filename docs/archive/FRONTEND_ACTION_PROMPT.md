# 💻 프론트엔드 팀 - 감정 분석 시스템 실행 프롬프트

**읽는 시간**: 10분
**실행 시간**: 3-4일 (Phase별 1일씩)
**긴급도**: 🔥 매우 높음 (백엔드 팀이 DATABASE_URL 설정을 기다리고 있습니다)

---

## ⚡ 한줄 요약

**지금 바로 하세요**:
1. FRONTEND_EMOTION_SETUP.md 읽기 (5분)
2. FRONTEND_IMPLEMENTATION_PROMPT.md 읽기 (30분)
3. Phase 1 시작 (1일)

---

## 🎯 전체 구현 계획 (3-4일)

```
Day 1: Phase 1 - WebSocket 메시지 처리 (1일)
Day 2: Phase 2 - EmotionTimeline 컴포넌트 (1일)
Day 3: Phase 3 - EmotionSummary 컴포넌트 (1일)
Day 4: Phase 4 - 통합 및 테스트 (0.5-1일)

총: 3-4일
```

---

## 📋 Phase별 실행 가이드

### 🔴 Phase 1: WebSocket 감정 데이터 처리 (1일)

**목표**: 백엔드에서 보내는 emotion_update 메시지를 수신하고 상태 관리하기

**파일**: `src/App.tsx`

**해야 할 일**:

```typescript
// 1. WebSocket 리스너 추가
useEffect(() => {
  if (!socket) return;

  const handleEmotionUpdate = (data) => {
    console.log('📊 Emotion received:', data);
    setEmotions(prev => [...prev, {
      emotion: data.emotion,
      timestamp: data.timestamp,
      frameCount: data.frameCount,
      sttSnippet: data.sttSnippet
    }]);
  };

  socket.on('emotion_update', handleEmotionUpdate);

  return () => {
    socket.off('emotion_update', handleEmotionUpdate);
  };
}, [socket]);

// 2. emotions 상태 추가
const [emotions, setEmotions] = useState([
  // { emotion: 'happy', timestamp: ..., frameCount: ..., sttSnippet: ... }
]);
```

**검증 방법**:
- [ ] 브라우저 콘솔 필터: "emotion_update"
- [ ] 10초마다 메시지가 나타나는가?
- [ ] 콘솔에 감정 데이터가 정확하게 출력되는가?
- [ ] 에러가 없는가?

**완료 기준**:
```
✅ 콘솔에서 emotion_update 메시지 10초마다 출력
✅ emotions 배열에 데이터가 쌓임
✅ 에러 없음
```

---

### 🟠 Phase 2: EmotionTimeline 컴포넌트 (1일)

**목표**: 실시간 감정을 가로 스크롤 가능한 타임라인으로 표시

**파일**: `src/components/Session/EmotionTimeline.tsx` (새로 만들기)

**구조**:
```
┌─────────────────────────────────────┐
│ 감정 타임라인                        │
├─────────────────────────────────────┤
│ 😊  😢  😊  😊  😠  😊  🤩       │
│ happy sad happy happy angry...      │
│ 14:23 14:33 14:43 14:53 15:03 ... │
└─────────────────────────────────────┘
```

**핵심 요구사항**:
- 감정을 색깔 있는 원형으로 표시
- 6가지 감정 각각 다른 색상
- 호버 시 감정명과 시간 표시
- 가로 스크롤 가능
- 반응형 디자인

**색상 매핑**:
```javascript
const emotionConfig = {
  happy: {
    color: '#FFD700',
    emoji: '😊',
    label: '행복',
    ko: '행복'
  },
  sad: {
    color: '#3B82F6',
    emoji: '😢',
    label: '슬픔',
    ko: '슬픔'
  },
  angry: {
    color: '#EF4444',
    emoji: '😠',
    label: '분노',
    ko: '분노'
  },
  anxious: {
    color: '#FB923C',
    emoji: '😰',
    label: '불안',
    ko: '불안'
  },
  excited: {
    color: '#A78BFA',
    emoji: '🤩',
    label: '흥분',
    ko: '흥분'
  },
  neutral: {
    color: '#D1D5DB',
    emoji: '😐',
    label: '중립',
    ko: '중립'
  }
};
```

**검증 방법**:
- [ ] 감정이 실시간으로 화면에 나타나는가?
- [ ] 색상이 정확한가?
- [ ] 호버 시 감정명과 시간이 표시되는가?
- [ ] 가로 스크롤이 작동하는가?
- [ ] 모바일에서도 보이는가?

**완료 기준**:
```
✅ 세션 중 감정이 실시간으로 표시됨
✅ 감정마다 올바른 색상 표시
✅ 호버 효과 작동
✅ 모바일 반응형 정상
✅ 에러 없음
```

---

### 🟡 Phase 3: EmotionSummary 컴포넌트 (1일)

**목표**: 세션 종료 후 감정 분석 결과 요약 표시

**파일**: `src/components/Session/EmotionSummary.tsx` (새로 만들기)

**표시 항목**:

```
┌──────────────────────────────────┐
│     🎉 감정 분석 결과             │
├──────────────────────────────────┤
│ 주요 감정: 😊 행복 (75%)         │
│                                   │
│ 상태: 긍정적이고 활발한 상태      │
│ 추세: 점진적으로 개선됨           │
│                                   │
│ 긍정 감정: ███████░ 75%         │
│ 부정 감정: ███░░░░░ 25%         │
└──────────────────────────────────┘
```

**데이터 구조**:
```typescript
interface EmotionSummary {
  emotionCount: number;
  emotionSummary: {
    primaryEmotion: {
      emotion: string;     // "happy"
      emotionKo: string;   // "행복"
      percentage: number;  // 75
    };
    emotionalState: string; // "긍정적이고 활발한 상태"
    trend: string;         // "점진적으로 개선됨"
    positiveRatio: number; // 75
    negativeRatio: number; // 25
  };
}
```

**API 호출**:
```typescript
useEffect(() => {
  if (!sessionId) return;

  fetch(`/api/session/${sessionId}/summary`)
    .then(res => res.json())
    .then(data => setSummary(data));
}, [sessionId]);
```

**검증 방법**:
- [ ] 세션 종료 후 모달에서 요약이 나타나는가?
- [ ] 주요 감정이 정확한가?
- [ ] 퍼센트가 맞는가? (모두 합이 100%?)
- [ ] 긍정/부정 비율이 정확한가?
- [ ] 모바일에서 모든 항목이 보이는가?

**완료 기준**:
```
✅ 세션 종료 후 요약 모달 표시
✅ 모든 데이터가 정확함
✅ 비율 합계가 100%
✅ 모바일 반응형 정상
✅ 에러 없음
```

---

### 🟢 Phase 4: 통합 및 최종 테스트 (0.5-1일)

**목표**: 모든 컴포넌트를 SessionSummaryModal에 통합하고 엔드-투-엔드 테스트

**통합 지점**:

```typescript
// SessionSummaryModal.tsx에서
<>
  <EmotionTimeline emotions={emotions} />
  <EmotionSummary sessionId={sessionId} />
</>
```

**엔드-투-엔드 테스트**:

```
1. 새 세션 시작 버튼 클릭
   ✅ WebSocket 연결됨
   ✅ 비디오 시작

2. 20-30초 대기
   ✅ 타임라인에 감정 표시
   ✅ 10초마다 새 감정 추가

3. "세션 종료" 버튼 클릭
   ✅ 모달 닫힘
   ✅ Loading spinner 표시

4. 결과 확인
   ✅ SessionSummaryModal 표시
   ✅ EmotionTimeline: 3-4개 감정 표시
   ✅ EmotionSummary: 주요 감정 및 비율 표시
   ✅ 모든 데이터 정확함

5. 모바일 테스트
   ✅ 반응형 레이아웃 정상
   ✅ 터치 제스처 작동
   ✅ 가로/세로 모드 전환 정상
```

**검증 체크리스트**:
- [ ] Desktop 버전 테스트 완료
- [ ] Mobile 버전 테스트 완료
- [ ] 브라우저 콘솔에 에러 없음
- [ ] Network 탭에서 API 호출 확인
- [ ] 데이터 정확성 확인

**완료 기준**:
```
✅ Desktop & Mobile 모두 정상 작동
✅ 콘솔에 에러 없음
✅ API 호출 정상
✅ 데이터 정확성 확인
✅ 모든 UI 요소 표시
```

---

## 📊 일일 진행 표

### Day 1 (Phase 1)
```
09:00 - FRONTEND_EMOTION_SETUP.md 읽기 (30분)
09:30 - App.tsx에 WebSocket 리스너 추가 (1시간)
10:30 - 콘솔에서 emotion_update 메시지 확인 (30분)
11:00 - PR 제출 및 코드 리뷰 (30분)
11:30 - Phase 1 완료 ✅

다음: Phase 2 준비
```

### Day 2 (Phase 2)
```
09:00 - FRONTEND_IMPLEMENTATION_PROMPT.md Phase 2 읽기 (30분)
09:30 - EmotionTimeline 컴포넌트 생성 (2시간)
11:30 - 스타일링 및 반응형 수정 (1시간)
12:30 - 테스트 및 검증 (1시간)
13:30 - PR 제출 (30분)
14:00 - Phase 2 완료 ✅

다음: Phase 3 준비
```

### Day 3 (Phase 3)
```
09:00 - FRONTEND_IMPLEMENTATION_PROMPT.md Phase 3 읽기 (30분)
09:30 - EmotionSummary 컴포넌트 생성 (2시간)
11:30 - API 호출 로직 추가 (1시간)
12:30 - 스타일링 (1시간)
13:30 - 테스트 (1시간)
14:30 - Phase 3 완료 ✅

다음: Phase 4 준비
```

### Day 4 (Phase 4)
```
09:00 - SessionSummaryModal에 통합 (1시간)
10:00 - 엔드-투-엔드 테스트 (2시간)
12:00 - 모바일 테스트 (1시간)
13:00 - 버그 수정 (1시간)
14:00 - Phase 4 완료 ✅
14:30 - 최종 배포 준비
```

---

## 🔄 각 단계별 필요 파일 체크

### Phase 1 필요 파일
- [ ] `src/App.tsx` (수정)
- [ ] WebSocket 설정 파일 (기존)

### Phase 2 필요 파일
- [ ] `src/components/Session/EmotionTimeline.tsx` (새로 생성)
- [ ] 스타일 (CSS-in-JS 또는 Tailwind)

### Phase 3 필요 파일
- [ ] `src/components/Session/EmotionSummary.tsx` (새로 생성)
- [ ] API 호출 훅 (혹은 기존 사용)

### Phase 4 필요 파일
- [ ] `src/components/Session/SessionSummaryModal.tsx` (수정)
- [ ] 모든 위의 컴포넌트들

---

## 📞 백엔드 팀과의 동기화

### 백엔드 준비 확인
```
⏳ 대기 중: DATABASE_URL 설정 중
대기 시간: 1-2시간

확인 사항:
- [ ] "✅ 데이터베이스 연결 성공" 메시지 표시 확인
- [ ] emotion_update 메시지 10초마다 전송 확인
- [ ] 데이터베이스에 데이터 저장 확인
```

### 백엔드 준비 완료 후
```
✅ Phase 1 시작 가능
✅ Phase 2 시작 가능
✅ Phase 3 시작 가능
✅ Phase 4 시작 가능
```

---

## 🆘 문제 해결

### 문제 1: emotion_update 메시지가 콘솔에 안 보임
```
원인: WebSocket 연결 안 됨 또는 백엔드 미배포
해결:
1. 개발자 도구 > Network > WS 필터로 WebSocket 연결 확인
2. 백엔드 로그에서 emotion_update 메시지 전송 확인
3. WebSocket URL이 올바른지 확인 (localhost vs production)
4. 백엔드 팀에 DATABASE_URL 설정 완료 확인
```

### 문제 2: API 호출이 실패함 (/api/session/{id}/summary)
```
원인 1: sessionId가 없음
→ SessionSummaryModal에 sessionId prop이 전달되는지 확인

원인 2: 백엔드에 엔드포인트가 없음
→ 백엔드 팀에 API 구현 완료 확인

원인 3: CORS 에러
→ 백엔드 CORS 설정 확인
```

### 문제 3: 스타일이 깨짐
```
원인: CSS 충돌 또는 class 네임 오류
해결:
1. 개발자 도구 > Elements에서 적용된 스타일 확인
2. Tailwind 클래스명 정확성 확인
3. z-index 충돌 확인 (모달이 뒤에 있으면 z-index 높이기)
```

---

## 📚 참고 문서 (읽는 순서)

**필독 (모두 읽어야 함)**:
1. [FRONTEND_EMOTION_SETUP.md](./BeMoreFrontend/FRONTEND_EMOTION_SETUP.md) (5분) ← 먼저 읽기
2. [FRONTEND_IMPLEMENTATION_PROMPT.md](./FRONTEND_IMPLEMENTATION_PROMPT.md) (30분) ← 상세 구현

**참고용**:
- [README_EMOTION_SYSTEM.md](./README_EMOTION_SYSTEM.md) - 기술 배경
- [TEAM_ANNOUNCEMENT.md](./TEAM_ANNOUNCEMENT.md) - Q&A
- [DEPLOYMENT_READINESS_CHECKLIST.md](./DEPLOYMENT_READINESS_CHECKLIST.md) - 배포 체크

---

## ✅ 최종 체크리스트

### 시작 전
- [ ] FRONTEND_EMOTION_SETUP.md 읽음
- [ ] FRONTEND_IMPLEMENTATION_PROMPT.md 읽음
- [ ] 개발 환경 설정 완료
- [ ] 백엔드 배포 완료 확인

### Phase 1 완료
- [ ] WebSocket 리스너 구현
- [ ] emotions 상태 관리
- [ ] 콘솔에서 emotion_update 메시지 확인
- [ ] PR 제출 및 코드 리뷰 완료

### Phase 2 완료
- [ ] EmotionTimeline 컴포넌트 생성
- [ ] 색상 매핑 정확함
- [ ] 호버 효과 작동
- [ ] 모바일 반응형 정상
- [ ] PR 제출 및 코드 리뷰 완료

### Phase 3 완료
- [ ] EmotionSummary 컴포넌트 생성
- [ ] API 호출 구현
- [ ] 데이터 표시 정확함
- [ ] 모바일 반응형 정상
- [ ] PR 제출 및 코드 리뷰 완료

### Phase 4 완료
- [ ] SessionSummaryModal 통합
- [ ] 엔드-투-엔드 테스트 완료
- [ ] 모바일 테스트 완료
- [ ] 콘솔에 에러 없음
- [ ] PR 제출 및 병합 완료

---

## 🎯 완료 후

### 배포 전
1. [ ] 모든 PR 코드 리뷰 완료
2. [ ] 테스트 커버리지 확인
3. [ ] 성능 최적화 완료
4. [ ] 접근성 검증 완료

### 배포 후
1. [ ] 프로덕션 데이터 확인
2. [ ] 사용자 피드백 수집
3. [ ] 성능 모니터링

---

## ⏱️ 예상 일정

| Phase | 일자 | 소요시간 | 상태 |
|-------|------|---------|------|
| Phase 1 | Day 1 | 1일 | 진행 중 |
| Phase 2 | Day 2 | 1일 | 대기 중 |
| Phase 3 | Day 3 | 1일 | 대기 중 |
| Phase 4 | Day 4 | 0.5-1일 | 대기 중 |
| **총 기간** | | **3-4일** | |

---

## 🚀 지금 바로 시작하세요!

```
Step 1: FRONTEND_EMOTION_SETUP.md 읽기 (5분)
        └─ 빠른 개요 파악

Step 2: FRONTEND_IMPLEMENTATION_PROMPT.md 읽기 (30분)
        └─ Phase 1 상세 학습

Step 3: Phase 1 구현 시작 (1일)
        ├─ App.tsx 수정
        ├─ WebSocket 리스너 추가
        ├─ emotions 상태 관리
        └─ 콘솔에서 emotion_update 확인

Step 4: Phase 2-4 순차 구현 (2-3일)
        └─ 위 가이드 참고

완료!
```

**예상 완료**: 4일 후 (Day 4 종료 시)
**긴급도**: 🔥 높음 (백엔드가 DATABASE_URL 대기 중)
**필수 읽기**: FRONTEND_EMOTION_SETUP.md + FRONTEND_IMPLEMENTATION_PROMPT.md

---

**화이팅! 🎉**
