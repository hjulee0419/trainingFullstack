import { apiClient } from '@/api/client';
import { buildTodoQueryParams } from '@/features/todos/lib/buildTodoQueryParams';
import type { Todo, TodoFilterParams, TodoListResponse } from '@/features/todos/types';

export function getTodos(filter: TodoFilterParams): Promise<TodoListResponse> {
  return apiClient
    .get<TodoListResponse>('/todos', { params: buildTodoQueryParams(filter) })
    .then((res) => res.data);
}

export interface CreateTodoRequest {
  title: string;
  description?: string;
  categoryId?: string;
  startDate: string;
  endDate: string;
}

export type UpdateTodoRequest = Partial<CreateTodoRequest> & { isCompleted?: boolean };

export function createTodo(req: CreateTodoRequest): Promise<Todo> {
  return apiClient.post<Todo>('/todos', req).then((res) => res.data);
}

export function updateTodo(id: string, req: UpdateTodoRequest): Promise<Todo> {
  return apiClient.patch<Todo>(`/todos/${id}`, req).then((res) => res.data);
}
