# UX/HCI Improvement Guidelines

**BeMore Frontend - 사용자 경험 개선 실행 가이드라인**

**작성일**: 2025년 11월 11일
**현재 UX 점수**: 86.4/100 (B+ 등급)
**목표**: A 등급 (92/100) 달성

---

## 📋 Quick Start

### 빠른 참조
- **[체크리스트 바로가기](./docs/UX_CHECKLIST.md)** - 개발/리뷰 시 즉시 확인
- **[상세 분석 보고서](./UX_ANALYSIS_REPORT_2025_11_11.md)** - 전체 평가 및 근거
- **[우선순위 개선 사항](#-우선순위별-개선-로드맵)** - P0/P1/P2 액션 플랜

### 이 문서를 사용하는 방법
1. **신규 기능 개발 전**: 해당 법칙 섹션 읽고 체크리스트 확인
2. **코드 리뷰 시**: 체크리스트 기반으로 UX 검증
3. **버그 수정 시**: 관련 법칙 준수 여부 재확인
4. **리팩토링 시**: Best Practices 섹션 참고

---

## 🎯 7가지 UX 디자인 법칙

프로젝트는 다음 7가지 업계 표준 UX 법칙을 기반으로 평가되었습니다:

1. **Fitts의 법칙** - 타겟 크기와 거리
2. **Hick의 법칙** - 선택지 복잡도
3. **Miller의 법칙** - 작업 기억 용량 (7±2)
4. **Jakob의 법칙** - 익숙한 패턴
5. **Peak-End 법칙** - 정점과 마지막 인상
6. **Gestalt 원칙** - 시각적 그룹화
7. **Tesler의 법칙** - 복잡성 보존

---

## 📐 법칙 1: Fitts의 법칙 (Fitts's Law)

### 원칙
> 타겟까지의 거리가 가깝고 타겟 크기가 클수록 클릭/탭이 빠르고 정확하다.

**핵심 개념**: 자주 사용하는 요소는 크게, 가까이 배치한다.

---

### ✅ 준수 기준 (Do's)

#### 버튼 크기
- **주요 액션 버튼**: 최소 44×44px (WCAG AAA 준수)
- **보조 액션 버튼**: 최소 44×44px (현재 36px는 개선 필요)
- **아이콘 버튼**: 최소 44×44px (터치 타겟 고려)
- **별점/라디오 버튼**: 48×48px 이상 권장

#### 배치 전략
- **자주 사용하는 액션**: 화면 중앙 또는 엄지 도달 영역
- **모바일 CTA**: 하단 고정 (엄지 영역)
- **관련 버튼**: 12-16px 간격으로 그룹화
- **모달 액션**: 중앙 배치 (모서리로부터 등거리)

#### 간격 원칙
- **버튼 간 최소 간격**: 12px (오터치 방지)
- **관련 그룹**: 12-16px 내부 간격
- **섹션 구분**: 24px 이상

---

### ❌ 피해야 할 패턴 (Don'ts)

```typescript
// ❌ BAD: 너무 작은 터치 타겟
<button className="px-2 py-1 min-h-[32px]">클릭</button>

// ❌ BAD: 자주 사용하는 버튼을 모서리 배치
<header className="fixed top-0">
  <button className="absolute right-4 top-4">세션 시작</button>
</header>

// ❌ BAD: 관련 없는 버튼 인접 배치
<div className="flex gap-2">
  <button variant="danger">삭제</button>
  <button variant="primary">저장</button>
</div>
```

---

### ✅ 권장 패턴 (Recommended)

```typescript
// ✅ GOOD: WCAG AAA 준수 버튼
<Button
  size="md" // min-height 44px
  className="px-6 py-3"
>
  세션 시작
</Button>

// ✅ GOOD: 주요 액션 중앙 배치
<div className="flex justify-center items-center min-h-screen">
  <Button size="lg" className="min-h-[48px] px-8 py-4">
    새 세션 시작
  </Button>
</div>

// ✅ GOOD: 모바일 하단 고정 컨트롤
<div className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg sm:hidden">
  <div className="flex gap-4">
    <Button className="flex-1 min-h-[48px]">일시정지</Button>
    <Button variant="danger" className="flex-1 min-h-[48px]">종료</Button>
  </div>
</div>

// ✅ GOOD: 관련 버튼 그룹화
<div className="flex gap-3">
  <Button variant="secondary">취소</Button>
  <Button variant="primary">확인</Button>
</div>
```

---

### 🔍 체크리스트

**신규 컴포넌트 개발 시**:
- [ ] 모든 클릭/탭 타겟이 최소 44×44px인가?
- [ ] 주요 액션 버튼이 중앙 또는 접근하기 쉬운 위치에 있는가?
- [ ] 모바일에서 엄지로 쉽게 도달 가능한가?
- [ ] 관련 버튼끼리 12-16px 간격으로 그룹화되어 있는가?
- [ ] 파괴적 액션(삭제)과 주요 액션(저장)이 충분히 분리되어 있는가?

**코드 리뷰 시**:
- [ ] Button 컴포넌트에 `size="md"` 이상 또는 명시적 `min-h-[44px]` 사용?
- [ ] 아이콘만 있는 버튼도 44px 이상인가?
- [ ] 모바일 뷰포트에서 하단 컨트롤이 고정되어 있는가?

---

### 📦 컴포넌트별 적용

#### Button.tsx 개선
```typescript
// 현재 (개선 필요)
sm: "px-3 py-2 min-h-[36px] text-sm" // WCAG AA (개선 필요)

// 권장 개선
sm: "px-3 py-2.5 min-h-[44px] text-sm" // WCAG AAA
md: "px-6 py-3 min-h-[44px] text-base" // 기본 유지
lg: "px-8 py-4 min-h-[48px] text-lg"   // 기본 유지
```

#### SessionControls.tsx 개선
```typescript
// 헤더 버튼 크기 증가
<Button
  size="md" // sm → md 변경
  className="min-h-[44px]"
>
  ⚙️ 설정
</Button>
```

---

## 🎯 법칙 2: Hick의 법칙 (Hick's Law)

### 원칙
> 선택지가 많을수록 의사결정 시간이 증가한다. 선택지를 줄이거나 단계별로 제공한다.

**핵심 개념**: 한 번에 5-7개 이하의 선택지만 제공.

---

### ✅ 준수 기준 (Do's)

#### 선택지 수 제한
- **주요 CTA**: 1-2개 (한 화면에 하나의 명확한 액션)
- **보조 옵션**: 3-5개 (시각적 위계 구분)
- **설정 항목**: 섹션당 5-7개 (그 이상은 탭으로 분류)
- **탭 수**: 2-5개 (너무 많으면 드롭다운 고려)

#### 단계별 공개 (Progressive Disclosure)
- **첫 방문자**: 필수 선택만 표시
- **재방문자**: 조건부 옵션 추가 표시
- **고급 사용자**: "고급 설정" 접기/펼치기

#### 컨텍스트 기반 필터링
- **활성 상태**: 일시정지 + 종료 (2개)
- **일시정지 상태**: 재개만 (1개)
- **종료 상태**: 새 세션 시작 (1개)

---

### ❌ 피해야 할 패턴 (Don'ts)

```typescript
// ❌ BAD: 동시에 너무 많은 CTA
<Dashboard>
  <Button>이전 세션 재개</Button>
  <Button>새 세션 시작</Button>
  <Button>히스토리 보기</Button>
  <Button>설정</Button>
  <Button>도움말</Button>
</Dashboard>

// ❌ BAD: 헤더에 모든 기능 노출
<Header>
  <Logo />
  <LanguageSelector />
  <ThemeToggle />
  <SettingsButton />
  <HelpButton />
  <TimerDisplay />
  <StartSessionButton />
  <HistoryButton />
</Header>

// ❌ BAD: 평면적인 설정 나열
<Settings>
  <FontSizeSetting />
  <LayoutDensitySetting />
  <LanguageSetting />
  <NotificationSetting />
  <HighContrastSetting />
  <ReducedMotionSetting />
  <ThemeSetting />
  <AutoSaveSetting />
</Settings>
```

---

### ✅ 권장 패턴 (Recommended)

```typescript
// ✅ GOOD: 첫 방문자에게 단일 CTA
<Dashboard>
  {!hasHistory ? (
    <HeroSection>
      <Button size="lg" className="min-h-[48px]">
        새 세션 시작
      </Button>
    </HeroSection>
  ) : (
    <>
      <PrimaryAction>
        {hasRecentSession && (
          <Button variant="primary">이전 세션 재개</Button>
        )}
      </PrimaryAction>
      <SecondaryActions className="mt-6">
        <Button variant="secondary">새 세션 시작</Button>
        <Button variant="ghost">히스토리 보기</Button>
      </SecondaryActions>
    </>
  )}
</Dashboard>

// ✅ GOOD: 헤더 그룹화 (5개 그룹)
<Header>
  <LeftGroup>
    <Logo />
    <HomeButton />
  </LeftGroup>

  {sessionActive && (
    <CenterGroup>
      <SessionTimer />
    </CenterGroup>
  )}

  <RightGroup>
    <LanguageSelector />
    <MenuDropdown> {/* 나머지 기능 통합 */}
      <DropdownItem>⚙️ 설정</DropdownItem>
      <DropdownItem>❓ 도움말</DropdownItem>
      <DropdownItem>🌓 테마</DropdownItem>
      <DropdownItem>📊 히스토리</DropdownItem>
    </MenuDropdown>
  </RightGroup>
</Header>

// ✅ GOOD: 설정 탭 구조화
<SettingsPanel>
  <Tabs>
    <Tab name="표시">
      <FontSizeSetting />
      <LayoutDensitySetting />
      <ThemeSetting />
    </Tab>
    <Tab name="시스템">
      <LanguageSetting />
      <NotificationSetting />
      <AccessibilitySettings>
        <HighContrastSetting />
        <ReducedMotionSetting />
      </AccessibilitySettings>
    </Tab>
  </Tabs>
</SettingsPanel>

// ✅ GOOD: 컨텍스트 기반 컨트롤
{sessionStatus === 'active' && (
  <Controls>
    <Button variant="warning">⏸️ 일시정지</Button>
    <Button variant="danger">⏹️ 종료</Button>
  </Controls>
)}

{sessionStatus === 'paused' && (
  <Controls>
    <Button variant="success">▶️ 재개</Button>
  </Controls>
)}
```

---

### 🔍 체크리스트

**신규 화면 개발 시**:
- [ ] 주요 CTA가 1-2개로 명확한가?
- [ ] 보조 옵션이 시각적으로 구분되어 있는가?
- [ ] 첫 방문자와 재방문자에게 다른 UI를 제공하는가?
- [ ] 현재 상태에 따라 불필요한 옵션이 숨겨지는가?

**컴포넌트 리뷰 시**:
- [ ] 한 화면에 5-7개 이상의 동등한 선택지가 있는가? (있다면 그룹화 필요)
- [ ] 드롭다운이나 탭으로 선택지를 분류할 수 있는가?
- [ ] 조건부 렌더링으로 컨텍스트에 맞는 옵션만 표시하는가?

---

## 🧠 법칙 3: Miller의 법칙 (Miller's Law)

### 원칙
> 평균적인 사람의 작업 기억은 7±2개 항목만 처리할 수 있다. 정보를 청크(묶음)로 그룹화한다.

**핵심 개념**: 한 번에 5-9개 이상의 정보를 제시하지 않는다.

---

### ✅ 준수 기준 (Do's)

#### 청킹 전략
- **카드로 그룹화**: 관련 정보를 카드 단위로 묶기
- **섹션 분리**: 24px 이상 간격으로 시각적 구분
- **탭 활용**: 7개 이상 항목은 탭으로 분류
- **아코디언**: 세부 정보는 접기/펼치기

#### 정보 계층
- **필수 정보**: 항상 표시 (3-5개)
- **부가 정보**: 접기/펼치기 또는 툴팁
- **전문가 정보**: "고급 모드" 토글

#### 시각적 청킹
- **근접성**: 관련 요소 8-12px 간격
- **유사성**: 같은 스타일, 색상, 크기
- **둘러싸기**: border, background, shadow

---

### ❌ 피해야 할 패턴 (Don'ts)

```typescript
// ❌ BAD: 평면적 나열 (9개 항목)
<Header>
  <Logo />
  <Subtitle />
  <LanguageSelector />
  <ThemeToggle />
  <SettingsButton />
  <HelpButton />
  <TimerDisplay />
  <StartButton />
  <HistoryButton />
</Header>

// ❌ BAD: 청킹 없는 메트릭
<Metrics>
  <div>FPS: 30</div>
  <div>Latency: 45ms</div>
  <div>Audio Level: 0.8</div>
  <div>Landmarks: Connected</div>
  <div>Voice: Connected</div>
  <div>Session: Connected</div>
  <div>Speech Ratio: 64%</div>
  <div>Pause Duration: 1.2s</div>
</Metrics>
```

---

### ✅ 권장 패턴 (Recommended)

```typescript
// ✅ GOOD: 헤더 그룹화 (3개 청크)
<Header>
  <LeftGroup> {/* 청크 1: 브랜딩 */}
    <Logo />
    <Subtitle />
  </LeftGroup>

  <CenterGroup> {/* 청크 2: 세션 정보 */}
    <SessionTimer />
    <SessionStatus />
  </CenterGroup>

  <RightGroup> {/* 청크 3: 액션 */}
    <LanguageSelector />
    <MenuDropdown />
  </RightGroup>
</Header>

// ✅ GOOD: 카드 기반 그룹화
<Sidebar>
  <EmotionCard> {/* 청크 1: 감정 (4개 항목) */}
    <Emoji />
    <Label />
    <Message />
    <Confidence />
  </EmotionCard>

  <VADCard> {/* 청크 2: 음성 분석 (3개 요약) */}
    <SpeechRatio />
    <PauseDuration />
    <TalkingTime />
    <DetailsAccordion> {/* 나머지는 접기 */}
      <BurstCount />
      <LongestPause />
      <TotalPauses />
    </DetailsAccordion>
  </VADCard>

  <SystemCard> {/* 청크 3: 시스템 (단일 상태) */}
    <ConnectionStatus /> {/* 3채널 통합 */}
  </SystemCard>
</Sidebar>

// ✅ GOOD: 설정 탭 분류 (각 탭 3-4개)
<SettingsPanel>
  <Tabs>
    <Tab name="표시" items={3}>
      <FontSizeSetting />
      <LayoutDensitySetting />
      <ThemeSetting />
    </Tab>
    <Tab name="시스템" items={3}>
      <LanguageSetting />
      <NotificationSetting />
      <AccessibilityGroup> {/* 2개를 1개 그룹으로 */}
        <HighContrast />
        <ReducedMotion />
      </AccessibilityGroup>
    </Tab>
  </Tabs>
</SettingsPanel>
```

---

### 🔍 체크리스트

**신규 화면 개발 시**:
- [ ] 동시에 표시되는 정보가 7±2개 이내인가?
- [ ] 관련 정보가 카드나 섹션으로 그룹화되어 있는가?
- [ ] 섹션 간 간격이 명확한가? (24px 이상)
- [ ] 세부 정보가 접기/펼치기로 숨겨져 있는가?

**컴포넌트 리뷰 시**:
- [ ] 7개 이상의 항목이 평면적으로 나열되어 있지 않은가?
- [ ] 그룹화할 수 있는 항목이 있는가?
- [ ] 탭이나 아코디언으로 분류할 수 있는가?

---

## 🌐 법칙 4: Jakob의 법칙 (Jakob's Law)

### 원칙
> 사용자는 다른 사이트에서의 경험을 기반으로 기대한다. 익숙한 패턴을 따른다.

**핵심 개념**: 업계 표준 UI 패턴을 따르되, 혁신은 신중하게.

---

### ✅ 준수 기준 (Do's)

#### 모달 동작
- Escape 키로 닫기
- 배경 클릭으로 닫기
- 우측 상단 "✕" 버튼
- 40-60% 어두운 배경 오버레이

#### 폼 검증
- 실시간 에러 표시 (빨간 테두리)
- 입력란 하단에 도움말 텍스트
- 유효하지 않으면 제출 버튼 비활성화
- 로딩 중 스피너 표시

#### 네비게이션
- 상단 고정 헤더
- 좌측 상단 로고 (홈 링크)
- "← 뒤로" 브레드크럼
- 활성 탭: 강한 색상, 비활성: 회색

#### 진행 표시
- 점 페이지네이션 (활성: 크고 색상, 비활성: 작고 회색)
- 원형 로딩 스피너
- 수평 진행바 (좌→우 채우기)

---

### ❌ 피해야 할 패턴 (Don'ts)

```typescript
// ❌ BAD: 비표준 모달 동작
<Modal onBackdropClick={() => { /* 아무것도 안 함 */ }}>
  {/* Escape 키 이벤트 없음 */}
  {/* 닫기 버튼 좌측 하단 */}
</Modal>

// ❌ BAD: 폼 에러를 제출 후에만 표시
<form onSubmit={handleSubmit}>
  <input onChange={setValue} /> {/* 실시간 검증 없음 */}
  <button>제출</button>
  {submitted && error && <Error />} {/* 너무 늦음 */}
</form>

// ❌ BAD: 기술 용어 노출
<ConnectionStatus>
  <div>Landmarks WebSocket: connected</div>
  <div>Voice WebSocket: connected</div>
  <div>Session WebSocket: connected</div>
</ConnectionStatus>
```

---

### ✅ 권장 패턴 (Recommended)

```typescript
// ✅ GOOD: 표준 모달
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)} // Escape, 배경 클릭
>
  <ModalHeader>
    <Title>제목</Title>
    <CloseButton className="absolute right-4 top-4">✕</CloseButton>
  </ModalHeader>
  <ModalBody>{children}</ModalBody>
</Modal>

// ✅ GOOD: 실시간 폼 검증
<form onSubmit={handleSubmit}>
  <Input
    value={email}
    onChange={(e) => {
      setEmail(e.target.value);
      validateEmail(e.target.value); // 실시간 검증
    }}
    error={emailError}
    className={emailError ? 'border-red-500' : ''}
  />
  {emailError && (
    <ErrorMessage className="text-red-500 text-sm mt-1">
      {emailError}
    </ErrorMessage>
  )}
  <Button disabled={!isValid || loading}>
    {loading ? <Spinner /> : '제출'}
  </Button>
</form>

// ✅ GOOD: 사용자 친화적 상태 표시
<ConnectionStatus>
  <Badge color={isConnected ? 'green' : 'red'}>
    {isConnected ? '✅ 연결됨' : '⚠️ 연결 끊김'}
  </Badge>

  {/* 기술 정보는 툴팁으로 */}
  <Tooltip>
    <TooltipTrigger>ℹ️</TooltipTrigger>
    <TooltipContent>
      <small>
        얼굴 인식: {landmarksStatus}<br />
        음성 분석: {voiceStatus}<br />
        세션: {sessionStatus}
      </small>
    </TooltipContent>
  </Tooltip>
</ConnectionStatus>

// ✅ GOOD: 표준 네비게이션
<Header className="sticky top-0 z-10 bg-white shadow">
  <Logo onClick={() => navigate('/')} className="cursor-pointer" />
  {sessionActive && (
    <Breadcrumb>
      <BackButton onClick={() => navigate('/')}>← 홈</BackButton>
    </Breadcrumb>
  )}
</Header>
```

---

### 🔍 체크리스트

**모달 개발 시**:
- [ ] Escape 키로 닫히는가?
- [ ] 배경 클릭으로 닫히는가?
- [ ] 우측 상단에 닫기 버튼(✕)이 있는가?
- [ ] 40-60% 어두운 배경이 있는가?

**폼 개발 시**:
- [ ] 실시간 에러 표시가 있는가?
- [ ] 에러 메시지가 입력란 하단에 표시되는가?
- [ ] 유효하지 않으면 제출 버튼이 비활성화되는가?
- [ ] 로딩 중 스피너가 표시되는가?

**신규 패턴 도입 시**:
- [ ] 업계 표준 패턴을 먼저 검토했는가?
- [ ] 사용자가 익숙한 UI 동작을 따르는가?
- [ ] 새로운 패턴이 명확한 이점을 제공하는가?
- [ ] 온보딩이나 설명이 필요한가?

---

## ⛰️ 법칙 5: Peak-End 법칙 (Peak-End Rule)

### 원칙
> 사용자는 경험의 정점(최고/최악 순간)과 마지막 순간을 가장 잘 기억한다.

**핵심 개념**: 긍정적인 피크 만들기, 부정적인 피크 완화하기, 좋은 마무리.

---

### ✅ 준수 기준 (Do's)

#### 긍정적 피크 디자인
- **성공 애니메이션**: 완료 시 축하 효과 (confetti, 체크 아이콘)
- **진행 표시**: 사용자가 앞으로 나아가는 느낌
- **피드백**: 즉각적인 시각적/촉각적 반응
- **놀라움**: 기대 이상의 UX (부드러운 애니메이션, 예쁜 일러스트)

#### 부정적 피크 완화
- **오류 메시지**: 친절하고 해결책 제시
- **대기 시간**: 진행 상태 시각화 + 예상 시간
- **권한 요청**: 이유 설명 + 브라우저별 가이드
- **실패 복구**: "다시 시도" + 대안 제시

#### 좋은 마무리
- **감사 메시지**: "수고하셨어요" 문구
- **다음 단계 안내**: "이제 결과를 확인해보세요"
- **성취 표시**: "이번 주 3번째 세션!"
- **재방문 유도**: "다음에 다시 만나요"

---

### ❌ 피해야 할 패턴 (Don'ts)

```typescript
// ❌ BAD: 충격적인 오류 화면
<ErrorOverlay className="fixed inset-0 bg-red-600 z-50">
  <div className="text-white text-2xl">
    ❌ 카메라 접근 거부됨
  </div>
</ErrorOverlay>

// ❌ BAD: 불투명한 대기
<LoadingModal>
  <Spinner />
  <p>처리 중입니다...</p>
  {/* 얼마나 기다려야 하는지 알 수 없음 */}
  {/* 무슨 작업을 하는지 알 수 없음 */}
</LoadingModal>

// ❌ BAD: 갑작스러운 종료
<SessionEndButton onClick={() => {
  endSession();
  navigate('/'); // 즉시 이동
}}>
  종료
</SessionEndButton>
```

---

### ✅ 권장 패턴 (Recommended)

```typescript
// ✅ GOOD: 친절한 오류 처리
<PermissionErrorCard className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
  <Icon className="text-4xl mb-4">🔒</Icon>
  <Title className="text-lg font-semibold mb-2">
    카메라 접근이 필요합니다
  </Title>
  <Description className="text-gray-600 mb-4">
    상담을 위해 카메라가 필요합니다.
    브라우저 설정에서 권한을 허용해주세요.
  </Description>

  <HelpAccordion>
    <AccordionItem title={`${browserName}에서 허용하는 방법`}>
      <ol className="list-decimal list-inside space-y-2">
        <li>주소창 왼쪽 🔒 아이콘 클릭</li>
        <li>"카메라" 항목에서 "허용" 선택</li>
        <li>페이지 새로고침</li>
      </ol>
    </AccordionItem>
  </HelpAccordion>

  <Actions className="flex gap-3 mt-6">
    <Button variant="primary" onClick={requestAgain}>
      다시 시도
    </Button>
    <Button variant="ghost" onClick={skipForNow}>
      나중에 하기
    </Button>
  </Actions>
</PermissionErrorCard>

// ✅ GOOD: 진행 상태 시각화
<SessionEndModal>
  <ProgressSteps>
    <Step status="complete">
      <Icon>✅</Icon>
      <Label>녹화 저장 완료</Label>
    </Step>
    <Step status="in-progress">
      <Spinner />
      <Label>감정 분석 중...</Label>
    </Step>
    <Step status="pending">
      <Icon className="text-gray-400">⏳</Icon>
      <Label>리포트 생성 대기</Label>
    </Step>
  </ProgressSteps>

  <ProgressBar value={60} max={100} className="mt-4" />
  <EstimatedTime className="text-sm text-gray-500 mt-2">
    약 15초 남음
  </EstimatedTime>
</SessionEndModal>

// ✅ GOOD: 세션 시작 환영
<WelcomeAnimation onEnter={() => {
  showConfetti({ duration: 2000 });
}}>
  <Message className="text-2xl font-semibold animate-fade-in">
    환영합니다! 😊
  </Message>
  <Subtitle className="text-gray-600 mt-2">
    편안하게 대화를 시작해보세요
  </Subtitle>
</WelcomeAnimation>

// ✅ GOOD: 세션 완료 축하
<CompletionScreen>
  <Icon className="text-6xl mb-4 animate-bounce">🎉</Icon>
  <Title className="text-2xl font-bold mb-2">
    세션을 완료했습니다!
  </Title>
  <Message className="text-gray-600 mb-4">
    오늘도 수고하셨어요
  </Message>
  <Achievement className="bg-blue-50 p-3 rounded-lg">
    이번 주 <strong>{weeklyCount}번째</strong> 세션
  </Achievement>

  <Actions className="mt-6">
    <Button variant="primary" onClick={() => navigate('/results')}>
      결과 확인하기
    </Button>
    <Button variant="ghost" onClick={() => navigate('/')}>
      홈으로 돌아가기
    </Button>
  </Actions>
</CompletionScreen>
```

---

### 🔍 체크리스트

**오류 처리 개발 시**:
- [ ] 오류 메시지가 친절하고 비난하지 않는가?
- [ ] 구체적인 해결 방법을 제시하는가?
- [ ] "다시 시도" 버튼이 있는가?
- [ ] 대안 경로가 있는가? (건너뛰기, 나중에 하기)

**대기 화면 개발 시**:
- [ ] 무엇을 처리 중인지 명시되어 있는가?
- [ ] 진행 상태가 시각화되어 있는가? (단계별 또는 진행바)
- [ ] 예상 시간이 표시되는가?
- [ ] 취소 옵션이 필요한가?

**완료 화면 개발 시**:
- [ ] 축하나 감사 메시지가 있는가?
- [ ] 다음 단계가 명확한가?
- [ ] 성취감을 주는 요소가 있는가? (숫자, 배지, 애니메이션)

---

## 🎨 법칙 6: Gestalt 원칙 (Gestalt Principles)

### 원칙
> 인간의 뇌는 개별 요소를 전체 패턴으로 인식한다.

**핵심 개념**: 시각적 그룹화를 통해 정보 구조를 전달한다.

---

### ✅ 준수 기준 (Do's)

#### 근접성 (Proximity)
- 관련 요소: 8-12px 간격
- 섹션 구분: 24px 이상 간격
- 레이블 + 입력: 4-8px 간격 (긴밀)
- 버튼 그룹: 12px 내부 간격

#### 유사성 (Similarity)
- 같은 역할: 같은 색상, 크기, 스타일
- 상태 표시: 일관된 아이콘 + 색상
- 버튼: 일관된 padding, radius, shadow

#### 둘러싸기 (Enclosure)
- 카드: border + shadow
- 입력란: border + focus ring
- 섹션: 배경색 구분

#### 연속성 (Continuity)
- 수평 스크롤: 화살표 + 스크롤바
- 세로 나열: 일관된 간격
- 단계 진행: 점 → 선 → 점

---

### ❌ 피해야 할 패턴 (Don'ts)

```typescript
// ❌ BAD: 불일치한 간격
<div className="space-y-4"> {/* 16px */}
  <Section className="mb-6"> {/* 24px */}
    <Item className="mt-2" /> {/* 8px */}
  </Section>
  <Section className="mb-8"> {/* 32px */}
    <Item className="mt-3" /> {/* 12px */}
  </Section>
</div>

// ❌ BAD: 유사성 부족
<ButtonGroup>
  <button className="px-4 py-2 rounded">취소</button>
  <button className="px-6 py-3 rounded-lg">확인</button>
  {/* 크기, padding, radius 불일치 */}
</ButtonGroup>

// ❌ BAD: 그룹화 부족
<div>
  <label>이메일</label>
  <input />
  <button>제출</button>
  <label>비밀번호</label>
  <input />
  {/* 레이블-입력 관계 불명확 */}
</div>
```

---

### ✅ 권장 패턴 (Recommended)

```typescript
// ✅ GOOD: 일관된 간격 시스템
<div className="space-y-6"> {/* 섹션 간: 24px */}
  <Section className="space-y-4"> {/* 카드 간: 16px */}
    <Card className="space-y-2"> {/* 카드 내부: 8px */}
      <Title />
      <Description />
    </Card>
  </Section>
</div>

// ✅ GOOD: 유사성 기반 그룹
<ButtonGroup className="flex gap-3">
  <Button size="md" variant="secondary">취소</Button>
  <Button size="md" variant="primary">확인</Button>
  {/* 동일 크기, 일관된 스타일 */}
</ButtonGroup>

// ✅ GOOD: 근접성 기반 폼
<form className="space-y-6"> {/* 필드 그룹 간: 24px */}
  <FieldGroup className="space-y-2"> {/* 레이블-입력: 8px */}
    <Label htmlFor="email">이메일</Label>
    <Input id="email" />
    <HelperText>도움말 텍스트</HelperText>
  </FieldGroup>

  <FieldGroup className="space-y-2">
    <Label htmlFor="password">비밀번호</Label>
    <Input id="password" type="password" />
    <HelperText>8자 이상</HelperText>
  </FieldGroup>
</form>

// ✅ GOOD: 둘러싸기 기반 섹션
<Sidebar className="space-y-4">
  <Card className="border rounded-xl shadow-soft p-4">
    <CardTitle>감정 분석</CardTitle>
    <EmotionDisplay />
  </Card>

  <Card className="border rounded-xl shadow-soft p-4">
    <CardTitle>음성 분석</CardTitle>
    <VADMetrics />
  </Card>
</Sidebar>
```

---

### 🔍 체크리스트

**레이아웃 개발 시**:
- [ ] 관련 요소가 가까이 배치되어 있는가? (8-12px)
- [ ] 섹션 간 간격이 명확한가? (24px 이상)
- [ ] 일관된 간격 시스템을 사용하는가? (8px, 16px, 24px)

**컴포넌트 개발 시**:
- [ ] 같은 역할의 요소가 같은 스타일인가?
- [ ] 상태 표시가 일관된 패턴인가? (아이콘, 색상)
- [ ] 카드나 섹션에 둘러싸기 요소가 있는가? (border, shadow, background)

**시각적 검토 시**:
- [ ] 그룹화가 한눈에 명확한가?
- [ ] 섹션 구분이 명확한가?
- [ ] 연속성이 자연스러운가? (수평/세로 흐름)

---

## ⚖️ 법칙 7: Tesler의 법칙 (Law of Conservation of Complexity)

### 원칙
> 모든 시스템에는 줄일 수 없는 최소한의 복잡성이 있다. 시스템이 흡수하거나 사용자에게 전가해야 한다.

**핵심 개념**: 시스템이 복잡성을 최대한 흡수하고, 사용자에게는 필수 결정만 맡긴다.

---

### ✅ 준수 기준 (Do's)

#### 시스템이 흡수할 복잡성
- **자동화**: 권한 재시도, 재연결, 오류 복구
- **기본값**: 언어, 테마, 설정 자동 감지
- **추상화**: 468 랜드마크 → 8개 감정
- **통합**: 3채널 WebSocket → 단일 상태

#### 사용자가 결정할 필수 복잡성
- **권한**: 카메라/마이크 허용 (브라우저 정책)
- **의도**: 세션 시작/종료 (사용자 의지)
- **평가**: 피드백 별점 (주관적)

#### 점진적 복잡성 공개
- **기본**: 단순한 UI (대부분 사용자용)
- **고급**: "고급 설정" 토글 (전문가용)
- **개발자**: "개발자 모드" (디버깅용)

---

### ❌ 피해야 할 패턴 (Don'ts)

```typescript
// ❌ BAD: 기술 세부사항 노출
<WebSocketStatus>
  <div>Landmarks WebSocket: {landmarksWs}</div>
  <div>Voice WebSocket: {voiceWs}</div>
  <div>Session WebSocket: {sessionWs}</div>
  {/* 사용자는 이 정보로 무엇을 해야 하는가? */}
</WebSocketStatus>

// ❌ BAD: 해석되지 않은 메트릭
<VADMetrics>
  <Metric label="Speech Ratio" value="64.3%" />
  <Metric label="Avg Pause Duration" value="1.24s" />
  <Metric label="Burst Count" value="23" />
  {/* 이게 좋은 건가 나쁜 건가? */}
</VADMetrics>

// ❌ BAD: 수동 오류 복구
<ErrorMessage>
  WebSocket 연결이 끊어졌습니다.
  {/* 사용자가 직접 재연결 버튼을 눌러야 함 */}
  <Button onClick={reconnect}>재연결</Button>
</ErrorMessage>
```

---

### ✅ 권장 패턴 (Recommended)

```typescript
// ✅ GOOD: 통합된 상태 표시
<ConnectionStatus>
  <Badge color={overallStatus === 'connected' ? 'green' : 'red'}>
    {overallStatus === 'connected' ? '✅ 연결됨' : '⚠️ 연결 중...'}
  </Badge>

  {/* 기술 정보는 개발자 모드에만 */}
  {isDeveloperMode && (
    <DebugPanel className="mt-2 p-2 bg-gray-100 rounded text-xs">
      <div>Landmarks: {landmarksWs}</div>
      <div>Voice: {voiceWs}</div>
      <div>Session: {sessionWs}</div>
    </DebugPanel>
  )}
</ConnectionStatus>

// ✅ GOOD: 해석된 인사이트
<VADInsightCard>
  <Icon className="text-4xl">{insight.icon}</Icon>
  <Message className={`text-${insight.color}-600`}>
    {insight.message}
    {/* 예: "💬 활발하게 대화하고 계시네요!" */}
  </Message>

  <DetailsAccordion>
    <AccordionTrigger>자세히 보기 ▼</AccordionTrigger>
    <AccordionContent>
      <RawMetric label="말하기 시간 비율" value="64.3%" />
      <RawMetric label="생각하는 시간 (평균)" value="1.24초" />
      <RawMetric label="대화 횟수" value="23회" />
    </AccordionContent>
  </DetailsAccordion>
</VADInsightCard>

// ✅ GOOD: 자동 오류 복구
const useWebSocketWithAutoReconnect = (url: string) => {
  const [status, setStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');

  useEffect(() => {
    let ws: WebSocket;
    let retryCount = 0;
    const maxRetries = 3;

    const connect = () => {
      ws = new WebSocket(url);

      ws.onopen = () => {
        setStatus('connected');
        retryCount = 0; // 성공 시 카운트 리셋
      };

      ws.onclose = () => {
        setStatus('disconnected');

        // 자동 재연결
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          setTimeout(connect, delay);
        }
      };
    };

    connect();
    return () => ws?.close();
  }, [url]);

  return status;
};

// ✅ GOOD: 스마트 기본값
const useSmartDefaults = () => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    if (saved) return saved;

    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'ko' ? 'ko' : 'en';
  });

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;

    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  return { language, theme, setLanguage, setTheme };
};
```

---

### 🔍 체크리스트

**신규 기능 개발 시**:
- [ ] 사용자가 반드시 결정해야 하는 것만 노출하는가?
- [ ] 기술적 세부사항이 숨겨져 있는가?
- [ ] 스마트 기본값이 제공되는가?
- [ ] 자동 복구 로직이 있는가?

**오류 처리 개발 시**:
- [ ] 자동 재시도가 구현되어 있는가?
- [ ] 사용자가 수동으로 복구해야 하는가? (그렇다면 가이드 제공)
- [ ] 진행 상태가 투명하게 표시되는가?

**메트릭 표시 시**:
- [ ] 원시 데이터가 해석되어 있는가?
- [ ] "좋음/나쁨" 판단 기준이 제공되는가?
- [ ] 상세 정보는 접기/펼치기로 숨겨져 있는가?

---

## 🚀 우선순위별 개선 로드맵

### P0: 즉시 개선 (Critical - 1주 이내)

#### 1. 권한 오류 처리 개선
**파일**: `src/components/Session/DeviceCheck/CameraCheck.tsx`, `MicrophoneCheck.tsx`
**라인**: 89-145 (CameraCheck), 78-156 (MicrophoneCheck)

**현재 문제**:
- 전체 화면 빨간 오버레이 (충격적, 사용자 당황)
- 복구 가이드 부족

**개선 방안**:
```typescript
// src/components/Common/PermissionErrorCard.tsx (신규)
export function PermissionErrorCard({
  type, // 'camera' | 'microphone'
  onRetry,
  onSkip
}: PermissionErrorCardProps) {
  const browserName = getBrowserName(); // Chrome, Safari, Firefox

  return (
    <Card className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <Icon className="text-5xl mb-4">🔒</Icon>
      <Title className="text-xl font-semibold mb-2">
        {type === 'camera' ? '카메라' : '마이크'} 접근이 필요합니다
      </Title>
      <Description className="text-gray-600 mb-4">
        상담을 위해 {type === 'camera' ? '카메라가' : '마이크가'} 필요합니다.
        브라우저 설정에서 권한을 허용해주세요.
      </Description>

      <HelpAccordion defaultOpen={true}>
        <AccordionItem title={`${browserName}에서 허용하는 방법`}>
          <BrowserGuide browser={browserName} type={type} />
        </AccordionItem>
      </HelpAccordion>

      <Actions className="flex gap-3 mt-6">
        <Button
          variant="primary"
          onClick={onRetry}
          className="flex-1"
        >
          다시 시도
        </Button>
        <Button
          variant="ghost"
          onClick={onSkip}
          className="flex-1"
        >
          나중에 하기
        </Button>
      </Actions>
    </Card>
  );
}

// src/utils/browserGuide.tsx (신규)
export function BrowserGuide({ browser, type }: BrowserGuideProps) {
  const guides = {
    Chrome: (
      <ol className="list-decimal list-inside space-y-2 text-sm">
        <li>주소창 왼쪽 <strong>🔒 아이콘</strong> 클릭</li>
        <li>"{type === 'camera' ? '카메라' : '마이크'}" 항목에서 <strong>"허용"</strong> 선택</li>
        <li>페이지 <strong>새로고침</strong></li>
      </ol>
    ),
    Safari: (
      <ol className="list-decimal list-inside space-y-2 text-sm">
        <li>상단 메뉴 <strong>Safari → 설정</strong> 열기</li>
        <li><strong>"웹 사이트"</strong> 탭 클릭</li>
        <li>"{type === 'camera' ? '카메라' : '마이크'}" 항목에서 이 사이트를 <strong>"허용"</strong>으로 변경</li>
      </ol>
    ),
    Firefox: (
      <ol className="list-decimal list-inside space-y-2 text-sm">
        <li>주소창 왼쪽 <strong>🔒 아이콘</strong> 클릭</li>
        <li><strong>"권한" 탭</strong>으로 이동</li>
        <li>"{type === 'camera' ? '카메라' : '마이크'}" 차단 해제</li>
      </ol>
    )
  };

  return guides[browser] || guides.Chrome;
}
```

**검증 방법**:
1. 권한 거부 → 친절한 카드 표시 확인
2. 브라우저별 가이드 정확성 확인
3. "다시 시도" → 권한 재요청 확인
4. "나중에 하기" → 스킵 가능 확인

---

#### 2. WebSocket 상태 단순화
**파일**: `src/App.tsx`
**라인**: 1081-1108

**현재 문제**:
- 3채널 독립 표시 (Landmarks, Voice, Session)
- 기술적 세부사항 노출

**개선 방안**:
```typescript
// src/hooks/useOverallConnectionStatus.ts (신규)
export function useOverallConnectionStatus(
  landmarksWs: ConnectionStatus,
  voiceWs: ConnectionStatus,
  sessionWs: ConnectionStatus
): 'connected' | 'connecting' | 'disconnected' {
  return useMemo(() => {
    if (landmarksWs === 'connected' &&
        voiceWs === 'connected' &&
        sessionWs === 'connected') {
      return 'connected';
    } else if (landmarksWs === 'connecting' ||
               voiceWs === 'connecting' ||
               sessionWs === 'connecting') {
      return 'connecting';
    } else {
      return 'disconnected';
    }
  }, [landmarksWs, voiceWs, sessionWs]);
}

// App.tsx 수정
const overallStatus = useOverallConnectionStatus(landmarksWs, voiceWs, sessionWs);

// UI 수정 (App.tsx:1081-1108 교체)
<ConnectionStatusCard>
  <StatusBadge status={overallStatus}>
    {overallStatus === 'connected' && '✅ 연결됨'}
    {overallStatus === 'connecting' && '🔄 연결 중...'}
    {overallStatus === 'disconnected' && '⚠️ 연결 끊김'}
  </StatusBadge>

  {/* 기술 정보는 개발자 모드에만 */}
  {import.meta.env.DEV && (
    <Tooltip>
      <TooltipTrigger>
        <button className="text-gray-400 hover:text-gray-600">ℹ️</button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-xs space-y-1">
          <div>얼굴 인식: {landmarksWs}</div>
          <div>음성 분석: {voiceWs}</div>
          <div>세션: {sessionWs}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  )}
</ConnectionStatusCard>
```

**검증 방법**:
1. 모든 채널 연결 → "✅ 연결됨" 확인
2. 한 채널 연결 중 → "🔄 연결 중..." 확인
3. 연결 끊김 → "⚠️ 연결 끊김" 확인
4. 개발 모드 → 툴팁에 3채널 상세 정보 확인
5. 프로덕션 → 통합 상태만 표시 확인

---

#### 3. 세션 종료 대기 시각화
**파일**: `src/App.tsx`, `src/components/Session/SessionSummaryModal.tsx`
**라인**: 545-612 (App.tsx)

**현재 문제**:
- 30초 대기 중 불투명한 "처리 중..." 표시
- 진행 상태 불명확

**개선 방안**:
```typescript
// src/components/Session/SessionEndProgressModal.tsx (신규)
interface EndStep {
  id: string;
  label: string;
  icon: string;
  status: 'pending' | 'in-progress' | 'complete';
}

export function SessionEndProgressModal({ isOpen }: { isOpen: boolean }) {
  const [steps, setSteps] = useState<EndStep[]>([
    { id: 'save', label: '녹화 저장 중', icon: '💾', status: 'pending' },
    { id: 'analyze', label: '감정 분석 중', icon: '🧠', status: 'pending' },
    { id: 'report', label: '리포트 생성 중', icon: '📊', status: 'pending' }
  ]);

  const [progress, setProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(30);

  useEffect(() => {
    if (!isOpen) return;

    // 단계별 진행 시뮬레이션
    const intervals = [
      { step: 'save', delay: 0, duration: 5000 },      // 0-5초
      { step: 'analyze', delay: 5000, duration: 15000 }, // 5-20초
      { step: 'report', delay: 20000, duration: 10000 }  // 20-30초
    ];

    intervals.forEach(({ step, delay, duration }) => {
      // 시작
      setTimeout(() => {
        setSteps(prev => prev.map(s =>
          s.id === step ? { ...s, status: 'in-progress' } : s
        ));
      }, delay);

      // 완료
      setTimeout(() => {
        setSteps(prev => prev.map(s =>
          s.id === step ? { ...s, status: 'complete' } : s
        ));
      }, delay + duration);
    });

    // 진행바 업데이트
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + (100 / 30), 100));
      setEstimatedTime(prev => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(progressInterval);
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={() => {}}>
      <ModalHeader>
        <Title>세션 종료 중</Title>
      </ModalHeader>

      <ModalBody className="space-y-6">
        {/* 단계별 진행 상태 */}
        <ProgressSteps className="space-y-3">
          {steps.map(step => (
            <StepItem key={step.id} className="flex items-center gap-3">
              <StepIcon status={step.status}>
                {step.status === 'complete' && '✅'}
                {step.status === 'in-progress' && <Spinner size="sm" />}
                {step.status === 'pending' && (
                  <span className="text-gray-400">{step.icon}</span>
                )}
              </StepIcon>
              <StepLabel
                className={step.status === 'complete' ? 'text-green-600' : ''}
              >
                {step.label}
              </StepLabel>
            </StepItem>
          ))}
        </ProgressSteps>

        {/* 진행바 */}
        <div className="space-y-2">
          <ProgressBar value={progress} max={100} className="h-2" />
          <div className="flex justify-between text-sm text-gray-500">
            <span>{Math.round(progress)}% 완료</span>
            <span>약 {estimatedTime}초 남음</span>
          </div>
        </div>

        {/* 안내 메시지 */}
        <InfoMessage className="text-sm text-gray-600 text-center">
          잠시만 기다려주세요. 세션 데이터를 처리하고 있습니다.
        </InfoMessage>
      </ModalBody>
    </Modal>
  );
}
```

**검증 방법**:
1. 세션 종료 → 진행 모달 표시 확인
2. 단계별 아이콘 변화 확인 (⏳ → 🔄 → ✅)
3. 진행바 0% → 100% 업데이트 확인
4. 예상 시간 카운트다운 확인 (30초 → 0초)
5. 모든 단계 완료 → 피드백 모달 전환 확인

---

### P1: 단기 개선 (Important - 2-4주 이내)

#### 4. 헤더 컨트롤 그룹화
**파일**: `src/App.tsx`
**라인**: 876-972

**현재 상태**: 7-9개 요소 평면 나열
**목표**: 5개 그룹으로 정리

**구현 계획**:
```typescript
// Header 구조 변경
<Header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow">
  <Container className="flex items-center justify-between px-4 py-3">
    {/* 그룹 1: 브랜딩 (2개) */}
    <LeftGroup className="flex items-center gap-4">
      <Logo onClick={() => navigate('/')}>BeMore</Logo>
      {sessionActive && (
        <BackButton onClick={() => navigate('/')}>← 홈</BackButton>
      )}
    </LeftGroup>

    {/* 그룹 2: 세션 정보 (1-2개, 조건부) */}
    {sessionActive && (
      <CenterGroup className="flex items-center gap-3">
        <SessionTimer />
        <SessionStatus />
      </CenterGroup>
    )}

    {/* 그룹 3: 액션 + 메뉴 (2개) */}
    <RightGroup className="flex items-center gap-3">
      <LanguageSelector />

      <MenuDropdown>
        <DropdownTrigger className="p-2 hover:bg-gray-100 rounded">
          ⋯
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem onClick={() => setShowSettings(true)}>
            ⚙️ 설정
          </DropdownItem>
          <DropdownItem onClick={() => setShowShortcutsHelp(true)}>
            ❓ 도움말
          </DropdownItem>
          <DropdownItem onClick={toggleTheme}>
            🌓 테마 전환
          </DropdownItem>
          <DropdownItem onClick={() => navigate('/history')}>
            📊 히스토리
          </DropdownItem>
        </DropdownContent>
      </MenuDropdown>
    </RightGroup>
  </Container>
</Header>
```

---

#### 5. VAD 메트릭 친화적 표현
**파일**: `src/components/VAD/VADMonitor.tsx`
**라인**: 68-145

**구현 계획**:
```typescript
// src/utils/vadInsights.ts (신규)
export function getVADInsight(metrics: VADMetrics) {
  const { speechRatio, avgPauseDuration, burstCount } = metrics;

  // 음성 비율 기반 인사이트
  if (speechRatio > 0.7) {
    return {
      icon: '💬',
      message: '활발하게 대화하고 계시네요!',
      color: 'green',
      interpretation: '말하기 비율이 높아 적극적으로 참여하고 있습니다.'
    };
  } else if (speechRatio < 0.3) {
    return {
      icon: '🤔',
      message: '생각하는 시간이 많아요',
      color: 'blue',
      interpretation: '침묵 시간이 많아 깊이 생각하고 있습니다.'
    };
  } else {
    return {
      icon: '✅',
      message: '적절한 페이스로 대화 중입니다',
      color: 'green',
      interpretation: '말하기와 듣기의 균형이 좋습니다.'
    };
  }
}

// VADMonitor 컴포넌트 수정
export function VADMonitor({ metrics }: VADMonitorProps) {
  const insight = getVADInsight(metrics);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="p-4">
      <CardTitle>음성 분석</CardTitle>

      {/* 인사이트 카드 */}
      <InsightCard className="bg-gray-50 p-4 rounded-lg mb-4">
        <Icon className="text-4xl mb-2">{insight.icon}</Icon>
        <Message className={`text-${insight.color}-600 font-semibold mb-1`}>
          {insight.message}
        </Message>
        <Description className="text-sm text-gray-600">
          {insight.interpretation}
        </Description>
      </InsightCard>

      {/* 자세히 보기 */}
      <Accordion>
        <AccordionTrigger onClick={() => setShowDetails(!showDetails)}>
          <span className="text-sm text-gray-600">
            자세히 보기 {showDetails ? '▲' : '▼'}
          </span>
        </AccordionTrigger>
        {showDetails && (
          <AccordionContent className="mt-3 space-y-2">
            <MetricRow
              label="말하기 시간 비율"
              value={`${(metrics.speechRatio * 100).toFixed(1)}%`}
              tooltip="전체 시간 중 음성이 감지된 비율"
            />
            <MetricRow
              label="평균 생각하는 시간"
              value={`${metrics.avgPauseDuration.toFixed(1)}초`}
              tooltip="침묵 구간의 평균 길이"
            />
            <MetricRow
              label="대화 횟수"
              value={`${metrics.burstCount}회`}
              tooltip="음성이 시작된 횟수"
            />
          </AccordionContent>
        )}
      </Accordion>
    </Card>
  );
}
```

---

#### 6. 보조 버튼 터치 타겟 확대
**파일**: `src/components/primitives/Button.tsx`
**라인**: 45-78

**구현 계획**:
```typescript
// Button size variants 수정
const sizeVariants = {
  sm: "px-3 py-2.5 min-h-[44px] text-sm",     // 36px → 44px
  md: "px-6 py-3 min-h-[44px] text-base",     // 유지
  lg: "px-8 py-4 min-h-[48px] text-lg",       // 유지
};

// 아이콘 전용 버튼 variant 추가
const iconButtonVariants = {
  sm: "p-2.5 min-h-[44px] min-w-[44px]",      // 44x44
  md: "p-3 min-h-[48px] min-w-[48px]",        // 48x48
  lg: "p-4 min-h-[52px] min-w-[52px]",        // 52x52
};
```

**영향 받는 컴포넌트**:
- `App.tsx`: 헤더 버튼 (설정, 도움말)
- `SessionControls.tsx`: 모바일 컨트롤
- `SettingsPanel.tsx`: 닫기 버튼

---

### P2: 중기 개선 (Nice-to-have - 1-2개월 이내)

#### 7. 설정 패널 탭 구조화
#### 8. 대시보드 CTA 단순화
#### 9. 긍정적 마이크로 인터랙션 추가
#### 10. AI 오버레이 온보딩 설명

*세부 구현 계획은 P0/P1 완료 후 작성 예정*

---

## 🔍 구현 프로세스

### 1. 개발 전 체크
```markdown
- [ ] 관련 UX 법칙 섹션 읽기
- [ ] 체크리스트 확인
- [ ] 기존 컴포넌트 패턴 참고
- [ ] 접근성 요구사항 확인 (WCAG AA/AAA)
```

### 2. 개발 중
```markdown
- [ ] 코드 작성 중 체크리스트 참조
- [ ] 브라우저 개발자 도구로 크기 확인 (Fitts)
- [ ] 선택지 수 계산 (Hick)
- [ ] 동시 표시 정보 수 계산 (Miller)
```

### 3. 코드 리뷰
```markdown
- [ ] UX 체크리스트 기반 검토
- [ ] 접근성 검증 (키보드, 스크린 리더)
- [ ] 모바일 뷰포트 테스트
- [ ] 다크 모드 확인
```

### 4. 배포 전 검증
```markdown
- [ ] 실제 디바이스 테스트 (iOS, Android)
- [ ] 브라우저 호환성 (Chrome, Safari, Firefox)
- [ ] 성능 측정 (Lighthouse, WebPageTest)
- [ ] 사용자 테스트 (가능한 경우)
```

---

## 📚 참고 자료

### UX 법칙 학습
- [Laws of UX](https://lawsofux.com/) - 인터랙티브 가이드
- [Nielsen Norman Group](https://www.nngroup.com/) - UX 연구 및 가이드라인
- [Material Design](https://m3.material.io/) - Google의 디자인 시스템

### 접근성
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) - 웹 접근성 표준
- [WebAIM](https://webaim.org/) - 접근성 리소스 및 도구

### React/TypeScript
- [React Accessibility](https://react.dev/learn/accessibility) - React 접근성 가이드
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - 타입 안전성

---

## 📞 문의 및 피드백

**가이드라인 관련 질문**:
- Frontend 팀에 문의
- GitHub Discussions: [BeMoreFrontend](https://github.com/KUS-CapstoneDesign-II/BeMoreFrontend/discussions)

**UX 개선 제안**:
- GitHub Issues: [UX Enhancement](https://github.com/KUS-CapstoneDesign-II/BeMoreFrontend/issues/new?labels=UX)

---

**마지막 업데이트**: 2025년 11월 11일
**다음 리뷰 예정**: 2025년 12월 11일 (P0 완료 후)
