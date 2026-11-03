import { isRailMode } from '@/lib/transit/modes';
import type { StopDetail, StopRoutesResponse } from '@/lib/transit/types/stop';
import { hasRailBoard, stopBoardRows } from '~/features/stops/model/station-board-model';
import { stopRouteOptions } from '~/features/stops/model/stop-route-filters';

export function stopPreviewContent(
  stop: StopDetail | null | undefined,
  stopRoutes: StopRoutesResponse | null | undefined,
  unknownOrigin = '',
) {
  const rail = hasRailBoard(stop) || !!stopRoutes?.routes.some((route) => isRailMode(route.mode));
  const departures = stopBoardRows(stop, rail ? 'departures' : 'combined', unknownOrigin);
  const options = stopRouteOptions(departures, stopRoutes?.routes);
  const destinations = new Map<
    string,
    {
      id: string;
      label: string;
      mode?: string | null;
      color?: string | null;
      headsign: string;
      frontDoor: boolean;
    }
  >();
  for (const departure of departures) {
    const key = `${departure.routeId}|${departure.headsign}`;
    const previous = destinations.get(key);
    destinations.set(key, {
      id: key,
      label: departure.routeLabel,
      mode: departure.mode,
      color: departure.color,
      headsign: departure.headsign,
      frontDoor: !!departure.frontDoor || !!previous?.frontDoor,
    });
  }
  const served = new Set(departures.map((departure) => departure.routeId));
  for (const option of options) if (!served.has(option.id)) destinations.set(option.id, option);
  const routes = [...destinations.values()];
  return { routes, rail };
}
