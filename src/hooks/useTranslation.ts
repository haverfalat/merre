'use client';

import { useCallback } from 'react';
import { t as translate, type TranslationKey } from '@/i18n/dict';
import { useUIStore } from '@/store/useUIStore';

export function useTranslation() {
  const language = useUIStore((state) => state.language);
  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(key, language, params),
    [language],
  );
  return { t, language };
}
