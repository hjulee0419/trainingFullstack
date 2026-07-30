import type { ApiError } from '@/types/api';
import { useLocaleStore } from '@/features/locale/useLocaleStore';
import { translate } from '@/lib/i18n/useTranslation';

export function getErrorMessage(error: unknown, fallback?: string): string {
  const locale = useLocaleStore.getState().locale;
  const resolvedFallback = fallback ?? translate(locale, 'common.genericError');

  if (isApiError(error)) {
    if (error.statusCode === 404) return translate(locale, 'common.notFound');
    return error.message || resolvedFallback;
  }
  return resolvedFallback;
}

function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'statusCode' in e && 'message' in e;
}
