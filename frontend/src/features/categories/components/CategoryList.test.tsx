// FE-3 완료조건 2: 기본 카테고리에 수정/삭제 UI 미노출을 검증한다.
// useCategoriesQuery(내부적으로 categoryApi.getCategories)를 모킹하여
// [{id:1,name:'기본',isDefault:true,...},{id:2,name:'과제',isDefault:false,...}]를 반환하도록 하고,
// '기본' 행에는 '수정'/'삭제' 버튼이 존재하지 않고 '과제' 행에는 존재하는지 확인한다.
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoryList } from '@/features/categories/components/CategoryList';
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
  {
    id: '2',
    name: '과제',
    isDefault: false,
    ownerId: '1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

function renderCategoryList() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CategoryList />
    </QueryClientProvider>,
  );
}

describe('CategoryList', () => {
  beforeEach(() => {
    vi.mocked(getCategories).mockReset();
  });

  it('목록 조회 실패 시 에러 메시지를 표시한다', async () => {
    vi.mocked(getCategories).mockRejectedValueOnce({ statusCode: 500, message: '서버 오류' });

    renderCategoryList();

    expect(await screen.findByRole('alert')).toHaveTextContent('서버 오류');
  });

  it('카테고리가 없으면 빈 상태 메시지를 표시한다', async () => {
    vi.mocked(getCategories).mockResolvedValueOnce([]);

    renderCategoryList();

    expect(await screen.findByText('등록된 카테고리가 없습니다.')).toBeInTheDocument();
  });

  it('기본 카테고리에는 수정/삭제 버튼이 없고, 일반 카테고리에는 있다', async () => {
    vi.mocked(getCategories).mockResolvedValueOnce(categories);

    renderCategoryList();

    const defaultRow = (await screen.findByText('기본')).closest('li');
    expect(defaultRow).not.toBeNull();
    expect(within(defaultRow as HTMLElement).queryByRole('button', { name: '수정' })).not.toBeInTheDocument();
    expect(within(defaultRow as HTMLElement).queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();

    const customRow = screen.getByText('과제').closest('li');
    expect(customRow).not.toBeNull();
    expect(within(customRow as HTMLElement).getByRole('button', { name: '수정' })).toBeInTheDocument();
    expect(within(customRow as HTMLElement).getByRole('button', { name: '삭제' })).toBeInTheDocument();
  });
});
