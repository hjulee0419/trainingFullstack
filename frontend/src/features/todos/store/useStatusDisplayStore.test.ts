// 상태 표시(라벨/색상) 커스터마이징 스토어: setLabel의 빈 문자열=초기화 의미론과
// resetStatus/resetAll 동작을 검증한다. 자동 파생 로직(deriveTodoStatus) 자체는 건드리지 않는다.
import { beforeEach, describe, expect, it } from 'vitest';
import { useStatusDisplayStore } from '@/features/todos/store/useStatusDisplayStore';

describe('useStatusDisplayStore', () => {
  beforeEach(() => {
    useStatusDisplayStore.setState({ labels: {}, colors: {} });
  });

  it('기본 상태에서는 커스텀 라벨/색상이 없다', () => {
    expect(useStatusDisplayStore.getState().labels.in_progress).toBeUndefined();
    expect(useStatusDisplayStore.getState().colors.in_progress).toBeUndefined();
  });

  it('setLabel으로 커스텀 라벨을 지정할 수 있다', () => {
    useStatusDisplayStore.getState().setLabel('in_progress', '진행 중이에요');
    expect(useStatusDisplayStore.getState().labels.in_progress).toBe('진행 중이에요');
  });

  it('setLabel에 빈 문자열을 넘기면 커스텀 라벨이 제거된다(기본값 사용)', () => {
    useStatusDisplayStore.getState().setLabel('in_progress', '진행 중이에요');
    useStatusDisplayStore.getState().setLabel('in_progress', '  ');
    expect(useStatusDisplayStore.getState().labels.in_progress).toBeUndefined();
  });

  it('setColor으로 배경/글자색을 지정할 수 있다', () => {
    useStatusDisplayStore.getState().setColor('overdue', { bg: '#111111', text: '#eeeeee' });
    expect(useStatusDisplayStore.getState().colors.overdue).toEqual({ bg: '#111111', text: '#eeeeee' });
  });

  it('resetStatus는 해당 상태의 라벨/색상만 초기화한다', () => {
    useStatusDisplayStore.getState().setLabel('overdue', '늦음');
    useStatusDisplayStore.getState().setLabel('completed', '끝');
    useStatusDisplayStore.getState().resetStatus('overdue');

    expect(useStatusDisplayStore.getState().labels.overdue).toBeUndefined();
    expect(useStatusDisplayStore.getState().labels.completed).toBe('끝');
  });

  it('resetAll은 모든 커스텀 라벨/색상을 초기화한다', () => {
    useStatusDisplayStore.getState().setLabel('overdue', '늦음');
    useStatusDisplayStore.getState().setColor('completed', { bg: '#000', text: '#fff' });
    useStatusDisplayStore.getState().resetAll();

    expect(useStatusDisplayStore.getState().labels).toEqual({});
    expect(useStatusDisplayStore.getState().colors).toEqual({});
  });
});
