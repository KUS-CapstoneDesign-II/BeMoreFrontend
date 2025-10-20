import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export interface User {
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
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'bemore_access_token';
const REFRESH_TOKEN_KEY = 'bemore_refresh_token';
const USER_KEY = 'bemore_user';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // 토큰 저장
  const saveTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  };

  // 토큰 제거
  const clearTokens = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  // 토큰 가져오기
  const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
  const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

  // 사용자 저장
  const saveUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
  };

  // 로그인
  const login = async (email: string, password: string) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('로그인에 실패했습니다');
      }

      const data = await response.json();
      saveTokens(data.accessToken, data.refreshToken);
      saveUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // 회원가입
  const signup = async (email: string, password: string, name: string) => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        throw new Error('회원가입에 실패했습니다');
      }

      // 회원가입 성공 후 자동 로그인하지 않음 (이메일 인증 등을 고려)
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      const token = getAccessToken();
      if (token) {
        // TODO: Replace with actual API call
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
      setUser(null);
    }
  };

  // 프로필 업데이트
  const updateProfile = async (data: Partial<User>) => {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('인증이 필요합니다');
      }

      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('프로필 업데이트에 실패했습니다');
      }

      const updatedUser = await response.json();
      saveUser(updatedUser.user);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  // 토큰 갱신
  const refreshAuth = async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error('Refresh token not found');
      }

      // TODO: Replace with actual API call
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      saveTokens(data.accessToken, data.refreshToken);
    } catch (error) {
      console.error('Refresh token error:', error);
      // 토큰 갱신 실패 시 로그아웃
      clearTokens();
      setUser(null);
      throw error;
    }
  };

  // 초기 인증 확인
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      const savedUser = localStorage.getItem(USER_KEY);

      if (token && savedUser) {
        try {
          // TODO: 서버에 토큰 유효성 검증
          // const response = await fetch('/api/auth/me', {
          //   headers: { 'Authorization': `Bearer ${token}` }
          // });
          // const userData = await response.json();
          // saveUser(userData.user);

          // 임시: LocalStorage의 사용자 정보 사용
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Auth init error:', error);
          clearTokens();
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // 토큰 자동 갱신 (30분마다)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        await refreshAuth();
      } catch (error) {
        console.error('Auto refresh failed:', error);
      }
    }, 30 * 60 * 1000); // 30분

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Export token functions for API calls
export const authUtils = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
};
