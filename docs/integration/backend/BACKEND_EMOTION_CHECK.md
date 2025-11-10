# Backend 감정 타입 지원 범위 점검 요청

**작성일**: 2025-01-10
**요청 팀**: Frontend Team
**우선순위**: Medium (호환성 확인)

---

## 📋 요약

프론트엔드는 MediaPipe 얼굴 인식을 통해 **8가지 감정**을 감지하고 있습니다. 하지만 백엔드 통합 가이드(`BACKEND_INTEGRATION.md`)에서는 **5가지 감정**만 지원하는 것으로 문서화되어 있습니다.

프론트엔드를 백엔드 스펙에 맞추기 전에, 백엔드에서 실제로 8가지 감정을 모두 처리할 수 있는지 확인이 필요합니다.

---

## 🎯 현재 상황

### 프론트엔드 감정 타입 (8개)
```typescript
export type EmotionType =
  | 'happy'      // 행복
  | 'sad'        // 슬픔
  | 'angry'      // 분노
  | 'anxious'    // 불안
  | 'neutral'    // 중립
  | 'surprised'  // 놀람
  | 'disgusted'  // 혐오
  | 'fearful';   // 두려움
```

**출처**: [MediaPipe Face Landmark Detection](https://github.com/google/mediapipe)
**감지 방식**: 얼굴 랜드마크 468개 좌표 기반 감정 분석

### 백엔드 문서 감정 타입 (5개)
```python
SUPPORTED_EMOTIONS = ['happy', 'sad', 'angry', 'anxious', 'neutral']
```

**출처**: `BACKEND_INTEGRATION.md` (2025-01-10)

---

## ❓ 점검이 필요한 이유

### 1. 감정 누락으로 인한 정보 손실
프론트엔드가 `fearful`, `disgusted`, `surprised`를 다른 감정으로 매핑하면:
- **두려움(fearful)**: 사용자가 공포나 두려움을 느낄 때 → `anxious`로 매핑하면 불안과 구분 불가
- **혐오(disgusted)**: 불쾌감이나 거부감을 느낄 때 → `angry`로 매핑하면 분노와 구분 불가
- **놀람(surprised)**: 놀람이나 충격을 받을 때 → `happy`로 매핑하면 긍정 감정과 혼동

### 2. AI 상담 품질 저하 가능성
감정 정보가 부정확하면:
- AI가 사용자의 실제 감정 상태를 잘못 이해
- 부적절한 톤이나 내용으로 응답 (예: 두려워하는 사람에게 긍정적 메시지)
- 상담 효과 감소

### 3. MediaPipe 표준 감정 체계
MediaPipe는 **7가지 기본 감정**(Ekman의 보편적 감정 이론 기반)을 지원합니다:
1. Happy (행복)
2. Sad (슬픔)
3. Angry (분노)
4. Fear (두려움)
5. Disgust (혐오)
6. Surprise (놀람)
7. Neutral (중립)

프론트엔드는 이를 기반으로 `anxious`를 추가하여 8가지 감정을 사용 중입니다.

---

## 🔍 점검 방법

### 1. AI 모델 확인
백엔드에서 사용하는 AI 모델(Gemini, OpenAI, Claude 등)이 8가지 감정을 모두 처리할 수 있는지 확인:

**Gemini 예시**:
```python
system_prompt = f"""당신은 전문 심리 상담사입니다.

내담자의 현재 감정 상태: {emotion}

감정별 상담 가이드:
- happy: 긍정적 상태 강화
- sad: 공감과 위로
- angry: 감정 수용 및 진정
- anxious: 안정감 제공
- fearful: 안전감 전달, 두려움 완화
- disgusted: 불쾌감 이해, 상황 재구성
- surprised: 놀람 수용, 상황 정리
- neutral: 중립적 대화 유지

위 감정에 맞춰 적절히 응답하세요."""
```

**테스트 시나리오**:
1. 각 감정에 대해 AI가 적절한 응답을 생성하는지 확인
2. `fearful`, `disgusted`, `surprised`에 대해 `anxious`, `angry`, `happy`와 다른 톤의 응답이 나오는지 확인

### 2. 데이터베이스 스키마 확인
현재 DB에서 `emotion` 필드가 8가지 값을 모두 저장할 수 있는지 확인:

**MongoDB 예시**:
```javascript
// 제약 조건 없음 - 자유롭게 8가지 저장 가능
{
  emotion: "fearful"  // ✅ 저장 가능
}
```

**PostgreSQL 예시**:
```sql
-- ENUM 타입으로 정의된 경우
CREATE TYPE emotion_type AS ENUM ('happy', 'sad', 'angry', 'anxious', 'neutral');
-- ❌ fearful, disgusted, surprised 저장 불가

-- VARCHAR 타입으로 정의된 경우
CREATE TABLE conversations (
    emotion VARCHAR(50)  -- ✅ 8가지 모두 저장 가능
);
```

### 3. 기존 대화 로그 분석
이미 운영 중이라면 기존 로그를 확인:
```bash
# 5가지 외의 감정이 수신된 적이 있는지 확인
grep -E "fearful|disgusted|surprised" /var/log/backend/conversations.log
```

---

## 💡 권장 사항

### 시나리오 A: 백엔드가 8가지 감정을 지원할 수 있는 경우

**권장**: 백엔드 문서를 수정하고 8가지 감정을 모두 지원

**장점**:
- ✅ MediaPipe 표준 감정 체계 준수
- ✅ 정확한 감정 인식 및 상담 품질 향상
- ✅ 프론트엔드 수정 불필요

**백엔드 수정 사항**:
1. `BACKEND_INTEGRATION.md` 문서 업데이트
2. AI 프롬프트에 3개 감정 추가
3. 데이터베이스 스키마 확인 (ENUM 타입이면 추가)

**예상 작업 시간**: 30분 ~ 1시간

---

### 시나리오 B: 백엔드가 5가지 감정만 지원하는 경우

**대안**: 프론트엔드에서 8→5 감정 매핑 구현

**매핑 규칙**:
```typescript
function mapEmotionToBackend(emotion: EmotionType): string {
  const emotionMap: Record<EmotionType, string> = {
    happy: 'happy',
    sad: 'sad',
    angry: 'angry',
    anxious: 'anxious',
    neutral: 'neutral',
    fearful: 'anxious',    // 두려움 → 불안
    disgusted: 'angry',    // 혐오 → 분노
    surprised: 'happy'     // 놀람 → 행복
  };
  return emotionMap[emotion];
}
```

**단점**:
- ⚠️ 감정 정보 손실
- ⚠️ AI 상담 품질 저하 가능성
- ⚠️ MediaPipe 표준에서 벗어남

**프론트엔드 수정 사항**:
1. `src/App.tsx`: 감정 매핑 함수 추가
2. `src/types/index.ts`: 백엔드 감정 타입 정의 추가
3. 문서 업데이트

**예상 작업 시간**: 1시간

---

## 🧪 테스트 방법

### 테스트 1: AI 모델 감정 처리 테스트
```python
import asyncio
from your_ai_module import generate_ai_response

async def test_emotions():
    emotions = ['happy', 'sad', 'angry', 'anxious', 'neutral',
                'fearful', 'disgusted', 'surprised']

    for emotion in emotions:
        print(f"\n=== Testing emotion: {emotion} ===")
        response = await generate_ai_response(
            user_message="오늘 힘든 일이 있었어요",
            emotion=emotion,
            session_id="test_session"
        )
        print(f"AI Response: {response[:100]}...")

        # 각 감정에 맞는 톤인지 확인
        # fearful: "안전", "괜찮", "함께" 등의 단어 기대
        # disgusted: "이해", "불쾌", "상황" 등의 단어 기대
        # surprised: "놀라", "갑자기", "예상" 등의 단어 기대

asyncio.run(test_emotions())
```

### 테스트 2: 데이터베이스 저장 테스트
```python
async def test_db_emotions():
    emotions = ['fearful', 'disgusted', 'surprised']

    for emotion in emotions:
        try:
            await save_conversation(
                session_id="test_session",
                user_message="테스트 메시지",
                ai_response="테스트 응답",
                emotion=emotion,
                timestamp=1704902400000
            )
            print(f"✅ {emotion}: 저장 성공")
        except Exception as e:
            print(f"❌ {emotion}: 저장 실패 - {e}")

asyncio.run(test_db_emotions())
```

---

## 📊 비교 분석

| 항목 | 8가지 감정 지원 | 5가지 감정만 지원 |
|------|----------------|------------------|
| **정확도** | 높음 (MediaPipe 표준) | 중간 (정보 손실) |
| **AI 품질** | 높음 (정확한 맥락) | 중간 (일부 혼동) |
| **백엔드 작업** | 문서 수정, AI 프롬프트 업데이트 | 없음 |
| **프론트엔드 작업** | 없음 | 감정 매핑 함수 추가 |
| **작업 시간** | 30분 ~ 1시간 | 1시간 |
| **미래 확장성** | 높음 (표준 준수) | 낮음 (비표준) |

---

## ✅ 결정 요청

백엔드 팀에서 아래 사항을 확인 후 회신 부탁드립니다:

1. **AI 모델이 8가지 감정을 처리할 수 있나요?**
   - [ ] 예 → 시나리오 A 권장 (백엔드 문서 수정)
   - [ ] 아니오 → 시나리오 B 진행 (프론트엔드 매핑)

2. **데이터베이스 스키마가 8가지 감정을 저장할 수 있나요?**
   - [ ] 예 (VARCHAR 등)
   - [ ] 아니오 (ENUM 제약) → 스키마 수정 필요

3. **8가지 감정 지원 시 예상 이슈가 있나요?**
   - [ ] 없음 → 시나리오 A 진행
   - [ ] 있음 → 구체적인 이슈 공유 부탁드립니다

---

## 📞 문의

프론트엔드 팀은 백엔드 팀의 결정에 따라 즉시 조치하겠습니다.

**대응 시나리오**:
- **백엔드가 8개 지원 가능**: 백엔드 문서만 수정 (프론트엔드 작업 없음)
- **백엔드가 5개만 지원**: 프론트엔드에 감정 매핑 로직 추가

**관련 파일**:
- Frontend: `src/App.tsx`, `src/types/index.ts`
- Backend: `BACKEND_INTEGRATION.md`, AI 프롬프트 모듈
