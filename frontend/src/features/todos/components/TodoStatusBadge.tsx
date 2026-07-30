import type { TodoStatus } from '@/features/todos/types';

interface TodoStatusBadgeProps {
  status: TodoStatus;
}

const statusConfig: Record<TodoStatus, { label: string; bg: string; text: string }> = {
  not_started: {
    label: '시작 전',
    bg: 'var(--color-status-not-started-bg)',
    text: 'var(--color-status-not-started-text)',
  },
  in_progress: {
    label: '진행중',
    bg: 'var(--color-status-in-progress-bg)',
    text: 'var(--color-status-in-progress-text)',
  },
  completed: {
    label: '완료',
    bg: 'var(--color-status-completed-bg)',
    text: 'var(--color-status-completed-text)',
  },
  overdue: {
    label: '기한초과',
    bg: 'var(--color-status-overdue-bg)',
    text: 'var(--color-status-overdue-text)',
  },
};

export function TodoStatusBadge({ status }: TodoStatusBadgeProps) {
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
      {config.label}
    </span>
  );
}
