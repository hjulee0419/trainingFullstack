import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { useSignupMutation } from '@/features/auth/hooks/useSignupMutation';
import { validateSignupForm } from '@/features/auth/lib/validateAuthForm';
import { getErrorMessage } from '@/lib/errorUtils';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface SignupFormProps {
  onSuccess: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const signupMutation = useSignupMutation();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateSignupForm({ email, password, nickname });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    signupMutation.mutate(
      { email, password, nickname },
      {
        onSuccess,
      },
    );
  }

  return (
    <form className="auth-card__form" onSubmit={handleSubmit} noValidate>
      <Input
        label={t('auth.signup.emailLabel')}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
      />
      <Input
        label={t('auth.signup.passwordLabel')}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
      />
      <Input
        label={t('auth.signup.nicknameLabel')}
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        error={fieldErrors.nickname}
      />
      {signupMutation.isError && <ErrorMessage message={getErrorMessage(signupMutation.error)} />}
      <Button type="submit" fullWidth disabled={signupMutation.isPending}>
        {signupMutation.isPending ? t('auth.signup.submitting') : t('auth.signup.submit')}
      </Button>
      <div className="auth-card__footer">
        {t('auth.signup.footerQuestion')} <Link to="/login">{t('auth.signup.footerLink')}</Link>
      </div>
    </form>
  );
}
