// FE-3 완료조건 1: 생성 시 목록 즉시 반영(이 컴포넌트 단위에서는 createCategory 호출 및
// 성공 후 입력창 초기화로 검증). 이름 중복(409) 시 getErrorUtils 경유 에러 메시지 표시도 함께 검증한다.
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoryForm } from '@/features/categories/components/CategoryForm';
import type { Category } from '@/features/categories/types';

vi.mock('@/features/categories/api/categoryApi', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

import { createCategory } from '@/features/categories/api/categoryApi';

function renderCategoryForm() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CategoryForm />
    </QueryClientProvider>,
  );
}

describe('CategoryForm', () => {
  beforeEach(() => {
    vi.mocked(createCategory).mockReset();
  });

  it('이름 입력 후 추가 버튼 클릭 시 createCategory가 호출되고, 성공 후 입력창이 초기화된다', async () => {
    const created: Category = {
      id: '3',
      name: '스터디',
      isDefault: false,
      ownerId: '1',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
    vi.mocked(createCategory).mockResolvedValueOnce(created);

    const user = userEvent.setup();
    renderCategoryForm();

    const input = screen.getByLabelText('새 카테고리 이름');
    await user.type(input, '스터디');
    await user.click(screen.getByRole('button', { name: '추가' }));

    expect(createCategory).toHaveBeenCalledWith({ name: '스터디' }, expect.anything());

    await screen.findByDisplayValue('');
    expect(input).toHaveValue('');
  });

  it('이름 중복(409) 에러 시 에러 메시지가 표시된다', async () => {
    const errorMessage = '이미 존재하는 카테고리 이름입니다.';
    vi.mocked(createCategory).mockRejectedValueOnce({ statusCode: 409, message: errorMessage });

    const user = userEvent.setup();
    renderCategoryForm();

    await user.type(screen.getByLabelText('새 카테고리 이름'), '과제');
    await user.click(screen.getByRole('button', { name: '추가' }));

    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });
});
