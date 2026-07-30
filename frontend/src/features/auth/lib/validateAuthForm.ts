export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateSignupForm(form: {
  email: string;
  password: string;
  nickname: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.email.trim()) errors.email = '이메일을 입력해주세요.';
  else if (!validateEmail(form.email)) errors.email = '이메일 형식이 올바르지 않습니다.';
  if (!form.password || form.password.length < 8) {
    errors.password = '비밀번호는 최소 8자 이상이어야 합니다.';
  }
  if (!form.nickname.trim()) errors.nickname = '닉네임을 입력해주세요.';
  return errors;
}

export function validateLoginForm(form: { email: string; password: string }): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.email.trim()) errors.email = '이메일을 입력해주세요.';
  if (!form.password) errors.password = '비밀번호를 입력해주세요.';
  return errors;
}
