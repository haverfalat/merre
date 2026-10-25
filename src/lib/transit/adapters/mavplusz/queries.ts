import type { BoardingStop, Mode } from '../../../mavplusz/types/common';

export interface MavStopConnections extends BoardingStop {
  routes: {
    id: string;
    shortName?: string | null;
    mode?: Mode | null;
    color?: string | null;
    textColor?: string | null;
    patterns?:
      | {
          id: string | null;
          stops?:
            | (BoardingStop & { name?: string | null; lat?: number | null; lon?: number | null })[]
            | null;
          patternGeometry?: { points?: string | null } | null;
        }[]
      | null;
  }[];
}

export const STOP_CONNECTIONS_QUERY = `
query StopConnections($id: String!) {
  stop(id: $id) {
    id: gtfsId
    parentStation { id: gtfsId }
    routes {
      id: gtfsId shortName mode color textColor
      patterns {
        id
        stops { id: gtfsId name lat lon parentStation { id: gtfsId } }
        patternGeometry { points }
      }
    }
  }
}`;
