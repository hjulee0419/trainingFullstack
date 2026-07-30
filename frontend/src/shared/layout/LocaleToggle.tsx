import { useLocaleStore } from '@/features/locale/useLocaleStore';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function LocaleToggle() {
  const locale = useLocaleStore((state) => state.locale);
  const toggleLocale = useLocaleStore((state) => state.toggleLocale);
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className="gnb-icon-button gnb-locale-toggle"
      aria-label={t('common.localeToggle.label')}
      title={t('common.localeToggle.label')}
      onClick={toggleLocale}
    >
      {locale === 'ko' ? 'KO' : 'EN'}
    </button>
  );
}
