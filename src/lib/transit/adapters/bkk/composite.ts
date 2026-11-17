import { replaceMetroStops } from './metro-stops';
import { stopsWithinBounds } from '../../geometry/bounds';
import { cleanTransitPlaceName } from '../../labels';
import { referenceRoutePatterns } from '../../route-pattern';
import type { TransitClient, TransitRequest } from '../../client';
import type { StopDetail, Stoptime } from '../../types/stop';
import type { VehiclePosition } from '../../types/vehicle';
import { bkkEnabled, createBkkBackend } from './client';
import { canonicalId, isBkkId } from './normalize';
import { uniqueVehiclePositions } from '../../../vehicle-position';
import { stopTimeKey } from '../../stop-times';

const liveTime = (time: { realtime?: boolean | null; realtimeState?: string | null }) =>
  !!time.realtime || ['UPDATED', 'CANCELED', 'SKIPPED'].includes(time.realtimeState ?? '');
const positioned = (v: { lat: number | null; lon: number | null }) =>
  v.lat != null && v.lon != null && Number.isFinite(v.lat) && Number.isFinite(v.lon);

/** MÁV owns overlapping records; direct predictions only fill missing realtime. */
export function mergeBkkBoard(national: StopDetail | null, local: StopDetail): StopDetail {
  if (!national) return local;
  const key = (time: Stoptime) => stopTimeKey({ ...time, stop: time.stop ?? national });
  const direct = new Map((local.stopTimes ?? []).flatMap((g) => g.times.map((t) => [key(t), t] as const)));
  const seen = new Set<string>();
  const groups = (national.stopTimes ?? []).map((g) => ({ ...g, times: g.times.map((t) => {
    seen.add(key(t));
    const backup = direct.get(key(t));
    return !liveTime(t) && backup && liveTime(backup) ? { ...backup, ...t,
      realtime: backup.realtime, realtimeState: backup.realtimeState,
      realtimeArrival: backup.realtimeArrival, realtimeDeparture: backup.realtimeDeparture,
      arrivalDelay: backup.arrivalDelay, departureDelay: backup.departureDelay,
    } : t;
  }) }));
  return { ...local, ...national, stopTimes: [...groups,
    ...(local.stopTimes ?? []).map((g) => ({ ...g, times: g.times.filter((t) => !seen.has(key(t))) })).filter((g) => g.times.length),
  ] };
}

