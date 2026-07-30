// FE-4 완료조건 1, 2: 카테고리+상태 필터 선택 UI가 useTodoFilterStore를 올바르게 갱신하는지 확인한다.
// useCategoriesQuery를 모킹하고, 실제 zustand 스토어(useTodoFilterStore)를 렌더링 트리에 연결해
// 셀렉트 변경 후 getState()로 최종 상태를 검증한다.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { TodoFilterBar } from '@/features/todos/components/TodoFilterBar';
import { useTodoFilterStore } from '@/features/todos/store/useTodoFilterStore';
import type { Category } from '@/features/categories/types';

vi.mock('@/features/categories/hooks/useCategoriesQuery', () => ({
  useCategoriesQuery: vi.fn(),
}));

import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery';

const categories: Category[] = [
  { id: '1', name: '기본', isDefault: true, ownerId: '1', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', name: '업무', isDefault: false, ownerId: '1', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

function renderFilterBar() {
  return render(
    <MemoryRouter>
      <TodoFilterBar />
    </MemoryRouter>,
  );
}

describe('TodoFilterBar', () => {
  beforeEach(() => {
    vi.mocked(useCategoriesQuery).mockReturnValue({
      data: categories,
    } as unknown as ReturnType<typeof useCategoriesQuery>);
  });

  afterEach(() => {
    useTodoFilterStore.getState().reset();
  });

  it('카테고리 옵션이 useCategoriesQuery 결과대로 렌더링된다', () => {
    renderFilterBar();

    expect(screen.getByRole('option', { name: '기본' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '업무' })).toBeInTheDocument();
  });

  it('카테고리 셀렉트 변경 시 store의 categoryId가 갱신된다(완료조건 1 전제)', async () => {
    const user = userEvent.setup();
    renderFilterBar();

    await user.selectOptions(screen.getByLabelText('카테고리'), '2');

    expect(useTodoFilterStore.getState().categoryId).toBe('2');
  });

  it('상태 셀렉트 변경 시 store의 status가 갱신된다(완료조건 1 전제)', async () => {
    const user = userEvent.setup();
    renderFilterBar();

    await user.selectOptions(screen.getByLabelText('상태'), '기한초과');

    expect(useTodoFilterStore.getState().status).toBe('overdue');
  });

  it('카테고리와 상태를 모두 선택하면 store에 둘 다 반영된다(AND 필터 전제, 완료조건 1)', async () => {
    const user = userEvent.setup();
    renderFilterBar();

    await user.selectOptions(screen.getByLabelText('카테고리'), '2');
    await user.selectOptions(screen.getByLabelText('상태'), '진행중');

    const state = useTodoFilterStore.getState();
    expect(state.categoryId).toBe('2');
    expect(state.status).toBe('in_progress');
  });
});
