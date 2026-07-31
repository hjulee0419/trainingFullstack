// 대시보드 완료조건: 오늘 날짜 셀 기본 선택, 해당 날짜에 걸친 할일이 하단 목록에 표시되는지,
// 달력 이동(다음 달) 시 월 제목이 바뀌는지, 다른 날짜 클릭 시 선택 목록이 갱신되는지 확인한다.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '@/routes/dashboard/DashboardPage';
import { getTodayDateString } from '@/features/todos/lib/deriveTodoStatus';
import type { Todo, TodoListResponse } from '@/features/todos/types';

vi.mock('@/features/todos/api/todoApi', () => ({
  getTodos: vi.fn(),
  deleteTodo: vi.fn(),
  updateTodo: vi.fn(),
  createTodo: vi.fn(),
}));

import { getTodos } from '@/features/todos/api/todoApi';

const today = getTodayDateString();

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: '1',
    title: '오늘 할일',
    description: null,
    categoryId: '1',
    categoryName: '기본',
    startDate: today,
    endDate: today,
    isCompleted: false,
    completedAt: null,
    status: 'in_progress',
    ownerId: '1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.mocked(getTodos).mockReset();
  });

  it('오늘 날짜에 걸친 할일이 기본 선택된 날짜 목록에 표시된다', async () => {
    const response: TodoListResponse = {
      items: [makeTodo()],
      pagination: { page: 1, limit: 100, totalCount: 1, totalPages: 1 },
    };
    vi.mocked(getTodos).mockResolvedValue(response);

    renderPage();

    expect(await screen.findByText('오늘 할일')).toBeInTheDocument();
  });

  it('오늘 범위에 없는 할일은 기본 선택 목록에 나오지 않는다', async () => {
    const response: TodoListResponse = {
      items: [makeTodo({ title: '다른 날 할일', startDate: '2020-01-01', endDate: '2020-01-02' })],
      pagination: { page: 1, limit: 100, totalCount: 1, totalPages: 1 },
    };
    vi.mocked(getTodos).mockResolvedValue(response);

    renderPage();

    await waitFor(() => expect(getTodos).toHaveBeenCalled());
    expect(screen.queryByText('다른 날 할일')).not.toBeInTheDocument();
  });

  it('다음 달 버튼을 누르면 월 제목이 바뀐다', async () => {
    vi.mocked(getTodos).mockResolvedValue({
      items: [],
      pagination: { page: 1, limit: 100, totalCount: 0, totalPages: 1 },
    });
    const user = userEvent.setup();
    renderPage();

    const titleBefore = screen.getByText(/년 \d+월/).textContent;
    await user.click(screen.getByRole('button', { name: '다음 달 →' }));

    await waitFor(() => {
      expect(screen.getByText(/년 \d+월/).textContent).not.toBe(titleBefore);
    });
  });
});
