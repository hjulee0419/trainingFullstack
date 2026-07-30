// FE-4 완료조건 3 보강: 완료 항목의 완료일시 표시 및 항목 클릭 시 수정 화면 이동 동작을 확인한다.
// (TodoList.test.tsx가 목록 렌더링/뱃지를 검증하므로, 여기서는 TodoListItem 고유 인터랙션만 다룬다.)
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

import { TodoListItem } from '@/features/todos/components/TodoListItem';
import type { Todo } from '@/features/todos/types';

const completedTodo: Todo = {
  id: '10',
  title: '완료된 할일',
  description: null,
  categoryId: '1',
  categoryName: '기본',
  startDate: '2026-07-01',
  endDate: '2026-07-10',
  isCompleted: true,
  completedAt: '2026-07-05T09:30:00Z',
  status: 'completed',
  ownerId: '1',
  createdAt: '2026-07-01T00:00:00Z',
  updatedAt: '2026-07-05T09:30:00Z',
};

describe('TodoListItem', () => {
  it('완료된 항목은 완료일시를 표시한다', () => {
    render(
      <MemoryRouter>
        <TodoListItem todo={completedTodo} />
      </MemoryRouter>,
    );

    expect(screen.getByText(/완료일시/)).toBeInTheDocument();
  });

  it('항목 클릭 시 수정 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TodoListItem todo={completedTodo} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button'));

    expect(navigateMock).toHaveBeenCalledWith('/todos/10/edit', { state: { todo: completedTodo } });
  });

  it('Enter 키 입력 시에도 수정 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <TodoListItem todo={completedTodo} />
      </MemoryRouter>,
    );

    screen.getByRole('button').focus();
    await user.keyboard('{Enter}');

    expect(navigateMock).toHaveBeenCalledWith('/todos/10/edit', { state: { todo: completedTodo } });
  });
});
