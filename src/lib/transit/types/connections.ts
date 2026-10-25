import type { BoardingStop } from '../../boarding-stops';

import type { Mode } from './common';

export type ConnectionPoint = [number, number];

export type ConnectionStop = BoardingStop & {
  name?: string | null;
  lon?: number | null;
  lat?: number | null;
};

export interface ConnectionPattern {
  id: string | null;
  stops?: ConnectionStop[] | null;
  coordinates?: ConnectionPoint[];
}

export interface StopConnectionsResponse extends BoardingStop {
  boardingStops?: BoardingStop[];
  routes: {
    id: string;
    shortName?: string | null;
    mode?: Mode | null;
    color?: string | null;
    textColor?: string | null;
    patterns?: ConnectionPattern[] | null;
  }[];
}
