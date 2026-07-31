import { describe, expect, it } from 'vitest';
import { getTodosForDate } from '@/features/dashboard/lib/getTodosForDate';
import type { Todo } from '@/features/todos/types';

function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: '1',
    title: '제목',
    description: null,
    categoryId: '1',
    categoryName: '기본',
    startDate: '2026-08-01',
    endDate: '2026-08-05',
    isCompleted: false,
    completedAt: null,
    status: 'in_progress',
    ownerId: '1',
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('getTodosForDate', () => {
  it('startDate와 endDate 사이(경계 포함)의 날짜면 포함한다', () => {
    const todo = makeTodo({ startDate: '2026-08-01', endDate: '2026-08-05' });

    expect(getTodosForDate([todo], '2026-08-01')).toEqual([todo]);
    expect(getTodosForDate([todo], '2026-08-03')).toEqual([todo]);
    expect(getTodosForDate([todo], '2026-08-05')).toEqual([todo]);
  });

  it('범위 밖 날짜는 제외한다', () => {
    const todo = makeTodo({ startDate: '2026-08-01', endDate: '2026-08-05' });

    expect(getTodosForDate([todo], '2026-07-31')).toEqual([]);
    expect(getTodosForDate([todo], '2026-08-06')).toEqual([]);
  });

  it('여러 할일 중 해당 날짜에 걸친 것만 반환한다', () => {
    const a = makeTodo({ id: 'a', startDate: '2026-08-01', endDate: '2026-08-03' });
    const b = makeTodo({ id: 'b', startDate: '2026-08-05', endDate: '2026-08-10' });

    expect(getTodosForDate([a, b], '2026-08-02')).toEqual([a]);
    expect(getTodosForDate([a, b], '2026-08-07')).toEqual([b]);
    expect(getTodosForDate([a, b], '2026-08-04')).toEqual([]);
  });
});
