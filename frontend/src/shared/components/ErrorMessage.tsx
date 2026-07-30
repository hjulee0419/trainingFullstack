interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      style={{
        backgroundColor: 'var(--color-danger-bg)',
        color: 'var(--color-danger)',
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--space-3) var(--space-4)',
        fontSize: 'var(--font-body-size)',
        lineHeight: 'var(--font-body-line-height)',
      }}
    >
      {message}
    </div>
  );
}
