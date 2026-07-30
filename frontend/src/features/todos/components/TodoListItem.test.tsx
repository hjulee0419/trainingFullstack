// FE-6 완료조건 1: 삭제 버튼 클릭 시 ConfirmDialog가 노출되고, "삭제"(확인) 클릭 시에만 deleteTodo가 호출된다.
// FE-6 완료조건 2: ConfirmDialog에서 "취소" 클릭 시 deleteTodo가 호출되지 않는다.
// FE-6 완료조건 3: 완료 체크박스 체크 시 updateTodo가 {isCompleted:true}로 호출되고,
//                 완료(isCompleted:true, status:'completed')이면 기한초과(E-6, endDate가 과거)여도 '완료' 뱃지가 렌더된다.
// FE-6 완료조건 4(Should): 완료된 항목은 완료일시(completedAt)를 표시한다.
// 추가 검증: 삭제/완료 체크박스 클릭이 카드 전체 클릭(수정 화면 이동)으로 이벤트 버블링되지 않는다.
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Todo } from '@/features/todos/types';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/features/todos/api/todoApi', () => ({
  getTodos: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
}));

import { updateTodo, deleteTodo } from '@/features/todos/api/todoApi';
import { TodoListItem } from '@/features/todos/components/TodoListItem';

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

// E-6: 완료 처리되었으나 종료일자가 오늘(2026-07-30)보다 과거인 항목 — 기한초과와 무관하게 '완료' 뱃지가 렌더되어야 한다.
const completedButOverdueTodo: Todo = {
  ...completedTodo,
  id: '11',
  endDate: '2026-01-01',
};

const activeTodo: Todo = {
  id: '20',
  title: '진행중인 할일',
  description: null,
  categoryId: '1',
  categoryName: '기본',
  startDate: '2026-07-01',
  endDate: '2026-12-31',
  isCompleted: false,
  completedAt: null,
  status: 'in_progress',
  ownerId: '1',
  createdAt: '2026-07-01T00:00:00Z',
  updatedAt: '2026-07-01T00:00:00Z',
};

function renderTodoListItem(todo: Todo) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ul>
          <TodoListItem todo={todo} />
        </ul>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// 카드 전체(li[role="button"])는 삭제 버튼("할일 삭제")도 포함하고 있어 접근성 이름이 모호하므로,
// 이름 없이 role만으로 조회한 뒤 삭제 버튼이 아닌 첫 번째 요소(카드 자신)를 선택한다.
function getCard(): HTMLElement {
  const buttons = screen.getAllByRole('button');
  const card = buttons.find((btn) => btn.classList.contains('todo-list-item'));
  if (!card) throw new Error('card element not found');
  return card;
}

describe('TodoListItem', () => {
  beforeEach(() => {
    vi.mocked(updateTodo).mockReset();
    vi.mocked(deleteTodo).mockReset();
    navigateMock.mockReset();
  });

  it('완료된 항목은 완료일시를 표시한다', () => {
    renderTodoListItem(completedTodo);

    expect(screen.getByText(/완료일시/)).toBeInTheDocument();
  });

  it('항목 클릭 시 수정 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    renderTodoListItem(completedTodo);

    await user.click(getCard());

    expect(navigateMock).toHaveBeenCalledWith('/todos/10/edit', { state: { todo: completedTodo } });
  });

  it('Enter 키 입력 시에도 수정 화면으로 이동한다', async () => {
    const user = userEvent.setup();
    renderTodoListItem(completedTodo);

    getCard().focus();
    await user.keyboard('{Enter}');

    expect(navigateMock).toHaveBeenCalledWith('/todos/10/edit', { state: { todo: completedTodo } });
  });

  it('삭제 버튼 클릭 시 컨펌 다이얼로그가 노출되고, 취소 시 deleteTodo가 호출되지 않는다', async () => {
    const user = userEvent.setup();
    renderTodoListItem(activeTodo);

    await user.click(screen.getByRole('button', { name: '할일 삭제' }));

    expect(await screen.findByText(/삭제하시겠습니까/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(deleteTodo).not.toHaveBeenCalled();
    // 취소 후 카드 클릭(수정 이동)이 트리거되지 않아야 한다.
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('삭제 컨펌 다이얼로그에서 삭제 확인 시에만 deleteTodo가 호출된다', async () => {
    vi.mocked(deleteTodo).mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderTodoListItem(activeTodo);

    await user.click(screen.getByRole('button', { name: '할일 삭제' }));
    await screen.findByText(/삭제하시겠습니까/);

    await user.click(screen.getByRole('button', { name: '삭제' }));

    expect(deleteTodo).toHaveBeenCalledWith(activeTodo.id, expect.anything());
    // 삭제 확인 클릭이 카드 클릭(수정 이동)으로 버블링되지 않아야 한다.
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('완료 체크박스를 체크하면 updateTodo가 {isCompleted:true}로 호출된다', async () => {
    vi.mocked(updateTodo).mockResolvedValueOnce({ ...activeTodo, isCompleted: true });
    const user = userEvent.setup();
    renderTodoListItem(activeTodo);

    await user.click(screen.getByRole('checkbox', { name: '완료 여부' }));

    expect(updateTodo).toHaveBeenCalledWith(activeTodo.id, { isCompleted: true });
    // 체크박스 클릭이 카드 클릭(수정 이동)으로 버블링되지 않아야 한다.
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('완료 처리된 항목은 기한초과(종료일이 과거)여도 완료 뱃지를 렌더한다 (E-6)', () => {
    renderTodoListItem(completedButOverdueTodo);

    expect(screen.getByText('완료')).toBeInTheDocument();
    expect(screen.queryByText('기한초과')).not.toBeInTheDocument();
  });
});
