import type { Stoptime } from './transit/types/stop';
import type { StopTimeDirection } from './transit/stop-times';

export interface Departure extends Stoptime {
  boardDirection?: StopTimeDirection;
  routeLabel: string;
  routeKey: string;
  routeId: string;
  headsign: string;
  mode?: string;
  color: string;
  frontDoor: boolean;
}
