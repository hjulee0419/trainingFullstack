import { useStatusDisplay } from '@/features/todos/hooks/useStatusDisplay';
import { useTranslation } from '@/lib/i18n/useTranslation';
import type { CalendarDay } from '@/features/dashboard/lib/buildCalendarMatrix';
import type { Todo } from '@/features/todos/types';

const WEEKDAY_KEYS = [
  'dashboard.calendar.sun',
  'dashboard.calendar.mon',
  'dashboard.calendar.tue',
  'dashboard.calendar.wed',
  'dashboard.calendar.thu',
  'dashboard.calendar.fri',
  'dashboard.calendar.sat',
] as const;

const MAX_DOTS = 3;

function CalendarDot({ status }: { status: Todo['status'] }) {
  const { color } = useStatusDisplay(status);
  return <span className="dashboard-calendar__dot" style={{ backgroundColor: color.text }} />;
}

interface CalendarGridProps {
  weeks: CalendarDay[][];
  todosByDate: Map<string, Todo[]>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function CalendarGrid({ weeks, todosByDate, selectedDate, onSelectDate }: CalendarGridProps) {
  const { t } = useTranslation();

  return (
    <div className="dashboard-calendar__grid-wrapper">
      <div className="dashboard-calendar__weekdays">
        {WEEKDAY_KEYS.map((key, index) => (
          <div
            key={key}
            className="dashboard-calendar__weekday"
            style={{
              color:
                index === 0 ? 'var(--color-sunday)' : index === 6 ? 'var(--color-saturday)' : undefined,
            }}
          >
            {t(key)}
          </div>
        ))}
      </div>
      <div className="dashboard-calendar__grid">
        {weeks.flatMap((week) =>
          week.map((cell) => {
            const todosOfDay = todosByDate.get(cell.date) ?? [];
            const visibleTodos = todosOfDay.slice(0, MAX_DOTS);
            const overflowCount = todosOfDay.length - visibleTodos.length;
            const classNames = [
              'dashboard-calendar__cell',
              !cell.isCurrentMonth && 'dashboard-calendar__cell--other-month',
              cell.isToday && 'dashboard-calendar__cell--today',
              cell.date === selectedDate && 'dashboard-calendar__cell--selected',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <button
                key={cell.date}
                type="button"
                className={classNames}
                onClick={() => onSelectDate(cell.date)}
                aria-label={t('dashboard.calendar.dayAriaLabel', {
                  date: cell.date,
                  count: todosOfDay.length,
                })}
              >
                <span
                  className="dashboard-calendar__day-number"
                  style={{
                    color:
                      cell.dayOfWeek === 0
                        ? 'var(--color-sunday)'
                        : cell.dayOfWeek === 6
                          ? 'var(--color-saturday)'
                          : undefined,
                  }}
                >
                  {cell.day}
                </span>
                {visibleTodos.length > 0 && (
                  <span className="dashboard-calendar__dots">
                    {visibleTodos.map((todo) => (
                      <CalendarDot key={todo.id} status={todo.status} />
                    ))}
                    {overflowCount > 0 && (
                      <span className="dashboard-calendar__more">+{overflowCount}</span>
                    )}
                  </span>
                )}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
