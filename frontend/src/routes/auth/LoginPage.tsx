import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <span className="auth-page__logo">TodoList</span>
      <div className="auth-card">
        <h1 className="auth-card__title">{t('auth.login.title')}</h1>
        <LoginForm onSuccess={() => navigate('/dashboard', { replace: true })} />
      </div>
    </div>
  );
}
