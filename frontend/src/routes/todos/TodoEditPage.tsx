import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { TodoForm } from '@/features/todos/components/TodoForm';
import { useUpdateTodoMutation } from '@/features/todos/hooks/useUpdateTodoMutation';
import type { TodoFormValues } from '@/features/todos/lib/validateTodoForm';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { Todo } from '@/features/todos/types';

interface TodoEditLocationState {
  todo?: Todo;
}

export function TodoEditPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const state = location.state as TodoEditLocationState | null;
  const todo = state?.todo;

  const updateTodoMutation = useUpdateTodoMutation();

  if (!todo || !id) {
    return (
      <div className="todo-page">
        <Link to="/todos" className="category-page__back-link">
          {t('todo.page.backLink')}
        </Link>
        <h1 className="todo-page__title">{t('todo.page.editTitle')}</h1>
        <p className="todo-page__notice">
          {t('todo.page.editNotice')}{' '}
          <Link to="/todos">{t('todo.page.editNoticeLink')}</Link>
        </p>
      </div>
    );
  }

  const initialValues: TodoFormValues = {
    title: todo.title,
    description: todo.description ?? '',
    categoryId: todo.categoryId,
    startDate: todo.startDate,
    endDate: todo.endDate,
  };

  function handleSubmit(values: TodoFormValues) {
    updateTodoMutation.mutate(
      {
        id: id as string,
        req: {
          title: values.title,
          description: values.description || undefined,
          categoryId: values.categoryId || undefined,
          startDate: values.startDate,
          endDate: values.endDate,
        },
      },
      {
        onSuccess: () => {
          navigate('/todos');
        },
      },
    );
  }

  return (
    <div className="todo-page">
      <Link to="/todos" className="category-page__back-link">
        {t('todo.page.backLink')}
      </Link>
      <h1 className="todo-page__title">{t('todo.page.editTitle')}</h1>
      <TodoForm
        mode="edit"
        initialValues={initialValues}
        onSubmit={handleSubmit}
        isSubmitting={updateTodoMutation.isPending}
        submitError={updateTodoMutation.error}
      />
    </div>
  );
}
