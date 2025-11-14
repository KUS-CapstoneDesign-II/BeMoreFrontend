# 🤖 BeMore AI 음성 상담 백엔드 구현 - Claude 실행 프롬프트

**작성일**: 2025-01-14
**대상**: 백엔드 개발자 (FastAPI + Python)
**목적**: Claude Code에 복사-붙여넣기하여 AI 음성 상담 기능 즉시 구현

---

## 📋 복사하여 Claude Code에 붙여넣기

```
당신은 FastAPI 백엔드 개발자입니다. BeMore AI 심리 상담 시스템의 실시간 AI 음성 상담 기능을 구현해야 합니다.

## 프로젝트 컨텍스트

BeMore는 실시간 얼굴 감정 인식 + AI 음성 상담을 제공하는 웹 애플리케이션입니다.
- **프론트엔드**: React + TypeScript (이미 완료)
- **백엔드**: FastAPI + Python (AI 응답 기능만 필요)
- **데이터베이스**: PostgreSQL (Supabase)
- **AI**: Gemini 1.5 Pro (Google)

**현재 상황**:
✅ 프론트엔드는 완전히 구현됨
✅ WebSocket 연결 설정됨
✅ 사용자 음성 → 텍스트 변환 완료
❌ AI 응답 생성 기능만 없음 (이 작업이 필요)

**프론트엔드 동작 방식**:
1. 사용자가 음성으로 말함 → STT → 텍스트
2. 프론트엔드가 WebSocket으로 `request_ai_response` 메시지 전송
3. **백엔드가 AI 응답 생성** (← 이 부분을 구현해야 함)
4. AI 응답을 스트리밍으로 프론트엔드에 전송
5. 프론트엔드가 TTS로 음성 재생

---

## 🎯 구현 목표

다음 기능들을 구현해주세요:

### 1. WebSocket 메시지 핸들러 추가
- 엔드포인트: `/ws/session/{session_id}`
- 새 메시지 타입: `request_ai_response` 처리
- 스트리밍 응답: `ai_stream_begin` → `ai_stream_chunk` (여러 번) → `ai_stream_complete`

### 2. Gemini AI 통합
- Google Gemini 1.5 Pro API 사용
- 스트리밍 응답 구현
- 감정 기반 시스템 프롬프트 (8개 감정 지원)

### 3. 대화 히스토리 관리
- PostgreSQL `conversations` 테이블 생성
- 사용자 메시지 + AI 응답 저장
- 세션별 최근 10개 대화 조회 (맥락 유지)

### 4. 에러 핸들링 및 보안
- Rate limiting (사용자당 분당 10회)
- 메시지 길이 제한 (2000자)
- 세션 ID 검증
- 에러 시 `ai_stream_error` 전송

---

## 📡 WebSocket 메시지 스펙

### 프론트엔드 → 백엔드 (요청)

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

**필드 설명**:
- `message` (string): 사용자 메시지 (STT 결과)
- `emotion` (string|null): 현재 얼굴 감정 (8개 감정 중 하나 또는 null)
  - `happy`, `sad`, `angry`, `anxious`, `neutral`, `surprised`, `disgusted`, `fearful`
- `timestamp` (number): 요청 시간 (밀리초)

### 백엔드 → 프론트엔드 (응답)

**3단계 스트리밍**:

**1단계: 스트리밍 시작**
```json
{
  "type": "ai_stream_begin",
  "data": {}
}
```

**2단계: 응답 청크 전송 (여러 번)**
```json
{
  "type": "ai_stream_chunk",
  "data": {
    "chunk": "스트레스를 받고 계시는군요. "
  }
}
```

⚠️ **중요**: 필드명은 반드시 `chunk`여야 합니다 (`text` 아님!)

**3단계: 스트리밍 완료**
```json
{
  "type": "ai_stream_complete",
  "data": {}
}
```

**에러 발생 시**:
```json
{
  "type": "ai_stream_error",
  "data": {
    "error": "AI 서비스가 일시적으로 사용할 수 없습니다"
  }
}
```

---

## 🗄️ 데이터베이스 스키마

### PostgreSQL 마이그레이션 SQL

```sql
-- conversations 테이블 생성
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    emotion VARCHAR(50),
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_conversations_session ON conversations(session_id);
CREATE INDEX idx_conversations_timestamp ON conversations(timestamp DESC);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

