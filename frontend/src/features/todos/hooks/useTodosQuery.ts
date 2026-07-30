import { useQuery } from '@tanstack/react-query';
import { getTodos } from '@/features/todos/api/todoApi';
import type { TodoFilterParams } from '@/features/todos/types';

export function useTodosQuery(filter: TodoFilterParams) {
  return useQuery({
    queryKey: ['todos', filter],
    queryFn: () => getTodos(filter),
  });
}
