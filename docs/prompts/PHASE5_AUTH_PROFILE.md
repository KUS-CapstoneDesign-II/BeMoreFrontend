# Phase 5: User Authentication & Profile

## 🎯 목표

실제 사용자가 로그인하고 자신의 프로필을 관리할 수 있는 완전한 인증 시스템 구현

---

## 📋 구현 체크리스트

### 1. Authentication Context & Hook

**파일**: `src/contexts/AuthContext.tsx`

```typescript
// 구현 요구사항
interface User {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

// 기능
- LocalStorage에 토큰 저장 (access_token, refresh_token)
- 자동 토큰 갱신 (refresh token)
- 로그인 상태 유지 (페이지 새로고침 시)
- 토큰 만료 시 자동 로그아웃
```

**파일**: `src/hooks/useAuth.ts`
- useContext(AuthContext) wrapper
- Error handling

---

### 2. Login Component

**파일**: `src/components/Auth/Login.tsx`

```typescript
// UI 요구사항
- Email input (validation: email format)
- Password input (visibility toggle)
- "로그인 유지" checkbox
- "비밀번호 찾기" link
- "회원가입" link
- 소셜 로그인 버튼 (Google, Kakao)
- 로딩 상태 표시
- 에러 메시지 표시

// 기능
- Form validation (Zod or React Hook Form)
- 로그인 성공 시 메인 페이지로 리다이렉트
- 이미 로그인된 경우 메인 페이지로 리다이렉트
```

**디자인**:
- Dark mode 지원
- Responsive (모바일 최적화)
- Emotional design (따뜻한 색상)
- 접근성 (ARIA labels)

---

### 3. Signup Component

**파일**: `src/components/Auth/Signup.tsx`

```typescript
// UI 요구사항
- Name input
- Email input (중복 확인)
- Password input (강도 표시)
- Password confirmation
- 이용약관 동의 checkbox
- 개인정보 처리방침 동의 checkbox
- 로딩 상태 표시
- 에러 메시지 표시

// 기능
- Form validation
  - 이름: 2자 이상
  - 이메일: 유효한 형식 + 중복 확인
  - 비밀번호: 8자 이상, 영문+숫자+특수문자
  - 비밀번호 확인: 일치 여부
- 회원가입 성공 시 로그인 페이지로 리다이렉트
```

**비밀번호 강도 표시**:
- 약함 (빨강): 8자 미만
- 보통 (노랑): 8자 이상, 영문+숫자
- 강함 (초록): 8자 이상, 영문+숫자+특수문자

---

### 4. Profile Components

**파일**: `src/components/Profile/ProfileView.tsx`

```typescript
// UI 요구사항
- 프로필 이미지 (원형, 기본 아바타)
- 이름
- 이메일
- 가입일
- "프로필 수정" 버튼
- "로그아웃" 버튼

// 기능
- 프로필 이미지 클릭 시 확대
- 수정 버튼 클릭 시 ProfileEdit 모달 열기
```

**파일**: `src/components/Profile/ProfileEdit.tsx`

```typescript
// UI 요구사항
- 프로필 이미지 업로드
  - 이미지 미리보기
  - 이미지 크롭 (1:1 비율)
  - 이미지 크기 제한 (5MB)
- 이름 수정
- 이메일 수정 (인증 필요)
- "저장" 버튼
- "취소" 버튼

// 기능
- 이미지 업로드 (multipart/form-data)
- Form validation
- 저장 성공 시 모달 닫기 & 프로필 갱신
```

---

### 5. Protected Route Component

**파일**: `src/components/ProtectedRoute/ProtectedRoute.tsx`

```typescript
// 기능
- 인증되지 않은 경우 로그인 페이지로 리다이렉트
- 로딩 중에는 Skeleton 표시
- 인증된 경우 children 렌더링

// 사용 예시
<ProtectedRoute>
  <App />
</ProtectedRoute>
```

---

### 6. API Service

**파일**: `src/services/authAPI.ts`

```typescript
// API 엔드포인트
POST /api/auth/signup
  Body: { email, password, name }
  Response: { message: "회원가입 성공" }

POST /api/auth/login
  Body: { email, password, rememberMe }
  Response: { accessToken, refreshToken, user }

POST /api/auth/logout
  Headers: { Authorization: Bearer {token} }
  Response: { message: "로그아웃 성공" }

POST /api/auth/refresh
  Body: { refreshToken }
  Response: { accessToken }

GET /api/auth/me
  Headers: { Authorization: Bearer {token} }
  Response: { user }

PUT /api/auth/profile
  Headers: { Authorization: Bearer {token} }
  Body: { name, profileImage }
  Response: { user }
```

