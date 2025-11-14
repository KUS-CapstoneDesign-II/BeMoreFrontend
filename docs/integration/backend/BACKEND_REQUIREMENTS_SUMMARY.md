# 🎯 AI 음성 채팅 백엔드 요구사항 (빠른 참조용)

**작성일**: 2025-01-14
**Frontend 버전**: Phase 14 (Video Overlay + Emotion Badges)
**용도**: 백엔드 개발자가 10분 안에 요구사항 파악

---

## 📌 Frontend 현재 상태

✅ **완료된 기능**:
- Video Overlay: 영상 위에 말풍선으로 메시지 표시 (사이드바 제거)
- 감정 배지: 사용자 메시지에 8가지 감정 표시
- 에러 처리: Foreign key 에러 감지 및 사용자 친화적 메시지
- 스트리밍 UI: AI 응답 실시간 표시 + TTS 연동

⏳ **Backend 구현 필요**:
- WebSocket으로 AI 응답 스트리밍 전송
- 감정 기반 응답 생성
- 대화 히스토리 DB 저장

---

## 📡 WebSocket 메시지 프로토콜

### Frontend → Backend (요청)

```json
{
  "type": "request_ai_response",
  "data": {
    "message": "요즘 스트레스를 많이 받아요",
    "emotion": "anxious",
    "timestamp": 1704902400000
  }
}
```

**필드 설명**:
- `message` (string, 필수): 사용자 메시지 (1-2000자)
- `emotion` (string|null): 현재 감정 - `"happy"` | `"sad"` | `"angry"` | `"anxious"` | `"neutral"` | `"surprised"` | `"disgusted"` | `"fearful"` | `null`
- `timestamp` (number, 선택): 요청 시간 (밀리초)

### Backend → Frontend (응답) - 3단계 스트리밍

**1단계: 시작**
```json
{ "type": "ai_stream_begin", "data": {} }
```

**2단계: 청크 전송 (반복)**
```json
{
  "type": "ai_stream_chunk",
  "data": { "chunk": "스트레스를 받고 계시는군요. " }
}
```

⚠️ **CRITICAL**: 필드명은 **반드시 `chunk`** (`text` 아님!)

**3단계: 완료**
```json
{ "type": "ai_stream_complete", "data": {} }
```

**에러 발생 시**
```json
{
  "type": "ai_stream_error",
  "data": { "error": "세션이 만료되었습니다" }
}
```

