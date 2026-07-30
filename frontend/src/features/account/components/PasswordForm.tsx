import { useState, type FormEvent } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { useUpdatePasswordMutation } from '@/features/account/hooks/useUpdatePasswordMutation';
import { validatePasswordForm, type PasswordFormErrors } from '@/features/account/lib/validateAccountForm';
import { getErrorMessage } from '@/lib/errorUtils';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function PasswordForm() {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<PasswordFormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const updatePasswordMutation = useUpdatePasswordMutation();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage(null);

    if (!newPassword) {
      setFieldErrors({ newPassword: t('account.password.required') });
      return;
    }

    const errors = validatePasswordForm({ newPassword, newPasswordConfirm });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    updatePasswordMutation.mutate(newPassword, {
      onSuccess: () => {
        setSuccessMessage(t('account.password.success'));
        setNewPassword('');
        setNewPasswordConfirm('');
      },
    });
  }

  return (
    <form className="account-form" onSubmit={handleSubmit} noValidate>
      <Input
        label={t('account.password.label')}
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        error={fieldErrors.newPassword}
      />
      <Input
        label={t('account.password.confirmLabel')}
        type="password"
        value={newPasswordConfirm}
        onChange={(e) => setNewPasswordConfirm(e.target.value)}
        error={fieldErrors.newPasswordConfirm}
      />
      {updatePasswordMutation.isError && (
        <ErrorMessage message={getErrorMessage(updatePasswordMutation.error)} />
      )}
      {successMessage && !updatePasswordMutation.isError && (
        <p className="account-form__success">{successMessage}</p>
      )}
      <Button type="submit" disabled={updatePasswordMutation.isPending}>
        {updatePasswordMutation.isPending ? t('account.password.saving') : t('account.password.submit')}
      </Button>
    </form>
  );
}
