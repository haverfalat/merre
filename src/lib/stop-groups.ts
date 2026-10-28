import type { GroupedChildStop } from './transit/types/stop';
import { cleanTransitPlaceName } from '@/lib/transit/labels';

function stopNameKey(value: string) {
  return cleanTransitPlaceName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function samePlaceStops(stops: GroupedChildStop[], name: string) {
  const key = stopNameKey(name);
  return stops.filter((stop) => key && stopNameKey(stop.name || '') === key);
}
