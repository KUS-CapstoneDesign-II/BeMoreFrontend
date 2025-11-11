/**
 * Test Users Fixtures
 *
 * E2E 테스트에서 사용할 테스트 사용자 데이터
 */

export interface TestUser {
  email: string;
  password: string;
  name: string;
  role?: 'user' | 'admin';
}

/**
 * 기본 테스트 사용자 (로그인 성공 시나리오)
 */
export const VALID_USER: TestUser = {
  email: 'test@example.com',
  password: 'ValidPass123!',
  name: '테스트유저',
  role: 'user',
};

/**
 * 존재하지 않는 사용자 (로그인 실패 시나리오)
 */
export const INVALID_USER: TestUser = {
  email: 'nonexistent@example.com',
  password: 'WrongPass123!',
  name: '존재하지않는유저',
};

/**
 * 잘못된 비밀번호 (인증 실패 시나리오)
 */
export const WRONG_PASSWORD_USER: TestUser = {
  email: 'test@example.com',
  password: 'wrongpassword123',
  name: '테스트유저',
};

/**
 * 새 회원가입 사용자 (회원가입 성공 시나리오)
 */
export const NEW_USER: TestUser = {
  email: `new-user-${Date.now()}@example.com`,
  password: 'NewUserPass123!',
  name: '새로운유저',
  role: 'user',
};

/**
 * 중복 이메일 사용자 (회원가입 실패 시나리오)
 */
export const DUPLICATE_EMAIL_USER: TestUser = {
  email: 'test@example.com', // 이미 존재하는 이메일
  password: 'DuplicatePass123!',
  name: '중복이메일유저',
};

/**
 * 약한 비밀번호 사용자 (회원가입 실패 시나리오)
 */
export const WEAK_PASSWORD_USER: TestUser = {
  email: `weak-pass-${Date.now()}@example.com`,
  password: '123456', // 약한 비밀번호
  name: '약한비밀번호유저',
};

/**
 * 관리자 사용자 (관리자 기능 테스트)
 */
export const ADMIN_USER: TestUser = {
  email: 'admin@example.com',
  password: 'AdminPass123!',
  name: '관리자',
  role: 'admin',
};

/**
 * 테스트 사용자 풀 (다양한 시나리오 테스트)
 */
export const TEST_USERS = {
  valid: VALID_USER,
  invalid: INVALID_USER,
  wrongPassword: WRONG_PASSWORD_USER,
  new: NEW_USER,
  duplicate: DUPLICATE_EMAIL_USER,
  weakPassword: WEAK_PASSWORD_USER,
  admin: ADMIN_USER,
} as const;

/**
 * 랜덤 테스트 사용자 생성 (병렬 테스트용)
 */
export function generateRandomUser(): TestUser {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  return {
    email: `test-${timestamp}-${random}@example.com`,
    password: `TestPass${timestamp}!`,
    name: `테스트유저_${random}`,
    role: 'user',
  };
}

/**
 * Mock JWT 토큰 생성 (테스트용)
 */
export function generateMockToken(user: TestUser): string {
  const payload = {
    sub: user.email,
    name: user.name,
    role: user.role || 'user',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1시간
  };

  // 실제 JWT는 아니지만 테스트용으로 충분
  return `mock.${btoa(JSON.stringify(payload))}.signature`;
}
