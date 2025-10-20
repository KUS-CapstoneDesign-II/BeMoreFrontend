# Phase 6: Session History & Analytics

## 🎯 목표

사용자가 자신의 상담 히스토리를 조회하고 감정 분석 대시보드를 통해 인사이트를 얻을 수 있는 시스템 구현

---

## 📋 구현 체크리스트

### 1. History Page

**파일**: `src/pages/History.tsx`

```typescript
// UI 레이아웃
┌─────────────────────────────────────┐
│ History                             │
├─────────────────────────────────────┤
│ [ 검색 ]  [ 필터 ]  [ 정렬 ]        │
├─────────────────────────────────────┤
│ ┌───────────────────────────────┐   │
│ │ Session Card 1                │   │
│ │ - 날짜/시간                    │   │
│ │ - 감정 요약 (pie chart)       │   │
│ │ - 세션 시간                    │   │
│ └───────────────────────────────┘   │
│ ┌───────────────────────────────┐   │
│ │ Session Card 2                │   │
│ └───────────────────────────────┘   │
│                                     │
│ [ Pagination ]                      │
└─────────────────────────────────────┘

// 기능
- 세션 목록 조회 (최신순)
- 검색 (날짜 범위, 감정 타입)
- 필터링 (감정, 기간)
- 정렬 (날짜, 시간, 감정)
- 페이지네이션 (10개씩)
- 세션 카드 클릭 시 상세 페이지로 이동
```

---

### 2. Session List Component

**파일**: `src/components/History/SessionList.tsx`

```typescript
// Props
interface SessionListProps {
  sessions: Session[];
  isLoading: boolean;
  onSessionClick: (sessionId: string) => void;
}

// Session 타입
interface Session {
  id: string;
  userId: string;
  startTime: string;  // ISO 8601
  endTime: string;
  duration: number;   // seconds
  emotionSummary: {
    [key in EmotionType]: number;  // percentage
  };
  dominantEmotion: EmotionType;
  messageCount: number;
  vadMetrics: VADMetrics;
}

// UI 요구사항
- Skeleton UI (로딩 중)
- Empty state (세션 없음)
- Infinite scroll or Pagination
- Dark mode 지원
```

---

### 3. Session Card Component

**파일**: `src/components/History/SessionCard.tsx`

```typescript
// UI 요구사항
┌─────────────────────────────────────┐
│ 📅 2025-10-20  ⏱️ 14:30 - 15:15    │
├─────────────────────────────────────┤
│   [Emotion Pie Chart - Mini]        │
│   😊 45%  😢 30%  😰 25%             │
├─────────────────────────────────────┤
│ 세션 시간: 45분                      │
│ 메시지: 23개                         │
│ 주요 감정: 행복                      │
└─────────────────────────────────────┘

// 인터랙션
- Hover: shadow-soft-lg
- Click: 세션 상세 페이지로 이동
- Gradient border (dominant emotion color)
```

---

### 4. Session Detail Page

**파일**: `src/pages/SessionDetail.tsx`

```typescript
// UI 레이아웃
┌─────────────────────────────────────┐
│ ← Back to History                   │
├─────────────────────────────────────┤
│ Session #12345                      │
│ 2025-10-20  14:30 - 15:15 (45분)   │
├─────────────────────────────────────┤
│ [Tab: Timeline] [Tab: Statistics]   │
├─────────────────────────────────────┤
│ Timeline Tab:                        │
│ ┌───────────────────────────────┐   │
│ │ 14:30  😊  "안녕하세요"       │   │
│ │ 14:32  😢  "요즘 힘들어요"    │   │
│ │ 14:35  😰  "불안해요"         │   │
│ └───────────────────────────────┘   │
│                                     │
│ Statistics Tab:                     │
│ - Emotion Distribution Chart        │
│ - VAD Pattern Chart                 │
│ - Speech Pattern Chart              │
└─────────────────────────────────────┘

// 기능
- 타임라인 (시간순 감정 & 메시지)
- 통계 탭 (차트)
- 세션 다운로드 (PDF)
- 세션 삭제
```

---

### 5. Analytics Dashboard Page

**파일**: `src/pages/Analytics.tsx`

