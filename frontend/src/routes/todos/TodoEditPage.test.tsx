// FE-5 완료조건 4: 수정 화면 진입 시(location.state.todo 존재) 기존 값이 폼에 프리필되는지.
// FE-5 완료조건 4의 예외 경로: location.state.todo가 없을 때 "목록에서 다시 시도해주세요." 안내가
//   렌더되고 폼은 렌더되지 않는지.
// FE-5 완료조건 3: 수정 제출 성공 시 목록(/todos)으로 이동하는지.
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TodoEditPage } from '@/routes/todos/TodoEditPage';
import type { Category } from '@/features/categories/types';
import type { Todo } from '@/features/todos/types';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/features/categories/api/categoryApi', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

vi.mock('@/features/todos/api/todoApi', () => ({
  getTodos: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
}));

import { getCategories } from '@/features/categories/api/categoryApi';
import { updateTodo } from '@/features/todos/api/todoApi';

const categories: Category[] = [
  {
    id: '1',
    name: '기본',
    isDefault: true,
    ownerId: '1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const mockTodo: Todo = {
  id: '1',
  title: '기존 할일',
  description: '기존 설명',
  categoryId: '1',
  categoryName: '기본',
  startDate: '2026-08-01',
  endDate: '2026-08-05',
  isCompleted: false,
  completedAt: null,
  status: 'not_started',
  ownerId: '1',
  createdAt: '2026-08-01T00:00:00Z',
  updatedAt: '2026-08-01T00:00:00Z',
};

function renderPage(initialEntries: Parameters<typeof MemoryRouter>[0]['initialEntries']) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/todos/:id/edit" element={<TodoEditPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TodoEditPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    vi.mocked(getCategories).mockReset();
    vi.mocked(getCategories).mockResolvedValue(categories);
    vi.mocked(updateTodo).mockReset();
  });

  it('location.state.todo가 있으면 폼에 기존 값이 프리필된다', () => {
    renderPage([{ pathname: '/todos/1/edit', state: { todo: mockTodo } }]);

    expect(screen.getByLabelText('제목 *')).toHaveValue('기존 할일');
    expect(screen.getByLabelText('설명')).toHaveValue('기존 설명');
    expect(screen.getByLabelText('시작일자 *')).toHaveValue('2026-08-01');
    expect(screen.getByLabelText('종료일자 *')).toHaveValue('2026-08-05');
  });

  it('location.state.todo가 없으면 안내 문구가 렌더되고 폼은 렌더되지 않는다', () => {
    renderPage(['/todos/1/edit']);

    expect(screen.getByText(/목록에서 다시 시도해주세요\./)).toBeInTheDocument();
    expect(screen.queryByLabelText('제목 *')).not.toBeInTheDocument();
  });

  it('수정 제출 성공 시 /todos로 이동한다', async () => {
    vi.mocked(updateTodo).mockResolvedValueOnce({ ...mockTodo, title: '수정된 할일' });

    const user = userEvent.setup();
    renderPage([{ pathname: '/todos/1/edit', state: { todo: mockTodo } }]);

    const titleInput = screen.getByLabelText('제목 *');
    await user.clear(titleInput);
    await user.type(titleInput, '수정된 할일');

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(updateTodo).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/todos'));
  });
});
