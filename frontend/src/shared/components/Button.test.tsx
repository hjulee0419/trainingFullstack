import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/shared/components/Button';

describe('Button', () => {
  it('children을 렌더링한다', () => {
    render(<Button>확인</Button>);

    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
  });

  it('클릭 시 onClick이 호출된다', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>확인</Button>);

    await user.click(screen.getByRole('button', { name: '확인' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disabled면 클릭해도 onClick이 호출되지 않는다', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button onClick={onClick} disabled>
        확인
      </Button>,
    );

    const button = screen.getByRole('button', { name: '확인' });
    expect(button).toBeDisabled();

    await user.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });

  it('primary variant는 hover 시 배경색이 바뀌고 unhover 시 원복된다', async () => {
    const user = userEvent.setup();
    render(<Button variant="primary">확인</Button>);
    const button = screen.getByRole('button', { name: '확인' });

    await user.hover(button);
    expect(button.style.backgroundColor).toBe('var(--color-primary-hover)');

    await user.unhover(button);
    expect(button.style.backgroundColor).toBe('var(--color-primary)');
  });

  it('danger variant는 hover 시 배경색이 바뀌고 unhover 시 원복된다', async () => {
    const user = userEvent.setup();
    render(<Button variant="danger">삭제</Button>);
    const button = screen.getByRole('button', { name: '삭제' });

    await user.hover(button);
    expect(button.style.backgroundColor).toBe('var(--color-danger-bg)');

    await user.unhover(button);
    expect(button.style.backgroundColor).toBe('var(--color-white)');
  });

  it('disabled 상태에서는 hover해도 스타일이 바뀌지 않는다', async () => {
    const user = userEvent.setup();
    render(
      <Button variant="primary" disabled>
        확인
      </Button>,
    );
    const button = screen.getByRole('button', { name: '확인' });

    await user.hover(button);
    expect(button.style.backgroundColor).toBe('var(--color-primary)');
  });
});
