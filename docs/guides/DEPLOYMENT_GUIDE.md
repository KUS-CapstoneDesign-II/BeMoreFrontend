# 🚀 감정 분석 시스템 배포 가이드

**버전**: v1.2.0 (Emotion Sync & Real-time Updates)
**작성일**: 2025-10-25
**배포 기간**: 약 2.5시간

---

## 📋 개요

감정 분석 파이프라인의 전체 개선 프로젝트입니다:
- ✅ Frontend: 실시간 감정 업데이트 및 상태 추적 (이미 완성)
- ⏳ Backend: Gemini 프롬프트 개선 및 감정 다양성 증대 (진행 예정)

### 목표
- "항상 neutral만 나오는" 문제 해결
- 다양한 감정(happy, sad, angry 등) 정확하게 감지
- 실시간으로 UI에 반영

---

## 🎯 배포 순서

```
15분: Frontend 배포 → 1-2시간: Backend 개선 → 30분: 통합 테스트
```

### Phase 1: Frontend 배포 (지금)

**담당**: Frontend 팀
**소요 시간**: 15분
**상태**: ✅ 완성 (빌드 성공)

**할 일**:
1. 최신 빌드 배포
2. 6단계 검증 수행
3. 콘솔 로그 확인

**상세 가이드**: 아래 "Frontend 팀용 프롬프트" 참조

---

### Phase 2: Backend 개선 (1-2시간)

**담당**: Backend 팀
**소요 시간**: 1-2시간
**상태**: ⏳ 진행 예정

**할 일**:
1. Gemini 프롬프트 개선
2. 감정 매핑 로직 검증
3. 4가지 테스트 케이스 통과
4. 프로덕션 배포

**상세 가이드**: 아래 "Backend 팀용 프롬프트" 참조

---

### Phase 3: 통합 테스트 (30분)

**담당**: QA 팀 + Frontend + Backend
**소요 시간**: 30분
**상태**: ⏳ 대기

**할 일**:
1. 다양한 감정 테스트
2. 실시간 UI 반영 확인
3. 세션 간 상태 격리 확인

**상세 가이드**: 아래 "통합 테스트 계획" 참조

---

## 👥 Phase 1: Frontend 팀용 상세 가이드

### ✅ 현재 구현 상태

다음 기능들이 이미 완성되었습니다:

```
✓ emotionUpdatedAt 및 emotionUpdateCount 상태 추가
✓ onLandmarksMessage 핸들러에서 감정 업데이트 시간 기록
✓ EmotionCard에 마지막 업데이트 시간 표시
✓ 세션 시작 시 감정 상태 초기화
✓ 최신 빌드 성공
```

### 배포 전 확인사항

#### 1단계: 빌드 검증

```bash
npm run build
# 예상: ✅ Build successful
```

#### 2단계: 로컬 테스트

```bash
npm start
# 브라우저에서:
1. F12 (개발자 도구)
2. Console 탭 열기
3. 세션 시작 버튼 클릭
```

**확인할 로그**:

```
✅ [CRITICAL] Reset emotion state for new session
  ├─ currentEmotion: null
  ├─ emotionUpdatedAt: null
  └─ emotionUpdateCount: 0

💚 감정 분석 중...
```

#### 3단계: 코드 최종 검증

```bash
# 다음 파일들이 최신 상태인지 확인
grep -n "emotionUpdatedAt" src/App.tsx
grep -n "emotionUpdateCount" src/App.tsx
grep -n "lastUpdatedAt" src/components/Emotion/EmotionCard.tsx
```

**예상 결과**: 모든 라인이 검색되어야 함 ✅

### 배포 체크리스트

```
□ npm run build 성공
□ Console에 "Reset emotion state" 로그 확인
□ 모든 grep 검색 결과 확인
□ src/App.tsx에서 EmotionCard props 확인
  └─ lastUpdatedAt과 updateCount 전달됨
```

### 배포 후 검증 (Phase 1 완료 확인)

