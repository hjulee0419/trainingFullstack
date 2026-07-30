// FE-5 완료조건 1: 종료일자<시작일자 시 클라이언트 즉시 차단+에러 표시(E-1)의 근거가 되는
// 순수 검증 함수의 경계값 전수 테스트.
// FE-5 완료조건 2: 카테고리 미지정 등록 정상 동작(E-2) — categoryId 빈 문자열 허용 확인.
import { describe, expect, it } from 'vitest';
import { validateTodoForm, type TodoFormValues } from '@/features/todos/lib/validateTodoForm';

function makeValues(overrides: Partial<TodoFormValues> = {}): TodoFormValues {
  return {
    title: '제목',
    description: '',
    categoryId: '1',
    startDate: '2026-08-01',
    endDate: '2026-08-05',
    ...overrides,
  };
}

describe('validateTodoForm', () => {
  it('종료일자 < 시작일자면 errors.endDate가 존재한다(E-1)', () => {
    const errors = validateTodoForm(
      makeValues({ startDate: '2026-08-05', endDate: '2026-08-01' }),
    );

    expect(errors.endDate).toBeTruthy();
  });

  it('종료일자 === 시작일자면 에러가 없다(경계값 포함 허용)', () => {
    const errors = validateTodoForm(
      makeValues({ startDate: '2026-08-01', endDate: '2026-08-01' }),
    );

    expect(errors).toEqual({});
  });

  it('title이 빈 문자열이면 errors.title이 존재한다', () => {
    const errors = validateTodoForm(makeValues({ title: '' }));

    expect(errors.title).toBeTruthy();
  });

  it('title이 공백만으로 이루어지면 errors.title이 존재한다', () => {
    const errors = validateTodoForm(makeValues({ title: '   ' }));

    expect(errors.title).toBeTruthy();
  });

  it('startDate가 빈 문자열이면 errors.startDate가 존재한다', () => {
    const errors = validateTodoForm(makeValues({ startDate: '' }));

    expect(errors.startDate).toBeTruthy();
  });

  it('endDate가 빈 문자열이면 errors.endDate가 존재한다', () => {
    const errors = validateTodoForm(makeValues({ endDate: '' }));

    expect(errors.endDate).toBeTruthy();
  });

  it('categoryId가 빈 문자열이어도 에러가 없다(E-2, 카테고리 선택 안 함 허용)', () => {
    const errors = validateTodoForm(makeValues({ categoryId: '' }));

    expect(errors).toEqual({});
  });

  it('모든 값이 유효하면 빈 객체를 반환한다', () => {
    const errors = validateTodoForm(makeValues());

    expect(errors).toEqual({});
  });
});
