// FE-4 완료조건 1/2/5의 전제: todoApi.getTodos가 buildTodoQueryParams로 변환한 필터를
// apiClient 쿼리 파라미터로 전달하고, 응답 데이터(items+pagination)를 그대로 반환하는지 확인한다.
// FE-5 완료조건 3의 전제: createTodo/updateTodo가 올바른 엔드포인트/payload로 요청하는지 확인한다.
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import { apiClient } from '@/api/client';
import { createTodo, getTodos, updateTodo } from '@/features/todos/api/todoApi';
import type { Todo, TodoListResponse } from '@/features/todos/types';

const mockTodo: Todo = {
  id: '1',
  title: '제목',
  description: null,
  categoryId: '2',
  categoryName: '기본',
  startDate: '2026-08-01',
  endDate: '2026-08-05',
  isCompleted: false,
  completedAt: null,
  status: 'not_started',
  ownerId: '10',
  createdAt: '2026-07-30T00:00:00.000Z',
  updatedAt: '2026-07-30T00:00:00.000Z',
};

describe('todoApi.getTodos', () => {
  it('/todos에 필터를 쿼리 파라미터로 담아 요청하고 응답 데이터를 반환한다', async () => {
    const response: TodoListResponse = {
      items: [],
      pagination: { page: 1, limit: 20, totalCount: 0, totalPages: 0 },
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: response });

    const result = await getTodos({ categoryId: '3', status: 'in_progress', page: 1, limit: 20 });

    expect(apiClient.get).toHaveBeenCalledWith('/todos', {
      params: { categoryId: '3', status: 'in_progress', page: 1, limit: 20 },
    });
    expect(result).toEqual(response);
  });
});

describe('todoApi.createTodo', () => {
  it('/todos에 POST 요청을 보내고 생성된 Todo를 반환한다', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockTodo });

    const req = { title: '제목', startDate: '2026-08-01', endDate: '2026-08-05' };
    const result = await createTodo(req);

    expect(apiClient.post).toHaveBeenCalledWith('/todos', req);
    expect(result).toEqual(mockTodo);
  });
});

describe('todoApi.updateTodo', () => {
  it('/todos/:id에 PATCH 요청을 보내고 수정된 Todo를 반환한다', async () => {
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: mockTodo });

    const req = { title: '수정된 제목' };
    const result = await updateTodo('1', req);

    expect(apiClient.patch).toHaveBeenCalledWith('/todos/1', req);
    expect(result).toEqual(mockTodo);
  });
});
