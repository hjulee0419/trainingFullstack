import { common } from '@/lib/i18n/dictionaries/common';
import { auth } from '@/lib/i18n/dictionaries/auth';
import { category } from '@/lib/i18n/dictionaries/category';
import { todo } from '@/lib/i18n/dictionaries/todo';
import { account } from '@/lib/i18n/dictionaries/account';

export const translations = {
  ko: {
    ...common.ko,
    ...auth.ko,
    ...category.ko,
    ...todo.ko,
    ...account.ko,
  },
  en: {
    ...common.en,
    ...auth.en,
    ...category.en,
    ...todo.en,
    ...account.en,
  },
} as const;

export type TranslationKey = keyof typeof translations.ko;
