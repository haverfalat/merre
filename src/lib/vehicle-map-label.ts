import type { VehicleTrip } from './transit/types/vehicle';
import { cleanTransitLabel } from '@/lib/transit/labels';
import { isRailMode } from '@/lib/transit/modes';
import { transitLabelParts } from './transit-label';

export function vehicleMapLabel(trip: VehicleTrip | null) {
  const mode = trip?.route?.mode;
  const routeName = trip?.route?.shortName || trip?.routeShortName;
  const routeParts = transitLabelParts(routeName || '');
  const routeSymbols = routeParts
    .filter((part) => part.mnr)
    .map((part) => part.text)
    .join('')
    .trim();
  // Rail services and HÉV advertise their line/category symbol on the map;
  // operating numbers and train names remain in the vehicle details.
  if (isRailMode(mode) && routeSymbols) return { label: routeSymbols, mnr: true };
  const raw =
    isRailMode(mode) && mode !== 'SUBURBAN_RAILWAY'
      ? trip?.tripShortName || routeName
      : routeName || trip?.tripShortName;
  const parts = transitLabelParts(raw || '');
  const symbols = parts
    .filter((part) => part.mnr)
    .map((part) => part.text)
    .join('')
    .trim();
  const mnr =
    !!symbols &&
    (mode === 'SUBURBAN_RAILWAY' || parts.every((part) => part.mnr || !part.text.trim()));
  return { label: mnr ? symbols : cleanTransitLabel(raw), mnr };
}
