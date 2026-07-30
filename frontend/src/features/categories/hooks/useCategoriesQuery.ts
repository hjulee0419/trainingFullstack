import { useQuery } from '@tanstack/react-query';
import { getCategories } from '@/features/categories/api/categoryApi';

export function useCategoriesQuery() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });
}
