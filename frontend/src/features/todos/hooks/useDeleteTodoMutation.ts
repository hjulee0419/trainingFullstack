import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTodo } from '@/features/todos/api/todoApi';

export function useDeleteTodoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
