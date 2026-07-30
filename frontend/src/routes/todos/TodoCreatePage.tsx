import { Link, useNavigate } from 'react-router-dom';
import { TodoForm } from '@/features/todos/components/TodoForm';
import { useCreateTodoMutation } from '@/features/todos/hooks/useCreateTodoMutation';
import type { TodoFormValues } from '@/features/todos/lib/validateTodoForm';

export function TodoCreatePage() {
  const navigate = useNavigate();
  const createTodoMutation = useCreateTodoMutation();

  function handleSubmit(values: TodoFormValues) {
    createTodoMutation.mutate(
      {
        title: values.title,
        description: values.description || undefined,
        categoryId: values.categoryId || undefined,
        startDate: values.startDate,
        endDate: values.endDate,
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
      <h1 className="todo-page__title">할일 등록</h1>
      <TodoForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createTodoMutation.isPending}
        submitError={createTodoMutation.error}
      />
    </div>
  );
}
