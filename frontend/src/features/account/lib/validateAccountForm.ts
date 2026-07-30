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

  if (!values.newPassword) {
    return errors;
  }

  if (values.newPassword.length < MIN_PASSWORD_LENGTH) {
    errors.newPassword = `비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`;
  }

  if (values.newPassword !== values.newPasswordConfirm) {
    errors.newPasswordConfirm = '비밀번호가 일치하지 않습니다.';
  }

  return errors;
}
