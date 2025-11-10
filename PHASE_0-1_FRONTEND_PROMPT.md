# Phase 0-1 Frontend Implementation Guide

**대상**: Frontend 개발자
**기간**: 2주 (Phase 0: 1주, Phase 1: 1주)
**목표**: BeMore 플랫폼 인증 UI 구축 (로그인, 회원가입, Route Guards)
**작성일**: 2025-11-09
**우선순위**: P0 (최우선 - 플랫폼 전환 필수 요소)

---

## 📋 목차

1. [개요 및 목표](#개요-및-목표)
2. [현재 상태 분석](#현재-상태-분석)
3. [Phase 0: 준비 작업 (1주)](#phase-0-준비-작업-1주)
4. [Phase 1: 인증 UI 구현 (1주)](#phase-1-인증-ui-구현-1주)
5. [컴포넌트 구조](#컴포넌트-구조)
6. [라우팅 설계](#라우팅-설계)
7. [에러 처리 전략](#에러-처리-전략)
8. [UI/UX 요구사항](#uiux-요구사항)
9. [테스트 시나리오](#테스트-시나리오)
10. [Backend 협업 포인트](#backend-협업-포인트)
11. [성공 기준](#성공-기준)

---

## 개요 및 목표

### 🎯 핵심 목표

**도구/데모 → 서비스 플랫폼 전환**의 첫 단계로 사용자 인증 UI를 구축합니다.

**Before (v0)**:
```
/ (Dashboard) - 익명 접근
/session - 익명 접근
/history - 익명 접근
/settings - 익명 접근
```

**After (v1)**:
```
/ (Landing) - 공개
/auth/login - 공개
/auth/signup - 공개

/app/dashboard - 인증 필요 (Route Guard)
/session - 인증 필요
/history - 인증 필요
/settings - 인증 필요
```

### 📊 사용자 플로우

**신규 사용자**:
```
Landing Page → 회원가입 → 로그인 → 대시보드 → 세션 시작
```

**기존 사용자**:
```
Landing Page → 로그인 → 대시보드 → 이전 히스토리 확인
```

**토큰 만료 시**:
```
API 호출 → 401 Unauthorized → Refresh Token 자동 갱신 → 재시도 → 성공
(갱신 실패 시 → 로그인 페이지로 리다이렉트)
```

### 🔗 관련 문서

- **전체 재설계 계획**: `PLATFORM_IA_REDESIGN_v1.0.md` (Section 2, 3, 4, 6)
- **현재 프론트엔드 현황**: `SUMMARY.md`
- **Backend API 스펙**: `PHASE_0-1_BACKEND_PROMPT.md` (Section 5: API 엔드포인트)

---

## 현재 상태 분석

### ✅ 기존 구현 (재사용 가능)

#### AuthContext 구조 (src/contexts/AuthContext.tsx)

```typescript
// ✅ 이미 구현된 부분
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

// ✅ 토큰 관리 로직 완성
const TOKEN_KEY = 'bemore_access_token';        // Line 25
const REFRESH_TOKEN_KEY = 'bemore_refresh_token'; // Line 26
const USER_KEY = 'bemore_user';                 // Line 27

// ✅ 토큰 자동 갱신 (30분마다)
useEffect(() => { ... }, [isAuthenticated]);    // Line 221-233
```

#### API 클라이언트 (src/services/api.ts)

```typescript
// ✅ Authorization 헤더 자동 추가
const token = localStorage.getItem('bemore_token'); // Line 67
if (token) {
  config.headers['Authorization'] = `Bearer ${token}`; // Line 69
}

// ✅ 보안 헤더 자동 추가
X-Request-ID, X-Client-Version, X-Device-ID, X-Timestamp // Line 55-59
```

### ❌ 미구현 (Phase 0-1 작업 대상)

#### 1️⃣ AuthContext API 연결 (모두 TODO 상태)

```typescript
// ❌ src/contexts/AuthContext.tsx:69
const login = async (email: string, password: string) => {
  // TODO: Replace with actual API call
  const response = await fetch('/api/auth/login', { ... });
};

// ❌ src/contexts/AuthContext.tsx:92
const signup = async (email: string, password: string, name: string) => {
  // TODO: Replace with actual API call
  const response = await fetch('/api/auth/signup', { ... });
};

// ❌ src/contexts/AuthContext.tsx:115
const logout = async () => {
  // TODO: Replace with actual API call
  await fetch('/api/auth/logout', { ... });
};

// ❌ src/contexts/AuthContext.tsx:139
const updateProfile = async (data: Partial<User>) => {
  // TODO: Replace with actual API call
  const response = await fetch('/api/auth/profile', { ... });
};

// ❌ src/contexts/AuthContext.tsx:169
const refreshAuth = async () => {
  // TODO: Replace with actual API call
  const response = await fetch('/api/auth/refresh', { ... });
};
```

**문제점**: `fetch` 대신 `api` 클라이언트 사용 필요 (CSRF, 보안 헤더 자동 추가)

#### 2️⃣ 인증 UI 컴포넌트 (완전 미구현)

```
❌ src/pages/Auth/LoginPage.tsx - 없음
❌ src/pages/Auth/SignupPage.tsx - 없음
❌ src/pages/Auth/ResetPasswordPage.tsx - 없음
❌ src/components/Auth/LoginForm.tsx - 없음
❌ src/components/Auth/SignupForm.tsx - 없음
❌ src/pages/Landing/LandingPage.tsx - 없음
```

#### 3️⃣ Route Guards (완전 미구현)

```
❌ src/components/Auth/AuthGuard.tsx - 없음
❌ src/components/Auth/PublicRoute.tsx - 없음
```

#### 4️⃣ 라우팅 변경 (src/AppRouter.tsx)

```typescript
// 현재 (v0)
<Route path="/" element={<Dashboard />} />
<Route path="/session" element={<SessionApp />} />

// 필요한 변경 (v1)
<Route path="/" element={<LandingPage />} />        // 공개
<Route path="/auth/login" element={<LoginPage />} /> // 공개
<Route path="/app/*" element={<AuthGuard><AppRoutes /></AuthGuard>} /> // 보호
```

---

## Phase 0: 준비 작업 (1주)

### 목표
AuthContext 리팩토링, API 연결 준비, 컴포넌트 구조 설계

### 작업 체크리스트

#### 1️⃣ AuthContext API 연결 (TODO 제거)

**파일**: `src/contexts/AuthContext.tsx`

```typescript
// ✅ 수정 전 (Line 69-86)
const login = async (email: string, password: string) => {
  try {
    // TODO: Replace with actual API call
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  }
}

// ✅ 수정 후
import { api } from '../services/api';

const login = async (email: string, password: string) => {
  try {
    const response = await api.post<{
      success: boolean;
      accessToken: string;
      refreshToken: string;
      user: User;
    }>('/api/v1/auth/login', { email, password });

    const { accessToken, refreshToken, user } = response.data;
    saveTokens(accessToken, refreshToken);
    saveUser(user);
  } catch (error) {
    // 에러 처리 (Section 7 참조)
    throw error;
  }
};
```

**작업**:
```
[ ] login() 메서드 API 연결 (Line 66-86)
[ ] signup() 메서드 API 연결 (Line 89-107)
[ ] logout() 메서드 API 연결 (Line 110-128)
[ ] updateProfile() 메서드 API 연결 (Line 131-158)
[ ] refreshAuth() 메서드 API 연결 (Line 161-188)
[ ] 초기 인증 확인 (Line 191-218) - /api/v1/auth/me 호출 추가
```

#### 2️⃣ API 클라이언트 타입 정의

**파일**: `src/types/auth.ts` (신규 생성)

```typescript
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface SignupResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

**작업**:
```
[ ] src/types/auth.ts 파일 생성
[ ] 모든 인증 관련 Request/Response 타입 정의
[ ] src/types/index.ts에서 re-export
```

#### 3️⃣ API 응답 인터셉터 수정 (401 처리)

**파일**: `src/services/api.ts`

```typescript
// ✅ 추가 필요 (Line 150 이후)
api.interceptors.response.use(
  (response) => {
    // 성공 응답 처리 (기존 로직 유지)
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 Unauthorized && Refresh Token 있음
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('bemore_refresh_token');
        if (!refreshToken) {
          // Refresh Token 없음 → 로그인 페이지로
          window.location.href = '/auth/login';
          return Promise.reject(error);
        }

        // Refresh Token으로 새 Access Token 발급
        const response = await api.post<RefreshTokenResponse>(
          '/api/v1/auth/refresh',
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('bemore_access_token', accessToken);
        localStorage.setItem('bemore_refresh_token', newRefreshToken);

        // 원래 요청 재시도
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh 실패 → 로그아웃
        localStorage.removeItem('bemore_access_token');
        localStorage.removeItem('bemore_refresh_token');
        localStorage.removeItem('bemore_user');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

**작업**:
```
[ ] 401 에러 자동 처리 로직 추가
[ ] Refresh Token 자동 갱신
[ ] 갱신 실패 시 로그인 페이지 리다이렉트
```

#### 4️⃣ 컴포넌트 구조 설계

```
src/
├── pages/
│   ├── Auth/
│   │   ├── LoginPage.tsx           ✅ 신규 생성
│   │   ├── SignupPage.tsx          ✅ 신규 생성
│   │   └── ResetPasswordPage.tsx   ⚠️ Phase 2 (선택)
│   ├── Landing/
│   │   └── LandingPage.tsx         ✅ 신규 생성
│   └── Home/
│       └── Dashboard.tsx           ⚠️ 기존 유지 (Phase 2 개편)
│
├── components/
│   ├── Auth/
│   │   ├── LoginForm.tsx           ✅ 신규 생성
│   │   ├── SignupForm.tsx          ✅ 신규 생성
│   │   ├── AuthGuard.tsx           ✅ 신규 생성
│   │   ├── PublicRoute.tsx         ✅ 신규 생성
│   │   └── SocialLoginButton.tsx   ⚠️ Phase 2 (선택)
│   └── Common/
│       └── Input.tsx               ⚠️ 기존 확인 (재사용 가능)
```

**작업**:
```
[ ] 폴더 구조 생성 (src/pages/Auth, src/components/Auth)
[ ] 컴포넌트 스켈레톤 파일 생성 (구현은 Phase 1)
```

#### 5️⃣ 환경 변수 확인

**파일**: `.env.example`

```bash
# 기존 (확인)
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# 추가 필요 여부 확인
# VITE_ENABLE_SOCIAL_LOGIN=false  # Phase 2
```

**작업**:
```
[ ] .env 파일에 API_URL이 올바른지 확인
[ ] Backend 팀과 API 베이스 URL 합의 (/api/v1)
```

#### 6️⃣ Backend 협업 설정

```
[ ] Backend 팀과 킥오프 미팅
[ ] API 스펙 최종 확인 (요청/응답 포맷)
[ ] Swagger 문서 URL 확인 (/api/docs)
[ ] CORS 설정 확인 (localhost:5173 허용 여부)
[ ] 에러 코드 정의 공유
```

---

## Phase 1: 인증 UI 구현 (1주)

### 목표
로그인/회원가입 UI 완성, Route Guards 적용, 전체 플로우 테스트

### 작업 체크리스트

#### 1️⃣ LoginPage 구현

**파일**: `src/pages/Auth/LoginPage.tsx`

```typescript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoginForm } from '../../components/Auth/LoginForm';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/app/dashboard'); // 로그인 성공 → 대시보드
    } catch (err: any) {
      // 에러 처리 (Section 7 참조)
      const errorMessage = err?.response?.data?.error?.message || '로그인에 실패했습니다';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            BeMore 로그인
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            24시간 AI 심리 상담 서비스
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <LoginForm onSubmit={handleLogin} isLoading={isLoading} />

        <div className="text-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            계정이 없으신가요?{' '}
          </span>
          <Link
            to="/auth/signup"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
```

**작업**:
```
[ ] LoginPage 컴포넌트 구현
[ ] 에러 메시지 표시
[ ] 로딩 상태 처리
[ ] 다크모드 지원 (Tailwind dark: 클래스)
[ ] 회원가입 링크 추가
```

#### 2️⃣ LoginForm 컴포넌트 구현

**파일**: `src/components/Auth/LoginForm.tsx`

```typescript
import { useState } from 'react';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
  isLoading: boolean;
}

export function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validation, setValidation] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};

    // 이메일 검증
    if (!email) {
      errors.email = '이메일을 입력해주세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = '올바른 이메일 형식이 아닙니다';
    }

    // 비밀번호 검증
    if (!password) {
      errors.password = '비밀번호를 입력해주세요';
    }

    setValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(email, password);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          이메일
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          disabled={isLoading}
        />
        {validation.email && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {validation.email}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          비밀번호
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          disabled={isLoading}
        />
        {validation.password && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {validation.password}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
}
```

**작업**:
```
[ ] 이메일/비밀번호 입력 필드
[ ] 클라이언트 검증 (이메일 형식, 필수 입력)
[ ] 로딩 상태 시 입력 비활성화
[ ] 접근성 (label, autocomplete, required)
[ ] Tailwind 스타일 (다크모드 포함)
```

#### 3️⃣ SignupPage & SignupForm 구현

**파일**: `src/pages/Auth/SignupPage.tsx`, `src/components/Auth/SignupForm.tsx`

```typescript
// SignupForm 추가 요구사항
[ ] 이름 입력 필드 추가
[ ] 비밀번호 강도 검증 (최소 8자, 숫자+문자)
[ ] 비밀번호 확인 필드 (일치 검증)
[ ] 약관 동의 체크박스 (선택)
[ ] 회원가입 성공 → 로그인 페이지로 리다이렉트
```

**비밀번호 강도 검증 예시**:
```typescript
const validatePassword = (password: string) => {
  if (password.length < 8) {
    return '비밀번호는 최소 8자 이상이어야 합니다';
  }
  if (!/[0-9]/.test(password)) {
    return '비밀번호에 숫자를 포함해야 합니다';
  }
  if (!/[a-zA-Z]/.test(password)) {
    return '비밀번호에 영문자를 포함해야 합니다';
  }
  return null;
};
```

#### 4️⃣ AuthGuard 컴포넌트 구현

**파일**: `src/components/Auth/AuthGuard.tsx`

```typescript
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner" /> {/* 로딩 스피너 */}
          <p className="mt-4 text-sm text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 미인증 → 로그인 페이지 (원래 경로 저장)
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // 인증 완료 → 자식 컴포넌트 렌더링
  return <>{children}</>;
}
```

**작업**:
```
[ ] 인증 상태 확인
[ ] 미인증 시 로그인 페이지로 리다이렉트
[ ] 로그인 성공 후 원래 경로로 복귀 (state.from 활용)
[ ] 로딩 상태 처리
```

#### 5️⃣ PublicRoute 컴포넌트 구현 (선택)

**파일**: `src/components/Auth/PublicRoute.tsx`

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // 로딩 중
  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  // 이미 로그인됨 → 대시보드로
  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  // 미인증 → 공개 페이지 렌더링
  return <>{children}</>;
}
```

**용도**: 로그인/회원가입 페이지에서 이미 인증된 사용자를 대시보드로 리다이렉트

#### 6️⃣ LandingPage 구현 (간단한 버전)

**파일**: `src/pages/Landing/LandingPage.tsx`

```typescript
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
            BeMore
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
            AI 기반 실시간 심리 상담 시스템
          </p>
          <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
            MediaPipe 얼굴 감정 인식과 Gemini AI를 활용한 24시간 심리 상담 서비스
          </p>

          <div className="mt-10 flex gap-4 justify-center">
            {isAuthenticated ? (
              <Link
                to="/app/dashboard"
                className="px-8 py-3 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700"
              >
                대시보드로 가기
              </Link>
            ) : (
              <>
                <Link
                  to="/auth/signup"
                  className="px-8 py-3 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700"
                >
                  무료 시작하기
                </Link>
                <Link
                  to="/auth/login"
                  className="px-8 py-3 bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 border border-primary-600 dark:border-primary-400 rounded-md font-medium hover:bg-primary-50 dark:hover:bg-gray-700"
                >
                  로그인
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Phase 2: 기능 소개, 스크린샷, 가격 정보 등 추가 */}
      </div>
    </div>
  );
}
```

**작업**:
```
[ ] 간단한 Hero 섹션
[ ] CTA 버튼 (회원가입, 로그인)
[ ] 인증 상태에 따른 버튼 변경
[ ] ⚠️ Phase 2: 상세 내용 추가 (기능 소개, 가격 등)
```

#### 7️⃣ AppRouter 수정

**파일**: `src/AppRouter.tsx`

```typescript
import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/Layout/AppLayout';
import { AuthGuard } from './components/Auth/AuthGuard';
import { PublicRoute } from './components/Auth/PublicRoute';

// Lazy load pages
const LandingPage = lazy(() => import('./pages/Landing/LandingPage'));
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const SignupPage = lazy(() => import('./pages/Auth/SignupPage'));

const SessionApp = lazy(() => import('./App'));
const Dashboard = lazy(() => import('./pages/Home/Dashboard').then(m => ({ default: m.Dashboard })));
const HistoryPage = lazy(() => import('./pages/History/History'));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage'));

function Fallback() {
  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-gray-500 dark:text-gray-300">
      Loading...
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Fallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/auth/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/auth/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/app/*"
            element={
              <AuthGuard>
                <AppLayout>
                  <Routes>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
                  </Routes>
                </AppLayout>
              </AuthGuard>
            }
          />

          {/* Legacy routes (redirect to /app/*) */}
          <Route path="/session" element={<Navigate to="/app/session" replace />} />
          <Route path="/history" element={<Navigate to="/app/history" replace />} />
          <Route path="/settings" element={<Navigate to="/app/settings" replace />} />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

**작업**:
```
[ ] / → LandingPage (공개)
[ ] /auth/login → LoginPage (공개, PublicRoute)
[ ] /auth/signup → SignupPage (공개, PublicRoute)
[ ] /app/* → AuthGuard로 보호
[ ] 기존 라우트 리다이렉트 (/session → /app/session)
```

**⚠️ 주의**: 기존 `/session`, `/history`, `/settings`는 Phase 2에서 `/app/*` 하위로 이동

#### 8️⃣ 로그인 후 원래 경로로 복귀

**파일**: `src/pages/Auth/LoginPage.tsx` (수정)

```typescript
const handleLogin = async (email: string, password: string) => {
  // ... (기존 로직)

  try {
    await login(email, password);

    // state.from에서 원래 경로 가져오기
    const from = location.state?.from?.pathname || '/app/dashboard';
    navigate(from, { replace: true });
  } catch (err) {
    // 에러 처리
  }
};
```

#### 9️⃣ 로그아웃 버튼 추가

**파일**: `src/components/Layout/AppLayout.tsx` (기존 파일 확인 필요)

```typescript
import { useAuth } from '../../contexts/AuthContext';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // AuthContext의 logout이 자동으로 토큰 제거 + user=null 설정
    // → AuthGuard가 감지하여 로그인 페이지로 리다이렉트
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">BeMore</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
```

**작업**:
```
[ ] AppLayout에 사용자 이메일 표시
[ ] 로그아웃 버튼 추가
[ ] 로그아웃 성공 → 로그인 페이지로 자동 리다이렉트 (AuthGuard)
```

---

## 컴포넌트 구조

### 파일 트리 (Phase 1 완료 후)

```
src/
├── pages/
│   ├── Auth/
│   │   ├── LoginPage.tsx           ✅ 로그인 페이지
│   │   ├── SignupPage.tsx          ✅ 회원가입 페이지
│   │   └── index.ts                ✅ re-export
│   ├── Landing/
│   │   ├── LandingPage.tsx         ✅ 랜딩 페이지
│   │   └── index.ts                ✅ re-export
│   ├── Home/
│   │   └── Dashboard.tsx           ⚠️ 기존 유지
│   ├── History/
│   │   └── History.tsx             ⚠️ 기존 유지
│   └── Settings/
│       └── SettingsPage.tsx        ⚠️ 기존 유지
│
├── components/
│   ├── Auth/
│   │   ├── LoginForm.tsx           ✅ 로그인 폼
│   │   ├── SignupForm.tsx          ✅ 회원가입 폼
│   │   ├── AuthGuard.tsx           ✅ 인증 보호
│   │   ├── PublicRoute.tsx         ✅ 공개 라우트
│   │   └── index.ts                ✅ re-export
│   └── Layout/
│       └── AppLayout.tsx           ⚠️ 기존 확인 (로그아웃 버튼 추가)
│
├── contexts/
│   └── AuthContext.tsx             ⚠️ TODO 제거, API 연결
│
├── services/
│   └── api.ts                      ⚠️ 401 인터셉터 추가
│
├── types/
│   ├── auth.ts                     ✅ 인증 타입 정의
│   └── index.ts                    ⚠️ auth.ts re-export
│
└── AppRouter.tsx                   ⚠️ 라우팅 변경
```

---

## 라우팅 설계

### v0 → v1 라우트 매핑

| v0 경로 | v1 경로 | 접근 권한 | 비고 |
|---------|---------|----------|------|
| `/` | `/` | 공개 | LandingPage |
| - | `/auth/login` | 공개 | LoginPage |
| - | `/auth/signup` | 공개 | SignupPage |
| `/` (Dashboard) | `/app/dashboard` | 인증 필요 | 기존 Dashboard |
| `/session` | `/app/session` | 인증 필요 | Phase 2 이동 |
| `/history` | `/app/history` | 인증 필요 | Phase 2 이동 |
| `/settings` | `/app/settings` | 인증 필요 | Phase 2 이동 |

### 리다이렉트 전략 (Phase 1)

```
/ (기존 Dashboard) → / (LandingPage)
/session → /app/session (리다이렉트)
/history → /app/history (리다이렉트)
/settings → /app/settings (리다이렉트)
```

**⚠️ Phase 2**: `/session`, `/history`, `/settings`를 `/app/*` 하위로 실제 이동

---

## 에러 처리 전략

### 1️⃣ Backend 에러 응답 포맷

**Backend가 반환하는 형식** (PHASE_0-1_BACKEND_PROMPT.md 참조):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호가 올바르지 않습니다",
    "details": null
  }
}
```

### 2️⃣ Frontend 에러 처리

**파일**: `src/utils/errorHandler.ts` (신규 생성)

```typescript
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export const getErrorMessage = (error: any): string => {
  // Axios error
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }

  // Network error
  if (error.message === 'Network Error') {
    return '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.';
  }

  // Timeout
  if (error.code === 'ECONNABORTED') {
    return '요청 시간이 초과되었습니다. 다시 시도해주세요.';
  }

  // Default
  return '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
};

export const getErrorCode = (error: any): string | null => {
  return error.response?.data?.error?.code || null;
};
```

### 3️⃣ 에러 코드별 처리

| Code | HTTP | 사용자 메시지 | UI 동작 |
|------|------|--------------|---------|
| `INVALID_CREDENTIALS` | 401 | 이메일 또는 비밀번호가 올바르지 않습니다 | 에러 메시지 표시 |
| `EMAIL_ALREADY_EXISTS` | 409 | 이미 사용 중인 이메일입니다 | 이메일 필드 강조 |
| `TOKEN_EXPIRED` | 401 | 세션이 만료되었습니다 | 자동 갱신 시도 |
| `RATE_LIMIT_EXCEEDED` | 429 | 너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요 | 재시도 타이머 표시 |
| `INTERNAL_SERVER_ERROR` | 500 | 서버 오류가 발생했습니다 | 일반 에러 메시지 |

### 4️⃣ Toast 알림 (선택)

**파일**: `src/contexts/ToastContext.tsx` (기존 확인)

```typescript
// 로그인 성공 시
toast.success('로그인되었습니다');

// 로그아웃 시
toast.info('로그아웃되었습니다');

// 에러 시
toast.error(getErrorMessage(error));
```

---

## UI/UX 요구사항

### 1️⃣ 디자인 시스템

**색상** (기존 Tailwind 유지):
```typescript
// tailwind.config.js
colors: {
  primary: {
    500: '#0d7d72',  // AAA contrast (7:1)
    600: '#0a6960',
    700: '#085550',
  },
  // ... (기존 색상 유지)
}
```

### 2️⃣ 접근성 (WCAG 2.1 AA 이상)

```
✅ 모든 입력 필드에 <label> 사용
✅ autocomplete 속성 (email, current-password, new-password)
✅ required, aria-invalid 속성
✅ 키보드 탐색 가능 (Tab, Enter)
✅ 포커스 표시 (focus:ring-primary-500)
✅ 색상 대비 7:1 이상
```

### 3️⃣ 반응형 디자인

```
✅ 모바일 우선 (min-w-[320px])
✅ Breakpoints: sm (640px), md (768px), lg (1024px)
✅ 터치 타겟 최소 44x44px
```

### 4️⃣ 다크모드 지원

```
✅ dark: 클래스 사용 (Tailwind)
✅ 모든 컴포넌트에 다크모드 스타일
✅ ThemeContext 유지 (기존 구현)
```

### 5️⃣ 로딩 상태

```
✅ 버튼 로딩 (isLoading prop)
✅ 로딩 중 입력 비활성화
✅ 로딩 스피너 또는 텍스트 변경
```

### 6️⃣ 폼 검증

```
✅ 클라이언트 검증 (즉시 피드백)
✅ 서버 검증 (에러 응답 처리)
✅ 필드별 에러 메시지 표시
✅ 에러 발생 시 해당 필드 포커스
```

---

## 테스트 시나리오

### 단위 테스트 (Vitest)

```typescript
// src/components/Auth/LoginForm.test.tsx
describe('LoginForm', () => {
  it('이메일 형식 검증', () => {
    // invalid email → 에러 메시지 표시
  });

  it('빈 비밀번호 검증', () => {
    // empty password → 에러 메시지 표시
  });

  it('로딩 중 입력 비활성화', () => {
    // isLoading=true → input disabled
  });
});
```

### 통합 테스트

```typescript
// AuthContext 통합 테스트
describe('AuthContext', () => {
  it('로그인 성공', async () => {
    // login() 호출 → API 성공 → user 설정
  });

  it('로그인 실패', async () => {
    // login() 호출 → API 401 → 에러 throw
  });

  it('토큰 자동 갱신', async () => {
    // Access Token 만료 → refreshAuth() 자동 호출
  });
});
```

### E2E 테스트 (Playwright)

```typescript
// e2e/auth.spec.ts
test('회원가입 → 로그인 플로우', async ({ page }) => {
  // 1. Landing Page 접속
  await page.goto('/');

  // 2. 회원가입 클릭
  await page.click('text=무료 시작하기');

  // 3. 회원가입 폼 작성
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[name="name"]', '테스트 사용자');
  await page.fill('input[type="password"]', 'Test1234!');
  await page.click('button[type="submit"]');

  // 4. 로그인 페이지로 리다이렉트 확인
  await page.waitForURL('/auth/login');

  // 5. 로그인
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'Test1234!');
  await page.click('button[type="submit"]');

  // 6. 대시보드 접속 확인
  await page.waitForURL('/app/dashboard');
  expect(await page.textContent('h1')).toContain('대시보드');
});

test('미인증 사용자 보호된 페이지 접근', async ({ page }) => {
  // 1. 직접 /app/dashboard 접속 시도
  await page.goto('/app/dashboard');

  // 2. 로그인 페이지로 리다이렉트 확인
  await page.waitForURL('/auth/login');
});

test('토큰 만료 후 자동 갱신', async ({ page }) => {
  // 1. 로그인
  // 2. Access Token 만료 시뮬레이션
  // 3. API 호출 → 401 → 자동 갱신 → 재시도 성공
});
```

---

## Backend 협업 포인트

### 1️⃣ API 요청/응답 확인

**Frontend가 전송하는 형식**:
```json
POST /api/v1/auth/login
Content-Type: application/json
Authorization: (없음)

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Backend가 반환하는 형식**:
```json
200 OK
Content-Type: application/json

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

**⚠️ 중요**: Backend 응답의 `user` 객체 구조가 Frontend `User` 타입과 정확히 일치해야 함

### 2️⃣ CORS 설정 확인

```
Frontend Origin: http://localhost:5173 (Vite 개발 서버)
Backend 허용 필요:
- Access-Control-Allow-Origin: http://localhost:5173
- Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
- Access-Control-Allow-Headers: Content-Type, Authorization
- Access-Control-Allow-Credentials: true
```

### 3️⃣ Swagger/OpenAPI 문서

```
[ ] Backend 팀에 Swagger URL 요청 (/api/docs)
[ ] 모든 인증 API 엔드포인트 예제 확인
[ ] Response 스키마 검증
```

### 4️⃣ 에러 응답 포맷 통일

**Frontend 기대 형식**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "이메일 또는 비밀번호가 올바르지 않습니다"
  }
}
```

**Backend와 협의 필요**:
```
[ ] 에러 코드 정의 공유
[ ] 사용자 친화적 메시지 작성 (한글)
[ ] HTTP 상태 코드 일관성
```

---

## 성공 기준

### Phase 0 완료 기준

```
✅ AuthContext TODO 제거 (모든 메서드 API 연결)
✅ src/types/auth.ts 타입 정의 완료
✅ API 401 인터셉터 구현 (자동 갱신)
✅ 컴포넌트 폴더 구조 생성
✅ Backend 팀과 킥오프 미팅 완료
✅ API 스펙 최종 확인 (Swagger 문서)
```

### Phase 1 완료 기준

```
✅ LoginPage & LoginForm 구현
✅ SignupPage & SignupForm 구현
✅ LandingPage 구현
✅ AuthGuard 구현 및 적용
✅ PublicRoute 구현
✅ AppRouter 라우팅 변경 (/auth/*, /app/*)
✅ AppLayout에 로그아웃 버튼 추가

✅ E2E 테스트 통과 (3개 시나리오)
   - 회원가입 → 로그인 플로우
   - 미인증 사용자 보호된 페이지 접근
   - 토큰 만료 후 자동 갱신

✅ Backend와 통합 테스트 완료
✅ 접근성 검증 (axe-core)
✅ 다크모드 동작 확인
✅ 모바일 반응형 확인
```

### 검증 방법

#### 1. 수동 테스트

```
Scenario 1: 신규 사용자 회원가입
1. / (LandingPage) 접속
2. "무료 시작하기" 클릭
3. 회원가입 폼 작성
4. 회원가입 성공 → 로그인 페이지로
5. 로그인 → 대시보드 접속 확인

Scenario 2: 기존 사용자 로그인
1. /auth/login 접속
2. 로그인 폼 작성
3. 로그인 성공 → 대시보드 접속
4. 로그아웃 → 로그인 페이지로

Scenario 3: 보호된 페이지 접근
1. 로그아웃 상태
2. /app/dashboard 직접 접속 시도
3. 로그인 페이지로 리다이렉트 확인
4. 로그인 → 대시보드 복귀
```

#### 2. 개발자 도구 확인

```
[ ] Network 탭에서 API 요청/응답 확인
[ ] Authorization 헤더 포함 확인
[ ] localStorage에 토큰 저장 확인
[ ] Console 에러 없음
```

#### 3. Lighthouse 점수 (참고)

```
Performance: ≥80
Accessibility: ≥95 (WCAG AA)
Best Practices: ≥90
SEO: ≥80
```

---

## 참고 자료

### 내부 문서
- `PLATFORM_IA_REDESIGN_v1.0.md` - 전체 재설계 계획
- `PHASE_0-1_BACKEND_PROMPT.md` - Backend API 스펙
- `src/contexts/AuthContext.tsx` - 기존 Auth 구현
- `src/services/api.ts` - API 클라이언트

### 외부 문서
- [React Router - Authentication](https://reactrouter.com/en/main/start/tutorial#authentication)
- [Tailwind CSS - Forms](https://tailwindcss.com/docs/forms)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 문의 및 지원

**Backend 협업 담당**:
- Backend API 스펙: `PHASE_0-1_BACKEND_PROMPT.md` 참조
- Swagger 문서: (Backend 팀에 요청)

**질문/이슈**:
- 불확실한 사항은 팀 회의에서 논의
- API 응답 포맷 변경은 Backend 팀과 사전 합의 필수

---

**작성 원칙**:
- ✅ 증거 기반 (기존 코드 파일 경로 인용)
- ✅ 불확실한 부분 명시 ("확실하지 않음: ...", "⚠️ Phase 2")
- ✅ 실행 가능한 체크리스트 중심
- ✅ Backend 협업 포인트 명확화

**다음 단계**: Phase 0 시작 → Backend 팀 킥오프 → AuthContext API 연결