-- 세션별 대화 조회 함수 (최근 10개)
CREATE OR REPLACE FUNCTION get_recent_conversations(p_session_id VARCHAR)
RETURNS TABLE (
    user_message TEXT,
    ai_response TEXT,
    emotion VARCHAR(50),
    timestamp BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.user_message,
        c.ai_response,
        c.emotion,
        c.timestamp
    FROM conversations c
    WHERE c.session_id = p_session_id
    ORDER BY c.timestamp ASC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔧 구현 코드

### 1. 환경 변수 (.env)

```bash
# Gemini AI API Key
GEMINI_API_KEY=your-gemini-api-key-here

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Secret
JWT_SECRET_KEY=your-secret-key

# Rate Limiting
MAX_AI_REQUESTS_PER_MINUTE=10
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
```

### 3. AI 응답 생성 함수 (ai_service.py)

```python
import os
import asyncio
from typing import AsyncGenerator, Optional, List, Dict
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Gemini API 초기화
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# 감정별 시스템 프롬프트
EMOTION_PROMPTS = {
    "anxious": "내담자가 불안해하고 있습니다. 안정감을 주는 톤으로 대화하세요. 걱정을 경청하고 구체적인 대처 방법을 제시하세요.",
    "sad": "내담자가 우울해하고 있습니다. 공감과 위로를 중심으로 대화하세요. 감정을 수용하고 긍정적인 측면을 찾도록 도와주세요.",
    "angry": "내담자가 화가 나 있습니다. 감정을 수용하고 진정시키는 데 집중하세요. 분노의 원인을 탐색하고 건설적인 표현 방법을 제안하세요.",
    "happy": "내담자의 긍정적인 상태를 강화하세요. 행복한 순간을 더 깊이 탐색하고 이러한 상태를 유지하는 방법을 함께 생각하세요.",
    "fearful": "내담자가 두려움을 느끼고 있습니다. 안전감을 제공하고 두려움의 근원을 함께 탐색하세요. 작은 단계부터 시작하는 대처 방법을 제안하세요.",
    "surprised": "내담자가 놀람을 경험했습니다. 그 경험에 대해 자세히 들어보고 적절한 반응을 돕습니다.",
    "disgusted": "내담자가 불쾌감을 느끼고 있습니다. 감정을 인정하고 경계 설정의 중요성을 다루세요.",
    "neutral": "중립적인 톤으로 대화를 이어가세요. 내담자의 이야기를 경청하고 필요한 지지를 제공하세요."
}

BASE_SYSTEM_PROMPT = """당신은 전문 심리 상담사입니다.
공감적이고 따뜻한 태도로 내담자의 이야기를 경청하고, 인지행동치료(CBT) 기법을 활용하여 도움을 제공하세요.

응답 가이드라인:
- 한 번에 2-3문장으로 간결하게 응답하세요
- 내담자의 감정을 먼저 인정하고 수용하세요
- 구체적이고 실천 가능한 질문이나 제안을 하세요
- 전문적이면서도 따뜻한 톤을 유지하세요
- 판단하지 말고 경청하세요
"""

def build_system_prompt(emotion: Optional[str]) -> str:
    """감정에 따른 시스템 프롬프트 생성"""
    emotion_guidance = EMOTION_PROMPTS.get(emotion, EMOTION_PROMPTS["neutral"])
    return f"{BASE_SYSTEM_PROMPT}\n\n현재 감정 상태: {emotion_guidance}"

async def get_conversation_history(session_id: str, db_pool) -> List[Dict[str, str]]:
    """세션의 최근 대화 히스토리 조회 (최근 10개)"""
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT user_message, ai_response, emotion
            FROM conversations
            WHERE session_id = $1
            ORDER BY timestamp ASC
            LIMIT 10
            """,
            session_id
        )

        history = []
        for row in rows:
            history.append({
                "role": "user",
                "parts": [row["user_message"]]
            })
            history.append({
                "role": "model",
                "parts": [row["ai_response"]]
            })

        return history

async def generate_ai_response(
    user_message: str,
    emotion: Optional[str],
    session_id: str,
    db_pool
) -> AsyncGenerator[str, None]:
    """
    Gemini AI로 스트리밍 응답 생성

    Args:
        user_message: 사용자 메시지
        emotion: 현재 감정 상태 (8개 감정 중 하나)
        session_id: 세션 ID (대화 히스토리 조회용)
        db_pool: 데이터베이스 연결 풀

    Yields:
        AI 응답 청크 (텍스트)
    """
    # 1. 시스템 프롬프트 구성
    system_prompt = build_system_prompt(emotion)

    # 2. 대화 히스토리 조회
    conversation_history = await get_conversation_history(session_id, db_pool)

    # 3. Gemini 모델 초기화
    model = genai.GenerativeModel(
        model_name='gemini-1.5-pro',
        system_instruction=system_prompt
    )

    # 4. 현재 메시지 추가
    conversation_history.append({
        "role": "user",
        "parts": [user_message]
    })

    # 5. 스트리밍 응답 생성
    try:
        response = model.generate_content(
            conversation_history,
            stream=True,
            generation_config={
                "temperature": 0.7,
                "top_p": 0.8,
                "top_k": 40,
                "max_output_tokens": 1024,
            }
        )

        # 6. 청크 단위로 yield (자연스러운 속도)
        for chunk in response:
            if chunk.text:
                yield chunk.text
                await asyncio.sleep(0.05)  # 50ms 간격 (자연스러운 읽기 속도)

    except Exception as e:
        raise Exception(f"Gemini AI 응답 생성 실패: {str(e)}")

async def save_conversation(
    session_id: str,
    user_message: str,
    ai_response: str,
    emotion: Optional[str],
    timestamp: int,
    db_pool
) -> None:
    """대화 히스토리를 데이터베이스에 저장"""
    async with db_pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO conversations (session_id, user_message, ai_response, emotion, timestamp)
            VALUES ($1, $2, $3, $4, $5)
            """,
            session_id,
            user_message,
            ai_response,
            emotion,
            timestamp
        )
```

### 4. WebSocket 핸들러 (websocket_handlers.py)

```python
import asyncio
import logging
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Any
from datetime import datetime, timedelta
from collections import defaultdict

from .ai_service import generate_ai_response, save_conversation

logger = logging.getLogger(__name__)

# Rate limiting (사용자당 분당 요청 제한)
rate_limit_tracker: Dict[str, list] = defaultdict(list)
MAX_REQUESTS_PER_MINUTE = 10

def check_rate_limit(session_id: str) -> bool:
    """Rate limiting 체크 (분당 10회 제한)"""
    now = datetime.now()
    one_minute_ago = now - timedelta(minutes=1)

    # 1분 이내 요청만 필터링
    rate_limit_tracker[session_id] = [
        req_time for req_time in rate_limit_tracker[session_id]
        if req_time > one_minute_ago
    ]

    # 제한 초과 확인
    if len(rate_limit_tracker[session_id]) >= MAX_REQUESTS_PER_MINUTE:
        return False

    # 현재 요청 추가
    rate_limit_tracker[session_id].append(now)
    return True

async def handle_ai_response_request(
    websocket: WebSocket,
    message: Dict[str, Any],
    session_id: str,
    db_pool
) -> None:
    """
    AI 응답 요청 처리 및 스트리밍 응답 전송

    Args:
        websocket: WebSocket 연결
        message: 클라이언트로부터 받은 메시지
        session_id: 세션 ID
        db_pool: 데이터베이스 연결 풀
    """
    try:
        # 1. 데이터 추출
        data = message.get("data", {})
        user_message = data.get("message", "").strip()
        emotion = data.get("emotion")
        timestamp = data.get("timestamp", int(datetime.now().timestamp() * 1000))

        # 2. 입력 검증
        if not user_message:
            await websocket.send_json({
                "type": "ai_stream_error",
                "data": {"error": "메시지가 비어있습니다"}
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
                "data": {"error": "요청이 너무 많습니다. 잠시 후 다시 시도해주세요"}
            })
            logger.warning(f"[Rate Limit] session={session_id}, message={user_message[:50]}...")
            return

        logger.info(f"[AI Request] session={session_id}, emotion={emotion}, message={user_message[:100]}...")

        # 4. 스트리밍 시작 알림
        await websocket.send_json({
            "type": "ai_stream_begin",
            "data": {}
        })

        # 5. AI 응답 스트리밍
        full_response = ""
        async for chunk in generate_ai_response(user_message, emotion, session_id, db_pool):
            # 청크 전송
            await websocket.send_json({
                "type": "ai_stream_chunk",
                "data": {"chunk": chunk}  # ⚠️ 필드명 "chunk" 필수!
            })
            full_response += chunk

        # 6. 스트리밍 완료 알림
        await websocket.send_json({
            "type": "ai_stream_complete",
            "data": {}
        })

        logger.info(f"[AI Response] session={session_id}, length={len(full_response)}, response={full_response[:100]}...")

        # 7. 대화 히스토리 저장
        await save_conversation(
            session_id=session_id,
            user_message=user_message,
            ai_response=full_response,
            emotion=emotion,
            timestamp=timestamp,
            db_pool=db_pool
        )

    except Exception as e:
        logger.error(f"[AI Error] session={session_id}, error={str(e)}", exc_info=True)

        # 에러 전송
        await websocket.send_json({
            "type": "ai_stream_error",
            "data": {"error": f"AI 응답 생성 중 오류가 발생했습니다: {str(e)}"}
        })

async def websocket_session_endpoint(websocket: WebSocket, session_id: str, db_pool):
    """
    세션 WebSocket 엔드포인트

    기존 엔드포인트에 이 핸들러를 추가하세요
    """
    await websocket.accept()

    try:
        while True:
            # 메시지 수신
            message = await websocket.receive_json()

            # AI 응답 요청 처리 (새로 추가된 부분)
            if message.get("type") == "request_ai_response":
                await handle_ai_response_request(websocket, message, session_id, db_pool)

            # 기존 메시지 타입 처리
            elif message.get("type") == "emotion_update":
                # ... 기존 코드 유지
                pass

            elif message.get("type") == "vad_metrics":
                # ... 기존 코드 유지
                pass

            # ... 기타 메시지 타입

    except WebSocketDisconnect:
        logger.info(f"[WebSocket] Session {session_id} disconnected")
    except Exception as e:
        logger.error(f"[WebSocket Error] session={session_id}, error={str(e)}", exc_info=True)
```

### 5. 메인 애플리케이션 통합 (main.py)

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import asyncpg
import os
from dotenv import load_dotenv

from .websocket_handlers import websocket_session_endpoint

load_dotenv()

app = FastAPI(title="BeMore Backend API")

# 데이터베이스 연결 풀
db_pool = None

@app.on_event("startup")
async def startup():
    global db_pool
    db_pool = await asyncpg.create_pool(
        os.getenv("DATABASE_URL"),
        min_size=5,
        max_size=20
    )
    print("✅ Database connection pool created")

@app.on_event("shutdown")
async def shutdown():
    await db_pool.close()
    print("✅ Database connection pool closed")

@app.websocket("/ws/session/{session_id}")
async def session_websocket(websocket: WebSocket, session_id: str):
    """세션 WebSocket 엔드포인트"""
    await websocket_session_endpoint(websocket, session_id, db_pool)
```

---

## ✅ 테스트 절차

### 1. 로컬 환경 설정

```bash
# 1. 환경 변수 설정
cp .env.example .env
# GEMINI_API_KEY 설정

# 2. 의존성 설치
pip install -r requirements.txt

# 3. 데이터베이스 마이그레이션
psql $DATABASE_URL < migrations/create_conversations_table.sql

# 4. 서버 실행
uvicorn main:app --reload --port 8000
```

### 2. WebSocket 테스트 (Python)

```python
import asyncio
import websockets
import json

async def test_ai_chat():
    uri = "ws://localhost:8000/ws/session/test_session_123"

    async with websockets.connect(uri) as websocket:
        # AI 응답 요청
        await websocket.send(json.dumps({
            "type": "request_ai_response",
            "data": {
                "message": "안녕하세요, 요즘 우울해요",
                "emotion": "sad",
                "timestamp": 1704902400000
            }
        }))

        print("✅ Request sent")

        # 응답 수신
        full_response = ""
        while True:
            response = await websocket.recv()
            message = json.loads(response)

            if message["type"] == "ai_stream_begin":
                print("🟢 Stream started")

            elif message["type"] == "ai_stream_chunk":
                chunk = message["data"]["chunk"]
                full_response += chunk
                print(f"📝 Chunk: {chunk}")

            elif message["type"] == "ai_stream_complete":
                print(f"✅ Stream complete\n\nFull response:\n{full_response}")
                break

            elif message["type"] == "ai_stream_error":
                print(f"❌ Error: {message['data']['error']}")
                break

asyncio.run(test_ai_chat())
```

### 3. 프론트엔드 통합 테스트

1. 백엔드 서버 실행: `uvicorn main:app --reload`
2. 프론트엔드 서버 실행: `npm run dev`
3. 브라우저에서 접속: `http://localhost:5173`
4. 세션 시작 버튼 클릭
5. 마이크 권한 허용
6. 음성으로 말하기: "안녕하세요"
7. 확인 사항:
   - ✅ 사용자 메시지가 화면에 표시
   - ✅ AI 응답이 실시간 스트리밍
   - ✅ TTS로 AI 음성 재생
   - ✅ 개발자 도구에서 WebSocket 메시지 확인

### 4. 성능 테스트

```bash
# 응답 시간 측정 (첫 번째 청크 <2초)
time python test_ai_chat.py

# 동시 연결 테스트 (10 concurrent users)
python test_concurrent_sessions.py
```

---

## 🚀 배포 체크리스트

### Render.com 배포

```bash
# 1. 환경 변수 설정 (Render Dashboard)
GEMINI_API_KEY=your-api-key
DATABASE_URL=postgresql://...
JWT_SECRET_KEY=...

# 2. Build Command
pip install -r requirements.txt

# 3. Start Command
uvicorn main:app --host 0.0.0.0 --port $PORT

# 4. Health Check
GET /health
```

### 배포 전 체크리스트

- [ ] ✅ GEMINI_API_KEY 환경 변수 설정
- [ ] ✅ DATABASE_URL 설정 (PostgreSQL)
- [ ] ✅ conversations 테이블 마이그레이션 완료
- [ ] ✅ Rate limiting 설정 확인
- [ ] ✅ 로깅 설정 (에러 추적)
- [ ] ✅ CORS 설정 (프론트엔드 도메인 허용)
- [ ] ✅ 로컬 테스트 통과
- [ ] ✅ 프론트엔드 통합 테스트 통과

---

## 📊 성능 요구사항

- **첫 청크 응답 시간**: < 2초
- **스트리밍 속도**: 50-100ms/청크
- **전체 응답 시간**: < 10초 (일반적인 답변)
- **동시 연결**: 세션당 1개 WebSocket
- **데이터베이스 쿼리**: < 100ms

---

## ⚠️ 주의사항

### 1. 필수 필드명
```python
# ✅ 올바른 필드명
{"type": "ai_stream_chunk", "data": {"chunk": "텍스트"}}

# ❌ 잘못된 필드명 (프론트엔드 파싱 실패)
{"type": "ai_stream_chunk", "data": {"text": "텍스트"}}
```

### 2. 감정 지원
8개 감정을 모두 지원해야 합니다:
- `happy`, `sad`, `angry`, `anxious`, `neutral`, `surprised`, `disgusted`, `fearful`

### 3. 한국어 인코딩
- UTF-8 인코딩 필수
- 모든 AI 응답은 한국어로

### 4. 보안
```python
# 민감 정보 로깅 방지
logger.info(f"User message: {user_message[:50]}...")  # ✅ 일부만
logger.info(f"User message: {user_message}")  # ❌ 전체 로깅 금지
```

---

## 🔍 트러블슈팅

### Q1: Gemini API 에러 (403 Forbidden)
**원인**: API 키가 잘못되었거나 할당량 초과
**해결**:
1. API 키 확인: https://makersuite.google.com/app/apikey
2. 할당량 확인: https://console.cloud.google.com/

### Q2: 스트리밍이 멈춤
**원인**: WebSocket 연결 타임아웃
**해결**:
```python
# uvicorn --timeout-keep-alive 300 추가
uvicorn main:app --timeout-keep-alive 300
```

### Q3: 대화 히스토리가 저장 안 됨
**원인**: 외래 키 제약 조건
**해결**:
```sql
-- sessions 테이블에 session_id가 존재하는지 확인
SELECT * FROM sessions WHERE session_id = 'test_session_123';
```

### Q4: Rate limiting 작동 안 함
**원인**: 서버 재시작 시 메모리 초기화
**해결**: Redis 사용 (선택)
```python
import redis
r = redis.Redis(host='localhost', port=6379, db=0)
```

---

## 📞 구현 후 확인

구현이 완료되면 다음을 확인하세요:

1. ✅ 로컬 테스트 통과
2. ✅ 프론트엔드 통합 테스트 통과
3. ✅ 첫 청크 응답 시간 < 2초
4. ✅ 대화 히스토리 저장 확인
5. ✅ Rate limiting 동작 확인
6. ✅ 에러 핸들링 확인

**프론트엔드 팀에 알려주세요**:
- 백엔드 배포 URL
- 테스트 계정 정보 (있다면)
- API 키 설정 상태

---

## 📚 참고 문서

- [Gemini API - Streaming](https://ai.google.dev/gemini-api/docs/text-generation?lang=python#generate-a-text-stream)
- [FastAPI WebSocket](https://fastapi.tiangolo.com/advanced/websockets/)
- [asyncpg Documentation](https://magicstack.github.io/asyncpg/current/)
- [Frontend Integration Spec](./BACKEND_AI_VOICE_REQUEST.md)

---

**구현 예상 시간**: 30분 ~ 1시간
**난이도**: 중간
**우선순위**: 🔴 High (핵심 기능)

이 프롬프트를 Claude Code에 복사-붙여넣기하면 즉시 구현을 시작할 수 있습니다!
```

---

## 🎯 사용 방법

1. **위 전체 내용을 복사**
2. **Claude Code 열기**
3. **붙여넣기**
4. **Enter**

Claude Code가 자동으로:
- 필요한 파일 생성
- 코드 구현
- 데이터베이스 마이그레이션 SQL 생성
- 테스트 코드 작성

을 수행합니다.

---

## 📝 백엔드 팀 전달 메시지

```
안녕하세요 백엔드 팀!

프론트엔드 AI 음성 상담 기능이 완성되었습니다.
백엔드 AI 응답 생성 기능만 구현하시면 즉시 작동합니다.

📄 구현 가이드: docs/integration/backend/BACKEND_AI_IMPLEMENTATION_PROMPT.md

이 파일을 Claude Code에 복사-붙여넣기만 하시면
30분 안에 모든 코드가 자동 생성됩니다.

구현 후 프론트엔드 통합 테스트를 함께 진행하겠습니다!

감사합니다 😊
```
