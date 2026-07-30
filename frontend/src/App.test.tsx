import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '@/App';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

function renderApp(initialEntries: string[]) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('App', () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: null, isAuthenticated: false });
  });

  it('/login 경로 진입 시 로그인 화면을 렌더링한다', () => {
    renderApp(['/login']);

    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });

  it('미인증 상태로 / 접근 시 /login으로 리다이렉트된다', () => {
    renderApp(['/']);

    expect(screen.getByRole('heading', { name: '로그인' })).toBeInTheDocument();
  });

  it('인증 상태로 /todos 접근 시 AppLayout과 할일 목록 화면을 렌더링한다', () => {
    useAuthStore.setState({ accessToken: 'test-token-123', isAuthenticated: true });

    renderApp(['/todos']);

    expect(screen.getAllByText('TodoList').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: '할일 목록' })).toBeInTheDocument();
  });
});
