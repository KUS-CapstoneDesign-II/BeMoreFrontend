# Backend CBT Requirements (백엔드 CBT 요구사항)

> **문서 목적**: BeMore 프론트엔드 CBT 기능 점검 결과를 바탕으로, 백엔드 팀에게 필요한 API 및 데이터 구조를 전달합니다.

**작성일**: 2025-01-17
**대상**: 백엔드 개발팀
**우선순위**: P0 (즉시), P1 (1~2주), P2 (여유 시)

---

## 📊 1. 현재 상황 요약

### 프론트엔드 구현 상태
- ✅ **타입 시스템**: CBT 관련 모든 TypeScript 타입 정의 완료
- ✅ **API 클라이언트**: `sessionAPI.getReport()`, `sessionAPI.getSummary()` 구현
- ⚠️ **UI 컴포넌트**: SessionResult에 CBT 섹션 존재하나 **하드코딩 상태**
- ❌ **실시간 알림**: WebSocket CBT 메시지 수신 로직 없음

### 문제점
1. **백엔드 API 응답이 프론트엔드 타입과 불일치**
   - `GET /api/sessions/:id/report`의 `cbtFindings` 필드가 비어있거나 구조가 다름
   - `GET /api/sessions/:id/summary`의 `cbt` 객체가 `{ totalDistortions: 0, mostCommon: null }` 고정값

2. **실시간 CBT 알림 미구현**
   - `EmotionData.cbtAnalysis` WebSocket 메시지 수신 불가
   - `needsIntervention: true` 시 개입 로직 없음

3. **프론트엔드가 API 응답을 무시하고 하드코딩 사용**
   - `SessionResult.tsx:L341-356`에서 백엔드 데이터 대신 기본값 표시
   - `Task[]` 배열 대신 `['4-6 호흡', '감사 저널', '1분 스트레칭']` 고정값

---

## 🔗 2. API 요구사항

### 2.1. GET /api/sessions/:sessionId/report

**현재 상태**: 엔드포인트 존재, `cbtFindings` 필드 미정의

**요청 예시**:
```http
GET /api/sessions/12345/report
Authorization: Bearer <token>
```

**필수 응답 스키마** (P0):
```json
{
  "success": true,
  "data": {
    "sessionId": "12345",
    "emotionTimeline": [...],
    "vadSummary": {...},
    "vadTimeline": [...],
    "cbtFindings": [
      {
        "hasDistortions": true,
        "needsIntervention": true,
        "detections": [
          {
            "type": "catastrophizing",
            "name_ko": "파국화",
            "severity": "high",
            "confidence": 0.85,
            "examples": [
              "회사에서 해고될 거야",
              "모든 게 망했어"
            ]
          },
          {
            "type": "overgeneralization",
            "name_ko": "과잉 일반화",
            "severity": "medium",
            "confidence": 0.72,
            "examples": [
              "항상 이래",
              "절대 안 될 거야"
            ]
          }
        ],
        "intervention": {
          "distortionType": "catastrophizing",
          "distortionName": "파국화",
          "severity": "high",
          "urgency": "immediate",
          "questions": [
            "정말 최악의 상황이 일어날 확률은 얼마나 될까요?",
            "이전에 비슷한 상황에서 어떻게 대처했나요?",
            "가장 현실적인 결과는 무엇일까요?"
          ],
          "tasks": [
            {
              "title": "현실 점검 훈련",
              "description": "최악의 상황과 가장 가능성 높은 상황을 구분해보세요",
              "difficulty": "medium",
              "duration": "10분"
            },
            {
              "title": "증거 수집",
              "description": "과거 비슷한 상황에서 실제로 어떤 일이 일어났는지 적어보세요",
              "difficulty": "easy",
              "duration": "5분"
            }
          ]
        }
      }
    ]
  }
}
```

