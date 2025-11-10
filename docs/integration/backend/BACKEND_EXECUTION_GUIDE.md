# 🎯 Backend 팀 실행 가이드

**프로젝트**: 감정 분석 시스템 - Gemini 프롬프트 개선
**버전**: v1.2.0
**담당**: Backend 팀
**소요 시간**: 1-2시간
**상태**: ⏳ 진행 예정

---

## 🚨 현재 상황

### 문제
- Frontend에서 emotion_update를 수신하고 있음
- **하지만 모든 emotion_update가 'neutral'만 포함됨**
- 다양한 감정(happy, sad, angry 등)이 감지되지 않음

### 근본 원인
Gemini API의 감정 분석 프롬프트가 너무 보수적이거나 감정 판단 로직이 부정확함

### 해결 전략
1. Gemini 프롬프트 개선 (더 명확한 기준)
2. 감정 매핑 로직 검증
3. 진단 로깅 추가
4. 4가지 테스트 케이스 통과

---

## 📋 빠른 체크리스트 (5분)

```
□ 현재 프롬프트 위치 파악
□ 감정 매핑 함수 위치 파악
□ 스테이징 환경 접근 확인
```

완료되면 아래로 스크롤하여 "Step 1: 프롬프트 개선" 진행

---

## 📁 구조 파악

### 파일 위치 확인

```bash
# 감정 분석 관련 파일 찾기
find . -name "*emotion*" -type f
find . -name "*gemini*" -type f
find . -name "*analysis*" -type f

# 예상 경로:
# src/services/emotion.py
# src/services/gemini.py
# src/utils/emotion_map.py
```

---

### 현재 프롬프트 확인

```bash
# 현재 프롬프트 찾기
grep -r "당신은.*감정.*AI\|emotion.*analysis\|Gemini.*prompt" --include="*.py" .

# 일반적인 위치:
cat src/services/emotion.py | grep -A 30 "PROMPT\|prompt"
```

**파일 구조 예시:**
```python
# src/services/emotion.py

class EmotionAnalyzer:
    def __init__(self):
        self.gemini_prompt = EMOTION_ANALYSIS_PROMPT  # ← 이것을 개선할 것

    async def analyze_emotion(self, landmarks, transcript):
        # 감정 분석 로직
        pass

# 현재 프롬프트 (너무 보수적)
EMOTION_ANALYSIS_PROMPT = """
당신은 감정 분석 AI입니다.
주어진 얼굴 표정과 음성을 분석하여 감정을 판단하세요.
...
"""
```

---

## 🔧 Step 1: Gemini 프롬프트 개선 (30분)

### 1-1: 현재 프롬프트 백업

```bash
# 현재 프롬프트 복사
cp src/services/emotion.py src/services/emotion.py.bak

echo "✅ Backed up emotion.py"
```

---

### 1-2: 새 프롬프트로 교체

찾은 파일(`src/services/emotion.py` 등)을 열고, 현재 프롬프트를 다음으로 교체:

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

### 3단계: 감정 결정

각 감정의 명확한 기준:

**happy (행복)**:
정의: 긍정적, 기쁨, 만족감
얼굴 표정: 입가의 상향 곡선, 눈 주변 주름, 밝은 표정
음성: 밝고 높은 톤, 빠른 말속도, 활기찬 목소리

**sad (슬픔)**:
정의: 부정적, 슬픔, 실망감
얼굴 표정: 입가의 하향 곡선, 눈썹 안쪽 올린 표정, 처진 표정
음성: 낮은 톤, 느린 말속도, 지친 목소리

**angry (화남)**:
정의: 분노, 짜증, 격노
얼굴 표정: 눈썹 내려감, 입 팽팽함, 얼굴 근육 긴장
음성: 높은 음성 톤, 빠른 말투, 강한 강조

**anxious (불안)**:
정의: 불안, 걱정, 긴장
얼굴 표정: 눈 크기 커짐, 입 약간 벌어짐, 경직된 표정
음성: 불규칙한 음성, 빠른 말투, 떨리는 목소리

**neutral (중립)**:
정의: 중립적, 무표정, 평온함
얼굴 표정: 얼굴 근육 이완, 자연스러운 입 모양
음성: 정상 톤, 일정한 속도, 감정 변화 없음

