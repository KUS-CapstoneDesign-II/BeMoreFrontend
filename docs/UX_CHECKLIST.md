# UX/HCI Quick Reference Checklist

**BeMore Frontend - 개발/리뷰 시 즉시 확인용**

빠른 체크를 위한 필수 항목만 정리한 문서입니다.
상세 가이드라인은 [UX_HCI_IMPROVEMENT_GUIDELINES.md](../UX_HCI_IMPROVEMENT_GUIDELINES.md)를 참고하세요.

---

## 📝 신규 컴포넌트 개발 전 체크리스트

### 1. Fitts의 법칙 (크기와 거리)
- [ ] 모든 클릭/탭 타겟이 최소 44×44px인가?
- [ ] 주요 액션 버튼이 중앙 또는 접근하기 쉬운 위치에 있는가?
- [ ] 모바일에서 엄지로 쉽게 도달 가능한가?
- [ ] 관련 버튼끼리 12-16px 간격으로 그룹화되어 있는가?
- [ ] 파괴적 액션(삭제)과 주요 액션(저장)이 충분히 분리되어 있는가?

### 2. Hick의 법칙 (선택지 복잡도)
- [ ] 주요 CTA가 1-2개로 명확한가?
- [ ] 보조 옵션이 시각적으로 구분되어 있는가?
- [ ] 첫 방문자와 재방문자에게 다른 UI를 제공하는가?
- [ ] 현재 상태에 따라 불필요한 옵션이 숨겨지는가?
- [ ] 7개 이상의 선택지가 있다면 그룹화되어 있는가?

### 3. Miller의 법칙 (7±2 정보 제한)
- [ ] 동시에 표시되는 정보가 7±2개 이내인가?
- [ ] 관련 정보가 카드나 섹션으로 그룹화되어 있는가?
- [ ] 섹션 간 간격이 명확한가? (24px 이상)
- [ ] 세부 정보가 접기/펼치기로 숨겨져 있는가?

### 4. Jakob의 법칙 (익숙한 패턴)
- [ ] 업계 표준 UI 패턴을 따르는가?
- [ ] 새로운 패턴이 명확한 이점을 제공하는가?
- [ ] 온보딩이나 설명이 필요한가?

### 5. Peak-End 법칙 (정점과 마지막 인상)
- [ ] 오류 메시지가 친절하고 해결책을 제시하는가?
- [ ] 대기 시간에 진행 상태가 표시되는가?
- [ ] 완료 화면에 축하나 감사 메시지가 있는가?
- [ ] 다음 단계가 명확한가?

### 6. Gestalt 원칙 (시각적 그룹화)
- [ ] 관련 요소가 가까이 배치되어 있는가? (8-12px)
- [ ] 섹션 간 간격이 명확한가? (24px 이상)
- [ ] 같은 역할의 요소가 같은 스타일인가?
- [ ] 카드나 섹션에 둘러싸기 요소가 있는가? (border, shadow)

### 7. Tesler의 법칙 (복잡성 보존)
- [ ] 사용자가 반드시 결정해야 하는 것만 노출하는가?
- [ ] 기술적 세부사항이 숨겨져 있는가?
- [ ] 스마트 기본값이 제공되는가?
- [ ] 자동 복구 로직이 있는가?

---

## 🔍 코드 리뷰 체크리스트

### 버튼 검증
```typescript
// ✅ GOOD
<Button size="md" className="min-h-[44px]">클릭</Button>

// ❌ BAD
<button className="px-2 py-1">클릭</button> // 너무 작음
```

**체크 항목**:
- [ ] Button 컴포넌트에 `size="md"` 이상 사용?
- [ ] 명시적 `min-h-[44px]` 또는 `min-h-[48px]` 지정?
- [ ] 아이콘만 있는 버튼도 44px 이상인가?
- [ ] 모바일 하단 컨트롤이 고정되어 있는가?

### 모달 검증
```typescript
// ✅ GOOD
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)} // Escape, 배경 클릭
>
  <CloseButton className="absolute right-4 top-4">✕</CloseButton>
</Modal>

// ❌ BAD
<Modal onBackdropClick={() => {}}>
  {/* Escape 키 이벤트 없음 */}
</Modal>
```

**체크 항목**:
- [ ] Escape 키로 닫히는가?
- [ ] 배경 클릭으로 닫히는가?
- [ ] 우측 상단에 닫기 버튼(✕)이 있는가?
- [ ] 40-60% 어두운 배경이 있는가?
- [ ] Focus trap이 구현되어 있는가?

