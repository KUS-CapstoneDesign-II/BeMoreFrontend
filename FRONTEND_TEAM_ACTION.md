# 🎨 프론트엔드팀 - 감정 업데이트 UI 구현

**상태**: ✅ **준비 완료**
**작업**: 감정 업데이트 UI 컴포넌트 구현
**예상 시간**: 2-3시간
**우선순위**: **HIGH**

---

## 📋 상황 요약

### ✅ 백엔드에서 준비된 것
```
✅ 매 10초마다 감정 업데이트 WebSocket 메시지 전송
✅ 감정 분석 완료 (Gemini API)
✅ 실시간으로 감정 감지 중
✅ 세션 종료 시 감정 요약 분석
```

### 🎨 프론트엔드가 해야 할 것
```
1. emotion_update 메시지 핸들러 구현
2. 실시간 감정 표시 UI 만들기
3. 세션 종료 시 감정 요약 표시
4. 감정 타임라인 시각화 (선택사항)
```

---

## 🎯 할 일 (3가지)

### **1️⃣ WebSocket 메시지 핸들러 추가** (20분)

**파일**: `src/hooks/useWebSocket.ts` 또는 메시지 핸들러 위치

**코드 추가 (emotion_update 메시지 처리):**

```typescript
// WebSocket 메시지 수신 처리
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  // ✨ 감정 업데이트 메시지 처리
  if (message.type === 'emotion_update') {
    const { emotion, timestamp, frameCount, sttSnippet } = message.data;

    console.log(`😊 Emotion detected: ${emotion}`);
    console.log(`  📹 Frames: ${frameCount}`);
    console.log(`  💬 STT: ${sttSnippet}`);

    // 상태 업데이트 (부모 컴포넌트에서 처리)
    onEmotionUpdate?.({
      emotion,
      timestamp,
      frameCount,
      sttSnippet
    });
  }
};
```

**또는 콜백 함수로:**

```typescript
const handleEmotionMessage = (data: EmotionUpdateData) => {
  console.log(`감정 감지: ${data.emotion}`);
  // EmotionCard에 전달
  setCurrentEmotion(data.emotion);
  // 타임라인에 추가
  addToTimeline(data);
};
```

---

### **2️⃣ 감정 카드 업데이트** (30분)

**파일**: `src/components/EmotionCard.tsx` (또는 유사 컴포넌트)

**현재 상태**: "감정 분석 중..." 표시

**변경 전**:
```typescript
export const EmotionCard = () => {
  return (
    <div>
      <h3>현재 감정</h3>
      <p>❓ 감정 분석 중...</p>
    </div>
  );
};
```

