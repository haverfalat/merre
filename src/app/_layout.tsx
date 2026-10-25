import { GeistMono_400Regular } from '@expo-google-fonts/geist-mono/400Regular';
import { Geist_400Regular } from '@expo-google-fonts/geist/400Regular';
import { Geist_500Medium } from '@expo-google-fonts/geist/500Medium';
import { Geist_600SemiBold } from '@expo-google-fonts/geist/600SemiBold';
import { useFonts } from 'expo-font';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { QueryError } from '~/components/ui/QueryError';
import { configureRuntime } from '~/lib/runtime';
import { AppProviders } from '~/providers/AppProviders';
import '../global.css';

configureRuntime();
void SplashScreen.preventAutoHideAsync().catch(() => {});
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return (
    <AppProviders>
      <QueryError retry={retry} />
    </AppProviders>
  );
}
export default function RootLayout() {
  const [loaded, error] = useFonts({
    Geist: Geist_400Regular,
    GeistMedium: Geist_500Medium,
    GeistSemibold: Geist_600SemiBold,
    GeistMono: GeistMono_400Regular,
    MNR2007: require('../../assets/fonts/MNR2007.ttf'),
  });
  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);
  if (!loaded && !error) return null;
  return (
    <AppProviders>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </AppProviders>
  );
}
