import { useTranslation } from '@/hooks/useTranslation';
import { type CSSProperties } from 'react';
import { View } from 'react-native';
import { MapTileError } from './MapTileError';
import type { TransitMapProps } from './TransitMap.types';
import { useMapPadding } from './useMapPadding';
import { useWebMap } from './web/useWebMap';
import { useWebMapCamera } from './web/useWebMapCamera';

export function TransitMap({
  data,
  location,
  bottomInset,
  leftInset,
  topInset = 0,
  rightInset = 0,
}: TransitMapProps) {
  const { container, map, ready, failed, retry } = useWebMap({
    data,
    location,
    bottomInset,
    leftInset,
    topInset,
    rightInset,
  });
  const padding = useMapPadding({ bottomInset, leftInset, topInset, rightInset });
  const { t } = useTranslation();
  useWebMapCamera(map, ready, data, padding);
  return (
    <View style={{ position: 'absolute', inset: 0 }}>
      <div
        ref={container}
        data-map-moving="false"
        role="region"
        aria-label={t('map')}
        style={
          {
            width: '100%',
            height: '100%',
            '--map-safe-bottom': `${bottomInset + 4}px`,
            '--map-safe-right': `${rightInset + 4}px`,
          } as CSSProperties
        }
      />
      {failed && <MapTileError onRetry={retry} />}
    </View>
  );
}
