import type { createBkkFutar } from './futar';
import { canonicalId, stopRef } from './normalize';
import type { GroupedChildStop, StopRouteSummary } from '../../types/stop';

// Route variants list actual boarding stops; station parents and entrances are excluded.
export async function loadMetroStops(futar: ReturnType<typeof createBkkFutar>, date: string): Promise<GroupedChildStop[]> {
  const stops = new Map<string, GroupedChildStop>();
  // BKK advertises metro lines with the M prefix; IDs come from its search references.
  const found = await futar.search.search({ query: 'M', minResult: 100 });
  if (found.code !== 200 || found.data.limitExceeded) throw new Error('BKK metro route discovery unavailable');
  const routeIds = (found.data.entry.routeIds ?? []).filter(id => found.data.references.routes?.[id]?.type === 'SUBWAY');
  if (!routeIds.length) throw new Error('BKK metro routes unavailable');
  const detailsList = await Promise.all(
    routeIds.map(async (routeId) => {
      const { data, code } = await futar.routes.getDetails(routeId, { date });
      if (code !== 200 || !data?.entry?.variants?.length) throw new Error('BKK metro stops unavailable');
      return data;
    }),
  );
  for (const data of detailsList) {
    const route = data.entry;
    const summary: StopRouteSummary = {
      id: canonicalId(route.id), shortName: route.shortName ?? null, longName: route.longName ?? null,
      mode: 'SUBWAY', color: route.color, textColor: route.textColor, agency: null,
    };
    const ids = new Set(route.variants.flatMap(variant => variant.stopIds));
    if (!ids.size) throw new Error('BKK metro boarding stops unavailable');
    for (const id of ids) {
      const stop = data.references.stops?.[id];
      if (!stop || stop.locationType !== 0 || !Number.isFinite(stop.lat) || !Number.isFinite(stop.lon))
        throw new Error('BKK metro boarding stop missing');
      const key = canonicalId(id);
      const boardingDirections = route.variants.filter(variant => variant.stopIds.includes(id)).map(variant => ({
        routeId: summary.id, directionId: variant.direction != null && /^\d+$/.test(variant.direction) ? variant.direction : undefined,
        headsign: variant.headsign,
        origin: data.references.stops?.[variant.stopIds[0]]?.name ?? null,
        event: variant.stopIds.indexOf(id) < variant.stopIds.length - 1 ? 'departures' as const : 'arrivals' as const,
      }));
      const existing = stops.get(key);
      if (existing) { existing.routes!.push(summary); existing.boardingDirections!.push(...boardingDirections); }
      else stops.set(key, { ...stopRef(stop), locationType: 'STOP', positionSource: 'bkk-metro',
        bearing: String(stop.direction ?? '').trim() && Number.isFinite(Number(stop.direction)) ? Number(stop.direction) : null,
        routes: [summary], boardingDirections });
    }
  }
  return [...stops.values()];
}

/** Keep bus/rail records even if a national record also advertises a metro line. */
export function replaceMetroStops(national: GroupedChildStop[], direct: GroupedChildStop[]): GroupedChildStop[] {
  const physical = new Map(direct.map(stop => [stop.gtfsId || stop.id, { ...stop, routes: [...(stop.routes ?? [])] }]));
  return [...national.flatMap(stop => {
    const replacement = physical.get(stop.gtfsId || stop.id);
    if (replacement) {
      replacement.routes.push(...(stop.routes ?? []).filter(route => route.mode !== 'SUBWAY' &&
        !replacement.routes.some(existing => existing.id === route.id)));
      return [];
    }
    if (!stop.routes?.some(route => route.mode === 'SUBWAY')) return [stop];
    const routes = stop.routes.filter(route => route.mode !== 'SUBWAY');
    return routes.length ? [{ ...stop, routes }] : [];
  }), ...physical.values()];
}
