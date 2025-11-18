# 백엔드 팀 전달사항: STT 시스템 개선 완료

> **날짜**: 2025-11-18
> **발신**: 프론트엔드 팀
> **수신**: 백엔드 팀
> **우선순위**: 중간 (참고용)

---

## 📢 요약

프론트엔드에서 **음성 인식(STT) 시스템 안정성 개선**을 완료했습니다.
백엔드 서비스는 현재 그대로 작동하지만, 몇 가지 **권장 개선사항**을 공유드립니다.

---

## ✅ 프론트엔드 완료 사항 (4가지)

### 1. STT 타임아웃 (5초)
- **변경**: 백엔드 STT 응답이 5초 이상 지연되면 자동으로 브라우저 폴백으로 전환
- **영향**: 백엔드 STT 서비스 장애 시에도 사용자는 음성 인식 계속 사용 가능
- **권장**: STT 응답 시간을 **3-4초 이내**로 유지하면 폴백 활성화 방지

### 2. Web Speech API 폴백
- **변경**: WebSocket STT 실패 시 브라우저 내장 음성 인식(Chrome/Safari) 자동 활성화
- **영향**:
  - 단일 장애점(Single Point of Failure) 제거
  - 백엔드 STT 요청 감소 가능성 (일부 사용자가 폴백 사용)
- **권장**: 모니터링 지표에 "폴백 활성화 비율" 추가

### 3. AudioContext 생명주기 관리
- **변경**: 탭 백그라운드 전환 시 오디오 분석 일시정지, 복귀 시 자동 재개
- **영향**:
  - WebSocket 연결은 유지되나 **음성 데이터 전송이 일시 중단**될 수 있음
  - 탭 복귀 시 자동 재개
- **권장**: "일정 시간 음성 데이터 없음" 상태를 정상으로 간주 (연결 타임아웃 30분 이상 권장)

### 4. AI 요청 디바운싱 (500ms)
- **변경**: 연속된 STT 결과에서 마지막 결과만 AI에 전달 (500ms 대기)
- **영향**: AI API 호출 빈도 **최대 50% 감소** 예상
- **효과**: 백엔드 부하 감소, 중복 응답 방지

---

## 🔧 백엔드 권장 개선사항 (선택 사항)

### 우선순위 1: STT 응답 시간 최적화
**현재 문제**: 프론트엔드가 5초 타임아웃 설정
**권장 목표**:
- P50: 1초 이내
- P95: 3초 이내
- P99: 5초 이내 (타임아웃 임계값)

**이유**: 5초 초과 시 사용자는 브라우저 폴백으로 전환되어 백엔드 STT 서비스를 사용하지 못함

### 우선순위 2: 에러 응답 표준화
**현재 문제**: 프론트엔드가 타임아웃 외 에러를 명확히 구분 못함

**권장 응답 포맷**:
```json
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

**에러 코드 예시**:
- `STT_SERVICE_UNAVAILABLE`: STT 서비스 일시 불가
- `STT_TIMEOUT`: 처리 시간 초과
- `STT_INVALID_AUDIO`: 오디오 데이터 문제
- `STT_LANGUAGE_UNSUPPORTED`: 언어 미지원
- `STT_RATE_LIMITED`: 요청 제한 초과

**이유**: 에러 타입별 프론트엔드가 적절한 대응 가능 (즉시 폴백 vs. 재시도)

### 우선순위 3: 헬스체크 메시지
**권장**: WebSocket ping/pong에 STT 서비스 상태 포함

```json
{
  "type": "pong",
  "timestamp": 1700000000000,
  "server_time": 1700000000050,
  "stt_service_status": "healthy"  // healthy, degraded, unavailable
}
```

**이유**: 프론트엔드가 STT 서비스 장애를 사전에 파악하고 즉시 폴백 활성화 가능

### 우선순위 4: 모니터링 메트릭
**권장 추적 항목**:
- `stt_processing_time_p50`, `p95`, `p99`
- `stt_success_rate`, `stt_timeout_rate`, `stt_error_rate`
- `stt_confidence_avg`, `stt_empty_result_rate`
- `concurrent_stt_requests`, `stt_queue_depth`

**이유**: 성능 저하 조기 감지 및 SLA 관리

---

## 📄 상세 문서

전체 기술 사양, 테스팅 시나리오, 코드 예시는 다음 문서를 참고하세요:

📎 **[BACKEND_STT_IMPROVEMENTS.md](./BACKEND_STT_IMPROVEMENTS.md)**

**문서 위치**: `docs/integration/backend/BACKEND_STT_IMPROVEMENTS.md`

**문서 내용**:
- 프론트엔드 개선사항 상세 설명 (코드 예시 포함)
- 백엔드 권장 개선사항 (Python 코드 예시)
- 테스팅 시나리오 (4가지 시나리오 + 예상 결과)
- 기대 효과 및 참고 자료

---

## 🎯 액션 아이템

### 백엔드 팀 (선택 사항)
- [ ] 문서 검토: [BACKEND_STT_IMPROVEMENTS.md](./BACKEND_STT_IMPROVEMENTS.md)
- [ ] 현재 STT 응답 시간 측정 (P50, P95, P99)
- [ ] 타임아웃 발생 빈도 모니터링
- [ ] 에러 응답 표준화 검토
- [ ] 헬스체크 메시지 추가 검토

### 프론트엔드 팀 (완료)
- [x] STT 타임아웃 메커니즘 (5초)
- [x] Web Speech API 폴백
- [x] AudioContext 생명주기 관리
- [x] AI 요청 디바운싱 (500ms)
- [x] 백엔드 전달 문서 작성

---

## 💬 질문 및 논의

**Q1. 현재 STT 응답 시간은 어느 정도인가요?**
→ P95 응답 시간이 3초 이상이면 타임아웃 발생 가능성이 높습니다.

**Q2. 에러 응답 표준화는 언제 가능한가요?**
→ 우선순위가 높지 않으므로, 여유 있을 때 검토 부탁드립니다.

**Q3. 폴백 활성화 비율을 어떻게 측정하나요?**
→ 프론트엔드에서 로그로 추적 중입니다. 필요 시 백엔드 로그와 대조 가능합니다.

**Q4. 현재 서비스에 문제가 있나요?**
→ **아니요**. 이번 개선은 **안정성 강화**가 목적이며, 백엔드 변경은 선택사항입니다.

---

## 📞 연락처

프론트엔드 STT 개선사항 관련 문의:
- **담당자**: 프론트엔드 팀
- **문서**: [BACKEND_STT_IMPROVEMENTS.md](./BACKEND_STT_IMPROVEMENTS.md)
- **커밋**: `b87dfb1` - docs: add STT guide & cleanup root MD files

---

**감사합니다!** 🙏

프론트엔드 팀 드림