**테스트 시나리오**: Backend가 아직 'neutral'만 보낼 때

```
1. 세션 시작 클릭
2. Console 확인:
   ✅ [CRITICAL] Reset emotion state for new session
   💚 감정 분석 중...

3. UI 확인:
   ┌──────────────────┐
   │ 현재 감정        │
   ├──────────────────┤
   │       ❓        │
   │  감정 분석 중... │
   └──────────────────┘

4. 다양한 표정 지어보기 (5초 이상)
5. Backend에서 emotion_update가 오면:
   - Console: "✅ Emotion updated"
   - UI: emoji + emotion name 표시
   - 타이머: "마지막 업데이트: 1초 전"
```

**Phase 1 성공 기준**:
- ✅ 빌드 성공
- ✅ 상태 초기화 로그 확인
- ✅ emotion_update 수신 시 로그 나타남
- ✅ updateCount 증가

**문제 발생 시**:
→ 아래 "Frontend 트러블슈팅" 참조

---

## 👥 Phase 2: Backend 팀용 상세 가이드

### 현재 문제

**증상**: 아무리 다양한 표정을 지어도 emotion_update에서 항상 `"neutral"`만 반환됨

**원인**: Gemini API의 프롬프트가 너무 보수적이거나 감정 판단 로직이 부정확함

**영향**: Frontend는 정상 작동하지만 항상 neutral만 표시됨

### 해결 방법

#### Step 1: Gemini 프롬프트 개선

파일 위치: `src/services/emotion.py` (또는 해당 경로)

현재 프롬프트를 다음으로 교체:

```python
ENHANCED_EMOTION_PROMPT = """당신은 전문 감정 분석 AI입니다.

## 분석 데이터
- 목소리 기록: {transcript}
- 얼굴 랜드마크 포인트: {landmark_data_summary}

## 분석 요청

### 1단계: 얼굴 표정 분석
주어진 468개 얼굴 랜드마크를 분석하여 다음을 평가:
- 눈 크기 (opened/closed, wide/normal)
- 입 모양 (smile/frown/neutral/open)
- 눈썹 위치 (raised/normal/furrowed)
- 얼굴 근육 긴장도

### 2단계: 목소리 톤 분석
음성 녹음을 분석하여:
- 음성 속도 (빠름/정상/느림)
- 음성 크기 (큼/정상/작음)
- 음성 높낮이 변화
- 말하기 주저함 여부

### 3단계: 감정 결정 (다음 중 하나)

**happy (행복)**: 입가의 상향 곡선 + 눈 주변 주름 + 밝은 목소리
**sad (슬픔)**: 입가의 하향 곡선 + 눈썹 안쪽 올린 표정 + 낮은 목소리
**angry (화남)**: 눈썹 내려감 + 입 팽팽함 + 높은 음성 톤 + 빠른 말투
**anxious (불안)**: 눈 크기 커짐 + 입 약간 벌어짐 + 불규칙한 음성 + 빠른 말투
**neutral (중립)**: 얼굴 근육 이완 + 정상 음성 톤 + 일정한 속도
**surprised (놀람)**: 눈 매우 크게 열림 + 입 열림 + 갑작스러운 음성 변화
**disgusted (혐오)**: 코 주름 + 입 옆으로 늘어짐 + 거부하는 톤
**fearful (두려움)**: 눈썹 올려짐 + 입 가늘어짐 + 떨리는 목소리

### 4단계: 신뢰도 계산
신뢰도(0-1): 얼굴 표정 신호의 일관성 + 목소리 신호와의 일치도 + 신호의 강도

### 5단계: 최종 응답

```json
{
  "emotion": "감정명",
  "confidence": 0.0~1.0,
  "reasoning": "선택 이유 (한글, 50자 이내)",
  "landmarks_indicators": ["표정 특징 1", "표정 특징 2"],
  "voice_indicators": ["음성 특징 1", "음성 특징 2"]
}
```

## 주의사항
- 절대로 emotion_score를 반환하지 마세요
- 항상 유효한 감정만 반환하세요
- neutral이 아닌 다른 감정들도 적극적으로 반환하세요
"""
```

