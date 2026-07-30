import type { ApiError } from '@/types/api';

export function getErrorMessage(error: unknown, fallback = '요청 처리 중 오류가 발생했습니다.'): string {
  if (isApiError(error)) {
    if (error.statusCode === 404) return '존재하지 않는 항목입니다.';
    return error.message || fallback;
  }
  return fallback;
}

function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'statusCode' in e && 'message' in e;
}
