# 🧠 CBT 기능 구현 요청 (빠른 버전)

> **프론트엔드 상태**: CBT 분석 UI 컴포넌트 구현 완료 ✅
> **백엔드 필요**: API에서 CBT 분석 데이터 반환 필요
> **작성일**: 2025-01-18

---

## 🎯 TL;DR

프론트엔드에서 **CBT 분석 UI 4개 컴포넌트**를 구현 완료했습니다.
백엔드 API 3곳에서 **CBT 데이터를 반환**해주시면 바로 화면에 표시됩니다.

---

## 📋 필요한 API 변경 (3개)

### 1️⃣ `GET /api/sessions/:id/report` - CBT 분석 결과 추가

**현재**: `cbtFindings` 필드 없음 또는 빈 배열
**필요**: 아래 형식으로 `cbtFindings` 배열 반환

```json
{
  "success": true,
  "data": {
    "sessionId": "12345",
    "emotionTimeline": [...],
    "vadSummary": {...},
    "cbtFindings": [  // ← 이 필드 추가 필요
      {
        "hasDistortions": true,
        "needsIntervention": true,
        "detections": [
          {
            "type": "catastrophizing",
            "name_ko": "파국화",
            "severity": "high",  // low | medium | high
            "confidence": 0.85,
            "examples": ["회사에서 해고될 거야", "모든 게 망했어"]
          }
        ],
        "intervention": {
          "distortionType": "catastrophizing",
          "distortionName": "파국화",
          "severity": "high",
          "urgency": "immediate",  // immediate | soon | routine
          "questions": [
            "정말 최악의 상황이 일어날 확률은 얼마나 될까요?",
            "이전에 비슷한 상황에서 어떻게 대처했나요?"
          ],
          "tasks": [
            {
              "title": "현실 점검 훈련",
              "description": "최악의 상황과 가장 가능성 높은 상황을 구분해보세요",
              "difficulty": "medium",  // easy | medium | hard
              "duration": "10분"
            }
          ]
        }
      }
    ]
  }
}
```

**우선순위**: 🔴 P0 (필수)

---

### 2️⃣ `GET /api/sessions/:id/summary` - CBT 요약 추가

**현재**: `cbt` 필드가 `{ totalDistortions: 0, mostCommon: null }` 고정값
**필요**: 실제 데이터로 교체

```json
{
  "success": true,
  "data": {
    "dominantEmotion": {...},
    "vadVector": {...},
    "cbt": {  // ← 이 필드 수정 필요
      "totalDistortions": 3,
      "mostCommon": "catastrophizing",
      "severity": "high",
      "interventionNeeded": true
    }
  }
}
```

**우선순위**: 🟡 P1 (선택, 요약용)

---

### 3️⃣ WebSocket `emotion_update` - 실시간 CBT 알림

**현재**: `emotion_update` 메시지에 CBT 데이터 없음
**필요**: `cbtAnalysis` 필드 추가

```json
{
  "type": "emotion_update",
  "data": {
    "emotion": "sad",
    "timestamp": 1234567890,
    "frameCount": 120,
    "sttSnippet": "너무 힘들어...",
    "cbtAnalysis": {  // ← 이 필드 추가 필요
      "hasDistortions": true,
      "needsIntervention": true,
      "detections": [
        {
          "type": "catastrophizing",
          "name_ko": "파국화",
          "severity": "high",
          "confidence": 0.88,
          "examples": ["모든 게 끝났어"]
        }
      ],
      "intervention": {
        "distortionType": "catastrophizing",
        "distortionName": "파국화",
        "severity": "high",
        "urgency": "immediate",
        "questions": ["정말 모든 게 끝난 건가요?"],
        "tasks": [
          {
            "title": "심호흡 3회",
            "description": "4초 들이마시고, 6초 내쉬기",
            "difficulty": "easy",
            "duration": "1분"
          }
        ]
      }
    }
  }
}
```

**우선순위**: 🟡 P1 (실시간 알림용)

---

