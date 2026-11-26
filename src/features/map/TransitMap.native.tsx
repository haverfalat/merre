import { useTranslation } from '@/hooks/useTranslation';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { lazy, Suspense } from 'react';
import { ActivityIndicator, Platform, TurboModuleRegistry, View } from 'react-native';
import { Text } from '~/components/ui/Text';
import { useTheme } from '~/lib/theme';
import { useNativeMapPreferences } from '~/store/useNativeMapPreferences';
import { mapRenderer } from './map-runtime';
import type { TransitMapProps } from './TransitMap.types';

// Never evaluate MapLibre's getEnforcing() imports inside Expo Go. A missing
// native module otherwise crashes the route before its error boundary can mount.
const MapLibreMap = lazy(() =>
  import('./MapLibreMap.native').then((m) => ({ default: m.TransitMap })),
);
const ExpoGoMap = lazy(() => import('./ExpoGoMap.native').then((m) => ({ default: m.ExpoGoMap })));
export function TransitMap(props: TransitMapProps) {
  const { t, language } = useTranslation();
  const c = useTheme();
  const apple3D = useNativeMapPreferences((s) => s.appleSatellite3D);
  const renderer = mapRenderer(
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient,
    TurboModuleRegistry.get('MLRNCameraModule') !== null,
    Platform.OS === 'ios' && apple3D,
  );
  return (
    <Suspense
      fallback={
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            backgroundColor: c.background,
          }}
        >
          <ActivityIndicator size="small" color={c.secondary} accessibilityLabel={t('loading_map')} />
          <Text style={{ fontSize: 14, color: c.secondary }}>{t('loading_map')}</Text>
        </View>
      }
    >
      {renderer === 'expo-go' || renderer === 'apple' ? (
        <ExpoGoMap {...props} />
      ) : renderer === 'maplibre' ? (
        <MapLibreMap {...props} />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', padding: 28, gap: 12 }}>
          <Text>
            {language === 'hu'
              ? 'A térképhez friss fejlesztői build szükséges.'
              : 'The map needs a new development build.'}
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20 }}>
            {language === 'hu'
              ? 'Futtasd az expo mappában: npm run ios vagy npm run android. Expo Go előnézethez: npm start.'
              : 'From expo/: run npm run ios or npm run android. For an Expo Go preview: npm start.'}
          </Text>
        </View>
      )}
    </Suspense>
  );
}