#### Step 2: 감정 매핑 로직 검증

함수 이름: `parse_emotion_response()`

개선된 구현:

```python
def parse_emotion_response(response_text: str):
    import json
    import re

    try:
        # JSON 추출
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group(0))
        else:
            # 직접 추출
            emotion_match = re.search(r'"emotion"\s*:\s*"([^"]+)"', response_text)
            emotion = emotion_match.group(1).strip().lower() if emotion_match else "neutral"
            data = {"emotion": emotion, "confidence": 0.5}

        # 유효성 검증
        valid_emotions = ['happy', 'sad', 'angry', 'anxious', 'neutral', 'surprised', 'disgusted', 'fearful']
        emotion = data.get("emotion", "neutral").strip().lower()

        if emotion not in valid_emotions:
            print(f"⚠️ Invalid emotion '{emotion}' detected, normalizing to neutral")
            emotion = "neutral"

        # 신뢰도 범위 정규화
        confidence = max(0.0, min(1.0, float(data.get("confidence", 0.5))))

        result = {
            "emotion": emotion,
            "confidence": confidence,
            "reasoning": data.get("reasoning", ""),
            "debug_info": {
                "confidence_value": confidence,
                "was_normalized": emotion != data.get("emotion", "").lower()
            }
        }

        print(f"✅ Emotion parsed: {emotion} (confidence: {confidence:.2f})")
        return result

    except Exception as e:
        print(f"❌ Parse error: {e}")
        return {"emotion": "neutral", "confidence": 0.0, "debug_info": {"error": str(e)}}
```

#### Step 3: 진단 로깅 추가

감정 분석 엔드포인트에 다음 로그 추가:

```python
print(f"\n{'='*60}")
print(f"[EMOTION ANALYSIS START]")
print(f"Landmarks: {len(landmarks)} points")
print(f"Transcript: {transcript[:100]}...")

# Gemini 호출
response = await gemini_client.generate_content(ENHANCED_EMOTION_PROMPT.format(...))

print(f"[GEMINI RAW RESPONSE]")
print(response.text)

# 파싱
parsed = parse_emotion_response(response.text)
print(f"\n[EMOTION PARSED]")
print(f"Emotion: {parsed['emotion']}")
print(f"Confidence: {parsed['confidence']:.2f}")

# WebSocket 전송
await websocket.send_json(emotion_message)
print(f"✅ Emotion update sent: {parsed['emotion']}")
print(f"{'='*60}\n")
```

#### Step 4: 테스트 및 검증

**테스트 케이스 1: 행복한 표정**
```
입력: 웃음 표정 + "정말 좋아요! 행복합니다!" (밝은 톤)
기대: emotion: "happy", confidence: > 0.7
결과: [테스트 후 기록]
```

**테스트 케이스 2: 슬픈 표정**
```
입력: 슬픈 표정 + "정말 힘들어... 슬프다..." (낮은 톤)
기대: emotion: "sad", confidence: > 0.7
결과: [테스트 후 기록]
```

**테스트 케이스 3: 화난 표정**
```
입력: 화난 표정 + "정말 화났어!" (높은 톤, 빠른 속도)
기대: emotion: "angry", confidence: > 0.7
결과: [테스트 후 기록]
```

**테스트 케이스 4: 놀란 표정**
```
입력: 놀란 표정 + "어? 정말?" (급상승하는 톤)
기대: emotion: "surprised", confidence: > 0.7
결과: [테스트 후 기록]
```

### Backend 배포 체크리스트

```
□ Gemini 프롬프트 업데이트 완료
□ parseEmotionResponse 함수 개선 완료
□ 진단 로깅 추가 완료
□ 4가지 테스트 케이스 모두 통과
□ 스테이징 환경 e2e 테스트 (최소 10개 표정)
□ 프로덕션 배포 완료
```

