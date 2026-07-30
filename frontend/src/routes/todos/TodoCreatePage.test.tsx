// FE-5 완료조건 3: 등록 폼 제출 성공 시 목록(/todos)으로 이동하는지 검증한다.
// useCreateTodoMutation을 모킹하지 않고 실제 훅을 사용하되, todoApi.createTodo를 모킹해
// react-query 성공 흐름을 통해 onSuccess(navigate 호출)까지 재현한다.
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { TodoCreatePage } from '@/routes/todos/TodoCreatePage';
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
import { createTodo } from '@/features/todos/api/todoApi';

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

const createdTodo: Todo = {
  id: '10',
  title: '테스트 할일',
  description: null,
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

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/todos/new']}>
        <TodoCreatePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('TodoCreatePage', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    vi.mocked(getCategories).mockReset();
    vi.mocked(getCategories).mockResolvedValue(categories);
    vi.mocked(createTodo).mockReset();
  });

  it('폼 제출 성공 시 /todos로 이동한다', async () => {
    vi.mocked(createTodo).mockResolvedValueOnce(createdTodo);

    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('제목 *'), '테스트 할일');
    await user.type(screen.getByLabelText('시작일자 *'), '2026-08-01');
    await user.type(screen.getByLabelText('종료일자 *'), '2026-08-05');

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(createTodo).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/todos'));
  });

  it('제출 실패 시 이동하지 않는다', async () => {
    vi.mocked(createTodo).mockRejectedValueOnce({
      statusCode: 400,
      message: '잘못된 요청입니다.',
    });

    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('제목 *'), '테스트 할일');
    await user.type(screen.getByLabelText('시작일자 *'), '2026-08-01');
    await user.type(screen.getByLabelText('종료일자 *'), '2026-08-05');

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('잘못된 요청입니다.')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith('/todos');
  });
});
