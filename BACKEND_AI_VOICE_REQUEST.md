# Backend API Request: AI 음성 상담 WebSocket 엔드포인트

**작성일**: 2025-01-10
**요청 팀**: Frontend Team
**우선순위**: High (핵심 기능)

---

## 📋 요약

사용자가 음성으로 말하면 자동으로 AI 응답을 생성하고 스트리밍으로 전달하는 실시간 음성 상담 기능을 구현했습니다. 백엔드에서 WebSocket을 통해 AI 응답 요청을 받고 처리해야 합니다.

---

## 🎯 목적

프론트엔드에서 사용자의 음성이 텍스트로 변환되면:
1. 자동으로 채팅창에 사용자 메시지 표시
2. 백엔드에 AI 응답 요청 전송 (현재 감정 상태 포함)
3. 백엔드는 AI에게 요청 후 응답을 실시간 스트리밍으로 전송
4. 프론트엔드는 스트리밍 응답을 채팅창에 표시하고 TTS로 재생

---

## 🔌 WebSocket 스펙

### 채널
```
wss://bemorebackend.onrender.com/ws/session/{session_id}
```

### 프론트엔드 → 백엔드 (요청)

**Message Type**: `request_ai_response`

```typescript
{
  type: 'request_ai_response',
  data: {
    message: string,          // 사용자 메시지 (STT 결과)
    emotion: string | null,   // 현재 감정 ('happy', 'sad', 'angry', 'anxious', 'neutral', etc.)
    timestamp: number         // 요청 시간 (밀리초)
  }
}
```

### Request Example
```json
{
  "type": "request_ai_response",
  "data": {
    "message": "요즘 회사에서 스트레스를 많이 받아요",
    "emotion": "anxious",
    "timestamp": 1704902400000
  }
}
```

---

## 📤 백엔드 → 프론트엔드 (응답)

AI 응답은 **3단계 스트리밍**으로 전송됩니다:

### 1. 응답 시작 (Stream Begin)
```typescript
{
  type: 'ai_stream_begin',
  data: {}
}
```

### 2. 응답 청크 (Stream Chunk) - 여러 번 전송
```typescript
{
  type: 'ai_stream_chunk',
  data: {
    chunk: string  // AI 응답 조각 (예: "스트레스", "를 받고", " 계시는군요...")
  }
}
```

### 3. 응답 완료 (Stream Complete)
```typescript
{
  type: 'ai_stream_complete',
  data: {}
}
```

### 4. 응답 실패 (Stream Error)
```typescript
{
  type: 'ai_stream_error',
  data: {
    error: string  // 오류 메시지
  }
}
```

---

## 🔧 백엔드 구현 가이드

### FastAPI 예시

