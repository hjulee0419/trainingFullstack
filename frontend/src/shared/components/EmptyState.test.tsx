import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/shared/components/EmptyState';

describe('EmptyState', () => {
  it('message prop 텍스트를 화면에 표시한다', () => {
    render(<EmptyState message="할 일이 없습니다." />);

    expect(screen.getByText('할 일이 없습니다.')).toBeInTheDocument();
  });

  it('icon prop을 전달하면 함께 렌더링한다', () => {
    render(<EmptyState message="할 일이 없습니다." icon={<span>icon</span>} />);

    expect(screen.getByText('icon')).toBeInTheDocument();
    expect(screen.getByText('할 일이 없습니다.')).toBeInTheDocument();
  });
});
