import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  // 백엔드가 BIGINT를 JSON에서 문자열로 반환하므로 불투명한 식별자 문자열로 다룬다.
  id: string;
  email: string;
  nickname: string;
  createdAt: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, user: AuthUser | null) => void;
  setUser: (user: AuthUser | null) => void;
  clearToken: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      setAuth: (accessToken, user) => set({ accessToken, user, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      clearToken: () => set({ accessToken: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'todolist-auth',
    },
  ),
);