**필드 설명**:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `cbtFindings` | Array | ✅ | CBT 분석 결과 배열 (세션 중 여러 시점의 분석 포함 가능) |
| `cbtFindings[].hasDistortions` | Boolean | ✅ | 인지 왜곡 감지 여부 |
| `cbtFindings[].needsIntervention` | Boolean | ✅ | 즉각 개입 필요 여부 (true일 경우 실시간 알림 발송) |
| `cbtFindings[].detections` | Array | ✅ | 감지된 인지 왜곡 목록 |
| `detections[].type` | String | ✅ | 왜곡 유형 (영문 코드) |
| `detections[].name_ko` | String | ✅ | 왜곡 유형 (한글명) |
| `detections[].severity` | Enum | ✅ | 심각도 (`low`, `medium`, `high`) |
| `detections[].confidence` | Number | ✅ | 신뢰도 (0.0 ~ 1.0) |
| `detections[].examples` | Array | ✅ | 사용자 발화 예시 |
| `intervention` | Object | ⚠️ | 개입 필요 시에만 포함 (needsIntervention: true일 때) |
| `intervention.questions` | Array | ✅ | CBT 질문 리스트 (3~5개 권장) |
| `intervention.tasks` | Array | ✅ | 행동 과제 리스트 (2~3개 권장) |
| `tasks[].difficulty` | Enum | ✅ | 난이도 (`easy`, `medium`, `hard`) |
| `tasks[].duration` | String | ✅ | 예상 소요 시간 (예: "5분", "10분", "1일") |

---

### 2.2. GET /api/sessions/:sessionId/summary

**현재 상태**: 엔드포인트 존재, `cbt` 객체가 하드코딩 기본값

**요청 예시**:
```http
GET /api/sessions/12345/summary
Authorization: Bearer <token>
```

**필수 응답 스키마** (P0):
```json
{
  "success": true,
  "data": {
    "sessionId": "12345",
    "duration": 1234,
    "averageEmotion": "neutral",
    "cbt": {
      "totalDistortions": 5,
      "mostCommon": "파국화",
      "severityDistribution": {
        "high": 2,
        "medium": 2,
        "low": 1
      }
    }
  }
}
```

**필드 설명**:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `cbt` | Object | ✅ | CBT 요약 정보 |
| `cbt.totalDistortions` | Number | ✅ | 전체 인지 왜곡 감지 횟수 |
| `cbt.mostCommon` | String \| null | ✅ | 가장 빈번한 왜곡 유형 (한글명) |
| `cbt.severityDistribution` | Object | ⚠️ | 심각도별 분포 (선택, P1) |

---

### 2.3. WebSocket /ws/session (실시간 CBT 알림)

**현재 상태**: 미구현

**목적**: 세션 중 실시간으로 인지 왜곡 감지 시 프론트엔드에 알림

**메시지 타입**: `emotion_update` (기존 메시지 확장)

**필수 메시지 스키마** (P1):
```json
{
  "type": "emotion_update",
  "data": {
    "emotion": "anxious",
    "timestamp": 1704902400000,
    "frameCount": 120,
    "sttSnippet": "요즘 회사에서 일이 너무 많아서...",
    "cbtAnalysis": {
      "hasDistortions": true,
      "needsIntervention": true,
      "detections": [
        {
          "type": "catastrophizing",
          "name_ko": "파국화",
          "severity": "high",
          "confidence": 0.88,
          "examples": ["모든 게 끝났어", "회사에서 잘릴 거야"]
        }
      ],
      "intervention": {
        "distortionType": "catastrophizing",
        "distortionName": "파국화",
        "severity": "high",
        "urgency": "immediate",
        "questions": [
          "정말 최악의 상황이 일어날 확률은 얼마나 될까요?",
          "이전에 비슷한 상황에서 어떻게 대처했나요?"
        ],
        "tasks": [
          {
            "title": "현실 점검 훈련",
            "description": "최악의 상황과 가장 가능성 높은 상황을 구분해보세요",
            "difficulty": "medium",
            "duration": "10분"
          }
        ]
      }
    }
  }
}
```

**발송 조건**:
- `needsIntervention: true`일 때 **즉시 발송**
- `severity: "high"` 왜곡 감지 시 **우선 발송**
- 동일한 왜곡 유형이 3분 내 재발하지 않도록 중복 방지

---

## 📐 3. 데이터 타입 정의

