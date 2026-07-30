import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { onUnauthorized } from '@/lib/authEvents';

interface RequestInterceptorHandler {
  fulfilled?: (config: { headers: Record<string, string> }) => {
    headers: Record<string, string>;
  };
}

interface ResponseInterceptorHandler {
  fulfilled?: (response: unknown) => unknown;
  rejected?: (error: unknown) => unknown;
}

function getRequestInterceptor() {
  const handlers = (
    apiClient.interceptors.request as unknown as {
      handlers: RequestInterceptorHandler[];
    }
  ).handlers;
  const handler = handlers.find((h) => h?.fulfilled);
  if (!handler?.fulfilled) {
    throw new Error('요청 인터셉터가 등록되어 있지 않습니다.');
  }
  return handler.fulfilled;
}

function getResponseInterceptor() {
  const handlers = (
    apiClient.interceptors.response as unknown as {
      handlers: ResponseInterceptorHandler[];
    }
  ).handlers;
  const handler = handlers.find((h) => h?.rejected);
  if (!handler?.fulfilled || !handler?.rejected) {
    throw new Error('응답 인터셉터가 등록되어 있지 않습니다.');
  }
  return handler;
}

describe('apiClient 요청 인터셉터', () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: null, isAuthenticated: false });
  });

  it('accessToken이 있으면 Authorization 헤더를 부착한다', () => {
    useAuthStore.setState({ accessToken: 'test-token-123', isAuthenticated: true });

    const fulfilled = getRequestInterceptor();
    const config = fulfilled({ headers: {} });

    expect(config.headers.Authorization).toBe('Bearer test-token-123');
  });

  it('accessToken이 없으면 Authorization 헤더를 부착하지 않는다', () => {
    useAuthStore.setState({ accessToken: null, isAuthenticated: false });

    const fulfilled = getRequestInterceptor();
    const config = fulfilled({ headers: {} });

    expect(config.headers.Authorization).toBeUndefined();
  });
});

describe('apiClient 응답 인터셉터', () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: null, isAuthenticated: false });
  });

  it('정상 응답은 그대로 통과시킨다', () => {
    const { fulfilled } = getResponseInterceptor();
    const response = { data: { ok: true } };

    expect(fulfilled?.(response)).toBe(response);
  });

  it('401 응답이면 토큰을 초기화하고 서버 에러 데이터를 reject한다', async () => {
    useAuthStore.setState({ accessToken: 'test-token-123', isAuthenticated: true });
    const { rejected } = getResponseInterceptor();

    const errorData = { statusCode: 401, message: '인증이 필요합니다.' };
    const error = {
      response: { status: 401, data: errorData },
    };

    await expect(rejected?.(error)).rejects.toEqual(errorData);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('네트워크 오류(응답 없음)면 네트워크 에러 객체로 reject한다', async () => {
    const { rejected } = getResponseInterceptor();
    const error = { response: undefined };

    await expect(rejected?.(error)).rejects.toEqual({
      statusCode: 0,
      message: '네트워크 오류가 발생했습니다.',
    });
  });

  it('401이 아닌 응답 에러면 토큰을 유지한 채 서버 에러 데이터를 reject한다', async () => {
    useAuthStore.setState({ accessToken: 'test-token-123', isAuthenticated: true });
    const { rejected } = getResponseInterceptor();

    const errorData = { statusCode: 500, message: '서버 오류가 발생했습니다.' };
    const error = {
      response: { status: 500, data: errorData },
    };

    await expect(rejected?.(error)).rejects.toEqual(errorData);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  // FE-2 완료조건 5(401 응답 시 자동 로그아웃 + 리다이렉트) 검증:
  // 인터셉터가 토큰을 초기화할 뿐 아니라 authEvents의 onUnauthorized 리스너에게도
  // 알리는지(라우팅 레이어가 이를 구독해 /login으로 리다이렉트할 수 있어야 함) 확인한다.
  it('401 응답이면 onUnauthorized로 등록된 리스너가 호출된다', async () => {
    useAuthStore.setState({ accessToken: 'test-token-123', isAuthenticated: true });
    const { rejected } = getResponseInterceptor();

    const listener = vi.fn();
    const unsubscribe = onUnauthorized(listener);

    const errorData = { statusCode: 401, message: '인증이 필요합니다.' };
    const error = {
      response: { status: 401, data: errorData },
    };

    await expect(rejected?.(error)).rejects.toEqual(errorData);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });
});
