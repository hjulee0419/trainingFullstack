import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { TodoForm } from '@/features/todos/components/TodoForm';
import { useUpdateTodoMutation } from '@/features/todos/hooks/useUpdateTodoMutation';
import type { TodoFormValues } from '@/features/todos/lib/validateTodoForm';
import type { Todo } from '@/features/todos/types';

interface TodoEditLocationState {
  todo?: Todo;
}

export function TodoEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const state = location.state as TodoEditLocationState | null;
  const todo = state?.todo;

  const updateTodoMutation = useUpdateTodoMutation();

  if (!todo || !id) {
    return (
      <div className="todo-page">
        <Link to="/todos" className="category-page__back-link">
          ← 목록으로
        </Link>
        <h1 className="todo-page__title">할일 수정</h1>
        <p className="todo-page__notice">
          목록에서 다시 시도해주세요.{' '}
          <Link to="/todos">할일 목록으로 돌아가기</Link>
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
        ← 목록으로
      </Link>
      <h1 className="todo-page__title">할일 수정</h1>
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
