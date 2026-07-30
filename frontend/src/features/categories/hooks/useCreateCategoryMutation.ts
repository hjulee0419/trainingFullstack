import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory } from '@/features/categories/api/categoryApi';

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
