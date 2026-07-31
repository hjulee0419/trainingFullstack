import type { Todo } from '@/features/todos/types';

/** startDate <= date <= endDate 범위에 오늘(date)이 포함되는 할일만 골라낸다. */
export function getTodosForDate(todos: Todo[], date: string): Todo[] {
  return todos.filter((todo) => todo.startDate <= date && date <= todo.endDate);
}
