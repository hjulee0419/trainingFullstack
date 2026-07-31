import { useNavigate } from 'react-router-dom';
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery';
import { useTodoFilterStore } from '@/features/todos/store/useTodoFilterStore';
import { useStatusDisplay } from '@/features/todos/hooks/useStatusDisplay';
import { STATUS_ORDER } from '@/features/todos/lib/statusDisplayDefaults';
import { Button } from '@/shared/components/Button';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { TodoStatus } from '@/features/todos/types';

function StatusOption({ status }: { status: TodoStatus }) {
  const { label } = useStatusDisplay(status);
  return <option value={status}>{label}</option>;
}

export function TodoFilterBar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
            {t('todo.filter.categoryLabel')}
          </label>
          <select
            id="todo-filter-category"
            className="todo-filter-bar__select"
            value={categoryId ?? ''}
            onChange={(e) => setCategoryId(e.target.value || undefined)}
          >
            <option value="">{t('todo.filter.allOption')}</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="todo-filter-bar__field">
          <label htmlFor="todo-filter-status" className="todo-filter-bar__label">
            {t('todo.filter.statusLabel')}
          </label>
          <select
            id="todo-filter-status"
            className="todo-filter-bar__select"
            value={status ?? ''}
            onChange={(e) => setStatus((e.target.value || undefined) as TodoStatus | undefined)}
          >
            <option value="">{t('todo.filter.allOption')}</option>
            {STATUS_ORDER.map((s) => (
              <StatusOption key={s} status={s} />
            ))}
          </select>
        </div>
      </div>
      <Button onClick={() => navigate('/todos/new')}>{t('todo.filter.newTodoButton')}</Button>
    </div>
  );
}
