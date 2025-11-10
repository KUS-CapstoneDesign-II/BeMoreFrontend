# Phase 0-1 Backend Implementation Guide

**대상**: Backend 개발자
**기간**: 2주 (Phase 0: 1주, Phase 1: 1주)
**목표**: BeMore 플랫폼 인증 시스템 구축 (Users, JWT, Auth API)
**작성일**: 2025-11-09
**우선순위**: P0 (최우선 - 플랫폼 전환 필수 요소)

---

## 📋 목차

1. [개요 및 목표](#개요-및-목표)
2. [현재 상태 분석](#현재-상태-분석)
3. [Phase 0: 준비 작업 (1주)](#phase-0-준비-작업-1주)
4. [Phase 1: 인증 시스템 구현 (1주)](#phase-1-인증-시스템-구현-1주)
5. [API 엔드포인트 스펙](#api-엔드포인트-스펙)
6. [데이터베이스 스키마](#데이터베이스-스키마)
7. [보안 요구사항](#보안-요구사항)
8. [테스트 시나리오](#테스트-시나리오)
9. [Frontend 협업 포인트](#frontend-협업-포인트)
10. [성공 기준](#성공-기준)

---

## 개요 및 목표

### 🎯 핵심 목표

**도구/데모 → 서비스 플랫폼 전환**의 첫 단계로 사용자 계정 시스템을 구축합니다.

**Before (v0)**:
```
익명 세션 → localStorage에 토큰 저장 → 사용자 추적 불가
```

**After (v1)**:
```
회원가입 → 로그인 → JWT 발급 → 사용자별 세션 관리 → 히스토리/리포트 제공
```

### 📊 비즈니스 임팩트

- **사용자 유지율 향상**: 개인화된 데이터 제공 (주간 리포트, 목표 추적)
- **재방문 동기 부여**: 이전 세션 히스토리, 진행 상황 확인
- **데이터 일관성**: 사용자별 세션 연결, 크로스 디바이스 지원
- **향후 확장 기반**: B2B, 구독, 알림 등 모든 기능의 전제 조건

### 🔗 관련 문서

- **전체 재설계 계획**: `PLATFORM_IA_REDESIGN_v1.0.md` (Section 6, 10)
- **Frontend 현황**: `SUMMARY.md`
- **Backend 통합 문서**: `docs/integration/FRONTEND_BACKEND_API_COMPATIBILITY_DETAILED.md`

---

## 현재 상태 분석

### ✅ 기존 구현 (Phase 9 완료)

**현재 Backend API** (확인 필요):
```
POST /api/session/{sessionId}/batch-tick  ✅ 구현 완료
GET  /api/session/{sessionId}              ✅ 구현 완료
POST /api/session/{sessionId}/end          ✅ 구현 완료
```

**WebSocket 채널** (확인 필요):
```
/ws/sessions/:sessionId/emotion  ✅
/ws/sessions/:sessionId/vad      ✅
/ws/sessions/:sessionId/ai_chat  ✅
```

**현재 DB 스키마** (확실하지 않음):
```
Sessions 테이블 존재 여부? → 확인 필요
Sessions.userId FK 존재 여부? → 확인 필요
```

### ❌ 미구현 (Phase 0-1 작업 대상)

**인증 시스템**:
```
- Users 테이블 없음
- 회원가입/로그인 API 없음
- JWT 토큰 시스템 없음
- 비밀번호 암호화 없음
```

**Frontend 요구사항** (Frontend가 기대하는 API):
```typescript
// Frontend AuthContext가 호출하는 엔드포인트 (현재 TODO 상태)
// 소스: BeMoreFrontend/src/contexts/AuthContext.tsx

POST /api/auth/login          // Line 69
POST /api/auth/signup         // Line 92
POST /api/auth/logout         // Line 115
POST /api/auth/refresh        // Line 169
PUT  /api/auth/profile        // Line 139
GET  /api/auth/me             // Line 199 (주석)
```

---

## Phase 0: 준비 작업 (1주)

### 목표
현재 코드 안정화, 마이그레이션 도구 준비, Frontend와 협업 설정

### 작업 체크리스트

#### 1️⃣ 현재 DB 스키마 확인 및 문서화

```sql
-- 확인 항목
[ ] Sessions 테이블 구조 확인 (컬럼 리스트)
[ ] Sessions 테이블에 userId 컬럼 존재 여부
[ ] 기존 세션 데이터 개수 확인
[ ] 타임스탬프 컬럼 타입 확인 (timestamp vs bigint)
```

**Output**: `DB_SCHEMA_CURRENT.md` 문서 작성
```markdown
# 현재 DB 스키마 (Phase 9)

## Sessions 테이블
| 컬럼명 | 타입 | NULL 허용 | 기본값 | 설명 |
|--------|------|-----------|--------|------|
| session_id | UUID | NO | gen_random_uuid() | PK |
| ... | ... | ... | ... | ... |

## 기존 데이터
- 총 세션 수: XXX개
- 가장 오래된 세션: YYYY-MM-DD
- 익명 세션 처리 계획: ...
```

#### 2️⃣ API 버전 관리 전략 수립

```
[ ] /api/v0/* (기존 API) 라우팅 확인
[ ] /api/v1/* (신규 API) 라우팅 계획 수립
[ ] API 버전 관리 미들웨어 설계
[ ] 6개월 지원 정책 문서화
```

**예시 구조**:
```
/api/v0/session/{sessionId}/batch-tick  → 기존 코드 (6개월 유지)
/api/v1/sessions/{sessionId}/batch-tick → 신규 코드 (RESTful naming)
/api/v1/auth/*                          → 신규 인증 API
```

#### 3️⃣ 데이터베이스 마이그레이션 스크립트 준비

```sql
-- migrations/001_create_users_table.sql
[ ] Users 테이블 생성 스크립트
[ ] 인덱스 생성 (email UNIQUE)
[ ] 제약조건 설정

-- migrations/002_add_user_id_to_sessions.sql
[ ] Sessions.user_id 컬럼 추가 (NULL 허용)
[ ] FK 제약조건 추가
[ ] 인덱스 생성

-- migrations/003_create_audit_logs.sql (선택)
[ ] 감사 로그 테이블 (보안 요구사항)
```

**롤백 스크립트**:
```sql
-- rollback/001_drop_users_table.sql
[ ] 각 마이그레이션의 롤백 스크립트 준비
```

#### 4️⃣ 환경 변수 설정

```bash
# .env.example 추가
[ ] JWT_SECRET_KEY=your-secret-key-here (최소 32자)
[ ] JWT_ACCESS_TOKEN_EXPIRY=15m
[ ] JWT_REFRESH_TOKEN_EXPIRY=7d
[ ] BCRYPT_ROUNDS=10
[ ] CORS_ALLOWED_ORIGINS=http://localhost:5173
[ ] DATABASE_URL=postgresql://...
```

**보안 체크**:
```
[ ] .env 파일이 .gitignore에 포함되어 있는지 확인
[ ] 프로덕션 환경 시크릿 관리 방안 수립 (AWS Secrets Manager, etc.)
```

#### 5️⃣ 의존성 패키지 설치

```bash
# Python (FastAPI 기준, 확실하지 않음: 실제 프레임워크 확인 필요)
[ ] pip install PyJWT bcrypt python-jose[cryptography]
[ ] pip install passlib[bcrypt]
[ ] pip install python-multipart (파일 업로드용)

# Node.js (Express 기준)
[ ] npm install jsonwebtoken bcrypt
[ ] npm install express-rate-limit (Rate limiting)
```

#### 6️⃣ Frontend 협업 설정

```
[ ] Frontend 팀과 킥오프 미팅 (API 스펙 합의)
[ ] Swagger/OpenAPI 문서 자동 생성 설정
[ ] CORS 정책 확인 (개발: localhost:5173, 프로덕션: 도메인)
[ ] API 응답 포맷 합의 (Frontend AuthContext 기대 형식)
```

---

## Phase 1: 인증 시스템 구현 (1주)

### 목표
JWT 기반 인증 시스템 완전 구현 (회원가입, 로그인, 토큰 갱신)

### 작업 체크리스트

#### 1️⃣ Users 테이블 생성 및 마이그레이션 실행

```bash
[ ] 마이그레이션 스크립트 실행
[ ] 테이블 생성 확인 (psql or pgAdmin)
[ ] 샘플 사용자 데이터 삽입 테스트
```

#### 2️⃣ 비밀번호 암호화 유틸리티 구현

```python
# utils/password.py (예시)
[ ] hash_password(plain_password: str) -> str
[ ] verify_password(plain_password: str, hashed_password: str) -> bool
[ ] 테스트 케이스 작성 (10개 이상)
```

**보안 요구사항**:
```
- bcrypt 사용 (rounds=10)
- 평문 비밀번호 로깅 금지
- 타이밍 공격 방지 (constant-time comparison)
```

#### 3️⃣ JWT 토큰 유틸리티 구현

```python
# utils/jwt.py (예시)
[ ] create_access_token(user_id: str, email: str) -> str
[ ] create_refresh_token(user_id: str) -> str
[ ] verify_access_token(token: str) -> dict
[ ] verify_refresh_token(token: str) -> dict
[ ] 테스트 케이스 작성 (만료, 서명 검증 등)
```

**JWT Payload**:
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "exp": 1234567890,  // 15분 후
  "iat": 1234567890,
  "type": "access"
}
```

#### 4️⃣ 회원가입 API 구현

**Endpoint**: `POST /api/v1/auth/signup`

```python
[ ] Request 검증 (email, password, name)
[ ] 이메일 중복 확인
[ ] 비밀번호 강도 검증 (최소 8자, 숫자+문자)
[ ] Users 테이블에 삽입
[ ] 성공 응답 (201 Created)
[ ] 에러 핸들링 (400, 409, 500)
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "홍길동"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "createdAt": "2025-11-09T10:30:00.000Z"
  }
}
```

#### 5️⃣ 로그인 API 구현

**Endpoint**: `POST /api/v1/auth/login`

```python
[ ] Request 검증 (email, password)
[ ] 사용자 존재 여부 확인
[ ] 비밀번호 검증
[ ] JWT 토큰 발급 (access + refresh)
[ ] last_login_at 업데이트
[ ] 성공 응답 (200 OK)
[ ] 에러 핸들링 (400, 401, 500)
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "로그인 성공",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "profileImage": null,
    "createdAt": "2025-11-09T10:30:00.000Z"
  }
}
```

#### 6️⃣ 토큰 갱신 API 구현

**Endpoint**: `POST /api/v1/auth/refresh`

```python
[ ] Request 검증 (refreshToken)
[ ] Refresh Token 검증 및 디코딩
[ ] 사용자 존재 여부 확인
[ ] 새로운 Access Token 발급
[ ] 새로운 Refresh Token 발급 (선택)
[ ] 성공 응답 (200 OK)
[ ] 에러 핸들링 (401, 500)
```

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200)**:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 7️⃣ 로그아웃 API 구현

**Endpoint**: `POST /api/v1/auth/logout`

```python
[ ] Authorization 헤더에서 토큰 추출
[ ] 토큰 검증
[ ] (선택) Refresh Token 블랙리스트 추가
[ ] 성공 응답 (200 OK)
```

**Response (200)**:
```json
{
  "success": true,
  "message": "로그아웃 되었습니다"
}
```

#### 8️⃣ 현재 사용자 정보 조회 API 구현

**Endpoint**: `GET /api/v1/auth/me`

```python
[ ] Authorization 헤더에서 토큰 추출
[ ] 토큰 검증 및 디코딩
[ ] 사용자 정보 조회 (비밀번호 제외)
[ ] 성공 응답 (200 OK)
[ ] 에러 핸들링 (401, 404, 500)
```

**Response (200)**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "홍길동",
    "profileImage": null,
    "createdAt": "2025-11-09T10:30:00.000Z",
    "lastLoginAt": "2025-11-09T12:00:00.000Z"
  }
}
```

#### 9️⃣ 프로필 업데이트 API 구현

**Endpoint**: `PUT /api/v1/auth/profile`

```python
[ ] Authorization 헤더에서 토큰 추출
[ ] 토큰 검증 및 디코딩
[ ] Request 검증 (name, profileImage)
[ ] Users 테이블 업데이트
[ ] 성공 응답 (200 OK)
[ ] 에러 핸들링 (400, 401, 500)
```

**Request Body**:
```json
{
  "name": "새 이름",
  "profileImage": "https://example.com/avatar.jpg"
}
```

#### 🔟 JWT 인증 미들웨어 구현

```python
# middleware/auth.py (예시)
[ ] require_auth() - 모든 보호된 엔드포인트에 적용
[ ] 토큰 추출 (Authorization: Bearer {token})
[ ] 토큰 검증
[ ] request.user에 사용자 정보 주입
[ ] 401 Unauthorized 반환 (실패 시)
```

**적용 대상**:
```
POST /api/v1/sessions         ← 세션 시작 시 인증 필요
POST /api/v1/sessions/{id}/end
GET  /api/v1/users/me/dashboard
... (모든 /api/v1/* 엔드포인트)
```

#### 1️⃣1️⃣ Rate Limiting 구현

```python
[ ] IP 기반 Rate Limiting (회원가입: 5회/시간)
[ ] IP 기반 Rate Limiting (로그인: 10회/시간)
[ ] 429 Too Many Requests 응답
```

#### 1️⃣2️⃣ Sessions 테이블에 user_id 연결

```python
# 기존 세션 API 수정
[ ] POST /api/v1/sessions 생성 시 user_id 추가
[ ] GET /api/v1/sessions/{sessionId} 조회 시 소유권 확인
[ ] 타인의 세션 접근 차단 (403 Forbidden)
```

**마이그레이션 전략**:
```
1. Sessions.user_id 컬럼 추가 (NULL 허용)
2. 신규 세션은 user_id 필수
3. 기존 익명 세션은 user_id=NULL 유지 (6개월 후 삭제)
```

---

## API 엔드포인트 스펙

### 전체 엔드포인트 목록

| Method | Endpoint | 인증 | 설명 | 우선순위 |
|--------|----------|------|------|----------|
| POST | `/api/v1/auth/signup` | ❌ | 회원가입 | P0 |
| POST | `/api/v1/auth/login` | ❌ | 로그인 | P0 |
| POST | `/api/v1/auth/refresh` | ❌ | 토큰 갱신 | P0 |
| POST | `/api/v1/auth/logout` | ✅ | 로그아웃 | P0 |
| GET | `/api/v1/auth/me` | ✅ | 현재 사용자 | P0 |
| PUT | `/api/v1/auth/profile` | ✅ | 프로필 수정 | P1 |
| POST | `/api/v1/auth/reset-password` | ❌ | 비밀번호 재설정 | P2 |

### 공통 응답 포맷

**성공 응답**:
```json
{
  "success": true,
  "message": "작업 설명",
  "data": { ... }  // 또는 특정 키 (user, accessToken 등)
}
```

**에러 응답**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호가 올바르지 않습니다",
    "details": null  // 개발 환경에서만 스택 트레이스
  }
}
```

### 에러 코드 정의

| HTTP | Code | Message | 설명 |
|------|------|---------|------|
| 400 | `INVALID_REQUEST` | 요청 데이터가 유효하지 않습니다 | 필수 필드 누락 |
| 401 | `INVALID_CREDENTIALS` | 이메일 또는 비밀번호가 올바르지 않습니다 | 로그인 실패 |
| 401 | `TOKEN_EXPIRED` | 토큰이 만료되었습니다 | Access Token 만료 |
| 401 | `INVALID_TOKEN` | 토큰이 유효하지 않습니다 | 서명 검증 실패 |
| 403 | `FORBIDDEN` | 권한이 없습니다 | 타인의 리소스 접근 |
| 409 | `EMAIL_ALREADY_EXISTS` | 이미 사용 중인 이메일입니다 | 회원가입 중복 |
| 429 | `RATE_LIMIT_EXCEEDED` | 요청 제한을 초과했습니다 | Rate limiting |
| 500 | `INTERNAL_SERVER_ERROR` | 서버 오류가 발생했습니다 | 예상치 못한 에러 |

---

## 데이터베이스 스키마

### Users 테이블

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    profile_image VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 트리거 (updated_at 자동 갱신)
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Sessions 테이블 수정

```sql
-- user_id 컬럼 추가
ALTER TABLE sessions
ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 인덱스
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_user_id_created_at ON sessions(user_id, created_at DESC);

-- 기존 익명 세션은 user_id=NULL 유지
```

### (선택) Audit Logs 테이블

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,  -- 'login', 'logout', 'signup', 'update_profile'
    resource VARCHAR(100),         -- 'auth', 'session', 'profile'
    ip_address VARCHAR(45),        -- IPv4/IPv6
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 보안 요구사항

### 1️⃣ 비밀번호 보안

```
✅ bcrypt 사용 (rounds=10)
✅ 최소 8자, 숫자+문자 조합 강제
✅ 평문 비밀번호 로깅 절대 금지
✅ 비밀번호 해시만 DB 저장
✅ 타이밍 공격 방지 (constant-time comparison)
```

### 2️⃣ JWT 토큰 보안

```
✅ JWT_SECRET_KEY 최소 32자 (환경변수)
✅ Access Token 15분 유효
✅ Refresh Token 7일 유효
✅ HTTPS Only (프로덕션)
✅ 토큰 서명 검증 (HS256 알고리즘)
```

### 3️⃣ API 보안

```
✅ CORS 정책 (화이트리스트)
✅ Rate Limiting (회원가입 5회/시간, 로그인 10회/시간)
✅ SQL Injection 방지 (Parameterized Query)
✅ XSS 방지 (입력 검증, 이스케이핑)
✅ CSRF 토큰 (POST/PUT/DELETE 요청)
```

### 4️⃣ 데이터 보호

```
✅ 비밀번호 필드 절대 반환 금지
✅ 에러 메시지에 민감 정보 포함 금지
✅ 개발 환경에서만 상세 에러 반환
✅ HTTPS 강제 (프로덕션)
```

### 5️⃣ 로깅 정책

```
✅ 로그인 성공/실패 기록
✅ 비밀번호 변경 기록
✅ IP 주소, User-Agent 기록
❌ 비밀번호, 토큰 평문 로깅 절대 금지
```

---

## 테스트 시나리오

### 단위 테스트 (Unit Tests)

#### 비밀번호 암호화
```python
[ ] hash_password() 함수 테스트
[ ] verify_password() 함수 테스트 (성공/실패)
[ ] 동일 비밀번호, 다른 해시 생성 확인
```

#### JWT 토큰
```python
[ ] create_access_token() 테스트
[ ] create_refresh_token() 테스트
[ ] verify_access_token() 테스트 (유효/만료/잘못된 서명)
[ ] 토큰 Payload 검증
```

### 통합 테스트 (Integration Tests)

#### 회원가입
```
[ ] 정상 회원가입 (201 Created)
[ ] 중복 이메일 (409 Conflict)
[ ] 잘못된 이메일 형식 (400 Bad Request)
[ ] 약한 비밀번호 (400 Bad Request)
[ ] 필수 필드 누락 (400 Bad Request)
```

#### 로그인
```
[ ] 정상 로그인 (200 OK, accessToken + refreshToken 반환)
[ ] 잘못된 이메일 (401 Unauthorized)
[ ] 잘못된 비밀번호 (401 Unauthorized)
[ ] Rate Limiting (10회 초과 시 429)
```

#### 토큰 갱신
```
[ ] 유효한 Refresh Token (200 OK, 새 토큰 발급)
[ ] 만료된 Refresh Token (401 Unauthorized)
[ ] 잘못된 Refresh Token (401 Unauthorized)
```

#### 보호된 엔드포인트
```
[ ] 유효한 Access Token (200 OK)
[ ] 토큰 없음 (401 Unauthorized)
[ ] 만료된 Access Token (401 Unauthorized)
[ ] 잘못된 서명 (401 Unauthorized)
```

### E2E 테스트

```
Scenario 1: 신규 사용자 플로우
1. 회원가입 → 201 Created
2. 로그인 → 200 OK, 토큰 발급
3. /api/v1/auth/me 호출 → 200 OK, 사용자 정보 반환
4. 세션 시작 (POST /api/v1/sessions) → 200 OK, user_id 연결
5. 로그아웃 → 200 OK

Scenario 2: 기존 사용자 플로우
1. 로그인 → 200 OK
2. Access Token 만료 (15분 후 시뮬레이션)
3. /api/v1/auth/me 호출 → 401 Unauthorized
4. Refresh Token으로 갱신 → 200 OK
5. 새 Access Token으로 /api/v1/auth/me 호출 → 200 OK
```

---

## Frontend 협업 포인트

### 1️⃣ API 응답 포맷 합의

**Frontend AuthContext 기대 형식** (BeMoreFrontend/src/contexts/AuthContext.tsx):

```typescript
// Line 79: login 응답
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    profileImage?: string;
    createdAt: string;
  };
}

// Line 152: updateProfile 응답
interface UpdateProfileResponse {
  user: {
    id: string;
    email: string;
    name: string;
    profileImage?: string;
    createdAt: string;
  };
}
```

**Backend 응답이 이 포맷과 정확히 일치해야 합니다.**

### 2️⃣ CORS 설정

```python
# 허용할 Origin
ALLOWED_ORIGINS = [
    "http://localhost:5173",      # 개발 환경 (Vite)
    "http://localhost:3000",      # 개발 환경 (React)
    "https://bemore.example.com"  # 프로덕션 (확실하지 않음: 실제 도메인)
]

# 허용할 메서드
ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]

