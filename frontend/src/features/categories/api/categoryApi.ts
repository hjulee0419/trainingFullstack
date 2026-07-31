import { apiClient } from '@/api/client';
import { devLog, devError } from '@/lib/devLog';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '@/features/categories/types';

export function getCategories(): Promise<Category[]> {
  return apiClient.get<Category[]>('/categories').then((res) => res.data);
}

export function createCategory(req: CreateCategoryRequest): Promise<Category> {
  devLog('[categoryApi] POST /categories request', req);

  return apiClient
    .post<Category>('/categories', req)
    .then((res) => {
      devLog('[categoryApi] POST /categories response', res.data);
      return res.data;
    })
    .catch((error) => {
      devError('[categoryApi] POST /categories error', error);
      throw error;
    });
}

export function updateCategory(id: string, req: UpdateCategoryRequest): Promise<Category> {
  return apiClient.patch<Category>(`/categories/${id}`, req).then((res) => res.data);
}

export function deleteCategory(id: string): Promise<void> {
  return apiClient.delete<void>(`/categories/${id}`).then(() => undefined);
}
