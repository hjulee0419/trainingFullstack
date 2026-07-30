import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('role="status"로 렌더링된다', () => {
    render(<LoadingSpinner />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('size prop을 전달하면 에러 없이 렌더링된다', () => {
    render(<LoadingSpinner size={48} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
