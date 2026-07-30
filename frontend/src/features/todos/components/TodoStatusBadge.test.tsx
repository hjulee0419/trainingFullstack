// FE-4 완료조건 3: 4개 status 값 각각에 대해 올바른 한글 텍스트가 렌더링되는지 확인한다.
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TodoStatusBadge } from '@/features/todos/components/TodoStatusBadge';
import type { TodoStatus } from '@/features/todos/types';

describe('TodoStatusBadge', () => {
  const cases: Array<[TodoStatus, string]> = [
    ['not_started', '시작 전'],
    ['in_progress', '진행중'],
    ['completed', '완료'],
    ['overdue', '기한초과'],
  ];

  it.each(cases)('status=%s 이면 "%s" 텍스트를 렌더링한다', (status, label) => {
    render(<TodoStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