### 폼 검증
```typescript
// ✅ GOOD
<Input
  value={value}
  onChange={handleChange}
  error={error}
  className={error ? 'border-red-500' : ''}
/>
{error && <ErrorMessage>{error}</ErrorMessage>}

// ❌ BAD
<input onChange={setValue} /> {/* 실시간 검증 없음 */}
```

**체크 항목**:
- [ ] 실시간 에러 표시가 있는가?
- [ ] 에러 메시지가 입력란 하단에 표시되는가?
- [ ] 유효하지 않으면 제출 버튼이 비활성화되는가?
- [ ] 로딩 중 스피너가 표시되는가?

### 정보 표시 검증
```typescript
// ✅ GOOD: 해석된 인사이트
<InsightCard>
  <Message>💬 활발하게 대화하고 계시네요!</Message>
  <Details>자세히 보기 ▼</Details>
</InsightCard>

// ❌ BAD: 원시 데이터
<div>Speech Ratio: 64.3%</div> {/* 의미 불명확 */}
```

**체크 항목**:
- [ ] 기술 용어가 사용자 친화적으로 번역되었는가?
- [ ] 원시 메트릭이 해석되어 있는가?
- [ ] "좋음/나쁨" 판단 기준이 제공되는가?
- [ ] 상세 정보는 접기/펼치기로 숨겨져 있는가?

---

## ⚡ 빠른 패턴 참조

### ✅ 권장 패턴

#### 버튼 크기
```typescript
<Button size="md" className="min-h-[44px] px-6 py-3">
  주요 액션
</Button>
```

#### 모바일 하단 컨트롤
```typescript
<div className="fixed bottom-0 left-0 right-0 p-4 bg-white sm:hidden">
  <Button className="w-full min-h-[48px]">계속</Button>
</div>
```

#### 그룹화된 버튼
```typescript
<div className="flex gap-3">
  <Button variant="secondary">취소</Button>
  <Button variant="primary">확인</Button>
</div>
```

#### 친절한 오류 메시지
```typescript
<ErrorCard>
  <Icon>🔒</Icon>
  <Title>카메라 접근이 필요합니다</Title>
  <Description>브라우저 설정에서 권한을 허용해주세요.</Description>
  <HelpGuide>
    1. 주소창 왼쪽 🔒 아이콘 클릭
    2. "카메라" 허용 선택
    3. 페이지 새로고침
  </HelpGuide>
  <Actions>
    <Button onClick={retry}>다시 시도</Button>
    <Button variant="ghost" onClick={skip}>나중에</Button>
  </Actions>
</ErrorCard>
```

#### 진행 상태 표시
```typescript
<LoadingModal>
  <ProgressSteps>
    <Step status="complete">✅ 저장 완료</Step>
    <Step status="in-progress">🔄 분석 중...</Step>
    <Step status="pending">⏳ 리포트 대기</Step>
  </ProgressSteps>
  <ProgressBar value={60} max={100} />
  <EstimatedTime>약 15초 남음</EstimatedTime>
</LoadingModal>
```

#### 정보 청킹
```typescript
<Sidebar className="space-y-4"> {/* 24px 섹션 간격 */}
  <Card> {/* 카드로 묶기 */}
    <CardTitle>감정 분석</CardTitle>
    <EmotionDisplay />
  </Card>

  <Card>
    <CardTitle>음성 분석</CardTitle>
    <VADMetrics />
  </Card>
</Sidebar>
```

---

### ❌ 피해야 할 패턴

#### 작은 버튼
```typescript
// ❌ 36px 미만
<button className="px-2 py-1 min-h-[32px]">클릭</button>
```

#### 선택지 과다
```typescript
// ❌ 7개 이상 동시 노출
<Header>
  <Logo />
  <Language />
  <Theme />
  <Settings />
  <Help />
  <Timer />
  <Start />
  <History />
</Header>
```

#### 기술 용어 노출
```typescript
// ❌ 사용자 이해 어려움
<div>Landmarks WebSocket: connected</div>
<div>Speech Ratio: 64.3%</div>
```

#### 불투명한 대기
```typescript
// ❌ 진행 상태 불명확
<Modal>
  <Spinner />
  <p>처리 중입니다...</p>
  {/* 얼마나? 무엇을? */}
</Modal>
```

---

## 📱 모바일 전용 체크리스트

### 터치 타겟
- [ ] 모든 클릭 가능 요소가 44×44px 이상인가?
- [ ] 버튼 간 간격이 12px 이상인가? (오터치 방지)
- [ ] 엄지 도달 영역에 주요 액션이 있는가?

### 레이아웃
- [ ] 하단 고정 컨트롤이 있는가? (`fixed bottom-0`)
- [ ] 세로 스크롤이 자연스러운가?
- [ ] 가로 모드를 지원하는가?

