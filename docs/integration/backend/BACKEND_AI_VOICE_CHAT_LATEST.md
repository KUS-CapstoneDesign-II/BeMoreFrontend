# 🎙️ BeMore AI 음성 채팅 백엔드 구현 가이드 (최신 v2025.01)

**작성일**: 2025-01-14
**프론트엔드 버전**: Phase 14 완료 (Video Overlay + Emotion Badges)
**대상**: 백엔드 개발자 (FastAPI + Python + PostgreSQL)

---

## 📌 프론트엔드 최신 구현 상태

### ✅ 완료된 기능
- **Video Overlay 시스템**: 영상 위에 말풍선 형태로 메시지 표시 (사이드바 채팅 제거)
- **감정 배지**: 사용자 메시지에 8가지 감정 표시 (행복, 슬픔, 분노, 불안, 중립, 놀람, 혐오, 두려움)
- **에러 처리**: 백엔드 에러 감지 및 사용자 친화적 메시지 표시
- **스트리밍 UI**: AI 응답 실시간 스트리밍 표시
- **TTS 연동**: AI 응답 음성 재생 및 동기화

### 🎯 백엔드 구현 목표

**프론트엔드가 기대하는 동작**:
1. 사용자 음성 → STT → 텍스트 → WebSocket 전송 ✅
2. **백엔드가 AI 응답 생성 및 스트리밍 전송** ← **이 부분 구현 필요**
3. 프론트엔드가 Overlay에 표시 + TTS 재생 ✅

---

## 📡 WebSocket 메시지 프로토콜

### 1. Frontend → Backend (요청)

**엔드포인트**: `/ws/session/{session_id}`

**메시지 구조**:
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

**필드 상세**:
- `type`: **반드시** `"request_ai_response"`
- `data.message` (string, required): 사용자 메시지 (STT 결과)
  - **검증**: 1-2000자, trim() 후 공백 체크
- `data.emotion` (string|null): 현재 감정 상태
  - **가능한 값**: `"happy"` | `"sad"` | `"angry"` | `"anxious"` | `"neutral"` | `"surprised"` | `"disgusted"` | `"fearful"` | `null`
  - **Frontend 동작**: 사용자 메시지 Overlay에 감정 배지 표시
- `data.timestamp` (number, optional): 요청 시간 (milliseconds)

