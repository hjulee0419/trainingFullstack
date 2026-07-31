import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TodoStatus } from '@/features/todos/types';

export interface StatusColor {
  bg: string;
  text: string;
}

interface StatusDisplayState {
  labels: Partial<Record<TodoStatus, string>>;
  colors: Partial<Record<TodoStatus, StatusColor>>;
  setLabel: (status: TodoStatus, label: string) => void;
  setColor: (status: TodoStatus, color: StatusColor) => void;
  resetStatus: (status: TodoStatus) => void;
  resetAll: () => void;
}

export const useStatusDisplayStore = create<StatusDisplayState>()(
  persist(
    (set) => ({
      labels: {},
      colors: {},
      setLabel: (status, label) =>
        set((state) => {
          const labels = { ...state.labels };
          if (label.trim()) {
            labels[status] = label;
          } else {
            delete labels[status];
          }
          return { labels };
        }),
      setColor: (status, color) =>
        set((state) => ({ colors: { ...state.colors, [status]: color } })),
      resetStatus: (status) =>
        set((state) => {
          const labels = { ...state.labels };
          const colors = { ...state.colors };
          delete labels[status];
          delete colors[status];
          return { labels, colors };
        }),
      resetAll: () => set({ labels: {}, colors: {} }),
    }),
    {
      name: 'todolist-status-display',
    },
  ),
);