/** Keep timetable precedence independent of position freshness. */
export function withBkk(mav: TransitClient, { signal }: TransitRequest): TransitClient {
  if (!bkkEnabled()) return mav;
  const bkk = createBkkBackend();
  async function attempt<T>(request: () => Promise<T>) {
    signal.throwIfAborted();
    try { const value = await request(); signal.throwIfAborted(); return { value }; }
    catch (error) { signal.throwIfAborted(); return { error }; }
  }
  return {
    ...mav, backendId: 'mavplusz+bkk',
    stopsInBounds: async bounds => {
      const budapest = bounds.neLat >= 47.32 && bounds.swLat <= 47.66 &&
        bounds.neLon >= 18.90 && bounds.swLon <= 19.35;
      if (!budapest) return mav.stopsInBounds(bounds);
      const [national, metro] = await Promise.all([
        attempt(() => mav.stopsInBounds(bounds)), attempt(() => bkk.metroStops()),
      ]);
      if (!metro.value) { if (national.error) throw national.error; return national.value ?? []; }
      return stopsWithinBounds(replaceMetroStops(national.value ?? [], metro.value), bounds);
    },
    vehiclesInBounds: async (bounds, modes) => {
      // Large BKK REST viewports can return an empty success. Keep national coverage
      // there; use direct fixes only for a bounded, detailed Budapest viewport.
      const direct = bounds.neLat - bounds.swLat <= 0.08 && bounds.neLon - bounds.swLon <= 0.08 &&
        bounds.neLat >= 47.32 && bounds.swLat <= 47.66 && bounds.neLon >= 18.90 && bounds.swLon <= 19.35 &&
        modes.some((mode) => ['BUS', 'TRAM', 'TROLLEYBUS', 'SUBWAY', 'SUBURBAN_RAILWAY', 'FERRY'].includes(mode));
      const [national, local] = await Promise.all([
        attempt(() => mav.vehiclesInBounds(bounds, modes)),
        direct ? attempt(() => bkk.vehiclesInBounds(bounds)) : Promise.resolve({ value: [] as VehiclePosition[] }),
      ]);
      const valid = (v: VehiclePosition) => positioned(v) && !!v.trip?.route?.mode && modes.includes(v.trip.route.mode) &&
        v.lat! >= bounds.swLat && v.lat! <= bounds.neLat && v.lon! >= bounds.swLon && v.lon! <= bounds.neLon;
      const primary = (national.value ?? []).filter(valid);
      const supportsBkk = modes.some((mode) => ['BUS', 'TRAM', 'TROLLEYBUS', 'SUBWAY', 'SUBURBAN_RAILWAY', 'FERRY'].includes(mode));
      if (!supportsBkk) { if (national.error) throw national.error; return primary; }
      if (national.error && !local.value?.some(valid)) throw national.error;
      return uniqueVehiclePositions([...primary, ...(local.value ?? []).filter(valid)]);
    },
    vehiclePositionsForTrip: async (id, day) => {
      if (!isBkkId(id)) return mav.vehiclePositionsForTrip(id, day);
      const [national, local] = await Promise.all([
        attempt(() => mav.vehiclePositionsForTrip(id, day)),
        attempt(() => bkk.vehiclePositionsForTrip(id, day)),
      ]);
      if (national.error && local.error) throw national.error;
      return uniqueVehiclePositions([...(national.value ?? []), ...(local.value ?? [])]);
    },
    tripContinuation: async (id, day) => {
      if (!isBkkId(id)) return mav.tripContinuation?.(id, day) ?? null;
      const result = await attempt(() => bkk.tripContinuation(id, day));
      if (result.error) throw result.error;
      return result.value ?? null;
    },
    trip: async (id, day) => {
      if (!isBkkId(id)) return mav.trip(id, day);
      const national = await attempt(() => mav.trip(id, day));
      const primary = national.value;
      if (primary?.vehiclePositions?.some(positioned)) return primary;
      const local = await attempt(() => bkk.trip(id, day));
      if (!local.value) { if (national.error) throw national.error; return primary ?? null; }
      if (!primary) return local.value;
      return { ...local.value, ...primary,
        vehiclePositions: local.value.vehiclePositions,
        stoptimes: primary.stoptimes?.some(liveTime) ? primary.stoptimes : local.value.stoptimes ?? primary.stoptimes,
        decodedPolyline: primary.decodedPolyline.length ? primary.decodedPolyline : local.value.decodedPolyline,
      };
    },
    stop: async (id, options) => {
      if (!isBkkId(id)) return mav.stop(id, options);
      const catalog = await attempt(() => bkk.metroStops());
      const metro = catalog.value?.find(stop => (stop.gtfsId || stop.id) === canonicalId(id)) ?? bkk.knownMetroStop(id);
      if (metro) {
        // Never merge a physical metro platform back into a national station-wide board.
        const detail = await attempt(() => bkk.stop(id, options));
        if (detail.error) throw detail.error;
        if (!detail.value) throw new Error('BKK metro boarding stop unavailable');
        return { ...detail.value, ...metro, stopTimes: detail.value.stopTimes ?? [] };
      }
      if (options?.timetable) return mav.stop(id, options);
      const national = await attempt(() => mav.stop(id, options));
      if (national.value?.stopTimes?.some((g) => g.times.some(liveTime))) return national.value;
      const local = await attempt(() => bkk.stop(id, options));
      if (local.value) return mergeBkkBoard(national.value ?? null, local.value);
      if (national.error) throw national.error;
      return national.value ?? null;
    },
    routeTerminals: async id => {
      if (isBkkId(id)) {
        const result = await attempt(() => bkk.routeReferences(id));
        const first = result.value?.[0];
        if (first) {
          const labels = [...new Set([cleanTransitPlaceName(first.stops?.[0]?.name),
            cleanTransitPlaceName(first.headsign || first.stops?.at(-1)?.name)].filter(Boolean))];
          if (labels.length > 1) return labels.join(' ↔ ');
        }
      }
      return mav.routeTerminals(id);
    },
    route: async (id, options) => {
      let route = await mav.route(id, options);
      signal.throwIfAborted();
      if (route && isBkkId(id)) {
        const reference = await attempt(() => bkk.routeReferences(id, options?.serviceDay));
        if (reference.value?.length) {
          route = { ...route, patterns: referenceRoutePatterns(reference.value, route.patterns ?? []) };
        }
      }
      if (!route || !isBkkId(id) || route.patterns?.some((p) => p.vehiclePositions?.some(positioned))) return route;
      const local = await attempt(() => bkk.vehiclesForRoute(id));
      if (!local.value?.length) return route;
      const patterns = (route.patterns ?? []).map((p) => ({ ...p, vehiclePositions: [...(p.vehiclePositions ?? [])] }));
      for (const v of local.value.filter(positioned)) {
        const pattern = patterns.find((p) => p.headsign === v.trip?.tripHeadsign) ?? patterns[0];
        if (pattern) pattern.vehiclePositions.push(v);
      }
      return { ...route, patterns };
    },
    stopRoutes: async (id) => {
      if (isBkkId(id)) {
        const catalog = await attempt(() => bkk.metroStops());
        const metro = catalog.value?.find(stop => (stop.gtfsId || stop.id) === canonicalId(id)) ?? bkk.knownMetroStop(id);
        if (metro) return { ...metro, id, boardingStops: [{ id }],
          routes: (metro.routes ?? []).map(route => ({ ...route, patterns: [] })) };
      }
      const stop = await mav.stopRoutes(id);
      signal.throwIfAborted();
      if (!stop || !isBkkId(id) || stop.routes.some((r) => r.patterns?.some((p) => p.vehiclePositions?.some(positioned)))) return stop;
      const local = await attempt(() => bkk.vehiclesForStop(id));
      if (!local.value?.length) return stop;
      return { ...stop, routes: stop.routes.map((route) => ({ ...route,
        patterns: [...(route.patterns ?? []), { id: null, stops: stop.boardingStops ?? [stop],
          vehiclePositions: local.value!.filter((v) => positioned(v) && v.trip?.route?.id === route.id) }],
      })) };
    },
  };
}
