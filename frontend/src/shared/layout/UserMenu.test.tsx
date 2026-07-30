// FE-2 완료조건 4(로그아웃 시 토큰 삭제 + /login 이동)를 검증한다.
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserMenu } from '@/shared/layout/UserMenu';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

function renderUserMenu() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<UserMenu />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('UserMenu', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: 'test-token-123',
      user: { id: '1', email: 'a@b.com', nickname: '테스터', createdAt: '2026-01-01T00:00:00Z' },
      isAuthenticated: true,
    });
  });

  it('로그아웃 버튼 클릭 시 토큰을 삭제하고 /login으로 이동한다', async () => {
    const user = userEvent.setup();
    renderUserMenu();

    await user.click(screen.getByRole('button', { name: /테스터/ }));
    await user.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(await screen.findByText('Login Page')).toBeInTheDocument();
  });
});
