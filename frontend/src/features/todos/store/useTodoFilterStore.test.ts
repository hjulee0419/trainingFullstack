// FE-4 완료조건 2의 전제: 필터(카테고리/상태) 변경 시 page가 1로 리셋되어야
// 새 필터 조건에서 항상 첫 페이지부터 조회된다(이후 useTodosQuery 재요청으로 이어짐).
import { afterEach, describe, expect, it } from 'vitest';
import { useTodoFilterStore } from '@/features/todos/store/useTodoFilterStore';

describe('useTodoFilterStore', () => {
  afterEach(() => {
    useTodoFilterStore.getState().reset();
  });

  it('setCategoryId 호출 시 categoryId가 반영되고 page가 1로 리셋된다', () => {
    useTodoFilterStore.getState().setPage(3);
    useTodoFilterStore.getState().setCategoryId('5');

    const state = useTodoFilterStore.getState();
    expect(state.categoryId).toBe('5');
    expect(state.page).toBe(1);
  });

  it('setStatus 호출 시 status가 반영되고 page가 1로 리셋된다', () => {
    useTodoFilterStore.getState().setPage(4);
    useTodoFilterStore.getState().setStatus('overdue');

    const state = useTodoFilterStore.getState();
    expect(state.status).toBe('overdue');
    expect(state.page).toBe(1);
  });

  it('setPage로 직접 페이지 변경 시 지정한 페이지 값이 유지된다', () => {
    useTodoFilterStore.getState().setCategoryId('7');
    useTodoFilterStore.getState().setPage(2);

    expect(useTodoFilterStore.getState().page).toBe(2);
    expect(useTodoFilterStore.getState().categoryId).toBe('7');
  });

  it('reset 호출 시 초기 상태로 되돌아간다', () => {
    useTodoFilterStore.getState().setCategoryId('1');
    useTodoFilterStore.getState().setStatus('completed');
    useTodoFilterStore.getState().setPage(5);

    useTodoFilterStore.getState().reset();

    const state = useTodoFilterStore.getState();
    expect(state.categoryId).toBeUndefined();
    expect(state.status).toBeUndefined();
    expect(state.page).toBe(1);
    expect(state.limit).toBe(20);
  });
});
