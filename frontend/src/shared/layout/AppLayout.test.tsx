// AppLayout은 인증된 사용자에게만 노출되는 공통 레이아웃으로, UserMenu(완료조건 4)와
// 내비게이션, Outlet 렌더링을 검증한다.
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/shared/layout/AppLayout';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

function renderAppLayout() {
  return render(
    <MemoryRouter initialEntries={['/todos']}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/todos" element={<div>Todos Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppLayout', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: 'test-token-123',
      user: { id: '1', email: 'a@b.com', nickname: '테스터', createdAt: '2026-01-01T00:00:00Z' },
      isAuthenticated: true,
    });
  });

  it('내비게이션 메뉴와 Outlet 콘텐츠, UserMenu를 렌더링한다', () => {
    renderAppLayout();

    expect(screen.getAllByText('할일 목록').length).toBeGreaterThan(0);
    expect(screen.getAllByText('카테고리').length).toBeGreaterThan(0);
    expect(screen.getAllByText('계정').length).toBeGreaterThan(0);
    expect(screen.getByText('Todos Content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /테스터/ })).toBeInTheDocument();
  });

  it('모바일 메뉴 토글 버튼 클릭 시 모바일 메뉴가 열린다', async () => {
    const user = userEvent.setup();
    renderAppLayout();

    const toggleButton = screen.getByRole('button', { name: '메뉴 열기' });
    await user.click(toggleButton);

    const mobileMenus = document.querySelectorAll('.gnb-mobile-menu');
    expect(mobileMenus[0].className).toContain('is-open');

    const mobileLinks = screen.getAllByText('할일 목록');
    await user.click(mobileLinks[mobileLinks.length - 1]);

    expect(mobileMenus[0].className).not.toContain('is-open');
  });
});
