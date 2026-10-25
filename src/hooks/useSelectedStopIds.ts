import { useMemo } from 'react';
import { useMapStore } from '@/store/useMapStore';

export function useSelectedStopIds(stopId: string | null) {
  const selected = useMapStore((s) => s.selectedStopId);
  const group = useMapStore((s) => s.selectedStopIds);
  return useMemo(
    () => (stopId ? (selected === stopId && group.length ? group : [stopId]) : []),
    [stopId, selected, group],
  );
}
