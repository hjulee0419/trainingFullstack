import { useNavigate } from 'react-router-dom';
import { TodoStatusBadge } from '@/features/todos/components/TodoStatusBadge';
import type { Todo } from '@/features/todos/types';

interface TodoListItemProps {
  todo: Todo;
}

function formatCompletedAt(completedAt: string): string {
  return completedAt.slice(0, 16).replace('T', ' ');
}

export function TodoListItem({ todo }: TodoListItemProps) {
  const navigate = useNavigate();

  function handleClick() {
    navigate(`/todos/${todo.id}/edit`, { state: { todo } });
  }

  return (
    <li
      className="todo-list-item"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="todo-list-item__row">
        <TodoStatusBadge status={todo.status} />
        <span className="todo-list-item__title">{todo.title}</span>
        <span className="todo-list-item__category">{todo.categoryName}</span>
      </div>
      <div className="todo-list-item__footer">
        <span className="todo-list-item__date">
          {todo.startDate} ~ {todo.endDate}
        </span>
        {todo.isCompleted && todo.completedAt && (
          <span className="todo-list-item__completed-at">
            완료일시 {formatCompletedAt(todo.completedAt)}
          </span>
        )}
      </div>
    </li>
  );
}