**변경 후**:
```typescript
interface EmotionData {
  emotion: string;
  timestamp: number;
  frameCount: number;
  sttSnippet: string;
}

export const EmotionCard = ({ currentEmotion }: { currentEmotion: EmotionData | null }) => {
  const emotionEmojis: Record<string, string> = {
    happy: '🙂',
    sad: '😢',
    angry: '😠',
    anxious: '😰',
    excited: '🤩',
    neutral: '😐'
  };

  if (!currentEmotion) {
    return (
      <div className="emotion-card">
        <h3>현재 감정</h3>
        <p>❓ 감정 분석 중...</p>
      </div>
    );
  }

  return (
    <div className="emotion-card">
      <h3>현재 감정</h3>

      {/* 감정 표시 */}
      <div className="emotion-display">
        <span className="emoji">{emotionEmojis[currentEmotion.emotion]}</span>
        <span className="emotion-name">{currentEmotion.emotion}</span>
      </div>

      {/* 상세 정보 */}
      <div className="emotion-details">
        <p>📹 프레임: {currentEmotion.frameCount}</p>
        <p>💬 발화: {currentEmotion.sttSnippet}</p>
        <p>⏰ 시간: {new Date(currentEmotion.timestamp).toLocaleTimeString('ko-KR')}</p>
      </div>

      {/* CSS */}
      <style>{`
        .emotion-card {
          padding: 20px;
          border-radius: 8px;
          background: #f5f5f5;
          border: 1px solid #ddd;
        }
        .emotion-display {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 24px;
          margin: 10px 0;
        }
        .emoji {
          font-size: 48px;
        }
        .emotion-details {
          font-size: 12px;
          color: #666;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};
```

---

### **3️⃣ 감정 타임라인 (선택사항)** (40분)

**파일**: `src/components/EmotionTimeline.tsx` (새로 생성)

```typescript
interface EmotionEntry {
  emotion: string;
  timestamp: number;
  frameCount: number;
}

export const EmotionTimeline = ({ emotions }: { emotions: EmotionEntry[] }) => {
  return (
    <div className="timeline">
      <h3>감정 타임라인</h3>

      <div className="timeline-list">
        {emotions.map((entry, idx) => (
          <div key={idx} className="timeline-item">
            <span className="timeline-time">
              {new Date(entry.timestamp).toLocaleTimeString('ko-KR')}
            </span>
            <span className="timeline-emotion">{entry.emotion}</span>
            <span className="timeline-frames">({entry.frameCount}f)</span>
          </div>
        ))}
      </div>

      <style>{`
        .timeline {
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        .timeline-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 10px;
        }
        .timeline-item {
          display: flex;
          gap: 12px;
          padding: 8px;
          background: #f9f9f9;
          border-left: 3px solid #4CAF50;
          border-radius: 4px;
        }
        .timeline-time {
          font-weight: bold;
          color: #666;
          min-width: 80px;
        }
        .timeline-emotion {
          flex: 1;
          font-weight: bold;
        }
        .timeline-frames {
          color: #999;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};
```

---

## 📡 App.tsx에서 연결

```typescript
export const App = () => {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionData | null>(null);
  const [emotionTimeline, setEmotionTimeline] = useState<EmotionEntry[]>([]);

  // WebSocket 콜백
  const handleEmotionUpdate = (data: EmotionData) => {
    setCurrentEmotion(data);

    // 타임라인에 추가
    setEmotionTimeline(prev => [...prev, {
      emotion: data.emotion,
      timestamp: data.timestamp,
      frameCount: data.frameCount
    }]);
  };

  return (
    <div className="app">
      {/* 감정 카드 */}
      <EmotionCard currentEmotion={currentEmotion} />

      {/* 감정 타임라인 */}
      {emotionTimeline.length > 0 && (
        <EmotionTimeline emotions={emotionTimeline} />
      )}

      {/* 기타 컴포넌트 */}
      <VideoFeed
        onEmotionUpdate={handleEmotionUpdate}
        // ... 기타 props
      />
    </div>
  );
};
```

---

## 🎨 디자인 가이드

### 감정별 색상
```
happy:   🟢 #4CAF50
sad:     🔵 #2196F3
angry:   🔴 #f44336
anxious: 🟡 #FF9800
excited: 🟣 #9C27B0
neutral: ⚫ #757575
```

### 타임라인 스타일
```
- 시간: 작고 회색
- 감정: 크고 굵음
- 배경: 연한 회색
- 좌측 보더: 감정별 색상
```

---

## ✅ 테스트 체크리스트

- [ ] emotion_update 메시지 핸들러 추가
- [ ] 콘솔에서 "감정 감지" 로그 확인
- [ ] 감정 카드에 실시간 감정 표시
- [ ] 감정 타임라인에 항목 추가됨
- [ ] 세션 종료 시 최종 요약 표시

---

## 🧪 로컬 테스트 방법

**1단계: 백엔드 확인**
```
로그에서 "💾 Emotion saved to database" 확인
```

**2단계: 프론트엔드 열기**
```
http://localhost:3000
또는 Vercel 배포 링크
```

**3단계: 세션 시작**
```
1. "시작" 버튼 클릭
2. 콘솔 열기 (F12)
3. emotion_update 메시지 확인
4. 감정 카드에 감정 표시되는지 확인
```

---

## 📱 세션 종료 응답 처리

백엔드가 보내는 세션 종료 응답:

```json
{
  "success": true,
  "data": {
    "emotionCount": 4,
    "emotionSummary": {
      "primaryEmotion": {
        "emotion": "happy",
        "emotionKo": "행복",
        "percentage": 75
      },
      "emotionalState": "긍정적이고 활발한 상태",
      "trend": "긍정적으로 개선됨",
      "positiveRatio": 75,
      "negativeRatio": 25
    }
  }
}
```

**처리 코드:**

```typescript
const handleSessionEnd = (response: SessionEndResponse) => {
  const { emotionSummary } = response.data;

  console.log(`📊 감정 요약:`);
  console.log(`  주요 감정: ${emotionSummary.primaryEmotion.emotionKo}`);
  console.log(`  감정 상태: ${emotionSummary.emotionalState}`);
  console.log(`  긍정 비율: ${emotionSummary.positiveRatio}%`);
  console.log(`  부정 비율: ${emotionSummary.negativeRatio}%`);

  // UI 업데이트
  showSessionSummary(emotionSummary);
};
```

---

## 📞 완료 후

1. ✅ 감정 카드 구현
2. ✅ 감정 타임라인 구현
3. ✅ 세션 종료 요약 표시
4. 📢 백엔드팀에게 "프론트엔드 준비 완료" 알려주기

---

## 💡 팁

- WebSocket 재연결 후에도 emotion_update 메시지 계속 받음
- 타임라인은 세션 시작 시 초기화
- 감정 카드는 실시간으로 업데이트 (최신 감정만 표시)
- 최종 요약은 세션 종료 API 응답에서 가져옴

---

**백엔드 수정되면**: 데이터베이스에 감정이 저장되고, 세션 종료 시 데이터베이스에서 로드된 감정이 표시됩니다! 🎉