```typescript
// UI 레이아웃
┌─────────────────────────────────────┐
│ Analytics Dashboard                 │
├─────────────────────────────────────┤
│ [ 기간: 최근 7일 ▼ ]                │
├─────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐     │
│ │ 총 세션 수  │ │ 평균 시간   │     │
│ │    12       │ │   42분      │     │
│ └─────────────┘ └─────────────┘     │
│ ┌─────────────┐ ┌─────────────┐     │
│ │ 주요 감정   │ │ 개선도      │     │
│ │    😊       │ │   ↑ 15%    │     │
│ └─────────────┘ └─────────────┘     │
├─────────────────────────────────────┤
│ [Emotion Trend Chart]               │
│ (라인 차트 - 시간에 따른 감정 변화)  │
├─────────────────────────────────────┤
│ [Emotion Distribution]              │
│ (파이 차트 - 감정 분포)             │
├─────────────────────────────────────┤
│ [AI Insights]                       │
│ 💡 "최근 2주간 행복 감정이 증가했어요" │
│ 💡 "불안 감정이 감소하고 있어요"     │
└─────────────────────────────────────┘
```

---

### 6. Emotion Chart Components

**파일**: `src/components/Analytics/EmotionTrendChart.tsx`

```typescript
// 라이브러리: recharts
npm install recharts

// 기능
- Line Chart (시간 축: X, 감정 비율: Y)
- 8가지 감정 라인 (각각 다른 색상)
- Tooltip (hover 시 상세 정보)
- Legend (감정 이름 & 색상)
- Responsive (모바일 대응)
- Dark mode 지원
```

**파일**: `src/components/Analytics/EmotionDistributionChart.tsx`

```typescript
// 기능
- Pie Chart (감정별 비율)
- Interactive (클릭 시 해당 감정 세션 필터링)
- Label (감정 이름 & 퍼센트)
- Dark mode 지원
```

**파일**: `src/components/Analytics/VADPatternChart.tsx`

```typescript
// 기능
- Bar Chart (VAD 메트릭)
  - Speech Ratio
  - Pause Ratio
  - Average Pause Duration
  - Speech Burst Count
- Comparison (기간별 비교)
- Dark mode 지원
```

---

### 7. Insight Card Component

**파일**: `src/components/Analytics/InsightCard.tsx`

```typescript
// UI 요구사항
┌─────────────────────────────────────┐
│ 💡 AI Insight                        │
├─────────────────────────────────────┤
│ 최근 2주간 행복 감정이 15% 증가했어요 │
│                                     │
│ 이는 긍정적인 변화입니다! 계속       │
│ 이런 패턴을 유지해보세요.            │
│                                     │
│ [자세히 보기]                       │
└─────────────────────────────────────┘

// 인사이트 타입
type InsightType =
  | 'emotion_increase'    // 감정 증가
  | 'emotion_decrease'    // 감정 감소
  | 'pattern_change'      // 패턴 변화
  | 'achievement'         // 목표 달성
  | 'recommendation'      // 추천 사항

// 기능
- 감정 변화 감지
- 패턴 분석
- 개선 제안
- 목표 추적
```

---

### 8. API Service

**파일**: `src/services/historyAPI.ts`

```typescript
// API 엔드포인트
GET /api/sessions
  Query: { page, limit, startDate, endDate, emotion, sortBy }
  Response: { sessions: Session[], total: number, page: number }

GET /api/sessions/:sessionId
  Response: { session: SessionDetail }

GET /api/analytics/summary
  Query: { startDate, endDate }
  Response: {
    totalSessions: number,
    averageDuration: number,
    dominantEmotion: EmotionType,
    emotionDistribution: { [key in EmotionType]: number },
    improvement: number  // percentage
  }

GET /api/analytics/emotion-trend
  Query: { startDate, endDate, granularity: 'day' | 'week' | 'month' }
  Response: {
    data: Array<{
      date: string,
      emotions: { [key in EmotionType]: number }
    }>
  }

GET /api/analytics/insights
  Query: { startDate, endDate }
  Response: {
    insights: Array<{
      type: InsightType,
      title: string,
      description: string,
      importance: 'low' | 'medium' | 'high'
    }>
  }

DELETE /api/sessions/:sessionId
  Response: { message: "세션 삭제 성공" }
```

