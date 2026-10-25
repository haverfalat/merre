import { useMapStore } from '@/store/useMapStore';
import type { LocationObject } from 'expo-location';
import { useEffect, useRef, useState } from 'react';

export function useInitialLocationCenter(position: LocationObject | null) {
  const [initialMap] = useState(useMapStore.getState);
  const pending = useRef(true);

  useEffect(() => {
    if (!pending.current || !position || Date.now() - position.timestamp > 30_000) return;
    pending.current = false;
    const map = useMapStore.getState();
    if (
      initialMap.cameraTarget ||
      map.cameraTarget ||
      map.selectedStopId ||
      map.selectedVehicle ||
      map.selectedRouteId ||
      Math.abs(map.center[0] - initialMap.center[0]) > 0.0001 ||
      Math.abs(map.center[1] - initialMap.center[1]) > 0.0001 ||
      Math.abs(map.zoom - initialMap.zoom) > 0.01
    )
      return;
    map.flyTo([position.coords.longitude, position.coords.latitude], 15);
  }, [position, initialMap]);
}