```python
from fastapi import WebSocket
from typing import AsyncGenerator
import asyncio

# AI 클라이언트 (Gemini, OpenAI 등)
async def generate_ai_response(user_message: str, emotion: str | None, session_id: str) -> AsyncGenerator[str, None]:
    """
    AI 응답을 스트리밍으로 생성

    Args:
        user_message: 사용자 메시지
        emotion: 현재 감정 상태
        session_id: 세션 ID (대화 히스토리 조회용)

    Yields:
        AI 응답 청크 (한 글자 또는 한 단어씩)
    """
    # 1. 세션 히스토리 조회 (이전 대화 맥락)
    conversation_history = await get_conversation_history(session_id)

    # 2. 시스템 프롬프트 구성 (감정 기반)
    system_prompt = build_system_prompt(emotion)

    # 3. AI에게 요청 (스트리밍)
    # Gemini 예시:
    model = genai.GenerativeModel('gemini-1.5-pro')

    # 대화 히스토리 포맷팅
    messages = []
    for msg in conversation_history:
        messages.append({
            "role": msg["role"],  # "user" or "model"
            "parts": [msg["content"]]
        })

    # 현재 메시지 추가
    messages.append({
        "role": "user",
        "parts": [user_message]
    })

    # 스트리밍 응답 생성
    response = model.generate_content(
        messages,
        stream=True,
        generation_config={
            "temperature": 0.7,
            "top_p": 0.8,
            "max_output_tokens": 1024,
        }
    )

    # 청크 단위로 yield
    for chunk in response:
        if chunk.text:
            yield chunk.text
            await asyncio.sleep(0.05)  # 자연스러운 속도 조절


def build_system_prompt(emotion: str | None) -> str:
    """감정에 따른 시스템 프롬프트 생성"""
    base_prompt = """당신은 전문 심리 상담사입니다.
공감적이고 따뜻한 태도로 내담자의 이야기를 경청하고,
인지행동치료(CBT) 기법을 활용하여 도움을 제공하세요."""

    emotion_guidance = {
        "anxious": "내담자가 불안해하고 있습니다. 안정감을 주는 톤으로 대화하세요.",
        "sad": "내담자가 우울해하고 있습니다. 공감과 위로를 중심으로 대화하세요.",
        "angry": "내담자가 화가 나 있습니다. 감정을 수용하고 진정시키는 데 집중하세요.",
        "happy": "내담자의 긍정적인 상태를 강화하세요.",
        "neutral": "중립적인 톤으로 대화를 이어가세요."
    }

    if emotion and emotion in emotion_guidance:
        return f"{base_prompt}\n\n현재 감정 상태: {emotion_guidance[emotion]}"

    return base_prompt


@app.websocket("/ws/session/{session_id}")
async def websocket_session_endpoint(websocket: WebSocket, session_id: str):
    """세션 WebSocket 엔드포인트"""
    await websocket.accept()

    try:
        while True:
            # 메시지 수신
            message = await websocket.receive_json()

            # AI 응답 요청 처리
            if message.get("type") == "request_ai_response":
                data = message.get("data", {})
                user_message = data.get("message", "")
                emotion = data.get("emotion")
                timestamp = data.get("timestamp")

                # 로깅
                logger.info(f"[AI Request] session={session_id}, emotion={emotion}, message={user_message[:50]}...")

                try:
                    # 1. 스트리밍 시작 알림
                    await websocket.send_json({
                        "type": "ai_stream_begin",
                        "data": {}
                    })

                    # 2. AI 응답 스트리밍
                    full_response = ""
                    async for chunk in generate_ai_response(user_message, emotion, session_id):
                        await websocket.send_json({
                            "type": "ai_stream_chunk",
                            "data": {"text": chunk}
                        })
                        full_response += chunk

                    # 3. 스트리밍 완료 알림
                    await websocket.send_json({
                        "type": "ai_stream_complete",
                        "data": {}
                    })

                    # 4. 대화 히스토리 저장
                    await save_conversation(
                        session_id=session_id,
                        user_message=user_message,
                        ai_response=full_response,
                        emotion=emotion,
                        timestamp=timestamp
                    )

                except Exception as e:
                    logger.error(f"[AI Error] {e}")
                    await websocket.send_json({
                        "type": "ai_stream_error",
                        "data": {"error": str(e)}
                    })

    except WebSocketDisconnect:
        logger.info(f"[WebSocket] Session {session_id} disconnected")
```

---

## 💾 대화 히스토리 저장

대화를 데이터베이스에 저장하여 맥락을 유지합니다:

### MongoDB 스키마 예시
```javascript
{
  sessionId: "sess_abc123",
  conversations: [
    {
      timestamp: 1704902400000,
      message: "요즘 회사에서 스트레스를 많이 받아요",
      aiResponse: "스트레스를 받고 계시는군요. 어떤 상황에서 특히 힘드신가요?",
      emotion: "anxious",
      createdAt: ISODate("2025-01-10T12:00:00Z")
    },
    // ...
  ]
}
```

### PostgreSQL 스키마 예시
```sql
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    emotion VARCHAR(50),
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

CREATE INDEX idx_conversations_session ON conversations(session_id);
CREATE INDEX idx_conversations_timestamp ON conversations(timestamp);
```

---

## 🎨 AI 프롬프트 가이드라인

### 기본 원칙
1. **공감적 경청**: 내담자의 감정을 먼저 인정하고 수용
2. **구체적 질문**: 모호한 상황을 구체화하는 질문
3. **CBT 기법**: 인지 왜곡 탐지 시 재구성 유도
4. **짧고 명확**: 한 번에 한 가지 주제에 집중 (2-3문장)

### 감정별 응답 예시

**불안(anxious)**:
- "많이 불안하셨겠어요. 어떤 생각이 드셨나요?"
- "그런 상황에서 불안한 건 자연스러운 반응이에요."

**슬픔(sad)**:
- "힘든 시간을 보내고 계시는군요. 어떤 일이 있었나요?"
- "슬픈 감정을 느끼는 것도 괜찮아요."

**분노(angry)**:
- "화가 나셨군요. 그런 감정을 느끼는 게 당연해요."
- "무엇이 가장 화나게 했나요?"

**중립/평온(neutral/happy)**:
- "오늘은 어떤 하루를 보내셨나요?"
- "그 경험에 대해 더 자세히 말씀해주시겠어요?"

