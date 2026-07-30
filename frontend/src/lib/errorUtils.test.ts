// getErrorMessage는 LoginForm/SignupForm의 에러 메시지 표시(완료조건 3, E-8 포함)에
// 사용되는 유틸이다. ApiError 형태별 분기와 그 외 값(fallback)에 대한 동작을 검증한다.
import { describe, expect, it } from 'vitest';
import { getErrorMessage } from '@/lib/errorUtils';

describe('getErrorMessage', () => {
  it('statusCode가 404인 ApiError면 존재하지 않는 항목 메시지를 반환한다', () => {
    expect(getErrorMessage({ statusCode: 404, message: '무시됨' })).toBe('존재하지 않는 항목입니다.');
  });

  it('그 외 statusCode의 ApiError면 message를 그대로 반환한다', () => {
    expect(getErrorMessage({ statusCode: 401, message: '이메일 또는 비밀번호가 올바르지 않습니다.' })).toBe(
      '이메일 또는 비밀번호가 올바르지 않습니다.',
    );
  });

  it('message가 비어있는 ApiError면 fallback 메시지를 반환한다', () => {
    expect(getErrorMessage({ statusCode: 500, message: '' })).toBe('요청 처리 중 오류가 발생했습니다.');
  });

  it('ApiError 형태가 아니면 fallback 메시지를 반환한다', () => {
    expect(getErrorMessage(new Error('일반 에러'))).toBe('요청 처리 중 오류가 발생했습니다.');
    expect(getErrorMessage(null)).toBe('요청 처리 중 오류가 발생했습니다.');
  });

  it('커스텀 fallback을 지정하면 해당 메시지를 반환한다', () => {
    expect(getErrorMessage(undefined, '커스텀 오류')).toBe('커스텀 오류');
  });
});
