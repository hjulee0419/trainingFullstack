import { useLocaleStore } from '@/features/locale/useLocaleStore';
import { translate } from '@/lib/i18n/useTranslation';

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateSignupForm(form: {
  email: string;
  password: string;
  nickname: string;
}): Record<string, string> {
  const locale = useLocaleStore.getState().locale;
  const errors: Record<string, string> = {};
  if (!form.email.trim()) errors.email = translate(locale, 'auth.validation.emailRequired');
  else if (!validateEmail(form.email)) errors.email = translate(locale, 'auth.validation.emailInvalid');
  if (!form.password || form.password.length < 8) {
    errors.password = translate(locale, 'auth.validation.passwordTooShort');
  }
  if (!form.nickname.trim()) errors.nickname = translate(locale, 'auth.validation.nicknameRequired');
  return errors;
}

export function validateLoginForm(form: { email: string; password: string }): Record<string, string> {
  const locale = useLocaleStore.getState().locale;
  const errors: Record<string, string> = {};
  if (!form.email.trim()) errors.email = translate(locale, 'auth.validation.emailRequired');
  if (!form.password) errors.password = translate(locale, 'auth.validation.passwordRequired');
  return errors;
}
