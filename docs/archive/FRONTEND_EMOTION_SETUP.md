# 🎯 감정 타임라인 시스템 - 프론트엔드팀 설정 가이드

**상태**: ✅ 프로덕션 준비 완료
**버전**: 1.0.0
**업데이트**: 2025-10-26

---

## 📢 핵심 요약 (1분)

백엔드에서 **감정 분석 파이프라인이 완전히 수정**되었습니다.

### ✅ 이제 가능한 것:
- 🕐 세션 중 **매 10초마다** 감정 분석 실행
- 📡 **실시간** 감정 업데이트를 WebSocket으로 수신
- 💾 분석 완료 후 **데이터베이스에 저장**
- 📊 세션 종료 시 **감정 요약 데이터** 제공

### ❌ 더 이상 없는 것:
- "-" 값 표시
- 감정 데이터 손실
- 분석 중단

---

## 🚀 즉시 적용 가능 (지금부터 사용 가능)

### 1️⃣ WebSocket 감정 업데이트 수신

**받을 메시지 형식:**
```javascript
{
  "type": "emotion_update",
  "data": {
    "emotion": "happy",           // 감정 타입
    "timestamp": 1761390981234,   // 분석 시간
    "frameCount": 240,             // 분석된 프레임 수
    "sttSnippet": "오늘 날씨가..." // STT 텍스트 (첫 100자)
  }
}
```

**처리 방법 (React):**
```jsx
useEffect(() => {
  const handleMessage = (event) => {
    const message = JSON.parse(event.data);

    if (message.type === 'emotion_update') {
      const { emotion, timestamp } = message.data;

      // 감정 타임라인에 추가
      setEmotions(prev => [...prev, {
        emotion,
        timestamp,
        label: getEmotionLabel(emotion)
      }]);
    }
  };

  landmarksWs?.addEventListener('message', handleMessage);

  return () => {
    landmarksWs?.removeEventListener('message', handleMessage);
  };
}, [landmarksWs]);
```

### 2️⃣ 세션 종료 시 감정 요약 받기

**API 요청:**
```javascript
GET /api/session/{sessionId}/summary
```

**응답 예제:**
```json
{
  "emotionCount": 4,
  "emotionSummary": {
    "primaryEmotion": {
      "emotion": "happy",
      "emotionKo": "행복",
      "percentage": 75
    },
    "emotionalState": "긍정적이고 활발한 상태",
    "trend": "점진적으로 개선됨",
    "positiveRatio": 75,
    "negativeRatio": 25
  }
}
```

**처리 방법:**
```jsx
const fetchSessionSummary = async (sessionId) => {
  try {
    const response = await fetch(
      `/api/session/${sessionId}/summary`
    );
    const data = await response.json();

    setEmotionSummary({
      primaryEmotion: data.emotionSummary.primaryEmotion.emotion,
      state: data.emotionSummary.emotionalState,
      positiveRatio: data.emotionSummary.positiveRatio
    });
  } catch (error) {
    console.error('Failed to fetch summary:', error);
  }
};
```

---

## 📋 감정 타입 (6가지)

| 감정 | 영문 | 코드 | 색상 | 이모지 |
|------|------|------|------|-------|
| 행복 | happy | `happy` | 🟨 Yellow | 😊 |
| 슬픔 | sad | `sad` | 🔵 Blue | 😢 |
| 분노 | angry | `angry` | 🔴 Red | 😠 |
| 불안 | anxious | `anxious` | 🟠 Orange | 😰 |
| 흥분 | excited | `excited` | 💜 Purple | 🤩 |
| 중립 | neutral | `neutral` | ⚪ Gray | 😐 |

---

## 🎨 UI 컴포넌트 구현 예제

### EmotionTimeline 컴포넌트
```jsx
import React from 'react';

const EmotionTimeline = ({ emotions }) => {
  const emotionConfig = {
    happy: { color: '#FFD700', label: '행복', emoji: '😊' },
    sad: { color: '#3B82F6', label: '슬픔', emoji: '😢' },
    angry: { color: '#EF4444', label: '분노', emoji: '😠' },
    anxious: { color: '#FB923C', label: '불안', emoji: '😰' },
    excited: { color: '#A78BFA', label: '흥분', emoji: '🤩' },
    neutral: { color: '#D1D5DB', label: '중립', emoji: '😐' }
  };

  return (
    <div className="emotion-timeline">
      <h3>감정 변화 (세션 중)</h3>
      <div className="timeline-container">
        {emotions.map((emotion, idx) => {
          const config = emotionConfig[emotion.emotion];
          return (
            <div
              key={idx}
              className="timeline-item"
              style={{ backgroundColor: config.color }}
              title={`${config.label} (${new Date(emotion.timestamp).toLocaleTimeString()})`}
            >
              <span>{config.emoji}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmotionTimeline;
```