## 📊 지원하는 인지 왜곡 유형 (9가지)

프론트엔드가 지원하는 `type` 값들:

| type | name_ko | 설명 |
|------|---------|------|
| `catastrophizing` | 파국화 | 최악의 상황만 생각함 |
| `overgeneralization` | 과잉 일반화 | "항상", "절대" 등 |
| `black_white_thinking` | 흑백 사고 | 극단적 이분법 |
| `emotional_reasoning` | 감정적 추론 | 감정을 사실로 착각 |
| `should_statements` | 당위적 사고 | "~해야 한다" |
| `labeling` | 낙인 찍기 | 자신을 부정적으로 규정 |
| `personalization` | 개인화 | 모든 걸 자기 탓으로 돌림 |
| `mind_reading` | 독심술 | 타인의 생각을 단정 |
| `fortune_telling` | 예언 | 부정적 미래 예측 |

**백엔드가 이 9가지 중 하나 이상을 감지하면** → 프론트엔드가 자동으로 색상, 아이콘 등을 매핑합니다.

---

## 🎨 프론트엔드 구현 완료 상태

### ✅ 완료된 컴포넌트 (4개)

1. **CBTAnalysisSection** - 메인 CBT 분석 섹션
   - 요약 통계 (분석 구간, 왜곡 발견, 개입 필요)
   - 가장 흔한 왜곡 표시

2. **CognitiveDistortionCard** - 인지 왜곡 카드
   - 심각도별 색상 (low=노랑, medium=주황, high=빨강)
   - 신뢰도 점수 + 진행바
   - 발견된 예시 문구 리스트

3. **InterventionPanel** - CBT 개입 패널
   - 긴급도별 스타일 (immediate/soon/routine)
   - 접을 수 있는 질문 섹션
   - 추천 활동 카드 그리드

4. **TaskCard** - 추천 활동 카드
   - 난이도 배지 (easy/medium/hard)
   - 소요 시간 표시
   - "시작하기" 버튼

### 📸 UI 미리보기

**SessionResult 페이지에서 조건부 렌더링**:
- `cbtFindings` 배열이 **있으면** → CBT 분석 섹션 표시
- `cbtFindings` 배열이 **없으면** → 아무것도 표시 안 함 (안전)

---

## ⏱️ 예상 소요 시간

| 우선순위 | 작업 | 예상 시간 |
|---------|------|----------|
| 🔴 P0 | `GET /report`에 `cbtFindings` 추가 | 2-3일 |
| 🟡 P1 | WebSocket 실시간 CBT 알림 | 1-2주 |
| 🟢 P2 | 사용자 입력 저장 API | 2-3주 |

---

## 📖 상세 문서

더 자세한 내용은 아래 문서를 참조해주세요:

- **전체 스펙**: [BACKEND_CBT_REQUIREMENTS.md](./BACKEND_CBT_REQUIREMENTS.md) (800+ 줄)
- **프론트엔드 구현 가이드**: [../../development/FRONTEND_CBT_IMPLEMENTATION_GUIDE.md](../../development/FRONTEND_CBT_IMPLEMENTATION_GUIDE.md)

---

## ✅ 체크리스트 (백엔드 팀용)

완료 후 체크해주세요:

- [ ] `GET /api/sessions/:id/report`에 `cbtFindings` 배열 추가
- [ ] `cbtFindings[].detections[]` 배열에 `CognitiveDistortion` 객체 포함
- [ ] `cbtFindings[].intervention` 객체에 `questions`, `tasks` 포함
- [ ] `tasks[]` 배열의 각 항목에 `title`, `description`, `difficulty`, `duration` 포함
- [ ] 테스트 시나리오 1개 이상 실행 (파국화 감지)
- [ ] 프론트엔드 팀에게 완료 알림

---

## 🤝 연락처

**질문/이슈**: 프론트엔드 팀 Slack 채널
**긴급**: [Your Name] (Slack DM)

---

**작성자**: Frontend Team
**업데이트**: 2025-01-18