# 허용할 헤더
ALLOWED_HEADERS = ["Content-Type", "Authorization", "X-Request-ID"]
```

### 3️⃣ 토큰 저장 위치

**Frontend가 사용하는 키** (BeMoreFrontend/src/contexts/AuthContext.tsx):
```typescript
localStorage.setItem('bemore_access_token', accessToken);   // Line 44
localStorage.setItem('bemore_refresh_token', refreshToken); // Line 45
localStorage.setItem('bemore_user', JSON.stringify(user));  // Line 62
```

**Backend는 이 키 이름을 알 필요 없음** (Frontend가 자체 관리)

### 4️⃣ API 요청 헤더

**Frontend가 전송하는 헤더** (BeMoreFrontend/src/services/api.ts):
```typescript
Authorization: Bearer {accessToken}  // Line 69
X-Request-ID: {uuid}                 // Line 56
X-Client-Version: {version}          // Line 57
X-Device-ID: {deviceId}              // Line 58
X-Timestamp: {timestamp}             // Line 59
```

**Backend는 `Authorization` 헤더에서 토큰을 추출합니다.**

### 5️⃣ 에러 처리

**Frontend가 기대하는 에러 형식**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호가 올바르지 않습니다"
  }
}
```

**Frontend는 `error.message`를 사용자에게 표시합니다.**

