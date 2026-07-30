import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/shared/components/Input';

describe('Input', () => {
  it('value를 표시하고 입력 시 onChange가 호출된다', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Input label="이름" value="" onChange={onChange} />);

    const input = screen.getByLabelText('이름');
    expect(input).toHaveValue('');

    await user.type(input, 'a');

    expect(onChange).toHaveBeenCalled();
  });

  it('error prop을 전달하면 에러 문구가 표시된다', () => {
    render(<Input value="" onChange={vi.fn()} error="필수 입력값입니다." />);

    expect(screen.getByText('필수 입력값입니다.')).toBeInTheDocument();
  });
});