**surprised (놀람)**:
정의: 놀람, 깜짝 놀랐을 때
얼굴 표정: 눈 매우 크게 열림, 입 열림, 들뜬 표정
음성: 갑작스러운 음성 변화, 높은 톤

**disgusted (혐오)**:
정의: 역겨움, 싫음
얼굴 표정: 코 주름, 입 옆으로 늘어짐, 거부하는 표정
음성: 거부하는 톤, 낮은 음성

**fearful (두려움)**:
정의: 두려움, 공포
얼굴 표정: 눈썹 올려짐, 입 가늘어짐, 불안한 표정
음성: 떨리는 목소리, 높은 톤, 불안정한 음성

### 4단계: 신뢰도 계산

신뢰도(0-1) 계산:
- 얼굴 표정 신호의 일관성: 20점
- 목소리 신호와의 일치도: 30점 (가장 중요)
- 신호의 강도: 20점
- 추가 신호: 30점

신뢰도 계산 기준:
- 0.9~1.0: 확실함 (예: 뚜렷한 웃음 + 밝은 목소리)
- 0.7~0.9: 명확함 (예: 슬픈 표정 + 낮은 목소리)
- 0.5~0.7: 보통 (예: 약한 신호)
- 0.0~0.5: 불명확 (예: neutral이나 미묘한 표정)

**신뢰도가 0.6 이하면, neutral을 포함한 상위 2개 감정 모두 반환하세요.**

### 5단계: 최종 응답

다음 JSON 형식으로 응답하세요:

```json
{
  "emotion": "감정명 (happy/sad/angry/anxious/neutral/surprised/disgusted/fearful 중 하나)",
  "confidence": 0.0~1.0 범위의 신뢰도,
  "reasoning": "선택 이유 (한글, 50자 이내)",
  "landmarks_indicators": ["표정 특징 1", "표정 특징 2"],
  "voice_indicators": ["음성 특징 1", "음성 특징 2"]
}
```

### 예시 응답

```json
{
  "emotion": "happy",
  "confidence": 0.92,
  "reasoning": "밝은 웃음 표정 + 활기찬 목소리",
  "landmarks_indicators": ["입가 상향 곡선", "눈 주변 주름"],
  "voice_indicators": ["높은 음성 톤", "빠른 말속도"]
}
```

## 중요 주의사항