### 6️⃣ Swagger/OpenAPI 문서

```
[ ] Swagger UI 자동 생성 (/api/docs)
[ ] Frontend 팀에 문서 URL 공유
[ ] 모든 엔드포인트 예제 포함
```

---

## 성공 기준

### Phase 0 완료 기준

```
✅ DB 스키마 문서화 완료 (DB_SCHEMA_CURRENT.md)
✅ Users 테이블 마이그레이션 스크립트 준비
✅ Sessions.user_id 마이그레이션 스크립트 준비
✅ 환경변수 설정 완료 (.env.example)
✅ 의존성 패키지 설치 완료
✅ API 버전 관리 전략 수립
✅ Frontend 팀과 킥오프 미팅 완료
```

### Phase 1 완료 기준

```
✅ 모든 API 엔드포인트 구현 (7개)
   - POST /api/v1/auth/signup
   - POST /api/v1/auth/login
   - POST /api/v1/auth/refresh
   - POST /api/v1/auth/logout
   - GET  /api/v1/auth/me
   - PUT  /api/v1/auth/profile

✅ JWT 인증 미들웨어 구현 및 적용
✅ Rate Limiting 구현 (회원가입, 로그인)
✅ Sessions 테이블에 user_id 연결 완료

✅ 단위 테스트 통과 (커버리지 ≥80%)
✅ 통합 테스트 통과 (모든 시나리오)
✅ E2E 테스트 통과 (2개 시나리오)

✅ Swagger 문서 자동 생성 (/api/docs)
✅ CORS 설정 완료
✅ Frontend 팀과 통합 테스트 완료

✅ 프로덕션 배포 준비 (환경변수, HTTPS)
```

