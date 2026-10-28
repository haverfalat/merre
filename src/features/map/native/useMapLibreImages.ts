import { type ImageEntry } from '@maplibre/maplibre-react-native';
import { useMemo } from 'react';
import type { TransitMapProps } from '~/features/map/TransitMap.types';
import { glyphAssets } from '~/features/map/glyph-assets';
import {
  BEARING_ARROW_IMAGE,
  bearingArrowAsset,
  LOCATION_HEADING_IMAGE,
  locationHeadingAsset,
  VEHICLE_BADGE_IMAGE,
  vehicleBadgeAsset,
} from '~/features/map/marker-assets';
import { stopRingImage } from '~/features/map/stop-sprite';

export function useMapLibreImages(data: TransitMapProps['data']) {
  const symbols = [
    ...new Set(data.symbols.features.map((feature) => feature.properties?.symbol).filter(Boolean)),
  ]
    .sort()
    .join('|');
  const rings = [
    ...new Set(
      data.stopMarkers.features.map((feature) => feature.properties?.ring).filter(Boolean),
    ),
  ]
    .sort()
    .join('|');
  return useMemo<Record<string, ImageEntry>>(
    () => ({
      [VEHICLE_BADGE_IMAGE]: { source: vehicleBadgeAsset, sdf: true },
      [BEARING_ARROW_IMAGE]: { source: bearingArrowAsset, sdf: true },
      [LOCATION_HEADING_IMAGE]: locationHeadingAsset,
      ...Object.fromEntries(
        rings.split('|').flatMap((id) => {
          const image = stopRingImage(id);
          return image ? [[id, image.uri]] : [];
        }),
      ),
      ...Object.fromEntries(
        symbols
          .split('|')
          .filter((id) => glyphAssets[id])
          .map((id) => [id, { source: glyphAssets[id], sdf: true }]),
      ),
    }),
    [symbols, rings],
  );
}
