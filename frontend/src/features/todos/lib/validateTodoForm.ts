import { useLocaleStore } from '@/features/locale/useLocaleStore';
import { translate } from '@/lib/i18n/useTranslation';

export interface TodoFormValues {
  title: string;
  description: string;
  categoryId: string;
  startDate: string;
  endDate: string;
}

export interface TodoFormErrors {
  title?: string;
  startDate?: string;
  endDate?: string;
}

export function validateTodoForm(values: TodoFormValues): TodoFormErrors {
  const locale = useLocaleStore.getState().locale;
  const errors: TodoFormErrors = {};
  if (!values.title.trim()) errors.title = translate(locale, 'todo.validation.titleRequired');
  if (!values.startDate) errors.startDate = translate(locale, 'todo.validation.startDateRequired');
  if (!values.endDate) errors.endDate = translate(locale, 'todo.validation.endDateRequired');
  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    errors.endDate = translate(locale, 'todo.validation.endDateBeforeStart'); // E-1
  }
  return errors;
}