### 검증 방법

#### 1. API 테스트 (Postman/cURL)

```bash
# 회원가입
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!","name":"테스트"}'

# 로그인
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'

# 현재 사용자 (토큰 필요)
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer {accessToken}"
```

#### 2. Frontend 통합 테스트

```
[ ] Frontend 로그인 페이지에서 실제 로그인 성공
[ ] Access Token 만료 후 Refresh Token으로 자동 갱신
[ ] 로그아웃 후 보호된 페이지 접근 차단
[ ] 세션 시작 시 user_id 자동 연결
```

#### 3. 데이터베이스 검증

```sql
-- 사용자 생성 확인
SELECT id, email, name, created_at FROM users;

-- 세션과 사용자 연결 확인
SELECT s.session_id, s.user_id, u.email
FROM sessions s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.user_id IS NOT NULL;
```

---

## 참고 자료

### 내부 문서
- `PLATFORM_IA_REDESIGN_v1.0.md` - 전체 재설계 계획 (Section 6: Auth Model)
- `docs/integration/FRONTEND_BACKEND_API_COMPATIBILITY_DETAILED.md` - 기존 API 스펙

### 외부 문서
- [JWT.io](https://jwt.io/) - JWT 토큰 디버깅
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [bcrypt Best Practices](https://github.com/kelektiv/node.bcrypt.js#security-issues-and-concerns)

---

## 문의 및 지원

**Frontend 협업 담당**:
- Phase 0-1 Frontend 작업은 `PHASE_0-1_FRONTEND_PROMPT.md` 참조
- Frontend AuthContext: `BeMoreFrontend/src/contexts/AuthContext.tsx`

**질문/이슈**:
- 불확실한 사항은 팀 회의에서 논의
- DB 스키마 변경은 Frontend 팀과 사전 합의 필수

---

**작성 원칙**:
- ✅ 증거 기반 (Frontend 코드 파일 경로 인용)
- ✅ 불확실한 부분 명시 ("확실하지 않음: ...")
- ✅ 실행 가능한 체크리스트 중심
- ✅ Frontend 협업 포인트 명확화

**다음 단계**: Phase 0 시작 → 팀 킥오프 미팅 → DB 스키마 확인
