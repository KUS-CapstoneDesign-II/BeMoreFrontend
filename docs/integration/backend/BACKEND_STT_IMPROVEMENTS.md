# 백엔드 STT 시스템 연동 요구사항

> **작성일**: 2025-11-18
> **목적**: 프론트엔드 음성 인식 시스템 개선사항 공유 및 백엔드 연동 가이드

---

## 📋 요약 (Executive Summary)

프론트엔드에서 음성 인식(STT) 시스템의 안정성과 사용자 경험을 개선하기 위해 4가지 핵심 기능을 구현했습니다:

1. ✅ **STT 타임아웃 메커니즘** (5초)
2. ✅ **Web Speech API 폴백**
3. ✅ **AudioContext 생명주기 관리**
4. ✅ **AI 요청 디바운싱** (500ms)

이 문서는 백엔드 팀이 새로운 프론트엔드 동작을 이해하고, 최적의 연동을 위해 고려해야 할 사항들을 설명합니다.

---

## 🎯 프론트엔드 개선사항

### 1. STT 타임아웃 메커니즘 (5초)

**문제점**:
- 백엔드 STT 서비스가 응답하지 않을 때 프론트엔드가 무한정 대기
- 사용자는 시스템이 멈춘 것처럼 느낌

**해결책**:
```typescript
// App.tsx
const STT_TIMEOUT_MS = 5000; // 5초

// 음성 감지 시작 시 타이머 설정
if (vadMetrics.speechRatio > 0 || vadMetrics.speechBurstCount > 0) {
  sttTimeoutRef.current = window.setTimeout(() => {
    // 5초 내 응답 없으면 폴백 STT로 전환
    if (sttMode === 'websocket' && fallbackSTT.isSupported()) {
      setSTTMode('fallback');
      fallbackSTT.start();
      setOverlayError('WebSocket STT 시간 초과. 브라우저 음성 인식으로 전환합니다.');
    }
  }, STT_TIMEOUT_MS);
}

// STT 응답 수신 시 타이머 취소
if (message.type === 'stt_received') {
  if (sttTimeoutRef.current) {
    clearTimeout(sttTimeoutRef.current);
    sttTimeoutRef.current = null;
  }
}
```

**백엔드 영향**:
- 프론트엔드는 5초 내 `stt_received` 메시지를 기대합니다
- 5초 이상 걸리는 경우 자동으로 브라우저 폴백으로 전환됩니다
- 사용자 경험을 위해 **3-4초 이내 응답 권장**

---

### 2. Web Speech API 폴백

**문제점**:
- WebSocket STT가 단일 장애점(Single Point of Failure)
- 네트워크 문제나 백엔드 장애 시 음성 인식 완전 불가

**해결책**:
```typescript
// hooks/useFallbackSTT.ts - 새로 생성
const fallbackSTT = useFallbackSTT({
  lang: 'ko-KR',
  continuous: true,
  onResult: (text) => {
    setSttText(text);
    // AI 요청은 동일한 로직 사용
  },
  onError: (error) => {
    setOverlayError(`폴백 음성 인식 오류: ${error}`);
  },
});
```

**폴백 계층 구조**:
1. **Primary**: WebSocket STT (백엔드 연동)
2. **Fallback**: Web Speech API (브라우저 내장, Chrome/Safari)
3. **Disabled**: 모든 STT 불가 시 사용자에게 안내

**백엔드 영향**:
- WebSocket STT 실패 시 프론트엔드가 자동으로 브라우저 API 사용
- 백엔드는 STT 요청 감소를 경험할 수 있음 (폴백 모드 사용자)
- 백엔드 모니터링에서 "타임아웃 후 폴백" 비율 추적 권장

---

### 3. AudioContext 생명주기 관리

**문제점**:
- 사용자가 탭을 백그라운드로 전환 시 브라우저가 AudioContext 중단
- 탭 복귀 시 음성 인식이 작동하지 않음

**해결책**:
```typescript
// hooks/useVAD.ts
useEffect(() => {
  const handleVisibilityChange = async () => {
    if (!audioContextRef.current) return;

    if (document.visibilityState === 'visible') {
      // 탭이 포그라운드로 전환됨
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        console.log('✅ AudioContext resumed after tab visible');

        // 분석 재시작
        if (isListening && !animationFrameRef.current) {
          analyzeAudio();
        }
      }
    } else {
      // 탭이 백그라운드로 전환됨 - 분석 일시정지
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [isListening, analyzeAudio]);
```

**백엔드 영향**:
- 사용자가 탭을 백그라운드로 전환해도 WebSocket 연결은 유지됨
- 하지만 **음성 데이터 전송이 일시 중단**될 수 있음
- 탭 복귀 시 음성 스트리밍 자동 재개

