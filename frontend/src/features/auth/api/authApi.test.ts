// authApi는 FE-2 완료조건 2/3(로그인)과 완료조건 1(회원가입)이 실제로 호출하는
// HTTP 계층이다. apiClient.post를 모킹하여 signup/login이 올바른 엔드포인트와
// payload로 요청하고 응답 데이터를 그대로 반환하는지 검증한다.
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

import { apiClient } from '@/api/client';
import { login, signup } from '@/features/auth/api/authApi';

describe('authApi', () => {
  it('signup은 /auth/signup으로 요청하고 응답 데이터를 반환한다', async () => {
    const user = { id: '1', email: 'user@example.com', nickname: '테스터', createdAt: '2026-01-01T00:00:00Z' };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: user });

    const request = { email: 'user@example.com', password: 'password123', nickname: '테스터' };
    const result = await signup(request);

    expect(apiClient.post).toHaveBeenCalledWith('/auth/signup', request);
    expect(result).toEqual(user);
  });

  it('login은 /auth/login으로 요청하고 응답 데이터를 반환한다', async () => {
    const response = {
      accessToken: 'token-abc',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: { id: '1', email: 'user@example.com', nickname: '테스터', createdAt: '2026-01-01T00:00:00Z' },
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: response });

    const request = { email: 'user@example.com', password: 'password123' };
    const result = await login(request);

    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', request);
    expect(result).toEqual(response);
  });
});
