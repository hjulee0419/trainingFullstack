import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { useLoginMutation } from '@/features/auth/hooks/useLoginMutation';
import { validateLoginForm } from '@/features/auth/lib/validateAuthForm';
import { getErrorMessage } from '@/lib/errorUtils';

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
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
        label="이메일"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
      />
      <Input
        label="비밀번호"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
      />
      {loginMutation.isError && <ErrorMessage message={getErrorMessage(loginMutation.error)} />}
      <Button type="submit" fullWidth disabled={loginMutation.isPending}>
        {loginMutation.isPending ? '로그인 중...' : '로그인'}
      </Button>
      <div className="auth-card__footer">
        계정이 없으신가요? <Link to="/signup">회원가입 하기</Link>
      </div>
    </form>
  );
}
