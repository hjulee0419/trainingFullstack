// FE-7 완료조건 2(비밀번호 최소 길이 미달 시 에러 표시)를 검증하는 순수 함수 단위 테스트.
// validatePasswordForm은 신규 비밀번호가 비어있으면(=비밀번호 변경을 원하지 않음) 통과시키고,
// 값이 있을 때만 최소 길이 정책과 확인란 일치 여부를 검증한다(FR-3, UpdateUserRequest 비밀번호 선택 입력).
import { describe, expect, it } from 'vitest';
import { validatePasswordForm } from '@/features/account/lib/validateAccountForm';

describe('validatePasswordForm', () => {
  it('신규 비밀번호가 정책상 최소 길이(8자) 미달이면 newPassword 에러를 반환한다', () => {
    const errors = validatePasswordForm({
      newPassword: '1234567',
      newPasswordConfirm: '1234567',
    });

    expect(errors.newPassword).toBeDefined();
  });

  it('신규 비밀번호와 확인값이 다르면 newPasswordConfirm 에러를 반환한다', () => {
    const errors = validatePasswordForm({
      newPassword: 'password123',
      newPasswordConfirm: 'password999',
    });

    expect(errors.newPasswordConfirm).toBeDefined();
  });

  it('신규 비밀번호가 비어있으면(변경 안 함) 에러 없이 빈 객체를 반환한다', () => {
    const errors = validatePasswordForm({
      newPassword: '',
      newPasswordConfirm: '',
    });

    expect(errors).toEqual({});
  });

  it('유효한 신규 비밀번호와 일치하는 확인값이면 빈 객체를 반환한다', () => {
    const errors = validatePasswordForm({
      newPassword: 'password123',
      newPasswordConfirm: 'password123',
    });

    expect(errors).toEqual({});
  });
});
