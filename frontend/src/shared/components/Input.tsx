import { useId, type ChangeEventHandler } from 'react';

interface InputProps {
  label?: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  error?: string;
  type?: string;
  placeholder?: string;
  id?: string;
}

export function Input({
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  id,
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: 'var(--font-caption-size)',
            lineHeight: 'var(--font-caption-line-height)',
            color: 'var(--color-gray-700)',
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          height: 36,
          borderRadius: 'var(--radius-sm)',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-gray-300)'}`,
          backgroundColor: 'var(--color-white)',
          padding: '0 var(--space-3)',
          fontSize: 'var(--font-body-size)',
          lineHeight: 'var(--font-body-line-height)',
          color: 'var(--color-gray-900)',
        }}
      />
      {error && (
        <span
          style={{
            fontSize: 'var(--font-caption-size)',
            lineHeight: 'var(--font-caption-line-height)',
            color: 'var(--color-danger)',
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