1. **절대로 emotion_score를 반환하지 마세요** (emotion만 반환)
2. **항상 유효한 감정만 반환하세요**
3. **neutral이 아닌 다른 감정들도 적극적으로 반환하세요**
4. **신뢰도가 낮으면 명확하게 표시하세요**
5. **음성과 표정의 불일치를 명시하세요**
"""
```

---

### 1-3: 프롬프트 적용

파일에서 현재 프롬프트를 위의 `ENHANCED_EMOTION_PROMPT`로 교체:

```python
# Before:
async def analyze_emotion(self, landmarks, transcript):
    prompt = """
    당신은 감정 분석 AI입니다...
    """
    response = await gemini_client.generate_content(prompt)

# After:
async def analyze_emotion(self, landmarks, transcript):
    prompt = ENHANCED_EMOTION_PROMPT.format(
        transcript=transcript,
        landmark_data_summary=format_landmarks_for_analysis(landmarks)
    )
    response = await gemini_client.generate_content(prompt)
```

---

### 1-4: 변경사항 확인

```bash
# 변경 전후 비교
diff src/services/emotion.py.bak src/services/emotion.py

# 또는 Visual Studio Code에서:
# 1. Ctrl+Shift+P (또는 Cmd+Shift+P)
# 2. "Compare with Saved" 선택
```

---

## 🔧 Step 2: 감정 매핑 로직 검증 (20분)

### 2-1: parseEmotionResponse 함수 찾기

```bash
# 함수 위치 찾기
grep -n "def parse_emotion_response\|parseEmotionResponse" src/**/*.py

# 일반적인 위치:
# src/services/emotion.py 내부의 함수
# 또는 src/utils/emotion.py
```

---

### 2-2: 현재 함수 확인

```bash
# 현재 구현 확인
grep -A 50 "def parse_emotion_response" src/services/emotion.py
```

**현재 구현이 다음과 같은 문제가 있는지 확인:**
- ✓ JSON 파싱 오류 시 기본값이 "neutral"인가?
- ✓ 감정이 유효한지 검증하는가?
- ✓ 신뢰도가 0~1 범위인가?

---

### 2-3: 함수 개선

현재 함수를 다음으로 교체:

```python
def parse_emotion_response(response_text: str, raw_response=None):
    """
    Gemini API 응답에서 감정 데이터를 추출합니다.
    """
    import json
    import re

    try:
        # 1단계: JSON 추출 시도
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            data = json.loads(json_str)
        else:
            # 2단계: 직접 emotion 추출
            emotion_match = re.search(r'"emotion"\s*:\s*"([^"]+)"', response_text)
            if emotion_match:
                emotion = emotion_match.group(1).strip().lower()
            else:
                emotion = "neutral"

            confidence_match = re.search(r'"confidence"\s*:\s*([\d.]+)', response_text)
            confidence = float(confidence_match.group(1)) if confidence_match else 0.5

            data = {
                "emotion": emotion,
                "confidence": confidence,
                "reasoning": ""
            }

        # 3단계: 감정 유효성 검증
        valid_emotions = ['happy', 'sad', 'angry', 'anxious', 'neutral', 'surprised', 'disgusted', 'fearful']
        emotion = data.get("emotion", "neutral").strip().lower()

        if emotion not in valid_emotions:
            print(f"⚠️ Invalid emotion '{emotion}' detected, normalizing to neutral")
            emotion = "neutral"

        # 4단계: 신뢰도 범위 검증
        confidence = float(data.get("confidence", 0.5))
        confidence = max(0.0, min(1.0, confidence))  # 0~1 범위로 정규화

        result = {
            "emotion": emotion,
            "confidence": confidence,
            "reasoning": data.get("reasoning", ""),
            "debug_info": {
                "raw_response_length": len(response_text),
                "confidence_value": confidence,
                "was_normalized": emotion != data.get("emotion", "").lower()
            }
        }

        print(f"✅ Emotion parsed successfully: {emotion} (confidence: {confidence:.2f})")

        return result

    except Exception as e:
        print(f"❌ Error parsing emotion response: {e}")
        return {
            "emotion": "neutral",
            "confidence": 0.0,
            "reasoning": f"Parse error: {str(e)}",
            "debug_info": {"error": str(e)}
        }
```

---

## 🔧 Step 3: 진단 로깅 추가 (10분)

감정 분석 함수에 다음 로그 추가:

```python
# 감정 분석 직전
print(f"\n{'='*60}")
print(f"[EMOTION ANALYSIS START]")
print(f"Landmarks received: {len(landmarks)} points")
print(f"Transcript: {transcript[:100]}...")
print(f"Session ID: {session_id}")

# Gemini 호출
response = await gemini_client.generate_content(
    ENHANCED_EMOTION_PROMPT.format(
        transcript=transcript,
        landmark_data_summary=format_landmarks_for_analysis(landmarks)
    )
)

print(f"[GEMINI RAW RESPONSE]")
print(response.text)

# 파싱 후
parsed = parse_emotion_response(response.text)
print(f"\n[EMOTION PARSED]")
print(f"Emotion: {parsed['emotion']}")
print(f"Confidence: {parsed['confidence']:.2f}")
print(f"Debug info: {parsed.get('debug_info', {})}")

# WebSocket 전송 전
print(f"[SENDING EMOTION UPDATE VIA WEBSOCKET]")
print(f"Message: {json.dumps(emotion_message)}")

# 전송
await websocket.send_json(emotion_message)
print(f"✅ Emotion update sent successfully")
print(f"{'='*60}\n")
```

---

## ✅ Step 4: 테스트 케이스 검증 (30분)

### 4-1: 스테이징 환경에서 테스트

```bash
# 스테이징 환경 시작
python src/main.py --env staging

# 또는
docker-compose -f docker-compose.staging.yml up
```

---

### 4-2: 테스트 케이스 1: 행복한 표정

```
입력:
- 랜드마크: 웃음 표정
  ├─ 입가 올려진 상태
  ├─ 눈 주변 주름 명확함
  └─ 전체 얼굴 밝음

- 음성: "정말 좋아요! 행복합니다!"
  ├─ 음성 톤: 높음
  ├─ 말 속도: 빠름
  └─ 음성 특징: 밝고 활기참

기대 결과:
{
  "emotion": "happy",
  "confidence": > 0.7,
  "reasoning": "웃음 표정 + 활기찬 목소리"
}

실제 결과:
[테스트 후 Gemini 응답 복사]
[parse_emotion_response 결과 복사]
```

**통과 확인:**
- ✓ emotion: "happy"인가?
- ✓ confidence: > 0.7인가?
- ✓ 로그에 에러 없는가?

---

### 4-3: 테스트 케이스 2: 슬픈 표정

```
입력:
- 랜드마크: 슬픈 표정
  ├─ 입가 내려간 상태
  ├─ 눈썹 안쪽 올린 표정
  └─ 처진 표정

- 음성: "정말 힘들어... 슬프다..."
  ├─ 음성 톤: 낮음
  ├─ 말 속도: 느림
  └─ 음성 특징: 지친 목소리

기대 결과:
{
  "emotion": "sad",
  "confidence": > 0.7
}

실제 결과:
[테스트 후 결과 기록]
```

---

### 4-4: 테스트 케이스 3: 화난 표정

```
입력:
- 랜드마크: 화난 표정
  ├─ 눈썹 내려감
  ├─ 입 팽팽함
  └─ 얼굴 근육 긴장

- 음성: "정말 화났어! 너무 화나!"
  ├─ 음성 톤: 높음
  ├─ 말 속도: 매우 빠름
  └─ 음성 특징: 강한 강조

기대 결과:
{
  "emotion": "angry",
  "confidence": > 0.7
}

실제 결과:
[테스트 후 결과 기록]
```

---

### 4-5: 테스트 케이스 4: 놀란 표정

```
입력:
- 랜드마크: 놀란 표정
  ├─ 눈 크게 열림
  ├─ 입 열림
  └─ 들뜬 표정

- 음성: "어? 정말? 어라?"
  ├─ 음성 톤: 급상승
  ├─ 말 속도: 빠름
  └─ 음성 특징: 놀란 톤

기대 결과:
{
  "emotion": "surprised",
  "confidence": > 0.7
}

실제 결과:
[테스트 후 결과 기록]
```

---

### 4-6: 모든 테스트 케이스 통과 확인

```
테스트 케이스    기대      실제      통과
happy           0.7+     0.XX     ✓/✗
sad             0.7+     0.XX     ✓/✗
angry           0.7+     0.XX     ✓/✗
surprised       0.7+     0.XX     ✓/✗

전체: 4/4 통과 ✓
```

**만약 일부 테스트가 실패한다면:**

```
1. Gemini 응답 확인
   → ENHANCED_EMOTION_PROMPT가 올바르게 적용됨?
   → 감정 기준이 명확한가?

2. 랜드마크 데이터 품질 확인
   → variance > 0.1인가?
   → 실제 표정이 명확한가?

3. 음성 데이터 품질 확인
   → 노이즈가 심하지 않은가?
   → 음성이 충분히 명확한가?

4. Gemini 모델 버전 확인
   → claude-3.5-sonnet 이상?
   → 최신 버전으로 업데이트?
```

---

## 🚀 Step 5: 프로덕션 배포 (20분)

### 5-1: 최종 검증

```bash
# 코드 문법 검사
python -m py_compile src/services/emotion.py

# 단위 테스트 실행 (있다면)
python -m pytest tests/emotion_test.py -v

# 린트 검사
pylint src/services/emotion.py
```

---

### 5-2: 배포 준비

```bash
# 변경사항 확인
git status

# 커밋 메시지
git add src/services/emotion.py
git commit -m "feat(emotion): improve Gemini prompt and enhance emotion detection

- Add detailed emotion criteria for 8 emotions
- Improve confidence calculation methodology
- Add comprehensive diagnostic logging
- Enhance parse_emotion_response validation
- All 4 test cases passing"

git push origin main
```

---

### 5-3: 프로덕션 배포

```bash
# 배포 방법은 팀의 CI/CD에 따라 다름

# Option 1: GitHub Actions (자동)
# main에 push되면 자동으로 배포됨

# Option 2: Docker 배포
docker build -t bemore-backend:v1.2.0 .
docker push registry/bemore-backend:v1.2.0
kubectl set image deployment/bemore-api api=registry/bemore-backend:v1.2.0

# Option 3: 수동 배포
./deploy.sh --env production --version v1.2.0
```

---

### 5-4: 배포 확인

```bash
# 배포 후 서버 상태 확인
curl https://api.bemore.com/health

# 로그 확인
tail -f /var/log/bemore-backend.log

# 또는 (Kubernetes)
kubectl logs -f deployment/bemore-api
```

**기대 결과:**
```
✅ Server running on port 8000
✅ Gemini API connected
✅ WebSocket server ready
```

---

## 📊 배포 후 모니터링

### 배포 직후 (1시간)

**관찰할 메트릭:**

```
1. 감정 분포 (로그에서)
   neutral: ~40% (이전: ~95%)
   happy: ~15% (이전: ~3%)
   sad: ~12% (이전: ~1%)
   angry: ~13% (이전: ~1%)
   기타: ~20%

2. 평균 Confidence
   Before: 0.45
   After: 0.70+

3. 오류율
   Parse errors: < 1%
   Gemini timeouts: < 5%

4. 응답 시간
   < 2초 (Gemini 호출 포함)
```

### 모니터링 체크리스트

```
□ Gemini API 호출 성공률 > 95%
□ emotion_update 전송 성공률 > 99%
□ 오류 로그 없음
□ 응답 시간 < 2초
□ Neutral 비율 < 50%
□ 다양한 감정 감지됨
```

---

## 🔧 문제 해결

### 문제 1: "여전히 neutral만 나온다"

```
원인 1: 프롬프트가 제대로 적용되지 않음
해결:
1. 파일을 저장했는가? (Ctrl+S)
2. 배포했는가? (git push + 배포 실행)
3. 프롬프트 텍스트 전체가 포함되었는가?

원인 2: Gemini가 여전히 neutral만 반환함
해결:
1. Gemini 로그 확인
2. 프롬프트의 감정 기준이 명확한가?
3. 더 구체적인 예시를 프롬프트에 추가

원인 3: 랜드마크 데이터 품질 부족
해결:
1. 랜드마크 variance 확인 (> 0.1?)
2. 음성 데이터 품질 확인
3. 테스트 할 때 더 명확한 표정으로 시도
```

### 문제 2: "confidence가 너무 낮다"

```
원인: Gemini이 신호가 애매하다고 판단
해결:
1. Gemini 응답 확인 (reasoning)
2. 신뢰도 계산 기준 조정
3. 테스트 할 때 더 극적인 표정 사용
```

### 문제 3: "Gemini API 타임아웃"

```
원인: 프롬프트가 너무 길거나 느림
해결:
1. 프롬프트 길이 확인 (> 5000자?)
2. 임베딩 토큰 수 확인
3. 프롬프트 최적화
```

---

## 📋 배포 체크리스트 (최종)

```
□ Step 1: Gemini 프롬프트 개선 완료
  └─ ENHANCED_EMOTION_PROMPT로 교체됨

□ Step 2: parseEmotionResponse 함수 개선 완료
  └─ 유효성 검증 추가됨

□ Step 3: 진단 로깅 추가 완료
  └─ 상세 로그가 콘솔에 출력됨

□ Step 4: 4가지 테스트 케이스 모두 통과
  ├─ happy: confidence > 0.7 ✓
  ├─ sad: confidence > 0.7 ✓
  ├─ angry: confidence > 0.7 ✓
  └─ surprised: confidence > 0.7 ✓

□ Step 5: 프로덕션 배포 완료
  └─ 서버 정상 작동 확인됨

□ 배포 후 모니터링 시작
  └─ 감정 분포 정상 (neutral < 50%)
```

---

## 📞 지원

배포 중 문제 발생 시:

- **Backend Lead**: [연락처]
- **Gemini API**: [문서 링크]
- **Slack**: #backend-deployment

---

## 📝 배포 기록

| 날짜 | 시간 | 배포자 | 상태 | 감정 분포 |
|------|------|--------|------|---------|
| 2025-10-25 | HH:MM | [이름] | ⏳ 진행 중 | - |

---

## 다음 단계

✅ **Phase 1 (Frontend)**: 완료

⏳ **Phase 2 (Backend)**: 지금 진행 중

⏳ **Phase 3 (통합 테스트)**: Backend 배포 후 30분

---

