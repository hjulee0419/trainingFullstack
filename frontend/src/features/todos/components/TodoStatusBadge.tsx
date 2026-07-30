import { useTranslation } from '@/lib/i18n/useTranslation';
import type { TranslationKey } from '@/lib/i18n/translations';
import type { TodoStatus } from '@/features/todos/types';

interface TodoStatusBadgeProps {
  status: TodoStatus;
}

const statusConfig: Record<TodoStatus, { labelKey: TranslationKey; bg: string; text: string }> = {
  not_started: {
    labelKey: 'todo.status.notStarted',
    bg: 'var(--color-status-not-started-bg)',
    text: 'var(--color-status-not-started-text)',
  },
  in_progress: {
    labelKey: 'todo.status.inProgress',
    bg: 'var(--color-status-in-progress-bg)',
    text: 'var(--color-status-in-progress-text)',
  },
  completed: {
    labelKey: 'todo.status.completed',
    bg: 'var(--color-status-completed-bg)',
    text: 'var(--color-status-completed-text)',
  },
  overdue: {
    labelKey: 'todo.status.overdue',
    bg: 'var(--color-status-overdue-bg)',
    text: 'var(--color-status-overdue-text)',
  },
};

export function TodoStatusBadge({ status }: TodoStatusBadgeProps) {
  const { t } = useTranslation();
  const config = statusConfig[status];

  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: 'var(--radius-pill)',
        padding: '0 var(--space-2)',
        fontSize: 'var(--font-caption-size)',
        lineHeight: 'var(--font-caption-line-height)',
        fontWeight: 500,
        backgroundColor: config.bg,
        color: config.text,
        whiteSpace: 'nowrap',
      }}
    >
      {t(config.labelKey)}
    </span>
  );
}
