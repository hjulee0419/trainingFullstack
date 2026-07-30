// FE-4 완료조건 2 최종 검증(통합 스모크): 필터 상태(Zustand) 변경 시 useTodosQuery가
// 새 쿼리 키(필터 포함)로 재요청되어 getTodos가 변경된 필터 인자로 다시 호출되는지 확인한다.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodoListPage } from '@/routes/todos/TodoListPage';
import { useTodoFilterStore } from '@/features/todos/store/useTodoFilterStore';
import type { TodoListResponse } from '@/features/todos/types';
import type { Category } from '@/features/categories/types';

vi.mock('@/features/todos/api/todoApi', () => ({
  getTodos: vi.fn(),
}));

vi.mock('@/features/categories/hooks/useCategoriesQuery', () => ({
  useCategoriesQuery: vi.fn(),
}));

import { getTodos } from '@/features/todos/api/todoApi';
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery';

const categories: Category[] = [
  { id: '1', name: '기본', isDefault: true, ownerId: '1', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', name: '업무', isDefault: false, ownerId: '1', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

function emptyResponse(): TodoListResponse {
  return { items: [], pagination: { page: 1, limit: 20, totalCount: 0, totalPages: 1 } };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TodoListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TodoListPage', () => {
  beforeEach(() => {
    vi.mocked(useCategoriesQuery).mockReturnValue({
      data: categories,
    } as unknown as ReturnType<typeof useCategoriesQuery>);
    vi.mocked(getTodos).mockReset();
    vi.mocked(getTodos).mockResolvedValue(emptyResponse());
  });

  afterEach(() => {
    useTodoFilterStore.getState().reset();
  });

  it('필터 변경 시 getTodos가 변경된 필터 값으로 재호출된다', async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() => {
      expect(getTodos).toHaveBeenCalledWith(expect.objectContaining({ categoryId: undefined, page: 1 }));
    });

    await user.selectOptions(screen.getByLabelText('카테고리'), '2');

    await waitFor(() => {
      expect(getTodos).toHaveBeenCalledWith(expect.objectContaining({ categoryId: '2', page: 1 }));
    });
  });
});
