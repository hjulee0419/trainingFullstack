import { Link } from 'react-router-dom';
import { CategoryForm } from '@/features/categories/components/CategoryForm';
import { CategoryList } from '@/features/categories/components/CategoryList';

export function CategoryManagePage() {
  return (
    <div className="category-page">
      <Link to="/todos" className="category-page__back-link">
        ← 목록으로
      </Link>
      <h1 className="category-page__title">카테고리 관리</h1>
      <CategoryForm />
      <CategoryList />
    </div>
  );
}
