import { useTranslation } from '@/lib/i18n/useTranslation';
import { useStatusDisplayStore, type StatusColor } from '@/features/todos/store/useStatusDisplayStore';
import { defaultStatusColors, defaultStatusLabelKeys } from '@/features/todos/lib/statusDisplayDefaults';
import type { TodoStatus } from '@/features/todos/types';

export function useStatusDisplay(status: TodoStatus): { label: string; color: StatusColor } {
  const { t } = useTranslation();
  const customLabel = useStatusDisplayStore((state) => state.labels[status]);
  const customColor = useStatusDisplayStore((state) => state.colors[status]);

  return {
    label: customLabel ?? t(defaultStatusLabelKeys[status]),
    color: customColor ?? defaultStatusColors[status],
  };
}
