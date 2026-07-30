import { create } from 'zustand';
import type { TodoStatus } from '@/features/todos/types';

interface TodoFilterState {
  categoryId?: string;
  status?: TodoStatus;
  page: number;
  limit: number;
  setCategoryId: (id?: string) => void;
  setStatus: (status?: TodoStatus) => void;
  setPage: (page: number) => void;
  reset: () => void;
}

const initialState = {
  categoryId: undefined,
  status: undefined,
  page: 1,
  limit: 20,
};

export const useTodoFilterStore = create<TodoFilterState>()((set) => ({
  ...initialState,
  setCategoryId: (id) => set({ categoryId: id, page: 1 }),
  setStatus: (status) => set({ status, page: 1 }),
  setPage: (page) => set({ page }),
  reset: () => set({ ...initialState }),
}));
