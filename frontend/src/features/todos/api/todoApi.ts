import { apiClient } from '@/api/client';
import { buildTodoQueryParams } from '@/features/todos/lib/buildTodoQueryParams';
import type { TodoFilterParams, TodoListResponse } from '@/features/todos/types';

export function getTodos(filter: TodoFilterParams): Promise<TodoListResponse> {
  return apiClient
    .get<TodoListResponse>('/todos', { params: buildTodoQueryParams(filter) })
    .then((res) => res.data);
}
