import en from './en.json';
import hu from './hu.json';

export type TranslationKey = keyof typeof en;

const dicts = { en, hu };

export function t(key: TranslationKey, lang: 'en' | 'hu' = 'en', params?: Record<string, string | number>): string {
  const dict = dicts[lang] || dicts.en;
  let val = dict[key] || en[key] || key;

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      val = val.replace(`{${k}}`, String(v));
    });
  }

  return val;
}