---

### 9. Routing 업데이트

```typescript
<Routes>
  <Route path="/history" element={
    <ProtectedRoute>
      <History />
    </ProtectedRoute>
  } />
  <Route path="/history/:sessionId" element={
    <ProtectedRoute>
      <SessionDetail />
    </ProtectedRoute>
  } />
  <Route path="/analytics" element={
    <ProtectedRoute>
      <Analytics />
    </ProtectedRoute>
  } />
</Routes>
```

---

### 10. Navigation 업데이트

**파일**: `src/components/Navigation/Sidebar.tsx` (새로 생성)

```typescript
// 사이드바 메뉴
- Dashboard (메인)
- History (세션 히스토리)
- Analytics (분석)
- Profile (프로필)
- Settings (설정)

// 모바일: 하단 탭바
// 데스크톱: 왼쪽 사이드바
```

---

## 🎨 디자인 가이드라인

### 차트 색상
```typescript
const chartColors = {
  happy: '#F59E0B',      // Amber
  sad: '#3B82F6',        // Blue
  angry: '#F87171',      // Red
  anxious: '#A78BFA',    // Purple
  neutral: '#6B7280',    // Gray
  surprised: '#FB923C',  // Orange
  disgusted: '#10B981',  // Emerald
  fearful: '#8B5CF6',    // Violet
};
```

### 카드 스타일
```css
.session-card {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-soft p-4;
  @apply hover:shadow-soft-lg transition-all duration-300;
  @apply cursor-pointer;
}
```

### 애니메이션
- 차트 로딩: Skeleton with pulse
- 페이지 전환: Fade in/out
- 카드 hover: Scale 1.02

---

## 🧪 테스트 시나리오

### 1. History 조회
1. "/history" 접속
2. 세션 목록 로딩
3. 세션 카드 클릭
4. 세션 상세 페이지 표시

### 2. 검색 & 필터
1. 날짜 범위 선택
2. 감정 필터 선택
3. 결과 업데이트 확인

### 3. Analytics Dashboard
1. "/analytics" 접속
2. 통계 요약 표시
3. 차트 렌더링 확인
4. 기간 변경 시 차트 업데이트

### 4. 인사이트
1. AI 인사이트 표시
2. "자세히 보기" 클릭
3. 상세 정보 모달 표시

---

## 📦 필요한 Dependencies

```bash
npm install recharts            # 차트 라이브러리
npm install date-fns            # 날짜 포맷팅
npm install react-infinite-scroll-component  # 무한 스크롤
```

---

## ✅ 완료 기준

- [ ] 세션 목록 조회 정상 작동
- [ ] 세션 상세 페이지 정상 표시
- [ ] 검색/필터 정상 작동
- [ ] 페이지네이션 정상 작동
- [ ] 차트 렌더링 정상 (Emotion Trend, Distribution, VAD)
- [ ] 통계 요약 정확성
- [ ] AI 인사이트 표시
- [ ] Dark mode 지원
- [ ] 모바일 반응형
- [ ] 접근성 (WCAG 2.1 AA)
- [ ] TypeScript 타입 안전
- [ ] Build 에러 없음

---

## 🚀 실행 명령어

```bash
# Phase 6 시작
"Phase 6 구현을 시작합니다. PHASE6_HISTORY_ANALYTICS.md의 모든 요구사항을 순서대로 구현해주세요."

# 완료 후
npm run build
npm run preview
```

---

## 📝 주의사항

1. **성능**
   - 차트 데이터 캐싱
   - Lazy loading (차트 컴포넌트)
   - Debounce (검색 입력)
   - Pagination (대량 세션)

2. **사용자 경험**
   - 로딩 상태 명확히
   - Empty state 디자인
   - 에러 처리 (차트 렌더링 실패)
   - 반응형 차트 (모바일)

3. **데이터 정확성**
   - 날짜/시간 타임존 처리
   - 통계 계산 정확성
   - 퍼센트 반올림 (소수점 1자리)

4. **접근성**
   - 차트 대체 텍스트
   - Keyboard navigation
   - Screen reader 지원

---

## 🎉 완료 시 다음 단계

Phase 6 완료 후 → **Phase 7: Real-time AI Interaction** 진행
