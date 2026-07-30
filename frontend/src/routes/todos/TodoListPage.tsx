import { TodoFilterBar } from '@/features/todos/components/TodoFilterBar';
import { TodoList } from '@/features/todos/components/TodoList';
import { Pagination } from '@/features/todos/components/Pagination';
import { useTodoFilterStore } from '@/features/todos/store/useTodoFilterStore';
import { useTodosQuery } from '@/features/todos/hooks/useTodosQuery';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function TodoListPage() {
  const { t } = useTranslation();
  const categoryId = useTodoFilterStore((state) => state.categoryId);
  const status = useTodoFilterStore((state) => state.status);
  const page = useTodoFilterStore((state) => state.page);
  const limit = useTodoFilterStore((state) => state.limit);
  const setPage = useTodoFilterStore((state) => state.setPage);

  const { data, isLoading, isError, error } = useTodosQuery({ categoryId, status, page, limit });

  return (
    <div className="todo-page">
      <h1 className="todo-page__title">{t('todo.page.listTitle')}</h1>
      <TodoFilterBar />
      <TodoList
        items={data?.items ?? []}
        isLoading={isLoading}
        isError={isError}
        error={error}
      />
      {data && (
        <Pagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
