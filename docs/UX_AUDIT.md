# BeMore Frontend UX/UI Audit

## 1) Summary (≤ 5 bullets)
- Result 정보 구조는 명확하지만 세부 탭의 도구(필터/내보내기) 발견성이 제한됨.
- 로딩/빈/에러 상태 표현은 일부 화면에서 일관되지 않아 피드백 루프가 약함.
- VADTimeline 접근성(키보드/스크린리더)·컬러 대비·툴팁 설명 개선 여지 큼.
- CSV/PDF 내보내기 노출은 추가되었으나 안내문/용량·시간 경고와 재시도 UX 부족.
- 대시보드 카드의 빈 상태/오류 상태/스켈레톤 표준화 필요.

## 2) Findings Table

| Area | Issue | Severity | Impact | Evidence | Suggested fix |
|---|---|---|---|---|---|
| IA/Navigation | Result 탭 내 도구(필터/북마크/CSV)가 우측 끝에 묻힘 | Medium | 핵심 기능 발견성 저하 | `SessionResult` 상단 버튼군이 분산 배치 | 세부 탭 상단에 스티키 툴바(필터 그룹+Export 그룹)를 고정, 라벨링 강화 |
| States | 일부 화면 에러/빈 상태 복합 표현 부족 | Medium | 원인 파악, 재시도 유도 약함 | Dashboard/Preferences 로직 | 공통 상태 컴포넌트(Loading/Empty/Error) 도입, 재시도 버튼/디버그 토글 포함 |
| Visualization | VADTimeline 색 대비 및 접근성 정보 부족 | High | 특정 사용자군 가독성/이해도 저하 | `VADTimeline.tsx` 색상·role/aria 한정 | 색맹 팔레트 옵션, aria-label/role, 포커스 가능한 마커, 툴팁 SR 문구 추가 |
| Visualization | 시간축 단위 및 호버 툴팁 단위 설명 부족 | Medium | 수치 해석 혼동 | 툴팁 텍스트 단순 수치 | 툴팁에 단위/범위 예시 추가, 축 범위 레이블 노출 |
| Export | CSV/PDF 다운로드 안내/실패 재시도 부재 | Medium | 파일 실패 시 이탈 | Result ‘pdf’/‘details’ 탭 | 다운로드 전 안내문/용량 경고, 실패 시 토스트+재시도 버튼 |
| Interaction | 키보드 탐색 루트 제한, 단축키 도움말 노출 약함 | Medium | 생산성/접근성 저하 | 탭/버튼 포커스는 가능하나 도움말 부재 | 단축키 도움말 모달, 포커스 트랩, 포커스 이동 순서 검토 |
| Performance | Result 그래프 초기 렌더 비용 최적화 여지 | Medium | 저사양·모바일 렌더 지연 | 라인 생성/스케일 계산 매 프레임 | 메모이제이션 점검, 지연 로딩, 샘플링/가상화 옵션 |
| Consistency | 버튼 스타일/여백·타이포 일관성 미세 차이 | Low | 전체 인상·학습 비용 ↑ | 여러 카드/버튼 | 버튼/간격 토큰 정의, 공통 컴포넌트화 |
| Observability | 사용자 에러 피드백에 requestId 노출 미흡 | Low | CS/디버깅 효율 저하 | 에러 토스트/배너 | 에러에 requestId 표시(백엔드 헤더/바디 포함) |
| Privacy | 다운로드 전 민감 데이터 경고 없음 | Low | 보안 인식 부족 | PDF/CSV 다운로드 | 경고 문구 및 비공유 권고 표시 |

## 3) Recommendations (Prioritized)

1. High: VADTimeline 접근성/색상 개선 (Effort M)
   - aria-label/role, 포커스 가능한 마커, 툴팁 SR 문구
   - 색맹 팔레트 토글(예: 다색 → CVD-safe 팔레트)
2. Medium: Result ‘세부’ 탭 상단 스티키 툴바 (Effort M)
   - 왼쪽: 마커 필터(스파이크/저각성/북마크) 그룹, 오른쪽: Export(VAD/Emotion CSV, PDF)
3. Medium: 상태 컴포넌트 표준화 (Effort S)
   - LoadingSkeleton, EmptyState, ErrorState(+재시도, requestId 표시) 공통화
4. Medium: 다운로드 UX 강화 (Effort S)
   - 안내문(용량/시간), 실패 토스트+재시도, 진행 인디케이터
5. Medium: 단축키 도움말 모달 (Effort S)
   - “?” 또는 “/”로 열림, 세션 단축키/북마크/필터 토글 안내
6. Medium: Dashboard 빈/에러/로딩 통일 (Effort S)
   - KPI/Recent Sessions 카드에 동일한 상태 UI 적용
7. Medium: 성능 최적화 (Effort M)
   - VADTimeline 샘플링 옵션, ResizeObserver 디바운스, 코드 분할
8. Low: 디자인 토큰/컴포넌트 정리 (Effort M)
   - 버튼/타이포/스페이싱 토큰화, 일관성 강화

Quick wins (<1 day)
- 공통 ErrorState에 requestId 표기 추가
- CSV/PDF 다운로드 실패 시 재시도 버튼+토스트
- VADTimeline 툴팁에 단위/설명 텍스트 추가

High-impact (1–3 days)
- 세부 탭 스티키 툴바 + 접근성 강화 일괄 적용
- 상태 컴포넌트 표준화 및 대시보드 반영
- VADTimeline CVD-safe 팔레트/키보드 탐색

## 4) Mock/Wireframe (Result ‘세부’ 탭)

```
┌───────────────────────────────────────────────────────────────┐
│ [□ 급변] [□ 저각성] [□ 북마크]          [VAD CSV] [Emotion CSV] [PDF] │ ← Sticky Toolbar
├───────────────────────────────────────────────────────────────┤
│                                                               │
│                       VAD Timeline (키보드 선택 가능, 툴팁)      │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│ 선택한 시점: t=123s  V=0.42  A=-0.18  D=0.05                  │
└───────────────────────────────────────────────────────────────┘
```

개선 포인트:
- 툴바 좌: 필터 그룹(체크박스 레이블 명확화) / 우: Export 그룹(세 가지 버튼)
- 상단 고정으로 스크롤 시에도 제어 가용성 유지

## 5) Next Steps Checklist (DoD 포함)

- [ ] 세부 탭 스티키 툴바 구현(필터/Export 정렬, 접근성 라벨)
- [ ] VADTimeline 접근성/팔레트/툴팁 개선
- [ ] 공통 상태 컴포넌트(Loading/Empty/Error) 도입, 모든 주요 화면 적용
- [ ] CSV/PDF 다운로드 UX: 안내/인디케이터/재시도/에러 토스트
- [ ] 단축키 도움말 모달 + 포커스 관리
- [ ] Dashboard 카드 상태 표준화
- DoD: Lighthouse A11y ≥ 90, 에러 상태 커버리지 100%, Result 탭 INP < 200ms
