// FE-3 통합 스모크 테스트: 목록 로딩 상태 → 데이터 표시, 생성 폼 제출 후
// mutation의 invalidateQueries가 실제로 목록 refetch를 트리거해 새 항목이 반영되는지 확인한다
// (완료조건 1: 생성 시 목록 즉시 반영).
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { CategoryManagePage } from '@/routes/categories/CategoryManagePage';
import type { Category } from '@/features/categories/types';

vi.mock('@/features/categories/api/categoryApi', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

import { getCategories, createCategory } from '@/features/categories/api/categoryApi';

const initialCategories: Category[] = [
  {
    id: '1',
    name: '기본',
    isDefault: true,
    ownerId: '1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const createdCategory: Category = {
  id: '2',
  name: '스터디',
  isDefault: false,
  ownerId: '1',
  createdAt: '2026-01-02T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CategoryManagePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CategoryManagePage', () => {
  beforeEach(() => {
    vi.mocked(getCategories).mockReset();
    vi.mocked(createCategory).mockReset();
  });

  it('로딩 후 카테고리 목록을 표시하고, 생성 성공 시 목록에 새 항목이 반영된다', async () => {
    vi.mocked(getCategories)
      .mockResolvedValueOnce(initialCategories)
      .mockResolvedValueOnce([...initialCategories, createdCategory]);
    vi.mocked(createCategory).mockResolvedValueOnce(createdCategory);

    const user = userEvent.setup();
    renderPage();

    expect(screen.getByRole('status', { name: '로딩 중' })).toBeInTheDocument();

    expect(await screen.findByText('기본')).toBeInTheDocument();
    expect(screen.queryByText('스터디')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('새 카테고리 이름'), '스터디');
    await user.click(screen.getByRole('button', { name: '추가' }));

    expect(await screen.findByText('스터디')).toBeInTheDocument();
    expect(getCategories).toHaveBeenCalledTimes(2);
  });
});
