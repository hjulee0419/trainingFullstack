import { useTranslation } from '@/lib/i18n/useTranslation';

interface LoadingSpinnerProps {
  size?: number;
}

export function LoadingSpinner({ size = 24 }: LoadingSpinnerProps) {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-label={t('common.loading')}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `${Math.max(2, size / 8)}px solid var(--color-gray-100)`,
          borderTopColor: 'var(--color-primary)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>
        {`@keyframes spin { to { transform: rotate(360deg); } }`}
      </style>
    </div>
  );
}
