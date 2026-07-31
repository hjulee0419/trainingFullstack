import type { TranslationKey } from '@/lib/i18n/translations';
import type { TodoStatus } from '@/features/todos/types';
import type { StatusColor } from '@/features/todos/store/useStatusDisplayStore';

export const STATUS_ORDER: TodoStatus[] = ['not_started', 'in_progress', 'completed', 'overdue'];

export const defaultStatusLabelKeys: Record<TodoStatus, TranslationKey> = {
  not_started: 'todo.status.notStarted',
  in_progress: 'todo.status.inProgress',
  completed: 'todo.status.completed',
  overdue: 'todo.status.overdue',
};

// <input type="color">는 hex 값만 받을 수 있어 CSS var() 대신 실제 디자인 토큰 hex 값을 별도로 둔다.
// (docs/9-style-guide.md 3.3절 상태 색상과 동일한 값)
export const defaultStatusColorHex: Record<TodoStatus, StatusColor> = {
  not_started: { bg: '#f0f1f3', text: '#6b7280' },
  in_progress: { bg: '#e9edfe', text: '#4361ee' },
  completed: { bg: '#e3f9ee', text: '#0e9f6e' },
  overdue: { bg: '#fdecec', text: '#d92d20' },
};

export const defaultStatusColors: Record<TodoStatus, StatusColor> = {
  not_started: {
    bg: 'var(--color-status-not-started-bg)',
    text: 'var(--color-status-not-started-text)',
  },
  in_progress: {
    bg: 'var(--color-status-in-progress-bg)',
    text: 'var(--color-status-in-progress-text)',
  },
  completed: {
    bg: 'var(--color-status-completed-bg)',
    text: 'var(--color-status-completed-text)',
  },
  overdue: {
    bg: 'var(--color-status-overdue-bg)',
    text: 'var(--color-status-overdue-text)',
  },
};
