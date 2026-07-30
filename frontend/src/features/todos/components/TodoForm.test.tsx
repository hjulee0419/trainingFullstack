// FE-5 완료조건 1: 종료일자<시작일자 입력 후 제출 시 onSubmit이 호출되지 않고 에러가 렌더되는지(E-1).
// FE-5 완료조건 2: 카테고리를 선택하지 않고(빈 값) 제출해도 onSubmit이 호출되고, 전달되는 값의
//   categoryId가 빈 문자열인지(E-2, 카테고리 선택 안 함 허용 — 빈 문자열→undefined 변환은 페이지에서 처리).
// FE-5 완료조건 5: submitError로 404 에러 객체를 전달하면 getErrorMessage 매핑을 통해
//   "존재하지 않는 항목입니다" 문구가 렌더되는지(E-5).
// FE-5 완료조건 4: mode="edit" + initialValues 전달 시 각 필드에 값이 프리필되는지.
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TodoForm } from '@/features/todos/components/TodoForm';
import type { TodoFormValues } from '@/features/todos/lib/validateTodoForm';
import type { Category } from '@/features/categories/types';

vi.mock('@/features/categories/api/categoryApi', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

import { getCategories } from '@/features/categories/api/categoryApi';

const categories: Category[] = [
  {
    id: '1',
    name: '기본',
    isDefault: true,
    ownerId: '1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

interface RenderOptions {
  mode?: 'create' | 'edit';
  initialValues?: TodoFormValues;
  onSubmit?: (values: TodoFormValues) => void;
  isSubmitting?: boolean;
  submitError?: unknown;
}

function renderTodoForm(options: RenderOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onSubmit = vi.fn(options.onSubmit);

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TodoForm
          mode={options.mode ?? 'create'}
          initialValues={options.initialValues}
          onSubmit={onSubmit}
          isSubmitting={options.isSubmitting ?? false}
          submitError={options.submitError}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );

  return { ...utils, onSubmit };
}

describe('TodoForm', () => {
  beforeEach(() => {
    vi.mocked(getCategories).mockReset();
    vi.mocked(getCategories).mockResolvedValue(categories);
  });

  it('종료일자<시작일자 입력 후 제출하면 onSubmit이 호출되지 않고 에러가 렌더된다(E-1)', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderTodoForm();

    await user.type(screen.getByLabelText('제목 *'), '테스트 할일');
    await user.type(screen.getByLabelText('시작일자 *'), '2026-08-05');
    await user.type(screen.getByLabelText('종료일자 *'), '2026-08-01');

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      await screen.findByText('종료일자는 시작일자보다 빠를 수 없습니다.'),
    ).toBeInTheDocument();
  });

  it('카테고리를 선택하지 않고 제출하면 onSubmit이 호출되고 categoryId가 빈 문자열이다(E-2)', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderTodoForm();

    await user.type(screen.getByLabelText('제목 *'), '테스트 할일');
    await user.type(screen.getByLabelText('시작일자 *'), '2026-08-01');
    await user.type(screen.getByLabelText('종료일자 *'), '2026-08-05');

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submittedValues = onSubmit.mock.calls[0][0] as TodoFormValues;
    expect(submittedValues.categoryId).toBe('');
  });

  it('submitError로 404 에러 객체를 전달하면 "존재하지 않는 항목입니다" 문구가 렌더된다(E-5)', () => {
    renderTodoForm({
      submitError: { statusCode: 404, message: '해당 할일을 찾을 수 없습니다.' },
    });

    expect(screen.getByText('존재하지 않는 항목입니다.')).toBeInTheDocument();
  });

  it('설명과 카테고리를 입력/선택하면 onSubmit에 해당 값이 전달된다', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderTodoForm();

    await user.type(screen.getByLabelText('제목 *'), '테스트 할일');
    await user.type(screen.getByLabelText('설명'), '테스트 설명');
    await screen.findByRole('option', { name: '기본' });
    await user.selectOptions(screen.getByLabelText('카테고리'), '1');
    await user.type(screen.getByLabelText('시작일자 *'), '2026-08-01');
    await user.type(screen.getByLabelText('종료일자 *'), '2026-08-05');

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const submittedValues = onSubmit.mock.calls[0][0] as TodoFormValues;
    expect(submittedValues.description).toBe('테스트 설명');
    expect(submittedValues.categoryId).toBe('1');
  });

  it('취소 버튼 클릭 시 /todos로 이동한다', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/todos/new']}>
          <Routes>
            <Route
              path="/todos/new"
              element={
                <TodoForm mode="create" onSubmit={vi.fn()} isSubmitting={false} />
              }
            />
            <Route path="/todos" element={<div>할일 목록 페이지</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(await screen.findByText('할일 목록 페이지')).toBeInTheDocument();
  });

  it('mode="edit" + initialValues 전달 시 각 필드에 기존 값이 프리필된다', () => {
    const initialValues: TodoFormValues = {
      title: '기존 할일 제목',
      description: '기존 설명',
      categoryId: '1',
      startDate: '2026-08-01',
      endDate: '2026-08-05',
    };

    renderTodoForm({ mode: 'edit', initialValues });

    expect(screen.getByLabelText('제목 *')).toHaveValue('기존 할일 제목');
    expect(screen.getByLabelText('설명')).toHaveValue('기존 설명');
    expect(screen.getByLabelText('시작일자 *')).toHaveValue('2026-08-01');
    expect(screen.getByLabelText('종료일자 *')).toHaveValue('2026-08-05');
  });
});
