import { useNavigate } from 'react-router-dom';
import { SignupForm } from '@/features/auth/components/SignupForm';

export function SignupPage() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <span className="auth-page__logo">TodoList</span>
      <div className="auth-card">
        <h1 className="auth-card__title">회원가입</h1>
        <SignupForm onSuccess={() => navigate('/login', { replace: true })} />
      </div>
    </div>
  );
}
