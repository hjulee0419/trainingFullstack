// FE-4 완료조건 1의 전제: categoryId+status 동시 지정 시 쿼리 파라미터에 둘 다 포함되어야
// 백엔드 AND 필터링이 성립한다. buildTodoQueryParams는 그 변환을 담당하는 순수 함수다.
import { describe, expect, it } from 'vitest';
import { buildTodoQueryParams } from '@/features/todos/lib/buildTodoQueryParams';
import type { TodoFilterParams } from '@/features/todos/types';

describe('buildTodoQueryParams', () => {
  it('categoryId와 status가 모두 지정되면 반환 객체에 둘 다 포함한다', () => {
    const filter: TodoFilterParams = {
      categoryId: '3',
      status: 'in_progress',
      page: 1,
      limit: 20,
    };

    const result = buildTodoQueryParams(filter);

    expect(result).toEqual({
      page: 1,
      limit: 20,
      categoryId: '3',
      status: 'in_progress',
    });
  });

  it('필터 미지정 시 page/limit만 포함한다', () => {
    const filter: TodoFilterParams = { page: 2, limit: 10 };

    const result = buildTodoQueryParams(filter);

    expect(result).toEqual({ page: 2, limit: 10 });
    expect(result).not.toHaveProperty('categoryId');
    expect(result).not.toHaveProperty('status');
  });
});
