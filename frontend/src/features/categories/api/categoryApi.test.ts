// categoryApi는 FE-3 완료조건 1(생성)/3(삭제)/4(수정)이 실제로 호출하는 HTTP 계층이다.
// apiClient의 get/post/patch/delete를 모킹하여 각 함수가 올바른 엔드포인트/페이로드로
// 요청하고 응답 데이터를 그대로 반환하는지 검증한다.
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from '@/api/client';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '@/features/categories/api/categoryApi';
import type { Category } from '@/features/categories/types';

const category: Category = {
  id: '2',
  name: '과제',
  isDefault: false,
  ownerId: '1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('categoryApi', () => {
  it('getCategories는 /categories를 GET하고 응답 데이터를 반환한다', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: [category] });

    const result = await getCategories();

    expect(apiClient.get).toHaveBeenCalledWith('/categories');
    expect(result).toEqual([category]);
  });

  it('createCategory는 /categories로 POST하고 응답 데이터를 반환한다', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: category });

    const result = await createCategory({ name: '과제' });

    expect(apiClient.post).toHaveBeenCalledWith('/categories', { name: '과제' });
    expect(result).toEqual(category);
  });

  it('updateCategory는 /categories/:id로 PATCH하고 응답 데이터를 반환한다', async () => {
    const updated = { ...category, name: '스터디' };
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ data: updated });

    const result = await updateCategory(category.id, { name: '스터디' });

    expect(apiClient.patch).toHaveBeenCalledWith(`/categories/${category.id}`, { name: '스터디' });
    expect(result).toEqual(updated);
  });

  it('deleteCategory는 /categories/:id로 DELETE 요청한다', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: undefined });

    const result = await deleteCategory(category.id);

    expect(apiClient.delete).toHaveBeenCalledWith(`/categories/${category.id}`);
    expect(result).toBeUndefined();
  });
});
