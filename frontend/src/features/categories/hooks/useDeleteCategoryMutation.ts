import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteCategory } from '@/features/categories/api/categoryApi';

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
