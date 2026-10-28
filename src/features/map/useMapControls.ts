import { usePlannerStore } from '~/store/usePlannerStore';
import { useTranslation } from '@/hooks/useTranslation';
import { validCoordinates } from '@/lib/transit';
import { useMapStore } from '@/store/useMapStore';
import { useUIStore } from '@/store/useUIStore';
import { useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { useOnline } from '~/hooks/useOnline';
import { useMapFeedback } from '~/store/useMapFeedback';
import { nextZoomIntent, type ZoomIntent } from './camera-commands';
import type { MapData } from './useMapData';

export function useMapControls(data: MapData) {
  const { t } = useTranslation();
  const client = useQueryClient();
  const focused = useUIStore((s) => s.searchFocused);
  const currentZoom = useMapStore((s) => s.zoom);
  const modes = useMapStore((s) => s.selectedModes);
  const online = useOnline();
  const planning = usePlannerStore((state) => state.open);
  const status = !online
    ? t('offline')
    : !planning && !modes.length
      ? t('all_modes_hidden')
      : !planning && data.vehicles.isError
        ? t(data.vehicles.data ? 'stale_data' : 'data_error')
        : null;
  const zoomIntent = useRef<ZoomIntent | null>(null);
  const zoom = (amount: number) => {
    const store = useMapStore.getState();
    const intent = nextZoomIntent(zoomIntent.current, store.zoom, amount, Date.now());
    zoomIntent.current = intent;
    useMapStore.setState({
      cameraTarget: {
        center:
          store.vehicleCameraMode !== 'free' &&
          data.position &&
          validCoordinates(data.position.lon, data.position.lat)
            ? [data.position.lon!, data.position.lat!]
            : store.center,
        zoom: intent.zoom,
        kind: 'zoom',
        duration: 160,
      },
    });
  };
  const refresh = () => {
    for (const key of [
      'journey-plan',
      'vehicles-in-bounds',
      'stops-in-bounds',
      'trip-detail',
      'stop-detail',
      'stop-routes',
      'stop-connections',
      'route-detail',
      'route-timetable',
    ])
      void client.invalidateQueries({ queryKey: [key] });
    useMapFeedback.getState().retryTiles();
  };
  return { focused, currentZoom, online, status, zoom, refresh };
}
