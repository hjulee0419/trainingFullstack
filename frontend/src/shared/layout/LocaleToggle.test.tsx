// 언어 전환 버튼: 현재 로케일 표시(KO/EN)와 클릭 시 로케일 전환을 검증한다.
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocaleToggle } from '@/shared/layout/LocaleToggle';
import { useLocaleStore } from '@/features/locale/useLocaleStore';

describe('LocaleToggle', () => {
  beforeEach(() => {
    useLocaleStore.setState({ locale: 'ko' });
  });

  it('ko 상태에서는 KO 라벨을 노출한다', () => {
    render(<LocaleToggle />);
    expect(screen.getByRole('button', { name: '언어 전환' })).toHaveTextContent('KO');
  });

  it('클릭 시 로케일이 en으로 전환되고 EN 라벨이 노출된다', async () => {
    const user = userEvent.setup();
    render(<LocaleToggle />);

    await user.click(screen.getByRole('button', { name: '언어 전환' }));

    expect(useLocaleStore.getState().locale).toBe('en');
    // 버튼의 aria-label 자체도 t()로 번역되므로 전환 후에는 영어 라벨이 된다.
    expect(screen.getByRole('button', { name: 'Switch language' })).toHaveTextContent('EN');
  });
});
