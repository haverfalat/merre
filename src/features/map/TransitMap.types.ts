import type { LocationState } from '~/hooks/useLocation';
import type { MapData } from './useMapData';
export interface TransitMapProps {
  data: MapData;
  location: LocationState;
  bottomInset: number;
  leftInset: number;
  topInset?: number;
  rightInset?: number;
}
