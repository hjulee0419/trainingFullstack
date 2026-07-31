// StatusDisplaySettings: 4개 상태 각각의 라벨 입력이 스토어를 갱신하고, 초기화 버튼이
// 커스텀 값을 지우는지 검증한다. deriveTodoStatus의 자동 계산 로직은 대상이 아니다.
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusDisplaySettings } from '@/features/todos/components/StatusDisplaySettings';
import { useStatusDisplayStore } from '@/features/todos/store/useStatusDisplayStore';

describe('StatusDisplaySettings', () => {
  beforeEach(() => {
    useStatusDisplayStore.setState({ labels: {}, colors: {} });
  });

  it('4개 상태의 기본 배지를 모두 렌더링한다', () => {
    render(<StatusDisplaySettings />);

    expect(screen.getByText('시작 전')).toBeInTheDocument();
    expect(screen.getByText('진행중')).toBeInTheDocument();
    expect(screen.getByText('완료')).toBeInTheDocument();
    expect(screen.getByText('기한초과')).toBeInTheDocument();
  });

  it('라벨 입력창에 값을 입력하면 스토어에 반영되고 배지 텍스트가 즉시 바뀐다', async () => {
    const user = userEvent.setup();
    render(<StatusDisplaySettings />);

    const overdueLabelInput = screen.getByLabelText('기한초과 표시 이름');
    await user.type(overdueLabelInput, '늦음');

    expect(useStatusDisplayStore.getState().labels.overdue).toBe('늦음');
    expect(screen.getByText('늦음')).toBeInTheDocument();
  });

  it('개별 초기화 버튼은 해당 상태의 커스텀 라벨만 지운다', async () => {
    const user = userEvent.setup();
    useStatusDisplayStore.getState().setLabel('overdue', '늦음');
    render(<StatusDisplaySettings />);

    const resetButtons = screen.getAllByRole('button', { name: '초기화' });
    // STATUS_ORDER: not_started, in_progress, completed, overdue → 마지막이 overdue 행
    await user.click(resetButtons[resetButtons.length - 1]);

    expect(useStatusDisplayStore.getState().labels.overdue).toBeUndefined();
    expect(screen.getByText('기한초과')).toBeInTheDocument();
  });

  it('전체 초기화 버튼은 모든 커스텀 라벨/색상을 지운다', async () => {
    const user = userEvent.setup();
    useStatusDisplayStore.getState().setLabel('overdue', '늦음');
    useStatusDisplayStore.getState().setColor('completed', { bg: '#000000', text: '#ffffff' });
    render(<StatusDisplaySettings />);

    await user.click(screen.getByRole('button', { name: '전체 초기화' }));

    expect(useStatusDisplayStore.getState().labels).toEqual({});
    expect(useStatusDisplayStore.getState().colors).toEqual({});
  });
});