### 3.1. CBTAnalysis

```typescript
interface CBTAnalysis {
  hasDistortions: boolean;          // 인지 왜곡 감지 여부
  needsIntervention: boolean;       // 즉각 개입 필요 여부
  detections: CognitiveDistortion[]; // 감지된 왜곡 목록
  intervention?: Intervention;       // 개입 정보 (needsIntervention: true일 때만)
}
```

**Python (FastAPI) 예시**:
```python
from pydantic import BaseModel
from typing import List, Optional

class CBTAnalysis(BaseModel):
    hasDistortions: bool
    needsIntervention: bool
    detections: List[CognitiveDistortion]
    intervention: Optional[Intervention] = None
```

---

### 3.2. CognitiveDistortion

```typescript
interface CognitiveDistortion {
  type: string;        // 왜곡 유형 (영문 코드: catastrophizing, overgeneralization, etc.)
  name_ko: string;     // 왜곡 유형 (한글명: 파국화, 과잉 일반화 등)
  severity: 'low' | 'medium' | 'high';  // 심각도
  confidence: number;  // 신뢰도 (0.0 ~ 1.0)
  examples: string[];  // 사용자 발화 예시 (2~5개 권장)
}
```

**Python (FastAPI) 예시**:
```python
from enum import Enum

class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class CognitiveDistortion(BaseModel):
    type: str
    name_ko: str
    severity: Severity
    confidence: float  # 0.0 ~ 1.0
    examples: List[str]
```

**인지 왜곡 유형 (참고)**:

| 영문 코드 | 한글명 | 설명 |
|----------|--------|------|
| `catastrophizing` | 파국화 | 최악의 결과를 예상 |
| `overgeneralization` | 과잉 일반화 | 하나의 사건을 전체로 확대 |
| `black_and_white_thinking` | 흑백 사고 | 중간 지대 없이 극단적 판단 |
| `personalization` | 개인화 | 모든 것을 자신과 연관 짓기 |
| `emotional_reasoning` | 감정적 추론 | 감정을 사실로 받아들임 |
| `should_statements` | 당위적 사고 | "~해야 한다" 강박 |
| `labeling` | 낙인 찍기 | 자신/타인을 부정적으로 규정 |
| `mind_reading` | 독심술 | 타인의 생각을 단정 |
| `fortune_telling` | 점치기 | 미래를 부정적으로 예측 |

---

### 3.3. Intervention

```typescript
interface Intervention {
  distortionType: string;   // 왜곡 유형 (영문 코드)
  distortionName: string;   // 왜곡 유형 (한글명)
  severity: 'low' | 'medium' | 'high';  // 심각도
  urgency: 'immediate' | 'soon' | 'routine';  // 긴급도
  questions: string[];      // CBT 질문 (3~5개 권장)
  tasks: Task[];            // 행동 과제 (2~3개 권장)
}
```

**Python (FastAPI) 예시**:
```python
class Urgency(str, Enum):
    IMMEDIATE = "immediate"  # 즉시 알림
    SOON = "soon"            # 세션 종료 후 알림
    ROUTINE = "routine"      # 리포트에만 표시

class Intervention(BaseModel):
    distortionType: str
    distortionName: str
    severity: Severity
    urgency: Urgency
    questions: List[str]  # 3~5개 권장
    tasks: List[Task]     # 2~3개 권장
```

---

### 3.4. Task

```typescript
interface Task {
  title: string;              // 과제 제목 (20자 이내 권장)
  description: string;        // 과제 설명 (100자 이내 권장)
  difficulty: 'easy' | 'medium' | 'hard';  // 난이도
  duration: string;           // 예상 소요 시간 (예: "5분", "10분", "1일")
}
```

**Python (FastAPI) 예시**:
```python
class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class Task(BaseModel):
    title: str
    description: str
    difficulty: Difficulty
    duration: str  # 예: "5분", "10분", "1일"
```

---

## 🎯 4. 우선순위별 구현 요청

### P0 (즉시 구현 - Critical)

**목표**: 프론트엔드가 백엔드 API 응답을 실제로 사용할 수 있도록 함

