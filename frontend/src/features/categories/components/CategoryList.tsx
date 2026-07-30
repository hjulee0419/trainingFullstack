import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { EmptyState } from '@/shared/components/EmptyState';
import { CategoryRow } from '@/features/categories/components/CategoryRow';
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery';
import { getErrorMessage } from '@/lib/errorUtils';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function CategoryList() {
  const { t } = useTranslation();
  const { data: categories, isLoading, isError, error } = useCategoriesQuery();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <ErrorMessage message={getErrorMessage(error)} />;
  }

  if (!categories || categories.length === 0) {
    return <EmptyState message={t('category.list.empty')} />;
  }

  const sortedCategories = [...categories].sort((a, b) => {
    if (a.isDefault === b.isDefault) return 0;
    return a.isDefault ? -1 : 1;
  });

  return (
    <ul className="category-list">
      {sortedCategories.map((category) => (
        <CategoryRow key={category.id} category={category} />
      ))}
    </ul>
  );
}
