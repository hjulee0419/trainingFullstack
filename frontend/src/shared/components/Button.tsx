import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  variant?: ButtonVariant;
  children: ReactNode;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  disabled?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-white)',
    border: '1px solid var(--color-primary)',
  },
  secondary: {
    backgroundColor: 'var(--color-white)',
    color: 'var(--color-gray-900)',
    border: '1px solid var(--color-gray-300)',
  },
  danger: {
    backgroundColor: 'var(--color-white)',
    color: 'var(--color-danger)',
    border: '1px solid var(--color-danger)',
  },
};

export function Button({
  variant = 'primary',
  children,
  onClick,
  type = 'button',
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variantStyles[variant],
        height: 36,
        padding: `0 var(--space-4)`,
        borderRadius: 'var(--radius-sm)',
        fontSize: 'var(--font-body-medium-size)',
        fontWeight: 'var(--font-body-medium-weight)',
        lineHeight: 'var(--font-body-medium-line-height)',
        width: fullWidth ? '100%' : undefined,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseOver={(e) => {
        if (disabled) return;
        if (variant === 'primary') {
          e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
          e.currentTarget.style.borderColor = 'var(--color-primary-hover)';
        } else if (variant === 'danger') {
          e.currentTarget.style.backgroundColor = 'var(--color-danger-bg)';
        }
      }}
      onMouseOut={(e) => {
        if (disabled) return;
        if (variant === 'primary') {
          e.currentTarget.style.backgroundColor = 'var(--color-primary)';
          e.currentTarget.style.borderColor = 'var(--color-primary)';
        } else if (variant === 'danger') {
          e.currentTarget.style.backgroundColor = 'var(--color-white)';
        }
      }}
    >
      {children}
    </button>
  );
}