### 입력
- [ ] 입력란이 충분히 큰가? (최소 44px 높이)
- [ ] 키보드가 입력란을 가리지 않는가?
- [ ] 자동 확대(zoom)가 비활성화되어 있는가? (font-size 16px 이상)

---

## 🎨 접근성 체크리스트

### WCAG 2.1 AA/AAA 준수
- [ ] 색상 대비율이 4.5:1 이상인가? (일반 텍스트)
- [ ] 색상 대비율이 3:1 이상인가? (큰 텍스트 18px+)
- [ ] 터치 타겟이 44×44px 이상인가? (AAA 기준)
- [ ] 텍스트가 200%까지 확대 가능한가?

### 키보드 접근성
- [ ] 모든 기능이 키보드로 접근 가능한가?
- [ ] Tab 키 순서가 논리적인가?
- [ ] Focus 상태가 명확하게 표시되는가? (ring-2)
- [ ] Escape 키로 모달이 닫히는가?

### 스크린 리더
- [ ] 모든 이미지에 alt 텍스트가 있는가?
- [ ] 버튼에 aria-label이 있는가? (아이콘만 있는 경우)
- [ ] 폼 입력란에 label이 연결되어 있는가?
- [ ] 상태 변경 시 aria-live로 알림이 가는가?

### 색상 독립성
- [ ] 색상만으로 정보를 전달하지 않는가?
- [ ] 아이콘이나 텍스트로 보조 표시가 있는가?
- [ ] 에러가 빨간색 + 텍스트로 표시되는가?

---

## ⚡ 배포 전 최종 체크리스트

### 기능 검증
- [ ] 모든 버튼이 동작하는가?
- [ ] 폼 검증이 정확한가?
- [ ] 에러 처리가 친절한가?
- [ ] 로딩 상태가 표시되는가?

### 브라우저 호환성
- [ ] Chrome (최신 2개 버전)
- [ ] Safari (최신 2개 버전)
- [ ] Firefox (최신 2개 버전)
- [ ] Edge (최신 2개 버전)

### 디바이스 테스트
- [ ] Desktop (1920×1080)
- [ ] Tablet (768×1024)
- [ ] Mobile (375×667, 414×896)
- [ ] 가로/세로 모드

### 성능 검증
- [ ] Lighthouse 점수 90+ (Performance)
- [ ] Lighthouse 점수 90+ (Accessibility)
- [ ] 번들 크기 < 500KB (initial)
- [ ] FCP < 1.8초
- [ ] LCP < 2.5초

### UX 검증
- [ ] 첫 방문자가 주요 액션을 쉽게 찾는가?
- [ ] 오류 복구 경로가 명확한가?
- [ ] 완료 화면이 만족스러운가?
- [ ] 다음 단계가 명확한가?

---

## 📚 추가 참고 자료

- **[UX/HCI Improvement Guidelines](../UX_HCI_IMPROVEMENT_GUIDELINES.md)** - 전체 가이드라인
- **[UX Analysis Report](../UX_ANALYSIS_REPORT_2025_11_11.md)** - 상세 분석 보고서
- **[WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)** - 접근성 표준
- **[Laws of UX](https://lawsofux.com/)** - UX 법칙 인터랙티브 가이드

---

## 🚀 우선순위 개선 사항 (Quick Links)

### P0 (즉시 개선)
1. [권한 오류 처리 개선](../UX_HCI_IMPROVEMENT_GUIDELINES.md#1-권한-오류-처리-개선)
2. [WebSocket 상태 단순화](../UX_HCI_IMPROVEMENT_GUIDELINES.md#2-websocket-상태-단순화)
3. [세션 종료 대기 시각화](../UX_HCI_IMPROVEMENT_GUIDELINES.md#3-세션-종료-대기-시각화)

### P1 (단기 개선)
4. [헤더 컨트롤 그룹화](../UX_HCI_IMPROVEMENT_GUIDELINES.md#4-헤더-컨트롤-그룹화)
5. [VAD 메트릭 친화적 표현](../UX_HCI_IMPROVEMENT_GUIDELINES.md#5-vad-메트릭-친화적-표현)
6. [보조 버튼 터치 타겟 확대](../UX_HCI_IMPROVEMENT_GUIDELINES.md#6-보조-버튼-터치-타겟-확대)

---

**마지막 업데이트**: 2025년 11월 11일
**문의**: Frontend 팀 또는 [GitHub Issues](https://github.com/KUS-CapstoneDesign-II/BeMoreFrontend/issues)
