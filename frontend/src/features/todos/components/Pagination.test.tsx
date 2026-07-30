// FE-4 완료조건 5: 페이지네이션(개수 제한) UI 동작 확인.
// page/totalPages props에 따라 이전/다음 버튼 활성/비활성 여부, 클릭 시 onPageChange 호출 인자를 검증한다.
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '@/features/todos/components/Pagination';

describe('Pagination', () => {
  it('첫 페이지에서는 "이전" 버튼이 비활성화된다', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /이전/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /다음/ })).toBeEnabled();
  });

  it('마지막 페이지에서는 "다음" 버튼이 비활성화된다', () => {
    render(<Pagination page={5} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /다음/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /이전/ })).toBeEnabled();
  });

  it('"다음" 버튼 클릭 시 onPageChange가 다음 페이지 번호로 호출된다', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: /다음/ }));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('"이전" 버튼 클릭 시 onPageChange가 이전 페이지 번호로 호출된다', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: /이전/ }));

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('특정 페이지 번호 버튼 클릭 시 onPageChange가 해당 번호로 호출된다', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: '3' }));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('totalPages가 1 이하이면 아무것도 렌더링하지 않는다', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPageChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
