// 다크 모드 지원의 근거가 되는 테마 스토어: 기본값(light), setTheme, toggleTheme 동작을 검증한다.
import { beforeEach, describe, expect, it } from 'vitest';
import { useThemeStore } from '@/features/theme/useThemeStore';

describe('useThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'light' });
  });

  it('기본값은 light이다', () => {
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('setTheme으로 특정 테마를 지정할 수 있다', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');
  });

  it('toggleTheme은 light↔dark를 오간다', () => {
    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('dark');

    useThemeStore.getState().toggleTheme();
    expect(useThemeStore.getState().theme).toBe('light');
  });
});