**Frontend 코드 참조**:
- 요청: [`src/hooks/useAIVoiceChat.ts:118-163`](../../src/hooks/useAIVoiceChat.ts#L118-L163)
- 청크 수신: [`src/hooks/useAIVoiceChat.ts:53`](../../src/hooks/useAIVoiceChat.ts#L53)
- 에러 처리: [`src/App.tsx:383-408`](../../src/App.tsx#L383-L408)

---

## 🚨 중요 사항

### 1. 필드명 주의
```python
# ✅ 올바름
{ "type": "ai_stream_chunk", "data": { "chunk": "..." } }

# ❌ 틀림 (Frontend가 못 읽음)
{ "type": "ai_stream_chunk", "data": { "text": "..." } }
```

### 2. Frontend가 감지하는 에러 패턴

**Foreign Key 에러**:
```
Backend 에러 메시지에 다음 키워드가 포함되면:
- "foreign key"
- "conversations"
- "session_id"

→ Frontend가 자동으로 "세션이 만료되었습니다"로 변환
```

**권장 에러 메시지**:
```
✅ "세션이 만료되었습니다"
✅ "AI 서비스가 일시적으로 사용할 수 없습니다"
✅ "메시지가 너무 깁니다 (최대 2000자)"
✅ "요청 횟수가 초과되었습니다"

❌ "foreign key constraint violation"
❌ "NoneType object has no attribute 'get'"
```

### 3. 스트리밍 순서 필수

```
ai_stream_begin → ai_stream_chunk (1회 이상) → ai_stream_complete
```

순서가 틀리면 Frontend UI가 제대로 동작하지 않습니다.

---

## ✅ 필수 구현 체크리스트

### WebSocket
- [ ] 엔드포인트: `/ws/session/{session_id}`
- [ ] `request_ai_response` 메시지 타입 처리
- [ ] 3단계 스트리밍 응답 (begin → chunk → complete)
- [ ] `chunk` 필드명 사용 (NOT `text`)

### 입력 검증
- [ ] 메시지 길이: 1-2000자
- [ ] 공백 trim 후 체크
- [ ] emotion 값 검증 (8가지 중 하나 또는 null)

### 에러 처리
- [ ] 세션 존재 여부 확인 (Foreign key 에러 방지)
- [ ] 사용자 친화적 에러 메시지
- [ ] `ai_stream_error` 타입으로 전송

### 데이터베이스
- [ ] conversations 테이블 생성
- [ ] session_id FK 제약 설정
- [ ] 대화 히스토리 저장 (user_message, ai_response, emotion, timestamp)

### 성능
- [ ] Rate limiting: 10 req/min/session
- [ ] 응답 길이: 2-3문장 (TTS용)
- [ ] 스트리밍 청크 딜레이: ~50ms

---

## 🗄️ 데이터베이스 스키마

```sql
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    emotion VARCHAR(50),
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- ⚠️ sessions 테이블과 FK 관계 필수
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

CREATE INDEX idx_conversations_session ON conversations(session_id);
CREATE INDEX idx_conversations_timestamp ON conversations(timestamp DESC);
```

**Foreign Key 에러 방지**:
```python
# 대화 저장 전 세션 존재 확인 필수
if not session_exists(session_id):
    send_error("세션이 만료되었습니다")
    return
```

---

## 🧪 테스트 가이드

### 1. 브라우저 콘솔 확인

**정상 응답**:
```
[AI Stream] Begin
[AI Stream] Chunk: 안녕하세요.
[AI Stream] Chunk: 스트레스를 받고 계시는군요.
[AI Stream] Complete
```

**에러 발생**:
```
[AI Stream] Error: 세션이 만료되었습니다
```

### 2. Frontend 동작 확인

**정상 시나리오**:
1. 음성 입력 → Overlay에 사용자 메시지 표시 (파란색 배경)
2. 감정 배지 표시 (예: "불안")
3. 3초 후 자동 사라짐
4. AI 응답 스트리밍 시작 → "응답 생성 중..." 표시
5. 청크 단위로 메시지 누적 표시
6. 완료 후 TTS 재생 → "🔊 재생 중" 표시
7. TTS 종료 1초 후 Overlay 사라짐

**에러 시나리오**:
1. Backend 에러 발생
2. Overlay에 에러 메시지 표시 (빨간색 배경)
3. 라벨: "오류"
4. 메시지: "세션이 만료되었습니다" 또는 Backend 에러 메시지
5. 안내: "💡 세션이 만료되었을 수 있습니다. 페이지를 새로고침해주세요."
6. 5초 후 자동 사라짐

### 3. WebSocket 테스트 (Python 예시)

```python
import asyncio
import websockets
import json

async def test_ai_response():
    uri = "ws://localhost:8000/ws/session/test-session-123"

    async with websockets.connect(uri) as ws:
        # 요청 전송
        await ws.send(json.dumps({
            "type": "request_ai_response",
            "data": {
                "message": "안녕하세요",
                "emotion": "neutral"
            }
        }))

        # 응답 수신
        while True:
            msg = json.loads(await ws.recv())
            print(f"{msg['type']}: {msg.get('data', {})}")

            if msg['type'] in ['ai_stream_complete', 'ai_stream_error']:
                break

asyncio.run(test_ai_response())
```

---

## 📚 상세 문서

더 자세한 구현 가이드가 필요하면 다음 문서를 참조하세요:

- **상세 구현 (Python)**: [`BACKEND_AI_VOICE_CHAT_LATEST.md`](./BACKEND_AI_VOICE_CHAT_LATEST.md)
- **기존 문서 (v1)**: [`BACKEND_AI_IMPLEMENTATION_PROMPT.md`](./BACKEND_AI_IMPLEMENTATION_PROMPT.md)

---

## 🎉 완료 기준

다음을 모두 만족하면 구현 완료:

1. ✅ Frontend에서 음성 입력 → AI 응답 → TTS 재생 전체 플로우 동작
2. ✅ `chunk` 필드명 사용
3. ✅ Overlay에 스트리밍 응답 실시간 표시
4. ✅ 감정 배지 표시
5. ✅ 에러 발생 시 사용자 친화적 메시지 표시
6. ✅ DB에 대화 저장 (Foreign key 에러 없음)
7. ✅ 브라우저 콘솔에 에러 없음

---

**작성**: 2025-01-14
**버전**: v2.0 (빠른 참조용 요약)
**문의**: Frontend 팀과 WebSocket 프로토콜 협의
