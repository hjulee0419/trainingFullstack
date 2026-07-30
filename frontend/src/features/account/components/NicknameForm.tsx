import { useState, type FormEvent } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { useUpdateNicknameMutation } from '@/features/account/hooks/useUpdateNicknameMutation';
import { getErrorMessage } from '@/lib/errorUtils';

interface NicknameFormProps {
  initialNickname: string;
}

export function NicknameForm({ initialNickname }: NicknameFormProps) {
  const [nickname, setNickname] = useState(initialNickname);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const updateNicknameMutation = useUpdateNicknameMutation();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage(null);

    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      setFieldError('닉네임을 입력해주세요.');
      return;
    }
    setFieldError(undefined);

    updateNicknameMutation.mutate(trimmedNickname, {
      onSuccess: () => {
        setSuccessMessage('닉네임이 저장되었습니다.');
      },
    });
  }

  return (
    <form className="account-form" onSubmit={handleSubmit} noValidate>
      <Input
        label="닉네임"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        error={fieldError}
      />
      {updateNicknameMutation.isError && (
        <ErrorMessage message={getErrorMessage(updateNicknameMutation.error)} />
      )}
      {successMessage && !updateNicknameMutation.isError && (
        <p className="account-form__success">{successMessage}</p>
      )}
      <Button type="submit" disabled={updateNicknameMutation.isPending}>
        {updateNicknameMutation.isPending ? '저장 중...' : '닉네임 저장'}
      </Button>
    </form>
  );
}
