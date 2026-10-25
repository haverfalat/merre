import { useUIStore } from '@/store/useUIStore';
import * as Localization from 'expo-localization';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useNativeMapPreferences } from '~/store/useNativeMapPreferences';

export function usePreferences() {
  useEffect(() => {
    let disposed = false;
    void (async () => {
      const stored = await useUIStore.persist.getOptions().storage?.getItem('tkterkep-preferences');
      if (disposed) return;
      await useUIStore.persist.rehydrate();
      if (Platform.OS === 'ios') await useNativeMapPreferences.persist.rehydrate();
      if (!stored && Localization.getLocales()[0]?.languageCode === 'hu')
        useUIStore.getState().setLanguage('hu');
    })().catch(() => {});
    return () => {
      disposed = true;
    };
  }, []);
}
