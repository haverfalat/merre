import type { Departure } from '@/lib/stop-departures';
import { getRouteColor } from '@/lib/transit/colors';
import { cleanTransitLabel } from '@/lib/transit/labels';
import type { RouteSummary } from '@/lib/transit/types/route';

export function stopRouteOptions(departures: Departure[], routes: RouteSummary[] = []) {
  const options = new Map(
    departures.map((dep) => [
      dep.routeId,
      {
        id: dep.routeId,
        label: dep.routeLabel,
        headsign: dep.headsign,
        mode: dep.mode,
        color: dep.color,
        frontDoor: false,
      },
    ]),
  );
  for (const route of routes)
    if (!options.has(route.id))
      options.set(route.id, {
        id: route.id,
        label: route.shortName || '?',
        headsign: route.longName || '',
        mode: route.mode ?? undefined,
        color: getRouteColor(route.mode, route.color, route.textColor).primary,
        frontDoor: false,
      });
  for (const dep of departures)
    if (dep.frontDoor) {
      const option = options.get(dep.routeId);
      if (option) option.frontDoor = true;
    }
  return [...options.values()].sort((a, b) =>
    cleanTransitLabel(a.label).localeCompare(cleanTransitLabel(b.label), undefined, {
      numeric: true,
    }),
  );
}

/** A displayed service type can span many backend routes, particularly trains. */
export function stopRouteChipOptions(options: ReturnType<typeof stopRouteOptions>) {
  const groups = new Map<
    string,
    (typeof options)[number] & { routeIds: string[]; destinations: Set<string> }
  >();
  for (const option of options) {
    const label = cleanTransitLabel(option.label)
      .normalize('NFKC')
      .replace(/\s+/g, ' ')
      .trim()
      .toLocaleUpperCase();
    const key = !label || label === '?' ? option.id : `${option.mode ?? ''}|${label}`;
    const group = groups.get(key);
    if (group) {
      group.routeIds.push(option.id);
      group.frontDoor ||= option.frontDoor;
      if (option.headsign) group.destinations.add(option.headsign);
    } else
      groups.set(key, {
        ...option,
        routeIds: [option.id],
        destinations: new Set(option.headsign ? [option.headsign] : []),
      });
  }
  return [...groups.values()].map(({ destinations, ...group }) => ({
    ...group,
    headsign: [...destinations].join(' · '),
  }));
}

export function toggleStopRoute(
  selected: string[] | null,
  options: { id: string; routeIds?: string[] }[],
  id: string,
) {
  const next = new Set(selected ?? options.flatMap((route) => route.routeIds ?? [route.id]));
  const ids = options.find((option) => option.id === id)?.routeIds ?? [id];
  if (ids.every((routeId) => next.has(routeId))) ids.forEach((routeId) => next.delete(routeId));
  else ids.forEach((routeId) => next.add(routeId));
  return [...next];
}
