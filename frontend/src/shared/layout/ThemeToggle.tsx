import { useThemeStore } from '@/features/theme/useThemeStore';
import { useTranslation } from '@/lib/i18n/useTranslation';

export function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const { t } = useTranslation();

  const isDark = theme === 'dark';
  const label = isDark ? t('common.themeToggle.toLight') : t('common.themeToggle.toDark');

  return (
    <button type="button" className="gnb-icon-button" aria-label={label} title={label} onClick={toggleTheme}>
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
