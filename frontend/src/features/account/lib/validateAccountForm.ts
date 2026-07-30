import { useLocaleStore } from '@/features/locale/useLocaleStore';
import { translate } from '@/lib/i18n/useTranslation';

const MIN_PASSWORD_LENGTH = 8;

export interface PasswordFormValues {
  newPassword: string;
  newPasswordConfirm: string;
}

export interface PasswordFormErrors {
  newPassword?: string;
  newPasswordConfirm?: string;
}

export function validatePasswordForm(values: PasswordFormValues): PasswordFormErrors {
  const errors: PasswordFormErrors = {};
  const locale = useLocaleStore.getState().locale;

  if (!values.newPassword) {
    return errors;
  }

  if (values.newPassword.length < MIN_PASSWORD_LENGTH) {
    errors.newPassword = translate(locale, 'account.validation.passwordTooShort', {
      min: MIN_PASSWORD_LENGTH,
    });
  }

  if (values.newPassword !== values.newPasswordConfirm) {
    errors.newPasswordConfirm = translate(locale, 'account.validation.passwordMismatch');
  }

  return errors;
}
