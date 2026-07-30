// FE-5 완료조건 1(종료일자<시작일자 시 에러 표시)의 UI 단위 전제 조건: 시작일/종료일 입력 시
// 각 onChange 콜백이 호출되는지, errors prop 전달 시 에러 메시지가 렌더되는지 검증한다.
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangePicker } from '@/features/todos/components/DateRangePicker';

describe('DateRangePicker', () => {
  it('시작일 입력 시 onStartDateChange가 호출된다', async () => {
    const onStartDateChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DateRangePicker
        startDate=""
        endDate=""
        onStartDateChange={onStartDateChange}
        onEndDateChange={vi.fn()}
      />,
    );

    const input = screen.getByLabelText('시작일자 *');
    await user.type(input, '2026-08-01');

    expect(onStartDateChange).toHaveBeenCalled();
  });

  it('종료일 입력 시 onEndDateChange가 호출된다', async () => {
    const onEndDateChange = vi.fn();
    const user = userEvent.setup();

    render(
      <DateRangePicker
        startDate=""
        endDate=""
        onStartDateChange={vi.fn()}
        onEndDateChange={onEndDateChange}
      />,
    );

    const input = screen.getByLabelText('종료일자 *');
    await user.type(input, '2026-08-05');

    expect(onEndDateChange).toHaveBeenCalled();
  });

  it('errors prop 전달 시 각 필드의 에러 메시지가 렌더된다', () => {
    render(
      <DateRangePicker
        startDate="2026-08-05"
        endDate="2026-08-01"
        onStartDateChange={vi.fn()}
        onEndDateChange={vi.fn()}
        errors={{ endDate: '종료일자는 시작일자보다 빠를 수 없습니다.' }}
      />,
    );

    expect(
      screen.getByText('종료일자는 시작일자보다 빠를 수 없습니다.'),
    ).toBeInTheDocument();
  });

  it('errors.startDate 전달 시 시작일 에러 메시지가 렌더된다', () => {
    render(
      <DateRangePicker
        startDate=""
        endDate="2026-08-05"
        onStartDateChange={vi.fn()}
        onEndDateChange={vi.fn()}
        errors={{ startDate: '시작일을 입력해주세요.' }}
      />,
    );

    expect(screen.getByText('시작일을 입력해주세요.')).toBeInTheDocument();
  });

  it('errors prop이 없으면 에러 메시지가 렌더되지 않는다', () => {
    render(
      <DateRangePicker
        startDate="2026-08-01"
        endDate="2026-08-05"
        onStartDateChange={vi.fn()}
        onEndDateChange={vi.fn()}
      />,
    );

    expect(screen.queryByText(/빠를 수 없습니다/)).not.toBeInTheDocument();
  });
});
