import { useNavigate } from 'react-router-dom';
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery';
import { useTodoFilterStore } from '@/features/todos/store/useTodoFilterStore';
import { Button } from '@/shared/components/Button';
import type { TodoStatus } from '@/features/todos/types';

const statusOptions: { value: TodoStatus; label: string }[] = [
  { value: 'not_started', label: '시작 전' },
  { value: 'in_progress', label: '진행중' },
  { value: 'completed', label: '완료' },
  { value: 'overdue', label: '기한초과' },
];

export function TodoFilterBar() {
  const navigate = useNavigate();
  const { data: categories } = useCategoriesQuery();
  const categoryId = useTodoFilterStore((state) => state.categoryId);
  const status = useTodoFilterStore((state) => state.status);
  const setCategoryId = useTodoFilterStore((state) => state.setCategoryId);
  const setStatus = useTodoFilterStore((state) => state.setStatus);

  return (
    <div className="todo-filter-bar">
      <div className="todo-filter-bar__fields">
        <div className="todo-filter-bar__field">
          <label htmlFor="todo-filter-category" className="todo-filter-bar__label">
            카테고리
          </label>
          <select
            id="todo-filter-category"
            className="todo-filter-bar__select"
            value={categoryId ?? ''}
            onChange={(e) => setCategoryId(e.target.value || undefined)}
          >
            <option value="">전체</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="todo-filter-bar__field">
          <label htmlFor="todo-filter-status" className="todo-filter-bar__label">
            상태
          </label>
          <select
            id="todo-filter-status"
            className="todo-filter-bar__select"
            value={status ?? ''}
            onChange={(e) => setStatus((e.target.value || undefined) as TodoStatus | undefined)}
          >
            <option value="">전체</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button onClick={() => navigate('/todos/new')}>+ 새 할일</Button>
    </div>
  );
}
