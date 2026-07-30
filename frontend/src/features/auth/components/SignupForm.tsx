import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { useSignupMutation } from '@/features/auth/hooks/useSignupMutation';
import { validateSignupForm } from '@/features/auth/lib/validateAuthForm';
import { getErrorMessage } from '@/lib/errorUtils';

interface SignupFormProps {
  onSuccess: () => void;
}

export function SignupForm({ onSuccess }: SignupFormProps) {
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
      <Input
        label="닉네임"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        error={fieldErrors.nickname}
      />
      {signupMutation.isError && <ErrorMessage message={getErrorMessage(signupMutation.error)} />}
      <Button type="submit" fullWidth disabled={signupMutation.isPending}>
        {signupMutation.isPending ? '가입 처리 중...' : '가입하기'}
      </Button>
      <div className="auth-card__footer">
        이미 계정이 있으신가요? <Link to="/login">로그인 하기</Link>
      </div>
    </form>
  );
}
