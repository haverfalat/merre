import { validCoordinates } from '@/lib/transit';
import { vehicleCameraBearing } from '@/lib/vehicle-camera';
import { useMapStore } from '@/store/useMapStore';
import type { Map as GLMap } from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import type { TransitMapProps } from '~/features/map/TransitMap.types';

import type { RefObject } from 'react';
import type { MapPadding } from '../useMapPadding';
import { cameraPadding } from '../model/camera-padding';

function canvasPadding(map: GLMap, padding: MapPadding) {
  const { clientWidth, clientHeight } = map.getContainer();
  return cameraPadding(padding, clientWidth, clientHeight);
}

export function useWebMapCamera(
  map: RefObject<GLMap | null>,
  ready: number,
  data: TransitMapProps['data'],
  padding: MapPadding,
) {
  const target = useMapStore((s) => s.cameraTarget);
  const follow = useMapStore((s) => s.vehicleCameraMode);
  const fitted = useRef<string | null>(null);
  const appliedTarget = useRef<typeof target>(null);
  useEffect(() => {
    if (!ready || !map.current) return;
    const safePadding = canvasPadding(map.current, padding);
    if (safePadding) map.current.setPadding(safePadding);
  }, [map, ready, padding]);
  useEffect(() => {
    if (!ready || !map.current || !target || appliedTarget.current === target) return;
    const safePadding = canvasPadding(map.current, padding);
    if (!safePadding) return;
    appliedTarget.current = target;
    if (target.kind === 'zoom') {
      map.current.easeTo({ zoom: target.zoom, duration: target.duration ?? 160 });
      return;
    }
    map.current.flyTo({
      center: target.center,
      zoom: target.zoom,
      bearing: follow === 'heading' ? map.current.getBearing() : 0,
      padding: safePadding,
      duration: 700,
    });
  }, [map, target, ready, padding, follow]);
  useEffect(() => {
    if (!data.fitKey) fitted.current = null;
    const instance = map.current;
    if (!ready || !instance || !data.fitKey || !data.fitBounds || follow !== 'free') return;
    const bounds = data.fitBounds;
    const fit = () => {
      const safePadding = canvasPadding(instance, padding);
      if (!safePadding) return;
      const canvas = instance.getContainer();
      const fitKey = `${ready}:${data.fitKey}:${canvas.clientWidth}:${canvas.clientHeight}:${JSON.stringify(safePadding)}`;
      if (fitted.current === fitKey) return;
      // MapLibre 6 otherwise adds the current camera padding a second time.
      instance.fitBounds(bounds, { padding: safePadding, absolutePadding: true, maxZoom: 15, duration: 700 });
      fitted.current = fitKey;
    };
    fit();
    instance.on('resize', fit);
    return () => { instance.off('resize', fit); };
  }, [map, ready, data.fitKey, data.fitBounds, follow, padding]);
  useEffect(() => {
    if (
      map.current &&
      ready > 0 &&
      follow !== 'free' &&
      data.position &&
      validCoordinates(data.position.lon, data.position.lat)
    ) {
      const safePadding = canvasPadding(map.current, padding);
      if (!safePadding) return;
      map.current.easeTo({
        center: [data.position.lon!, data.position.lat!],
        bearing:
          follow === 'heading'
            ? vehicleCameraBearing(map.current.getBearing(), data.position.heading)
            : 0,
        padding: safePadding,
        duration: 800,
      });
    }
  }, [map, ready, follow, data.position, padding]);
}
