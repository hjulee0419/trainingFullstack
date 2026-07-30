import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { EmptyState } from '@/shared/components/EmptyState';
import { getErrorMessage } from '@/lib/errorUtils';
import { TodoListItem } from '@/features/todos/components/TodoListItem';
import type { Todo } from '@/features/todos/types';

interface TodoListProps {
  items: Todo[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
}

export function TodoList({ items, isLoading, isError, error }: TodoListProps) {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return <ErrorMessage message={getErrorMessage(error)} />;
  }

  if (items.length === 0) {
    return <EmptyState message="등록된 할일이 없습니다." />;
  }

  return (
    <ul className="todo-list">
      {items.map((todo) => (
        <TodoListItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
