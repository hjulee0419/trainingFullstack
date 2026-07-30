import { useNavigate } from 'react-router-dom';
import { SignupForm } from '@/features/auth/components/SignupForm';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <span className="auth-page__logo">TodoList</span>
      <div className="auth-card">
        <h1 className="auth-card__title">{t('auth.signup.title')}</h1>
        <SignupForm onSuccess={() => navigate('/login', { replace: true })} />
      </div>
    </div>
  );
}
