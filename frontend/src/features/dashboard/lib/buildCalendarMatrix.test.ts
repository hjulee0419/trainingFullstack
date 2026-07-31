import { describe, expect, it } from 'vitest';
import { buildCalendarMatrix } from '@/features/dashboard/lib/buildCalendarMatrix';

describe('buildCalendarMatrix', () => {
  it('모든 주가 7일씩으로 구성된다', () => {
    const weeks = buildCalendarMatrix(2026, 8, '2026-08-01');
    weeks.forEach((week) => expect(week).toHaveLength(7));
  });

  it('2026년 8월 1일은 토요일이라 6칸의 이전 달(7월) 채움 날짜가 앞에 붙는다', () => {
    const weeks = buildCalendarMatrix(2026, 8, '2026-08-01');
    const firstWeek = weeks[0];

    expect(firstWeek[0]).toMatchObject({ date: '2026-07-26', day: 26, isCurrentMonth: false });
    expect(firstWeek[6]).toMatchObject({ date: '2026-08-01', day: 1, isCurrentMonth: true });
  });

  it('당월의 마지막 날짜(2026-08-31)를 포함한다', () => {
    const weeks = buildCalendarMatrix(2026, 8, '2026-08-01');
    const flat = weeks.flat();
    const lastDay = flat.find((cell) => cell.date === '2026-08-31');

    expect(lastDay).toMatchObject({ day: 31, isCurrentMonth: true });
  });

  it('today와 일치하는 날짜에는 isToday=true가 표시된다', () => {
    const weeks = buildCalendarMatrix(2026, 8, '2026-08-15');
    const flat = weeks.flat();
    const todayCell = flat.find((cell) => cell.date === '2026-08-15');
    const otherCell = flat.find((cell) => cell.date === '2026-08-14');

    expect(todayCell?.isToday).toBe(true);
    expect(otherCell?.isToday).toBe(false);
  });

  it('연도가 바뀌는 12월/1월 경계도 올바르게 처리한다', () => {
    const weeks = buildCalendarMatrix(2026, 1, '2026-01-01');
    const flat = weeks.flat();
    const decCell = flat.find((cell) => cell.isCurrentMonth === false && cell.day <= 31 && cell.date.startsWith('2025-12'));

    expect(decCell).toBeDefined();
  });
});
