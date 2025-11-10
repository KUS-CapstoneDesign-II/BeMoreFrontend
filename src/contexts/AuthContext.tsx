import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../services/api';
import { logError } from '../utils/errorHandler';

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
      const data = await authAPI.login(email, password);
      saveTokens(data.accessToken, data.refreshToken);
      saveUser(data.user);
    } catch (error) {
      logError(error, 'Login');
      throw error;
    }
  };

  // 회원가입
  const signup = async (email: string, password: string, name: string) => {
    try {
      await authAPI.signup(email, password, name);
      // 회원가입 성공 후 자동 로그인하지 않음 (이메일 인증 등을 고려)
    } catch (error) {
      logError(error, 'Signup');
      throw error;
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      const token = getAccessToken();
      if (token) {
        await authAPI.logout();
      }
    } catch (error) {
      logError(error, 'Logout');
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

      const result = await authAPI.updateProfile(data);
      saveUser(result.user);
    } catch (error) {
      logError(error, 'Update profile');
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

      const data = await authAPI.refreshToken(refreshToken);
      saveTokens(data.accessToken, data.refreshToken);
    } catch (error) {
      logError(error, 'Refresh token');
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
          // 서버에 토큰 유효성 검증
          const userData = await authAPI.me();
          saveUser(userData.user);
        } catch (error) {
          logError(error, 'Auth init');
          // 토큰이 유효하지 않으면 로그아웃
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
        logError(error, 'Auto refresh');
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
