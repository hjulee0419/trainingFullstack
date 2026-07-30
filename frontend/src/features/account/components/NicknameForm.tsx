import { useState, type FormEvent } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { useUpdateNicknameMutation } from '@/features/account/hooks/useUpdateNicknameMutation';
import { getErrorMessage } from '@/lib/errorUtils';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface NicknameFormProps {
  initialNickname: string;
}

export function NicknameForm({ initialNickname }: NicknameFormProps) {
  const { t } = useTranslation();
  const [nickname, setNickname] = useState(initialNickname);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const updateNicknameMutation = useUpdateNicknameMutation();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage(null);

    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      setFieldError(t('account.nickname.required'));
      return;
    }
    setFieldError(undefined);

    updateNicknameMutation.mutate(trimmedNickname, {
      onSuccess: () => {
        setSuccessMessage(t('account.nickname.success'));
      },
    });
  }

  return (
    <form className="account-form" onSubmit={handleSubmit} noValidate>
      <Input
        label={t('account.nickname.label')}
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
        {updateNicknameMutation.isPending ? t('account.nickname.saving') : t('account.nickname.submit')}
      </Button>
    </form>
  );
}
