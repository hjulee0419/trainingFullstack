// FE-7 완료조건 1(닉네임 변경 즉시 반영)과 완료조건 3(성공/실패 피드백 노출)을 검증한다.
// accountApi.updateNickname을 모킹하고, 실제 useAuthStore를 렌더링 트리에 연결해
// mutation 성공 시 store의 user.nickname이 즉시 갱신되는지 getState()로 직접 확인한다.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NicknameForm } from '@/features/account/components/NicknameForm';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

vi.mock('@/features/account/api/accountApi', () => ({
  updateNickname: vi.fn(),
  updatePassword: vi.fn(),
}));

import { updateNickname } from '@/features/account/api/accountApi';

function renderNicknameForm(initialNickname = '기존닉네임') {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <NicknameForm initialNickname={initialNickname} />
    </QueryClientProvider>,
  );
}

describe('NicknameForm', () => {
  beforeEach(() => {
    vi.mocked(updateNickname).mockReset();
    useAuthStore.setState({
      accessToken: 'token-abc',
      user: { id: '1', email: 'user@example.com', nickname: '기존닉네임', createdAt: '2026-01-01T00:00:00Z' },
      isAuthenticated: true,
    });
  });

  it('닉네임 입력 후 저장 클릭 시 mutation 성공하면 useAuthStore의 user.nickname이 즉시 갱신되고 성공 메시지가 표시된다', async () => {
    const user = userEvent.setup();
    const updatedUser = {
      id: '1',
      email: 'user@example.com',
      nickname: '새닉네임',
      createdAt: '2026-01-01T00:00:00Z',
    };
    vi.mocked(updateNickname).mockResolvedValueOnce(updatedUser);

    renderNicknameForm('기존닉네임');

    const input = screen.getByLabelText('닉네임');
    await user.clear(input);
    await user.type(input, '새닉네임');
    await user.click(screen.getByRole('button', { name: '닉네임 저장' }));

    await waitFor(() => expect(useAuthStore.getState().user?.nickname).toBe('새닉네임'));
    expect(updateNickname).toHaveBeenCalledWith('새닉네임', expect.anything());
    expect(await screen.findByText('닉네임이 저장되었습니다.')).toBeInTheDocument();
  });

  it('닉네임을 공백으로 지우고 제출하면 API를 호출하지 않고 필수값 에러를 표시한다', async () => {
    const user = userEvent.setup();
    renderNicknameForm('기존닉네임');

    const input = screen.getByLabelText('닉네임');
    await user.clear(input);
    await user.click(screen.getByRole('button', { name: '닉네임 저장' }));

    expect(updateNickname).not.toHaveBeenCalled();
    expect(await screen.findByText('닉네임을 입력해주세요.')).toBeInTheDocument();
  });

  it('mutation 실패 시 에러 메시지를 표시하고 useAuthStore의 user.nickname은 갱신되지 않는다', async () => {
    const user = userEvent.setup();
    const errorMessage = '요청 처리 중 오류가 발생했습니다.';
    vi.mocked(updateNickname).mockRejectedValueOnce({ statusCode: 500, message: errorMessage });

    renderNicknameForm('기존닉네임');

    const input = screen.getByLabelText('닉네임');
    await user.clear(input);
    await user.type(input, '새닉네임');
    await user.click(screen.getByRole('button', { name: '닉네임 저장' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage);
    expect(useAuthStore.getState().user?.nickname).toBe('기존닉네임');
  });
});