**권장사항**:
- 백엔드에서 "일정 시간 동안 음성 데이터 없음" 상태를 정상으로 간주
- 연결 유지 시간 제한 필요 시 30분 이상 권장

---

### 4. AI 요청 디바운싱 (500ms)

**문제점**:
- 연속된 음성 인식 결과가 여러 번의 AI API 호출 유발
- 불필요한 백엔드 부하 및 중복 응답

**해결책**:
```typescript
// App.tsx
const AI_REQUEST_DEBOUNCE_MS = 500; // 500ms

if (message.type === 'stt_received') {
  // 기존 대기 중인 AI 요청 취소
  if (aiRequestDebounceRef.current) {
    clearTimeout(aiRequestDebounceRef.current);
  }

  // 500ms 후 AI 요청 전송
  aiRequestDebounceRef.current = window.setTimeout(() => {
    sendToSession({
      type: 'request_ai_response',
      data: { message: text, emotion: currentEmotion, timestamp: Date.now() }
    });
    aiRequestDebounceRef.current = null;
  }, AI_REQUEST_DEBOUNCE_MS);
}
```

**백엔드 영향**:
- AI API 호출 빈도 **최대 50% 감소** 예상
- 연속된 음성 입력 시 마지막 STT 결과만 AI에 전달
- 백엔드 부하 감소 및 응답 품질 향상

---

## 🔧 백엔드 권장 개선사항

### 1. STT 응답 시간 최적화

**현재 문제**:
- 프론트엔드가 5초 타임아웃 설정
- 타임아웃 발생 시 사용자는 브라우저 폴백으로 전환

**권장사항**:
```python
# 백엔드 STT 처리 예시
async def process_stt(audio_data):
    try:
        # 목표: 3초 이내 응답
        result = await stt_service.transcribe(audio_data, timeout=3.0)

        return {
            "type": "stt_received",
            "data": {
                "text": result.text,
                "confidence": result.confidence,
                "processing_time": result.elapsed_ms  # 모니터링용
            }
        }
    except TimeoutError:
        # 3초 내 처리 실패 시 부분 결과 반환
        return {
            "type": "stt_partial",
            "data": {
                "text": "",
                "error": "Processing timeout",
                "suggestion": "Please try again"
            }
        }
```

**성능 목표**:
- ✅ **P50**: 1초 이내
- ✅ **P95**: 3초 이내
- ⚠️ **P99**: 5초 이내 (타임아웃 임계값)

---

### 2. 에러 응답 표준화

**현재 문제**:
- 프론트엔드가 타임아웃 외 에러를 명확히 구분하지 못함

**권장사항**:
```json
// STT 에러 응답 포맷
{
  "type": "stt_error",
  "data": {
    "error_code": "STT_SERVICE_UNAVAILABLE",
    "error_message": "음성 인식 서비스를 사용할 수 없습니다",
    "user_message": "잠시 후 다시 시도해주세요",
    "retry_after": 5,
    "fallback_suggested": true
  }
}
```

**에러 코드 제안**:
- `STT_SERVICE_UNAVAILABLE`: STT 서비스 일시 불가
- `STT_TIMEOUT`: 처리 시간 초과
- `STT_INVALID_AUDIO`: 오디오 데이터 문제
- `STT_LANGUAGE_UNSUPPORTED`: 언어 미지원
- `STT_RATE_LIMITED`: 요청 제한 초과

---

### 3. 연결 상태 헬스체크

**권장사항**:
```json
// WebSocket 핑/퐁 메커니즘
// 프론트엔드 → 백엔드
{
  "type": "ping",
  "timestamp": 1700000000000
}

// 백엔드 → 프론트엔드
{
  "type": "pong",
  "timestamp": 1700000000000,
  "server_time": 1700000000050,
  "stt_service_status": "healthy"
}
```

**이점**:
- 프론트엔드가 백엔드 STT 서비스 상태 사전 파악
- STT 서비스 장애 시 즉시 브라우저 폴백으로 전환 가능
- 사용자 경험 향상 (5초 대기 불필요)

---

### 4. 모니터링 메트릭

**백엔드에서 추적할 메트릭**:
```yaml
stt_metrics:
  # 응답 시간
  - stt_processing_time_p50: 목표 < 1s
  - stt_processing_time_p95: 목표 < 3s
  - stt_processing_time_p99: 목표 < 5s

  # 성공률
  - stt_success_rate: 목표 > 95%
  - stt_timeout_rate: 목표 < 5%
  - stt_error_rate: 목표 < 1%

  # 품질
  - stt_confidence_avg: 목표 > 0.8
  - stt_empty_result_rate: 목표 < 10%

  # 부하
  - concurrent_stt_requests: 모니터링
  - stt_queue_depth: 경고 임계값 설정
```

