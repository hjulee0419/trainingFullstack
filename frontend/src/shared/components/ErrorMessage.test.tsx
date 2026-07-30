import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorMessage } from '@/shared/components/ErrorMessage';

describe('ErrorMessage', () => {
  it('message prop 텍스트를 화면에 표시한다', () => {
    render(<ErrorMessage message="오류가 발생했습니다." />);

    expect(screen.getByRole('alert')).toHaveTextContent('오류가 발생했습니다.');
  });
});
