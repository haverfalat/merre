import { validCoordinates } from '@/lib/transit';
import { vehicleCameraBearing } from '@/lib/vehicle-camera';
import { useMapStore } from '@/store/useMapStore';
import { type CameraRef } from '@maplibre/maplibre-react-native';
import { useEffect, useRef } from 'react';
import type { TransitMapProps } from '~/features/map/TransitMap.types';

import type { MapPadding } from '../useMapPadding';

export function useMapLibreCamera(
  data: TransitMapProps['data'],
  ready: boolean,
  padding: MapPadding,
) {
  const camera = useRef<CameraRef>(null);
  const fitted = useRef<string | null>(null);
  const bearing = useRef(0);
  const target = useMapStore((s) => s.cameraTarget);
  const follow = useMapStore((s) => s.vehicleCameraMode);
  const appliedTarget = useRef(target);
  useEffect(() => {
    if (ready && target && appliedTarget.current !== target) {
      appliedTarget.current = target;
      if (target.kind === 'zoom') {
        camera.current?.zoomTo(target.zoom, { duration: target.duration ?? 160 });
        return;
      }
      camera.current?.flyTo({
        center: target.center,
        zoom: target.zoom,
        bearing: follow === 'heading' ? bearing.current : 0,
        duration: 700,
      });
    }
  }, [target, ready, follow]);
  const fitRequest =
    data.fitKey && data.fitBounds ? JSON.stringify([data.fitKey, data.fitBounds, padding]) : null;
  useEffect(() => {
    if (!data.fitKey) fitted.current = null;
    if (
      !ready ||
      !data.fitKey ||
      !data.fitBounds ||
      fitted.current === fitRequest ||
      follow !== 'free'
    )
      return;
    fitted.current = fitRequest;
    camera.current?.fitBounds(data.fitBounds, { padding, duration: 700 });
  }, [ready, data.fitKey, data.fitBounds, follow, padding, fitRequest]);
  useEffect(() => {
    if (
      ready &&
      follow !== 'free' &&
      data.position &&
      validCoordinates(data.position.lon, data.position.lat)
    ) {
      bearing.current =
        follow === 'heading' ? vehicleCameraBearing(bearing.current, data.position.heading) : 0;
      camera.current?.easeTo({
        center: [data.position.lon!, data.position.lat!],
        bearing: bearing.current,
        duration: 800,
        padding,
      });
    }
  }, [ready, follow, data.position, padding]);
  return {
    camera,
    updateBearing: (value: number) => {
      bearing.current = value;
    },
  };
}
