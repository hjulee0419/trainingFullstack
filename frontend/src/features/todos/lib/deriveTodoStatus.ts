import type { TodoStatus } from '@/features/todos/types';

export function getTodayDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 서버가 이미 계산해 내려주는 status 필드를 신뢰하는 것이 기본 사용법이며,
 * 이 함수는 향후(FE-5/FE-6) 완료 체크박스 토글 시 서버 왕복 없이 로컬 미리보기용으로 쓰인다.
 */
export function deriveTodoStatus(
  todo: { isCompleted: boolean; startDate: string; endDate: string },
  today: string = getTodayDateString(),
): TodoStatus {
  if (todo.isCompleted) return 'completed';
  if (today < todo.startDate) return 'not_started';
  if (today > todo.endDate) return 'overdue';
  return 'in_progress';
}
