// FE-2 완료조건 2(로그인 성공 시 토큰 저장)와 완료조건 4(로그아웃 시 토큰 삭제)의
// 기반이 되는 useAuthStore 액션(setAuth/setUser/clearToken)을 직접 검증한다.
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: null, user: null, isAuthenticated: false });
  });

  it('setAuth는 accessToken과 user를 저장하고 isAuthenticated를 true로 만든다', () => {
    const user = { id: '1', email: 'user@example.com', nickname: '테스터', createdAt: '2026-01-01T00:00:00Z' };

    useAuthStore.getState().setAuth('token-abc', user);

    expect(useAuthStore.getState().accessToken).toBe('token-abc');
    expect(useAuthStore.getState().user).toEqual(user);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('setUser는 user 정보만 갱신한다', () => {
    const user = { id: '2', email: 'other@example.com', nickname: '다른유저', createdAt: '2026-01-02T00:00:00Z' };

    useAuthStore.getState().setUser(user);

    expect(useAuthStore.getState().user).toEqual(user);
  });

  it('clearToken은 accessToken/user를 초기화하고 isAuthenticated를 false로 만든다', () => {
    useAuthStore.getState().setAuth('token-abc', {
      id: '1',
      email: 'user@example.com',
      nickname: '테스터',
      createdAt: '2026-01-01T00:00:00Z',
    });

    useAuthStore.getState().clearToken();

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