---

## 🔍 프론트엔드 코드 위치

AI 응답 요청을 전송하는 코드:

**파일**: `src/App.tsx` (line 169-181)

```typescript
// 🤖 Auto-trigger AI response after user speech
sendToSession({
  type: 'request_ai_response',
  data: {
    message: text,
    emotion: currentEmotion,
    timestamp: Date.now()
  }
});
```

AI 응답 스트리밍을 수신하는 코드:

**파일**: `src/App.tsx` (line 273-286)

```typescript
// AI streaming events (example schema)
if (message.type === 'ai_stream_begin') {
  window.dispatchEvent(new CustomEvent('ai:begin'));
}
if (message.type === 'ai_stream_chunk') {
  const d = message.data as { chunk?: string };
  window.dispatchEvent(new CustomEvent('ai:append', { detail: { chunk: d?.chunk ?? '' } }));
}
if (message.type === 'ai_stream_complete') {
  window.dispatchEvent(new CustomEvent('ai:complete'));
}
if (message.type === 'ai_stream_error') {
  const d = message.data as { error?: string };
  window.dispatchEvent(new CustomEvent('ai:fail', { detail: { error: d?.error ?? 'AI stream failed' } }));
}
```

---

## ✅ 테스트 방법

### 1. WebSocket 연결 테스트
```python
import asyncio
import websockets
import json

async def test_ai_response():
    uri = "ws://localhost:8000/ws/session/test_session_123"
    async with websockets.connect(uri) as websocket:
        # AI 응답 요청
        await websocket.send(json.dumps({
            "type": "request_ai_response",
            "data": {
                "message": "안녕하세요",
                "emotion": "neutral",
                "timestamp": 1704902400000
            }
        }))

        # 응답 수신
        while True:
            response = await websocket.recv()
            message = json.loads(response)
            print(f"Received: {message}")

            if message["type"] == "ai_stream_complete":
                break

asyncio.run(test_ai_response())
```

### 2. 프론트엔드 통합 테스트
1. 프론트엔드 실행: `npm run dev`
2. 세션 시작
3. 마이크 권한 허용
4. 음성으로 말하기: "안녕하세요"
5. 확인 사항:
   - 채팅창에 사용자 메시지 표시
   - AI 응답이 실시간으로 스트리밍
   - TTS로 AI 응답 음성 재생

---

## ⏱️ 구현 우선순위

**우선순위**: 🔴 High (핵심 기능)

### 필수 구현 사항
- [ ] WebSocket `/ws/session/{session_id}` 엔드포인트에 `request_ai_response` 핸들러 추가
- [ ] AI 응답 스트리밍 구현 (Gemini/OpenAI/Claude)
- [ ] 대화 히스토리 저장 (세션별)
- [ ] 감정 기반 시스템 프롬프트 구성
- [ ] 에러 핸들링 (`ai_stream_error`)

### 권장 구현 사항
- [ ] 대화 맥락 유지 (최근 5-10개 메시지)
- [ ] AI 응답 속도 최적화 (청크 크기 조절)
- [ ] 응답 품질 모니터링 (응답 시간, 토큰 수)
- [ ] 부적절한 내용 필터링

---

## 📊 성능 요구사항

- **응답 시작 시간**: 첫 번째 청크 < 2초
- **스트리밍 속도**: 자연스러운 읽기 속도 (50-100ms/청크)
- **전체 응답 시간**: < 10초 (일반적인 답변)
- **동시 연결**: 세션당 1개 WebSocket 연결 유지

---

## 🔐 보안 고려사항

1. **세션 검증**: WebSocket 연결 시 유효한 session_id 확인
2. **Rate Limiting**: 사용자당 분당 요청 제한 (예: 10회)
3. **메시지 길이 제한**: user_message 최대 2000자
4. **민감 정보 로깅 방지**: 대화 내용 로그 시 개인정보 마스킹
5. **AI 안전성**: 부적절한 내용 생성 방지 (content filter)

---

## 📞 문의

구현 중 질문이 있으면 프론트엔드 팀에 연락주세요!

**관련 파일**:
- Frontend: `src/App.tsx`, `src/components/AIChat/AIChat.tsx`
- Types: `src/types/index.ts`

**참고 문서**:
- [Gemini API - Streaming](https://ai.google.dev/gemini-api/docs/text-generation?lang=python#generate-a-text-stream)
- [OpenAI API - Streaming](https://platform.openai.com/docs/api-reference/streaming)
- [FastAPI WebSocket](https://fastapi.tiangolo.com/advanced/websockets/)
