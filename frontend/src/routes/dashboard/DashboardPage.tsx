import { useMemo, useState } from 'react';
import { CalendarGrid } from '@/features/dashboard/components/CalendarGrid';
import { buildCalendarMatrix } from '@/features/dashboard/lib/buildCalendarMatrix';
import { getTodosForDate } from '@/features/dashboard/lib/getTodosForDate';
import { getTodayDateString } from '@/features/todos/lib/deriveTodoStatus';
import { useTodosQuery } from '@/features/todos/hooks/useTodosQuery';
import { TodoList } from '@/features/todos/components/TodoList';
import { Button } from '@/shared/components/Button';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { Todo } from '@/features/todos/types';

const DASHBOARD_FETCH_LIMIT = 100;

function parseYearMonth(date: string): { year: number; month: number } {
  const [year, month] = date.split('-').map(Number);
  return { year, month };
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const zeroBased = month - 1 + delta;
  const nextYear = year + Math.floor(zeroBased / 12);
  const nextMonth = ((zeroBased % 12) + 12) % 12;
  return { year: nextYear, month: nextMonth + 1 };
}

export function DashboardPage() {
  const { t } = useTranslation();
  const today = getTodayDateString();
  const [{ year: viewYear, month: viewMonth }, setViewYearMonth] = useState(parseYearMonth(today));
  const [selectedDate, setSelectedDate] = useState(today);

  const { data, isLoading, isError, error } = useTodosQuery({
    page: 1,
    limit: DASHBOARD_FETCH_LIMIT,
  });
  const todos = useMemo(() => data?.items ?? [], [data]);

  const todosByDate = useMemo(() => {
    const map = new Map<string, Todo[]>();
    for (const todo of todos) {
      // 대시보드는 시작~종료 범위를 걸치는 모든 날짜 셀에 동일 할일을 표시한다(달력 특성상 목록 필터와 다름).
      let cursor = todo.startDate;
      while (cursor <= todo.endDate) {
        const existing = map.get(cursor) ?? [];
        existing.push(todo);
        map.set(cursor, existing);
        const next = new Date(cursor);
        next.setDate(next.getDate() + 1);
        cursor = next.toISOString().slice(0, 10);
      }
    }
    return map;
  }, [todos]);

  const weeks = useMemo(() => buildCalendarMatrix(viewYear, viewMonth, today), [viewYear, viewMonth, today]);
  const selectedDayTodos = getTodosForDate(todos, selectedDate);

  function goToMonth(delta: number) {
    setViewYearMonth((prev) => shiftMonth(prev.year, prev.month, delta));
  }

  function goToToday() {
    setViewYearMonth(parseYearMonth(today));
    setSelectedDate(today);
  }

  return (
    <div className="dashboard-page">
      <h1 className="dashboard-page__title">{t('dashboard.title')}</h1>

      <div className="dashboard-body">
        <div className="dashboard-calendar">
          <div className="dashboard-calendar__header">
            <Button variant="secondary" type="button" onClick={() => goToMonth(-1)}>
              {t('dashboard.calendar.prevMonth')}
            </Button>
            <span className="dashboard-calendar__month-title">
              {t('dashboard.calendar.monthTitle', { year: viewYear, month: viewMonth })}
            </span>
            <Button variant="secondary" type="button" onClick={() => goToMonth(1)}>
              {t('dashboard.calendar.nextMonth')}
            </Button>
            <Button variant="secondary" type="button" onClick={goToToday}>
              {t('dashboard.calendar.today')}
            </Button>
          </div>

          {isLoading && <p className="dashboard-page__notice">{t('common.loading')}</p>}
          {isError && <p className="dashboard-page__notice">{t('common.genericError')}</p>}
          {!isLoading && !isError && (
            <CalendarGrid
              weeks={weeks}
              todosByDate={todosByDate}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          )}
        </div>

        <section className="dashboard-selected-day">
          <h2 className="dashboard-selected-day__title">
            {t('dashboard.selectedDay.title', { date: selectedDate })}
          </h2>
          <TodoList
            items={selectedDayTodos}
            isLoading={false}
            isError={isError}
            error={error}
          />
        </section>
      </div>
    </div>
  );
}
