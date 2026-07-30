// FE-7 완료조건 2(비밀번호 최소 길이 미달 시 에러 표시)와 완료조건 3(성공/실패 피드백 노출)을 검증한다.
// 최소 길이 미달 시 클라이언트에서 즉시 차단되어 API 호출 자체가 발생하지 않는지,
// 유효한 값 제출 시에만 mutation이 호출되고 성공/실패 각각 피드백 메시지가 렌더되는지 확인한다.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PasswordForm } from '@/features/account/components/PasswordForm';

vi.mock('@/features/account/api/accountApi', () => ({
  updateNickname: vi.fn(),
  updatePassword: vi.fn(),
}));

import { updatePassword } from '@/features/account/api/accountApi';

function renderPasswordForm() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PasswordForm />
    </QueryClientProvider>,
  );
}

describe('PasswordForm', () => {
  beforeEach(() => {
    vi.mocked(updatePassword).mockReset();
  });

  it('새 비밀번호를 입력하지 않고 제출하면 updatePassword API를 호출하지 않고 필수값 에러를 표시한다', async () => {
    const user = userEvent.setup();
    renderPasswordForm();

    await user.click(screen.getByRole('button', { name: '비밀번호 저장' }));

    expect(updatePassword).not.toHaveBeenCalled();
    expect(await screen.findByText('새 비밀번호를 입력해주세요.')).toBeInTheDocument();
  });

  it('신규 비밀번호가 최소 길이(8자) 미달이면 updatePassword API를 호출하지 않고 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup();
    renderPasswordForm();

    await user.type(screen.getByLabelText('새 비밀번호'), '1234567');
    await user.type(screen.getByLabelText('새 비밀번호 확인'), '1234567');
    await user.click(screen.getByRole('button', { name: '비밀번호 저장' }));

    expect(updatePassword).not.toHaveBeenCalled();
    expect(await screen.findByText('비밀번호는 최소 8자 이상이어야 합니다.')).toBeInTheDocument();
  });

  it('유효한 값 제출 시 updatePassword mutation이 호출되고 성공 메시지를 표시한다', async () => {
    const user = userEvent.setup();
    vi.mocked(updatePassword).mockResolvedValueOnce({
      id: '1',
      email: 'user@example.com',
      nickname: '테스터',
      createdAt: '2026-01-01T00:00:00Z',
    });

    renderPasswordForm();

    await user.type(screen.getByLabelText('새 비밀번호'), 'password123');
    await user.type(screen.getByLabelText('새 비밀번호 확인'), 'password123');
    await user.click(screen.getByRole('button', { name: '비밀번호 저장' }));

    expect(updatePassword).toHaveBeenCalledWith('password123', expect.anything());
    expect(await screen.findByText('비밀번호가 저장되었습니다.')).toBeInTheDocument();
  });

  it('유효한 값 제출 후 mutation이 실패하면 에러 메시지를 표시한다', async () => {
    const user = userEvent.setup();
    const errorMessage = '요청 처리 중 오류가 발생했습니다.';
    vi.mocked(updatePassword).mockRejectedValueOnce({ statusCode: 500, message: errorMessage });

    renderPasswordForm();

    await user.type(screen.getByLabelText('새 비밀번호'), 'password123');
    await user.type(screen.getByLabelText('새 비밀번호 확인'), 'password123');
    await user.click(screen.getByRole('button', { name: '비밀번호 저장' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage);
  });
});
