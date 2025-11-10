# Backend API Request: Analytics Alert Endpoint

**작성일**: 2025-01-10
**요청 팀**: Frontend Team
**우선순위**: Low (선택 사항)

---

## 📋 요약

프론트엔드의 성능 모니터링 시스템에서 성능 임계값 초과 시 알림을 보내기 위한 엔드포인트가 필요합니다.

---

## 🎯 목적

프로덕션 환경에서 성능 문제(느린 API 응답, 높은 메모리 사용량 등)가 발생할 때, 백엔드에 알림을 전송하여:
1. 성능 이슈를 실시간으로 모니터링
2. 성능 저하 패턴 분석
3. 사용자 경험 개선을 위한 데이터 수집

---

## 🔌 API 스펙

### Endpoint
```
POST /api/analytics/alert
```

### Request Headers
```http
Content-Type: application/json
Authorization: Bearer {access_token}  (Optional - 비로그인 사용자도 보낼 수 있어야 함)
```

### Request Body
```typescript
{
  message: string;      // 성능 경고 메시지 (예: "High memory usage: 512MB")
  timestamp: string;    // ISO 8601 형식 (예: "2025-01-10T12:34:56.789Z")
  url: string;          // 발생한 페이지 URL (예: "https://be-more-frontend.vercel.app/app/session")
}
```

### Request Body Example
```json
{
  "message": "Long API call: /api/session/start took 3000ms",
  "timestamp": "2025-01-10T12:34:56.789Z",
  "url": "https://be-more-frontend.vercel.app/app/session"
}
```

### Response
```typescript
{
  success: boolean;
  message?: string;     // Optional error message
}
```

### Response Examples

**Success (200 OK)**:
```json
{
  "success": true
}
```

**Error (500 Internal Server Error)**:
```json
{
  "success": false,
  "message": "Failed to store alert"
}
```

---

## 📊 프론트엔드 발생 시점

다음과 같은 상황에서 알림이 전송됩니다:

1. **API 호출 시간 초과**: 응답 시간 > 3초
2. **높은 메모리 사용량**: 메모리 사용량 > 500MB
3. **에러율 증가**: 에러율 > 5%
4. **성능 임계값 초과**: Core Web Vitals 임계값 초과

### 발생 빈도
- **프로덕션 환경**에서만 전송
- 동일한 메시지는 **5분에 1회**로 제한 (중복 방지)
- 평균 **하루 10-50건** 예상

---

## 🔧 백엔드 구현 가이드

### 최소 구현 (Phase 1)
```python
# FastAPI 예시
@router.post("/api/analytics/alert")
async def create_alert(alert: AlertRequest):
    """
    프론트엔드 성능 알림 수신
    """
    try:
        # 1. 데이터베이스에 저장 (선택 사항)
        # await db.analytics_alerts.insert_one({
        #     "message": alert.message,
        #     "timestamp": alert.timestamp,
        #     "url": alert.url,
        #     "created_at": datetime.now()
        # })

        # 2. 로그로 남기기 (최소 구현)
        logger.warning(f"[Performance Alert] {alert.message} at {alert.url}")

        return {"success": True}
    except Exception as e:
        logger.error(f"Failed to store alert: {e}")
        raise HTTPException(status_code=500, detail="Failed to store alert")
```

### 고급 구현 (Phase 2 - 선택 사항)
```python
@router.post("/api/analytics/alert")
async def create_alert(alert: AlertRequest, background_tasks: BackgroundTasks):
    """
    프론트엔드 성능 알림 수신 및 처리
    """
    try:
        # 1. 데이터베이스 저장
        alert_doc = await db.analytics_alerts.insert_one({
            "message": alert.message,
            "timestamp": alert.timestamp,
            "url": alert.url,
            "created_at": datetime.now(),
            "severity": calculate_severity(alert.message),
            "resolved": False
        })

        # 2. 백그라운드 작업: 심각도에 따라 Slack/Email 알림
        if is_critical(alert.message):
            background_tasks.add_task(send_slack_notification, alert)

        # 3. 로그 남기기
        logger.warning(f"[Performance Alert] {alert.message} at {alert.url}")

        return {"success": True}
    except Exception as e:
        logger.error(f"Failed to store alert: {e}")
        raise HTTPException(status_code=500, detail="Failed to store alert")
```

---

## 📁 데이터베이스 스키마 (선택 사항)

백엔드에서 알림을 저장하고 분석하고 싶다면:

```sql
-- PostgreSQL
CREATE TABLE analytics_alerts (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    url TEXT NOT NULL,
    severity VARCHAR(20),  -- 'low', 'medium', 'high', 'critical'
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_alerts_timestamp ON analytics_alerts(timestamp);
CREATE INDEX idx_analytics_alerts_resolved ON analytics_alerts(resolved);
```

```javascript
// MongoDB
{
  message: String,
  timestamp: Date,
  url: String,
  severity: String,  // 'low', 'medium', 'high', 'critical'
  resolved: Boolean,
  createdAt: Date
}
```

---

## 🔍 프론트엔드 코드 위치

알림을 전송하는 코드는 다음 위치에 있습니다:

**파일**: `src/utils/performanceReporting.ts`
**함수**: `sendAlert()` (line 234-248)

```typescript
private sendAlert(message: string): void {
  if (import.meta.env.PROD) {
    // TODO: Replace with actual analytics endpoint
    fetch('/api/analytics/alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        timestamp: new Date().toISOString(),
        url: window.location.href
      })
    }).catch(() => {
      // Fail silently
    });
  }
}
```

---

## 📝 현재 상황

- ✅ 프론트엔드 구현 완료
- ❌ 백엔드 엔드포인트 미구현 → 404 에러 발생
- ✅ 에러는 조용히 처리되어 기능적으로는 문제 없음
- ⚠️ 콘솔에 404 에러 로그가 표시됨

---

## ⏱️ 구현 우선순위

**우선순위**: 🟡 Low (선택 사항)

### 즉시 구현이 필요한 경우
- 프로덕션 성능 모니터링이 중요한 경우
- 사용자 경험 저하를 빠르게 감지하고 싶은 경우

### 나중에 구현해도 되는 경우
- 현재는 기능적으로 문제 없음
- 다른 핵심 기능 개발이 우선인 경우

---

## ✅ 완료 체크리스트

백엔드 구현 후 다음을 확인해주세요:

- [ ] POST `/api/analytics/alert` 엔드포인트 구현
- [ ] Request body validation (message, timestamp, url)
- [ ] 로그 또는 데이터베이스 저장
- [ ] CORS 설정 (프론트엔드 도메인 허용)
- [ ] (선택) Slack/Email 알림 연동
- [ ] (선택) 대시보드에서 알림 조회 기능

---

## 📞 문의

구현 중 질문이 있으면 프론트엔드 팀에 연락주세요!

**관련 이슈**: N/A
**참고 문서**:
- [Performance Monitoring System](src/utils/performanceReporting.ts)
- [Frontend Performance Guide](https://web.dev/vitals/)
