// FE-2 완료조건 1(회원가입 폼 클라이언트 측 검증: 이메일 형식/필수값 동작)을 검증한다.
// 이메일 형식 오류 또는 필수값 누락 시 authApi.signup 호출 자체가 막히는지 확인한다.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { SignupForm } from '@/features/auth/components/SignupForm';

vi.mock('@/features/auth/api/authApi', () => ({
  login: vi.fn(),
  signup: vi.fn(),
}));

import { signup } from '@/features/auth/api/authApi';

function renderSignupForm() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SignupForm onSuccess={vi.fn()} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SignupForm', () => {
  beforeEach(() => {
    vi.mocked(signup).mockReset();
  });

  it('필수값이 모두 비어 있으면 signup API를 호출하지 않고 에러를 표시한다', async () => {
    const user = userEvent.setup();
    renderSignupForm();

    await user.click(screen.getByRole('button', { name: '가입하기' }));

    expect(signup).not.toHaveBeenCalled();
    expect(await screen.findByText('이메일을 입력해주세요.')).toBeInTheDocument();
    expect(screen.getByText('닉네임을 입력해주세요.')).toBeInTheDocument();
  });

  it('이메일 형식이 올바르지 않으면 signup API를 호출하지 않고 에러를 표시한다', async () => {
    const user = userEvent.setup();
    renderSignupForm();

    await user.type(screen.getByLabelText('이메일'), 'not-an-email');
    await user.type(screen.getByLabelText('비밀번호'), 'password123');
    await user.type(screen.getByLabelText('닉네임'), '테스터');
    await user.click(screen.getByRole('button', { name: '가입하기' }));

    expect(signup).not.toHaveBeenCalled();
    expect(await screen.findByText('이메일 형식이 올바르지 않습니다.')).toBeInTheDocument();
  });

  it('signup API가 실패하면 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup();
    vi.mocked(signup).mockRejectedValueOnce({ statusCode: 409, message: '이미 가입된 이메일입니다.' });

    renderSignupForm();

    await user.type(screen.getByLabelText('이메일'), 'user@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password123');
    await user.type(screen.getByLabelText('닉네임'), '테스터');
    await user.click(screen.getByRole('button', { name: '가입하기' }));

    expect(await screen.findByText('이미 가입된 이메일입니다.')).toBeInTheDocument();
  });

  it('모든 값이 유효하면 signup API가 호출된다', async () => {
    const user = userEvent.setup();
    vi.mocked(signup).mockResolvedValueOnce({
      id: '1',
      email: 'user@example.com',
      nickname: '테스터',
      createdAt: '2026-01-01T00:00:00Z',
    });

    renderSignupForm();

    await user.type(screen.getByLabelText('이메일'), 'user@example.com');
    await user.type(screen.getByLabelText('비밀번호'), 'password123');
    await user.type(screen.getByLabelText('닉네임'), '테스터');
    await user.click(screen.getByRole('button', { name: '가입하기' }));

    expect(signup).toHaveBeenCalledWith(
      { email: 'user@example.com', password: 'password123', nickname: '테스터' },
      expect.anything(),
    );
  });
});
