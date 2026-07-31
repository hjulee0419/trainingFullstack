// 달력 그리드: 요일 헤더 렌더, 날짜 클릭 시 onSelectDate 호출, 할일이 있는 날짜에 상태 점(dot) 표시를 검증한다.
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarGrid } from '@/features/dashboard/components/CalendarGrid';
import { buildCalendarMatrix } from '@/features/dashboard/lib/buildCalendarMatrix';
import type { Todo } from '@/features/todos/types';

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: '1',
    title: '제목',
    description: null,
    categoryId: '1',
    categoryName: '기본',
    startDate: '2026-08-05',
    endDate: '2026-08-05',
    isCompleted: false,
    completedAt: null,
    status: 'in_progress',
    ownerId: '1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('CalendarGrid', () => {
  it('요일 헤더(일~토)를 렌더링한다', () => {
    const weeks = buildCalendarMatrix(2026, 8, '2026-08-01');
    render(
      <CalendarGrid weeks={weeks} todosByDate={new Map()} selectedDate="2026-08-01" onSelectDate={() => {}} />,
    );

    ['일', '월', '화', '수', '목', '금', '토'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('날짜 셀 클릭 시 onSelectDate가 해당 날짜로 호출된다', async () => {
    const user = userEvent.setup();
    const weeks = buildCalendarMatrix(2026, 8, '2026-08-01');
    const onSelectDate = vi.fn();
    render(
      <CalendarGrid weeks={weeks} todosByDate={new Map()} selectedDate="2026-08-01" onSelectDate={onSelectDate} />,
    );

    await user.click(screen.getByRole('button', { name: /2026-08-05/ }));

    expect(onSelectDate).toHaveBeenCalledWith('2026-08-05');
  });

  it('할일이 있는 날짜에는 상태 점이 렌더링된다', () => {
    const weeks = buildCalendarMatrix(2026, 8, '2026-08-01');
    const todosByDate = new Map([['2026-08-05', [makeTodo()]]]);
    const { container } = render(
      <CalendarGrid weeks={weeks} todosByDate={todosByDate} selectedDate="2026-08-01" onSelectDate={() => {}} />,
    );

    expect(container.querySelectorAll('.dashboard-calendar__dot')).toHaveLength(1);
  });
});