### Backend 배포 후 검증

배포 직후 Frontend에서 확인:

```
1. Console에서 다양한 emotion_update 로그 보이는가?
   ✅ Emotion updated: happy (1회)
   ✅ Emotion updated: sad (2회)
   ✅ Emotion updated: angry (3회)

2. updateCount가 계속 증가하는가?
   emotion: happy, updateCount: 1 ✓
   emotion: happy, updateCount: 2 ✓ (증가!)
   emotion: sad, updateCount: 3 ✓ (변함!)

3. neutral 비율이 낮아지는가?
   Before: ~95% neutral
   After: ~40% neutral, 15% happy, 12% sad, 13% angry
```

---

## 🧪 Phase 3: 통합 테스트

### 테스트 환경 준비

```bash
# Frontend 배포됨
# Backend 배포됨
# 둘 다 프로덕션 환경에서 실행 중
```

### 테스트 시나리오 1: 연속 감정 변화

```
시간  표정      예상 Emotion  확인사항
0초   neutral   neutral      (초기화)
3초   happy     happy        UI: 😊, count: 1
8초   sad       sad          UI: 😢, count: 2
13초  angry     angry        UI: 😠, count: 3
18초  happy     happy        UI: 😊, count: 4

✅ 성공 기준:
- 감정이 정확하게 변함
- updateCount가 1, 2, 3, 4로 증가
- "마지막 업데이트" 타임스탠프 움직임
- 깜빡임 없는 부드러운 UI 전환
```

### 테스트 시나리오 2: 같은 감정 반복

```
시간  표정      예상 Emotion
0초   happy     happy (1회)
5초   happy     happy (2회)
10초  happy     happy (3회)

✅ 성공 기준:
- updateCount: 1 → 2 → 3 (증가!)
- 감정 표시는 동일하게 유지
- UI 깜빡임 없음
```

### 테스트 시나리오 3: 세션 전환

```
세션 1:
- happy 감지 (1회)
- sad 감지 (2회)
- [세션 종료]

세션 2 시작:
- UI: "❓ 감정 분석 중..."
- updateCount: 0 (초기화됨!)
- angry 감지 (1회)

✅ 성공 기준:
- 새 세션 시작 시 상태 완벽 초기화
- 이전 세션의 감정('sad')이 남지 않음
- updateCount가 다시 1부터 시작
```

### 테스트 시나리오 4: 경계 케이스

```
① 빠른 연속 업데이트
   emotion_update 1초 간격으로 5개 연속 전송
   ✅ updateCount: 1, 2, 3, 4, 5 (정확함)

② 느린 업데이트
   emotion_update 10초 간격
   ✅ "마지막 업데이트: 10초 전" 표시됨
   ✅ UI는 변하지 않음 (캐싱 작동)

③ 네트워크 지연
   emotion_update 지연 후 수신
   ✅ 감정이 올바르게 표시됨
   ✅ 타임스탠프는 수신 시간 기준
```

### 통합 테스트 완료 기준

```
✅ 모든 4가지 시나리오 통과
✅ Console에 에러 없음
✅ 성능 지표 충족 (응답 < 100ms)
✅ 메모리 누수 없음 (DevTools Memory)
✅ 다양한 감정 정확하게 감지됨
```

**테스트 통과 시 사인오프**: QA Lead + Backend Lead + Frontend Lead

---

## 📊 성능 모니터링

### 모니터링 메트릭 (배포 후 1시간)

| 메트릭 | 목표 | 확인 방법 |
|--------|------|---------|
| 업데이트 응답 시간 | < 100ms | Console 타임스탠프 비교 |
| Emotion 다양성 | neutral < 50% | 백엔드 로그 |
| updateCount 정확성 | 100% 증가 | Console 로그 |
| UI 렌더링 | 부드러움 (60fps) | 깜빡임 없음 |
| 오류율 | < 0.1% | Console 에러 없음 |

