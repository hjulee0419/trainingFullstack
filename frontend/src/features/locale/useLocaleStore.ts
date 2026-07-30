import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'ko' | 'en';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: 'ko',
      setLocale: (locale) => set({ locale }),
      toggleLocale: () => set({ locale: get().locale === 'ko' ? 'en' : 'ko' }),
    }),
    {
      name: 'todolist-locale',
    },
  ),
);
