# Frontend CBT Implementation Guide

> **Document Purpose**: Step-by-step implementation guide for frontend developers to integrate CBT (Cognitive Behavioral Therapy) features into the BeMore application.
>
> **Created**: 2025-01-18
> **Target Audience**: Frontend Development Team
> **Prerequisites**: Backend API implementation completed (see [BACKEND_CBT_REQUIREMENTS.md](../integration/backend/BACKEND_CBT_REQUIREMENTS.md))

---

## Table of Contents

1. [Current Implementation Problems](#1-current-implementation-problems)
2. [Component Architecture Overview](#2-component-architecture-overview)
3. [Priority-Based Work List](#3-priority-based-work-list)
4. [Implementation Guide](#4-implementation-guide)
5. [Backend API Integration](#5-backend-api-integration)
6. [Testing Checklist](#6-testing-checklist)
7. [Completion Criteria](#7-completion-criteria)

---

## 1. Current Implementation Problems

### 1.1. Critical Issues

#### **Problem 1: Hardcoded CBT Data in SessionResult.tsx**

**Location**: `src/components/Session/SessionResult.tsx` (Lines 341-356)

**Current Code**:
```typescript
const cbt = (summary?.cbt as { totalDistortions?: number; mostCommon?: string } | undefined)
  ?? { totalDistortions: 0, mostCommon: null };

<div className="p-3 rounded-lg bg-gray-50">
  <div className="text-xs text-gray-500 mb-1">CBT 하이라이트</div>
  <div>왜곡 총계: <span className="font-medium">{cbt.totalDistortions}</span></div>
  <div>가장 흔한 왜곡: <span className="font-medium">{cbt.mostCommon || '-'}</span></div>
</div>
```

**Problem**:
- Ignores `report.cbtFindings` array from API
- Displays `totalDistortions: 0` as default
- No actual cognitive distortion details shown
- Incomplete type casting (missing `CognitiveDistortion[]`)

**Impact**: Users see placeholder data instead of actual CBT analysis results.

---

#### **Problem 2: Unused API Response Fields**

**Location**: `src/services/api/session.api.ts` → `SessionReport` type

**Type Definition**:
```typescript
interface SessionReport {
  emotionTimeline: EmotionData[];
  vadSummary: VADMetrics;
  vadTimeline: VADTimeSeriesData[];
  cbtFindings?: CBTAnalysis[];  // ⚠️ Type exists but UI doesn't render
}
```

**Problem**:
- Backend sends `cbtFindings` array
- Frontend receives it successfully
- UI components never display it
- All CBT data is lost

**Impact**: Complete loss of CBT analysis functionality despite having data.

---

#### **Problem 3: Hardcoded Action Buttons**

**Location**: `src/components/Session/SessionResult.tsx` (Lines ~380-390)

**Current Code**:
```typescript
{(recommendations && recommendations.length ? recommendations : ['4-6 호흡', '감사 저널', '1분 스트레칭'])
  .slice(0,3)
  .map((r, i) => (
    <Button key={i} variant="primary">{r}</Button>
  ))}
```

**Problem**:
- Uses hardcoded Korean strings as fallback
- Ignores `intervention.tasks[]` from API
- No task difficulty or duration shown
- No proper task structure

**Impact**: Users see generic recommendations instead of personalized CBT interventions.

---

#### **Problem 4: Missing Real-Time CBT Alerts**

**Location**: `src/App.tsx` (Lines 266-303, `emotion_update` handler)

**Current Code**:
```typescript
if (message.type === 'emotion_update') {
  const emotionData = message.data as EmotionData;
  setCurrentEmotion(emotionData.emotion);

  // ⚠️ cbtAnalysis field received but NOT USED
  // EmotionData.cbtAnalysis?: CBTAnalysis exists in type but never triggers UI
}
```

**Problem**:
- WebSocket receives `cbtAnalysis` in real-time
- No UI component responds to `needsIntervention: true`
- No modal/alert shows up when cognitive distortion is detected
- Intervention questions and tasks are ignored

**Impact**: Real-time CBT guidance is completely non-functional.

---

### 1.2. Missing Components

| Component Name | Purpose | Status |
|---------------|---------|--------|
| `CBTAnalysisSection.tsx` | Display CBT findings in SessionResult | ❌ Not Created |
| `CognitiveDistortionCard.tsx` | Render individual distortion with severity | ❌ Not Created |
| `InterventionPanel.tsx` | Show intervention questions and tasks | ❌ Not Created |
| `CBTAlertModal.tsx` | Real-time popup for CBT intervention | ❌ Not Created |
| `TaskCard.tsx` | Display actionable CBT tasks | ❌ Not Created |

---

### 1.3. Data Flow Issues

**Expected Flow** (not working):
```
Backend API → sessionAPI.getReport() → report.cbtFindings → SessionResult → CBTAnalysisSection → CognitiveDistortionCard
```

**Actual Flow** (current):
```
Backend API → sessionAPI.getReport() → report.cbtFindings → ❌ IGNORED → Hardcoded values displayed
```

**Expected Real-Time Flow** (not working):
```
WebSocket emotion_update → EmotionData.cbtAnalysis → CBTAlertModal → User sees intervention
```

**Actual Real-Time Flow** (current):
```
WebSocket emotion_update → EmotionData.cbtAnalysis → ❌ IGNORED → Nothing happens
```

---

## 2. Component Architecture Overview

### 2.1. Component Hierarchy (Proposed)

```
SessionResult.tsx
├── (existing) EmotionChart
├── (existing) VADChart
├── (existing) SessionSummaryReport
└── (NEW) CBTAnalysisSection.tsx
    ├── (NEW) CognitiveDistortionList.tsx
    │   └── (NEW) CognitiveDistortionCard.tsx (multiple)
    └── (NEW) InterventionPanel.tsx
        ├── (NEW) InterventionQuestions.tsx
        └── (NEW) TaskList.tsx
            └── (NEW) TaskCard.tsx (multiple)

App.tsx (WebSocket handler)
└── (NEW) CBTAlertModal.tsx (conditional render when needsIntervention=true)
    ├── (NEW) InterventionQuestions.tsx (reused)
    └── (NEW) TaskList.tsx (reused)
```

### 2.2. Shared Component Design

**Reusable Components**:
- `InterventionQuestions.tsx`: Used in both SessionResult and CBTAlertModal
- `TaskList.tsx`: Used in both SessionResult and CBTAlertModal
- `TaskCard.tsx`: Individual task display

**State Management**:
- `src/stores/sessionStore.ts`: Add `currentCBTAlert` state for real-time alerts
- `src/contexts/SessionContext.tsx`: Provide CBT alert handlers

---

## 3. Priority-Based Work List

### 3.1. P0 (Critical) - Must Fix Immediately

| Task | Component/File | Estimated Time | Dependencies |
|------|---------------|----------------|--------------|
| 1. Remove hardcoded CBT section in SessionResult | `SessionResult.tsx` | 2 hours | None |
| 2. Create CBTAnalysisSection component | `CBTAnalysisSection.tsx` | 3 hours | Task 1 |
| 3. Create CognitiveDistortionCard component | `CognitiveDistortionCard.tsx` | 2 hours | Task 2 |
| 4. Integrate `report.cbtFindings` into UI | `SessionResult.tsx` | 1 hour | Task 2, 3 |
| 5. Replace hardcoded action buttons with Task[] | `SessionResult.tsx` | 1 hour | Backend API |

**Total P0 Time**: ~1 day

---

### 3.2. P1 (High) - Implement Real-Time Features

| Task | Component/File | Estimated Time | Dependencies |
|------|---------------|----------------|--------------|
| 6. Create CBTAlertModal component | `CBTAlertModal.tsx` | 3 hours | None |
| 7. Add `currentCBTAlert` state to sessionStore | `sessionStore.ts` | 1 hour | None |
| 8. Implement WebSocket `cbtAnalysis` handler | `App.tsx` | 2 hours | Task 6, 7 |
| 9. Create InterventionPanel component | `InterventionPanel.tsx` | 2 hours | None |
| 10. Create TaskCard component | `TaskCard.tsx` | 1 hour | None |

**Total P1 Time**: ~1 day

---

### 3.3. P2 (Medium) - Enhanced Features

| Task | Component/File | Estimated Time | Dependencies |
|------|---------------|----------------|--------------|
| 11. Add user input for automatic thoughts | `SessionResult.tsx` | 2 hours | Backend API |
| 12. Create CBT progress tracking | `SessionStore.ts` | 3 hours | Backend API |
| 13. Add CBT history page integration | `History.tsx` | 2 hours | Backend API |
| 14. Implement intervention task completion | `TaskCard.tsx` | 2 hours | Backend API |

**Total P2 Time**: ~1 day

---

## 4. Implementation Guide

### 4.1. P0 Task 1: Remove Hardcoded CBT Section

**File**: `src/components/Session/SessionResult.tsx`

**Current Code** (Lines 341-356):
```typescript
const cbt = (summary?.cbt as { totalDistortions?: number; mostCommon?: string } | undefined)
  ?? { totalDistortions: 0, mostCommon: null };

<div className="p-3 rounded-lg bg-gray-50">
  <div className="text-xs text-gray-500 mb-1">CBT 하이라이트</div>
  <div>왜곡 총계: <span className="font-medium">{cbt.totalDistortions}</span></div>
  <div>가장 흔한 왜곡: <span className="font-medium">{cbt.mostCommon || '-'}</span></div>
</div>
```

**Step 1**: Delete hardcoded section (Lines 341-356)

**Step 2**: Replace with new component import:
```typescript
import { CBTAnalysisSection } from './CBTAnalysisSection';
```

**Step 3**: Add new section to render:
```typescript
{/* Replace hardcoded CBT section with proper component */}
{report && report.cbtFindings && report.cbtFindings.length > 0 && (
  <CBTAnalysisSection cbtFindings={report.cbtFindings} />
)}
```

**Validation**:
- ✅ Hardcoded values removed
- ✅ Component renders only when `cbtFindings` exists
- ✅ Data flows from API response to UI

---

### 4.2. P0 Task 2: Create CBTAnalysisSection Component

**File**: `src/components/Session/CBTAnalysisSection.tsx` (NEW)

**Full Implementation**:
```typescript
import React from 'react';
import { CBTAnalysis } from '../../types';
import { CognitiveDistortionCard } from './CognitiveDistortionCard';
import { InterventionPanel } from './InterventionPanel';

interface CBTAnalysisSectionProps {
  cbtFindings: CBTAnalysis[];
}

export const CBTAnalysisSection: React.FC<CBTAnalysisSectionProps> = ({ cbtFindings }) => {
  // Calculate summary statistics
  const totalFindings = cbtFindings.length;
  const findingsWithDistortions = cbtFindings.filter(f => f.hasDistortions);
  const findingsNeedingIntervention = cbtFindings.filter(f => f.needsIntervention);

  // Extract all distortions from all findings
  const allDistortions = cbtFindings.flatMap(f => f.detections || []);

  // Count distortion types
  const distortionCounts = allDistortions.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Find most common distortion
  const mostCommonType = Object.entries(distortionCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
  const mostCommonDistortion = allDistortions.find(d => d.type === mostCommonType);

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          CBT 분석 결과
        </h3>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">분석 구간</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {totalFindings}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">왜곡 발견</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {findingsWithDistortions.length}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">개입 필요</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {findingsNeedingIntervention.length}
            </div>
          </div>
        </div>

        {mostCommonDistortion && (
          <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">가장 흔한 왜곡</div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {mostCommonDistortion.name_ko}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
              총 {distortionCounts[mostCommonType]}회 발견
            </div>
          </div>
        )}
      </div>

      {/* Cognitive Distortions List */}
      {allDistortions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100">
            발견된 인지 왜곡 ({allDistortions.length}건)
          </h4>
          <div className="space-y-3">
            {allDistortions.map((distortion, index) => (
              <CognitiveDistortionCard key={index} distortion={distortion} />
            ))}
          </div>
        </div>
      )}

      {/* Intervention Panels */}
      {cbtFindings.map((finding, index) => (
        finding.intervention && (
          <InterventionPanel
            key={index}
            intervention={finding.intervention}
          />
        )
      ))}

      {/* No Distortions Message */}
      {allDistortions.length === 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <div>
              <div className="font-medium text-green-800 dark:text-green-200">
                인지 왜곡이 발견되지 않았습니다
              </div>
              <div className="text-sm text-green-600 dark:text-green-300 mt-1">
                세션 동안 건강한 사고 패턴을 유지하셨습니다.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

**Key Features**:
- ✅ Calculates summary statistics from actual data
- ✅ Displays total findings, distortions, and interventions needed
- ✅ Identifies most common distortion type
- ✅ Renders all distortions in cards
- ✅ Shows intervention panels when needed
- ✅ Handles empty state gracefully

---

### 4.3. P0 Task 3: Create CognitiveDistortionCard Component

**File**: `src/components/Session/CognitiveDistortionCard.tsx` (NEW)

**Full Implementation**:
```typescript
import React from 'react';
import { CognitiveDistortion } from '../../types';

interface CognitiveDistortionCardProps {
  distortion: CognitiveDistortion;
}

// Severity color mapping
const severityStyles = {
  low: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-700',
    text: 'text-yellow-800 dark:text-yellow-200',
    badge: 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100',
  },
  medium: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-700',
    text: 'text-orange-800 dark:text-orange-200',
    badge: 'bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-100',
  },
  high: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-700',
    text: 'text-red-800 dark:text-red-200',
    badge: 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100',
  },
};

// Severity Korean labels
const severityLabels = {
  low: '낮음',
  medium: '중간',
  high: '높음',
};

export const CognitiveDistortionCard: React.FC<CognitiveDistortionCardProps> = ({ distortion }) => {
  const style = severityStyles[distortion.severity];

  return (
    <div className={`border rounded-lg p-4 ${style.bg} ${style.border}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h5 className={`font-semibold ${style.text}`}>
            {distortion.name_ko}
          </h5>
          <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
            {distortion.type}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Severity Badge */}
          <span className={`text-xs font-medium px-2 py-1 rounded ${style.badge}`}>
            {severityLabels[distortion.severity]}
          </span>

          {/* Confidence Score */}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round(distortion.confidence * 100)}%
          </span>
        </div>
      </div>

      {/* Examples */}
      {distortion.examples && distortion.examples.length > 0 && (
        <div className="mt-3">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            발견된 표현:
          </div>
          <ul className="space-y-1">
            {distortion.examples.map((example, index) => (
              <li
                key={index}
                className="text-sm text-gray-800 dark:text-gray-200 bg-white/50 dark:bg-gray-800/50 rounded px-2 py-1"
              >
                "{example}"
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Confidence Indicator */}
      <div className="mt-3">
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-600 dark:text-gray-400">신뢰도</div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${style.badge}`}
              style={{ width: `${distortion.confidence * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
```

**Key Features**:
- ✅ Severity-based color coding (low/medium/high)
- ✅ Displays Korean name and English type
- ✅ Shows confidence score as percentage and progress bar
- ✅ Lists example phrases that triggered detection
- ✅ Dark mode support

---

### 4.4. P0 Task 4: Create InterventionPanel Component

**File**: `src/components/Session/InterventionPanel.tsx` (NEW)

**Full Implementation**:
```typescript
import React, { useState } from 'react';
import { Intervention } from '../../types';
import { TaskCard } from './TaskCard';

interface InterventionPanelProps {
  intervention: Intervention;
}

// Urgency styles
const urgencyStyles = {
  immediate: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-300 dark:border-red-700',
    badge: 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100',
    icon: '🚨',
  },
  soon: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-300 dark:border-orange-700',
    badge: 'bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-100',
    icon: '⚠️',
  },
  routine: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-300 dark:border-blue-700',
    badge: 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100',
    icon: 'ℹ️',
  },
};

const urgencyLabels = {
  immediate: '즉시 권장',
  soon: '빠른 시일 내 권장',
  routine: '일상적 관리',
};

export const InterventionPanel: React.FC<InterventionPanelProps> = ({ intervention }) => {
  const [answersExpanded, setAnswersExpanded] = useState(false);
  const style = urgencyStyles[intervention.urgency];

  return (
    <div className={`border-2 rounded-lg p-4 ${style.bg} ${style.border}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <span className="text-3xl">{style.icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              CBT 개입 권장
            </h4>
            <span className={`text-xs font-medium px-2 py-1 rounded ${style.badge}`}>
              {urgencyLabels[intervention.urgency]}
            </span>
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">{intervention.distortionName}</span> 패턴이 발견되었습니다
          </div>
        </div>
      </div>

      {/* Reflection Questions */}
      {intervention.questions && intervention.questions.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setAnswersExpanded(!answersExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <span>{answersExpanded ? '▼' : '▶'}</span>
            <span>생각해볼 질문들 ({intervention.questions.length}개)</span>
          </button>

          {answersExpanded && (
            <div className="space-y-2 pl-6">
              {intervention.questions.map((question, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-primary-600 dark:text-primary-400 font-semibold">
                      Q{index + 1}.
                    </span>
                    <p className="text-sm text-gray-800 dark:text-gray-200 flex-1">
                      {question}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommended Tasks */}
      {intervention.tasks && intervention.tasks.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            권장 활동 ({intervention.tasks.length}개)
          </h5>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {intervention.tasks.map((task, index) => (
              <TaskCard key={index} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

**Key Features**:
- ✅ Urgency-based styling (immediate/soon/routine)
- ✅ Collapsible reflection questions section
- ✅ Grid layout for recommended tasks
- ✅ Distortion name display
- ✅ Visual hierarchy with icons and badges

---

### 4.5. P0 Task 5: Create TaskCard Component

**File**: `src/components/Session/TaskCard.tsx` (NEW)

**Full Implementation**:
```typescript
import React from 'react';
import { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onComplete?: (task: Task) => void;
}

// Difficulty styles
const difficultyStyles = {
  easy: {
    badge: 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100',
    icon: '✓',
  },
  medium: {
    badge: 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100',
    icon: '◐',
  },
  hard: {
    badge: 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100',
    icon: '★',
  },
};

const difficultyLabels = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete }) => {
  const style = difficultyStyles[task.difficulty];

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow">
      {/* Title */}
      <h6 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {task.title}
      </h6>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        {task.description}
      </p>

      {/* Metadata */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Difficulty Badge */}
          <span className={`text-xs font-medium px-2 py-1 rounded ${style.badge}`}>
            {style.icon} {difficultyLabels[task.difficulty]}
          </span>

          {/* Duration */}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {task.duration}
          </span>
        </div>

        {/* Action Button */}
        {onComplete && (
          <button
            onClick={() => onComplete(task)}
            className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            시작하기 →
          </button>
        )}
      </div>
    </div>
  );
};
```

**Key Features**:
- ✅ Difficulty-based badges (easy/medium/hard)
- ✅ Duration display
- ✅ Optional completion callback
- ✅ Hover effects
- ✅ Clean typography hierarchy

---

### 4.6. P1 Task 6-8: Real-Time CBT Alerts

#### Step 1: Create CBTAlertModal Component

**File**: `src/components/Session/CBTAlertModal.tsx` (NEW)

```typescript
import React from 'react';
import { CBTAnalysis } from '../../types';
import { InterventionPanel } from './InterventionPanel';

interface CBTAlertModalProps {
  cbtAnalysis: CBTAnalysis;
  onClose: () => void;
  onStartIntervention?: () => void;
}

export const CBTAlertModal: React.FC<CBTAlertModalProps> = ({
  cbtAnalysis,
  onClose,
  onStartIntervention,
}) => {
  if (!cbtAnalysis.needsIntervention || !cbtAnalysis.intervention) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 rounded-t-xl">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold mb-1">CBT 개입 권장</h3>
              <p className="text-sm text-primary-100">
                현재 대화에서 인지 왜곡 패턴이 감지되었습니다
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl leading-none transition-colors"
              aria-label="닫기"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Distortion Summary */}
          {cbtAnalysis.detections && cbtAnalysis.detections.length > 0 && (
            <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
              <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                감지된 인지 왜곡
              </h4>
              <ul className="space-y-1">
                {cbtAnalysis.detections.map((detection, index) => (
                  <li key={index} className="text-sm text-orange-800 dark:text-orange-200">
                    • <span className="font-medium">{detection.name_ko}</span>
                    {detection.examples && detection.examples.length > 0 && (
                      <span className="text-orange-600 dark:text-orange-300">
                        {' '}(예: "{detection.examples[0]}")
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Intervention Panel */}
          <InterventionPanel intervention={cbtAnalysis.intervention} />
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 p-4 rounded-b-xl border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              나중에 하기
            </button>
            <button
              onClick={onStartIntervention || onClose}
              className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
            >
              지금 시작하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

#### Step 2: Add State to sessionStore

**File**: `src/stores/sessionStore.ts`

**Add to store interface**:
```typescript
interface SessionState {
  // ... existing state ...

  // NEW: Real-time CBT alert
  currentCBTAlert: CBTAnalysis | null;
  setCBTAlert: (alert: CBTAnalysis | null) => void;
  dismissCBTAlert: () => void;
}
```

**Add to implementation**:
```typescript
export const useSessionStore = create<SessionState>((set) => ({
  // ... existing state ...

  // NEW: CBT alert state
  currentCBTAlert: null,

  setCBTAlert: (alert) => set({ currentCBTAlert: alert }),

  dismissCBTAlert: () => set({ currentCBTAlert: null }),
}));
```

#### Step 3: Implement WebSocket Handler

**File**: `src/App.tsx`

**Import dependencies** (add to existing imports):
```typescript
import { useSessionStore } from './stores/sessionStore';
import { CBTAlertModal } from './components/Session/CBTAlertModal';
```

**Add to component** (inside App component):
```typescript
// Get CBT alert state
const currentCBTAlert = useSessionStore((state) => state.currentCBTAlert);
const setCBTAlert = useSessionStore((state) => state.setCBTAlert);
const dismissCBTAlert = useSessionStore((state) => state.dismissCBTAlert);
```

**Modify emotion_update handler** (Lines ~266-303):
```typescript
if (message.type === 'emotion_update') {
  const emotionData = message.data as EmotionData;

  setCurrentEmotion(emotionData.emotion);

  // NEW: Handle CBT analysis from real-time WebSocket
  if (emotionData.cbtAnalysis) {
    const cbtAnalysis = emotionData.cbtAnalysis;

    // If intervention is needed, show alert modal
    if (cbtAnalysis.needsIntervention && cbtAnalysis.intervention) {
      setCBTAlert(cbtAnalysis);
    }
  }

  // Update emotion timeline
  setEmotionTimeline(prev => [...prev, {
    emotion: emotionData.emotion,
    timestamp: Date.now(),
    frameCount: emotionData.frameCount || 0,
    sttSnippet: emotionData.sttSnippet,
    cbtAnalysis: emotionData.cbtAnalysis  // NEW: Store CBT data in timeline
  }]);
}
```

**Add modal to render** (before closing App component):
```typescript
return (
  <div className="App">
    {/* ... existing UI ... */}

    {/* NEW: Real-time CBT Alert Modal */}
    {currentCBTAlert && (
      <CBTAlertModal
        cbtAnalysis={currentCBTAlert}
        onClose={dismissCBTAlert}
        onStartIntervention={() => {
          // TODO: Navigate to intervention page or expand tasks
          dismissCBTAlert();
        }}
      />
    )}
  </div>
);
```

---

## 5. Backend API Integration

### 5.1. API Endpoints

**Reference**: See [BACKEND_CBT_REQUIREMENTS.md](../integration/backend/BACKEND_CBT_REQUIREMENTS.md) for complete API specifications.

**Quick Reference**:

#### GET /api/sessions/:id/report
```typescript
import { sessionAPI } from './services/api/session.api';

const report = await sessionAPI.getReport(sessionId);

// report.cbtFindings: CBTAnalysis[]
// Use in: SessionResult.tsx → CBTAnalysisSection
```

#### GET /api/sessions/:id/summary
```typescript
const summary = await sessionAPI.getSummary(sessionId);

// summary.cbt: { totalDistortions, mostCommon, etc. }
// Use for: Quick overview in SessionSummaryReport
```

#### WebSocket emotion_update Message
```typescript
// EmotionData.cbtAnalysis?: CBTAnalysis
// Triggers: CBTAlertModal when needsIntervention === true
```

### 5.2. Type Safety

**All types are already defined** in `src/types/index.ts`:
- ✅ `CBTAnalysis`
- ✅ `CognitiveDistortion`
- ✅ `Intervention`
- ✅ `Task`

**No type changes needed** - UI components use existing types.

### 5.3. Error Handling

**API Error Handling**:
```typescript
// In SessionResult.tsx
try {
  const report = await sessionAPI.getReport(sessionId);
  if (report.cbtFindings && report.cbtFindings.length > 0) {
    // Render CBT section
  }
} catch (error) {
  console.error('Failed to fetch CBT report:', error);
  // Show error toast
  toast.error('CBT 분석 결과를 불러오는데 실패했습니다');
}
```

**WebSocket Error Handling**:
```typescript
// In App.tsx emotion_update handler
try {
  if (emotionData.cbtAnalysis) {
    if (emotionData.cbtAnalysis.needsIntervention) {
      setCBTAlert(emotionData.cbtAnalysis);
    }
  }
} catch (error) {
  console.error('CBT analysis processing error:', error);
  // Don't crash the app - CBT is supplementary feature
}
```

---

## 6. Testing Checklist

### 6.1. P0 Component Testing

**SessionResult.tsx**:
- [ ] Hardcoded CBT section removed (Lines 341-356 deleted)
- [ ] `CBTAnalysisSection` component imported and rendered
- [ ] Component only renders when `report.cbtFindings` exists
- [ ] No console errors when `cbtFindings` is empty

**CBTAnalysisSection.tsx**:
- [ ] Summary statistics calculate correctly
- [ ] Most common distortion displays accurate count
- [ ] All distortions render in list
- [ ] Intervention panels appear when present
- [ ] Empty state shows green success message
- [ ] Dark mode styling works correctly

**CognitiveDistortionCard.tsx**:
- [ ] Severity colors display correctly (low=yellow, medium=orange, high=red)
- [ ] Confidence score shows as percentage
- [ ] Progress bar width matches confidence value
- [ ] Examples list renders when available
- [ ] Card is responsive on mobile

**TaskCard.tsx**:
- [ ] Difficulty badges show correct colors
- [ ] Duration displays properly
- [ ] "시작하기" button appears when `onComplete` provided
- [ ] Hover effects work

### 6.2. P1 Real-Time Testing

**CBTAlertModal.tsx**:
- [ ] Modal appears when `currentCBTAlert` is set
- [ ] Modal dismisses on close button click
- [ ] Modal dismisses on "나중에 하기" button
- [ ] "지금 시작하기" button triggers callback
- [ ] Backdrop blur effect works
- [ ] Modal is scrollable when content overflows
- [ ] Dark mode styling works

**sessionStore.ts**:
- [ ] `setCBTAlert()` updates state correctly
- [ ] `dismissCBTAlert()` clears state
- [ ] State persists across components

**App.tsx WebSocket Handler**:
- [ ] `emotion_update` message parses `cbtAnalysis` field
- [ ] Modal appears when `needsIntervention === true`
- [ ] Timeline stores `cbtAnalysis` data
- [ ] No errors when `cbtAnalysis` is undefined

### 6.3. Integration Testing

**End-to-End Flow**:
1. [ ] Start session
2. [ ] Speak phrases with cognitive distortions (e.g., "I'm terrible at everything")
3. [ ] Verify CBTAlertModal appears in real-time
4. [ ] Dismiss modal
5. [ ] End session
6. [ ] Navigate to SessionResult page
7. [ ] Verify `CBTAnalysisSection` displays distortions
8. [ ] Verify `InterventionPanel` shows tasks
9. [ ] Click task "시작하기" button

**Data Accuracy**:
- [ ] Real-time alerts match post-session report
- [ ] Distortion counts are consistent
- [ ] Task recommendations are identical

### 6.4. Error Cases

**No CBT Data**:
- [ ] SessionResult renders normally when `cbtFindings` is empty
- [ ] No errors in console
- [ ] CBT section gracefully hidden

**Backend Unavailable**:
- [ ] API errors caught and logged
- [ ] Toast notification shows error message
- [ ] App doesn't crash

**Malformed Data**:
- [ ] Components handle missing optional fields
- [ ] Type guards prevent runtime errors
- [ ] Default values prevent null/undefined crashes

---

## 7. Completion Criteria

### 7.1. P0 Requirements (Must Complete)

- [x] Hardcoded CBT values removed from `SessionResult.tsx`
- [ ] `CBTAnalysisSection` component created and rendering
- [ ] `CognitiveDistortionCard` component created and rendering
- [ ] `InterventionPanel` component created and rendering
- [ ] `TaskCard` component created and rendering
- [ ] API response `cbtFindings` correctly integrated
- [ ] Action buttons use backend `Task[]` instead of hardcoded strings
- [ ] All P0 tests passing

### 7.2. P1 Requirements (High Priority)

- [ ] `CBTAlertModal` component created
- [ ] `currentCBTAlert` state added to sessionStore
- [ ] WebSocket `cbtAnalysis` handler implemented in App.tsx
- [ ] Real-time alerts functional during session
- [ ] All P1 tests passing

### 7.3. Code Quality

- [ ] TypeScript compilation successful (`npm run typecheck`)
- [ ] ESLint warnings addressed (`npm run lint`)
- [ ] No console errors in development mode
- [ ] Dark mode support verified
- [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] Accessibility: ARIA labels, keyboard navigation, screen reader friendly

### 7.4. Documentation

- [ ] Component JSDoc comments added
- [ ] Props interfaces documented
- [ ] README updated with new components
- [ ] Code review completed

### 7.5. User Acceptance

- [ ] Product team reviewed UI/UX
- [ ] Backend team confirmed API integration works
- [ ] QA team verified all test scenarios
- [ ] Stakeholders approved for production deployment

---

## Appendix A: Quick Start Commands

```bash
# Install dependencies (if needed)
npm install

# Type check
npm run typecheck

# Lint
npm run lint

# Development server
npm run dev

# Build production
npm run build

# Preview production build
npm run preview
```

---

## Appendix B: File Structure After Implementation

```
src/
├── components/
│   └── Session/
│       ├── SessionResult.tsx (MODIFIED)
│       ├── CBTAnalysisSection.tsx (NEW)
│       ├── CognitiveDistortionCard.tsx (NEW)
│       ├── InterventionPanel.tsx (NEW)
│       ├── TaskCard.tsx (NEW)
│       └── CBTAlertModal.tsx (NEW)
├── stores/
│   └── sessionStore.ts (MODIFIED)
├── App.tsx (MODIFIED - WebSocket handler)
└── types/
    └── index.ts (EXISTING - no changes)
```

---

## Appendix C: Common Issues & Solutions

### Issue 1: "cbtFindings is undefined"

**Cause**: Backend not returning `cbtFindings` in API response.

**Solution**:
1. Check backend implementation status
2. Verify API response with browser DevTools Network tab
3. Add conditional rendering: `{report?.cbtFindings && ...}`

### Issue 2: Modal doesn't appear

**Cause**: `needsIntervention` is false or `intervention` is missing.

**Solution**:
1. Check WebSocket message in DevTools Console
2. Verify `cbtAnalysis.needsIntervention === true`
3. Ensure `intervention` object exists in response

### Issue 3: Tasks not clickable

**Cause**: `onComplete` prop not passed to `TaskCard`.

**Solution**:
```typescript
<TaskCard task={task} onComplete={(t) => console.log('Start task:', t)} />
```

### Issue 4: Dark mode colors wrong

**Cause**: Missing `dark:` prefix in Tailwind classes.

**Solution**:
- Use `text-gray-900 dark:text-gray-100` pattern
- Verify `tailwind.config.js` has `darkMode: 'class'`

---

## Appendix D: Contact & Support

**Frontend Team Lead**: [Your Name]
**Backend API Documentation**: [BACKEND_CBT_REQUIREMENTS.md](../integration/backend/BACKEND_CBT_REQUIREMENTS.md)
**Slack Channel**: #bemore-cbt-implementation
**Issue Tracker**: GitHub Issues

---

**Document Version**: 1.0
**Last Updated**: 2025-01-18
**Next Review**: After P0 completion