### EmotionSummary 카드
```jsx
const EmotionSummary = ({ summary }) => {
  if (!summary) return null;

  const emotionLabels = {
    happy: '행복',
    sad: '슬픔',
    angry: '분노',
    anxious: '불안',
    excited: '흥분',
    neutral: '중립'
  };

  return (
    <div className="emotion-summary-card">
      <h2>감정 분석 결과</h2>

      <div className="primary-emotion">
        <p className="label">주요 감정</p>
        <p className="value">
          {emotionLabels[summary.primaryEmotion]}
        </p>
      </div>

      <div className="emotional-state">
        <p className="label">감정 상태</p>
        <p className="value">{summary.state}</p>
      </div>

      <div className="stats">
        <div className="stat">
          <p className="label">긍정적 비율</p>
          <div className="progress-bar">
            <div
              className="progress-fill positive"
              style={{ width: `${summary.positiveRatio}%` }}
            />
          </div>
          <p className="percentage">{summary.positiveRatio}%</p>
        </div>

        <div className="stat">
          <p className="label">부정적 비율</p>
          <div className="progress-bar">
            <div
              className="progress-fill negative"
              style={{ width: `${summary.negativeRatio}%` }}
            />
          </div>
          <p className="percentage">{summary.negativeRatio}%</p>
        </div>
      </div>
    </div>
  );
};

export default EmotionSummary;
```

---

## 🔧 통합 체크리스트

### Phase 1: WebSocket 메시지 처리 (1일)
- [ ] WebSocket `emotion_update` 메시지 리스너 추가
- [ ] 감정 데이터 상태 관리 (useState)
- [ ] 콘솔 로그로 메시지 수신 확인

### Phase 2: 타임라인 UI 구현 (1일)
- [ ] EmotionTimeline 컴포넌트 생성
- [ ] 감정 타입별 색상/아이콘 매핑
- [ ] 세션 중 실시간 업데이트 표시

### Phase 3: 결과 요약 UI (1일)
- [ ] EmotionSummary 컴포넌트 생성
- [ ] 주요 감정, 상태, 비율 표시
- [ ] 세션 종료 시 자동 표시

### Testing (1일)
- [ ] 로컬 환경에서 테스트
- [ ] 감정 업데이트 실시간 표시 확인
- [ ] 세션 종료 후 요약 데이터 표시 확인

---

## 💡 중요 참고사항

### ✅ 할 것
1. WebSocket 메시지 리스너 추가
2. 감정 타입별 UI 처리
3. 실시간 업데이트 표시
4. 세션 종료 후 요약 표시

### ❌ 하지 말 것
1. ~~백엔드 코드 수정~~ (이미 완료됨)
2. ~~데이터베이스 처리~~ (백엔드에서 처리)
3. ~~감정 분석 로직~~ (Gemini API에서 처리)

### 🔍 테스트 방법
```
1. 새로운 세션 시작
2. 약 20초 진행
3. 세션 종료
4. 확인 사항:
   ✅ 감정 타임라인에 3-4개의 감정 표시됨
   ✅ 주요 감정이 정확하게 표시됨
   ✅ 긍정/부정 비율이 표시됨
```

---

## 📞 문의사항

백엔드 준비 상황:
- ✅ 감정 분석 파이프라인: 완료
- ✅ WebSocket 메시지: 완료
- ✅ 데이터베이스 저장: 완료
- ✅ API 응답: 완료

프론트엔드 구현 필요:
- UI 컴포넌트 (EmotionTimeline, EmotionSummary)
- WebSocket 메시지 처리
- 상태 관리

---

## 🎊 완성했을 때

✨ 사용자는 다음을 볼 수 있습니다:
- 세션 중 **실시간 감정 업데이트** 표시
- 세션 종료 후 **감정 분석 요약** 표시
- **감정 변화 추이** 시각화
- **긍정/부정 비율** 통계

---

**모든 준비가 완료되었습니다! 행운을 빕니다! 🚀**
