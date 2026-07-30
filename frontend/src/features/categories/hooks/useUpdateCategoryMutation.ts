import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCategory } from '@/features/categories/api/categoryApi';
import type { UpdateCategoryRequest } from '@/features/categories/types';

interface UpdateCategoryVariables {
  id: string;
  req: UpdateCategoryRequest;
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, req }: UpdateCategoryVariables) => updateCategory(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
