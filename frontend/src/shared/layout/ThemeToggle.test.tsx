// 다크 모드 토글 버튼: 현재 테마에 맞는 라벨/아이콘을 노출하고, 클릭 시 테마를 전환하는지 검증한다.
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '@/shared/layout/ThemeToggle';
import { useThemeStore } from '@/features/theme/useThemeStore';

describe('ThemeToggle', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'light' });
  });

  it('light 상태에서는 다크 모드로 전환 버튼을 노출한다', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: '다크 모드로 전환' })).toBeInTheDocument();
  });

  it('클릭 시 테마가 dark로 전환되고 라벨도 바뀐다', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: '다크 모드로 전환' }));

    expect(useThemeStore.getState().theme).toBe('dark');
    expect(screen.getByRole('button', { name: '라이트 모드로 전환' })).toBeInTheDocument();
  });
});
