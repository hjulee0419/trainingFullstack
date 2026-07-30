import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTodo } from '@/features/todos/api/todoApi';

export function useCreateTodoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
