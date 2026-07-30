// 다국어 지원의 근거가 되는 로케일 스토어: 기본값(ko), setLocale, toggleLocale 동작을 검증한다.
import { beforeEach, describe, expect, it } from 'vitest';
import { useLocaleStore } from '@/features/locale/useLocaleStore';

describe('useLocaleStore', () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: 'ko' });
  });

  it('기본값은 ko이다', () => {
    expect(useLocaleStore.getState().locale).toBe('ko');
  });

  it('setLocale으로 특정 로케일을 지정할 수 있다', () => {
    useLocaleStore.getState().setLocale('en');
    expect(useLocaleStore.getState().locale).toBe('en');
  });

  it('toggleLocale은 ko↔en을 오간다', () => {
    useLocaleStore.getState().toggleLocale();
    expect(useLocaleStore.getState().locale).toBe('en');

    useLocaleStore.getState().toggleLocale();
    expect(useLocaleStore.getState().locale).toBe('ko');
  });
});
