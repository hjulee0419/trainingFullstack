import { useStatusDisplay } from '@/features/todos/hooks/useStatusDisplay';
import type { TodoStatus } from '@/features/todos/types';

interface TodoStatusBadgeProps {
  status: TodoStatus;
}

export function TodoStatusBadge({ status }: TodoStatusBadgeProps) {
  const { label, color } = useStatusDisplay(status);

  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: 'var(--radius-pill)',
        padding: '0 var(--space-2)',
        fontSize: 'var(--font-caption-size)',
        lineHeight: 'var(--font-caption-line-height)',
        fontWeight: 500,
        backgroundColor: color.bg,
        color: color.text,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
