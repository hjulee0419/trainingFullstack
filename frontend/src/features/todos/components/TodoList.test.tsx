// FE-4 완료조건 4: 빈 목록/로딩/에러 각각 공통 컴포넌트 노출 확인.
// FE-4 완료조건 3(통합 확인): 완료+기한초과 mock 데이터도 '완료' 뱃지로 렌더링됨을 확인.
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TodoList } from '@/features/todos/components/TodoList';
import type { Todo } from '@/features/todos/types';
import type { ComponentProps } from 'react';

function renderTodoList(props: ComponentProps<typeof TodoList>) {
  return render(
    <MemoryRouter>
      <TodoList {...props} />
    </MemoryRouter>,
  );
}

describe('TodoList', () => {
  it('isLoading=true 이면 로딩 스피너를 렌더링한다', () => {
    renderTodoList({ items: [], isLoading: true, isError: false, error: null });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('isError=true 이면 에러 메시지를 렌더링한다', () => {
    renderTodoList({
      items: [],
      isLoading: false,
      isError: true,
      error: { statusCode: 500, message: '서버 오류' },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('서버 오류');
  });

  it('items가 빈 배열이면 "등록된 할일이 없습니다" 를 렌더링한다', () => {
    renderTodoList({ items: [], isLoading: false, isError: false, error: null });
    expect(screen.getByText('등록된 할일이 없습니다.')).toBeInTheDocument();
  });

  it('완료+기한초과 항목도 "완료" 뱃지로 렌더링된다(E-6)', () => {
    const overdueButCompleted: Todo = {
      id: '1',
      title: '기한 지난 완료 항목',
      description: null,
      categoryId: '1',
      categoryName: '기본',
      startDate: '2019-12-01',
      endDate: '2020-01-01',
      isCompleted: true,
      completedAt: '2019-12-15T00:00:00Z',
      status: 'completed',
      ownerId: '1',
      createdAt: '2019-12-01T00:00:00Z',
      updatedAt: '2019-12-15T00:00:00Z',
    };

    renderTodoList({ items: [overdueButCompleted], isLoading: false, isError: false, error: null });

    expect(screen.getByText('기한 지난 완료 항목')).toBeInTheDocument();
    expect(screen.getByText('완료')).toBeInTheDocument();
    expect(screen.queryByText('기한초과')).not.toBeInTheDocument();
  });
});