---

### 7. Routing 업데이트

**파일**: `src/App.tsx` 또는 `src/router.tsx`

```typescript
// React Router 추가
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/" element={
      <ProtectedRoute>
        <MainApp />
      </ProtectedRoute>
    } />
    <Route path="/profile" element={
      <ProtectedRoute>
        <ProfileView />
      </ProtectedRoute>
    } />
  </Routes>
</BrowserRouter>
```

---

## 🎨 디자인 가이드라인

### 색상
- Primary: `#14b8a6` (Teal)
- Success: `#10B981` (Green)
- Error: `#EF4444` (Red)
- Warning: `#F59E0B` (Amber)

### 폰트
- 제목: `font-bold text-2xl`
- 본문: `text-base`
- 캡션: `text-sm text-gray-500`

### 간격
- 섹션 간격: `space-y-6`
- 입력 필드 간격: `space-y-4`
- 버튼 그룹: `space-x-3`

### 애니메이션
- 페이지 전환: `animate-fade-in`
- 모달 열기: `animate-scale-in`
- 에러 메시지: `animate-shake` (추가 필요)

---

## 🧪 테스트 시나리오

### 1. 회원가입 Flow
1. "/signup" 접속
2. 이름, 이메일, 비밀번호 입력
3. 이용약관 동의
4. "회원가입" 버튼 클릭
5. 성공 시 로그인 페이지로 리다이렉트
6. 에러 시 에러 메시지 표시

### 2. 로그인 Flow
1. "/login" 접속
2. 이메일, 비밀번호 입력
3. "로그인" 버튼 클릭
4. 성공 시 메인 페이지로 리다이렉트
5. 토큰 저장 확인

### 3. 자동 로그인
1. 로그인 후 페이지 새로고침
2. 로그인 상태 유지 확인
3. 토큰 만료 시 자동 로그아웃 확인

### 4. 프로필 수정
1. 프로필 페이지 접속
2. "프로필 수정" 버튼 클릭
3. 이름 변경
4. 프로필 이미지 업로드
5. "저장" 버튼 클릭
6. 프로필 업데이트 확인

---

## 📦 필요한 Dependencies

```bash
npm install react-router-dom
npm install @hookform/resolvers zod
npm install react-hook-form
npm install axios
npm install react-hot-toast  # 토스트 알림
```

---

## ✅ 완료 기준

- [ ] 로그인/로그아웃 정상 작동
- [ ] 회원가입 정상 작동
- [ ] 토큰 갱신 자동 처리
- [ ] Protected Routes 리다이렉트 정상
- [ ] 프로필 조회/수정 정상 작동
- [ ] 프로필 이미지 업로드 정상 작동
- [ ] Dark mode 지원
- [ ] 모바일 반응형
- [ ] 접근성 (WCAG 2.1 AA)
- [ ] 에러 처리 완료
- [ ] TypeScript 타입 안전
- [ ] Build 에러 없음

---

## 🚀 실행 명령어

```bash
# Phase 5 시작
"Phase 5 구현을 시작합니다. PHASE5_AUTH_PROFILE.md의 모든 요구사항을 순서대로 구현해주세요."

# 완료 후
npm run build
npm run preview
```

---

## 📝 주의사항

1. **보안**
   - 비밀번호는 평문 전송 금지 (HTTPS 필수)
   - XSS 방지 (입력값 sanitization)
   - CSRF 방지 (CSRF 토큰)
   - SQL Injection 방지 (Prepared Statements)

2. **성능**
   - 이미지 최적화 (WebP, 압축)
   - Lazy loading (프로필 이미지)
   - 토큰 갱신 중복 요청 방지

3. **사용자 경험**
   - 로딩 상태 명확히 표시
   - 에러 메시지 사용자 친화적
   - 성공 시 토스트 알림

4. **접근성**
   - ARIA labels 모든 입력 필드
   - Keyboard navigation 지원
   - Focus indicators 명확

---

## 🎉 완료 시 다음 단계

Phase 5 완료 후 → **Phase 6: Session History & Analytics** 진행