1. **`GET /api/sessions/:id/report` 응답 수정** (1~2일)
   - `cbtFindings` 배열 반환
   - `CognitiveDistortion[]` 최소 1개 이상 포함
   - `Intervention` 객체 포함 (needsIntervention: true일 때)

2. **`GET /api/sessions/:id/summary` 응답 수정** (1일)
   - `cbt.totalDistortions` 실제 계산값 반환
   - `cbt.mostCommon` 가장 빈번한 왜곡 유형 반환

**예상 소요 시간**: 2~3일

---

### P1 (1~2주 내 구현 - High)

**목표**: 실시간 CBT 알림 시스템 구축

3. **WebSocket `emotion_update` 메시지 확장** (2~3일)
   - `cbtAnalysis` 필드 추가
   - `needsIntervention: true` 시 즉시 발송
   - 중복 알림 방지 로직 (동일 왜곡 3분 이내 재발송 금지)

4. **CBT 분석 엔진 통합** (3~5일)
   - 사용자 발화 → 인지 왜곡 감지
   - 감정 상태 + 텍스트 분석 조합
   - 신뢰도 임계값 설정 (0.7 이상 권장)

**예상 소요 시간**: 1~2주

---

### P2 (여유 시 구현 - Medium)

**목표**: 사용자 입력 수집 및 CBT 진행 추적

5. **자동사고 입력 API** (POST /api/sessions/:id/thoughts)
   - 사용자가 세션 중 자동사고 기록 가능
   - 프론트엔드에서 POST 요청

6. **대안 사고 제안 API** (GET /api/cbt/suggestions)
   - 인지 왜곡 유형별 대안 사고 템플릿 제공

7. **CBT 진행 추적 API** (GET /api/users/:id/cbt-progress)
   - 사용자별 왜곡 유형 빈도 통계
   - 시계열 데이터 (주간/월간 트렌드)

**예상 소요 시간**: 2~3주

---

## 🧪 5. 테스트 시나리오

### 시나리오 1: 세션 종료 후 CBT 결과 조회

**전제 조건**:
- 사용자가 세션 완료
- 백엔드 CBT 분석 완료

**테스트 절차**:
1. 프론트엔드 → `GET /api/sessions/12345/report`
2. 응답 확인:
   ```json
   {
     "cbtFindings": [
       {
         "hasDistortions": true,
         "detections": [
           { "type": "catastrophizing", "name_ko": "파국화", "severity": "high", ... }
         ]
       }
     ]
   }
   ```
3. 프론트엔드 SessionResult 화면에 "파국화" 왜곡 카드 표시 확인

**예상 결과**:
- ✅ `detections` 배열이 비어있지 않음
- ✅ `severity`, `confidence`, `examples` 필드 모두 채워짐
- ✅ 프론트엔드 UI에 왜곡 상세 정보 렌더링

---

### 시나리오 2: 실시간 CBT 알림

**전제 조건**:
- 사용자가 세션 진행 중
- WebSocket 연결 활성화

**테스트 절차**:
1. 사용자가 "모든 게 끝났어, 회사에서 잘릴 거야" 발화
2. 백엔드 CBT 분석 → "파국화" 감지 (severity: high, confidence: 0.9)
3. WebSocket 메시지 발송:
   ```json
   {
     "type": "emotion_update",
     "data": {
       "emotion": "anxious",
       "cbtAnalysis": {
         "needsIntervention": true,
         "detections": [...]
       }
     }
   }
   ```
4. 프론트엔드 알림 모달 팝업 확인

**예상 결과**:
- ✅ WebSocket 메시지 수신
- ✅ 프론트엔드 모달에 "파국화 왜곡이 감지되었습니다" 표시
- ✅ CBT 질문 3개 + 행동 과제 2개 렌더링

---

### 시나리오 3: 빈 CBT 결과 (왜곡 미감지)

**전제 조건**:
- 사용자가 건강한 대화 진행
- 인지 왜곡 감지 안 됨

