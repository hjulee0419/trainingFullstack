import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { useLoginMutation } from '@/features/auth/hooks/useLoginMutation';
import { validateLoginForm } from '@/features/auth/lib/validateAuthForm';
import { getErrorMessage } from '@/lib/errorUtils';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const loginMutation = useLoginMutation();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateLoginForm({ email, password });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    loginMutation.mutate(
      { email, password },
      {
        onSuccess,
      },
    );
  }

  return (
    <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
      <Input
        label={t('auth.login.emailLabel')}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
      />
      <Input
        label={t('auth.login.passwordLabel')}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
      />
      {loginMutation.isError && <ErrorMessage message={getErrorMessage(loginMutation.error)} />}
      <Button type="submit" fullWidth disabled={loginMutation.isPending}>
        {loginMutation.isPending ? t('auth.login.submitting') : t('auth.login.submit')}
      </Button>
      <div className="auth-card__footer">
        {t('auth.login.footerQuestion')} <Link to="/signup">{t('auth.login.footerLink')}</Link>
      </div>
    </form>
  );
}