**Frontend 코드 참조**: [`src/hooks/useAIVoiceChat.ts:118-163`](../../src/hooks/useAIVoiceChat.ts#L118-L163)

---

### 2. Backend → Frontend (응답) - 3단계 스트리밍

#### Stage 1: 스트리밍 시작
```json
{
  "type": "ai_stream_begin",
  "data": {}
}
```

**Frontend 동작**:
- Overlay 초기화 (빈 메시지)
- "응답 생성 중..." 표시
- 스트리밍 상태로 전환

#### Stage 2: 응답 청크 전송 (반복)
```json
{
  "type": "ai_stream_chunk",
  "data": {
    "chunk": "스트레스를 받고 계시는군요. "
  }
}
```

⚠️ **중요**:
- 필드명은 **반드시 `chunk`**여야 합니다 (`text` 아님!)
- Frontend는 `data.chunk`를 읽어서 누적 표시합니다
- **검증**: [`src/hooks/useAIVoiceChat.ts:53`](../../src/hooks/useAIVoiceChat.ts#L53)

**Frontend 동작**:
- 기존 메시지에 청크 추가 (누적)
- Overlay 실시간 업데이트
- TTS 준비 (chunk 수신 시작)

#### Stage 3: 스트리밍 완료
```json
{
  "type": "ai_stream_complete",
  "data": {}
}
```

**Frontend 동작**:
- 스트리밍 상태 해제
- 최종 메시지를 대화 히스토리에 저장
- TTS 재생 시작
- TTS 종료 후 1초 대기 후 Overlay 숨김

**전체 흐름 참조**: [`src/hooks/useAIVoiceChat.ts:35-113`](../../src/hooks/useAIVoiceChat.ts#L35-L113)

---

### 3. Backend → Frontend (에러 처리)

```json
{
  "type": "ai_stream_error",
  "data": {
    "error": "AI 서비스가 일시적으로 사용할 수 없습니다"
  }
}
```

**Frontend 에러 처리 로직**: [`src/App.tsx:383-408`](../../src/App.tsx#L383-L408)

#### Frontend가 특별히 감지하는 에러 패턴:

**Foreign Key 제약 위반** (백엔드 DB 에러):
```python
# Backend에서 이런 에러 발생 시
"insert or update on table \"conversations\" violates foreign key constraint \"conversations_session_id_fkey\""
```

**Frontend 감지 로직**:
```typescript
const isForeignKeyError = error.includes('foreign key') ||
                          error.includes('conversations') ||
                          error.includes('session_id');

const userFriendlyError = isForeignKeyError
  ? '세션이 만료되었습니다'
  : error;
```

**Frontend 표시**:
- Overlay에 빨간색 배경으로 표시
- 메시지: "세션이 만료되었습니다"
- 안내: "💡 세션이 만료되었을 수 있습니다. 페이지를 새로고침해주세요."
- 5초 후 자동 사라짐

**권장 Backend 에러 메시지**:
```python
# ✅ 좋은 예시
"세션이 만료되었습니다"
"AI 서비스가 일시적으로 사용할 수 없습니다"
"메시지가 너무 깁니다 (최대 2000자)"
"요청 횟수가 초과되었습니다"

# ❌ 나쁜 예시 (기술적 에러 메시지)
"foreign key constraint violation"
"NoneType object has no attribute 'get'"
"Connection timeout"
```

---

## 🗄️ 데이터베이스 스키마

### PostgreSQL 테이블 정의

```sql
-- conversations 테이블 (대화 내역 저장)
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    emotion VARCHAR(50),           -- 'happy', 'sad', 'angry', 'anxious', 'neutral', 'surprised', 'disgusted', 'fearful'
    timestamp BIGINT NOT NULL,      -- Frontend에서 전송한 timestamp (milliseconds)
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- ⚠️ CRITICAL: sessions 테이블과 FK 관계 필수
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

-- 성능 최적화 인덱스
CREATE INDEX idx_conversations_session ON conversations(session_id);
CREATE INDEX idx_conversations_timestamp ON conversations(timestamp DESC);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
```

### Foreign Key 에러 방지 체크리스트

**Frontend에서 보고한 에러 (65+ 반복)**:
```
[AI Stream] Error: insert or update on table "conversations" violates
foreign key constraint "conversations_session_id_fkey"
```

**원인**: `sessions` 테이블에 `session_id`가 없는 상태에서 `conversations` INSERT 시도

**해결 방법**:
1. **sessions 테이블 확인**:
```sql
-- sessions 테이블이 존재하는가?
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'sessions';

-- session_id 컬럼 타입이 일치하는가?
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sessions' AND column_name = 'session_id';
```

2. **session_id 존재 여부 검증** (AI 응답 전):
```python
async def validate_session_exists(session_id: str, db_pool) -> bool:
    """세션 존재 여부 확인"""
    async with db_pool.acquire() as conn:
        result = await conn.fetchval(
            "SELECT EXISTS(SELECT 1 FROM sessions WHERE session_id = $1)",
            session_id
        )
        return result

# WebSocket 핸들러에서
if not await validate_session_exists(session_id, db_pool):
    await websocket.send_json({
        "type": "ai_stream_error",
        "data": {"error": "세션이 만료되었습니다"}
    })
    return
```

3. **트랜잭션 사용** (원자성 보장):
```python
async with db_pool.acquire() as conn:
    async with conn.transaction():
        # 세션 존재 확인
        session_exists = await conn.fetchval(...)
        if not session_exists:
            raise ValueError("Session not found")

        # conversations INSERT
        await conn.execute(...)
```

---

## 🔧 구현 코드

### 1. 환경 변수 (.env)

```bash
# Gemini AI API Key (필수)
GEMINI_API_KEY=your-gemini-api-key-here

# PostgreSQL Database URL (Supabase 또는 직접 호스팅)
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Secret (세션 검증용)
JWT_SECRET_KEY=your-secret-key

# Rate Limiting (분당 최대 요청 수)
MAX_AI_REQUESTS_PER_MINUTE=10

# Gemini Model
GEMINI_MODEL=gemini-1.5-pro
```

### 2. 의존성 (requirements.txt)

```txt
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
websockets>=12.0
google-generativeai>=0.3.0
python-dotenv>=1.0.0
asyncpg>=0.29.0
pydantic>=2.5.0
python-jose[cryptography]>=3.3.0
```

### 3. AI 응답 생성 서비스 (ai_service.py)

```python
"""
AI 응답 생성 서비스
- Gemini 1.5 Pro 스트리밍 응답
- 감정 기반 시스템 프롬프트
- 대화 히스토리 관리
"""
import os
import asyncio
from typing import AsyncGenerator, Optional, List, Dict
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Gemini API 초기화
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")

# 감정별 시스템 프롬프트 (8가지 감정)
EMOTION_PROMPTS = {
    "happy": "내담자가 긍정적인 상태입니다. 행복한 순간을 깊이 탐색하고 이를 유지하는 방법을 함께 생각하세요.",
    "sad": "내담자가 우울해하고 있습니다. 공감과 위로를 중심으로 대화하세요. 감정을 수용하고 긍정적인 측면을 찾도록 도와주세요.",
    "angry": "내담자가 화가 나 있습니다. 감정을 수용하고 진정시키는 데 집중하세요. 분노의 원인을 탐색하고 건설적인 표현 방법을 제안하세요.",
    "anxious": "내담자가 불안해하고 있습니다. 안정감을 주는 톤으로 대화하세요. 걱정을 경청하고 구체적인 대처 방법을 제시하세요.",
    "neutral": "중립적인 톤으로 대화를 이어가세요. 내담자의 이야기를 경청하고 필요한 지지를 제공하세요.",
    "surprised": "내담자가 놀람을 경험했습니다. 그 경험에 대해 자세히 들어보고 적절한 반응을 돕습니다.",
    "disgusted": "내담자가 불쾌감을 느끼고 있습니다. 감정을 인정하고 경계 설정의 중요성을 다루세요.",
    "fearful": "내담자가 두려움을 느끼고 있습니다. 안전감을 제공하고 두려움의 근원을 함께 탐색하세요. 작은 단계부터 시작하는 대처 방법을 제안하세요."
}

BASE_SYSTEM_PROMPT = """당신은 전문 심리 상담사입니다.
공감적이고 따뜻한 태도로 내담자의 이야기를 경청하고, 인지행동치료(CBT) 기법을 활용하여 도움을 제공하세요.

응답 가이드라인:
- 한 번에 2-3문장으로 간결하게 응답하세요 (TTS 음성으로 재생되므로 짧게)
- 내담자의 감정을 먼저 인정하고 수용하세요
- 구체적이고 실천 가능한 질문이나 제안을 하세요
- 전문적이면서도 따뜻한 톤을 유지하세요
- 판단하지 말고 경청하세요
- 자연스러운 구어체를 사용하세요
"""

def build_system_prompt(emotion: Optional[str]) -> str:
    """감정에 따른 시스템 프롬프트 생성"""
    emotion_guidance = EMOTION_PROMPTS.get(emotion, EMOTION_PROMPTS["neutral"]) if emotion else EMOTION_PROMPTS["neutral"]
    return f"{BASE_SYSTEM_PROMPT}\n\n현재 감정 상태: {emotion_guidance}"

async def get_conversation_history(session_id: str, db_pool) -> List[Dict[str, str]]:
    """세션의 최근 대화 히스토리 조회 (최근 10개)"""
    async with db_pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT user_message, ai_response, emotion
            FROM conversations
            WHERE session_id = $1
            ORDER BY timestamp ASC
            LIMIT 10
        """, session_id)

        return [
            {
                "role": "user",
                "parts": [row["user_message"]],
                "emotion": row["emotion"]
            },
            {
                "role": "model",
                "parts": [row["ai_response"]]
            }
            for row in rows
        ]

async def generate_ai_response_stream(
    user_message: str,
    emotion: Optional[str],
    session_id: str,
    db_pool
) -> AsyncGenerator[str, None]:
    """
    AI 응답 스트리밍 생성

    Args:
        user_message: 사용자 메시지
        emotion: 현재 감정 상태
        session_id: 세션 ID
        db_pool: DB connection pool

    Yields:
        str: 응답 청크 (chunk)
    """
    try:
        # 1. 대화 히스토리 조회
        history = await get_conversation_history(session_id, db_pool)

        # 2. 시스템 프롬프트 생성
        system_prompt = build_system_prompt(emotion)

        # 3. Gemini 모델 초기화
        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            generation_config={
                "temperature": 0.7,
                "top_p": 0.9,
                "top_k": 40,
                "max_output_tokens": 200,  # 짧은 응답 (TTS용)
            },
            system_instruction=system_prompt
        )

        # 4. 채팅 세션 시작
        chat = model.start_chat(history=[
            {"role": h["role"], "parts": h["parts"]}
            for h in history
        ])

        # 5. 스트리밍 응답 생성
        response = chat.send_message(user_message, stream=True)

        full_response = ""
        for chunk in response:
            if chunk.text:
                full_response += chunk.text
                yield chunk.text  # ← Frontend가 받을 청크

        # 6. DB에 대화 저장
        await save_conversation(
            session_id=session_id,
            user_message=user_message,
            ai_response=full_response,
            emotion=emotion,
            timestamp=int(asyncio.get_event_loop().time() * 1000),
            db_pool=db_pool
        )

    except Exception as e:
        print(f"AI response generation error: {e}")
        raise

async def save_conversation(
    session_id: str,
    user_message: str,
    ai_response: str,
    emotion: Optional[str],
    timestamp: int,
    db_pool
):
    """대화 내역 저장"""
    async with db_pool.acquire() as conn:
        async with conn.transaction():
            # 세션 존재 여부 확인 (FK 에러 방지)
            session_exists = await conn.fetchval(
                "SELECT EXISTS(SELECT 1 FROM sessions WHERE session_id = $1)",
                session_id
            )

            if not session_exists:
                raise ValueError(f"Session {session_id} not found")

            # 대화 저장
            await conn.execute("""
                INSERT INTO conversations (session_id, user_message, ai_response, emotion, timestamp)
                VALUES ($1, $2, $3, $4, $5)
            """, session_id, user_message, ai_response, emotion, timestamp)
```

### 4. WebSocket 핸들러 (websocket_handlers.py)

```python
"""
WebSocket 메시지 핸들러
- request_ai_response 타입 처리
- 스트리밍 응답 전송
- 에러 핸들링
"""
import asyncio
from typing import Dict, Any
from fastapi import WebSocket, WebSocketDisconnect
from .ai_service import generate_ai_response_stream
from .rate_limiter import check_rate_limit
import logging

logger = logging.getLogger(__name__)

async def handle_ai_request(
    message: Dict[str, Any],
    websocket: WebSocket,
    session_id: str,
    db_pool
):
    """
    request_ai_response 메시지 처리

    Message format:
    {
        "type": "request_ai_response",
        "data": {
            "message": str,
            "emotion": str | null,
            "timestamp": int
        }
    }
    """
    try:
        # 1. 메시지 파싱
        data = message.get("data", {})
        user_message = data.get("message", "").strip()
        emotion = data.get("emotion")

        # 2. 입력 검증
        if not user_message:
            await websocket.send_json({
                "type": "ai_stream_error",
                "data": {"error": "메시지를 입력해주세요"}
            })
            return

        if len(user_message) > 2000:
            await websocket.send_json({
                "type": "ai_stream_error",
                "data": {"error": "메시지가 너무 깁니다 (최대 2000자)"}
            })
            return

        # 3. Rate limiting 체크
        if not check_rate_limit(session_id):
            await websocket.send_json({
                "type": "ai_stream_error",
                "data": {"error": "요청 횟수가 초과되었습니다"}
            })
            return

        # 4. 스트리밍 시작 신호
        await websocket.send_json({
            "type": "ai_stream_begin",
            "data": {}
        })

        # 5. AI 응답 스트리밍
        async for chunk in generate_ai_response_stream(
            user_message=user_message,
            emotion=emotion,
            session_id=session_id,
            db_pool=db_pool
        ):
            # ⚠️ CRITICAL: 필드명은 반드시 "chunk"
            await websocket.send_json({
                "type": "ai_stream_chunk",
                "data": {"chunk": chunk}
            })

            # 청크 간 약간의 딜레이 (자연스러운 스트리밍)
            await asyncio.sleep(0.05)

        # 6. 스트리밍 완료 신호
        await websocket.send_json({
            "type": "ai_stream_complete",
            "data": {}
        })

        logger.info(f"AI response completed for session {session_id}")

    except ValueError as e:
        # 세션 관련 에러 (FK 제약 위반 등)
        logger.error(f"Session validation error: {e}")
        await websocket.send_json({
            "type": "ai_stream_error",
            "data": {"error": "세션이 만료되었습니다"}
        })

    except Exception as e:
        # 기타 에러
        logger.error(f"AI request handling error: {e}")
        await websocket.send_json({
            "type": "ai_stream_error",
            "data": {"error": "AI 서비스가 일시적으로 사용할 수 없습니다"}
        })

# WebSocket 메시지 라우터
async def handle_session_message(
    message: Dict[str, Any],
    websocket: WebSocket,
    session_id: str,
    db_pool
):
    """세션 WebSocket 메시지 라우팅"""
    message_type = message.get("type")

    if message_type == "request_ai_response":
        await handle_ai_request(message, websocket, session_id, db_pool)

    elif message_type == "status_update":
        # 기존 status_update 처리 로직
        pass

    else:
        logger.warning(f"Unknown message type: {message_type}")
```

### 5. Rate Limiter (rate_limiter.py)

```python
"""
Rate limiting 구현
- 세션당 분당 최대 요청 수 제한
"""
import time
from collections import defaultdict
from typing import Dict, List
import os

MAX_REQUESTS = int(os.getenv("MAX_AI_REQUESTS_PER_MINUTE", "10"))
TIME_WINDOW = 60  # seconds

# {session_id: [timestamp1, timestamp2, ...]}
request_history: Dict[str, List[float]] = defaultdict(list)

def check_rate_limit(session_id: str) -> bool:
    """
    Rate limit 체크

    Returns:
        bool: True if allowed, False if rate limit exceeded
    """
    now = time.time()
    history = request_history[session_id]

    # 시간 윈도우 밖의 요청 제거
    request_history[session_id] = [
        ts for ts in history
        if now - ts < TIME_WINDOW
    ]

    # 현재 요청 수 체크
    if len(request_history[session_id]) >= MAX_REQUESTS:
        return False

    # 현재 요청 기록
    request_history[session_id].append(now)
    return True

def reset_rate_limit(session_id: str):
    """세션 종료 시 rate limit 초기화"""
    if session_id in request_history:
        del request_history[session_id]
```

### 6. Main FastAPI App (main.py 일부)

```python
"""
FastAPI WebSocket 엔드포인트
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
import asyncpg
import os
from .websocket_handlers import handle_session_message
from .rate_limiter import reset_rate_limit

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# PostgreSQL connection pool
@app.on_event("startup")
async def startup():
    app.state.db_pool = await asyncpg.create_pool(
        os.getenv("DATABASE_URL"),
        min_size=5,
        max_size=20
    )

@app.on_event("shutdown")
async def shutdown():
    await app.state.db_pool.close()

# WebSocket 엔드포인트
@app.websocket("/ws/session/{session_id}")
async def websocket_session_endpoint(
    websocket: WebSocket,
    session_id: str
):
    await websocket.accept()

    try:
        while True:
            # 메시지 수신
            message = await websocket.receive_json()

            # 메시지 처리
            await handle_session_message(
                message=message,
                websocket=websocket,
                session_id=session_id,
                db_pool=app.state.db_pool
            )

    except WebSocketDisconnect:
        print(f"Session {session_id} disconnected")
        reset_rate_limit(session_id)

    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()
        reset_rate_limit(session_id)
```

---

## 🧪 테스트 가이드

### 1. 로컬 테스트 (Python 클라이언트)

```python
"""
WebSocket AI 응답 테스트
"""
import asyncio
import websockets
import json

async def test_ai_response():
    uri = "ws://localhost:8000/ws/session/test-session-123"

    async with websockets.connect(uri) as websocket:
        # 1. AI 응답 요청 전송
        request = {
            "type": "request_ai_response",
            "data": {
                "message": "안녕하세요, 요즘 스트레스를 많이 받아요",
                "emotion": "anxious",
                "timestamp": 1704902400000
            }
        }
        await websocket.send(json.dumps(request))
        print(f"✅ Sent: {request}")

        # 2. 응답 수신
        full_response = ""
        while True:
            response = await websocket.recv()
            data = json.loads(response)

            if data["type"] == "ai_stream_begin":
                print("🎬 Streaming started")

            elif data["type"] == "ai_stream_chunk":
                chunk = data["data"]["chunk"]
                full_response += chunk
                print(f"📝 Chunk: {chunk}")

            elif data["type"] == "ai_stream_complete":
                print(f"✅ Streaming completed")
                print(f"💬 Full response: {full_response}")
                break

            elif data["type"] == "ai_stream_error":
                error = data["data"]["error"]
                print(f"❌ Error: {error}")
                break

if __name__ == "__main__":
    asyncio.run(test_ai_response())
```

### 2. Frontend 통합 테스트

#### 테스트 시나리오 1: 정상 응답
1. Frontend에서 음성으로 "안녕하세요" 말하기
2. **기대 동작**:
   - Overlay에 사용자 메시지 표시 (파란색 배경)
   - 현재 감정 배지 표시 (예: "불안")
   - 3초 후 자동 사라짐
   - AI 응답 스트리밍 시작
   - "응답 생성 중..." 표시
   - 청크 단위로 메시지 누적 표시
   - 완료 후 TTS 재생 시작
   - "🔊 재생 중" 표시
   - TTS 종료 1초 후 Overlay 사라짐

#### 테스트 시나리오 2: 에러 처리
1. Backend 서버 중단 상태에서 메시지 전송
2. **기대 동작**:
   - Overlay에 에러 메시지 표시 (빨간색 배경)
   - 라벨: "오류"
   - 메시지: "AI 서비스가 일시적으로 사용할 수 없습니다"
   - 안내: "💡 세션이 만료되었을 수 있습니다. 페이지를 새로고침해주세요."
   - 5초 후 자동 사라짐

#### 테스트 시나리오 3: Foreign Key 에러
1. Backend에서 sessions 테이블에 session_id 없는 상태
2. **기대 동작**:
   - Frontend가 foreign key 에러 패턴 감지
   - Overlay에 "세션이 만료되었습니다" 표시
   - 새로고침 안내 메시지 표시

### 3. 브라우저 콘솔 확인

**정상 응답 로그**:
```
[AI Stream] Begin
[AI Stream] Chunk: 안녕하세요.
[AI Stream] Chunk: 스트레스를 받고 계시는군요.
[AI Stream] Complete
```

**에러 로그**:
```
[AI Stream] Error: 세션이 만료되었습니다
```

---

## 🚨 주의사항 및 체크리스트

### ✅ 필수 구현 사항
- [ ] WebSocket 엔드포인트 `/ws/session/{session_id}` 구현
- [ ] `request_ai_response` 메시지 타입 핸들러 추가
- [ ] 3단계 스트리밍 응답 (`ai_stream_begin` → `ai_stream_chunk` → `ai_stream_complete`)
- [ ] **`chunk` 필드명 사용** (`text` 아님!)
- [ ] Foreign Key 제약 위반 방지 (세션 존재 여부 검증)
- [ ] conversations 테이블 생성 및 FK 설정
- [ ] 감정 기반 시스템 프롬프트 (8가지 감정)
- [ ] Rate limiting (10 req/min/session)
- [ ] 입력 검증 (1-2000자, trim)
- [ ] 사용자 친화적 에러 메시지

### ⚠️ 흔한 실수
1. **필드명 오류**: `data.text` 대신 `data.chunk` 사용
2. **FK 제약 위반**: 세션 존재 여부 확인 없이 INSERT
3. **기술적 에러 노출**: "NoneType error" 대신 "세션이 만료되었습니다"
4. **긴 응답**: TTS용이므로 2-3문장으로 제한 (`max_output_tokens: 200`)
5. **스트리밍 순서**: begin → chunks → complete (순서 중요!)

### 🔍 디버깅 팁
1. **Frontend 콘솔 확인**: 브라우저 개발자 도구에서 WebSocket 메시지 확인
2. **Backend 로그**: `logger.info()` 추가하여 메시지 흐름 추적
3. **DB 쿼리 로그**: asyncpg 쿼리 로깅 활성화
4. **Gemini API 에러**: API 키, 요청 제한, 모델 이름 확인

---

## 📚 참고 자료

### Frontend 구현 파일
- [`src/hooks/useAIVoiceChat.ts`](../../src/hooks/useAIVoiceChat.ts) - AI 채팅 상태 관리
- [`src/components/AIChat/AIMessageOverlay.tsx`](../../src/components/AIChat/AIMessageOverlay.tsx) - Overlay UI
- [`src/App.tsx (lines 343-408)`](../../src/App.tsx#L343-L408) - 이벤트 핸들러
- [`src/types/ai-chat.ts`](../../src/types/ai-chat.ts) - 타입 정의

### 기존 백엔드 문서
- `BACKEND_AI_IMPLEMENTATION_PROMPT.md` - 상세 구현 가이드 (v1)
- `BACKEND_AI_VOICE_REQUEST.md` - 요약 버전

### 외부 문서
- [Gemini API Documentation](https://ai.google.dev/docs)
- [FastAPI WebSockets](https://fastapi.tiangolo.com/advanced/websockets/)
- [asyncpg Documentation](https://magicstack.github.io/asyncpg/)

---

## 🎉 완료 기준

다음 조건을 모두 만족하면 구현 완료:

1. ✅ Frontend에서 음성 입력 → AI 응답 수신 → TTS 재생 전체 플로우 동작
2. ✅ Overlay에 스트리밍 응답 실시간 표시
3. ✅ 감정 배지 올바르게 표시
4. ✅ 에러 발생 시 사용자 친화적 메시지 표시
5. ✅ DB에 대화 내역 정상 저장 (FK 에러 없음)
6. ✅ Rate limiting 동작
7. ✅ 브라우저 콘솔에 에러 없음

**테스트 방법**: Frontend 개발 서버 실행 후 실제 음성으로 대화 시도

---

**작성**: 2025-01-14
**버전**: 2.0 (Phase 14 Video Overlay 반영)
**문의**: Frontend 개발자와 협업하여 WebSocket 메시지 프로토콜 검증
