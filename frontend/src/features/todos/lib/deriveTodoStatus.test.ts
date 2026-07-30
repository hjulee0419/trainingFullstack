// FE-4 완료조건 3: 완료 항목은 기한초과 무관 '완료' 뱃지(E-6)
// 순수 함수 deriveTodoStatus의 경계값 전수 테스트(today를 고정 문자열로 명시하여 결정적으로 검증).
import { describe, expect, it } from 'vitest';
import { deriveTodoStatus, getTodayDateString } from '@/features/todos/lib/deriveTodoStatus';

describe('deriveTodoStatus', () => {
  it('미완료 + today < startDate → not_started', () => {
    expect(
      deriveTodoStatus({ isCompleted: false, startDate: '2026-08-01', endDate: '2026-08-10' }, '2026-07-31'),
    ).toBe('not_started');
  });

  it('미완료 + today === startDate → in_progress', () => {
    expect(
      deriveTodoStatus({ isCompleted: false, startDate: '2026-08-01', endDate: '2026-08-10' }, '2026-08-01'),
    ).toBe('in_progress');
  });

  it('미완료 + startDate < today < endDate → in_progress', () => {
    expect(
      deriveTodoStatus({ isCompleted: false, startDate: '2026-08-01', endDate: '2026-08-10' }, '2026-08-05'),
    ).toBe('in_progress');
  });

  it('미완료 + today === endDate → in_progress', () => {
    expect(
      deriveTodoStatus({ isCompleted: false, startDate: '2026-08-01', endDate: '2026-08-10' }, '2026-08-10'),
    ).toBe('in_progress');
  });

  it('미완료 + today > endDate → overdue', () => {
    expect(
      deriveTodoStatus({ isCompleted: false, startDate: '2026-08-01', endDate: '2026-08-10' }, '2026-08-11'),
    ).toBe('overdue');
  });

  it('완료 + today > endDate(기한초과 조건 동시 성립) → completed (E-6 핵심)', () => {
    expect(
      deriveTodoStatus({ isCompleted: true, startDate: '2020-01-01', endDate: '2020-01-01' }, '2026-07-30'),
    ).toBe('completed');
  });

  it('완료 + today < startDate → completed', () => {
    expect(
      deriveTodoStatus({ isCompleted: true, startDate: '2026-08-01', endDate: '2026-08-10' }, '2026-07-31'),
    ).toBe('completed');
  });
});

describe('getTodayDateString', () => {
  it('Date 객체를 YYYY-MM-DD 문자열로 변환한다', () => {
    expect(getTodayDateString(new Date(2026, 6, 30))).toBe('2026-07-30');
  });
});