---

## 🧪 테스팅 시나리오

### 백엔드 팀이 테스트해야 할 시나리오

#### 1. 정상 플로우
```
사용자 음성 입력
  ↓
프론트엔드 VAD 감지
  ↓
WebSocket으로 오디오 전송
  ↓
백엔드 STT 처리 (1-3초)
  ↓
stt_received 응답
  ↓
프론트엔드에서 AI 요청 (500ms 디바운싱)
  ↓
AI 응답 수신 및 화면 표시
```

**예상 결과**:
- STT 응답 시간: 1-3초
- 타임아웃 발생: 없음
- 사용자 피드백: 즉각적

---

#### 2. STT 타임아웃 시나리오
```
사용자 음성 입력
  ↓
프론트엔드 VAD 감지
  ↓
WebSocket으로 오디오 전송
  ↓
백엔드 STT 처리 지연 (> 5초)
  ↓
프론트엔드 타임아웃 발생
  ↓
브라우저 Web Speech API로 자동 전환
  ↓
사용자에게 "브라우저 음성 인식으로 전환" 안내
```

**테스트 방법**:
```python
# 백엔드에서 의도적 지연 추가
async def test_stt_timeout(audio_data):
    await asyncio.sleep(6)  # 6초 지연
    return {"type": "stt_received", "data": {"text": "늦은 응답"}}
```

**예상 결과**:
- 5초 후 프론트엔드에서 폴백 활성화
- 백엔드 응답이 도착해도 무시됨
- 사용자는 브라우저 STT로 계속 진행

---

#### 3. STT 서비스 장애 시나리오
```
사용자 음성 입력
  ↓
프론트엔드 VAD 감지
  ↓
WebSocket으로 오디오 전송
  ↓
백엔드 STT 서비스 장애
  ↓
stt_error 응답 (error_code: STT_SERVICE_UNAVAILABLE)
  ↓
프론트엔드에서 즉시 브라우저 폴백 활성화
  ↓
사용자에게 "일시적 오류, 브라우저 음성 인식 사용" 안내
```

**예상 결과**:
- 타임아웃 대기 없이 즉시 폴백
- 사용자 경험 향상

---

#### 4. 연속 음성 입력 시나리오
```
사용자가 긴 문장을 천천히 말함
  ↓
중간에 여러 번 STT 결과 수신
  - "안녕하세요"
  - "안녕하세요 저는"
  - "안녕하세요 저는 철수입니다"
  ↓
디바운싱 적용 (500ms 대기)
  ↓
마지막 결과만 AI에 전송: "안녕하세요 저는 철수입니다"
```

**예상 결과**:
- AI 호출 횟수: 1회 (이전: 3회)
- 백엔드 부하 감소: 66%

---

## 📊 기대 효과

### 사용자 경험 개선
- ✅ **타임아웃으로 인한 무한 대기 제거** (5초 제한)
- ✅ **STT 장애 시에도 음성 인식 가능** (폴백 시스템)
- ✅ **탭 전환 후에도 정상 작동** (생명주기 관리)
- ✅ **중복 AI 응답 방지** (디바운싱)

### 시스템 안정성 향상
- ✅ **단일 장애점 제거** (2단계 폴백)
- ✅ **리소스 효율성 증가** (백그라운드 일시정지)
- ✅ **백엔드 부하 감소** (최대 50%)

### 개발 효율성
- ✅ **명확한 에러 처리 로직**
- ✅ **로깅 및 모니터링 개선**
- ✅ **테스트 가능한 구조**

---

## 🔗 참고 자료

### 프론트엔드 코드
- [src/App.tsx](../../../src/App.tsx) - STT 타임아웃 및 디바운싱 로직
- [src/hooks/useFallbackSTT.ts](../../../src/hooks/useFallbackSTT.ts) - Web Speech API 폴백 구현
- [src/hooks/useVAD.ts](../../../src/hooks/useVAD.ts) - AudioContext 생명주기 관리

### 커밋 이력
- `eb9a76c` - feat: add STT timeout mechanism (5s)
- `cc04706` - feat: implement Web Speech API fallback (useFallbackSTT)
- `b4f8f7c` - feat: add AudioContext lifecycle management (visibilitychange)
- `58d317d` - feat: add AI request debouncing (500ms)

---

## 📞 문의사항

프론트엔드 STT 개선사항 관련 문의사항이 있으시면 언제든 연락주세요.

**연락처**: [프론트엔드 팀]
**작성자**: Claude Code Assistant
**문서 버전**: 1.0
**최종 수정**: 2025-11-18
