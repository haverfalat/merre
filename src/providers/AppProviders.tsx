import { MavOfflineSync } from '~/features/tickets/components/MavOfflineSync';
import { makeQueryClient } from '@/lib/query-client';
import { useUIStore } from '@/store/useUIStore';
import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '~/lib/theme';
import { usePreferences } from './usePreferences';
import { useQueryLifecycle } from './useQueryLifecycle';
import { useSystemTheme } from './useSystemTheme';

export function AppProviders({ children }: PropsWithChildren) {
  const [client] = useState(makeQueryClient);
  const theme = useUIStore((s) => s.theme);
  const c = useTheme();
  usePreferences();
  useSystemTheme(c.background);
  useQueryLifecycle();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: c.background }}>
      <SafeAreaProvider>
        <QueryClientProvider client={client}>
          <ThemeProvider
            value={{
              ...(theme === 'dark' ? DarkTheme : DefaultTheme),
              colors: {
                ...(theme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
                background: c.background,
                card: c.card,
                text: c.text,
                border: c.border,
                primary: c.accent,
              },
            }}
          >
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
            <MavOfflineSync />
            {children}
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
