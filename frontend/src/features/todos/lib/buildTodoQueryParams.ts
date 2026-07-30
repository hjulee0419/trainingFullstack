import type { TodoFilterParams } from '@/features/todos/types';

export function buildTodoQueryParams(filter: TodoFilterParams): Record<string, string | number> {
  const params: Record<string, string | number> = { page: filter.page, limit: filter.limit };
  if (filter.categoryId) params.categoryId = filter.categoryId;
  if (filter.status) params.status = filter.status;
  return params;
}
