// FE-3 완료조건 3: 삭제 컨펌 다이얼로그 노출 및 확인/취소에 따른 deleteCategory 호출 여부 검증.
// FE-3 완료조건 4: 수정 버튼 클릭 시 인라인 편집 노출, 이름 변경 후 저장 시 updateCategory 호출(새 이름 포함) 검증.
// 기본 카테고리(isDefault:true)를 넘기면 수정/삭제 버튼 자체가 노출되지 않음도 컴포넌트 단위로 재확인한다.
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoryRow } from '@/features/categories/components/CategoryRow';
import type { Category } from '@/features/categories/types';

vi.mock('@/features/categories/api/categoryApi', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

import { updateCategory, deleteCategory } from '@/features/categories/api/categoryApi';

const customCategory: Category = {
  id: '2',
  name: '과제',
  isDefault: false,
  ownerId: '1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const defaultCategory: Category = {
  id: '1',
  name: '기본',
  isDefault: true,
  ownerId: '1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function renderCategoryRow(category: Category) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ul>
        <CategoryRow category={category} />
      </ul>
    </QueryClientProvider>,
  );
}

describe('CategoryRow', () => {
  beforeEach(() => {
    vi.mocked(updateCategory).mockReset();
    vi.mocked(deleteCategory).mockReset();
  });

  it('기본 카테고리는 수정/삭제 버튼을 노출하지 않는다', () => {
    renderCategoryRow(defaultCategory);

    expect(screen.queryByRole('button', { name: '수정' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
  });

  it('삭제 버튼 클릭 시 컨펌 다이얼로그가 노출되고, 취소 시 deleteCategory가 호출되지 않는다', async () => {
    const user = userEvent.setup();
    renderCategoryRow(customCategory);

    await user.click(screen.getByRole('button', { name: '삭제' }));

    expect(await screen.findByText(/삭제하시겠습니까/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(deleteCategory).not.toHaveBeenCalled();
  });

  it('삭제 컨펌 다이얼로그에서 삭제 확인 시 deleteCategory가 호출된다', async () => {
    vi.mocked(deleteCategory).mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderCategoryRow(customCategory);

    await user.click(screen.getByRole('button', { name: '삭제' }));
    await screen.findByText(/삭제하시겠습니까/);

    // 다이얼로그가 열리면 행의 삭제 트리거 버튼과 다이얼로그의 확인 버튼이 함께 존재한다.
    // 다이얼로그는 트리거 버튼 뒤에 렌더링되므로 마지막 버튼이 확인 버튼이다.
    const deleteButtons = screen.getAllByRole('button', { name: '삭제' });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    expect(deleteCategory).toHaveBeenCalledWith(customCategory.id, expect.anything());
  });

  it('수정 취소 시 편집 모드가 닫히고 updateCategory는 호출되지 않는다', async () => {
    const user = userEvent.setup();
    renderCategoryRow(customCategory);

    await user.click(screen.getByRole('button', { name: '수정' }));
    await screen.findByDisplayValue('과제');

    await user.click(screen.getByRole('button', { name: '취소' }));

    expect(screen.queryByDisplayValue('과제')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument();
    expect(updateCategory).not.toHaveBeenCalled();
  });

  it('수정 버튼 클릭 시 인라인 편집 입력창이 노출되고, 이름 변경 후 저장하면 updateCategory가 새 이름으로 호출된다', async () => {
    vi.mocked(updateCategory).mockResolvedValueOnce({ ...customCategory, name: '스터디' });
    const user = userEvent.setup();
    renderCategoryRow(customCategory);

    await user.click(screen.getByRole('button', { name: '수정' }));

    const input = await screen.findByDisplayValue('과제');
    await user.clear(input);
    await user.type(input, '스터디');

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(updateCategory).toHaveBeenCalledWith(customCategory.id, { name: '스터디' });
  });
});
