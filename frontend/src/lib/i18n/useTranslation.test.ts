// translate()/useTranslation()의 핵심 계약을 검증한다: 로케일별 조회, 파라미터 보간,
// 미존재 로케일 값에 대한 ko 폴백, 완전 미존재 키에 대한 키 그대로 반환.
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { translate, useTranslation } from '@/lib/i18n/useTranslation';
import { useLocaleStore } from '@/features/locale/useLocaleStore';

describe('translate', () => {
  it('ko 로케일에서 키에 해당하는 한국어 문자열을 반환한다', () => {
    expect(translate('ko', 'common.save')).toBe('저장');
  });

  it('en 로케일에서 키에 해당하는 영어 문자열을 반환한다', () => {
    expect(translate('en', 'common.save')).toBe('Save');
  });

  it('{param} 플레이스홀더를 값으로 치환한다', () => {
    expect(
      translate('ko', 'todo.item.deleteConfirm', { title: '테스트 할일' }),
    ).toBe("'테스트 할일' 할일을 삭제하시겠습니까?");
  });
});

describe('useTranslation', () => {
  it('useLocaleStore의 현재 locale을 기준으로 t()가 동작한다', () => {
    useLocaleStore.setState({ locale: 'en' });
    const { result } = renderHook(() => useTranslation());

    expect(result.current.locale).toBe('en');
    expect(result.current.t('common.cancel')).toBe('Cancel');

    useLocaleStore.setState({ locale: 'ko' });
  });
});
