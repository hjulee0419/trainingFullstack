// FE-2 완료조건 1(회원가입 폼 클라이언트 측 검증: 이메일 형식/필수값)을 검증하는
// 순수 함수 단위 테스트. validateLoginForm 관련 로직은 완료조건 3(E-8 일반화 메시지)의
// 전제가 되는 "필수값 누락 시 API 호출 자체를 막는다"는 동작을 뒷받침한다.
import { describe, expect, it } from 'vitest';
import {
  validateEmail,
  validateLoginForm,
  validateSignupForm,
} from '@/features/auth/lib/validateAuthForm';

describe('validateEmail', () => {
  it('유효한 이메일 형식이면 true를 반환한다', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('이메일 형식이 아니면 false를 반환한다', () => {
    expect(validateEmail('not-an-email')).toBe(false);
  });

  it('빈 문자열이면 false를 반환한다', () => {
    expect(validateEmail('')).toBe(false);
  });
});

describe('validateSignupForm', () => {
  it('이메일 형식이 올바르지 않으면 email 에러를 반환한다', () => {
    const errors = validateSignupForm({
      email: 'not-an-email',
      password: 'password123',
      nickname: '테스터',
    });

    expect(errors.email).toBeDefined();
  });

  it('이메일이 누락되면 email 에러를 반환한다', () => {
    const errors = validateSignupForm({
      email: '',
      password: 'password123',
      nickname: '테스터',
    });

    expect(errors.email).toBeDefined();
  });

  it('비밀번호가 7자 미만이면 password 에러를 반환한다', () => {
    const errors = validateSignupForm({
      email: 'user@example.com',
      password: '1234567',
      nickname: '테스터',
    });

    expect(errors.password).toBeDefined();
  });

  it('닉네임이 누락되면 nickname 에러를 반환한다', () => {
    const errors = validateSignupForm({
      email: 'user@example.com',
      password: 'password123',
      nickname: '',
    });

    expect(errors.nickname).toBeDefined();
  });

  it('모든 값이 유효하면 빈 객체를 반환한다', () => {
    const errors = validateSignupForm({
      email: 'user@example.com',
      password: 'password123',
      nickname: '테스터',
    });

    expect(errors).toEqual({});
  });
});

describe('validateLoginForm', () => {
  it('이메일이 누락되면 email 에러를 반환한다', () => {
    const errors = validateLoginForm({ email: '', password: 'password123' });

    expect(errors.email).toBeDefined();
  });

  it('비밀번호가 누락되면 password 에러를 반환한다', () => {
    const errors = validateLoginForm({ email: 'user@example.com', password: '' });

    expect(errors.password).toBeDefined();
  });

  it('이메일/비밀번호가 모두 있으면 빈 객체를 반환한다', () => {
    const errors = validateLoginForm({ email: 'user@example.com', password: 'password123' });

    expect(errors).toEqual({});
  });
});
