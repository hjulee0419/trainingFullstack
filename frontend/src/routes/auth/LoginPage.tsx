import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/features/auth/components/LoginForm';

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <span className="auth-page__logo">TodoList</span>
      <div className="auth-card">
        <h1 className="auth-card__title">로그인</h1>
        <LoginForm onSuccess={() => navigate('/todos', { replace: true })} />
      </div>
    </div>
  );
}
