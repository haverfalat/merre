import type { GroupedChildStop } from '@/lib/transit/types/stop';

export function focusedMapStops(
  bounds: GroupedChildStop[] | undefined,
  detail: GroupedChildStop | null | undefined,
  stopId: string | null,
  journeySelected: boolean,
  zoom: number,
): GroupedChildStop[] {
  if (journeySelected) return [];
  if (!stopId) return zoom >= 12 ? (bounds ?? []) : [];
  const mapped = bounds?.find((item) => (item.gtfsId || item.id) === stopId);
  // National stop detail can be station-grouped; keep the selected BKK boarding point stable.
  const stop = mapped?.positionSource === 'bkk-metro' ? mapped : detail ?? mapped;
  return stop ? [stop] : [];
}
