import type { GroupedChildStop } from '@/lib/transit/types/stop';

export function focusedMapStops(
  bounds: GroupedChildStop[] | undefined,
  detail:
    | (GroupedChildStop & {
        groupedStops?: GroupedChildStop[];
      })
    | null
    | undefined,
  stopId: string | null,
  journeySelected: boolean,
  zoom: number,
): GroupedChildStop[] {
  if (journeySelected) return [];
  if (!stopId) return zoom >= 12 ? (bounds ?? []) : [];
  if (detail?.groupedStops) return detail.groupedStops;
  const stop = detail ?? bounds?.find((item) => (item.gtfsId || item.id) === stopId);
  return stop ? [stop] : [];
}
