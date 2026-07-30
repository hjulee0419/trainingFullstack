// FE-7 통합 스모크 테스트. useAuthStore에 mock user를 세팅하고 AccountPage를 렌더링했을 때
// 이메일/닉네임/가입일시가 표시되고, 완료조건 1/2/3을 담당하는 NicknameForm/PasswordForm이
// 함께 렌더되는지(계정 정보 수정 화면의 전체 조립 상태) 확인한다.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AccountPage } from '@/routes/account/AccountPage';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

vi.mock('@/features/account/api/accountApi', () => ({
  updateNickname: vi.fn(),
  updatePassword: vi.fn(),
}));

function renderAccountPage() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AccountPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: 'token-abc',
      user: {
        id: '1',
        email: 'user@example.com',
        nickname: '테스터',
        createdAt: '2026-01-01T00:00:00Z',
      },
      isAuthenticated: true,
    });
  });

  it('로그인한 사용자의 이메일/닉네임/가입일시를 표시한다', () => {
    renderAccountPage();

    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.getByText('테스터')).toBeInTheDocument();
    // 가입일시는 로컬 타임존 포맷(YYYY-MM-DD HH:mm)으로 렌더되므로, 실행 환경의
    // 타임존에 의존하지 않도록 정확한 시각 문자열 대신 형식(패턴)만 검증한다.
    expect(screen.getByText(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)).toBeInTheDocument();
  });

  it('닉네임 변경 폼과 비밀번호 변경 폼을 함께 렌더링한다', () => {
    renderAccountPage();

    expect(screen.getByRole('button', { name: '닉네임 저장' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '비밀번호 저장' })).toBeInTheDocument();
  });

  it('user 정보가 없으면 아무것도 렌더링하지 않는다', () => {
    useAuthStore.setState({ accessToken: null, user: null, isAuthenticated: false });

    const { container } = renderAccountPage();

    expect(container).toBeEmptyDOMElement();
  });
});
