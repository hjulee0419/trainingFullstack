// devLog/devError: 개발 환경(import.meta.env.DEV)에서만 콘솔에 기록되는지 검증한다.
// Vite는 production 빌드 시 import.meta.env.DEV를 정적으로 false로 치환해 해당 분기를
// 데드코드로 제거하므로(런타임 값이 아닌 빌드타임 상수), 이 테스트는 "DEV일 때 로그가
// 실제로 찍히는지"를 검증하는 것으로 충분하다 — vitest 실행 환경 자체가 DEV=true다.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { devError, devLog } from '@/lib/devLog';

describe('devLog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('개발 환경에서 console.log로 전달한 인자를 그대로 기록한다', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    devLog('메시지', { a: 1 });

    expect(logSpy).toHaveBeenCalledWith('메시지', { a: 1 });
  });

  it('devError는 console.error로 전달한 인자를 그대로 기록한다', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    devError('에러 메시지', { code: 500 });

    expect(errorSpy).toHaveBeenCalledWith('에러 메시지', { code: 500 });
  });
});
