import { Link } from 'react-router-dom';
import { CategoryForm } from '@/features/categories/components/CategoryForm';
import { CategoryList } from '@/features/categories/components/CategoryList';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function CategoryManagePage() {
  const { t } = useTranslation();

  return (
    <div className="category-page">
      <Link to="/todos" className="category-page__back-link">
        {t('category.page.backLink')}
      </Link>
      <h1 className="category-page__title">{t('category.page.title')}</h1>
      <CategoryForm />
      <CategoryList />
    </div>
  );
}
