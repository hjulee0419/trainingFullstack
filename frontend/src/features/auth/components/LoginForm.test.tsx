// FE-2 완료조건 2(로그인 성공 시 토큰 저장 + /todos 리다이렉트 — 이 테스트에서는
// onSuccess 콜백 호출로 간접 검증)와 완료조건 3(로그인 실패 시 E-8 일반화 메시지 표시)을
// 검증한다. authApi.login을 모킹하여 실제 네트워크 호출 없이 성공/실패 흐름을 재현한다.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { LoginForm } from '@/features/auth/components/LoginForm';

vi.mock('@/features/auth/api/authApi', () => ({
  login: vi.fn(),
  signup: vi.fn(),
}));

import { login } from '@/features/auth/api/authApi';

function renderLoginForm(onSuccess: () => void = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginForm onSuccess={onSuccess} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.mocked(login).mockReset();
  });

  it('빈 값으로 제출하면 login API를 호출하지 않고 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(login).not.toHaveBeenCalled();
    expect(await screen.findByText('이메일을 입력해주세요.')).toBeInTheDocument();
    expect(screen.getByText('비밀번호를 입력해주세요.')).toBeInTheDocument();
  });

  it('유효한 값 제출 시 login API가 호출되고 401 에러 메시지를 그대로 표시한다(E-8)', async () => {
    const user = userEvent.setup();
    const errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
    vi.mocked(login).mockRejectedValueOnce({ statusCode: 401, message: errorMessage });

    renderLoginForm();

    await user.type(screen.getByLabelText('이메일'), 'user@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password123');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    expect(login).toHaveBeenCalledWith(
      { email: 'user@example.com', password: 'password123' },
      expect.anything(),
    );
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });

  it('로그인 성공 시 onSuccess 콜백이 호출된다', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    vi.mocked(login).mockResolvedValueOnce({
      accessToken: 'token-abc',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: { id: '1', email: 'user@example.com', nickname: '테스터', createdAt: '2026-01-01T00:00:00Z' },
    });

    renderLoginForm(onSuccess);

    await user.type(screen.getByLabelText('이메일'), 'user@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password123');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});