### 배포 후 모니터링 체크리스트

```
□ Console에서 "✅ Emotion updated" 로그 지속 확인
□ updateCount가 1, 2, 3... 으로 증가
□ 감정 다양성 모니터링 (neutral만 아님)
□ UI 반응성 확인 (깜빡임 없음)
□ 오류 로그 모니터링
□ 성능 메트릭 추적
```

---

## 🔧 문제 해결

### Frontend 문제

**문제: "updateCount가 증가하지 않는다"**
```
1. Console에서 "✅ Emotion updated" 로그 확인
2. Backend에서 emotion_update 전송 확인
3. WebSocket 연결 상태 확인
4. src/App.tsx의 onLandmarksMessage 함수 검증
```

**문제: "감정이 계속 'neutral'만 나온다"**
```
1. Backend 팀에 확인 요청 (Gemini 프롬프트 업데이트 됨?)
2. Backend 로그에서 Gemini 응답 확인
3. Frontend는 Backend가 보낸 값을 그대로 표시함
```

**문제: "마지막 업데이트 시간이 안 움직인다"**
```
1. EmotionCard의 useEffect 동작 확인
2. React DevTools에서 state 변화 확인
3. lastUpdatedAt prop이 변경되는지 확인
4. setInterval이 제대로 작동하는지 확인
```

### Backend 문제

**문제: "테스트 케이스가 계속 neutral로 나온다"**
```
1. Gemini 프롬프트가 올바르게 적용됨?
2. 진단 로그에서 Gemini의 원본 응답 확인
3. Gemini 모델 버전 확인 (claude-3.5-sonnet 이상?)
4. parseEmotionResponse 함수 검증
```

**문제: "confidence가 낮다"**
```
1. 랜드마크 데이터의 variance 확인 (> 0.1 필요)
2. 음성 데이터 품질 확인 (노이즈 제거)
3. Gemini prompt의 신뢰도 기준 재조정
```

---

## 📅 배포 타임라인

| 시간 | 담당 | 작업 | 상태 |
|------|------|------|------|
| 09:00 | Frontend | 배포 + Phase 1 검증 | ✅ 준비 완료 |
| 09:15 | Backend | Gemini 프롬프트 개선 시작 | ⏳ 예정 |
| 10:00 | Backend | 테스트 케이스 검증 | ⏳ 예정 |
| 10:30 | Backend | 프로덕션 배포 | ⏳ 예정 |
| 10:45 | QA | 통합 테스트 시작 | ⏳ 예정 |
| 11:15 | QA | 테스트 완료 + 사인오프 | ⏳ 예정 |

**전체 배포 시간**: 약 2시간 15분

---

## 📞 연락처 및 에스컬레이션

| 팀 | 담당자 | 연락처 |
|----|--------|--------|
| Frontend | [이름] | [연락처] |
| Backend | [이름] | [연락처] |
| QA | [이름] | [연락처] |
| PM | [이름] | [연락처] |

**긴급 문제**: [Slack channel / Teams group]

---

## ✅ 배포 완료 체크리스트 (최종)

```
□ Phase 1: Frontend 배포 완료
  └─ 6단계 검증 모두 통과

□ Phase 2: Backend 배포 완료
  └─ 4가지 테스트 케이스 통과

□ Phase 3: 통합 테스트 완료
  └─ 4가지 시나리오 모두 통과

□ 모니터링 활성화
  └─ Console, metrics, error tracking

□ 팀 공유
  └─ 배포 완료 알림 발송
```

**배포 완료**: 2025-10-25 [시간]
**배포자**: [이름]
**검증자**: [이름]

---

## 📚 추가 자료

- Frontend 검증 상세 가이드: [아래 섹션]
- Backend 개선 상세 가이드: [아래 섹션]
- 통합 테스트 매뉴얼: [아래 섹션]
- 트러블슈팅 가이드: [위 섹션]

---