**테스트 절차**:
1. 프론트엔드 → `GET /api/sessions/12345/report`
2. 응답 확인:
   ```json
   {
     "cbtFindings": [
       {
         "hasDistortions": false,
         "needsIntervention": false,
         "detections": []
       }
     ]
   }
   ```
3. 프론트엔드 SessionResult 화면 확인

**예상 결과**:
- ✅ "인지 왜곡이 감지되지 않았습니다" 메시지 표시
- ✅ 긍정적 피드백 UI 표시 (예: "건강한 사고 패턴을 유지하고 계십니다")

---

## ❓ 6. FAQ

### Q1: `cbtFindings` 배열이 여러 개일 수 있나요?
**A**: 네. 세션 중 여러 시점에서 CBT 분석이 수행된 경우, 각 분석 결과를 배열에 담아 반환할 수 있습니다. 프론트엔드는 가장 최근 결과를 우선 표시하거나, 전체 결과를 타임라인으로 보여줄 수 있습니다.

### Q2: `intervention` 객체는 언제 포함되나요?
**A**: `needsIntervention: true`일 때만 포함됩니다. 즉, 즉각적인 개입이 필요한 경우에만 `questions`와 `tasks`를 제공하여 프론트엔드가 알림 모달을 띄울 수 있도록 합니다.

### Q3: `examples` 배열에는 무엇을 넣어야 하나요?
**A**: 사용자의 실제 발화 중 해당 인지 왜곡을 보여주는 문장을 2~5개 넣어주세요. 예를 들어, "파국화" 왜곡의 경우 "모든 게 끝났어", "회사에서 잘릴 거야" 같은 사용자 발화를 포함합니다.

### Q4: `urgency` 필드는 어떻게 사용되나요?
**A**:
- `immediate`: 실시간 알림 모달 즉시 표시
- `soon`: 세션 종료 후 알림 표시
- `routine`: 리포트에만 표시 (알림 없음)

### Q5: 백엔드 CBT 분석 로직은 어떻게 구현하나요?
**A**: 이 문서는 API 스펙만 정의합니다. CBT 분석 알고리즘은 백엔드 팀의 판단에 따라 구현하되, 다음을 권장합니다:
- Gemini API 활용 (프롬프트 엔지니어링)
- 사용자 발화 + 감정 상태 조합 분석
- 신뢰도 임계값 0.7 이상일 때만 반환

### Q6: 프론트엔드 타입 정의는 어디서 확인하나요?
**A**: `src/types/index.ts` 파일의 `CBTAnalysis`, `CognitiveDistortion`, `Intervention`, `Task` 타입을 참고하세요.

---

## 📚 7. 참고 자료

- **프론트엔드 타입 정의**: `src/types/index.ts`
- **API 클라이언트**: `src/services/api/session.api.ts`
- **WebSocket 구현**: `src/services/websocket.ts`
- **SessionResult 컴포넌트**: `src/components/Session/SessionResult.tsx`

---

## ✅ 8. 완료 체크리스트

### P0 (즉시)
- [ ] `GET /api/sessions/:id/report` 응답에 `cbtFindings` 배열 추가
- [ ] `CognitiveDistortion` 객체 최소 1개 반환 (테스트용)
- [ ] `Intervention` 객체 추가 (needsIntervention: true일 때)
- [ ] `GET /api/sessions/:id/summary` 응답에 `cbt.totalDistortions`, `cbt.mostCommon` 실제 계산값 반환

### P1 (1~2주)
- [ ] WebSocket `emotion_update` 메시지에 `cbtAnalysis` 필드 추가
- [ ] `needsIntervention: true` 시 실시간 발송 로직 구현
- [ ] 중복 알림 방지 (3분 이내 동일 왜곡 재발송 금지)

### P2 (여유 시)
- [ ] 자동사고 입력 API (`POST /api/sessions/:id/thoughts`)
- [ ] 대안 사고 제안 API (`GET /api/cbt/suggestions`)
- [ ] CBT 진행 추적 API (`GET /api/users/:id/cbt-progress`)

---

**문의 사항**: 백엔드 팀에서 질문이 있으시면 프론트엔드 팀에게 연락해주세요.
