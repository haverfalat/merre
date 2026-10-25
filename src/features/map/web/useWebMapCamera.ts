import { validCoordinates } from '@/lib/transit';
import { vehicleCameraBearing } from '@/lib/vehicle-camera';
import { useMapStore } from '@/store/useMapStore';
import type { Map as GLMap } from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import type { TransitMapProps } from '~/features/map/TransitMap.types';

import type { RefObject } from 'react';
import type { MapPadding } from '../useMapPadding';

export function useWebMapCamera(
  map: RefObject<GLMap | null>,
  ready: number,
  data: TransitMapProps['data'],
  padding: MapPadding,
) {
  const target = useMapStore((s) => s.cameraTarget);
  const follow = useMapStore((s) => s.vehicleCameraMode);
  const fitted = useRef<string | null>(null);
  const appliedTarget = useRef(target);
  useEffect(() => {
    if (!map.current || !target || appliedTarget.current === target) return;
    appliedTarget.current = target;
    if (target.kind === 'zoom') {
      map.current.easeTo({ zoom: target.zoom, duration: target.duration ?? 160 });
      return;
    }
    map.current.flyTo({
      center: target.center,
      zoom: target.zoom,
      bearing: follow === 'heading' ? map.current.getBearing() : 0,
      padding,
      duration: 700,
    });
  }, [map, target, ready, padding, follow]);
  useEffect(() => {
    if (!data.fitKey) fitted.current = null;
    if (
      !map.current ||
      !data.fitKey ||
      !data.fitBounds ||
      fitted.current === data.fitKey ||
      follow !== 'free'
    )
      return;
    fitted.current = data.fitKey;
    map.current.fitBounds(data.fitBounds, { padding, maxZoom: 15, duration: 700 });
  }, [map, ready, data.fitKey, data.fitBounds, follow, padding]);
  useEffect(() => {
    if (
      map.current &&
      follow !== 'free' &&
      data.position &&
      validCoordinates(data.position.lon, data.position.lat)
    )
      map.current.easeTo({
        center: [data.position.lon!, data.position.lat!],
        bearing:
          follow === 'heading'
            ? vehicleCameraBearing(map.current.getBearing(), data.position.heading)
            : 0,
        padding,
        duration: 800,
      });
  }, [map, ready, follow, data.position, padding]);
}
