import type { ReactNode } from 'react';

interface EmptyStateProps {
  message: string;
  icon?: ReactNode;
}

export function EmptyState({ message, icon }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-8)',
        color: 'var(--color-gray-500)',
      }}
    >
      {icon}
      <p
        style={{
          fontSize: 'var(--font-body-size)',
          lineHeight: 'var(--font-body-line-height)',
          color: 'var(--color-gray-500)',
        }}
      >
        {message}
      </p>
    </div>
  );
}
