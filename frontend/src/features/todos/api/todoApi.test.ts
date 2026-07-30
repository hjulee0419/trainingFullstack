// FE-4 완료조건 1/2/5의 전제: todoApi.getTodos가 buildTodoQueryParams로 변환한 필터를
// apiClient 쿼리 파라미터로 전달하고, 응답 데이터(items+pagination)를 그대로 반환하는지 확인한다.
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from '@/api/client';
import { getTodos } from '@/features/todos/api/todoApi';
import type { TodoListResponse } from '@/features/todos/types';

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
