import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export function useSystemTheme(background: string, focus: string, scheme: 'dark' | 'light') {
  useEffect(() => {
    if (Platform.OS === 'web') {
      document.documentElement.style.setProperty('--merre-focus', focus);
      document.documentElement.style.colorScheme = scheme;
      document.body.style.backgroundColor = background;
    } else void SystemUI.setBackgroundColorAsync(background).catch(() => {});
  }, [background, focus, scheme]);
}
