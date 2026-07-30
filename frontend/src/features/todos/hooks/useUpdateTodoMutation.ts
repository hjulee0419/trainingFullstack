import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTodo } from '@/features/todos/api/todoApi';
import type { UpdateTodoRequest } from '@/features/todos/api/todoApi';

export function useUpdateTodoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateTodoRequest }) => updateTodo(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
