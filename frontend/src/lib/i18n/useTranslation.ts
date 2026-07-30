import { useLocaleStore } from '@/features/locale/useLocaleStore';
import { translations, type TranslationKey } from '@/lib/i18n/translations';

type TranslationParams = Record<string, string | number>;

export function translate(
  locale: 'ko' | 'en',
  key: TranslationKey,
  params?: TranslationParams,
): string {
  const dictionary = translations[locale] as Record<string, string>;
  const fallbackDictionary = translations.ko as Record<string, string>;
  let text = dictionary[key] ?? fallbackDictionary[key] ?? key;

  if (params) {
    for (const [paramKey, value] of Object.entries(params)) {
      text = text.replaceAll(`{${paramKey}}`, String(value));
    }
  }

  return text;
}

export function useTranslation() {
  const locale = useLocaleStore((state) => state.locale);

  function t(key: TranslationKey, params?: TranslationParams): string {
    return translate(locale, key, params);
  }

  return { t, locale };
}
