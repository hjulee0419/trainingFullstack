export interface CalendarDay {
  date: string; // 'YYYY-MM-DD'
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayOfWeek: number; // 0=일 ... 6=토
}

function toDateString(year: number, month: number, day: number): string {
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}`;
}

/**
 * year/month(1~12) 기준 달력 매트릭스를 만든다. 일요일 시작, 이전/다음 달의 채움 날짜를 포함해
 * 항상 7일 단위의 완전한 주(week)들로 구성한다.
 */
export function buildCalendarMatrix(
  year: number,
  month: number,
  today: string,
): CalendarDay[][] {
  const firstOfMonth = new Date(year, month - 1, 1);
  const startDayOfWeek = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevMonthYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthYear = month === 12 ? year + 1 : year;

  const cells: CalendarDay[] = [];

  for (let i = startDayOfWeek - 1; i >= 0; i -= 1) {
    const day = daysInPrevMonth - i;
    const date = toDateString(prevMonthYear, prevMonth, day);
    cells.push({ date, day, isCurrentMonth: false, isToday: date === today, dayOfWeek: cells.length % 7 });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = toDateString(year, month, day);
    cells.push({ date, day, isCurrentMonth: true, isToday: date === today, dayOfWeek: cells.length % 7 });
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    const date = toDateString(nextMonthYear, nextMonth, nextDay);
    cells.push({ date, day: nextDay, isCurrentMonth: false, isToday: date === today, dayOfWeek: cells.length % 7 });
    nextDay += 1;
  }

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}
