import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TodoStatusBadge } from '@/features/todos/components/TodoStatusBadge';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useToggleTodoCompleteMutation } from '@/features/todos/hooks/useToggleTodoCompleteMutation';
import { useDeleteTodoMutation } from '@/features/todos/hooks/useDeleteTodoMutation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { Todo } from '@/features/todos/types';

interface TodoListItemProps {
  todo: Todo;
}

function formatCompletedAt(completedAt: string): string {
  return completedAt.slice(0, 16).replace('T', ' ');
}

export function TodoListItem({ todo }: TodoListItemProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const toggleCompleteMutation = useToggleTodoCompleteMutation();
  const deleteTodoMutation = useDeleteTodoMutation();

  function handleClick() {
    navigate(`/todos/${todo.id}/edit`, { state: { todo } });
  }

  function handleToggleComplete(e: React.MouseEvent | React.ChangeEvent) {
    e.stopPropagation();
    toggleCompleteMutation.mutate({ id: todo.id, isCompleted: !todo.isCompleted });
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  }

  function handleDeleteConfirm() {
    deleteTodoMutation.mutate(todo.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
      },
    });
  }

  function handleDeleteCancel() {
    setIsDeleteDialogOpen(false);
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
        <input
          type="checkbox"
          className="todo-list-item__checkbox"
          checked={todo.isCompleted}
          onClick={(e) => e.stopPropagation()}
          onChange={handleToggleComplete}
          disabled={toggleCompleteMutation.isPending}
          aria-label={t('todo.item.completeCheckboxLabel')}
        />
        <TodoStatusBadge status={todo.status} />
        <span className="todo-list-item__title">{todo.title}</span>
        <span className="todo-list-item__category">{todo.categoryName}</span>
        <button
          type="button"
          className="todo-list-item__delete-button"
          onClick={handleDeleteClick}
          aria-label={t('todo.item.deleteButtonLabel')}
        >
          {t('common.delete')}
        </button>
      </div>
      <div className="todo-list-item__footer">
        <span className="todo-list-item__date">
          {todo.startDate} ~ {todo.endDate}
        </span>
        {todo.isCompleted && todo.completedAt && (
          <span className="todo-list-item__completed-at">
            {t('todo.item.completedAtLabel', { datetime: formatCompletedAt(todo.completedAt) })}
          </span>
        )}
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <ConfirmDialog
          open={isDeleteDialogOpen}
          message={t('todo.item.deleteConfirm', { title: todo.title })}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      </div>
    </li>
  );
}
