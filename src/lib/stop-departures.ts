import type { Stoptime } from './transit/types/stop';

export interface Departure extends Stoptime {
  routeLabel: string;
  routeKey: string;
  routeId: string;
  headsign: string;
  mode?: string;
  color: string;
  frontDoor: boolean;
}
