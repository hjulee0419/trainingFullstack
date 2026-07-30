import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTodo } from '@/features/todos/api/todoApi';

export function useToggleTodoCompleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      updateTodo(id, { isCompleted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
