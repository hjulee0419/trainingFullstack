// useStatusDisplay: 커스텀 값이 없으면 기본 번역 라벨/CSS 토큰 색상, 있으면 커스텀 값을 반환하는지 검증한다.
import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStatusDisplay } from '@/features/todos/hooks/useStatusDisplay';
import { useStatusDisplayStore } from '@/features/todos/store/useStatusDisplayStore';

describe('useStatusDisplay', () => {
  beforeEach(() => {
    useStatusDisplayStore.setState({ labels: {}, colors: {} });
  });

  it('커스텀 값이 없으면 기본 라벨과 색상을 반환한다', () => {
    const { result } = renderHook(() => useStatusDisplay('overdue'));

    expect(result.current.label).toBe('기한초과');
    expect(result.current.color).toEqual({
      bg: 'var(--color-status-overdue-bg)',
      text: 'var(--color-status-overdue-text)',
    });
  });

  it('커스텀 라벨이 있으면 그 값을 반환한다', () => {
    useStatusDisplayStore.getState().setLabel('overdue', '늦었어요');
    const { result } = renderHook(() => useStatusDisplay('overdue'));

    expect(result.current.label).toBe('늦었어요');
  });

  it('커스텀 색상이 있으면 그 값을 반환한다', () => {
    useStatusDisplayStore.getState().setColor('overdue', { bg: '#123456', text: '#abcdef' });
    const { result } = renderHook(() => useStatusDisplay('overdue'));

    expect(result.current.color).toEqual({ bg: '#123456', text: '#abcdef' });
  });
});
