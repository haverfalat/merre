import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export function useSystemTheme(background: string) {
  useEffect(() => {
    if (Platform.OS !== 'web') void SystemUI.setBackgroundColorAsync(background).catch(() => {});
  }, [background]);
}
